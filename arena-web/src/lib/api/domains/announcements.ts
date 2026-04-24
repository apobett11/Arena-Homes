import { fetchClient } from '../client';

export interface Announcement {
    id: string;
    title: string;
    content: string;
    targetRole: string;
    authorId: string;
    createdAt: string;
}

export const AnnouncementApi = {
    getAll: async (): Promise<Announcement[]> => {
        return fetchClient<Announcement[]>('/announcements');
    },
    create: async (payload: { title: string; content: string; targetRole: string }) => {
        return fetchClient('/announcements', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },
};
