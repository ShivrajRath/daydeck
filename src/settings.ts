/**
 * settings.ts — PluginSettingTab for DayDeck.
 *
 * Provides full CRUD UI for Buckets and Tags.
 */

import { App, PluginSettingTab, Setting } from 'obsidian';
import DayDeckPlugin from './main';
import { generateId, normalizeBucketOrder } from './types';
import { ConfirmModal } from './ConfirmModal';

export class DayDeckSettingTab extends PluginSettingTab {
  plugin: DayDeckPlugin;

  constructor(app: App, plugin: DayDeckPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }


  display(): void {
    this.containerEl.empty();
    this.renderBucketsSection(this.containerEl);
    this.renderTagsSection(this.containerEl);
  }

  private renderBucketsSection(parent: HTMLElement): void {
    const section = parent.createDiv('docket-settings-section');

    const sh = section.createDiv('docket-settings-section-header');
    new Setting(sh).setName('Sections').setHeading().setDesc('Task containers displayed on the Dashboard. You can also edit icon and color directly from the dashboard.');

    const tableWrapper = section.createDiv('docket-settings-table-wrapper');
    this.renderBucketRows(tableWrapper);

    const addBtn = section.createEl('button', {
      cls: 'mod-cta docket-add-btn',
      text: '+ Add section',
    });
    addBtn.addEventListener('click', () => {
      const maxOrder = this.plugin.settings.buckets.reduce((max, b) => Math.max(max, b.order), -1);
      this.plugin.settings.buckets.push({
        id: generateId(),
        name: 'New section',
        icon: '📌',
        color: '#888888',
        order: maxOrder + 1,
        showCounter: false,
        widthPx: 320,
      });
      void this.plugin.saveSettings();
      this.display();
    });
  }

  private renderBucketRows(container: HTMLElement): void {
    container.empty();

    const headerRow = container.createDiv('docket-settings-row docket-settings-header-row');
    ['Icon', 'Name', 'Color', 'Counter', 'Actions'].forEach((label) => {
      headerRow.createDiv({ cls: 'docket-settings-cell', text: label });
    });

    const sorted = [...this.plugin.settings.buckets].sort((a, b) => a.order - b.order);

    sorted.forEach((bucket, index) => {
      const row = container.createDiv('docket-settings-row');
      row.dataset.bucketId = bucket.id;

      const iconCell = row.createDiv('docket-settings-cell');
      const iconInput = iconCell.createEl('input', {
        cls: 'docket-settings-icon-input',
        attr: { type: 'text', value: bucket.icon, maxlength: '4' },
      });
      iconInput.addEventListener('change', () => {
        bucket.icon = iconInput.value || '📌';
        void this.plugin.saveSettings();
      });

      const nameCell = row.createDiv('docket-settings-cell');
      const nameInput = nameCell.createEl('input', {
        cls: 'docket-settings-text-input',
        attr: { type: 'text', value: bucket.name },
      });

      const saveSectionName = () => {
        bucket.name = nameInput.value.trim() || 'Section';
        void this.plugin.saveSettings();
      };

      nameInput.addEventListener('change', saveSectionName);
      nameInput.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          void saveSectionName();
          nameInput.blur();
        }
      });

      const colorCell = row.createDiv('docket-settings-cell');
      const colorWrapper = colorCell.createDiv('docket-color-input-wrapper');
      const colorSwatch = colorWrapper.createDiv('docket-color-swatch');
      colorSwatch.setCssStyles({ backgroundColor: bucket.color });

      const colorInput = colorWrapper.createEl('input', {
        cls: 'docket-settings-color-input',
        attr: { type: 'color', value: bucket.color },
      });
      colorInput.addEventListener('input', () => {
        bucket.color = colorInput.value;
        colorSwatch.setCssStyles({ backgroundColor: bucket.color });
        void this.plugin.saveSettings();
      });

      const counterCell = row.createDiv('docket-settings-cell');
      const counterCheckbox = counterCell.createEl('input', {
        cls: 'docket-settings-checkbox',
        attr: { type: 'checkbox' },
      });
      counterCheckbox.checked = bucket.showCounter;
      counterCheckbox.addEventListener('change', () => {
        bucket.showCounter = counterCheckbox.checked;
        void this.plugin.saveSettings();
      });

      const actCell = row.createDiv('docket-settings-cell docket-settings-actions');

      const upBtn = actCell.createEl('button', {
        cls: 'docket-icon-btn',
        attr: { title: 'Move up' },
      });
      upBtn.createSpan({ text: '↑' });
      if (index === 0) {
        upBtn.disabled = true;
      } else {
        upBtn.addEventListener('click', () => {
          const prev = sorted[index - 1];
          [bucket.order, prev.order] = [prev.order, bucket.order];
          void this.plugin.saveSettings();
          this.display();
        });
      }

