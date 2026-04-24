import { fetchClient } from '../client';

export interface ChatThread {
    id: string;
    participants: string[];
    lastMessage?: string;
    lastMessageAt?: string;
    unreadCount?: number;
}

export interface Message {
    id: string;
    chatId: string;
    senderId: string;
    content: string;
    createdAt: string;
    sender?: {
        email: string;
        profile?: any;
    }
}

export interface Group {
    id: string;
    name: string;
    description?: string;
    logoUrl?: string;
    memberCount?: number;
}

export const ChatApi = {
    getThreads: async (): Promise<ChatThread[]> => {
        // Backend might not have explicit /chats endpoint for listing
        // Assuming it exists or we mock for now
        return [];
    },

    getMessages: async (chatId: string): Promise<Message[]> => {
        return fetchClient<Message[]>(`/chats/${chatId}/messages`);
    },

    sendMessage: async (chatId: string, content: string): Promise<{ id: string }> => {
        return fetchClient(`/chats/${chatId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        });
    },

    createThread: async (participantIds: string[]): Promise<{ id: string }> => {
        return fetchClient('/chats', {
            method: 'POST',
            body: JSON.stringify({ participantIds }),
        });
    }
};

export const GroupApi = {
    getAll: async (): Promise<Group[]> => {
        return fetchClient<Group[]>('/groups');
    },

    getOne: async (id: string): Promise<Group> => {
        return fetchClient<Group>(`/groups/${id}`);
    },

    getMessages: async (groupId: string): Promise<Message[]> => {
        return fetchClient<Message[]>(`/groups/${groupId}/messages`);
    },

    sendMessage: async (groupId: string, content: string): Promise<{ id: string }> => {
        return fetchClient(`/groups/${groupId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        });
    }
};
