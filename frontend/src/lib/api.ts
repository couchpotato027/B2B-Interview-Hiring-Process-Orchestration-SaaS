let base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
if (!base.startsWith('http')) {
    base = `https://${base}`;
}
export const API_BASE_URL = base.endsWith('/api/v1') ? base : `${base.replace(/\/$/, '')}/api/v1`;

console.log('🌐 [HireFlow API] Initialized with Base URL:', API_BASE_URL);

const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60000; // 60 seconds

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const isGet = !options.method || options.method === 'GET';

    // 1. Return from cache if available and fresh
    if (isGet && apiCache.has(endpoint)) {
        const entry = apiCache.get(endpoint)!;
        if (Date.now() - entry.timestamp < CACHE_TTL) {
            return entry.data;
        }
    }

    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error((data as { message?: string })?.message || 'API request failed');
    }

    // 2. Cache GET results, clear on mutations
    if (isGet) {
        apiCache.set(endpoint, { data, timestamp: Date.now() });
    } else {
        apiCache.clear(); // Clear everything on any POST/PUT/DELETE to ensure consistency
    }

    return data;
}

// ─── Auth ────────────────────────────────────────────────────────────
export const authApi = {
    register: async (data: unknown) => {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            let errorMessage = 'Registration failed';
            if (typeof error.message === 'string') errorMessage = error.message;
            else if (typeof error.error === 'string') errorMessage = error.error;
            else if (error.error?.message) errorMessage = error.error.message;
            throw new Error(errorMessage);
        }
        return response.json();
    },
    login: async (data: unknown) => {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            let errorMessage = 'Login failed';
            if (typeof error.message === 'string') errorMessage = error.message;
            else if (typeof error.error === 'string') errorMessage = error.error;
            else if (error.error?.message) errorMessage = error.error.message;
            throw new Error(errorMessage);
        }
        return response.json();
    },
    getMe: () => fetchWithAuth('/auth/me'),
    listUsers: () => fetchWithAuth('/auth/users'),
    createUser: (data: unknown) => fetchWithAuth('/auth/users', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Dashboard ─────────────────────────────────────────────────────
export const dashboardApi = {
    getStats: () => fetchWithAuth('/dashboard/stats'),
    getAlerts: () => fetchWithAuth('/dashboard/alerts'),
    getPendingEvaluations: () => fetchWithAuth('/dashboard/pending-evaluations'),
};

// ─── Jobs ──────────────────────────────────────────────────────────
export const jobApi = {
    list: (status?: string) => fetchWithAuth(`/jobs${status ? `?status=${status}` : ''}`),
    get: (id: string) => fetchWithAuth(`/jobs/${id}`),
    create: (data: unknown) => fetchWithAuth('/jobs', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) => fetchWithAuth(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    archive: (id: string) => fetchWithAuth(`/jobs/${id}`, { method: 'DELETE' }),
};

// ─── Candidates ────────────────────────────────────────────────────
export const candidateApi = {
    list: (filters?: Record<string, string>) => {
        const params = new URLSearchParams(filters || {}).toString();
        return fetchWithAuth(`/candidates${params ? `?${params}` : ''}`);
    },
    get: (id: string) => fetchWithAuth(`/candidates/${id}`),
    create: (data: unknown) => fetchWithAuth('/candidates', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) => fetchWithAuth(`/candidates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchWithAuth(`/candidates/${id}`, { method: 'DELETE' }),
    moveStage: (id: string, newStageId: string) => fetchWithAuth(`/candidates/${id}/stage`, { method: 'PUT', body: JSON.stringify({ newStageId }) }),
    reject: (id: string) => fetchWithAuth(`/candidates/${id}/reject`, { method: 'POST' }),
    hire: (id: string) => fetchWithAuth(`/candidates/${id}/hire`, { method: 'POST' }),
    bulkUpdate: (candidateIds: string[], action: string, payload: any) => fetchWithAuth('/candidates/bulk-update', { method: 'POST', body: JSON.stringify({ candidateIds, action, payload }) }),
};

// ─── Pipelines ─────────────────────────────────────────────────────
export const pipelineApi = {
    list: () => fetchWithAuth('/pipelines'),
    get: (id: string) => fetchWithAuth(`/pipelines/${id}`),
    create: (data: unknown) => fetchWithAuth('/pipelines', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) => fetchWithAuth(`/pipelines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchWithAuth(`/pipelines/${id}`, { method: 'DELETE' }),
    reorderStages: (id: string, stageOrder: unknown) => fetchWithAuth(`/pipelines/${id}/reorder`, { method: 'PUT', body: JSON.stringify({ stageOrder }) }),
    addStage: (id: string, data: unknown) => fetchWithAuth(`/pipelines/${id}/stages`, { method: 'POST', body: JSON.stringify(data) }),
    deleteStage: (pipelineId: string, stageId: string) => fetchWithAuth(`/pipelines/${pipelineId}/stages/${stageId}`, { method: 'DELETE' }),
};

// ─── Evaluations ───────────────────────────────────────────────────
export const evaluationApi = {
    submit: (data: any) => fetchWithAuth('/evaluations', { method: 'POST', body: JSON.stringify(data) }),
    listForCandidate: (candidateId: string) => fetchWithAuth(`/evaluations/candidate/${candidateId}`),
    aggregate: (candidateId: string) => fetchWithAuth(`/evaluations/aggregate/${candidateId}`, { method: 'POST' }),
    getDecision: (candidateId: string) => fetchWithAuth(`/evaluations/decision/${candidateId}`),
};

// ─── Interviews ────────────────────────────────────────────────────
export const interviewApi = {
    list: (filters?: Record<string, string>) => {
        const params = new URLSearchParams(filters || {}).toString();
        return fetchWithAuth(`/interviews${params ? `?${params}` : ''}`);
    },
    schedule: (data: unknown) => fetchWithAuth('/interviews', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) => fetchWithAuth(`/interviews/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ─── Reports ───────────────────────────────────────────────────────
export const reportsApi = {
    funnel: () => fetchWithAuth('/reports/funnel'),
    dropoff: () => fetchWithAuth('/reports/dropoff'),
    timeToHire: () => fetchWithAuth('/reports/time-to-hire'),
    offerRate: () => fetchWithAuth('/reports/offer-rate'),
};

// ─── Audit ─────────────────────────────────────────────────────────
export const auditApi = {
    list: (page = 1, limit = 50) => fetchWithAuth(`/audit?page=${page}&limit=${limit}`),
};
