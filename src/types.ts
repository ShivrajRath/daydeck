/**
 * types.ts — Shared interfaces and utility functions for the Docket plugin.
 */

// ---------------------------------------------------------------------------
// Core Data Types
// ---------------------------------------------------------------------------

/** Opaque unique identifier type */
export type ID = string;

/**
 * A single task item managed by Docket.
 */
export interface Task {
  /** Unique identifier */
  id: ID;
  /** Human-readable task description */
  text: string;
  /** ID of the bucket this task belongs to */
  bucketId: ID;
  /** Array of Tag IDs applied to this task */
  tags: ID[];
  /** Whether the task has been completed */
  isCompleted: boolean;
  /** Unix timestamp (ms) when the task was created */
  createdAt: number;
  /** Unix timestamp (ms) when the task was completed, if applicable */
  completedAt?: number;
  /** Unix timestamp (ms) when the task was last moved to a new bucket */
  bucketUpdatedAt?: number;
  /** Sort order within the bucket (lower = higher position) */
  order: number;
  /** Unix timestamp (ms) for a scheduled reminder, if set */
  reminderAt?: number;
}

/**
 * A named container (column) for tasks on the Dashboard.
 */
export interface Bucket {
  /** Unique identifier */
  id: ID;
  /** Display name */
  name: string;
  /** Emoji or short text icon */
  icon: string;
  /** CSS color value (hex, e.g. "#f14c4c") used for accent/indicator */
  color: string;
  /** @deprecated Legacy column field — ignored; kept for data migration */
  column?: 1 | 2;
  /** Sort order on the dashboard (lower = further left / higher) */
  order: number;
  /** Whether to show waiting time counter for tasks in this section */
  showCounter: boolean;
  /** Dashboard section width in pixels */
  widthPx: number;
}

/**
 * A semantic tag that can be applied to tasks for categorization and filtering.
 */
export interface Tag {
  /** Unique identifier */
  id: ID;
  /** Display name (no spaces) */
  name: string;
  /** Hex color string (e.g. "#c586c0") */
  color: string;
}

/**
 * All persistent plugin data — serialized to data.json via Obsidian's Plugin.loadData/saveData.
 */
export interface DocketSettings {
  /** All configured buckets */
  buckets: Bucket[];
  /** All configured semantic tags */
  tags: Tag[];
  /** All tasks (active and completed) */
  tasks: Task[];
  /** Tag ID that identifies "deep work" tasks for Focus Mode */
  deepWorkTagId: ID;
  /** Schema version for future data migrations */
  version: number;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

/** Default buckets matching the prototype design */
export const DEFAULT_BUCKETS: Bucket[] = [
  { id: 'today', name: 'Today', icon: '🔥', color: '#f14c4c', order: 0, showCounter: false, widthPx: 320 },
  { id: 'next', name: 'Next', icon: '⏭️', color: '#d7ba7d', order: 1, showCounter: false, widthPx: 320 },
  { id: 'waiting', name: 'Waiting', icon: '🤝', color: '#c586c0', order: 2, showCounter: true, widthPx: 320 },
  {
    id: 'focus-hub',
    name: 'Deep Work',
    icon: '🧠',
    color: '#b4befe',
    order: 3,
    showCounter: false,
    widthPx: 320,
  },
  { id: 'learning', name: 'Learning', icon: '📚', color: '#4ec9b0', order: 4, showCounter: false, widthPx: 320 },
  { id: 'ideas', name: 'Ideas', icon: '💡', color: '#ce9178', order: 5, showCounter: false, widthPx: 320 },
  { id: 'watch', name: 'Watch', icon: '🔍', color: '#4fc1ff', order: 6, showCounter: false, widthPx: 320 },
];

/** Default semantic tags */
export const DEFAULT_TAGS: Tag[] = [
  { id: 'focus', name: 'Focus', color: '#f14c4c' },
  { id: 'ops', name: 'Ops', color: '#4ec9b0' },
  { id: 'sync', name: 'Sync', color: '#c586c0' },
  { id: 'rd', name: 'RD', color: '#4fc1ff' },
  { id: 'personal', name: 'Personal', color: '#ce9178' },
  { id: 'design', name: 'Design', color: '#d7ba7d' },
  { id: 'review', name: 'Review', color: '#b5cea8' },
  { id: 'maintenance', name: 'Maintenance', color: '#f5a97f' },
  { id: 'idea', name: 'Idea', color: '#eead39' },
  { id: 'finance', name: 'Finance', color: '#939ab7' },
];

/** Full default settings object */
export const DEFAULT_SETTINGS: DocketSettings = {
  buckets: DEFAULT_BUCKETS,
  tags: DEFAULT_TAGS,
  tasks: [],
  deepWorkTagId: 'focus',
  version: 1,
};

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

/**
 * Generate a short, unique identifier.
 * Not cryptographically secure, but sufficient for plugin-local IDs.
 */
export function generateId(): ID {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

/**
 * Format a Date object as a YYYY-MM-DD string (local time).
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Return today's date as a YYYY-MM-DD string (local time).
 */
export function todayString(): string {
  return formatDate(new Date());
}

/**
 * Return the Unix timestamp (ms) for the start of the given date (midnight).
 */
export function startOfDay(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Parse a quick-capture string of the form "Task text #tag1 #tag2"
 * into a task text and an array of matching tag IDs.
 */
export function parseTaskInput(
  input: string,
  tags: Tag[],
): { text: string; tagIds: ID[]; newTags: string[] } {
  // Remove tags from the text but leave the rest of the string intact
  const text = input
    .replace(/#([A-Za-z0-9_-]+)/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const tagIds: ID[] = [];
  const newTags: string[] = [];

  const matches = input.match(/#([A-Za-z0-9_-]+)/g);
  if (matches) {
    for (const match of matches) {
      const tagName = match.slice(1);
      const lowerName = tagName.toLowerCase();
      const existingTag = tags.find((t) => t.name.toLowerCase() === lowerName);

      if (existingTag) {
        if (!tagIds.includes(existingTag.id)) {
          tagIds.push(existingTag.id);
        }
      } else {
        if (!newTags.includes(tagName)) {
          newTags.push(tagName);
        }
      }
    }
  }

  return { text, tagIds, newTags };
}

/**
 * Format how long a task has been waiting in the Waiting bucket.
 */
export function formatWaitingTime(sinceMs: number): string {
  const diff = Date.now() - sinceMs;
  if (diff < 0) return 'just now';

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return 'just now';
}

/**
 * Normalize bucket order values to a contiguous 0..n sequence.
 */
export function normalizeBucketOrder(buckets: Bucket[]): void {
  buckets
    .sort((a, b) => a.order - b.order)
    .forEach((bucket, index) => {
      bucket.order = index;
    });
}
