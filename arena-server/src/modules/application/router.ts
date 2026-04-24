import { Router } from 'express';
import { ApplicationService } from './service';
import { authenticate, AuthenticatedRequest, requireRole } from '../auth/middleware';
import { z } from 'zod';
import { PasswordService } from '../auth/password.service';
import { db } from '../../infrastructure/orm/drizzle';
import { users, tenantProfiles } from '../users/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Validation schemas
const submitApplicationSchema = z.object({
    propertyId: z.string().uuid(),
    caretakerId: z.string().uuid(),
    fullName: z.string().min(2),
    email: z.string().email(),
    phoneNumber: z.string().min(10),
    whatsappNumber: z.string().optional(),
    universityRegNo: z.string().optional(),
    preferredMoveInDate: z.string().datetime().optional(),
    message: z.string().optional(),
});

const respondApplicationSchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
    notes: z.string().optional(),
});

const onboardingStepSchema = z.object({
    step: z.enum(['password', 'profile', 'agreement']),
    password: z.string().min(8).optional(),
    fullName: z.string().min(2).optional(),
    phoneNumber: z.string().min(10).optional(),
    emergencyContact: z.string().optional(),
});

/**
 * @route POST /applications
 * @desc Submit a new tenant application (Public)
 */
router.post('/', async (req, res) => {
    try {
        const data = submitApplicationSchema.parse(req.body);
        
        const application = await ApplicationService.submitApplication({
            ...data,
            preferredMoveInDate: data.preferredMoveInDate ? new Date(data.preferredMoveInDate) : undefined,
        });

        res.status(201).json({
            message: 'Application submitted successfully. The caretaker will review and contact you.',
            applicationId: application.id,
        });
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid data', details: err.issues });
        }
        res.status(400).json({ error: err.message });
    }
});

/**
 * @route GET /applications/caretaker
 * @desc Get all applications for the logged-in caretaker
 * @access Private (Caretaker only)
 */
router.get('/caretaker', authenticate, requireRole(['CARETAKER', 'ADMIN', 'SUPER_ADMIN']), async (req: AuthenticatedRequest, res) => {
    try {
        const { status } = req.query;
        const applications = await ApplicationService.getCaretakerApplications(
            req.user!.id,
            status as string | undefined
        );
        res.json(applications);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route GET /applications/:id
 * @desc Get single application details
 * @access Private
 */
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res) => {
    try {
        const application = await ApplicationService.getApplicationById(req.params.id);
        
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        // Check permissions - only caretaker of the property or admin can view
        const user = req.user!;
        if (!['ADMIN', 'SUPER_ADMIN'].includes(user.roleId) && application.caretakerId !== user.id) {
            return res.status(403).json({ error: 'Not authorized to view this application' });
        }

        res.json(application);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route POST /applications/:id/respond
 * @desc Approve or reject an application
 * @access Private (Caretaker only)
 */
router.post('/:id/respond', authenticate, requireRole(['CARETAKER', 'ADMIN', 'SUPER_ADMIN']), async (req: AuthenticatedRequest, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = respondApplicationSchema.parse(req.body);

        // Get application to verify caretaker ownership
        const application = await ApplicationService.getApplicationById(id);
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        const user = req.user!;
        if (!['ADMIN', 'SUPER_ADMIN'].includes(user.roleId) && application.caretakerId !== user.id) {
            return res.status(403).json({ error: 'Not authorized to respond to this application' });
        }

        const auditContext = {
            actorId: user.id,
            actorType: 'USER' as const,
            action: status === 'APPROVED' ? 'APPROVE_APPLICATION' : 'REJECT_APPLICATION',
            ipAddress: req.ip || '',
            userAgent: req.get('User-Agent') || '',
        };

        if (status === 'APPROVED') {
            const result = await ApplicationService.approveApplication(id, notes || '', auditContext);
            res.json({
                message: 'Application approved. Tenant account created.',
                ...result,
                instructions: `The applicant will receive an email with their temporary password: ${result.tempPassword}`,
            });
        } else {
            const result = await ApplicationService.rejectApplication(id, notes || '', auditContext);
            res.json({
                message: 'Application rejected.',
                application: result,
            });
        }
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid data', details: err.issues });
        }
        res.status(400).json({ error: err.message });
    }
});

/**
 * @route GET /applications/check-status/:email
 * @desc Check application status by email (for login page)
 * @access Public
 */
router.get('/check-status/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const application = await ApplicationService.getApplicationByEmail(email);
        
        if (!application) {
            return res.json({ 
                hasApplication: false,
                message: 'No approved application found. You need to apply for a property first.'
            });
        }

        res.json({
            hasApplication: true,
            status: application.status,
            canLogin: application.status === 'APPROVED',
            onboardingComplete: application.hasSetPassword && application.hasCompletedProfile && application.hasAcceptedAgreement,
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route GET /applications/me/onboarding
 * @desc Get current user's onboarding status
 * @access Private (Tenant only)
 */
router.get('/me/onboarding', authenticate, requireRole(['TENANT']), async (req: AuthenticatedRequest, res) => {
    try {
        const result = await ApplicationService.canAccessDashboard(req.user!.id);
        res.json(result);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route POST /applications/me/onboarding/step
 * @desc Complete onboarding step for current tenant
 * @access Private (Tenant only)
 */
router.post('/me/onboarding/step', authenticate, requireRole(['TENANT']), async (req: AuthenticatedRequest, res) => {
    try {
        const payload = onboardingStepSchema.parse(req.body);
        const userId = req.user!.id;

        const app = await ApplicationService.getApplicationByUserId(userId);
        if (!app) {
            return res.status(404).json({ error: 'Onboarding application not found' });
        }

        if (payload.step === 'password') {
            if (!payload.password) {
                return res.status(400).json({ error: 'Password is required' });
            }
            const passwordHash = await PasswordService.hash(payload.password);
            await db().update(users).set({ passwordHash }).where(eq(users.id, userId));
        }

        if (payload.step === 'profile') {
            if (!payload.fullName || !payload.phoneNumber) {
                return res.status(400).json({ error: 'Full name and phone number are required' });
            }
            await db().update(tenantProfiles).set({
                fullName: payload.fullName,
                phoneNumber: payload.phoneNumber,
                emergencyContactJson: payload.emergencyContact ? { value: payload.emergencyContact } : null,
            }).where(eq(tenantProfiles.userId, userId));
        }

        await ApplicationService.completeOnboardingStep(app.id, payload.step);
        const status = await ApplicationService.canAccessDashboard(userId);
        return res.json(status);
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid data', details: err.issues });
        }
        return res.status(400).json({ error: err.message });
    }
});

export const applicationRouter = router;
