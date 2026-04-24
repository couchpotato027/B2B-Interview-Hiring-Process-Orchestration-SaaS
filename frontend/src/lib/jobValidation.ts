/**
 * jobValidation.ts
 * Pure validation logic — no React, no API calls.
 * Used by CreateJobModal and useCreateJob hook.
 */

export interface JobFormValues {
    title: string;
    department: string;
    description: string;
    requiredSkills: string[];     // array of trimmed skill tags
    preferredSkills: string[];
    requiredExperience: number;
    pipelineTemplateId: string;
}

export interface JobFormErrors {
    title?: string;
    department?: string;
    description?: string;
    requiredSkills?: string;
    preferredSkills?: string;
    requiredExperience?: string;
}

/** Validate the entire form. Returns an error map (empty = valid). */
export function validateJobForm(values: JobFormValues): JobFormErrors {
    const errors: JobFormErrors = {};

    // Title
    if (!values.title.trim()) {
        errors.title = 'Job title is required.';
    } else if (values.title.trim().length > 100) {
        errors.title = 'Job title must be 100 characters or fewer.';
    }

    // Department
    if (!values.department.trim()) {
        errors.department = 'Department is required.';
    } else if (values.department.trim().length > 50) {
        errors.department = 'Department must be 50 characters or fewer.';
    }

    // Description
    if (values.description.length > 1000) {
        errors.description = 'Description must be 1000 characters or fewer.';
    }

    // Required skills — backend requires at least 1
    const validRequired = values.requiredSkills.filter(s => s.trim().length > 0);
    if (validRequired.length === 0) {
        errors.requiredSkills = 'Add at least one required skill.';
    }

    // Required experience
    if (isNaN(values.requiredExperience) || values.requiredExperience < 0) {
        errors.requiredExperience = 'Enter a valid number (0 or more).';
    } else if (values.requiredExperience > 30) {
        errors.requiredExperience = 'Maximum is 30 years.';
    }

    return errors;
}

/** True when the form has no validation errors and all required fields are filled. */
export function isFormValid(values: JobFormValues): boolean {
    return Object.keys(validateJobForm(values)).length === 0;
}

/** Build the API payload from form values. */
export function buildJobPayload(values: JobFormValues) {
    return {
        title: values.title.trim(),
        department: values.department.trim(),
        description: values.description.trim() || ' ', // backend requires min(1); space acceptable
        requiredSkills: values.requiredSkills.map(s => s.trim()).filter(Boolean),
        preferredSkills: values.preferredSkills.map(s => s.trim()).filter(Boolean),
        requiredExperience: values.requiredExperience,
        ...(values.pipelineTemplateId ? { pipelineTemplateId: values.pipelineTemplateId } : {}),
    };
}
