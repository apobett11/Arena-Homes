import { eq, and } from 'drizzle-orm';
import { db } from '../../infrastructure/orm/drizzle';
import { withTransaction } from '../../infrastructure/orm/transaction';
import { tenantApplications } from './schema';
import { users } from '../users/schema';
import { tenants } from '../tenant/schema';
import { tenantProfiles } from '../users/schema';
import { PasswordService } from '../auth/password.service';
import { AuditService } from '../audit/service';
import { AuditContext } from '../audit/types';

export class ApplicationService {
    /**
     * Submit a new tenant application
     */
    public static async submitApplication(data: {
        propertyId: string;
        caretakerId: string;
        fullName: string;
        email: string;
        phoneNumber: string;
        whatsappNumber?: string;
        universityRegNo?: string;
        preferredMoveInDate?: Date;
        message?: string;
    }) {
        // Check if already applied
        const existing = await db().select()
            .from(tenantApplications)
            .where(
                and(
                    eq(tenantApplications.email, data.email),
                    eq(tenantApplications.propertyId, data.propertyId),
                    eq(tenantApplications.status, 'PENDING')
                )
            )
            .limit(1);

        if (existing.length > 0) {
            throw new Error('You have already applied for this property. Please wait for the caretaker\'s response.');
        }

        const [application] = await db()
            .insert(tenantApplications)
            .values({
                propertyId: data.propertyId,
                caretakerId: data.caretakerId,
                fullName: data.fullName,
                email: data.email,
                phoneNumber: data.phoneNumber,
                whatsappNumber: data.whatsappNumber,
                universityRegNo: data.universityRegNo,
                preferredMoveInDate: data.preferredMoveInDate,
                message: data.message,
            })
            .returning();

        return application;
    }

    /**
     * Get applications for a caretaker
     */
    public static async getCaretakerApplications(caretakerId: string, status?: string) {
        let whereClause: any = eq(tenantApplications.caretakerId, caretakerId);
        
        if (status) {
            whereClause = and(whereClause, eq(tenantApplications.status, status as any));
        }

        const applications = await db()
            .select()
            .from(tenantApplications)
            .where(whereClause)
            .orderBy(tenantApplications.createdAt);

        return applications;
    }

    /**
     * Get application by ID
     */
    public static async getApplicationById(applicationId: string) {
        const [application] = await db()
            .select()
            .from(tenantApplications)
            .where(eq(tenantApplications.id, applicationId))
            .limit(1);

        return application;
    }

    /**
     * Approve an application - creates user, tenant, and profile
     */
    public static async approveApplication(
        applicationId: string,
        caretakerNotes: string,
        context: AuditContext
    ) {
        return await withTransaction(async (tx) => {
            // Get the application
            const [application] = await tx
                .select()
                .from(tenantApplications)
                .where(eq(tenantApplications.id, applicationId))
                .limit(1);

            if (!application) {
                throw new Error('Application not found');
            }

            if (application.status !== 'PENDING') {
                throw new Error('Application has already been processed');
            }

            // Generate temporary password
            const tempPassword = this.generateTempPassword();
            const passwordHash = await PasswordService.hash(tempPassword);

            // Create user account
            const [user] = await tx
                .insert(users)
                .values({
                    email: application.email,
                    passwordHash,
                    roleId: 'TENANT',
                    isActive: true,
                })
                .returning({ id: users.id });

            // Create tenant record
            await tx.insert(tenants).values({
                userId: user.id,
                status: 'PROSPECT',
            });

            // Create tenant profile with application data
            await tx.insert(tenantProfiles).values({
                userId: user.id,
                fullName: application.fullName,
                phoneNumber: application.phoneNumber,
                universityRegNo: application.universityRegNo,
            });

            // Update application
            await tx
                .update(tenantApplications)
                .set({
                    status: 'APPROVED',
                    caretakerNotes,
                    respondedAt: new Date(),
                    userId: user.id,
                    tempPassword: tempPassword, // Store temporarily for first login
                })
                .where(eq(tenantApplications.id, applicationId));

            // Audit log
            await AuditService.log(
                context,
                'APPLICATION',
                applicationId,
                {
                    action: 'APPLICATION_APPROVED',
                    userId: user.id,
                    email: application.email,
                },
                tx
            );

            return {
                applicationId,
                userId: user.id,
                email: application.email,
                tempPassword,
            };
        });
    }

    /**
     * Reject an application
     */
    public static async rejectApplication(
        applicationId: string,
        caretakerNotes: string,
        context: AuditContext
    ) {
        const [application] = await db()
            .update(tenantApplications)
            .set({
                status: 'REJECTED',
                caretakerNotes,
                respondedAt: new Date(),
            })
            .where(eq(tenantApplications.id, applicationId))
            .returning();

        if (!application) {
            throw new Error('Application not found');
        }

        await AuditService.log(
            context,
            'APPLICATION',
            applicationId,
            {
                action: 'APPLICATION_REJECTED',
                reason: caretakerNotes,
            }
        );

        return application;
    }

    /**
     * Get application by email (for login check)
     */
    public static async getApplicationByEmail(email: string) {
        const [application] = await db()
            .select()
            .from(tenantApplications)
            .where(
                and(
                    eq(tenantApplications.email, email),
                    eq(tenantApplications.status, 'APPROVED')
                )
            )
            .limit(1);

        return application;
    }

    public static async getApplicationByUserId(userId: string) {
        const [application] = await db()
            .select()
            .from(tenantApplications)
            .where(eq(tenantApplications.userId, userId))
            .limit(1);

        return application;
    }

    /**
     * Mark onboarding steps as complete
     */
    public static async completeOnboardingStep(
        applicationId: string,
        step: 'password' | 'profile' | 'agreement'
    ) {
        const updates: any = {};
        
        switch (step) {
            case 'password':
                updates.hasSetPassword = true;
                updates.tempPassword = null;
                break;
            case 'profile':
                updates.hasCompletedProfile = true;
                break;
            case 'agreement':
                updates.hasAcceptedAgreement = true;
                break;
        }

        await db()
            .update(tenantApplications)
            .set(updates)
            .where(eq(tenantApplications.id, applicationId));
    }

    /**
     * Check if user can access dashboard
     */
    public static async canAccessDashboard(userId: string) {
        const [application] = await db()
            .select({
                hasSetPassword: tenantApplications.hasSetPassword,
                hasCompletedProfile: tenantApplications.hasCompletedProfile,
                hasAcceptedAgreement: tenantApplications.hasAcceptedAgreement,
            })
            .from(tenantApplications)
            .where(eq(tenantApplications.userId, userId))
            .limit(1);

        if (!application) return { canAccess: false, reason: 'NO_APPLICATION' };

        const canAccess = application.hasSetPassword && 
                         application.hasCompletedProfile && 
                         application.hasAcceptedAgreement;

        return {
            canAccess,
            onboardingStatus: application,
        };
    }

    private static generateTempPassword(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
        let password = '';
        for (let i = 0; i < 10; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }
}
