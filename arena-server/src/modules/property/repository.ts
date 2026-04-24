import { eq } from 'drizzle-orm';
import { db } from '../../infrastructure/orm/drizzle';
import { properties } from './schema';
import { AuditContext } from '../audit/types';
import { AuditService } from '../audit/service';
import { withTransaction } from '../../infrastructure/orm/transaction';
import { AuthService } from '../auth/service';

export class PropertyRepository {
    public static async create(
        data: {
            name: string;
            location: string;
            logoUrl: string;
            facilities: {
                houseGateImageUrl: string;
                ownerType: string;
                caretakerName: string;
                caretakerPhone: string;
                caretakerEmail?: string;
                houseCardDetails?: string;
                policies?: string[];
                map: {
                    gateLabel: string;
                    plotLabel: string;
                    gateLat: number;
                    gateLng: number;
                    houseLat: number;
                    houseLng: number;
                };
            };
        },
        context: AuditContext
    ): Promise<{ id: string; caretakerTempPassword?: string; invitePinCode: string }> {
        return await withTransaction(async (tx) => {
            const tempPassword = this.generateTempPassword();
            const caretakerEmail = data.facilities.caretakerEmail || this.generateCaretakerEmail(data.facilities.caretakerName, data.name);
            const invitePinCode = this.generateInvitePinCode();

            const caretaker = await AuthService.register({
                email: caretakerEmail,
                password: tempPassword,
                roleId: 'CARETAKER',
                profile: {
                    fullName: data.facilities.caretakerName,
                    phoneNumber: data.facilities.caretakerPhone,
                    jobTitle: 'Caretaker',
                    editableFields: {
                        onboardingRequired: true,
                        mustChangePassword: true,
                    },
                },
            }, {
                ...context,
                action: 'CREATE_CARETAKER_FOR_PROPERTY',
            });

            const [newProperty] = await tx
                .insert(properties)
                .values({
                    name: data.name,
                    location: data.location,
                    caretakerId: caretaker.userId,
                    logoUrl: data.logoUrl,
                    facilities: {
                        ...data.facilities,
                        caretakerEmail,
                        caretakerTempPassword: tempPassword,
                        invitePinCode,
                        realtimeMapAccess: {},
                    },
                })
                .returning({ id: properties.id });

            await AuditService.log(
                context,
                'PROPERTY',
                newProperty.id,
                { action: 'CREATE_PROPERTY', data },
                tx
            );

            return { id: newProperty.id, caretakerTempPassword: tempPassword, invitePinCode };
        });
    }

    public static async update(
        id: string,
        data: Partial<{
            name: string;
            location: string;
            caretakerId: string;
            logoUrl: string;
            facilities: Record<string, unknown>;
        }>,
        context: AuditContext
    ): Promise<void> {
        await withTransaction(async (tx) => {
            const current = await tx.select().from(properties).where(eq(properties.id, id)).execute();
            if (current.length === 0) throw new Error('Property not found');

            await tx.update(properties).set({ ...data, updatedAt: new Date() }).where(eq(properties.id, id));

            await AuditService.log(
                context,
                'PROPERTY',
                id,
                { action: 'UPDATE_PROPERTY', changes: data, previous: current[0] },
                tx
            );
        });
    }

    public static async get(id: string) {
        const result = await db().select().from(properties).where(eq(properties.id, id));
        return result[0] || null;
    }

    public static async getByInvitePinCode(pinCode: string) {
        const list = await db().select().from(properties);
        return list.find((p: any) => p?.facilities?.invitePinCode === pinCode) || null;
    }

    public static async useRealtimeMapAccess(pinCode: string, visitorId: string): Promise<{ remainingUses: number; used: number; maxUses: number }> {
        const property = await this.getByInvitePinCode(pinCode);
        if (!property) throw new Error('Invalid invite pin');

        const maxUses = 10;
        const accessMap = ((property as any).facilities?.realtimeMapAccess || {}) as Record<string, number>;
        const current = accessMap[visitorId] || 0;
        if (current >= maxUses) {
            throw new Error('Realtime map usage limit reached for this visitor');
        }

        accessMap[visitorId] = current + 1;
        const facilities = {
            ...(property as any).facilities,
            realtimeMapAccess: accessMap,
        };

        await db().update(properties).set({ facilities, updatedAt: new Date() }).where(eq(properties.id, property.id));

        return {
            used: accessMap[visitorId],
            maxUses,
            remainingUses: Math.max(0, maxUses - accessMap[visitorId]),
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

    private static generateCaretakerEmail(caretakerName: string, propertyName: string): string {
        const safeName = caretakerName.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
        const safeProperty = propertyName.toLowerCase().replace(/[^a-z0-9]/g, '');
        return `${safeName || 'caretaker'}.${safeProperty || 'house'}@arena.local`;
    }

    private static generateInvitePinCode(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
}
