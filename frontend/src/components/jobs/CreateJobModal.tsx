'use client';

/**
 * CreateJobModal.tsx
 * Production-ready Create Job modal.
 * - All logic lives in useCreateJob hook
 * - Fully accessible: focus-trap, ARIA labels, keyboard nav
 * - Skill tag multi-input with Enter/comma trigger
 * - Unsaved-changes guard on close
 */

import React, { useEffect, useRef, useCallback } from 'react';
import {
    X, Briefcase, Loader2, CheckCircle2, Plus, AlertCircle,
    ChevronDown, Info, Tag,
} from 'lucide-react';
import { useCreateJob } from '@/hooks/useCreateJob';
import { JobFormValues } from '@/lib/jobValidation';

// ─── Props ────────────────────────────────────────────────────────────────────
interface CreateJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    onJobCreated: (job: unknown) => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface FieldWrapperProps {
    label: string;
    htmlFor: string;
    required?: boolean;
    hint?: string;
    error?: string;
    charCount?: { current: number; max: number };
    children: React.ReactNode;
}

const FieldWrapper: React.FC<FieldWrapperProps> = ({ label, htmlFor, required, hint, error, charCount, children }) => (
    <div className="space-y-1.5">
        <div className="flex items-center justify-between">
            <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-700">
                {label} {required && <span className="text-red-500" aria-hidden>*</span>}
            </label>
            {charCount && (
                <span className={`text-xs tabular-nums ${charCount.current > charCount.max * 0.9 ? 'text-amber-500' : 'text-slate-400'}`}>
                    {charCount.current}/{charCount.max}
                </span>
            )}
        </div>
        {hint && <p className="text-xs text-slate-400 flex items-center gap-1"><Info className="h-3 w-3" />{hint}</p>}
        {children}
        {error && (
            <p className="text-xs text-red-500 flex items-center gap-1" role="alert" aria-live="polite">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />{error}
            </p>
        )}
    </div>
);

interface SkillInputProps {
    id: string;
    label: string;
    skills: string[];
    onAdd: (skill: string) => void;
    onRemove: (index: number) => void;
    error?: string;
    required?: boolean;
    placeholder?: string;
}

