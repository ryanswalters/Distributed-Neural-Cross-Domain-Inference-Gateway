
export type ToolCategory = keyof typeof TOOL_CATEGORIES;
export type WorkflowStepType = keyof typeof WORKFLOW_STEP_TYPES;

export const TOOL_CATEGORIES = {
  code: { label: 'Code', icon: '💻', color: 'bg-blue-500' },
  data: { label: 'Data', icon: '📊', color: 'bg-green-500' },
  web: { label: 'Web', icon: '🌐', color: 'bg-purple-500' },
  productivity: { label: 'Productivity', icon: '⚡', color: 'bg-orange-500' },
  ai: { label: 'AI', icon: '🤖', color: 'bg-pink-500' },
  system: { label: 'System', icon: '⚙️', color: 'bg-gray-500' },
  other: { label: 'Other', icon: '📦', color: 'bg-slate-500' }
} as const;

export const TOOL_STATUS = {
  enabled: { label: 'Enabled', color: 'bg-green-500' },
  disabled: { label: 'Disabled', color: 'bg-gray-400' },
  'needs-config': { label: 'Needs Config', color: 'bg-amber-500' }
} as const;

export const WORKFLOW_STEP_TYPES = {
  'web-api': { label: 'Web API', icon: '🌐', color: 'bg-blue-500' },
  'file-op': { label: 'File Operation', icon: '📁', color: 'bg-green-500' },
  'ai-call': { label: 'AI Call', icon: '🤖', color: 'bg-purple-500' },
  'transform': { label: 'Transform', icon: '🔄', color: 'bg-orange-500' },
  'conditional': { label: 'Conditional', icon: '🔀', color: 'bg-yellow-500' }
} as const;

export const MCP_SERVER_CATEGORIES = {
  official: { label: 'Official', color: 'bg-blue-500' },
  community: { label: 'Community', color: 'bg-green-500' },
  commercial: { label: 'Commercial', color: 'bg-purple-500' }
} as const;

export const MCP_DIFFICULTY_LEVELS = {
  beginner: { label: 'Beginner', color: 'bg-green-500' },
  intermediate: { label: 'Intermediate', color: 'bg-yellow-500' },
  advanced: { label: 'Advanced', color: 'bg-red-500' }
} as const;

export const STORAGE_KEYS = {
  TOOLS: 'mcp_tool_hub_tools',
  WORKFLOWS: 'mcp_tool_hub_workflows'
} as const;

export const DEFAULT_TOOL_ICON = '📦';
export const DEFAULT_WORKFLOW_ICON = '🔄';

export const MAX_TOOL_DESCRIPTION_LENGTH = 200;
export const MAX_WORKFLOW_DESCRIPTION_LENGTH = 200;
export const ITEMS_PER_PAGE = 20;

export const SUPPORTED_FILE_TYPES = [
  'txt', 'md', 'json', 'csv', 'xml', 'yaml', 'yml', 'html', 'js', 'ts', 'py', 'java', 'c', 'cpp', 'rb', 'go'
] as const;

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_WORKFLOW_STEPS = 50;
export const AUTO_SAVE_INTERVAL_MS = 30000; // 30 seconds
export const DEBOUNCE_DELAY_MS = 300; // 300 milliseconds
export const API_TIMEOUT_MS = 15000; // 15 seconds

export const FEATURE_FLAGS = {
  ENABLE_BETA_TOOLS: 'enable_beta_tools',
  ENABLE_ADVANCED_WORKFLOWS: 'enable_advanced_workflows',
  ENABLE_DARK_MODE: 'enable_dark_mode'
} as const;

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function isSupportedFileType(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return SUPPORTED_FILE_TYPES.includes(ext as typeof SUPPORTED_FILE_TYPES[number]);
}

export function validateToolConfig(config: Record<string, any>, requiredFields: string[]): boolean {
  for (const field of requiredFields) {
    if (!(field in config)) {
      return false;
    }
  }
  return true;
}

export function debounce<F extends (...args: any[]) => void>(func: F, delay: number): F {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return function(this: any, ...args: any[]) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }
    , delay);
  } as F;
}
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
} 
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}


