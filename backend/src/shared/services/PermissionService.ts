/**
 * Role-Based Access Control (RBAC) Permission Matrix
 */

export type Role = 'ADMIN' | 'RECRUITER' | 'HIRING_MANAGER' | 'INTERVIEWER' | 'VIEWER';

export type Resource = 'Candidate' | 'Job' | 'Evaluation' | 'Interview' | 'Pipeline' | 'User' | 'Settings' | 'AuditLog';

export type Action = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'SUBMIT_FEEDBACK';

interface PermissionSpec {
    [resource: string]: {
        [action: string]: Role[];
    };
}

const PERMISSION_MATRIX: PermissionSpec = {
    Candidate: {
        CREATE: ['ADMIN', 'RECRUITER'],
        READ: ['ADMIN', 'RECRUITER', 'HIRING_MANAGER', 'INTERVIEWER', 'VIEWER'],
        UPDATE: ['ADMIN', 'RECRUITER'],
        DELETE: ['ADMIN'],
        EXPORT: ['ADMIN'],
    },
    Job: {
        CREATE: ['ADMIN', 'RECRUITER'],
        READ: ['ADMIN', 'RECRUITER', 'HIRING_MANAGER', 'INTERVIEWER', 'VIEWER'],
        UPDATE: ['ADMIN', 'RECRUITER'],
        DELETE: ['ADMIN'],
    },
    Evaluation: {
        CREATE: ['ADMIN', 'RECRUITER', 'INTERVIEWER', 'HIRING_MANAGER'],
        READ: ['ADMIN', 'RECRUITER', 'HIRING_MANAGER', 'INTERVIEWER', 'VIEWER'],
        UPDATE: ['ADMIN', 'RECRUITER', 'INTERVIEWER'],
        DELETE: ['ADMIN'],
    },
    Interview: {
        CREATE: ['ADMIN', 'RECRUITER'],
        READ: ['ADMIN', 'RECRUITER', 'HIRING_MANAGER', 'INTERVIEWER', 'VIEWER'],
        UPDATE: ['ADMIN', 'RECRUITER'],
        DELETE: ['ADMIN'],
        SUBMIT_FEEDBACK: ['ADMIN', 'RECRUITER', 'HIRING_MANAGER', 'INTERVIEWER'],
    },
    Settings: {
        READ: ['ADMIN', 'RECRUITER'],
        UPDATE: ['ADMIN'],
    },
    User: {
        CREATE: ['ADMIN'],
        READ: ['ADMIN'],
        UPDATE: ['ADMIN'],
        DELETE: ['ADMIN'],
    },
    AuditLog: {
        READ: ['ADMIN'],
        EXPORT: ['ADMIN'],
    }
};

export class PermissionService {
    /**
     * Checks if a role has permission to perform an action on a resource.
     */
    public static can(role: string, action: Action, resource: Resource): boolean {
        const normalizedRole = role.toUpperCase() as Role;
        const resourcePermissions = PERMISSION_MATRIX[resource];
        
        if (!resourcePermissions) return false;
        
        const allowedRoles = resourcePermissions[action];
        if (!allowedRoles) return false;
        
        return allowedRoles.includes(normalizedRole);
    }

    /**
     * Get all permissions for a specific role (useful for frontend sync)
     */
    public static getPermissionsForRole(role: string) {
        const normalizedRole = role.toUpperCase() as Role;
        const permissions: Record<string, string[]> = {};

        for (const [resource, actions] of Object.entries(PERMISSION_MATRIX)) {
            permissions[resource] = Object.entries(actions)
                .filter(([_, roles]) => roles.includes(normalizedRole))
                .map(([action, _]) => action);
        }

        return permissions;
    }
}
