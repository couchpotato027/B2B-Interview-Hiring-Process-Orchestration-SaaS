export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    // In a real application, you'd get this from a secure HTTP cookie or Context API
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'API Request failed');
    }

    return response.json();
}

// Example API method
export const candidateApi = {
    addCandidate: async (data: { firstName: string; lastName: string; email: string; pipelineId: string; initialStageId: string }) => {
        return fetchWithAuth('/candidates', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    moveStage: async (candidateId: string, newStageId: string) => {
        return fetchWithAuth(`/candidates/${candidateId}/transition`, {
            method: 'POST',
            body: JSON.stringify({ newStageId }),
        });
    }
};

export const authApi = {
    register: async (data: any) => {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || error.error || 'Registration failed');
        }
        return response.json();
    },
    login: async (data: any) => {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || error.error || 'Login failed');
        }
        return response.json();
    }
};
