/**
 * ArchiveTab.ts — Historical ledger of completed tasks.
 *
 * Features:
 *  - Lists all tasks where isCompleted === true, newest first
 *  - Grouped by completion month for easy scanning
 *  - Live search input to filter by task text
 *  - Disabled checkbox + strikethrough styling (via CSS)
 *  - "Restore" button per card to un-complete a task and move it back
 *  - Task count summary in the header
 */

import DayDeckPlugin from './main';
import { Task } from './types';

export class ArchiveTab {
  private container: HTMLElement;
  private plugin: DayDeckPlugin;
  private searchQuery = '';

  constructor(container: HTMLElement, plugin: DayDeckPlugin) {
    this.container = container;
    this.plugin = plugin;
  }

  // -------------------------------------------------------------------------
  // Render (called each time tab becomes active)
  // -------------------------------------------------------------------------

  render(): void {
    this.container.empty();
    const root = this.container.createDiv('docket-archive');

    this.renderHeader(root);
    this.renderControls(root);
    this.renderList(root);
  }

  // -------------------------------------------------------------------------
  // Header
  // -------------------------------------------------------------------------

  private renderHeader(parent: HTMLElement): void {
    const header = parent.createDiv('docket-archive-header');
    header.createEl('h2', { text: '📦 Archive log' });
    header.createSpan({
      cls: 'docket-archive-subtitle',
      text: 'A historical ledger of completed tasks.',
    });
  }

  // -------------------------------------------------------------------------
  // Controls (search + stats)
  // -------------------------------------------------------------------------

  private renderControls(parent: HTMLElement): void {
    const controls = parent.createDiv('docket-archive-controls');

    // Search
    const searchWrapper = controls.createDiv('docket-archive-search-wrapper');
    searchWrapper.createSpan({ cls: 'docket-archive-search-icon', text: '🔍' });

    const searchInput = searchWrapper.createEl('input', {
      cls: 'docket-archive-search',
      attr: { type: 'text', placeholder: 'Search completed tasks…' },
    });
    searchInput.value = this.searchQuery;

    // Stats
    const completed = this.plugin.settings.tasks.filter((t) => t.isCompleted);
    controls.createDiv({
      cls: 'docket-archive-stats',
      text: `${completed.length} completed task${completed.length !== 1 ? 's' : ''}`,
    });

    // Live search
    searchInput.addEventListener('input', () => {
      this.searchQuery = searchInput.value;
      // Re-render only the list section
      const listEl = parent.querySelector<HTMLElement>('.docket-archive-list-wrapper');
      if (listEl) {
        listEl.empty();
        this.buildListContent(listEl);
      }
    });
  }

  // -------------------------------------------------------------------------
  // Task List
  // -------------------------------------------------------------------------

  private renderList(parent: HTMLElement): void {
    const wrapper = parent.createDiv('docket-archive-list-wrapper');
    this.buildListContent(wrapper);
  }

  private buildListContent(wrapper: HTMLElement): void {
    wrapper.empty();

    const completed = this.plugin.settings.tasks
      .filter((t) => t.isCompleted)
      .filter((t) => t.text.toLowerCase().includes(this.searchQuery.toLowerCase()))
      .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));

    if (completed.length === 0) {
      const empty = wrapper.createDiv('docket-archive-empty');
      empty.createSpan({
        text: this.searchQuery
          ? `No results for "${this.searchQuery}"`
          : 'No completed tasks yet. Complete a task to see it here.',
      });
      return;
    }

    // Group by month label
    const groups = this.groupByMonth(completed);

    groups.forEach(({ label, tasks }) => {
      const group = wrapper.createDiv('docket-archive-group');
      group.createDiv({ cls: 'docket-archive-group-label', text: label });

      const list = group.createDiv('docket-archive-list');
      tasks.forEach((task) => this.renderArchivedTask(task, list));
    });
  }

  // -------------------------------------------------------------------------
  // Archived Task Card
  // -------------------------------------------------------------------------

  private renderArchivedTask(task: Task, parent: HTMLElement): void {
    const { tags } = this.plugin.settings;

    const card = parent.createDiv('docket-archive-card');

    // Colour indicator from first tag
    const firstTag = task.tags.length > 0 ? tags.find((t) => t.id === task.tags[0]) : null;
    if (firstTag) {
      card.setCssProps({ '--docket-indicator-color': firstTag.color });
      card.addClass('has-indicator');
    }

    // ── Main row ──────────────────────────────────────────────────────────
    const taskMain = card.createDiv('docket-task-main');

    // Disabled, checked checkbox
    const checkbox = taskMain.createEl('input', {
      cls: 'docket-task-checkbox',
      attr: { type: 'checkbox' },
    });
    checkbox.checked = true;
    checkbox.disabled = true;

    // Struck-through text
    taskMain.createSpan({ cls: 'docket-task-text', text: task.text });

    // Restore button
    const restoreBtn = taskMain.createSpan({ cls: 'docket-restore-btn', text: 'Restore' });
    restoreBtn.setAttribute('title', 'Move back to Today bucket');
    restoreBtn.addEventListener('click', async () => {
      task.isCompleted = false;
      task.completedAt = undefined;

      // Return to Today bucket if it exists, else keep current bucketId
      const todayBucket = this.plugin.settings.buckets.find((b) => b.id === 'today');
      if (todayBucket) task.bucketId = todayBucket.id;

      task.createdAt = Date.now(); // treat as a fresh task
      await this.plugin.saveSettings();
    });

    // ── Meta row ──────────────────────────────────────────────────────────
    const hasTagsOrDate = task.tags.length > 0 || task.completedAt;
    if (hasTagsOrDate) {
      const meta = card.createDiv('docket-task-tag-row');

      task.tags.forEach((tagId) => {
        const tag = tags.find((t) => t.id === tagId);
        if (!tag) return;
        const pill = meta.createSpan({ cls: 'docket-inline-tag', text: `#${tag.name}` });
        pill.setCssProps({ '--docket-tag-color': tag.color });
      });

      if (task.completedAt) {
        const date = new Date(task.completedAt);
        const label = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        meta.createSpan({ cls: 'docket-archive-done-date', text: `Done: ${label}` });
      }
    }
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private groupByMonth(tasks: Task[]): Array<{ label: string; tasks: Task[] }> {
    const map = new Map<string, Task[]>();

    tasks.forEach((task) => {
      const date = task.completedAt ? new Date(task.completedAt) : new Date(task.createdAt);
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(task);
    });

    return Array.from(map.entries()).map(([label, tasks]) => ({ label, tasks }));
  }
}
