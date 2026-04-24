/**
 * useCreateJob.ts
 * Custom hook that owns all state and side-effects for the Create Job flow.
 * The modal component stays purely presentational.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { jobApi, pipelineApi } from '@/lib/api';
import { JobFormValues, JobFormErrors, validateJobForm, isFormValid, buildJobPayload } from '@/lib/jobValidation';
import toast from 'react-hot-toast';

// ─── Constants ────────────────────────────────────────────────────────────────
const TIMEOUT_MS = 10_000;

const EMPTY: JobFormValues = {
    title: '',
    department: '',
    description: '',
    requiredSkills: [],
    preferredSkills: [],
    requiredExperience: 0,
    pipelineTemplateId: '',
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Pipeline {
    id: string;
    name: string;
    roleType?: string;
    stages?: unknown[];
}

export interface UseCreateJobReturn {
    // Form state
    values: JobFormValues;
    errors: JobFormErrors;
    touched: Partial<Record<keyof JobFormValues, boolean>>;
    isValid: boolean;
    isDirty: boolean;

    // Submission state
    isSubmitting: boolean;

    // Pipeline templates
    pipelines: Pipeline[];
    pipelinesLoading: boolean;
    pipelinesError: string | null;

    // Handlers
    handleChange: <K extends keyof JobFormValues>(field: K, value: JobFormValues[K]) => void;
    handleBlur: (field: keyof JobFormValues) => void;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    handleReset: () => void;
    addSkill: (type: 'required' | 'preferred', skill: string) => void;
    removeSkill: (type: 'required' | 'preferred', index: number) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useCreateJob(onSuccess: (job: unknown) => void): UseCreateJobReturn {
    const [values, setValues] = useState<JobFormValues>(EMPTY);
    const [touched, setTouched] = useState<Partial<Record<keyof JobFormValues, boolean>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pipelines, setPipelines] = useState<Pipeline[]>([]);
    const [pipelinesLoading, setPipelinesLoading] = useState(true);
    const [pipelinesError, setPipelinesError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    // Compute derived state
    const errors = validateJobForm(values);
    // Only show errors for touched fields (except on submit attempt)
    const visibleErrors: JobFormErrors = Object.fromEntries(
        Object.entries(errors).filter(([key]) => touched[key as keyof JobFormValues])
    );
    const isValid = isFormValid(values);
    const isDirty = JSON.stringify(values) !== JSON.stringify(EMPTY);

    // Fetch pipeline templates when hook mounts
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await pipelineApi.list();
                if (!cancelled) setPipelines(Array.isArray(data) ? data : []);
            } catch (err: any) {
                if (!cancelled) {
                    console.error('[useCreateJob] Failed to load pipelines:', err);
                    setPipelinesError('Could not load templates. You can still create the job without one.');
                }
            } finally {
                if (!cancelled) setPipelinesLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // Generic field change — marks field as touched on first change
    const handleChange = useCallback(<K extends keyof JobFormValues>(field: K, value: JobFormValues[K]) => {
        setValues(v => ({ ...v, [field]: value }));
        setTouched(t => ({ ...t, [field]: true }));
    }, []);

    // Mark field as touched on blur (triggers validation display)
    const handleBlur = useCallback((field: keyof JobFormValues) => {
        setTouched(t => ({ ...t, [field]: true }));
    }, []);

    // Skill tag helpers
    const addSkill = useCallback((type: 'required' | 'preferred', skill: string) => {
        const trimmed = skill.trim();
        if (!trimmed) return;
        const field = type === 'required' ? 'requiredSkills' : 'preferredSkills';
        setValues(v => {
            if ((v[field] as string[]).includes(trimmed)) return v; // deduplicate
            return { ...v, [field]: [...(v[field] as string[]), trimmed] };
        });
        setTouched(t => ({ ...t, [field]: true }));
    }, []);

    const removeSkill = useCallback((type: 'required' | 'preferred', index: number) => {
        const field = type === 'required' ? 'requiredSkills' : 'preferredSkills';
        setValues(v => ({ ...v, [field]: (v[field] as string[]).filter((_, i) => i !== index) }));
        setTouched(t => ({ ...t, [field]: true }));
    }, []);

    // Reset form
    const handleReset = useCallback(() => {
        setValues(EMPTY);
        setTouched({});
    }, []);

    // Submit handler with timeout + abort
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        // Touch all fields to reveal all errors
        const allTouched = Object.keys(EMPTY).reduce((acc, k) => ({ ...acc, [k]: true }), {});
        setTouched(allTouched as typeof touched);

        if (!isValid) {
            console.warn('[useCreateJob] Submit blocked — form has errors:', errors);
            return;
        }

        // Cancel any in-flight request
        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;

        const timeoutId = setTimeout(() => ac.abort(), TIMEOUT_MS);

        setIsSubmitting(true);
        const payload = buildJobPayload(values);
        console.log('[useCreateJob] Submitting payload:', payload);

        try {
            const created = await jobApi.create(payload);
            console.log('[useCreateJob] Created job:', created);
            toast.success(`"${payload.title}" created successfully! 🎉`);
            onSuccess(created);
            handleReset();
        } catch (err: any) {
            if (err.name === 'AbortError') {
                toast.error('Request timed out — please try again.');
            } else if (err.message?.includes('401') || err.message?.toLowerCase().includes('unauthorized')) {
                toast.error('Session expired — please log in again.');
            } else if (err.message?.includes('400')) {
                toast.error(`Validation error: ${err.message}`);
            } else {
                toast.error(err.message || 'Failed to create job. Please try again.');
            }
            console.error('[useCreateJob] Submission failed:', err);
        } finally {
            clearTimeout(timeoutId);
            setIsSubmitting(false);
        }
    }, [values, isValid, errors, onSuccess, handleReset]);

    return {
        values, errors: visibleErrors, touched, isValid, isDirty,
        isSubmitting,
        pipelines, pipelinesLoading, pipelinesError,
        handleChange, handleBlur, handleSubmit, handleReset,
        addSkill, removeSkill,
    };
}
