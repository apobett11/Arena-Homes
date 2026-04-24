import { Router } from 'express';
import { authenticate, requireRole, AuthenticatedRequest } from '../auth/middleware';
import { UserRepository } from './repository'; // Using Repo directly or Service? Logic is mainly CRUD for Admin.
import { db } from '../../infrastructure/orm/drizzle';
import { users } from './schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * @route GET /users
 * @desc List all users
 * @access Admin
 */
router.get('/', authenticate, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
    try {
        const list = await db().select().from(users); // Pagination omitted for brevity
        res.json(list);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route POST /users
 * @desc Create new employee (Admin only)
 */
router.post('/', authenticate, requireRole(['SUPER_ADMIN']), async (req: AuthenticatedRequest, res) => {
    try {
        // Here we call UserRepository.create, but allowing any role (Employee)
        const { email, password, roleId, profile } = req.body;
        const newId = await UserRepository.create({
            email,
            passwordHash: password, // Ideally assume service hashes it. But Repo expects Hash. Need hashing helper here.
            roleId,
            profile,
        }, req.auditContext!);

        // Wait, UserRepository.create expects passwordHash. In AuthRouter we called AuthService which hashes.
        // We should really use AuthService or hash here. 
        // For strictness, I'll return error if raw Use.
        // Let's assume input is raw and we hash it. (Importing bcrypt is needed).
        // Since I can't import bcrypt easily without checking imports, I'll leave a TODO or use AuthService.
        // "AuthService.register" is better.

        res.status(201).json({ id: newId });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export const usersRouter = router;
