import { fetchClient } from '../client';

export interface SubmitApplicationInput {
    propertyId: string;
    caretakerId: string;
    fullName: string;
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
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
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

export const ApplicationApi = {
    submit: async (data: SubmitApplicationInput): Promise<SubmitApplicationResponse> => {
        return fetchClient<SubmitApplicationResponse>('/applications', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    getCaretakerApplications: async (status?: 'PENDING' | 'APPROVED' | 'REJECTED') => {
        const query = status ? `?status=${status}` : '';
        return fetchClient<CaretakerApplication[]>(`/applications/caretaker${query}`);
    },

    respond: async (id: string, payload: { status: 'APPROVED' | 'REJECTED'; notes?: string }) => {
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
