/**
 * DashboardTab.ts — Responsive kanban dashboard.
 *
 * Features:
 *  - Responsive grid of bucket sections with fixed height
 *  - Drag-and-drop task moves + within-bucket reordering
 *  - Drag-and-drop section reordering via bucket headers
 *  - Inline task capture, context menus, tag/reminder controls
 *  - applyTagFilter(): dim/hide tasks not matching selected tags
 */

import { Menu, Modal, Setting } from 'obsidian';
import DocketPlugin from './main';
import {
  Task,
  Bucket,
  Tag,
  generateId,
  parseTaskInput,
  formatWaitingTime,
  normalizeBucketOrder,
} from './types';

let _draggedTaskId: string | null = null;
let _draggedBucketId: string | null = null;

export class DashboardTab {
  private container: HTMLElement;
  private plugin: DocketPlugin;

  constructor(container: HTMLElement, plugin: DocketPlugin) {
    this.container = container;
    this.plugin = plugin;
  }

  render(): void {
    this.container.empty();
    const inner = this.container.createDiv('docket-dashboard');
    const grid = inner.createDiv('docket-bucket-grid');

    const sorted = [...this.plugin.settings.buckets].sort((a, b) => a.order - b.order);
    sorted.forEach((bucket) => this.renderBucket(bucket, grid));

    const addSectionBtn = inner.createDiv({ cls: 'docket-add-section-btn', text: '+ Add Section' });
    addSectionBtn.addEventListener('click', async () => {
      const maxOrder = this.plugin.settings.buckets.reduce((max, b) => Math.max(max, b.order), -1);
      this.plugin.settings.buckets.push({
        id: generateId(),
        name: 'New Section',
        icon: '📌',
        color: '#888888',
        order: maxOrder + 1,
        showCounter: false,
        widthPx: 320,
      });
      await this.plugin.saveSettings();
    });
  }

