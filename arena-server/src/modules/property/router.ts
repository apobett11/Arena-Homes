import { Router } from 'express';
import { authenticate, requireRole, AuthenticatedRequest } from '../auth/middleware';
import { PropertyRepository } from './repository';
import { UnitRepository } from '../unit/repository';
import { db } from '../../infrastructure/orm/drizzle';
import { properties } from './schema';
import { z } from 'zod';

const router = Router();

const createPropertySchema = z.object({
    name: z.string().min(2),
    location: z.string().min(2),
    logoUrl: z.string().url(),
    facilities: z.object({
        houseGateImageUrl: z.string().url(),
        ownerType: z.string().min(2),
        caretakerName: z.string().min(2),
        caretakerPhone: z.string().min(7),
        caretakerEmail: z.string().email().optional(),
        houseCardDetails: z.string().optional(),
        policies: z.array(z.string()).optional(),
        map: z.object({
            gateLabel: z.string().min(1),
            plotLabel: z.string().min(1),
            gateLat: z.number(),
            gateLng: z.number(),
            houseLat: z.number(),
            houseLng: z.number(),
        }),
    }),
});

const pinAccessSchema = z.object({
    visitorId: z.string().min(3),
});

/**
 * @route GET /properties
 * @desc Get all properties
 * @access Public (or Authenticated?) - Usually public for listings.
 */
router.get('/', async (req, res) => {
    try {
        const list = await db().select().from(properties);
        res.json(list);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/pin/:pinCode', async (req, res) => {
    try {
        const item = await PropertyRepository.getByInvitePinCode(req.params.pinCode);
        if (!item) return res.status(404).json({ error: 'Property not found for this invite pin' });
        const units = await UnitRepository.listByProperty(item.id);
        res.json({ ...item, units });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/pin/:pinCode/access', async (req, res) => {
    try {
        const { visitorId } = pinAccessSchema.parse(req.body);
        const usage = await PropertyRepository.useRealtimeMapAccess(req.params.pinCode, visitorId);
        res.json(usage);
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid data', details: err.issues });
        }
        res.status(400).json({ error: err.message });
    }
});

/**
 * @route GET /properties/:id
 * @desc Get details
 */
router.get('/:id', async (req, res) => {
    try {
        const item = await PropertyRepository.get(req.params.id);
        if (!item) return res.status(404).json({ error: 'Property not found' });

        // Include units?
        const units = await UnitRepository.listByProperty(req.params.id);
        res.json({ ...item, units });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route POST /properties
 * @desc Create property
 * @access Admin
 */
router.post('/', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req: AuthenticatedRequest, res) => {
    try {
        const payload = createPropertySchema.parse(req.body);
        const result = await PropertyRepository.create(payload, req.auditContext!);
        res.status(201).json(result);
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid data', details: err.issues });
        }
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route PATCH /properties/:id
 * @desc Update property
 * @access Admin
 */
router.patch('/:id', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req: AuthenticatedRequest, res) => {
    try {
        await PropertyRepository.update(req.params.id, req.body, req.auditContext!);
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export const propertyRouter = router;