      const downBtn = actCell.createEl('button', {
        cls: 'docket-icon-btn',
        attr: { title: 'Move down' },
      });
      downBtn.createSpan({ text: '↓' });
      if (index === sorted.length - 1) {
        downBtn.disabled = true;
      } else {
        downBtn.addEventListener('click', () => {
          const next = sorted[index + 1];
          [bucket.order, next.order] = [next.order, bucket.order];
          void this.plugin.saveSettings();
          this.display();
        });
      }

      const delBtn = actCell.createEl('button', {
        cls: 'mod-warning docket-del-btn',
        attr: { title: `Delete "${bucket.name}" (tasks are preserved)` },
        text: 'Delete',
      });
      delBtn.addEventListener('click', () => {
        new ConfirmModal(this.plugin.app, `Delete section "${bucket.name}"?\n\nTasks inside will remain but won't appear on the Dashboard until assigned to another section.`, () => {
          this.plugin.settings.buckets = this.plugin.settings.buckets.filter(
            (b) => b.id !== bucket.id,
          );
          normalizeBucketOrder(this.plugin.settings.buckets);
          void this.plugin.saveSettings();
          this.display();
        }).open();
      });
    });
  }

  private renderTagsSection(parent: HTMLElement): void {
    const section = parent.createDiv('docket-settings-section');

    const sh = section.createDiv('docket-settings-section-header');
    new Setting(sh).setName('Semantic tags').setHeading().setDesc('Tags categorize tasks and enable filtering. Use #TagName syntax when creating tasks. The DeepWork tag is the default deep work tag.');

    const tableWrapper = section.createDiv('docket-settings-table-wrapper');
    this.renderTagRows(tableWrapper);

    const addBtn = section.createEl('button', {
      cls: 'mod-cta docket-add-btn',
      text: '+ Add tag',
    });
    addBtn.addEventListener('click', () => {
      this.plugin.settings.tags.push({
        id: generateId(),
        name: 'NewTag',
        color: '#888888',
      });
      void this.plugin.saveSettings();
      this.display();
    });
  }

  private renderTagRows(container: HTMLElement): void {
    container.empty();

    const headerRow = container.createDiv('docket-settings-row docket-settings-header-row');
    ['Name', 'Color', 'Preview', 'Actions'].forEach((label) => {
      headerRow.createDiv({ cls: 'docket-settings-cell', text: label });
    });

    this.plugin.settings.tags.forEach((tag) => {
      const row = container.createDiv('docket-settings-row');

      const nameCell = row.createDiv('docket-settings-cell');
      const nameInput = nameCell.createEl('input', {
        cls: 'docket-settings-text-input',
        attr: { type: 'text', value: tag.name },
      });

      const saveTagName = () => {
        tag.name = nameInput.value.replace(/\s+/g, '').replace(/[^A-Za-z0-9_-]/g, '') || 'Tag';
        nameInput.value = tag.name;
        previewPill.textContent = `#${tag.name}`;
        void this.plugin.saveSettings();
      };

      nameInput.addEventListener('change', saveTagName);
      nameInput.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          void saveTagName();
          nameInput.blur();
        }
      });

      const colorCell = row.createDiv('docket-settings-cell');
      const colorWrapper = colorCell.createDiv('docket-color-input-wrapper');
      const colorSwatch = colorWrapper.createDiv('docket-color-swatch');
      colorSwatch.setCssStyles({ backgroundColor: tag.color });

      const colorInput = colorWrapper.createEl('input', {
        cls: 'docket-settings-color-input',
        attr: { type: 'color', value: tag.color },
      });
      colorInput.addEventListener('input', () => {
        tag.color = colorInput.value;
        colorSwatch.setCssStyles({ backgroundColor: tag.color });
        previewPill.setCssProps({ '--docket-tag-color': tag.color });
        void this.plugin.saveSettings();
      });

      const previewCell = row.createDiv('docket-settings-cell');
      const previewPill = previewCell.createSpan({
        cls: 'docket-inline-tag',
        text: `#${tag.name}`,
      });
      previewPill.setCssProps({ '--docket-tag-color': tag.color });

      const actCell = row.createDiv('docket-settings-cell');
      const delBtn = actCell.createEl('button', {
        cls: 'mod-warning docket-del-btn',
        text: 'Delete',
        attr: { title: `Delete #${tag.name} (removed from all tasks)` },
      });
      delBtn.addEventListener('click', () => {
        new ConfirmModal(this.plugin.app, `Delete tag #${tag.name}?\n\nIt will be removed from all tasks.`, () => {
          this.plugin.settings.tags = this.plugin.settings.tags.filter((t) => t.id !== tag.id);
          this.plugin.settings.tasks.forEach((task) => {
            task.tags = task.tags.filter((id) => id !== tag.id);
          });
          if (this.plugin.settings.deepWorkTagId === tag.id) {
            this.plugin.settings.deepWorkTagId = this.plugin.settings.tags[0]?.id ?? '';
          }
          void this.plugin.saveSettings();
          this.display();
        }).open();
      });
    });
  }
}