  private renderBucket(bucket: Bucket, parent: HTMLElement): void {
    const tasks = this.getActiveTasks(bucket.id);

    const bucketEl = parent.createDiv('docket-bucket');
    bucketEl.dataset.bucketId = bucket.id;
    bucketEl.style.setProperty('--docket-bucket-color', bucket.color);
    const widthPx = Math.max(240, Math.min(900, bucket.widthPx ?? 320));
    bucketEl.style.setProperty('--docket-bucket-width', `${widthPx}px`);
    bucketEl.style.width = `${widthPx}px`;

    const resizeHandle = bucketEl.createDiv('docket-bucket-resize-handle');
    resizeHandle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.startBucketResize(bucket, bucketEl, e);
    });

    const header = bucketEl.createDiv('docket-bucket-header');
    header.draggable = true;

    header.createSpan({
      cls: 'docket-bucket-drag-handle',
      text: '⠿',
      attr: { title: 'Drag to reorder section' },
    });

    const titleEl = header.createDiv('docket-bucket-title');
    titleEl.createSpan({ cls: 'docket-bucket-icon', text: bucket.icon });
    titleEl.createSpan({ cls: 'docket-bucket-name', text: bucket.name });

    const rightActions = header.createDiv('docket-bucket-header-right');
    rightActions.createSpan({ cls: 'docket-bucket-count', text: String(tasks.length) });

    if (bucket.tooltip) {
      const infoBtn = rightActions.createSpan({
        cls: 'docket-bucket-info',
        text: 'ℹ️',
        attr: { title: 'Section info' },
      });
      infoBtn.addEventListener('click', (e: MouseEvent) => {
        e.stopPropagation();
        this.showBucketTooltip(bucket);
      });
    }

    const editBtn = rightActions.createSpan({
      cls: 'docket-bucket-edit',
      text: '✏️',
      attr: { title: 'Edit section' },
    });
    editBtn.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      this.showBucketEditModal(bucket);
    });

    const delBtn = rightActions.createSpan({
      cls: 'docket-bucket-delete',
      text: '🗑️',
      attr: { title: 'Delete section' },
    });
    delBtn.addEventListener('click', async (e: MouseEvent) => {
      e.stopPropagation();
      if (
        confirm(
          `Delete section "${bucket.name}"? Tasks inside will remain but won't appear on the Dashboard.`,
        )
      ) {
        this.plugin.settings.buckets = this.plugin.settings.buckets.filter(
          (b) => b.id !== bucket.id,
        );
        normalizeBucketOrder(this.plugin.settings.buckets);
        await this.plugin.saveSettings();
      }
    });

    this.setupBucketDrag(header, bucketEl, bucket.id);

    const taskList = bucketEl.createDiv('docket-task-list');
    taskList.dataset.bucketId = bucket.id;
    this.setupDropZone(
      taskList,
      bucket.id,
      rightActions.querySelector('.docket-bucket-count') as HTMLElement,
    );

    taskList.addEventListener('click', (e) => {
      if (e.target === taskList) {
        this.spawnInlineCapture(
          taskList,
          bucket.id,
          rightActions.querySelector('.docket-bucket-count') as HTMLElement,
        );
      }
    });

    tasks.forEach((task) => this.renderTaskCard(task, taskList, bucket.id));

    const addBtn = bucketEl.createDiv({ cls: 'docket-add-task-btn', text: '+ Add task' });
    addBtn.addEventListener('click', () => {
      this.spawnInlineCapture(
        taskList,
        bucket.id,
        rightActions.querySelector('.docket-bucket-count') as HTMLElement,
      );
    });
  }

  private startBucketResize(bucket: Bucket, bucketEl: HTMLElement, event: PointerEvent): void {
    const startX = event.clientX;
    const startWidth = bucket.widthPx ?? 320;
    const minWidth = 240;
    const maxWidth = 900;

    bucketEl.addClass('is-resizing');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (moveEvent: PointerEvent) => {
      const nextWidth = Math.max(
        minWidth,
        Math.min(maxWidth, startWidth + (moveEvent.clientX - startX)),
      );
      bucket.widthPx = nextWidth;
      bucketEl.style.setProperty('--docket-bucket-width', `${nextWidth}px`);
      bucketEl.style.width = `${nextWidth}px`;
    };

    const finish = async () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', finish);
      bucketEl.removeClass('is-resizing');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      await this.plugin.saveSettings(true);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', finish, { once: true });
  }

  private showBucketEditModal(bucket: Bucket): void {
    new BucketEditModal(this.plugin, bucket).open();
  }

  private showBucketTooltip(bucket: Bucket): void {
    new BucketTooltipModal(this.plugin, bucket).open();
  }

  private setupBucketDrag(header: HTMLElement, bucketEl: HTMLElement, bucketId: string): void {
    header.addEventListener('dragstart', (e: DragEvent) => {
      _draggedBucketId = bucketId;
      e.dataTransfer!.setData('application/docket-bucket', bucketId);
      e.dataTransfer!.effectAllowed = 'move';
      setTimeout(() => bucketEl.addClass('docket-bucket-dragging'), 0);
    });

    header.addEventListener('dragend', () => {
      bucketEl.removeClass('docket-bucket-dragging');
      _draggedBucketId = null;
      this.container.querySelectorAll('.docket-bucket-drop-target').forEach((el) => {
        el.removeClass('docket-bucket-drop-target');
      });
    });

    bucketEl.addEventListener('dragover', (e: DragEvent) => {
      if (!_draggedBucketId || _draggedBucketId === bucketId) return;
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'move';
      bucketEl.addClass('docket-bucket-drop-target');
    });

    bucketEl.addEventListener('dragleave', (e: DragEvent) => {
      if (!bucketEl.contains(e.relatedTarget as Node | null)) {
        bucketEl.removeClass('docket-bucket-drop-target');
      }
    });

    bucketEl.addEventListener('drop', async (e: DragEvent) => {
      e.preventDefault();
      bucketEl.removeClass('docket-bucket-drop-target');

      const sourceId = e.dataTransfer!.getData('application/docket-bucket') || _draggedBucketId;
      if (!sourceId || sourceId === bucketId) return;

      const buckets = [...this.plugin.settings.buckets].sort((a, b) => a.order - b.order);
      const sourceIdx = buckets.findIndex((b) => b.id === sourceId);
      const targetIdx = buckets.findIndex((b) => b.id === bucketId);
      if (sourceIdx < 0 || targetIdx < 0) return;

      const [moved] = buckets.splice(sourceIdx, 1);
      buckets.splice(targetIdx, 0, moved);
      buckets.forEach((b, i) => {
        b.order = i;
      });

      await this.plugin.saveSettings();
    });
  }

  private renderTaskCard(task: Task, parent: HTMLElement, bucketId: string): HTMLElement {
    const { tags, buckets } = this.plugin.settings;
    const bucket = buckets.find((b) => b.id === bucketId);
    const showCounter = bucket?.showCounter ?? false;

    const card = parent.createDiv('docket-task-card');
    card.dataset.taskId = task.id;
    card.draggable = true;

    const firstTag = task.tags.length > 0 ? tags.find((t) => t.id === task.tags[0]) : null;
    if (firstTag) {
      card.style.setProperty('--docket-indicator-color', firstTag.color);
      card.addClass('has-indicator');
    }

    const taskMain = card.createDiv('docket-task-main');

    const checkbox = taskMain.createEl('input', {
      cls: 'docket-task-checkbox',
      attr: { type: 'checkbox' },
    }) as HTMLInputElement;
    checkbox.checked = task.isCompleted;

    checkbox.addEventListener('change', async () => {
      task.isCompleted = checkbox.checked;
      task.completedAt = checkbox.checked ? Date.now() : undefined;
      await this.plugin.saveSettings();
    });

    const textEl = taskMain.createSpan({ cls: 'docket-task-text', text: task.text });

    textEl.addEventListener('dblclick', (e: MouseEvent) => {
      e.stopPropagation();

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'docket-task-edit-input';
      input.value = task.text;

      taskMain.replaceChild(input, textEl);
      input.focus();

      let committed = false;
      const commit = async () => {
        if (committed) return;
        committed = true;
        const val = input.value.trim();
        if (val && val !== task.text) {
          const { text, tagIds, newTags } = parseTaskInput(val, this.plugin.settings.tags);
          task.text = text;

          // Add any new tags
          for (const tagName of newTags) {
            const newTag = { id: generateId(), name: tagName, color: '#888888' };
            this.plugin.settings.tags.push(newTag);
            if (!task.tags.includes(newTag.id)) {
              task.tags.push(newTag.id);
            }
          }

          // Add existing tag IDs
          for (const tagId of tagIds) {
            if (!task.tags.includes(tagId)) {
              task.tags.push(tagId);
            }
          }

          await this.plugin.saveSettings();
        } else if (input.parentNode === taskMain) {
          taskMain.replaceChild(textEl, input);
        }
      };

      input.addEventListener('keydown', async (ev: KeyboardEvent) => {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          await commit();
        }
        if (ev.key === 'Escape') {
          committed = true;
          if (input.parentNode === taskMain) {
            taskMain.replaceChild(textEl, input);
          }
        }
      });

      input.addEventListener('blur', commit);
    });

    const reminderBtn = taskMain.createSpan({
      cls: 'docket-task-reminder',
      attr: {
        title: task.reminderAt
          ? `Reminder: ${this.formatReminderLabel(task.reminderAt)}`
          : 'Set reminder',
      },
      text: task.reminderAt ? '🔔' : '🔕',
    });
    if (task.reminderAt) {
      reminderBtn.addClass('has-reminder');
      if (task.reminderAt <= Date.now()) reminderBtn.addClass('is-overdue');
    }
    reminderBtn.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      this.showReminderModal(task);
    });

    const delBtn = taskMain.createSpan({
      cls: 'docket-task-delete',
      attr: { title: 'Delete task' },
      text: '×',
    });
    delBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      this.plugin.settings.tasks = this.plugin.settings.tasks.filter((t) => t.id !== task.id);
      await this.plugin.saveSettings();
    });

    const metaRow = card.createDiv('docket-task-tag-row');

    task.tags.forEach((tagId) => {
      const tag = tags.find((t) => t.id === tagId);
      if (!tag) return;
      const pill = metaRow.createSpan({ cls: 'docket-inline-tag', text: `#${tag.name}` });
      pill.style.setProperty('--docket-tag-color', tag.color);

      const removeTag = pill.createSpan({ cls: 'docket-inline-tag-remove', text: '×' });
      removeTag.addEventListener('click', async (e: MouseEvent) => {
        e.stopPropagation();
        task.tags = task.tags.filter((id) => id !== tagId);
        await this.plugin.saveSettings();
      });
    });

    if (showCounter) {
      const since = task.bucketUpdatedAt ?? task.createdAt;
      metaRow.createSpan({
        cls: 'docket-waiting-time',
        text: `⏳ ${formatWaitingTime(since)}`,
      });
    }

    if (task.reminderAt) {
      metaRow.createSpan({
        cls: 'docket-reminder-label',
        text: `🔔 ${this.formatReminderLabel(task.reminderAt)}`,
      });
    }

    card.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showTaskContextMenu(e as MouseEvent, task);
    });

    card.addEventListener('dragstart', (e: DragEvent) => {
      _draggedTaskId = task.id;
      e.dataTransfer!.setData('text/plain', task.id);
      e.dataTransfer!.effectAllowed = 'move';
      setTimeout(() => card.addClass('docket-dragging'), 0);
    });

    card.addEventListener('dragend', () => {
      card.removeClass('docket-dragging');
      _draggedTaskId = null;
    });

    return card;
  }

  private formatReminderLabel(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    if (isToday) return `Today ${time}`;
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  private showReminderModal(task: Task): void {
    new ReminderModal(this.plugin, task).open();
  }

  private setupDropZone(taskList: HTMLElement, bucketId: string, countEl: HTMLElement): void {
    taskList.addEventListener('dragover', (e: DragEvent) => {
      if (_draggedBucketId) return;
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'move';
      taskList.addClass('docket-drag-over');
      this.updateDropIndicator(taskList, e.clientY);
    });

    taskList.addEventListener('dragleave', (e: DragEvent) => {
      if (!taskList.contains(e.relatedTarget as Node | null)) {
        taskList.removeClass('docket-drag-over');
        this.removeDropIndicator(taskList);
      }
    });

    taskList.addEventListener('drop', async (e: DragEvent) => {
      if (_draggedBucketId) return;
      e.preventDefault();
      taskList.removeClass('docket-drag-over');
      this.removeDropIndicator(taskList);

      const taskId = e.dataTransfer!.getData('text/plain') || _draggedTaskId;
      if (!taskId) return;

      const task = this.plugin.settings.tasks.find((t) => t.id === taskId);
      if (!task) return;

      if (task.bucketId !== bucketId) {
        task.bucketUpdatedAt = Date.now();
      }
      task.bucketId = bucketId;

      const visibleCards = Array.from(
        taskList.querySelectorAll<HTMLElement>('.docket-task-card:not(.docket-dragging)'),
      );
      const dropIndex = this.getDropIndex(visibleCards, e.clientY);

      const bucketTasks = this.plugin.settings.tasks
        .filter((t) => t.bucketId === bucketId && t.id !== taskId && !t.isCompleted)
        .sort((a, b) => a.order - b.order);

      bucketTasks.splice(dropIndex, 0, task);
      bucketTasks.forEach((t, i) => {
        t.order = i;
      });

      countEl.textContent = String(this.getActiveTasks(bucketId).length);

      await this.plugin.saveSettings();
    });
  }

  private getDropIndex(cards: HTMLElement[], mouseY: number): number {
    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect();
      if (mouseY < rect.top + rect.height / 2) return i;
    }
    return cards.length;
  }

  private updateDropIndicator(taskList: HTMLElement, mouseY: number): void {
    this.removeDropIndicator(taskList);
    const cards = Array.from(
      taskList.querySelectorAll<HTMLElement>('.docket-task-card:not(.docket-dragging)'),
    );
    const idx = this.getDropIndex(cards, mouseY);
    const indicator = createEl('div', { cls: 'docket-drop-indicator' });
    if (idx < cards.length) {
      taskList.insertBefore(indicator, cards[idx]);
    } else {
      taskList.appendChild(indicator);
    }
  }

  private removeDropIndicator(taskList: HTMLElement): void {
    taskList.querySelectorAll('.docket-drop-indicator').forEach((el) => el.remove());
  }

  private spawnInlineCapture(taskList: HTMLElement, bucketId: string, countEl: HTMLElement): void {
    if (taskList.querySelector('.docket-inline-capture')) return;

    const input = taskList.createEl('input', {
      cls: 'docket-inline-capture',
      attr: { type: 'text', placeholder: 'New task… use #tag and Enter to save' },
    }) as HTMLInputElement;
    input.focus();

    // Tag suggestions
    let suggestionBox: HTMLElement | null = null;
    let selectedIndex = -1;
    let filteredTags: Tag[] = [];
    let hasNavigatedSuggestions = false;

    const showSuggestions = (query: string) => {
      if (suggestionBox) suggestionBox.remove();

      if (!query) {
        filteredTags = this.plugin.settings.tags;
      } else {
        const lowerQuery = query.toLowerCase();
        filteredTags = this.plugin.settings.tags.filter((t) =>
          t.name.toLowerCase().includes(lowerQuery),
        );
      }

      if (filteredTags.length === 0) return;

      suggestionBox = taskList.createDiv('docket-tag-suggestions');
      filteredTags.forEach((tag, index) => {
        const item = suggestionBox!.createDiv('docket-tag-suggestion-item');
        item.textContent = `#${tag.name}`;
        item.style.setProperty('--docket-tag-color', tag.color);
        item.dataset.index = String(index);

        item.addEventListener('click', () => {
          const cursorPos = input.selectionStart ?? input.value.length;
          const textBefore = input.value.substring(0, cursorPos);
          const textAfter = input.value.substring(cursorPos);

          // Find the last # position
          const lastHashIndex = textBefore.lastIndexOf('#');
          if (lastHashIndex !== -1) {
            const newText = textBefore.substring(0, lastHashIndex) + `#${tag.name} ` + textAfter;
            input.value = newText;
            input.focus();
            input.setSelectionRange(newText.length, newText.length);
          }
          suggestionBox!.remove();
          suggestionBox = null;
        });

        item.addEventListener('mouseover', () => {
          selectedIndex = index;
          hasNavigatedSuggestions = true;
          updateSuggestionHighlight();
        });
      });

      selectedIndex = 0;
      updateSuggestionHighlight();
    };

    const updateSuggestionHighlight = () => {
      if (!suggestionBox) return;
      suggestionBox.querySelectorAll('.docket-tag-suggestion-item').forEach((item, index) => {
        item.classList.toggle('is-selected', index === selectedIndex);
      });
    };

    const hideSuggestions = () => {
      if (suggestionBox) {
        suggestionBox.remove();
        suggestionBox = null;
      }
      selectedIndex = -1;
      hasNavigatedSuggestions = false;
    };

    const getCurrentTagQuery = (): string => {
      const cursorPos = input.selectionStart ?? input.value.length;
      const textBefore = input.value.substring(0, cursorPos);
      const lastHashIndex = textBefore.lastIndexOf('#');
      if (lastHashIndex === -1) return '';
      return textBefore.substring(lastHashIndex + 1);
    };

    input.addEventListener('input', () => {
      hasNavigatedSuggestions = false;
      const query = getCurrentTagQuery();
      if (query !== '' || input.value.includes('#')) {
        showSuggestions(query);
      } else {
        hideSuggestions();
      }
    });

    input.addEventListener('keydown', async (e: KeyboardEvent) => {
      if (suggestionBox) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          hasNavigatedSuggestions = true;
          selectedIndex = Math.min(selectedIndex + 1, filteredTags.length - 1);
          updateSuggestionHighlight();
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          hasNavigatedSuggestions = true;
          selectedIndex = Math.max(selectedIndex - 1, 0);
          updateSuggestionHighlight();
          return;
        }
        if (e.key === 'Enter' && hasNavigatedSuggestions && selectedIndex >= 0) {
          e.preventDefault();
          const selectedTag = filteredTags[selectedIndex];
          const cursorPos = input.selectionStart ?? input.value.length;
          const textBefore = input.value.substring(0, cursorPos);
          const textAfter = input.value.substring(cursorPos);
          const lastHashIndex = textBefore.lastIndexOf('#');
          if (lastHashIndex !== -1) {
            const newText =
              textBefore.substring(0, lastHashIndex) + `#${selectedTag.name} ` + textAfter;
            input.value = newText;
            input.focus();
            input.setSelectionRange(newText.length, newText.length);
          }
          hideSuggestions();
          return;
        }
        if (e.key === 'Escape') {
          hideSuggestions();
          return;
        }
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        await commit();
      }
      if (e.key === 'Escape') {
        committed = true;
        hideSuggestions();
        input.remove();
      }
    });

    input.addEventListener('blur', () => {
      setTimeout(() => hideSuggestions(), 200);
      commit();
    });

    let committed = false;
    const commit = async () => {
      if (committed) return;
      committed = true;
      const raw = input.value.trim();
      input.remove();
      hideSuggestions();
      if (!raw) return;

      const { text, tagIds, newTags } = parseTaskInput(raw, this.plugin.settings.tags);
      if (!text) return;

      for (const tagName of newTags) {
        const newTag = { id: generateId(), name: tagName, color: '#888888' };
        this.plugin.settings.tags.push(newTag);
        tagIds.push(newTag.id);
      }

      const existing = this.getActiveTasks(bucketId);
      const maxOrder = existing.length > 0 ? Math.max(...existing.map((t) => t.order)) : -1;

      this.plugin.settings.tasks.push({
        id: generateId(),
        text,
        bucketId,
        tags: tagIds,
        isCompleted: false,
        createdAt: Date.now(),
        bucketUpdatedAt: Date.now(),
        order: maxOrder + 1,
      });

      await this.plugin.saveSettings();
    };
  }

  private showTaskContextMenu(e: MouseEvent, task: Task): void {
    const menu = new Menu();

    const otherBuckets = this.plugin.settings.buckets.filter((b) => b.id !== task.bucketId);
    if (otherBuckets.length > 0) {
      otherBuckets
        .sort((a, b) => a.order - b.order)
        .forEach((bucket) => {
          menu.addItem((item) =>
            item
              .setTitle(`Move to ${bucket.icon} ${bucket.name}`)
              .setIcon('arrow-right')
              .onClick(async () => {
                if (task.bucketId !== bucket.id) {
                  task.bucketUpdatedAt = Date.now();
                }
                task.bucketId = bucket.id;
                await this.plugin.saveSettings();
              }),
          );
        });
      menu.addSeparator();
    }

    menu.addItem((item) =>
      item
        .setTitle(task.reminderAt ? 'Edit reminder' : 'Set reminder')
        .setIcon('bell')
        .onClick(() => this.showReminderModal(task)),
    );

    if (task.reminderAt) {
      menu.addItem((item) =>
        item
          .setTitle('Clear reminder')
          .setIcon('bell-off')
          .onClick(async () => {
            task.reminderAt = undefined;
            await this.plugin.saveSettings();
          }),
      );
    }

    menu.addSeparator();

    this.plugin.settings.tags.forEach((tag) => {
      const hasTag = task.tags.includes(tag.id);
      menu.addItem((item) =>
        item
          .setTitle(`${hasTag ? '✓ ' : ''}#${tag.name}`)
          .setIcon(hasTag ? 'check' : 'tag')
          .onClick(async () => {
            if (hasTag) {
              task.tags = task.tags.filter((id) => id !== tag.id);
            } else {
              task.tags = [...task.tags, tag.id];
            }
            await this.plugin.saveSettings();
          }),
      );
    });

    menu.addSeparator();

    menu.addItem((item) =>
      item
        .setTitle('Delete task')
        .setIcon('trash')
        .onClick(async () => {
          this.plugin.settings.tasks = this.plugin.settings.tasks.filter((t) => t.id !== task.id);
          await this.plugin.saveSettings();
        }),
    );

    menu.showAtMouseEvent(e);
  }

  applyTagFilter(activeTagIds: string[]): void {
    const cards = this.container.querySelectorAll<HTMLElement>('.docket-task-card');
    cards.forEach((card) => {
      const taskId = card.dataset.taskId;
      const task = this.plugin.settings.tasks.find((t) => t.id === taskId);

      if (!task || activeTagIds.length === 0) {
        card.removeClass('is-filtered-out');
        return;
      }

      const matches = activeTagIds.some((id) => task.tags.includes(id));
      card.classList.toggle('is-filtered-out', !matches);
    });
  }

  applySearchFilter(query: string): void {
    const q = query.toLowerCase();
    const cards = this.container.querySelectorAll<HTMLElement>('.docket-task-card');
    cards.forEach((card) => {
      const taskId = card.dataset.taskId;
      const task = this.plugin.settings.tasks.find((t) => t.id === taskId);

      if (!task || !q) {
        card.removeClass('is-search-hidden');
        return;
      }

      const matches = task.text.toLowerCase().includes(q);
      card.classList.toggle('is-search-hidden', !matches);
    });
  }

  private getActiveTasks(bucketId: string): Task[] {
    return this.plugin.settings.tasks
      .filter((t) => t.bucketId === bucketId && !t.isCompleted)
      .sort((a, b) => a.order - b.order);
  }
}

