import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { env } from '../../infrastructure/config/env';

export interface TokenPayload {
    userId: string;
    roleId: string;
    sub: string; // standard subject
}

export class TokenService {
    /**
     * Generates a short-lived JWT access token (15 mins).
     */
    public static generateAccessToken(payload: Omit<TokenPayload, 'sub'>): string {
        return jwt.sign(
            { ...payload, sub: payload.userId },
            env.JWT_SECRET,
            { expiresIn: '15m' }
        );
    }

    /**
     * Generates a secure random refresh token (opaque string).
     */
    public static generateRefreshToken(): string {
        return crypto.randomBytes(40).toString('hex');
    }

    /**
     * Hashes a token for secure storage.
     */
    public static hashToken(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    /**
     * Verifies and decodes the access token.
     */
    public static verifyAccessToken(token: string): TokenPayload {
        try {
            return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
        } catch (error) {
            throw new Error('Invalid or expired access token');
        }
    }

    public static verifyToken(token: string) {
        return this.verifyAccessToken(token);
    }
}