const SkillInput: React.FC<SkillInputProps> = ({ id, label, skills, onAdd, onRemove, error, required, placeholder }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const commit = (raw: string) => {
        raw.split(',').map(s => s.trim()).filter(Boolean).forEach(onAdd);
        if (inputRef.current) inputRef.current.value = '';
    };

    const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commit(inputRef.current?.value || '');
        }
        if (e.key === 'Backspace' && !inputRef.current?.value && skills.length) {
            onRemove(skills.length - 1);
        }
    };

    return (
        <FieldWrapper label={label} htmlFor={id} required={required} error={error}
            hint="Type and press Enter or comma to add. Backspace removes last tag.">
            <div
                className={`flex flex-wrap gap-1.5 min-h-[44px] w-full rounded-xl border-0 py-2 px-3 ring-1 ring-inset transition-all bg-slate-50 focus-within:ring-2 cursor-text ${error ? 'ring-red-300 focus-within:ring-red-500' : 'ring-slate-200 focus-within:ring-[#c8ff00]'}`}
                onClick={() => inputRef.current?.focus()}
            >
                {skills.map((skill, i) => (
                    <span key={i} className="inline-flex items-center gap-1 rounded-full bg-[#0a0f1a] px-2.5 py-1 text-xs font-semibold text-white">
                        <Tag className="h-2.5 w-2.5 text-[#c8ff00]" />{skill}
                        <button
                            type="button"
                            onClick={e => { e.stopPropagation(); onRemove(i); }}
                            className="ml-0.5 rounded-full hover:bg-white/20 p-0.5"
                            aria-label={`Remove ${skill}`}
                        >
                            <X className="h-2.5 w-2.5" />
                        </button>
                    </span>
                ))}
                <input
                    ref={inputRef}
                    id={id}
                    type="text"
                    placeholder={skills.length === 0 ? (placeholder || 'Add skill…') : ''}
                    onKeyDown={handleKey}
                    onBlur={e => { if (e.target.value) commit(e.target.value); }}
                    className="flex-1 min-w-[120px] bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    aria-label={label}
                />
            </div>
        </FieldWrapper>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const CreateJobModal: React.FC<CreateJobModalProps> = ({ isOpen, onClose, onJobCreated }) => {
    const firstFieldRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const handleSuccess = useCallback((job: unknown) => {
        onJobCreated(job);
        onClose();
    }, [onJobCreated, onClose]);

    const {
        values, errors, isValid, isDirty, isSubmitting,
        pipelines, pipelinesLoading, pipelinesError,
        handleChange, handleBlur, handleSubmit, handleReset,
        addSkill, removeSkill,
    } = useCreateJob(handleSuccess);

    // Auto-focus first field when modal opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => firstFieldRef.current?.focus(), 80);
        }
    }, [isOpen]);

    // Escape key to close, with unsaved-changes guard
    const handleEscape = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            if (isDirty && !confirm('You have unsaved changes. Close anyway?')) return;
            handleReset();
            onClose();
        }
    }, [isDirty, handleReset, onClose]);

    useEffect(() => {
        if (!isOpen) return;
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, handleEscape]);

    // Focus trap
    useEffect(() => {
        if (!isOpen || !modalRef.current) return;
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const trap = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;
            if (e.shiftKey) { if (document.activeElement === first) { last?.focus(); e.preventDefault(); } }
            else { if (document.activeElement === last) { first?.focus(); e.preventDefault(); } }
        };
        document.addEventListener('keydown', trap);
        return () => document.removeEventListener('keydown', trap);
    }, [isOpen]);

    const handleOverlayClick = () => {
        if (isSubmitting) return;
        if (isDirty && !confirm('You have unsaved changes. Close anyway?')) return;
        handleReset();
        onClose();
    };

    const inputClass = (field: keyof JobFormValues) =>
        `block w-full rounded-xl border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset sm:text-sm outline-none transition-all bg-slate-50 focus:ring-2 focus:ring-inset ${errors[field as keyof typeof errors] ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-200 focus:ring-[#c8ff00]'}`;

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-job-title"
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={handleOverlayClick}
                aria-hidden="true"
            />

            {/* Modal panel */}
            <div
                ref={modalRef}
                className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl animate-in slide-in-from-bottom-6 duration-300 overflow-hidden"
            >
                {/* ── Header ──────────────────────────────────────────── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-[#c8ff00] p-2 shadow-sm">
                            <Briefcase className="h-5 w-5 text-[#0a0f1a]" />
                        </div>
                        <div>
                            <h2 id="create-job-title" className="text-lg font-bold text-slate-900">Create New Job</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Fields marked <span className="text-red-500">*</span> are required</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleOverlayClick}
                        disabled={isSubmitting}
                        className="rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                        aria-label="Close modal"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* ── Form ────────────────────────────────────────────── */}
                <form onSubmit={handleSubmit} noValidate>
                    <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">

                        {/* Row 1: Title + Department */}
                        <div className="grid grid-cols-2 gap-4">
                            <FieldWrapper label="Job Title" htmlFor="job-title" required error={errors.title}
                                charCount={{ current: values.title.length, max: 100 }}>
                                <input
                                    id="job-title"
                                    ref={firstFieldRef}
                                    type="text"
                                    maxLength={100}
                                    value={values.title}
                                    onChange={e => handleChange('title', e.target.value)}
                                    onBlur={() => handleBlur('title')}
                                    placeholder="e.g. Senior Frontend Engineer"
                                    className={inputClass('title')}
                                    aria-required="true"
                                    aria-invalid={!!errors.title}
                                    aria-describedby={errors.title ? 'job-title-error' : undefined}
                                />
                            </FieldWrapper>

                            <FieldWrapper label="Department" htmlFor="job-dept" required error={errors.department}
                                charCount={{ current: values.department.length, max: 50 }}>
                                <input
                                    id="job-dept"
                                    type="text"
                                    maxLength={50}
                                    value={values.department}
                                    onChange={e => handleChange('department', e.target.value)}
                                    onBlur={() => handleBlur('department')}
                                    placeholder="e.g. Engineering"
                                    className={inputClass('department')}
                                    aria-required="true"
                                    aria-invalid={!!errors.department}
                                />
                            </FieldWrapper>
                        </div>

                        {/* Description */}
                        <FieldWrapper label="Description" htmlFor="job-desc"
                            charCount={{ current: values.description.length, max: 1000 }}
                            error={errors.description}
                            hint="Describe responsibilities, team, and growth opportunities.">
                            <textarea
                                id="job-desc"
                                rows={3}
                                maxLength={1000}
                                value={values.description}
                                onChange={e => handleChange('description', e.target.value)}
                                onBlur={() => handleBlur('description')}
                                placeholder="What will this person do day-to-day? What team will they join?"
                                className={`${inputClass('description')} resize-none`}
                                aria-invalid={!!errors.description}
                            />
                        </FieldWrapper>

                        {/* Required Skills */}
                        <SkillInput
                            id="required-skills"
                            label="Required Skills"
                            skills={values.requiredSkills}
                            onAdd={s => addSkill('required', s)}
                            onRemove={i => removeSkill('required', i)}
                            error={errors.requiredSkills}
                            required
                            placeholder="e.g. React, Node.js, TypeScript"
                        />

                        {/* Preferred Skills */}
                        <SkillInput
                            id="preferred-skills"
                            label="Preferred Skills"
                            skills={values.preferredSkills}
                            onAdd={s => addSkill('preferred', s)}
                            onRemove={i => removeSkill('preferred', i)}
                            placeholder="e.g. Docker, Kubernetes, AWS"
                        />

                        {/* Row 2: Experience + Pipeline */}
                        <div className="grid grid-cols-2 gap-4">
                            <FieldWrapper label="Min. Experience (years)" htmlFor="job-exp" required error={errors.requiredExperience}>
                                <input
                                    id="job-exp"
                                    type="number"
                                    min={0}
                                    max={30}
                                    step={0.5}
                                    value={values.requiredExperience}
                                    onChange={e => handleChange('requiredExperience', parseFloat(e.target.value) || 0)}
                                    onBlur={() => handleBlur('requiredExperience')}
                                    className={inputClass('requiredExperience')}
                                    aria-required="true"
                                    aria-invalid={!!errors.requiredExperience}
                                />
                            </FieldWrapper>

                            <FieldWrapper label="Pipeline Template" htmlFor="job-pipeline">
                                <div className="relative">
                                    <select
                                        id="job-pipeline"
                                        value={values.pipelineTemplateId}
                                        onChange={e => handleChange('pipelineTemplateId', e.target.value)}
                                        disabled={pipelinesLoading}
                                        className="block w-full rounded-xl border-0 py-2.5 pl-3 pr-8 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-[#c8ff00] sm:text-sm outline-none transition-all bg-slate-50 appearance-none cursor-pointer disabled:opacity-60"
                                        aria-label="Pipeline template (optional)"
                                    >
                                        {pipelinesLoading
                                            ? <option>Loading templates…</option>
                                            : <>
                                                <option value="">None (optional)</option>
                                                {pipelines.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </>
                                        }
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                </div>
                                {pipelinesError && (
                                    <p className="text-xs text-amber-500 flex items-center gap-1 mt-1">
                                        <AlertCircle className="h-3 w-3" />{pipelinesError}
                                    </p>
                                )}
                            </FieldWrapper>
                        </div>
                    </div>

                    {/* ── Footer ──────────────────────────────────────── */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                        <button
                            type="button"
                            onClick={() => { handleReset(); }}
                            disabled={isSubmitting || !isDirty}
                            className="text-sm text-slate-500 hover:text-slate-700 underline underline-offset-2 disabled:opacity-40 disabled:no-underline transition-colors"
                        >
                            Clear form
                        </button>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleOverlayClick}
                                disabled={isSubmitting}
                                className="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all active:scale-95 ${isSubmitting || !isValid ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#0a0f1a] hover:bg-slate-800'}`}
                                aria-busy={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="h-4 w-4 animate-spin" />Creating…</>
                                ) : (
                                    <><CheckCircle2 className="h-4 w-4 text-[#c8ff00]" />Create Job</>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
