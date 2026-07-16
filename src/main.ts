/**
 * main.ts — DayDeck Plugin entry point.
 *
 * Responsibilities:
 *  - Register the custom ItemView (DayDeckView)
 *  - Add ribbon icon + keyboard command
 *  - Register the PluginSettingTab
 *  - Load / save settings via Obsidian's built-in data API
 */

import { Notice, Plugin, WorkspaceLeaf } from 'obsidian';
import { DayDeckSettings, DEFAULT_SETTINGS, normalizeBucketOrder, Task } from './types';
import { DayDeckView, VIEW_TYPE_DAYDECK } from './DayDeckView';
import { DayDeckSettingTab } from './settings';

export default class DayDeckPlugin extends Plugin {
  /** Live settings object — mutate then call saveSettings() to persist */
  settings!: DayDeckSettings;
  private reminderIntervalId?: number;

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  async onload(): Promise<void> {
    // 1. Load persisted data (merges with defaults for forward-compat)
    await this.loadSettings();

    // 2. Register the custom view type
    this.registerView(VIEW_TYPE_DAYDECK, (leaf: WorkspaceLeaf) => new DayDeckView(leaf, this));

    // 3. Ribbon icon
    this.addRibbonIcon('folder-kanban', 'Open DayDeck', () => {
      void this.activateView();
    });

    // 4. Command palette entry
    this.addCommand({
      id: 'open-dashboard',
      name: 'Open dashboard',
      callback: () => {
        void this.activateView();
      },
    });

    // 5. Settings tab
    this.addSettingTab(new DayDeckSettingTab(this.app, this));

    // 6. Reminder monitor
    this.startReminderMonitor();
  }

  onunload(): void {
    this.stopReminderMonitor();
  }

  // -------------------------------------------------------------------------
  // View management
  // -------------------------------------------------------------------------

  /**
   * Open (or focus) the DayDeck view.
   * If a leaf with the view already exists, reveal it.
   * Otherwise, open a new tab.
   */
  async activateView(): Promise<void> {
    const { workspace } = this.app;

    // Check if already open
    const existing = workspace.getLeavesOfType(VIEW_TYPE_DAYDECK);
    if (existing.length > 0) {
      workspace.setActiveLeaf(existing[0]);
      return;
    }

    // Open in a new tab
    const leaf = workspace.getLeaf('tab');
    await leaf.setViewState({ type: VIEW_TYPE_DAYDECK, active: true });
    workspace.setActiveLeaf(leaf);
  }

  // -------------------------------------------------------------------------
  // Settings persistence
  // -------------------------------------------------------------------------

  /**
   * Load settings from Obsidian's data store, merging with defaults to handle
   * schema additions in future versions without data loss.
   */
  async loadSettings(): Promise<void> {
    const saved = (await this.loadData()) as Partial<DayDeckSettings> | null;

    this.settings = {
      ...DEFAULT_SETTINGS,
      ...saved,
    };

    // Ensure required arrays exist (guard against partial/corrupt saves)
    if (!Array.isArray(this.settings.buckets) || this.settings.buckets.length === 0) {
      this.settings.buckets = DEFAULT_SETTINGS.buckets;
    } else {
      // Migrate legacy two-column ordering into a single global order
      const hasLegacyColumns = this.settings.buckets.some((b) => b.column !== undefined);
      if (hasLegacyColumns) {
        this.settings.buckets.sort((a, b) => {
          const colA = a.column ?? 1;
          const colB = b.column ?? 1;
          if (colA !== colB) return colA - colB;
          return a.order - b.order;
        });
        normalizeBucketOrder(this.settings.buckets);
      }
      // Migrate buckets without showCounter field
      this.settings.buckets.forEach((bucket) => {
        if (bucket.showCounter === undefined) {
          bucket.showCounter = bucket.id === 'waiting';
        }
        if (bucket.widthPx === undefined) {
          bucket.widthPx = 320;
        }
      });
    }
    if (!Array.isArray(this.settings.tags) || this.settings.tags.length === 0) {
      this.settings.tags = DEFAULT_SETTINGS.tags;
    }
    if (!Array.isArray(this.settings.tasks)) {
      this.settings.tasks = [];
    }

    // Automatically ensure the Deep Work tag exists (Bug Bash requirement)
    if (!this.settings.tags.some((t) => t.id === this.settings.deepWorkTagId)) {
      this.settings.tags.push({
        id: this.settings.deepWorkTagId,
        name: 'DeepWork',
        color: '#f14c4c',
      });
    }
  }

  private startReminderMonitor(): void {
    this.stopReminderMonitor();
    this.reminderIntervalId = window.setInterval(() => {
      void this.processDueReminders();
    }, 10000);
    this.registerInterval(this.reminderIntervalId);
    void this.processDueReminders();
  }

  private stopReminderMonitor(): void {
    if (this.reminderIntervalId !== undefined) {
      window.clearInterval(this.reminderIntervalId);
      this.reminderIntervalId = undefined;
    }
  }

  private async processDueReminders(): Promise<void> {
    const now = Date.now();
    let changed = false;

    for (const task of this.settings.tasks) {
      if (!task.reminderAt || task.isCompleted || task.reminderAt > now || task.reminderNotified) {
        continue;
      }

      // Skip notifications for date-only reminders
      if (task.reminderDateOnly) {
        task.reminderNotified = true;
        changed = true;
        continue;
      }

      this.showReminderNotification(task);
      task.reminderNotified = true;
      changed = true;
    }

    if (changed) {
      await this.saveSettings(true);
    }
  }

  private showReminderNotification(task: Task): void {
    const title = 'DayDeck reminder';
    const body = task.text;

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (window.Notification.permission === 'granted') {
        new window.Notification(title, { body, tag: `daydeck-reminder-${task.id}` });
        return;
      }

      if (window.Notification.permission === 'default') {
        void window.Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new window.Notification(title, { body, tag: `daydeck-reminder-${task.id}` });
          } else {
            new Notice(`${title}: ${body}`);
          }
        });
        return;
      }
    }

    new Notice(`${title}: ${body}`);
  }

  /**
   * Persist the current settings object and refresh any open DayDeck views.
   */
  async saveSettings(skipRefresh = false): Promise<void> {
    await this.saveData(this.settings);

    if (!skipRefresh) {
      // Refresh all open DayDeck view instances
      this.app.workspace.getLeavesOfType(VIEW_TYPE_DAYDECK).forEach((leaf) => {
        if (leaf.view instanceof DayDeckView) {
          leaf.view.refresh();
        }
      });
    }
  }
}
