import { Deadline, PlannerBlock, User, StudySession } from '../types';

const API_URL = ""; // Relative path for Next.js API routes

export const authApi = {
    login: async (credentials: Record<string, unknown>): Promise<User> => {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Login failed");
        }
        return await response.json();
    },
    signup: async (data: Record<string, unknown>): Promise<User> => {
        const response = await fetch(`${API_URL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Signup failed");
        }
        return await response.json();
    }
};

export const userApi = {
    updateUser: async (userId: string, data: Record<string, unknown>): Promise<User> => {
        const response = await fetch(`${API_URL}/api/user/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error();
        return await response.json();
    },
    updateMascot: async (userId: string, data: Record<string, unknown>): Promise<any> => {
        const response = await fetch(`${API_URL}/api/user/${userId}/mascot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error();
        return await response.json();
    }
};

export const deadlineApi = {
    getDeadlines: async (userId: string): Promise<Deadline[]> => {
        try {
            const response = await fetch(`${API_URL}/api/deadline/${userId}`);
            if (!response.ok) throw new Error();
            return await response.json();
        } catch {
            return [];
        }
    },
    createDeadline: async (deadline: Deadline): Promise<Deadline> => {
        try {
            const response = await fetch(`${API_URL}/api/deadline`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(deadline)
            });
            if (!response.ok) throw new Error();
            return await response.json();
        } catch {
            return { ...deadline, id: Math.random().toString() };
        }
    },
    updateDeadline: async (id: string, deadline: Deadline): Promise<void> => {
        try {
            const response = await fetch(`${API_URL}/api/deadline/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(deadline)
            });
            if (!response.ok) throw new Error();
        } catch {}
    },
    deleteDeadline: async (id: string): Promise<void> => {
        try {
            const response = await fetch(`${API_URL}/api/deadline/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error();
        } catch {}
    }
};

export const plannerApi = {
    getBlocks: async (userId: string): Promise<PlannerBlock[]> => {
        try {
            const response = await fetch(`${API_URL}/api/plannerblock/${userId}`);
            if (!response.ok) throw new Error();
            return await response.json();
        } catch {
            return [];
        }
    },
    createBlock: async (block: PlannerBlock): Promise<PlannerBlock> => {
        try {
            const response = await fetch(`${API_URL}/api/plannerblock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(block)
            });
            if (!response.ok) throw new Error();
            return await response.json();
        } catch {
            return { ...block, id: Math.random().toString() };
        }
    },
    updateBlock: async (id: string, block: PlannerBlock): Promise<void> => {
        try {
            const response = await fetch(`${API_URL}/api/plannerblock/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(block)
            });
            if (!response.ok) throw new Error();
        } catch {}
    },
    deleteBlock: async (id: string): Promise<void> => {
        try {
            const response = await fetch(`${API_URL}/api/plannerblock/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error();
        } catch {}
    }
};

export const sessionApi = {
    getSessions: async (userId: string): Promise<StudySession[]> => {
        try {
            const response = await fetch(`${API_URL}/api/studysession/${userId}`);
            if (!response.ok) throw new Error();
            return await response.json();
        } catch {
            return [];
        }
    },
    createSession: async (session: StudySession): Promise<StudySession> => {
        try {
            const response = await fetch(`${API_URL}/api/studysession`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(session)
            });
            if (!response.ok) throw new Error();
            return await response.json();
        } catch {
            return { ...session, id: Math.random().toString() };
        }
    }
};
