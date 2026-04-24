import { Database } from '../../infrastructure/database/connection';
import { db } from '../../infrastructure/orm/drizzle';
import { eq } from 'drizzle-orm';
import { users, employeeProfiles, tenantProfiles } from '../../modules/users/schema';
import { roles } from '../../modules/roles/schema';
import { properties } from '../../modules/property/schema';
import { units } from '../../modules/unit/schema';
import { tenants } from '../../modules/tenant/schema';
import { leases } from '../../modules/lease/schema';
import { payments } from '../../modules/payment/schema';
import { issues } from '../../modules/issue/schema';
import { maintenanceRequests } from '../../modules/maintenance/schema';
import { announcements } from '../../modules/announcement/schema';
import { notifications } from '../../modules/notification/schema';
import { financialSnapshots } from '../../modules/financial_snapshot/schema';
import { tenantApplications } from '../../modules/application/schema';
import { LeaseService } from '../../modules/lease/service';
import { PaymentService } from '../../modules/payment/service';
import { TenantRepository } from '../../modules/tenant/repository';
import { UserRepository } from '../../modules/users/repository';
import {
    createSeedAuditContext,
    hashPassword,
    generateUnitCode,
    generateMpesaReference,
    formatDate,
    seedLog,
    SYSTEM_ACTOR_EMAIL,
    SYSTEM_ACTOR_ID,
} from './utils';

/**
 * MINIMAL SEED
 * Fast smoke test dataset for development
 * 
 * Creates:
 * - 6 users (admin, caretaker, accountant, IT, 2 tenants)
 * - 1 property (Arena Njokerio A)
 * - 8 units (mixed types)
 * - 2 active leases, 1 pending lease
 * - 2 successful payments, 1 failed payment
 * - 2 issues
 * - 1 maintenance request
 * - 3 announcements
 * - 5 notifications
 * - 1 financial snapshot
 */

