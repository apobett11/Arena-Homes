import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export class PasswordService {
    /**
     * Hashes a plain text password using bcrypt with high salt rounds.
     */
    public static async hash(payload: string): Promise<string> {
        return await bcrypt.hash(payload, SALT_ROUNDS);
    }

    /**
     * Compares a plain text password with a hash.
     */
    public static async compare(plain: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(plain, hash);
    }
}
