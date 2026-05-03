import { fetchClient } from '../client';

// Application Submit Input - NO status field (database sets it to WAITING)
export interface SubmitApplicationInput {
    propertyId: string;
    fullName: string;  // Must contain at least two names (first and last)
    email: string;
    phoneNumber: string;
    whatsappNumber?: string;
    universityRegNo?: string;
    preferredMoveInDate?: string;
    message?: string;
}

export interface SubmitApplicationResponse {
    message: string;
    applicationId: string;
}

export interface CaretakerApplication {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    whatsappNumber?: string;
    universityRegNo?: string;
    message?: string;
    status: 'WAITING' | 'ACCEPTED' | 'REJECTED';
    preferredMoveInDate?: string;
    createdAt: string;
    caretakerNotes?: string;
}

export interface OnboardingStatusResponse {
    canAccess: boolean;
    reason?: string;
    onboardingStatus?: {
        hasSetPassword: boolean;
        hasCompletedProfile: boolean;
        hasAcceptedAgreement: boolean;
    };
}

// Validation helper
function validateApplicationInput(data: SubmitApplicationInput): void {
    // Check full name has at least two words (first and last name)
    const nameParts = data.fullName.trim().split(/\s+/);
    if (nameParts.length < 2) {
        throw new Error('Please provide both first and last name');
    }
    
    // Check email is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        throw new Error('Please provide a valid email address');
    }
    
    // Check phone number is provided and not empty
    if (!data.phoneNumber || data.phoneNumber.trim().length < 8) {
        throw new Error('Please provide a valid phone number');
    }
    
    // Check propertyId is provided
    if (!data.propertyId) {
        throw new Error('Property ID is required');
    }
}

export const ApplicationApi = {
    submit: async (data: SubmitApplicationInput): Promise<SubmitApplicationResponse> => {
        // Validate input before sending
        validateApplicationInput(data);
        
        // Submit to API - NO status field included (database handles it)
        return fetchClient<SubmitApplicationResponse>('/applications', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    getCaretakerApplications: async (status?: 'WAITING' | 'ACCEPTED' | 'REJECTED') => {
        const query = status ? `?status=${status}` : '';
        return fetchClient<CaretakerApplication[]>(`/applications/caretaker${query}`);
    },

    respond: async (id: string, payload: { status: 'ACCEPTED' | 'REJECTED'; notes?: string }) => {
        return fetchClient(`/applications/${id}/respond`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    getMyOnboardingStatus: async (): Promise<OnboardingStatusResponse> => {
        return fetchClient<OnboardingStatusResponse>('/applications/me/onboarding');
    },

    completeOnboardingStep: async (payload: {
        step: 'password' | 'profile' | 'agreement';
        password?: string;
        fullName?: string;
        phoneNumber?: string;
        emergencyContact?: string;
    }): Promise<OnboardingStatusResponse> => {
        return fetchClient<OnboardingStatusResponse>('/applications/me/onboarding/step', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },
};