export async function seedMinimal() {
    seedLog.section('MINIMAL SEED - Starting');

    const database = db();
    const ctx = createSeedAuditContext('SEED_MINIMAL');

    try {
        // ===== STEP 1: Ensure Roles Exist =====
        seedLog.section('Step 1: Roles');
        const roleData = [
            { id: 'SUPER_ADMIN', name: 'Administrator', description: 'System administrator' },
            { id: 'CARETAKER', name: 'Caretaker', description: 'Property caretaker' },
            { id: 'ACCOUNTANT', name: 'Accountant', description: 'Financial accountant' },
            { id: 'IT_SUPPORT', name: 'IT Support', description: 'Technical support' },
            { id: 'TENANT', name: 'Tenant', description: 'Property tenant' },
        ];

        for (const role of roleData) {
            const existing = await database.select().from(roles).where(eq(roles.id, role.id)).limit(1);
            if (existing.length === 0) {
                await database.insert(roles).values(role);
                seedLog.info(`Created role: ${role.id}`);
            } else {
                seedLog.warn(`Role already exists: ${role.id}`);
            }
        }

        // ===== STEP 2: Create SYSTEM User (if not exists) =====
        seedLog.section('Step 2: SYSTEM User');
        let systemUser = await database.select().from(users).where(eq(users.email, SYSTEM_ACTOR_EMAIL)).limit(1);

        if (systemUser.length === 0) {
            const systemPasswordHash = await hashPassword('System#1234');
            const [newSystemUser] = await database.insert(users).values({
                id: SYSTEM_ACTOR_ID,
                email: SYSTEM_ACTOR_EMAIL,
                passwordHash: systemPasswordHash,
                roleId: 'SUPER_ADMIN',
                isActive: true,
            }).returning();

            await database.insert(employeeProfiles).values({
                userId: newSystemUser.id,
                fullName: 'System Actor',
                username: 'system',
                phoneNumber: '0000000000',
                avatarUrl: '/avatars/system.png',
            });

            seedLog.info('Created SYSTEM user');
        } else {
            seedLog.warn('SYSTEM user already exists');
        }

        // ===== STEP 3: Create Test Users =====
        seedLog.section('Step 3: Test Users');
        const testUsers = [
            {
                email: 'admin@arenahomes.test',
                password: 'Admin#1234',
                roleId: 'SUPER_ADMIN',
                profile: {
                    fullName: 'Admin User',
                    username: 'admin',
                    phoneNumber: '0700000001',
                    avatarUrl: '/avatars/admin.png',
                    jobTitle: 'System Administrator',
                },
            },
            {
                email: 'caretaker1@arenahomes.test',
                password: 'Care#1234',
                roleId: 'CARETAKER',
                profile: {
                    fullName: 'John Caretaker',
                    username: 'caretaker1',
                    phoneNumber: '0700000002',
                    avatarUrl: '/avatars/caretaker.png',
                    jobTitle: 'Property Caretaker',
                },
            },
            {
                email: 'accountant@arenahomes.test',
                password: 'Acc#1234',
                roleId: 'ACCOUNTANT',
                profile: {
                    fullName: 'Jane Accountant',
                    username: 'accountant',
                    phoneNumber: '0700000003',
                    avatarUrl: '/avatars/accountant.png',
                    jobTitle: 'Senior Accountant',
                },
            },
            {
                email: 'it@arenahomes.test',
                password: 'IT#1234',
                roleId: 'IT_SUPPORT',
                profile: {
                    fullName: 'Tech Support',
                    username: 'itsupport',
                    phoneNumber: '0700000004',
                    avatarUrl: '/avatars/it.png',
                    jobTitle: 'IT Support Specialist',
                },
            },
            {
                email: 'tenant1@arenahomes.test',
                password: 'Ten#1234',
                roleId: 'TENANT',
                profile: {
                    fullName: 'Alice Tenant',
                    username: 'tenant1',
                    phoneNumber: '0700000005',
                    avatarUrl: '/avatars/tenant1.png',
                    universityRegNo: 'EG/2021/001',
                },
            },
            {
                email: 'tenant2@arenahomes.test',
                password: 'Ten#1234',
                roleId: 'TENANT',
                profile: {
                    fullName: 'Bob Tenant',
                    username: 'tenant2',
                    phoneNumber: '0700000006',
                    avatarUrl: '/avatars/tenant2.png',
                    universityRegNo: 'EG/2021/002',
                },
            },
        ];

        const userIds: Record<string, string> = {};

        for (const userData of testUsers) {
            const existing = await database.select().from(users).where(eq(users.email, userData.email)).limit(1);

            if (existing.length === 0) {
                const passwordHash = await hashPassword(userData.password);
                const userId = await UserRepository.create(
                    {
                        email: userData.email,
                        passwordHash,
                        roleId: userData.roleId,
                        profile: userData.profile,
                    },
                    ctx
                );
                userIds[userData.email] = userId;
                seedLog.info(`Created user: ${userData.email}`);
            } else {
                userIds[userData.email] = existing[0].id;
                seedLog.warn(`User already exists: ${userData.email}`);
            }
        }

        // ===== STEP 4: Create Property =====
        seedLog.section('Step 4: Property');
        const propertyName = 'Arena Njokerio A';
        let propertyId: string;

        const existingProperty = await database.select().from(properties).where(eq(properties.name, propertyName)).limit(1);

        if (existingProperty.length === 0) {
            const [newProperty] = await database.insert(properties).values({
                name: propertyName,
                location: 'Njokerio',
                caretakerId: userIds['caretaker1@arenahomes.test'],
                facilities: {
                    water: 'CONSTANT',
                    parking: true,
                    wifi: true,
                    security: '24/7',
                    gateColor: 'Blue',
                },
            }).returning();
            propertyId = newProperty.id;
            seedLog.info(`Created property: ${propertyName}`);
        } else {
            propertyId = existingProperty[0].id;
            seedLog.warn(`Property already exists: ${propertyName}`);
        }

        // ===== STEP 5: Create Units =====
        seedLog.section('Step 5: Units');
        const unitSpecs = [
            { type: 'SINGLE', price: '3500', count: 3 },
            { type: 'BEDSITTER', price: '5500', count: 2 },
            { type: 'ONE_BEDROOM', price: '9000', count: 2 },
            { type: 'TWO_BEDROOM', price: '12000', count: 1 },
        ];

        const unitIds: string[] = [];
        let unitIndex = 1;

        for (const spec of unitSpecs) {
            for (let i = 0; i < spec.count; i++) {
                const unitCode = generateUnitCode('NJK-A', spec.type, unitIndex);
                const price = spec.type === 'SINGLE' && i === 1 ? '3800' :
                    spec.type === 'SINGLE' && i === 2 ? '4000' :
                        spec.type === 'BEDSITTER' && i === 1 ? '6000' :
                            spec.type === 'ONE_BEDROOM' && i === 1 ? '9500' :
                                spec.price;

                const existingUnit = await database
                    .select()
                    .from(units)
                    .where(eq(units.description, unitCode))
                    .limit(1);

                if (existingUnit.length === 0) {
                    const [newUnit] = await database.insert(units).values({
                        propertyId,
                        type: spec.type,
                        description: unitCode,
                        basePrice: price,
                        status: 'VACANT',
                    }).returning();
                    unitIds.push(newUnit.id);
                    seedLog.info(`Created unit: ${unitCode} (${spec.type}) - KSh ${price}`);
                } else {
                    unitIds.push(existingUnit[0].id);
                    seedLog.warn(`Unit already exists: ${unitCode}`);
                }
                unitIndex++;
            }
        }

        // ===== STEP 6: Create Tenant Domain Records =====
        seedLog.section('Step 6: Tenant Records');
        const tenantEmails = ['tenant1@arenahomes.test', 'tenant2@arenahomes.test'];
        const tenantDomainIds: Record<string, string> = {};

        for (const email of tenantEmails) {
            const userId = userIds[email];
            const existingTenant = await database.select().from(tenants).where(eq(tenants.userId, userId)).limit(1);

            if (existingTenant.length === 0) {
                const tenantId = await TenantRepository.create(userId, ctx);
                // Update status to ACTIVE
                await TenantRepository.updateStatus(tenantId, 'ACTIVE', ctx);
                tenantDomainIds[email] = tenantId;
                seedLog.info(`Created tenant domain record for: ${email}`);
            } else {
                tenantDomainIds[email] = existingTenant[0].id;
                seedLog.warn(`Tenant domain record already exists for: ${email}`);
            }
        }

        // ===== STEP 6B: Create Approved Applications for Tenant Onboarding =====
        seedLog.section('Step 6B: Tenant Applications');
        for (const email of tenantEmails) {
            const userId = userIds[email];
            const tenantProfile = testUsers.find((u) => u.email === email)?.profile;
            const existingApplication = await database
                .select()
                .from(tenantApplications)
                .where(eq(tenantApplications.userId, userId))
                .limit(1);

            if (existingApplication.length === 0) {
                await database.insert(tenantApplications).values({
                    propertyId,
                    caretakerId: userIds['caretaker1@arenahomes.test'],
                    fullName: tenantProfile?.fullName || email,
                    email,
                    phoneNumber: tenantProfile?.phoneNumber || '0700000000',
                    universityRegNo: tenantProfile?.universityRegNo || null,
                    status: 'APPROVED',
                    userId,
                    hasSetPassword: true,
                    hasCompletedProfile: true,
                    hasAcceptedAgreement: true,
                    respondedAt: new Date(),
                    caretakerNotes: 'Auto-approved in minimal seed for deterministic auth/onboarding tests.',
                });
                seedLog.info(`Created approved application for: ${email}`);
            } else {
                await database
                    .update(tenantApplications)
                    .set({
                        status: 'APPROVED',
                        hasSetPassword: true,
                        hasCompletedProfile: true,
                        hasAcceptedAgreement: true,
                        userId,
                        respondedAt: new Date(),
                    })
                    .where(eq(tenantApplications.id, existingApplication[0].id));
                seedLog.warn(`Application already existed and was normalized for: ${email}`);
            }
        }

        // ===== STEP 7: Create Leases =====
        seedLog.section('Step 7: Leases');
        const today = new Date();
        const startDate = formatDate(today);
        const endDate = formatDate(new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()));

        // Lease 1: tenant1 on NJK-A-S1 (ACTIVE)
        const lease1UnitId = unitIds[0];
        const lease1Data = {
            tenantId: tenantDomainIds['tenant1@arenahomes.test'],
            unitId: lease1UnitId,
            startDate,
            endDate,
            pdfUrl: '/contracts/lease-tenant1-s1.pdf',
        };

        const existingLease1 = await database
            .select()
            .from(leases)
            .where(eq(leases.unitId, lease1UnitId))
            .limit(1);

        let lease1Id: string;
        if (existingLease1.length === 0) {
            lease1Id = await LeaseService.draftLease(lease1Data, ctx);
            await LeaseService.activateLease(lease1Id, ctx);
            seedLog.info('Created and activated lease for tenant1 on NJK-A-S1');
        } else {
            lease1Id = existingLease1[0].id;
            seedLog.warn('Lease already exists for NJK-A-S1');
        }

        // Lease 2: tenant2 on NJK-A-BS1 (ACTIVE)
        const lease2UnitId = unitIds[3]; // First bedsitter
        const lease2Data = {
            tenantId: tenantDomainIds['tenant2@arenahomes.test'],
            unitId: lease2UnitId,
            startDate,
            endDate,
            pdfUrl: '/contracts/lease-tenant2-bs1.pdf',
        };

        const existingLease2 = await database
            .select()
            .from(leases)
            .where(eq(leases.unitId, lease2UnitId))
            .limit(1);

        let lease2Id: string;
        if (existingLease2.length === 0) {
            lease2Id = await LeaseService.draftLease(lease2Data, ctx);
            await LeaseService.activateLease(lease2Id, ctx);
            seedLog.info('Created and activated lease for tenant2 on NJK-A-BS1');
        } else {
            lease2Id = existingLease2[0].id;
            seedLog.warn('Lease already exists for NJK-A-BS1');
        }

        // Lease 3: tenant1 on NJK-A-S2 (PENDING)
        const lease3UnitId = unitIds[1];
        const lease3Data = {
            tenantId: tenantDomainIds['tenant1@arenahomes.test'],
            unitId: lease3UnitId,
            startDate: formatDate(new Date(today.getFullYear(), today.getMonth() + 1, 1)),
            endDate: formatDate(new Date(today.getFullYear() + 1, today.getMonth() + 1, 1)),
            pdfUrl: '/contracts/lease-tenant1-s2-pending.pdf',
        };

        const existingLease3 = await database
            .select()
            .from(leases)
            .where(eq(leases.unitId, lease3UnitId))
            .limit(1);

        if (existingLease3.length === 0) {
            await LeaseService.draftLease(lease3Data, ctx);
            seedLog.info('Created PENDING lease for tenant1 on NJK-A-S2');
        } else {
            seedLog.warn('Lease already exists for NJK-A-S2');
        }

        // ===== STEP 8: Create Payments =====
        seedLog.section('Step 8: Payments');

        // Payment 1: tenant1 SUCCESS
        const payment1Ref = generateMpesaReference(1, 'SUCCESS');
        const existingPayment1 = await database
            .select()
            .from(payments)
            .where(eq(payments.gatewayTransactionId, payment1Ref))
            .limit(1);

        if (existingPayment1.length === 0) {
            const payment1Id = await PaymentService.initiatePayment(
                {
                    tenantId: tenantDomainIds['tenant1@arenahomes.test'],
                    leaseId: lease1Id,
                    amount: '3500',
                    gateway: 'MPESA',
                    description: 'Rent payment - January',
                },
                ctx
            );
            await PaymentService.confirmPayment(payment1Id, payment1Ref, ctx);
            seedLog.info(`Created SUCCESS payment for tenant1: ${payment1Ref}`);
        } else {
            seedLog.warn(`Payment already exists: ${payment1Ref}`);
        }

        // Payment 2: tenant2 SUCCESS
        const payment2Ref = generateMpesaReference(2, 'SUCCESS');
        const existingPayment2 = await database
            .select()
            .from(payments)
            .where(eq(payments.gatewayTransactionId, payment2Ref))
            .limit(1);

        if (existingPayment2.length === 0) {
            const payment2Id = await PaymentService.initiatePayment(
                {
                    tenantId: tenantDomainIds['tenant2@arenahomes.test'],
                    leaseId: lease2Id,
                    amount: '5500',
                    gateway: 'MPESA',
                    description: 'Rent payment - January',
                },
                ctx
            );
            await PaymentService.confirmPayment(payment2Id, payment2Ref, ctx);
            seedLog.info(`Created SUCCESS payment for tenant2: ${payment2Ref}`);
        } else {
            seedLog.warn(`Payment already exists: ${payment2Ref}`);
        }

        // Payment 3: tenant1 FAILED
        const payment3Ref = generateMpesaReference(1, 'FAILED');
        const existingPayment3 = await database
            .select()
            .from(payments)
            .where(eq(payments.gatewayTransactionId, payment3Ref))
            .limit(1);

        if (existingPayment3.length === 0) {
            const payment3Id = await PaymentService.initiatePayment(
                {
                    tenantId: tenantDomainIds['tenant1@arenahomes.test'],
                    amount: '3500',
                    gateway: 'MPESA',
                    description: 'Failed payment attempt',
                },
                ctx
            );
            await PaymentService.failPayment(payment3Id, 'Insufficient funds', ctx);
            seedLog.info(`Created FAILED payment for tenant1: ${payment3Ref}`);
        } else {
            seedLog.warn(`Payment already exists: ${payment3Ref}`);
        }

        // ===== STEP 9: Create Issues =====
        seedLog.section('Step 9: Issues');
        const issueData = [
            {
                reporterId: userIds['tenant1@arenahomes.test'],
                unitId: unitIds[0],
                type: 'PLUMBING',
                title: 'Water tap leaking',
                description: 'The bathroom tap is leaking continuously',
                status: 'OPEN' as const,
                priority: 'MEDIUM' as const,
            },
            {
                reporterId: userIds['tenant2@arenahomes.test'],
                unitId: unitIds[3],
                type: 'ELECTRICAL',
                title: 'Bulb replacement',
                description: 'Living room bulb needs replacement',
                status: 'OPEN' as const,
                priority: 'LOW' as const,
            },
        ];

        for (const issue of issueData) {
            const existing = await database
                .select()
                .from(issues)
                .where(eq(issues.title, issue.title))
                .limit(1);

            if (existing.length === 0) {
                await database.insert(issues).values(issue);
                seedLog.info(`Created issue: ${issue.title}`);
            } else {
                seedLog.warn(`Issue already exists: ${issue.title}`);
            }
        }

        // ===== STEP 10: Create Maintenance Request =====
        seedLog.section('Step 10: Maintenance');
        const maintenanceData = {
            title: 'Monthly property inspection',
            description: 'Routine inspection of all units',
            scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            status: 'SCHEDULED' as const,
            assignedToId: userIds['caretaker1@arenahomes.test'],
        };

        const existingMaintenance = await database
            .select()
            .from(maintenanceRequests)
            .where(eq(maintenanceRequests.title, maintenanceData.title))
            .limit(1);

        if (existingMaintenance.length === 0) {
            await database.insert(maintenanceRequests).values(maintenanceData);
            seedLog.info('Created maintenance request');
        } else {
            seedLog.warn('Maintenance request already exists');
        }

        // ===== STEP 11: Create Announcements =====
        seedLog.section('Step 11: Announcements');
        const announcementData = [
            {
                title: 'New Rooms Available',
                content: 'New rooms available near Main Gate! Contact us for viewing.',
                authorId: userIds['admin@arenahomes.test'],
                targetRole: 'PUBLIC',
            },
            {
                title: 'Rent Reminder',
                content: 'Reminder: Rent is due every 27th of the month.',
                authorId: userIds['admin@arenahomes.test'],
                targetRole: 'TENANT',
            },
            {
                title: 'Staff Meeting',
                content: 'All staff members: Meeting scheduled for Friday 3 PM.',
                authorId: userIds['admin@arenahomes.test'],
                targetRole: 'EMPLOYEE',
            },
        ];

        for (const announcement of announcementData) {
            const existing = await database
                .select()
                .from(announcements)
                .where(eq(announcements.title, announcement.title))
                .limit(1);

            if (existing.length === 0) {
                await database.insert(announcements).values(announcement);
                seedLog.info(`Created announcement: ${announcement.title}`);
            } else {
                seedLog.warn(`Announcement already exists: ${announcement.title}`);
            }
        }

        // ===== STEP 12: Create Notifications =====
        seedLog.section('Step 12: Notifications');
        const notificationData = [
            {
                userId: userIds['tenant1@arenahomes.test'],
                title: 'Payment Received',
                message: 'Your rent payment of KSh 3,500 has been confirmed.',
                type: 'SUCCESS' as const,
            },
            {
                userId: userIds['tenant2@arenahomes.test'],
                title: 'Payment Received',
                message: 'Your rent payment of KSh 5,500 has been confirmed.',
                type: 'SUCCESS' as const,
            },
            {
                userId: userIds['tenant1@arenahomes.test'],
                title: 'Issue Received',
                message: 'Your issue "Water tap leaking" has been logged.',
                type: 'INFO' as const,
            },
            {
                userId: userIds['caretaker1@arenahomes.test'],
                title: 'Maintenance Scheduled',
                message: 'You have been assigned a maintenance task.',
                type: 'INFO' as const,
            },
            {
                userId: userIds['admin@arenahomes.test'],
                title: 'New Lease Activated',
                message: '2 new leases have been activated.',
                type: 'SUCCESS' as const,
            },
        ];

        for (const notification of notificationData) {
            const existing = await database
                .select()
                .from(notifications)
                .where(eq(notifications.title, notification.title))
                .limit(1);

            if (existing.length === 0) {
                await database.insert(notifications).values(notification);
                seedLog.info(`Created notification: ${notification.title}`);
            } else {
                seedLog.warn(`Notification already exists: ${notification.title}`);
            }
        }

        // ===== STEP 13: Create Financial Snapshot =====
        seedLog.section('Step 13: Financial Snapshot');
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        const existingSnapshot = await database
            .select()
            .from(financialSnapshots)
            .where(eq(financialSnapshots.month, currentMonth))
            .limit(1);

        if (existingSnapshot.length === 0) {
            await database.insert(financialSnapshots).values({
                month: currentMonth,
                year: currentYear,
                propertyId,
                totalIncome: '9000', // 3500 + 5500
                totalExpenses: '0',
                netProfit: '9000',
                status: 'FINALIZED',
                pdfUrl: `/reports/financial-${currentYear}-${String(currentMonth).padStart(2, '0')}.pdf`,
            });
            seedLog.info('Created financial snapshot for current month');
        } else {
            seedLog.warn('Financial snapshot already exists for current month');
        }

        // ===== SUMMARY =====
        seedLog.section('MINIMAL SEED - Summary');
        seedLog.data('Users Created', Object.keys(userIds).length);
        seedLog.data('Properties', 1);
        seedLog.data('Units', unitIds.length);
        seedLog.data('Active Leases', 2);
        seedLog.data('Pending Leases', 1);
        seedLog.data('Successful Payments', 2);
        seedLog.data('Failed Payments', 1);
        seedLog.data('Issues', 2);
        seedLog.data('Maintenance Requests', 1);
        seedLog.data('Announcements', 3);
        seedLog.data('Notifications', 5);
        seedLog.data('Financial Snapshots', 1);

        seedLog.section('Test Credentials');
        console.log('admin@arenahomes.test       → Admin#1234');
        console.log('caretaker1@arenahomes.test  → Care#1234');
        console.log('accountant@arenahomes.test  → Acc#1234');
        console.log('it@arenahomes.test          → IT#1234');
        console.log('tenant1@arenahomes.test     → Ten#1234');
        console.log('tenant2@arenahomes.test     → Ten#1234');

        seedLog.section('MINIMAL SEED - Complete ✓');
    } catch (error) {
        seedLog.error('Seed failed with error:');
        console.error(error);
        throw error;
    }
}
