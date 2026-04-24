import { useMemo } from 'react';

export enum Role {
  ADMIN = 'ADMIN',
  RECRUITER = 'RECRUITER',
  HIRING_MANAGER = 'HIRING_MANAGER',
  INTERVIEWER = 'INTERVIEWER',
  VIEWER = 'VIEWER',
}

export enum Resource {
  CANDIDATE = 'Candidate',
  JOB = 'Job',
  EVALUATION = 'Evaluation',
  PIPELINE = 'Pipeline',
  USER = 'User',
  SETTINGS = 'Settings',
  INTERVIEW = 'Interview'
}

export enum Action {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  EXPORT = 'EXPORT',
  SUBMIT_FEEDBACK = 'SUBMIT_FEEDBACK'
}

export const PERMISSION_MATRIX: Record<string, Record<string, string[]>> = {
  [Resource.CANDIDATE]: {
    [Action.CREATE]: [Role.ADMIN, Role.RECRUITER],
    [Action.READ]: [Role.ADMIN, Role.RECRUITER, Role.HIRING_MANAGER, Role.INTERVIEWER, Role.VIEWER],
    [Action.UPDATE]: [Role.ADMIN, Role.RECRUITER],
    [Action.DELETE]: [Role.ADMIN],
    [Action.EXPORT]: [Role.ADMIN]
  },
  [Resource.JOB]: {
    [Action.CREATE]: [Role.ADMIN, Role.RECRUITER],
    [Action.READ]: [Role.ADMIN, Role.RECRUITER, Role.HIRING_MANAGER, Role.INTERVIEWER, Role.VIEWER],
    [Action.UPDATE]: [Role.ADMIN, Role.RECRUITER],
    [Action.DELETE]: [Role.ADMIN]
  },
  [Resource.EVALUATION]: {
    [Action.CREATE]: [Role.ADMIN, Role.RECRUITER],
    [Action.READ]: [Role.ADMIN, Role.RECRUITER, Role.HIRING_MANAGER, Role.INTERVIEWER, Role.VIEWER],
    [Action.UPDATE]: [Role.ADMIN, Role.RECRUITER],
    [Action.DELETE]: [Role.ADMIN]
  },
  [Resource.INTERVIEW]: {
    [Action.CREATE]: [Role.ADMIN, Role.RECRUITER],
    [Action.READ]: [Role.ADMIN, Role.RECRUITER, Role.HIRING_MANAGER, Role.INTERVIEWER, Role.VIEWER],
    [Action.SUBMIT_FEEDBACK]: [Role.ADMIN, Role.RECRUITER, Role.HIRING_MANAGER, Role.INTERVIEWER]
  },
  [Resource.SETTINGS]: {
    [Action.READ]: [Role.ADMIN, Role.RECRUITER, Role.HIRING_MANAGER],
    [Action.UPDATE]: [Role.ADMIN]
  },
  [Resource.USER]: {
    [Action.CREATE]: [Role.ADMIN],
    [Action.READ]: [Role.ADMIN, Role.RECRUITER],
    [Action.UPDATE]: [Role.ADMIN],
    [Action.DELETE]: [Role.ADMIN]
  }
};

export const hasPermission = (userRole: string | undefined, resource: Resource, action: Action): boolean => {
  if (!userRole) return false;
  const allowedRoles = PERMISSION_MATRIX[resource]?.[action] || [];
  return allowedRoles.includes(userRole as Role);
};

export const usePermission = (resource: Resource, action: Action) => {
  // In a real app, you'd get the user from an AuthContext
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const userRole = user.role as Role;

  return useMemo(() => hasPermission(userRole, resource, action), [userRole, resource, action]);
};
