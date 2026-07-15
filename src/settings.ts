/**
 * settings.ts — PluginSettingTab for Docket.
 *
 * Provides full CRUD UI for Buckets and Tags.
 */

import { App, PluginSettingTab } from 'obsidian';
import DocketPlugin from './main';
import { generateId, normalizeBucketOrder } from './types';

export class DocketSettingTab extends PluginSettingTab {
  plugin: DocketPlugin;

  constructor(app: App, plugin: DocketPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass('docket-settings');

    const header = containerEl.createDiv('docket-settings-header');
    header.createEl('h2', { text: '🗂️ Docket' });
    header.createEl('p', {
      cls: 'docket-settings-intro',
      text: 'Configure your task containers and semantic tags. Changes apply immediately.',
    });

    this.renderBucketsSection(containerEl);
    this.renderTagsSection(containerEl);
  }

  private renderBucketsSection(parent: HTMLElement): void {
    const section = parent.createDiv('docket-settings-section');

    const sh = section.createDiv('docket-settings-section-header');
    sh.createEl('h3', { text: 'Sections' });
    sh.createEl('p', {
      cls: 'docket-settings-desc',
      text: 'Task containers displayed on the Dashboard. You can also edit icon and color directly from the dashboard.',
    });

    const tableWrapper = section.createDiv('docket-settings-table-wrapper');
    this.renderBucketRows(tableWrapper);

    const addBtn = section.createEl('button', {
      cls: 'mod-cta docket-add-btn',
      text: '+ Add Section',
    });
    addBtn.addEventListener('click', async () => {
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
      iconInput.addEventListener('change', async () => {
        bucket.icon = iconInput.value || '📌';
        await this.plugin.saveSettings();
      });

      const nameCell = row.createDiv('docket-settings-cell');
      const nameInput = nameCell.createEl('input', {
        cls: 'docket-settings-text-input',
        attr: { type: 'text', value: bucket.name },
      });

      const saveSectionName = async () => {
        bucket.name = nameInput.value.trim() || 'Section';
        await this.plugin.saveSettings();
      };

      nameInput.addEventListener('change', saveSectionName);
      nameInput.addEventListener('keydown', async (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          await saveSectionName();
          nameInput.blur();
        }
      });

      const colorCell = row.createDiv('docket-settings-cell');
      const colorWrapper = colorCell.createDiv('docket-color-input-wrapper');
      const colorSwatch = colorWrapper.createDiv('docket-color-swatch');
      colorSwatch.style.backgroundColor = bucket.color;

      const colorInput = colorWrapper.createEl('input', {
        cls: 'docket-settings-color-input',
        attr: { type: 'color', value: bucket.color },
      });
      colorInput.addEventListener('input', async () => {
        bucket.color = colorInput.value;
        colorSwatch.style.backgroundColor = bucket.color;
        await this.plugin.saveSettings();
      });

      const counterCell = row.createDiv('docket-settings-cell');
      const counterCheckbox = counterCell.createEl('input', {
        cls: 'docket-settings-checkbox',
        attr: { type: 'checkbox' },
      }) as HTMLInputElement;
      counterCheckbox.checked = bucket.showCounter;
      counterCheckbox.addEventListener('change', async () => {
        bucket.showCounter = counterCheckbox.checked;
        await this.plugin.saveSettings();
      });

      const actCell = row.createDiv('docket-settings-cell docket-settings-actions');

      const upBtn = actCell.createEl('button', {
        cls: 'docket-icon-btn',
        attr: { title: 'Move up' },
      });
      upBtn.createEl('span', { text: '↑' });
      if (index === 0) {
        upBtn.disabled = true;
      } else {
        upBtn.addEventListener('click', async () => {
          const prev = sorted[index - 1];
          [bucket.order, prev.order] = [prev.order, bucket.order];
          await this.plugin.saveSettings();
          this.display();
        });
      }

      const downBtn = actCell.createEl('button', {
        cls: 'docket-icon-btn',
        attr: { title: 'Move down' },
      });
      downBtn.createEl('span', { text: '↓' });
      if (index === sorted.length - 1) {
        downBtn.disabled = true;
      } else {
        downBtn.addEventListener('click', async () => {
          const next = sorted[index + 1];
          [bucket.order, next.order] = [next.order, bucket.order];
          await this.plugin.saveSettings();
          this.display();
        });
      }

      const delBtn = actCell.createEl('button', {
        cls: 'mod-warning docket-del-btn',
        attr: { title: `Delete "${bucket.name}" (tasks are preserved)` },
        text: 'Delete',
      });
      delBtn.addEventListener('click', async () => {
        if (
          !confirm(
            `Delete section "${bucket.name}"?\n\nTasks inside will remain but won't appear on the Dashboard until assigned to another section.`,
          )
        ) {
          return;
        }
        this.plugin.settings.buckets = this.plugin.settings.buckets.filter(
          (b) => b.id !== bucket.id,
        );
        normalizeBucketOrder(this.plugin.settings.buckets);
        await this.plugin.saveSettings();
        this.display();
      });
    });
  }

  private renderTagsSection(parent: HTMLElement): void {
    const section = parent.createDiv('docket-settings-section');

    const sh = section.createDiv('docket-settings-section-header');
    sh.createEl('h3', { text: 'Semantic Tags' });
    sh.createEl('p', {
      cls: 'docket-settings-desc',
      text: 'Tags categorize tasks and enable filtering. Use #TagName syntax when creating tasks. The DeepWork tag is the default deep work tag.',
    });

    const tableWrapper = section.createDiv('docket-settings-table-wrapper');
    this.renderTagRows(tableWrapper);

    const addBtn = section.createEl('button', {
      cls: 'mod-cta docket-add-btn',
      text: '+ Add Tag',
    });
    addBtn.addEventListener('click', async () => {
      this.plugin.settings.tags.push({
        id: generateId(),
        name: 'NewTag',
        color: '#888888',
      });
      await this.plugin.saveSettings();
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

      const saveTagName = async () => {
        tag.name = nameInput.value.replace(/\s+/g, '').replace(/[^A-Za-z0-9_-]/g, '') || 'Tag';
        nameInput.value = tag.name;
        previewPill.textContent = `#${tag.name}`;
        await this.plugin.saveSettings();
      };

      nameInput.addEventListener('change', saveTagName);
      nameInput.addEventListener('keydown', async (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          await saveTagName();
          nameInput.blur();
        }
      });

      const colorCell = row.createDiv('docket-settings-cell');
      const colorWrapper = colorCell.createDiv('docket-color-input-wrapper');
      const colorSwatch = colorWrapper.createDiv('docket-color-swatch');
      colorSwatch.style.backgroundColor = tag.color;

      const colorInput = colorWrapper.createEl('input', {
        cls: 'docket-settings-color-input',
        attr: { type: 'color', value: tag.color },
      });
      colorInput.addEventListener('input', async () => {
        tag.color = colorInput.value;
        colorSwatch.style.backgroundColor = tag.color;
        previewPill.style.setProperty('--docket-tag-color', tag.color);
        await this.plugin.saveSettings();
      });

      const previewCell = row.createDiv('docket-settings-cell');
      const previewPill = previewCell.createSpan({
        cls: 'docket-inline-tag',
        text: `#${tag.name}`,
      });
      previewPill.style.setProperty('--docket-tag-color', tag.color);

      const actCell = row.createDiv('docket-settings-cell');
      const delBtn = actCell.createEl('button', {
        cls: 'mod-warning docket-del-btn',
        text: 'Delete',
        attr: { title: `Delete #${tag.name} (removed from all tasks)` },
      });
      delBtn.addEventListener('click', async () => {
        if (!confirm(`Delete tag #${tag.name}?\n\nIt will be removed from all tasks.`)) return;
        this.plugin.settings.tags = this.plugin.settings.tags.filter((t) => t.id !== tag.id);
        this.plugin.settings.tasks.forEach((task) => {
          task.tags = task.tags.filter((id) => id !== tag.id);
        });
        if (this.plugin.settings.deepWorkTagId === tag.id) {
          this.plugin.settings.deepWorkTagId = this.plugin.settings.tags[0]?.id ?? '';
        }
        await this.plugin.saveSettings();
        this.display();
      });
    });
  }
}
