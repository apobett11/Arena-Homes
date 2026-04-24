import { fetchClient } from '../client';

export interface PropertyFacilities {
    houseGateImageUrl?: string;
    ownerType?: string;
    caretakerName?: string;
    caretakerPhone?: string;
    caretakerEmail?: string;
    caretakerTempPassword?: string;
    houseCardDetails?: string;
    policies?: string[];
    map?: {
        gateLabel: string;
        plotLabel: string;
        gateLat: number;
        gateLng: number;
        houseLat: number;
        houseLng: number;
    };
    invitePinCode?: string;
    realtimeMapAccess?: Record<string, number>;
}

export interface Property {
    id: string;
    name: string;
    location: string;
    caretakerId?: string;
    logoUrl?: string;
    facilities?: PropertyFacilities;
    units?: Unit[];
}

export interface Unit {
    id: string;
    propertyId: string;
    type: string;
    description: string;
    basePrice: string;
    status: 'VACANT' | 'TAKEN';
}

export interface CreatePropertyPayload {
    name: string;
    location: string;
    logoUrl: string;
    facilities: PropertyFacilities;
}

export const PropertyApi = {
    getAll: async (): Promise<Property[]> => {
        return fetchClient<Property[]>('/properties');
    },

    getOne: async (id: string): Promise<Property> => {
        return fetchClient<Property>(`/properties/${id}`);
    },

    create: async (data: CreatePropertyPayload): Promise<{ id: string; caretakerTempPassword?: string; invitePinCode?: string }> => {
        return fetchClient('/properties', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    update: async (id: string, data: Partial<Property>): Promise<void> => {
        return fetchClient(`/properties/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    getUnits: async (propertyId?: string): Promise<Unit[]> => {
        return fetchClient<Unit[]>(propertyId ? `/units?propertyId=${propertyId}` : '/units');
    },

    getUnit: async (id: string): Promise<Unit> => {
        return fetchClient<Unit>(`/units/${id}`);
    },

    getByPinCode: async (pinCode: string): Promise<Property> => {
        return fetchClient<Property>(`/properties/pin/${encodeURIComponent(pinCode)}`);
    },

    consumeRealtimeMapByPin: async (pinCode: string, visitorId: string): Promise<{ remainingUses: number; used: number; maxUses: number }> => {
        return fetchClient(`/properties/pin/${encodeURIComponent(pinCode)}/access`, {
            method: 'POST',
            body: JSON.stringify({ visitorId }),
        });
    },

    updateUnitStatus: async (id: string, status: string, reason: string): Promise<void> => {
        return fetchClient(`/units/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status, reason }),
        });
    }
};
