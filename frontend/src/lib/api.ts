const envUrl = process.env.NEXT_PUBLIC_API_URL;
let base = envUrl || 'http://localhost:3001';

if (!base.startsWith('http')) {
    base = `https://${base}`;
}
export const API_BASE_URL = base.endsWith('/api/v1') ? base : `${base.replace(/\/$/, '')}/api/v1`;

console.log('🌐 [HireFlow API] Initializing...');
console.log('   - ENV Source:', envUrl || '(using fallback)');
console.log('   - Computed Base:', API_BASE_URL);

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
    // Don't set Content-Type if we're sending FormData (browser set it with boundary)
    if (!(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

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
    updatePreferences: (data: { language: string }) => fetchWithAuth('/auth/preferences', { method: 'PATCH', body: JSON.stringify(data) }),
};

// ─── Dashboard ─────────────────────────────────────────────────────
export const dashboardApi = {
    getStats: () => fetchWithAuth('/dashboard/stats'),
    getMetrics: (dateRange: string) => fetchWithAuth(`/dashboard/metrics?dateRange=${dateRange}`),
    getTrends: (metric: string, dateRange: string) => fetchWithAuth(`/dashboard/trends?metric=${metric}&dateRange=${dateRange}`),
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
    configureScoring: (id: string, weights: any) => fetchWithAuth(`/jobs/${id}/configure-scoring`, { method: 'POST', body: JSON.stringify({ weights }) }),
};

// ─── Candidates ────────────────────────────────────────────────────
export interface CandidateFilters {
    search?: string;
    status?: string;
    stage?: string;
    sort?: 'createdAt' | 'name' | 'email' | 'status';
    order?: 'asc' | 'desc';
    dateRange?: '7d' | '30d' | '90d';
}

export const candidateApi = {
    list: (filters?: CandidateFilters) => {
        const params = new URLSearchParams();
        if (filters?.search) params.set('search', filters.search);
        if (filters?.status) params.set('status', filters.status);
        if (filters?.stage) params.set('stage', filters.stage);
        if (filters?.sort) params.set('sort', filters.sort);
        if (filters?.order) params.set('order', filters.order);
        if (filters?.dateRange) params.set('dateRange', filters.dateRange);
        const qs = params.toString();
        return fetchWithAuth(`/candidates${qs ? `?${qs}` : ''}`);
    },
    get: (id: string) => fetchWithAuth(`/candidates/${id}`),
    create: (data: unknown) => fetchWithAuth('/candidates', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) => fetchWithAuth(`/candidates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchWithAuth(`/candidates/${id}`, { method: 'DELETE' }),
    moveStage: (id: string, newStageId: string) => fetchWithAuth(`/candidates/${id}/stage`, { method: 'PUT', body: JSON.stringify({ newStageId }) }),
    reject: (id: string) => fetchWithAuth(`/candidates/${id}/reject`, { method: 'POST' }),
    hire: (id: string) => fetchWithAuth(`/candidates/${id}/hire`, { method: 'POST' }),
    getTimeline: (id: string) => fetchWithAuth(`/candidates/${id}/timeline`),
    getInterviews: (id: string) => fetchWithAuth(`/candidates/${id}/interviews`),
    bulkUpdate: (candidateIds: string[], action: string, payload: any) =>
        fetchWithAuth('/candidates/bulk-update', { method: 'POST', body: JSON.stringify({ candidateIds, action, payload }) }),
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
    list: (filters?: { candidateId?: string; interviewerId?: string; status?: string }) => {
        const params = new URLSearchParams(filters as any).toString();
        return fetchWithAuth(`/interviews${params ? `?${params}` : ''}`);
    },
    schedule: (data: {
        candidateId: string;
        stageId: string;
        title: string;
        type: 'phone' | 'video' | 'onsite' | 'technical';
        scheduledAt: string;
        duration: number;
        notes?: string;
        panel: Array<{ userId: string; role: 'lead' | 'shadow' | 'observer' }>;
    }) => fetchWithAuth('/interviews/schedule', { method: 'POST', body: JSON.stringify(data) }),
    submitFeedback: (id: string, feedback: {
        rating: number;
        recommendation: string;
        notes: string;
        strengths: string[];
        weaknesses: string[];
        rubricResponses?: Record<string, any>;
    }) => fetchWithAuth(`/interviews/${id}/feedback`, { method: 'POST', body: JSON.stringify({ feedback }) }),
    forCandidate: (candidateId: string) => fetchWithAuth(`/interviews/candidate/${candidateId}`),
    checkAvailability: (userIds: string[], start: string, end: string) => 
        fetchWithAuth(`/interviews/availability?userIds=${userIds.join(',')}&start=${start}&end=${end}`),
};

// ─── Reports ───────────────────────────────────────────────────────
export const reportsApi = {
    funnel: () => fetchWithAuth('/reports/funnel'),
    dropoff: () => fetchWithAuth('/reports/dropoff'),
    timeToHire: () => fetchWithAuth('/reports/time-to-hire'),
    offerRate: () => fetchWithAuth('/reports/offer-rate'),
};

// ─── Audit & Compliance ───────────────────────────────────────────
export const auditApi = {
    list: (filters?: { page?: number; limit?: number; userId?: string; action?: string; resource?: string }) => {
        const params = new URLSearchParams(filters as any).toString();
        return fetchWithAuth(`/audit${params ? `?${params}` : ''}`);
    },
};

export const complianceApi = {
    getAuditLogs: (params?: any) => {
        const query = new URLSearchParams(params).toString();
        return fetchWithAuth(`/compliance/audit-logs${query ? `?${query}` : ''}`);
    },
    deleteCandidateData: (candidateId: string) => fetchWithAuth('/compliance/delete-data', { method: 'POST', body: JSON.stringify({ candidateId }) }),
    exportCandidateData: (candidateId: string) => fetchWithAuth('/compliance/export-data', { method: 'POST', body: JSON.stringify({ candidateId }) }),
};

export const emailApi = {
    getTemplates: () => fetchWithAuth('/emails/templates'),
    send: (data: any) => fetchWithAuth('/emails/send', { method: 'POST', body: JSON.stringify(data) }),
    bulkSend: (data: any) => fetchWithAuth('/emails/bulk', { method: 'POST', body: JSON.stringify(data) }),
    getHistory: (candidateId: string) => fetchWithAuth(`/emails/history/${candidateId}`),
};

export const notificationApi = {
    getNotifications: () => fetchWithAuth('/notifications'),
    markAsRead: (id: string) => fetchWithAuth(`/notifications/${id}/read`, { method: 'PUT' }),
    markAllAsRead: () => fetchWithAuth('/notifications/read-all', { method: 'PUT' }),
};

export const exchangeApi = {
    exportCandidates: (format: 'csv' | 'json', filters?: any) => 
        fetchWithAuth(`/exchange/candidates/export?format=${format}`, { 
            method: 'POST', 
            body: JSON.stringify({ filters }) 
        }),
    importCandidates: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return fetchWithAuth('/exchange/candidates/import', { 
            method: 'POST', 
            body: formData 
        });
    },
    getTemplate: () => fetchWithAuth('/exchange/candidates/template'),
};