class BucketEditModal extends Modal {
  private plugin: DocketPlugin;
  private bucket: Bucket;

  constructor(plugin: DocketPlugin, bucket: Bucket) {
    super(plugin.app);
    this.plugin = plugin;
    this.bucket = bucket;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('docket-bucket-edit-modal');

    contentEl.createEl('h2', { text: 'Edit Section' });

    new Setting(contentEl)
      .setName('Icon')
      .setDesc('Emoji or short text icon')
      .addText((text) => {
        text.setValue(this.bucket.icon).onChange(async (value) => {
          this.bucket.icon = value || '📌';
          await this.plugin.saveSettings();
        });
      });

    new Setting(contentEl).setName('Name').addText((text) => {
      text.setValue(this.bucket.name).onChange(async (value) => {
        this.bucket.name = value.trim() || 'Section';
        await this.plugin.saveSettings();
      });
    });

    new Setting(contentEl)
      .setName('Width')
      .setDesc('Section width in pixels')
      .addText((text) => {
        text.inputEl.type = 'number';
        text.inputEl.min = '240';
        text.inputEl.max = '900';
        text.setValue(String(this.bucket.widthPx ?? 320)).onChange(async (value) => {
          const parsed = Number.parseInt(value, 10);
          this.bucket.widthPx = Number.isFinite(parsed)
            ? Math.min(900, Math.max(240, parsed))
            : 320;
          await this.plugin.saveSettings();
        });
      });

    new Setting(contentEl)
      .setName('Color')
      .setDesc('Accent color for the section header')
      .addColorPicker((picker) => {
        picker.setValue(this.bucket.color).onChange(async (value) => {
          this.bucket.color = value;
          await this.plugin.saveSettings();
        });
      });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

class ReminderModal extends Modal {
  private plugin: DocketPlugin;
  private task: Task;

  constructor(plugin: DocketPlugin, task: Task) {
    super(plugin.app);
    this.plugin = plugin;
    this.task = task;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('docket-reminder-modal');

    contentEl.createEl('h2', { text: 'Set Reminder' });
    contentEl.createEl('p', {
      cls: 'docket-reminder-task-text',
      text: this.task.text,
    });

    const existing = this.task.reminderAt
      ? new Date(this.task.reminderAt)
      : new Date(Date.now() + 3600000);
    const dateStr = existing.toISOString().slice(0, 10);
    const timeStr = existing.toTimeString().slice(0, 5);

    let selectedDate = dateStr;
    let selectedTime = timeStr;

    new Setting(contentEl).setName('Date').addText((text) => {
      text.inputEl.type = 'date';
      text.setValue(dateStr).onChange((value) => {
        selectedDate = value;
      });
    });

    new Setting(contentEl).setName('Time').addText((text) => {
      text.inputEl.type = 'time';
      text.setValue(timeStr).onChange((value) => {
        selectedTime = value;
      });
    });

    new Setting(contentEl)
      .addButton((btn) => {
        btn
          .setButtonText('Save reminder')
          .setCta()
          .onClick(async () => {
            const reminderAt = new Date(`${selectedDate}T${selectedTime}`).getTime();
            if (!Number.isNaN(reminderAt)) {
              this.task.reminderAt = reminderAt;
              await this.plugin.saveSettings();
            }
            this.close();
          });
      })
      .addButton((btn) => {
        btn.setButtonText('Clear').onClick(async () => {
          this.task.reminderAt = undefined;
          await this.plugin.saveSettings();
          this.close();
        });
      });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

class BucketTooltipModal extends Modal {
  private plugin: DocketPlugin;
  private bucket: Bucket;

  constructor(plugin: DocketPlugin, bucket: Bucket) {
    super(plugin.app);
    this.plugin = plugin;
    this.bucket = bucket;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('docket-bucket-tooltip-modal');

    const header = contentEl.createDiv('docket-tooltip-header');
    header.createSpan({ cls: 'docket-tooltip-icon', text: this.bucket.icon });
    header.createEl('h2', { text: this.bucket.name });

    const tooltip = this.bucket.tooltip;
    if (tooltip) {
      contentEl.createEl('p', {
        cls: 'docket-tooltip-description',
        text: tooltip.description,
      });

      contentEl.createEl('h3', {
        cls: 'docket-tooltip-examples-title',
        text: 'Examples',
      });

      const examplesList = contentEl.createEl('ul', {
        cls: 'docket-tooltip-examples-list',
      });

      tooltip.examples.forEach((example) => {
        examplesList.createEl('li', {
          cls: 'docket-tooltip-example-item',
          text: example,
        });
      });
    }

    const closeBtn = contentEl.createDiv('docket-tooltip-close-btn');
    closeBtn.textContent = 'Close';
    closeBtn.addEventListener('click', () => this.close());
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
