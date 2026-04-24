import { eq, and } from 'drizzle-orm';
import { db } from '../../infrastructure/orm/drizzle';
import { withTransaction } from '../../infrastructure/orm/transaction';
import { log } from '../../infrastructure/logger';
import { users } from '../users/schema';
import { refreshTokens } from './schema';
import { UserRepository } from '../users/repository';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { AuditService } from '../audit/service';
import { AuditContext } from '../audit/types';
import { ANONYMOUS_ACTOR_ID, UNKNOWN_TARGET_ID } from '../audit/constants';

export class AuthService {
    /**
     * Registers a new user.
     */
    public static async register(
        data: { email: string; password: string; roleId: string; profile?: any },
        context: AuditContext
    ) {
        // 1. Check existence
        const existing = await UserRepository.findByEmail(data.email);
        if (existing) {
            throw new Error('User already exists');
        }

        // 2. Hash Password
        const passwordHash = await PasswordService.hash(data.password);

        // 3. Create User (Audit logged inside Repo)
        const userId = await UserRepository.create(
            {
                email: data.email,
                passwordHash,
                roleId: data.roleId,
                profile: data.profile,
            },
            context
        );

        return { userId };
    }

    /**
     * Logs a user in.
     */
    public static async login(
        email: string,
        plainPass: string,
        context: AuditContext
    ) {
        // 1. Find User
        const user = await UserRepository.findByEmail(email);
        if (!user) {
            // Log failed attempt
            await AuditService.log(
                { ...context, actorId: ANONYMOUS_ACTOR_ID },
                'AUTH',
                UNKNOWN_TARGET_ID,
                { action: 'LOGIN_FAILED', reason: 'User not found', email },
            );
            throw new Error('Invalid credentials');
        }

        // 2. Validate Password
        const valid = await PasswordService.compare(plainPass, user.passwordHash);
        if (!valid) {
            await AuditService.log(
                { ...context, actorId: user.id },
                'AUTH',
                user.id,
                { action: 'LOGIN_FAILED', reason: 'Bad password' },
            );
            throw new Error('Invalid credentials');
        }

        if (!user.isActive) {
            throw new Error('Account disabled');
        }

        // 3. Generate Tokens
        const accessToken = TokenService.generateAccessToken({
            userId: user.id,
            roleId: user.roleId,
        });
        const refreshToken = TokenService.generateRefreshToken();
        const tokenHash = TokenService.hashToken(refreshToken);

        // 4. Update DB (Last Login + Store Refresh Token)
        await withTransaction(async (tx) => {
            // Update User
            await tx
                .update(users)
                .set({ lastLoginAt: new Date() })
                .where(eq(users.id, user.id));

            // Store Refresh Token
            await tx.insert(refreshTokens).values({
                userId: user.id,
                tokenHash: tokenHash,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                ipAddress: context.ipAddress,
                userAgent: context.userAgent || 'UNKNOWN',
            });

            // Audit Success
            // We explicitly pass 'tx' to ensure if audit fails, login fails.
            await AuditService.log(
                { ...context, actorId: user.id },
                'AUTH',
                user.id,
                { action: 'LOGIN_SUCCESS' },
                tx
            );
        });

        log.info(`User logged in: ${user.id}`);

        return {
            accessToken,
            refreshToken,
            user: { id: user.id, role: user.roleId, roleId: user.roleId, email: user.email },
        };
    }

    /**
     * Refreshes the session using a rotation strategy.
     */
    public static async refreshSession(
        rawRefreshToken: string,
        context: AuditContext
    ) {
        const tokenHash = TokenService.hashToken(rawRefreshToken);

        return await withTransaction(async (tx) => {
            // 1. Find Token
            const [storedToken] = await tx
                .select()
                .from(refreshTokens)
                .where(eq(refreshTokens.tokenHash, tokenHash))
                .limit(1);

            if (!storedToken) {
                throw new Error('Invalid refresh token');
            }

            // 2. Reuse Detection (CRITICAL)
            if (storedToken.isRevoked) {
                // If a revoked token is used, it means it was stolen and the thief is trying to use it
                // OR the user is trying to reply a request.
                // Action: Revoke ALL tokens for this user tree? 
                // For now: Log Security Alert and Fail.
                await AuditService.log(
                    context,
                    'SECURITY',
                    storedToken.userId,
                    { action: 'TOKEN_REUSE_ATTEMPT', tokenId: storedToken.id },
                    tx
                );
                throw new Error('Security Violation: Token Reuse Detected');
            }

            // 3. Check Expiry
            if (new Date() > storedToken.expiresAt) {
                throw new Error('Token expired');
            }

            // 4. Rotate
            // Revoke current
            const newRefreshToken = TokenService.generateRefreshToken();
            const newTokenHash = TokenService.hashToken(newRefreshToken);

            const [newToken] = await tx
                .insert(refreshTokens)
                .values({
                    userId: storedToken.userId,
                    tokenHash: newTokenHash,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                    ipAddress: context.ipAddress,
                })
                .returning({ id: refreshTokens.id });

            await tx
                .update(refreshTokens)
                .set({
                    isRevoked: true,
                    replacedBy: newToken.id,
                })
                .where(eq(refreshTokens.id, storedToken.id));

            // 5. Get User Role for Access Token
            const [user] = await tx
                .select()
                .from(users)
                .where(eq(users.id, storedToken.userId))
                .limit(1);

            if (!user) throw new Error('User not found');

            const accessToken = TokenService.generateAccessToken({
                userId: user.id,
                roleId: user.roleId,
            });

            await AuditService.log(
                context,
                'AUTH',
                user.id,
                { action: 'SESSION_REFRESH', oldTokenId: storedToken.id },
                tx
            );

            return {
                accessToken,
                refreshToken: newRefreshToken,
            };
        });
    }
}
