/**
 * DocketView.ts — Main ItemView that hosts the Docket plugin UI.
 *
 * Responsibilities:
 *  - Render the top navigation bar (tabs)
 *  - Render the Quick Capture bar (Dashboard only)
 *  - Route between Dashboard and Archive tab panels
 *  - Coordinate cross-cutting concerns: tag filtering, quick capture
 */

import { ItemView, WorkspaceLeaf } from 'obsidian';
import DocketPlugin from './main';
import { DashboardTab } from './DashboardTab';
import { ArchiveTab } from './ArchiveTab';

export const VIEW_TYPE_DOCKET = 'docket-view';

type TabName = 'dashboard' | 'archive';

export class DocketView extends ItemView {
  private plugin: DocketPlugin;

  // State
  private currentTab: TabName = 'dashboard';
  private activeTagFilters: string[] = [];

  // Tab instances (lazily initialised on first render)
  private dashboardTab!: DashboardTab;
  private archiveTab!: ArchiveTab;

  // DOM refs
  private navEl!: HTMLElement;
  private quickCaptureEl!: HTMLElement;
  private quickCaptureInput!: HTMLInputElement;
  private tagPillsContainer!: HTMLElement;
  private dashboardPanel!: HTMLElement;
  private archivePanel!: HTMLElement;

  constructor(leaf: WorkspaceLeaf, plugin: DocketPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  // -------------------------------------------------------------------------
  // ItemView overrides
  // -------------------------------------------------------------------------

  getViewType(): string {
    return VIEW_TYPE_DOCKET;
  }

  getDisplayText(): string {
    return 'Docket';
  }

  getIcon(): string {
    return 'layout-dashboard';
  }

  async onOpen(): Promise<void> {
    this.contentEl.empty();
    this.contentEl.addClass('docket-view');

    this.buildNav();
    this.buildQuickCapture();
    this.buildContent();
    this.switchToTab('dashboard');
  }

  async onClose(): Promise<void> {
    // Nothing extra to clean up — DOM is managed by Obsidian
  }

  // -------------------------------------------------------------------------
  // Build: Navigation Bar
  // -------------------------------------------------------------------------

  private buildNav(): void {
    this.navEl = this.contentEl.createDiv('docket-nav');

    const navLeft = this.navEl.createDiv('docket-nav-left');

    const brand = navLeft.createDiv('docket-brand');
    brand.createSpan({ cls: 'docket-brand-icon', text: '🗂️' });
    brand.createSpan({ cls: 'docket-brand-name', text: 'Docket' });

    const tabGroup = navLeft.createDiv('docket-tab-group');
    const tabs: Array<{ id: TabName; label: string }> = [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'archive', label: 'Archive' },
    ];

    tabs.forEach(({ id, label }) => {
      const tab = tabGroup.createDiv({ cls: 'docket-nav-tab', text: label });
      tab.dataset.tab = id;
      tab.addEventListener('click', () => this.switchToTab(id));
    });
  }

  // -------------------------------------------------------------------------
  // Build: Quick Capture Bar
  // -------------------------------------------------------------------------

