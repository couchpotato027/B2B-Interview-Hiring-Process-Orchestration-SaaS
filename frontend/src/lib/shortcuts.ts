export interface Shortcut {
  key: string;
  command: string;
  category: 'Navigation' | 'Actions' | 'Selection' | 'Pipeline';
  description: string;
}

export const GLOBAL_SHORTCUTS: Shortcut[] = [
  // Navigation
  { key: 'g d', command: '/dashboard', category: 'Navigation', description: 'Go to Dashboard' },
  { key: 'g j', command: '/dashboard/jobs', category: 'Navigation', description: 'Go to Jobs' },
  { key: 'g c', command: '/dashboard/candidates', category: 'Navigation', description: 'Go to Candidates' },
  { key: 'g p', command: '/dashboard/pipelines', category: 'Navigation', description: 'Go to Pipeline Board' },
  { key: 'g r', command: '/dashboard/reports', category: 'Navigation', description: 'Go to Reports' },
  { key: '/', command: 'focus-search', category: 'Navigation', description: 'Focus Search Bar' },
  
  // Actions
  { key: 'c', command: 'create-new', category: 'Actions', description: 'Create New (Context-aware)' },
  { key: 'k', command: 'open-palette', category: 'Actions', description: 'Open Command Palette' },
  { key: '?', command: 'show-help', category: 'Actions', description: 'Show Shortcuts Help' },
  { key: 's', command: 'save', category: 'Actions', description: 'Save Changes' },
  { key: 'Escape', command: 'cancel', category: 'Actions', description: 'Close or Cancel' },

  // Selection
  { key: 'j', command: 'next-item', category: 'Selection', description: 'Next Item' },
  { key: 'k', command: 'prev-item', category: 'Selection', description: 'Previous Item' },
  { key: 'Enter', command: 'select-item', category: 'Selection', description: 'Open Selected Item' },
];

export const COMMANDS = [
    { id: 'create-job', title: 'Create new job posting', category: 'Jobs', shortcut: 'c' },
    { id: 'add-candidate', title: 'Add new candidate', category: 'Candidates', shortcut: 'c' },
    { id: 'view-audit', title: 'View security audit logs', category: 'Settings', shortcut: 'g a' },
    { id: 'export-data', title: 'Export all candidates (CSV)', category: 'Actions', shortcut: 'Shift+E' },
    { id: 'run-compliance', title: 'Run GDPR compliance check', category: 'Compliance', shortcut: 'Alt+G' },
    { id: 'switch-theme', title: 'Toggle dark/light mode', category: 'Settings', shortcut: 'Alt+T' },
];
