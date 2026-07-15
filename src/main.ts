/**
 * main.ts — Docket Plugin entry point.
 *
 * Responsibilities:
 *  - Register the custom ItemView (DocketView)
 *  - Add ribbon icon + keyboard command
 *  - Register the PluginSettingTab
 *  - Load / save settings via Obsidian's built-in data API
 */

import { Notice, Plugin, WorkspaceLeaf } from 'obsidian';
import { DocketSettings, DEFAULT_SETTINGS, normalizeBucketOrder, Task } from './types';
import { DocketView, VIEW_TYPE_DOCKET } from './DocketView';
import { DocketSettingTab } from './settings';

export default class DocketPlugin extends Plugin {
  /** Live settings object — mutate then call saveSettings() to persist */
  settings!: DocketSettings;
  private reminderIntervalId?: number;

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  async onload(): Promise<void> {
    // 1. Load persisted data (merges with defaults for forward-compat)
    await this.loadSettings();

    // 2. Register the custom view type
    this.registerView(VIEW_TYPE_DOCKET, (leaf: WorkspaceLeaf) => new DocketView(leaf, this));

    // 3. Ribbon icon
    this.addRibbonIcon('inbox', 'Open Docket', () => {
      this.activateView();
    });

    // 4. Command palette entry
    this.addCommand({
      id: 'open-docket',
      name: 'Open Docket dashboard',
      callback: () => {
        this.activateView();
      },
    });

    // 5. Settings tab
    this.addSettingTab(new DocketSettingTab(this.app, this));

    // 6. Reminder monitor
    this.startReminderMonitor();

    console.log('Docket: plugin loaded');
  }

  onunload(): void {
    // Detach all open Docket leaves when plugin is disabled
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_DOCKET);
    this.stopReminderMonitor();
    console.log('Docket: plugin unloaded');
  }

  // -------------------------------------------------------------------------
  // View management
  // -------------------------------------------------------------------------

  /**
   * Open (or focus) the Docket view.
   * If a leaf with the view already exists, reveal it.
   * Otherwise, open a new tab.
   */
  async activateView(): Promise<void> {
    const { workspace } = this.app;

    // Check if already open
    const existing = workspace.getLeavesOfType(VIEW_TYPE_DOCKET);
    if (existing.length > 0) {
      workspace.revealLeaf(existing[0]);
      return;
    }

    // Open in a new tab
    const leaf = workspace.getLeaf('tab');
    await leaf.setViewState({ type: VIEW_TYPE_DOCKET, active: true });
    workspace.revealLeaf(leaf);
  }

  // -------------------------------------------------------------------------
  // Settings persistence
  // -------------------------------------------------------------------------

  /**
   * Load settings from Obsidian's data store, merging with defaults to handle
   * schema additions in future versions without data loss.
   */
  async loadSettings(): Promise<void> {
    const saved = (await this.loadData()) as Partial<DocketSettings> | null;

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
      if (!task.reminderAt || task.isCompleted || task.reminderAt > now) {
        continue;
      }

      this.showReminderNotification(task);
      task.reminderAt = undefined;
      changed = true;
    }

    if (changed) {
      await this.saveSettings(true);
    }
  }

  private showReminderNotification(task: Task): void {
    const title = 'Docket reminder';
    const body = task.text;

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (window.Notification.permission === 'granted') {
        new window.Notification(title, { body, tag: `docket-reminder-${task.id}` });
        return;
      }

      if (window.Notification.permission === 'default') {
        window.Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new window.Notification(title, { body, tag: `docket-reminder-${task.id}` });
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
   * Persist the current settings object and refresh any open Docket views.
   */
  async saveSettings(skipRefresh = false): Promise<void> {
    await this.saveData(this.settings);

    if (!skipRefresh) {
      // Refresh all open Docket view instances
      this.app.workspace.getLeavesOfType(VIEW_TYPE_DOCKET).forEach((leaf) => {
        if (leaf.view instanceof DocketView) {
          leaf.view.refresh();
        }
      });
    }
  }
}