  private buildQuickCapture(): void {
    this.quickCaptureEl = this.contentEl.createDiv('docket-quick-capture');

    const row = this.quickCaptureEl.createDiv('docket-qc-row');
    const inputWrapper = row.createDiv('docket-qc-input-wrapper');

    this.quickCaptureInput = inputWrapper.createEl('input', {
      cls: 'docket-qc-input',
      attr: {
        type: 'text',
        placeholder: 'Search tasks…',
      },
    });

    this.tagPillsContainer = row.createDiv('docket-qc-tag-filters');
    this.renderTagPills();

    this.quickCaptureInput.addEventListener('input', () => {
      const query = this.quickCaptureInput.value.trim();
      this.dashboardTab?.applySearchFilter(query);
    });

    this.quickCaptureInput.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.quickCaptureInput.value = '';
        this.dashboardTab?.applySearchFilter('');
        this.quickCaptureInput.blur();
      }
    });
  }

  // -------------------------------------------------------------------------
  // Build: Content area with two tab panels
  // -------------------------------------------------------------------------

  private buildContent(): void {
    const contentArea = this.contentEl.createDiv('docket-content');

    this.dashboardPanel = contentArea.createDiv({
      cls: 'docket-tab-panel',
      attr: { 'data-panel': 'dashboard' },
    });
    this.dashboardTab = new DashboardTab(this.dashboardPanel, this.plugin);

    this.archivePanel = contentArea.createDiv({
      cls: 'docket-tab-panel',
      attr: { 'data-panel': 'archive' },
    });
    this.archiveTab = new ArchiveTab(this.archivePanel, this.plugin);
  }

  // -------------------------------------------------------------------------
  // Tab switching
  // -------------------------------------------------------------------------

  switchToTab(tab: TabName): void {
    this.currentTab = tab;

    this.navEl.querySelectorAll('.docket-nav-tab').forEach((el) => {
      el.classList.toggle('is-active', (el as HTMLElement).dataset.tab === tab);
    });

    this.quickCaptureEl.classList.toggle('is-hidden', tab !== 'dashboard');

    [this.dashboardPanel, this.archivePanel].forEach((p) => {
      p.classList.remove('is-active');
    });

    switch (tab) {
      case 'dashboard':
        this.dashboardPanel.classList.add('is-active');
        this.dashboardTab.render();
        if (this.activeTagFilters.length > 0) {
          this.dashboardTab.applyTagFilter(this.activeTagFilters);
        }
        break;

      case 'archive':
        this.archivePanel.classList.add('is-active');
        this.archiveTab.render();
        break;
    }
  }

  // -------------------------------------------------------------------------
  // Tag Filters (Quick Capture bar)
  // -------------------------------------------------------------------------

  renderTagPills(): void {
    this.tagPillsContainer.empty();

    if (this.plugin.settings.tags.length === 0) return;

    const clearPill = this.tagPillsContainer.createDiv({
      cls: 'docket-tag-filter-pill docket-tag-filter-all',
      text: 'All',
    });
    clearPill.classList.toggle('is-active', this.activeTagFilters.length === 0);
    clearPill.addEventListener('click', () => {
      this.activeTagFilters = [];
      this.renderTagPills();
      this.dashboardTab?.applyTagFilter([]);
    });

    this.plugin.settings.tags.forEach((tag) => {
      const isActive = this.activeTagFilters.includes(tag.id);
      const pill = this.tagPillsContainer.createDiv({
        cls: 'docket-tag-filter-pill',
      });
      pill.dataset.tagId = tag.id;
      pill.style.setProperty('--docket-pill-color', tag.color);
      pill.classList.toggle('is-active', isActive);

      pill.createSpan({ cls: 'docket-tag-filter-label', text: `#${tag.name}` });

      if (isActive) {
        const removeBtn = pill.createSpan({ cls: 'docket-tag-filter-remove', text: '×' });
        removeBtn.setAttribute('title', `Remove #${tag.name} filter`);
        removeBtn.addEventListener('click', (e: MouseEvent) => {
          e.stopPropagation();
          this.removeTagFilter(tag.id);
        });
      }

      pill.addEventListener('click', () => this.toggleTagFilter(tag.id));
    });
  }

  private toggleTagFilter(tagId: string): void {
    const idx = this.activeTagFilters.indexOf(tagId);
    if (idx >= 0) {
      this.activeTagFilters.splice(idx, 1);
    } else {
      this.activeTagFilters.push(tagId);
    }
    this.renderTagPills();
    this.dashboardTab?.applyTagFilter(this.activeTagFilters);
  }

  private removeTagFilter(tagId: string): void {
    this.activeTagFilters = this.activeTagFilters.filter((id) => id !== tagId);
    this.renderTagPills();
    this.dashboardTab?.applyTagFilter(this.activeTagFilters);
  }

  // -------------------------------------------------------------------------
  // Refresh (called by plugin.saveSettings after any data change)
  // -------------------------------------------------------------------------

  refresh(): void {
    this.renderTagPills();
    this.switchToTab(this.currentTab);
  }
}
