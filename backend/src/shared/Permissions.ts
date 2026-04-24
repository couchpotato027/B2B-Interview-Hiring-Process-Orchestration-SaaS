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
    [Action.CREATE]: ['ADMIN', 'RECRUITER'],
    [Action.READ]: ['ADMIN', 'RECRUITER', 'HIRING_MANAGER', 'INTERVIEWER', 'VIEWER'],
    [Action.UPDATE]: ['ADMIN', 'RECRUITER'],
    [Action.DELETE]: ['ADMIN'],
    [Action.EXPORT]: ['ADMIN']
  },
  [Resource.JOB]: {
    [Action.CREATE]: ['ADMIN', 'RECRUITER'],
    [Action.READ]: ['ADMIN', 'RECRUITER', 'HIRING_MANAGER', 'INTERVIEWER', 'VIEWER'],
    [Action.UPDATE]: ['ADMIN', 'RECRUITER'],
    [Action.DELETE]: ['ADMIN']
  },
  [Resource.EVALUATION]: {
    [Action.CREATE]: ['ADMIN', 'RECRUITER'],
    [Action.READ]: ['ADMIN', 'RECRUITER', 'HIRING_MANAGER', 'INTERVIEWER', 'VIEWER'],
    [Action.UPDATE]: ['ADMIN', 'RECRUITER'],
    [Action.DELETE]: ['ADMIN']
  },
  [Resource.INTERVIEW]: {
    [Action.CREATE]: ['ADMIN', 'RECRUITER'],
    [Action.READ]: ['ADMIN', 'RECRUITER', 'HIRING_MANAGER', 'INTERVIEWER', 'VIEWER'],
    [Action.SUBMIT_FEEDBACK]: ['ADMIN', 'RECRUITER', 'HIRING_MANAGER', 'INTERVIEWER']
  },
  [Resource.SETTINGS]: {
    [Action.READ]: ['ADMIN', 'RECRUITER', 'HIRING_MANAGER'],
    [Action.UPDATE]: ['ADMIN']
  },
  [Resource.USER]: {
    [Action.CREATE]: ['ADMIN'],
    [Action.READ]: ['ADMIN', 'RECRUITER'],
    [Action.UPDATE]: ['ADMIN'],
    [Action.DELETE]: ['ADMIN']
  }
};

export const hasPermission = (role: string, resource: string, action: string): boolean => {
  const allowedRoles = PERMISSION_MATRIX[resource]?.[action] || [];
  return allowedRoles.includes(role);
};
