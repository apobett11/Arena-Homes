import { eq } from 'drizzle-orm';
import { db } from '../../infrastructure/orm/drizzle';
import { users, employeeProfiles, tenantProfiles } from './schema';
import { AuditContext } from '../audit/types';
import { AuditService } from '../audit/service';
import { withTransaction } from '../../infrastructure/orm/transaction';
import { log } from '../../infrastructure/logger';

export class UserRepository {
    public static async create(
        data: {
            email: string;
            passwordHash: string;
            roleId: string;
            profile?: any; // typed properly in real impl
        },
        context: AuditContext
    ): Promise<string> {
        return await withTransaction(async (tx) => {
            // 1. Create Base User
            const [newUser] = await tx
                .insert(users)
                .values({
                    email: data.email,
                    passwordHash: data.passwordHash,
                    roleId: data.roleId,
                    isActive: true,
                    mfaEnabled: false,
                })
                .returning({ id: users.id });

            log.info(`User created: ${newUser.id}`);

            // 2. Create Profile based on Role
            // This is a simplified logic stub.
            if (data.roleId === 'TENANT' && data.profile) {
                await tx.insert(tenantProfiles).values({
                    userId: newUser.id,
                    ...data.profile,
                });
            } else if (data.profile) {
                // Assume employee
                await tx.insert(employeeProfiles).values({
                    userId: newUser.id,
                    ...data.profile,
                });
            }

            // 3. Audit Log
            await AuditService.log(
                context,
                'USER',
                newUser.id,
                { action: 'CREATE_USER', role: data.roleId },
                tx
            );

            return newUser.id;
        });
    }

    public static async findByEmail(email: string) {
        const result = await db().select().from(users).where(eq(users.email, email)).limit(1);
        return result[0] || null;
    }
}
