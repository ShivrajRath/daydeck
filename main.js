"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => DayDeckPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian5 = require("obsidian");

// src/types.ts
var DEFAULT_BUCKETS = [
  {
    id: "today",
    name: "Today",
    icon: "\u{1F525}",
    color: "#f14c4c",
    order: 0,
    showCounter: false,
    widthPx: 320,
    tooltip: {
      description: "These are things you actively expect to work on today.",
      examples: [
        "Finish the quarterly report",
        "Reply to urgent client emails",
        "Complete the code review",
        "Prepare for the 3pm meeting"
      ]
    }
  },
  {
    id: "next",
    name: "Next",
    icon: "\u23ED\uFE0F",
    color: "#d7ba7d",
    order: 1,
    showCounter: false,
    widthPx: 320,
    tooltip: {
      description: "Things that matter soon but not today, maybe this week.",
      examples: [
        "Plan the sprint roadmap",
        "Draft the project proposal",
        "Schedule team retrospective",
        "Review the new feature requirements"
      ]
    }
  },
  {
    id: "waiting",
    name: "Waiting",
    icon: "\u{1F91D}",
    color: "#c586c0",
    order: 2,
    showCounter: true,
    widthPx: 320,
    tooltip: {
      description: "Things blocked on someone else.",
      examples: [
        "Waiting for design approval",
        "Awaiting client feedback",
        "Blocked on API documentation",
        "Waiting for server deployment"
      ]
    }
  },
  {
    id: "focus-hub",
    name: "Deep Work",
    icon: "\u{1F9E0}",
    color: "#b4befe",
    order: 3,
    showCounter: false,
    widthPx: 320,
    tooltip: {
      description: "These require uninterrupted thinking.",
      examples: [
        "Write the core algorithm",
        "Design the system architecture",
        "Debug the complex issue",
        "Research the new technology"
      ]
    }
  },
  {
    id: "learning",
    name: "Learning",
    icon: "\u{1F4DA}",
    color: "#4ec9b0",
    order: 4,
    showCounter: false,
    widthPx: 320,
    tooltip: {
      description: 'Everything here should answer "Will reading this make me better?"',
      examples: [
        "Read the engineering blog",
        "Complete the online course",
        "Study the design patterns",
        "Learn the new framework"
      ]
    }
  },
  {
    id: "ideas",
    name: "Ideas",
    icon: "\u{1F4A1}",
    color: "#ce9178",
    order: 5,
    showCounter: false,
    widthPx: 320,
    tooltip: {
      description: "Random thoughts (Automation ideas, feature ideas, career ideas, architecture ideas).",
      examples: [
        "Automate the deployment process",
        "Add dark mode to the app",
        "Explore the tech lead role",
        "Refactor the database schema"
      ]
    }
  },
  {
    id: "watch",
    name: "Watch",
    icon: "\u{1F50D}",
    color: "#4fc1ff",
    order: 6,
    showCounter: false,
    widthPx: 320,
    tooltip: {
      description: "Things you are monitoring.",
      examples: [
        "Track the competitor launch",
        "Monitor the system performance",
        "Watch the industry trends",
        "Follow the open source project"
      ]
    }
  }
];
var DEFAULT_TAGS = [
  { id: "focus", name: "Focus", color: "#f14c4c" },
  { id: "ops", name: "Ops", color: "#4ec9b0" },
  { id: "sync", name: "Sync", color: "#c586c0" },
  { id: "rd", name: "RD", color: "#4fc1ff" },
  { id: "personal", name: "Personal", color: "#ce9178" },
  { id: "design", name: "Design", color: "#d7ba7d" },
  { id: "review", name: "Review", color: "#b5cea8" },
  { id: "maintenance", name: "Maintenance", color: "#f5a97f" },
  { id: "idea", name: "Idea", color: "#eead39" },
  { id: "finance", name: "Finance", color: "#939ab7" }
];
var DEFAULT_SETTINGS = {
  buckets: DEFAULT_BUCKETS,
  tags: DEFAULT_TAGS,
  tasks: [],
  deepWorkTagId: "focus",
  version: 1
};
function generateId() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}
function parseTaskInput(input, tags) {
  const text = input.replace(/#([A-Za-z0-9_-]+)/g, "").replace(/\s+/g, " ").trim();
  const tagIds = [];
  const newTags = [];
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
function formatWaitingTime(sinceMs) {
  const diff = Date.now() - sinceMs;
  if (diff < 0) return "just now";
  const minutes = Math.floor(diff / (1e3 * 60));
  const hours = Math.floor(diff / (1e3 * 60 * 60));
  const days = Math.floor(diff / (1e3 * 60 * 60 * 24));
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return "just now";
}
function normalizeBucketOrder(buckets) {
  buckets.sort((a, b) => a.order - b.order).forEach((bucket, index) => {
    bucket.order = index;
  });
}

// src/DayDeckView.ts
var import_obsidian3 = require("obsidian");

// src/DashboardTab.ts
var import_obsidian2 = require("obsidian");

// src/ConfirmModal.ts
var import_obsidian = require("obsidian");
var ConfirmModal = class extends import_obsidian.Modal {
  constructor(app, message, onConfirm, onCancel) {
    super(app);
    this.message = message;
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Confirm" });
    const lines = this.message.split("\n");
    lines.forEach((line) => {
      contentEl.createEl("p", { text: line });
    });
    new import_obsidian.Setting(contentEl).addButton(
      (btn) => btn.setButtonText("Cancel").onClick(() => {
        this.close();
        if (this.onCancel) {
          this.onCancel();
        }
      })
    ).addButton(
      (btn) => btn.setButtonText("Confirm").setCta().onClick(() => {
        this.close();
        this.onConfirm();
      })
    );
  }
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
};

// src/DashboardTab.ts
var _draggedTaskId = null;
var _draggedBucketId = null;
var DashboardTab = class {
  constructor(container, plugin) {
    this.container = container;
    this.plugin = plugin;
  }
  render() {
    this.container.empty();
    const inner = this.container.createDiv("docket-dashboard");
    const grid = inner.createDiv("docket-bucket-grid");
    const sorted = [...this.plugin.settings.buckets].sort((a, b) => a.order - b.order);
    sorted.forEach((bucket) => this.renderBucket(bucket, grid));
    const addSectionBtn = inner.createDiv({ cls: "docket-add-section-btn", text: "+ Add section" });
    addSectionBtn.addEventListener("click", async () => {
      const maxOrder = this.plugin.settings.buckets.reduce((max, b) => Math.max(max, b.order), -1);
      this.plugin.settings.buckets.push({
        id: generateId(),
        name: "New section",
        icon: "\u{1F4CC}",
        color: "#888888",
        order: maxOrder + 1,
        showCounter: false,
        widthPx: 320
      });
      await this.plugin.saveSettings();
    });
  }
  renderBucket(bucket, parent) {
    var _a;
    const tasks = this.getActiveTasks(bucket.id);
    const bucketEl = parent.createDiv("docket-bucket");
    bucketEl.dataset.bucketId = bucket.id;
    bucketEl.setCssProps({ "--docket-bucket-color": bucket.color });
    const widthPx = Math.max(240, Math.min(900, (_a = bucket.widthPx) != null ? _a : 320));
    bucketEl.setCssProps({ "--docket-bucket-width": `${widthPx}px` });
    bucketEl.setCssStyles({ width: `${widthPx}px` });
    const resizeHandle = bucketEl.createDiv("docket-bucket-resize-handle");
    resizeHandle.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.startBucketResize(bucket, bucketEl, e);
    });
    const header = bucketEl.createDiv("docket-bucket-header");
    header.draggable = true;
    header.createSpan({
      cls: "docket-bucket-drag-handle",
      text: "\u283F",
      attr: { title: "Drag to reorder section" }
    });
    const titleEl = header.createDiv("docket-bucket-title");
    titleEl.createSpan({ cls: "docket-bucket-icon", text: bucket.icon });
    titleEl.createSpan({ cls: "docket-bucket-name", text: bucket.name });
    const rightActions = header.createDiv("docket-bucket-header-right");
    rightActions.createSpan({ cls: "docket-bucket-count", text: String(tasks.length) });
    if (bucket.tooltip) {
      const infoBtn = rightActions.createSpan({
        cls: "docket-bucket-info",
        text: "\u2139\uFE0F",
        attr: { title: "Section info" }
      });
      infoBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.showBucketTooltip(bucket);
      });
    }
    const editBtn = rightActions.createSpan({
      cls: "docket-bucket-edit",
      text: "\u270F\uFE0F",
      attr: { title: "Edit section" }
    });
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.showBucketEditModal(bucket);
    });
    const delBtn = rightActions.createSpan({
      cls: "docket-bucket-delete",
      text: "\u{1F5D1}\uFE0F",
      attr: { title: "Delete section" }
    });
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      new ConfirmModal(this.plugin.app, `Delete section "${bucket.name}"?
Tasks inside will remain but won't appear on the Dashboard.`, async () => {
        this.plugin.settings.buckets = this.plugin.settings.buckets.filter(
          (b) => b.id !== bucket.id
        );
        normalizeBucketOrder(this.plugin.settings.buckets);
        await this.plugin.saveSettings();
      }).open();
    });
    this.setupBucketDrag(header, bucketEl, bucket.id);
    const taskList = bucketEl.createDiv("docket-task-list");
    taskList.dataset.bucketId = bucket.id;
    this.setupDropZone(
      taskList,
      bucket.id,
      rightActions.querySelector(".docket-bucket-count")
    );
    taskList.addEventListener("click", (e) => {
      if (e.target === taskList) {
        this.spawnInlineCapture(
          taskList,
          bucket.id,
          rightActions.querySelector(".docket-bucket-count")
        );
      }
    });
    tasks.forEach((task) => this.renderTaskCard(task, taskList, bucket.id));
    const addBtn = bucketEl.createDiv({ cls: "docket-add-task-btn", text: "+ Add task" });
    addBtn.addEventListener("click", () => {
      this.spawnInlineCapture(
        taskList,
        bucket.id,
        rightActions.querySelector(".docket-bucket-count")
      );
    });
  }
  startBucketResize(bucket, bucketEl, event) {
    var _a;
    const startX = event.clientX;
    const startWidth = (_a = bucket.widthPx) != null ? _a : 320;
    const minWidth = 240;
    const maxWidth = 900;
    bucketEl.addClass("is-resizing");
    document.body.addClass("docket-is-resizing");
    const onMove = (moveEvent) => {
      const nextWidth = Math.max(
        minWidth,
        Math.min(maxWidth, startWidth + (moveEvent.clientX - startX))
      );
      bucket.widthPx = nextWidth;
      bucketEl.setCssProps({ "--docket-bucket-width": `${nextWidth}px` });
      bucketEl.setCssStyles({ width: `${nextWidth}px` });
    };
    const finish = async () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", finish);
      bucketEl.removeClass("is-resizing");
      document.body.removeClass("docket-is-resizing");
      await this.plugin.saveSettings(true);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", finish, { once: true });
  }
  showBucketEditModal(bucket) {
    new BucketEditModal(this.plugin, bucket).open();
  }
  showBucketTooltip(bucket) {
    new BucketTooltipModal(this.plugin, bucket).open();
  }
  setupBucketDrag(header, bucketEl, bucketId) {
    header.addEventListener("dragstart", (e) => {
      const dataTransfer = e.dataTransfer;
      if (!dataTransfer) return;
      _draggedBucketId = bucketId;
      dataTransfer.setData("application/docket-bucket", bucketId);
      dataTransfer.effectAllowed = "move";
      window.setTimeout(() => bucketEl.addClass("docket-bucket-dragging"), 0);
    });
    header.addEventListener("dragend", () => {
      bucketEl.removeClass("docket-bucket-dragging");
      _draggedBucketId = null;
      this.container.querySelectorAll(".docket-bucket-drop-target").forEach((el) => {
        el.removeClass("docket-bucket-drop-target");
      });
    });
    bucketEl.addEventListener("dragover", (e) => {
      const dataTransfer = e.dataTransfer;
      if (!_draggedBucketId || _draggedBucketId === bucketId || !dataTransfer) return;
      e.preventDefault();
      dataTransfer.dropEffect = "move";
      bucketEl.addClass("docket-bucket-drop-target");
    });
    bucketEl.addEventListener("dragleave", (e) => {
      if (!bucketEl.contains(e.relatedTarget)) {
        bucketEl.removeClass("docket-bucket-drop-target");
      }
    });
    bucketEl.addEventListener("drop", async (e) => {
      const dataTransfer = e.dataTransfer;
      e.preventDefault();
      bucketEl.removeClass("docket-bucket-drop-target");
      const sourceId = (dataTransfer == null ? void 0 : dataTransfer.getData("application/docket-bucket")) || _draggedBucketId;
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
  renderTaskCard(task, parent, bucketId) {
    var _a, _b;
    const { tags, buckets } = this.plugin.settings;
    const bucket = buckets.find((b) => b.id === bucketId);
    const showCounter = (_a = bucket == null ? void 0 : bucket.showCounter) != null ? _a : false;
    const card = parent.createDiv("docket-task-card");
    card.dataset.taskId = task.id;
    card.draggable = true;
    const firstTag = task.tags.length > 0 ? tags.find((t) => t.id === task.tags[0]) : null;
    if (firstTag) {
      card.setCssProps({ "--docket-indicator-color": firstTag.color });
      card.addClass("has-indicator");
    }
    const taskMain = card.createDiv("docket-task-main");
    const checkbox = taskMain.createEl("input", {
      cls: "docket-task-checkbox",
      attr: { type: "checkbox" }
    });
    checkbox.checked = task.isCompleted;
    checkbox.addEventListener("change", async () => {
      task.isCompleted = checkbox.checked;
      task.completedAt = checkbox.checked ? Date.now() : void 0;
      await this.plugin.saveSettings();
    });
    const textEl = taskMain.createSpan({ cls: "docket-task-text", text: task.text });
    textEl.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      const input = taskMain.createEl("input", {
        cls: "docket-task-edit-input",
        attr: { type: "text", value: task.text }
      });
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
          for (const tagName of newTags) {
            const newTag = { id: generateId(), name: tagName, color: "#888888" };
            this.plugin.settings.tags.push(newTag);
            if (!task.tags.includes(newTag.id)) {
              task.tags.push(newTag.id);
            }
          }
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
      input.addEventListener("keydown", async (ev) => {
        if (ev.key === "Enter") {
          ev.preventDefault();
          await commit();
        }
        if (ev.key === "Escape") {
          committed = true;
          if (input.parentNode === taskMain) {
            taskMain.replaceChild(textEl, input);
          }
        }
      });
      input.addEventListener("blur", commit);
    });
    const reminderBtn = taskMain.createSpan({
      cls: "docket-task-reminder",
      attr: {
        title: task.reminderAt ? `Reminder: ${this.formatReminderLabel(task.reminderAt, task.reminderDateOnly)}` : "Set reminder"
      },
      text: task.reminderAt ? "\u{1F514}" : "\u{1F515}"
    });
    if (task.reminderAt) {
      reminderBtn.addClass("has-reminder");
      if (task.reminderAt <= Date.now()) reminderBtn.addClass("is-overdue");
    }
    reminderBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.showReminderModal(task);
    });
    const delBtn = taskMain.createSpan({
      cls: "docket-task-delete",
      attr: { title: "Delete task" },
      text: "\xD7"
    });
    delBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      this.plugin.settings.tasks = this.plugin.settings.tasks.filter((t) => t.id !== task.id);
      await this.plugin.saveSettings();
    });
    const metaRow = card.createDiv("docket-task-tag-row");
    task.tags.forEach((tagId) => {
      const tag = tags.find((t) => t.id === tagId);
      if (!tag) return;
      const pill = metaRow.createSpan({ cls: "docket-inline-tag", text: `#${tag.name}` });
      pill.setCssProps({ "--docket-tag-color": tag.color });
      const removeTag = pill.createSpan({ cls: "docket-inline-tag-remove", text: "\xD7" });
      removeTag.addEventListener("click", async (e) => {
        e.stopPropagation();
        task.tags = task.tags.filter((id) => id !== tagId);
        await this.plugin.saveSettings();
      });
    });
    if (showCounter) {
      const since = (_b = task.bucketUpdatedAt) != null ? _b : task.createdAt;
      metaRow.createSpan({
        cls: "docket-waiting-time",
        text: `\u23F3 ${formatWaitingTime(since)}`
      });
    }
    if (task.reminderAt) {
      const reminderLabel = metaRow.createSpan({
        cls: "docket-reminder-label",
        text: `\u{1F514} ${this.formatReminderLabel(task.reminderAt, task.reminderDateOnly)}`
      });
      if (task.reminderAt <= Date.now()) reminderLabel.addClass("is-overdue");
    }
    card.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.showTaskContextMenu(e, task);
    });
    card.addEventListener("dragstart", (e) => {
      const dataTransfer = e.dataTransfer;
      if (!dataTransfer) return;
      _draggedTaskId = task.id;
      dataTransfer.setData("text/plain", task.id);
      dataTransfer.effectAllowed = "move";
      window.setTimeout(() => card.addClass("docket-dragging"), 0);
    });
    card.addEventListener("dragend", () => {
      card.removeClass("docket-dragging");
      _draggedTaskId = null;
    });
    return card;
  }
  formatReminderLabel(timestamp, dateOnly) {
    const date = new Date(timestamp);
    const now = /* @__PURE__ */ new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (dateOnly) {
      if (isToday) return "Today";
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric"
      });
    }
    const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    if (isToday) return `Today ${time}`;
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }
  showReminderModal(task) {
    new ReminderModal(this.plugin, task).open();
  }
  setupDropZone(taskList, bucketId, countEl) {
    taskList.addEventListener("dragover", (e) => {
      const dataTransfer = e.dataTransfer;
      if (_draggedBucketId || !dataTransfer) return;
      e.preventDefault();
      dataTransfer.dropEffect = "move";
      taskList.addClass("docket-drag-over");
      this.updateDropIndicator(taskList, e.clientY);
    });
    taskList.addEventListener("dragleave", (e) => {
      if (!taskList.contains(e.relatedTarget)) {
        taskList.removeClass("docket-drag-over");
        this.removeDropIndicator(taskList);
      }
    });
    taskList.addEventListener("drop", async (e) => {
      const dataTransfer = e.dataTransfer;
      if (_draggedBucketId) return;
      e.preventDefault();
      taskList.removeClass("docket-drag-over");
      this.removeDropIndicator(taskList);
      const taskId = (dataTransfer == null ? void 0 : dataTransfer.getData("text/plain")) || _draggedTaskId;
      if (!taskId) return;
      const task = this.plugin.settings.tasks.find((t) => t.id === taskId);
      if (!task) return;
      if (task.bucketId !== bucketId) {
        task.bucketUpdatedAt = Date.now();
      }
      task.bucketId = bucketId;
      const visibleCards = Array.from(
        taskList.querySelectorAll(".docket-task-card:not(.docket-dragging)")
      );
      const dropIndex = this.getDropIndex(visibleCards, e.clientY);
      const bucketTasks = this.plugin.settings.tasks.filter((t) => t.bucketId === bucketId && t.id !== taskId && !t.isCompleted).sort((a, b) => a.order - b.order);
      bucketTasks.splice(dropIndex, 0, task);
      bucketTasks.forEach((t, i) => {
        t.order = i;
      });
      countEl.textContent = String(this.getActiveTasks(bucketId).length);
      await this.plugin.saveSettings();
    });
  }
  getDropIndex(cards, mouseY) {
    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect();
      if (mouseY < rect.top + rect.height / 2) return i;
    }
    return cards.length;
  }
  updateDropIndicator(taskList, mouseY) {
    this.removeDropIndicator(taskList);
    const cards = Array.from(
      taskList.querySelectorAll(".docket-task-card:not(.docket-dragging)")
    );
    const idx = this.getDropIndex(cards, mouseY);
    const indicator = createDiv({ cls: "docket-drop-indicator" });
    if (idx < cards.length) {
      taskList.insertBefore(indicator, cards[idx]);
    } else {
      taskList.appendChild(indicator);
    }
  }
  removeDropIndicator(taskList) {
    taskList.querySelectorAll(".docket-drop-indicator").forEach((el) => el.remove());
  }
  spawnInlineCapture(taskList, bucketId, _countEl) {
    if (taskList.querySelector(".docket-inline-capture")) return;
    const input = taskList.createEl("input", {
      cls: "docket-inline-capture",
      attr: { type: "text", placeholder: "New task\u2026 use #tag and Enter to save" }
    });
    input.focus();
    let suggestionBox = null;
    let selectedIndex = -1;
    let filteredTags = [];
    let hasNavigatedSuggestions = false;
    const showSuggestions = (query) => {
      if (suggestionBox) suggestionBox.remove();
      if (!query) {
        filteredTags = this.plugin.settings.tags;
      } else {
        const lowerQuery = query.toLowerCase();
        filteredTags = this.plugin.settings.tags.filter(
          (t) => t.name.toLowerCase().includes(lowerQuery)
        );
      }
      if (filteredTags.length === 0) return;
      suggestionBox = taskList.createDiv("docket-tag-suggestions");
      filteredTags.forEach((tag, index) => {
        const item = suggestionBox == null ? void 0 : suggestionBox.createDiv("docket-tag-suggestion-item");
        if (!item) return;
        item.textContent = `#${tag.name}`;
        item.setCssProps({ "--docket-tag-color": tag.color });
        item.dataset.index = String(index);
        item.addEventListener("click", () => {
          var _a;
          const cursorPos = (_a = input.selectionStart) != null ? _a : input.value.length;
          const textBefore = input.value.substring(0, cursorPos);
          const textAfter = input.value.substring(cursorPos);
          const lastHashIndex = textBefore.lastIndexOf("#");
          if (lastHashIndex !== -1) {
            const newText = textBefore.substring(0, lastHashIndex) + `#${tag.name} ` + textAfter;
            input.value = newText;
            input.focus();
            input.setSelectionRange(newText.length, newText.length);
          }
          suggestionBox == null ? void 0 : suggestionBox.remove();
          suggestionBox = null;
        });
        item.addEventListener("mouseover", () => {
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
      suggestionBox.querySelectorAll(".docket-tag-suggestion-item").forEach((item, index) => {
        item.classList.toggle("is-selected", index === selectedIndex);
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
    const getCurrentTagQuery = () => {
      var _a;
      const cursorPos = (_a = input.selectionStart) != null ? _a : input.value.length;
      const textBefore = input.value.substring(0, cursorPos);
      const lastHashIndex = textBefore.lastIndexOf("#");
      if (lastHashIndex === -1) return "";
      return textBefore.substring(lastHashIndex + 1);
    };
    input.addEventListener("input", () => {
      hasNavigatedSuggestions = false;
      const query = getCurrentTagQuery();
      if (query !== "" || input.value.includes("#")) {
        showSuggestions(query);
      } else {
        hideSuggestions();
      }
    });
    input.addEventListener("keydown", async (e) => {
      var _a;
      if (suggestionBox) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          hasNavigatedSuggestions = true;
          selectedIndex = Math.min(selectedIndex + 1, filteredTags.length - 1);
          updateSuggestionHighlight();
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          hasNavigatedSuggestions = true;
          selectedIndex = Math.max(selectedIndex - 1, 0);
          updateSuggestionHighlight();
          return;
        }
        if (e.key === "Enter" && hasNavigatedSuggestions && selectedIndex >= 0) {
          e.preventDefault();
          const selectedTag = filteredTags[selectedIndex];
          const cursorPos = (_a = input.selectionStart) != null ? _a : input.value.length;
          const textBefore = input.value.substring(0, cursorPos);
          const textAfter = input.value.substring(cursorPos);
          const lastHashIndex = textBefore.lastIndexOf("#");
          if (lastHashIndex !== -1) {
            const newText = textBefore.substring(0, lastHashIndex) + `#${selectedTag.name} ` + textAfter;
            input.value = newText;
            input.focus();
            input.setSelectionRange(newText.length, newText.length);
          }
          hideSuggestions();
          return;
        }
        if (e.key === "Escape") {
          hideSuggestions();
          return;
        }
      }
      if (e.key === "Enter") {
        e.preventDefault();
        await commit();
      }
      if (e.key === "Escape") {
        committed = true;
        hideSuggestions();
        input.remove();
      }
    });
    input.addEventListener("blur", () => {
      window.setTimeout(() => hideSuggestions(), 200);
      void commit();
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
        const newTag = { id: generateId(), name: tagName, color: "#888888" };
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
        order: maxOrder + 1
      });
      await this.plugin.saveSettings();
    };
  }
  showTaskContextMenu(e, task) {
    const menu = new import_obsidian2.Menu();
    const otherBuckets = this.plugin.settings.buckets.filter((b) => b.id !== task.bucketId);
    if (otherBuckets.length > 0) {
      otherBuckets.sort((a, b) => a.order - b.order).forEach((bucket) => {
        menu.addItem(
          (item) => item.setTitle(`Move to ${bucket.icon} ${bucket.name}`).setIcon("arrow-right").onClick(async () => {
            if (task.bucketId !== bucket.id) {
              task.bucketUpdatedAt = Date.now();
            }
            task.bucketId = bucket.id;
            await this.plugin.saveSettings();
          })
        );
      });
      menu.addSeparator();
    }
    menu.addItem(
      (item) => item.setTitle(task.reminderAt ? "Edit reminder" : "Set reminder").setIcon("bell").onClick(() => this.showReminderModal(task))
    );
    if (task.reminderAt) {
      menu.addItem(
        (item) => item.setTitle("Clear reminder").setIcon("bell-off").onClick(async () => {
          task.reminderAt = void 0;
          await this.plugin.saveSettings();
        })
      );
    }
    menu.addSeparator();
    this.plugin.settings.tags.forEach((tag) => {
      const hasTag = task.tags.includes(tag.id);
      menu.addItem(
        (item) => item.setTitle(`${hasTag ? "\u2713 " : ""}#${tag.name}`).setIcon(hasTag ? "check" : "tag").onClick(async () => {
          if (hasTag) {
            task.tags = task.tags.filter((id) => id !== tag.id);
          } else {
            task.tags = [...task.tags, tag.id];
          }
          await this.plugin.saveSettings();
        })
      );
    });
    menu.addSeparator();
    menu.addItem(
      (item) => item.setTitle("Delete task").setIcon("trash").onClick(async () => {
        this.plugin.settings.tasks = this.plugin.settings.tasks.filter((t) => t.id !== task.id);
        await this.plugin.saveSettings();
      })
    );
    menu.showAtMouseEvent(e);
  }
  applyTagFilter(activeTagIds) {
    const cards = this.container.querySelectorAll(".docket-task-card");
    cards.forEach((card) => {
      const taskId = card.dataset.taskId;
      const task = this.plugin.settings.tasks.find((t) => t.id === taskId);
      if (!task || activeTagIds.length === 0) {
        card.removeClass("is-filtered-out");
        return;
      }
      const matches = activeTagIds.some((id) => task.tags.includes(id));
      card.classList.toggle("is-filtered-out", !matches);
    });
  }
  applySearchFilter(query) {
    const q = query.toLowerCase();
    const cards = this.container.querySelectorAll(".docket-task-card");
    cards.forEach((card) => {
      const taskId = card.dataset.taskId;
      const task = this.plugin.settings.tasks.find((t) => t.id === taskId);
      if (!task || !q) {
        card.removeClass("is-search-hidden");
        return;
      }
      const matches = task.text.toLowerCase().includes(q);
      card.classList.toggle("is-search-hidden", !matches);
    });
  }
  getActiveTasks(bucketId) {
    return this.plugin.settings.tasks.filter((t) => t.bucketId === bucketId && !t.isCompleted).sort((a, b) => a.order - b.order);
  }
};
var BucketEditModal = class extends import_obsidian2.Modal {
  constructor(plugin, bucket) {
    super(plugin.app);
    this.plugin = plugin;
    this.bucket = bucket;
  }
  onOpen() {
    var _a, _b, _c;
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("docket-bucket-edit-modal");
    contentEl.createEl("h2", { text: "Edit Section" });
    new import_obsidian2.Setting(contentEl).setName("Icon").setDesc("Emoji or short text icon").addText((text) => {
      text.setValue(this.bucket.icon).onChange(async (value) => {
        this.bucket.icon = value || "\u{1F4CC}";
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian2.Setting(contentEl).setName("Name").addText((text) => {
      text.setValue(this.bucket.name).onChange(async (value) => {
        this.bucket.name = value.trim() || "Section";
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian2.Setting(contentEl).setName("Width").setDesc("Section width in pixels").addText((text) => {
      var _a2;
      text.inputEl.type = "number";
      text.inputEl.min = "240";
      text.inputEl.max = "900";
      text.setValue(String((_a2 = this.bucket.widthPx) != null ? _a2 : 320)).onChange(async (value) => {
        const parsed = Number.parseInt(value, 10);
        this.bucket.widthPx = Number.isFinite(parsed) ? Math.min(900, Math.max(240, parsed)) : 320;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian2.Setting(contentEl).setName("Color").setDesc("Accent color for the section header").addColorPicker((picker) => {
      picker.setValue(this.bucket.color).onChange(async (value) => {
        this.bucket.color = value;
        await this.plugin.saveSettings();
      });
    });
    const tooltipDesc = ((_a = this.bucket.tooltip) == null ? void 0 : _a.description) || "";
    const tooltipExamples = ((_c = (_b = this.bucket.tooltip) == null ? void 0 : _b.examples) == null ? void 0 : _c.join("\n")) || "";
    new import_obsidian2.Setting(contentEl).setName("Section Description").setDesc("Purpose of this section (shown in info tooltip)").addTextArea((text) => {
      text.setValue(tooltipDesc).onChange(async (value) => {
        if (!this.bucket.tooltip) {
          this.bucket.tooltip = { description: "", examples: [] };
        }
        this.bucket.tooltip.description = value.trim();
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian2.Setting(contentEl).setName("Section Examples").setDesc("4 practical examples (one per line, shown in info tooltip)").addTextArea((text) => {
      text.setValue(tooltipExamples).onChange(async (value) => {
        if (!this.bucket.tooltip) {
          this.bucket.tooltip = { description: "", examples: [] };
        }
        this.bucket.tooltip.examples = value.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
        await this.plugin.saveSettings();
      });
    });
  }
  onClose() {
    this.contentEl.empty();
  }
};
var ReminderModal = class extends import_obsidian2.Modal {
  constructor(plugin, task) {
    super(plugin.app);
    this.plugin = plugin;
    this.task = task;
  }
  onOpen() {
    var _a;
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("docket-reminder-modal");
    contentEl.createEl("h2", { text: "Set Reminder" });
    contentEl.createEl("p", {
      cls: "docket-reminder-task-text",
      text: this.task.text
    });
    const existing = this.task.reminderAt ? new Date(this.task.reminderAt) : new Date(Date.now() + 36e5);
    const dateStr = existing.toISOString().slice(0, 10);
    const timeStr = existing.toTimeString().slice(0, 5);
    let selectedDate = dateStr;
    let selectedTime = timeStr;
    let selectedDateOnly = (_a = this.task.reminderDateOnly) != null ? _a : false;
    new import_obsidian2.Setting(contentEl).setName("Date").addText((text) => {
      text.inputEl.type = "date";
      text.setValue(dateStr).onChange((value) => {
        selectedDate = value;
      });
    });
    new import_obsidian2.Setting(contentEl).setName("Time").addText((text) => {
      text.inputEl.type = "time";
      text.setValue(timeStr).onChange((value) => {
        selectedTime = value;
      });
    });
    new import_obsidian2.Setting(contentEl).setName("Date only").setDesc("Show date without sending a notification").addToggle((toggle) => {
      toggle.setValue(selectedDateOnly).onChange((value) => {
        selectedDateOnly = value;
      });
    });
    new import_obsidian2.Setting(contentEl).addButton((btn) => {
      btn.setButtonText("Save reminder").setCta().onClick(async () => {
        const reminderAt = (/* @__PURE__ */ new Date(`${selectedDate}T${selectedTime}`)).getTime();
        if (!Number.isNaN(reminderAt)) {
          this.task.reminderAt = reminderAt;
          this.task.reminderDateOnly = selectedDateOnly;
          this.task.reminderNotified = false;
          await this.plugin.saveSettings();
        }
        this.close();
      });
    }).addButton((btn) => {
      btn.setButtonText("Clear").onClick(async () => {
        this.task.reminderAt = void 0;
        this.task.reminderDateOnly = void 0;
        this.task.reminderNotified = void 0;
        await this.plugin.saveSettings();
        this.close();
      });
    });
  }
  onClose() {
    this.contentEl.empty();
  }
};
var BucketTooltipModal = class extends import_obsidian2.Modal {
  constructor(plugin, bucket) {
    super(plugin.app);
    this.plugin = plugin;
    this.bucket = bucket;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("docket-bucket-tooltip-modal");
    const header = contentEl.createDiv("docket-tooltip-header");
    header.createSpan({ cls: "docket-tooltip-icon", text: this.bucket.icon });
    header.createEl("h2", { text: this.bucket.name });
    const tooltip = this.bucket.tooltip;
    if (tooltip) {
      contentEl.createEl("p", {
        cls: "docket-tooltip-description",
        text: tooltip.description
      });
      contentEl.createEl("h3", {
        cls: "docket-tooltip-examples-title",
        text: "Examples"
      });
      const examplesList = contentEl.createEl("ul", {
        cls: "docket-tooltip-examples-list"
      });
      tooltip.examples.forEach((example) => {
        examplesList.createEl("li", {
          cls: "docket-tooltip-example-item",
          text: example
        });
      });
    }
    const closeBtn = contentEl.createDiv("docket-tooltip-close-btn");
    closeBtn.textContent = "Close";
    closeBtn.addEventListener("click", () => this.close());
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/ArchiveTab.ts
var ArchiveTab = class {
  constructor(container, plugin) {
    this.searchQuery = "";
    this.container = container;
    this.plugin = plugin;
  }
  // -------------------------------------------------------------------------
  // Render (called each time tab becomes active)
  // -------------------------------------------------------------------------
  render() {
    this.container.empty();
    const root = this.container.createDiv("docket-archive");
    this.renderHeader(root);
    this.renderControls(root);
    this.renderList(root);
  }
  // -------------------------------------------------------------------------
  // Header
  // -------------------------------------------------------------------------
  renderHeader(parent) {
    const header = parent.createDiv("docket-archive-header");
    header.createEl("h2", { text: "\u{1F4E6} Archive log" });
    header.createSpan({
      cls: "docket-archive-subtitle",
      text: "A historical ledger of completed tasks."
    });
  }
  // -------------------------------------------------------------------------
  // Controls (search + stats)
  // -------------------------------------------------------------------------
  renderControls(parent) {
    const controls = parent.createDiv("docket-archive-controls");
    const searchWrapper = controls.createDiv("docket-archive-search-wrapper");
    searchWrapper.createSpan({ cls: "docket-archive-search-icon", text: "\u{1F50D}" });
    const searchInput = searchWrapper.createEl("input", {
      cls: "docket-archive-search",
      attr: { type: "text", placeholder: "Search completed tasks\u2026" }
    });
    searchInput.value = this.searchQuery;
    const completed = this.plugin.settings.tasks.filter((t) => t.isCompleted);
    controls.createDiv({
      cls: "docket-archive-stats",
      text: `${completed.length} completed task${completed.length !== 1 ? "s" : ""}`
    });
    searchInput.addEventListener("input", () => {
      this.searchQuery = searchInput.value;
      const listEl = parent.querySelector(".docket-archive-list-wrapper");
      if (listEl) {
        listEl.empty();
        this.buildListContent(listEl);
      }
    });
  }
  // -------------------------------------------------------------------------
  // Task List
  // -------------------------------------------------------------------------
  renderList(parent) {
    const wrapper = parent.createDiv("docket-archive-list-wrapper");
    this.buildListContent(wrapper);
  }
  buildListContent(wrapper) {
    wrapper.empty();
    const completed = this.plugin.settings.tasks.filter((t) => t.isCompleted).filter((t) => t.text.toLowerCase().includes(this.searchQuery.toLowerCase())).sort((a, b) => {
      var _a, _b;
      return ((_a = b.completedAt) != null ? _a : 0) - ((_b = a.completedAt) != null ? _b : 0);
    });
    if (completed.length === 0) {
      const empty = wrapper.createDiv("docket-archive-empty");
      empty.createSpan({
        text: this.searchQuery ? `No results for "${this.searchQuery}"` : "No completed tasks yet. Complete a task to see it here."
      });
      return;
    }
    const groups = this.groupByMonth(completed);
    groups.forEach(({ label, tasks }) => {
      const group = wrapper.createDiv("docket-archive-group");
      group.createDiv({ cls: "docket-archive-group-label", text: label });
      const list = group.createDiv("docket-archive-list");
      tasks.forEach((task) => this.renderArchivedTask(task, list));
    });
  }
  // -------------------------------------------------------------------------
  // Archived Task Card
  // -------------------------------------------------------------------------
  renderArchivedTask(task, parent) {
    const { tags } = this.plugin.settings;
    const card = parent.createDiv("docket-archive-card");
    const firstTag = task.tags.length > 0 ? tags.find((t) => t.id === task.tags[0]) : null;
    if (firstTag) {
      card.setCssProps({ "--docket-indicator-color": firstTag.color });
      card.addClass("has-indicator");
    }
    const taskMain = card.createDiv("docket-task-main");
    const checkbox = taskMain.createEl("input", {
      cls: "docket-task-checkbox",
      attr: { type: "checkbox" }
    });
    checkbox.checked = true;
    checkbox.disabled = true;
    taskMain.createSpan({ cls: "docket-task-text", text: task.text });
    const restoreBtn = taskMain.createSpan({ cls: "docket-restore-btn", text: "Restore" });
    restoreBtn.setAttribute("title", "Move back to Today bucket");
    restoreBtn.addEventListener("click", async () => {
      task.isCompleted = false;
      task.completedAt = void 0;
      const todayBucket = this.plugin.settings.buckets.find((b) => b.id === "today");
      if (todayBucket) task.bucketId = todayBucket.id;
      task.createdAt = Date.now();
      await this.plugin.saveSettings();
    });
    const hasTagsOrDate = task.tags.length > 0 || task.completedAt;
    if (hasTagsOrDate) {
      const meta = card.createDiv("docket-task-tag-row");
      task.tags.forEach((tagId) => {
        const tag = tags.find((t) => t.id === tagId);
        if (!tag) return;
        const pill = meta.createSpan({ cls: "docket-inline-tag", text: `#${tag.name}` });
        pill.setCssProps({ "--docket-tag-color": tag.color });
      });
      if (task.completedAt) {
        const date = new Date(task.completedAt);
        const label = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        });
        meta.createSpan({ cls: "docket-archive-done-date", text: `Done: ${label}` });
      }
    }
  }
  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  groupByMonth(tasks) {
    const map = /* @__PURE__ */ new Map();
    tasks.forEach((task) => {
      const date = task.completedAt ? new Date(task.completedAt) : new Date(task.createdAt);
      const label = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(task);
    });
    return Array.from(map.entries()).map(([label, tasks2]) => ({ label, tasks: tasks2 }));
  }
};

// src/DayDeckView.ts
var VIEW_TYPE_DAYDECK = "daydeck-view";
var DayDeckView = class extends import_obsidian3.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    // State
    this.currentTab = "dashboard";
    this.activeTagFilters = [];
    this.plugin = plugin;
  }
  // -------------------------------------------------------------------------
  // ItemView overrides
  // -------------------------------------------------------------------------
  getViewType() {
    return VIEW_TYPE_DAYDECK;
  }
  getDisplayText() {
    return "DayDeck";
  }
  getIcon() {
    return "folder-kanban";
  }
  async onOpen() {
    this.contentEl.empty();
    this.contentEl.addClass("docket-view");
    this.buildNav();
    this.buildQuickCapture();
    this.buildContent();
    this.switchToTab("dashboard");
  }
  async onClose() {
  }
  // -------------------------------------------------------------------------
  // Build: Navigation Bar
  // -------------------------------------------------------------------------
  buildNav() {
    this.navEl = this.contentEl.createDiv("docket-nav");
    const navLeft = this.navEl.createDiv("docket-nav-left");
    const brand = navLeft.createDiv("docket-brand");
    brand.createSpan({ cls: "docket-brand-icon", text: "\u{1F5C2}\uFE0F" });
    brand.createSpan({ cls: "docket-brand-name", text: "DayDeck" });
    const tabGroup = navLeft.createDiv("docket-tab-group");
    const tabs = [
      { id: "dashboard", label: "Dashboard" },
      { id: "archive", label: "Archive" }
    ];
    tabs.forEach(({ id, label }) => {
      const tab = tabGroup.createDiv({ cls: "docket-nav-tab", text: label });
      tab.dataset.tab = id;
      tab.addEventListener("click", () => this.switchToTab(id));
    });
  }
  // -------------------------------------------------------------------------
  // Build: Quick Capture Bar
  // -------------------------------------------------------------------------
  buildQuickCapture() {
    this.quickCaptureEl = this.contentEl.createDiv("docket-quick-capture");
    const row = this.quickCaptureEl.createDiv("docket-qc-row");
    const inputWrapper = row.createDiv("docket-qc-input-wrapper");
    this.quickCaptureInput = inputWrapper.createEl("input", {
      cls: "docket-qc-input",
      attr: {
        type: "text",
        placeholder: "Search tasks\u2026"
      }
    });
    this.tagPillsContainer = row.createDiv("docket-qc-tag-filters");
    this.renderTagPills();
    this.quickCaptureInput.addEventListener("input", () => {
      var _a;
      const query = this.quickCaptureInput.value.trim();
      (_a = this.dashboardTab) == null ? void 0 : _a.applySearchFilter(query);
    });
    this.quickCaptureInput.addEventListener("keydown", (e) => {
      var _a;
      if (e.key === "Escape") {
        this.quickCaptureInput.value = "";
        (_a = this.dashboardTab) == null ? void 0 : _a.applySearchFilter("");
        this.quickCaptureInput.blur();
      }
    });
  }
  // -------------------------------------------------------------------------
  // Build: Content area with two tab panels
  // -------------------------------------------------------------------------
  buildContent() {
    const contentArea = this.contentEl.createDiv("docket-content");
    this.dashboardPanel = contentArea.createDiv({
      cls: "docket-tab-panel",
      attr: { "data-panel": "dashboard" }
    });
    this.dashboardTab = new DashboardTab(this.dashboardPanel, this.plugin);
    this.archivePanel = contentArea.createDiv({
      cls: "docket-tab-panel",
      attr: { "data-panel": "archive" }
    });
    this.archiveTab = new ArchiveTab(this.archivePanel, this.plugin);
  }
  // -------------------------------------------------------------------------
  // Tab switching
  // -------------------------------------------------------------------------
  switchToTab(tab) {
    this.currentTab = tab;
    this.navEl.querySelectorAll(".docket-nav-tab").forEach((el) => {
      el.classList.toggle("is-active", el.dataset.tab === tab);
    });
    this.quickCaptureEl.classList.toggle("is-hidden", tab !== "dashboard");
    [this.dashboardPanel, this.archivePanel].forEach((p) => {
      p.classList.remove("is-active");
    });
    switch (tab) {
      case "dashboard":
        this.dashboardPanel.classList.add("is-active");
        this.dashboardTab.render();
        if (this.activeTagFilters.length > 0) {
          this.dashboardTab.applyTagFilter(this.activeTagFilters);
        }
        break;
      case "archive":
        this.archivePanel.classList.add("is-active");
        this.archiveTab.render();
        break;
    }
  }
  // -------------------------------------------------------------------------
  // Tag Filters (Quick Capture bar)
  // -------------------------------------------------------------------------
  renderTagPills() {
    this.tagPillsContainer.empty();
    if (this.plugin.settings.tags.length === 0) return;
    const clearPill = this.tagPillsContainer.createDiv({
      cls: "docket-tag-filter-pill docket-tag-filter-all",
      text: "All"
    });
    clearPill.classList.toggle("is-active", this.activeTagFilters.length === 0);
    clearPill.addEventListener("click", () => {
      var _a;
      this.activeTagFilters = [];
      this.renderTagPills();
      (_a = this.dashboardTab) == null ? void 0 : _a.applyTagFilter([]);
    });
    this.plugin.settings.tags.forEach((tag) => {
      const isActive = this.activeTagFilters.includes(tag.id);
      const pill = this.tagPillsContainer.createDiv({
        cls: "docket-tag-filter-pill"
      });
      pill.dataset.tagId = tag.id;
      pill.setCssProps({ "--docket-pill-color": tag.color });
      pill.classList.toggle("is-active", isActive);
      pill.createSpan({ cls: "docket-tag-filter-label", text: `#${tag.name}` });
      if (isActive) {
        const removeBtn = pill.createSpan({ cls: "docket-tag-filter-remove", text: "\xD7" });
        removeBtn.setAttribute("title", `Remove #${tag.name} filter`);
        removeBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.removeTagFilter(tag.id);
        });
      }
      pill.addEventListener("click", () => this.toggleTagFilter(tag.id));
    });
  }
  toggleTagFilter(tagId) {
    var _a;
    const idx = this.activeTagFilters.indexOf(tagId);
    if (idx >= 0) {
      this.activeTagFilters.splice(idx, 1);
    } else {
      this.activeTagFilters.push(tagId);
    }
    this.renderTagPills();
    (_a = this.dashboardTab) == null ? void 0 : _a.applyTagFilter(this.activeTagFilters);
  }
  removeTagFilter(tagId) {
    var _a;
    this.activeTagFilters = this.activeTagFilters.filter((id) => id !== tagId);
    this.renderTagPills();
    (_a = this.dashboardTab) == null ? void 0 : _a.applyTagFilter(this.activeTagFilters);
  }
  // -------------------------------------------------------------------------
  // Refresh (called by plugin.saveSettings after any data change)
  // -------------------------------------------------------------------------
  refresh() {
    this.renderTagPills();
    this.switchToTab(this.currentTab);
  }
};

// src/settings.ts
var import_obsidian4 = require("obsidian");
var DayDeckSettingTab = class extends import_obsidian4.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  getSettingDefinitions() {
    return [];
  }
  renderBucketsSection(parent) {
    const section = parent.createDiv("docket-settings-section");
    const sh = section.createDiv("docket-settings-section-header");
    new import_obsidian4.Setting(sh).setName("Sections").setHeading().setDesc("Task containers displayed on the Dashboard. You can also edit icon and color directly from the dashboard.");
    const tableWrapper = section.createDiv("docket-settings-table-wrapper");
    this.renderBucketRows(tableWrapper);
    const addBtn = section.createEl("button", {
      cls: "mod-cta docket-add-btn",
      text: "+ Add section"
    });
    addBtn.addEventListener("click", async () => {
      const maxOrder = this.plugin.settings.buckets.reduce((max, b) => Math.max(max, b.order), -1);
      this.plugin.settings.buckets.push({
        id: generateId(),
        name: "New section",
        icon: "\u{1F4CC}",
        color: "#888888",
        order: maxOrder + 1,
        showCounter: false,
        widthPx: 320
      });
      await this.plugin.saveSettings();
      this.update();
    });
  }
  renderBucketRows(container) {
    container.empty();
    const headerRow = container.createDiv("docket-settings-row docket-settings-header-row");
    ["Icon", "Name", "Color", "Counter", "Actions"].forEach((label) => {
      headerRow.createDiv({ cls: "docket-settings-cell", text: label });
    });
    const sorted = [...this.plugin.settings.buckets].sort((a, b) => a.order - b.order);
    sorted.forEach((bucket, index) => {
      const row = container.createDiv("docket-settings-row");
      row.dataset.bucketId = bucket.id;
      const iconCell = row.createDiv("docket-settings-cell");
      const iconInput = iconCell.createEl("input", {
        cls: "docket-settings-icon-input",
        attr: { type: "text", value: bucket.icon, maxlength: "4" }
      });
      iconInput.addEventListener("change", async () => {
        bucket.icon = iconInput.value || "\u{1F4CC}";
        await this.plugin.saveSettings();
      });
      const nameCell = row.createDiv("docket-settings-cell");
      const nameInput = nameCell.createEl("input", {
        cls: "docket-settings-text-input",
        attr: { type: "text", value: bucket.name }
      });
      const saveSectionName = async () => {
        bucket.name = nameInput.value.trim() || "Section";
        await this.plugin.saveSettings();
      };
      nameInput.addEventListener("change", saveSectionName);
      nameInput.addEventListener("keydown", async (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          await saveSectionName();
          nameInput.blur();
        }
      });
      const colorCell = row.createDiv("docket-settings-cell");
      const colorWrapper = colorCell.createDiv("docket-color-input-wrapper");
      const colorSwatch = colorWrapper.createDiv("docket-color-swatch");
      colorSwatch.setCssStyles({ backgroundColor: bucket.color });
      const colorInput = colorWrapper.createEl("input", {
        cls: "docket-settings-color-input",
        attr: { type: "color", value: bucket.color }
      });
      colorInput.addEventListener("input", async () => {
        bucket.color = colorInput.value;
        colorSwatch.setCssStyles({ backgroundColor: bucket.color });
        await this.plugin.saveSettings();
      });
      const counterCell = row.createDiv("docket-settings-cell");
      const counterCheckbox = counterCell.createEl("input", {
        cls: "docket-settings-checkbox",
        attr: { type: "checkbox" }
      });
      counterCheckbox.checked = bucket.showCounter;
      counterCheckbox.addEventListener("change", async () => {
        bucket.showCounter = counterCheckbox.checked;
        await this.plugin.saveSettings();
      });
      const actCell = row.createDiv("docket-settings-cell docket-settings-actions");
      const upBtn = actCell.createEl("button", {
        cls: "docket-icon-btn",
        attr: { title: "Move up" }
      });
      upBtn.createSpan({ text: "\u2191" });
      if (index === 0) {
        upBtn.disabled = true;
      } else {
        upBtn.addEventListener("click", async () => {
          const prev = sorted[index - 1];
          [bucket.order, prev.order] = [prev.order, bucket.order];
          await this.plugin.saveSettings();
          this.update();
        });
      }
      const downBtn = actCell.createEl("button", {
        cls: "docket-icon-btn",
        attr: { title: "Move down" }
      });
      downBtn.createSpan({ text: "\u2193" });
      if (index === sorted.length - 1) {
        downBtn.disabled = true;
      } else {
        downBtn.addEventListener("click", async () => {
          const next = sorted[index + 1];
          [bucket.order, next.order] = [next.order, bucket.order];
          await this.plugin.saveSettings();
          this.update();
        });
      }
      const delBtn = actCell.createEl("button", {
        cls: "mod-warning docket-del-btn",
        attr: { title: `Delete "${bucket.name}" (tasks are preserved)` },
        text: "Delete"
      });
      delBtn.addEventListener("click", () => {
        new ConfirmModal(this.plugin.app, `Delete section "${bucket.name}"?

Tasks inside will remain but won't appear on the Dashboard until assigned to another section.`, async () => {
          this.plugin.settings.buckets = this.plugin.settings.buckets.filter(
            (b) => b.id !== bucket.id
          );
          normalizeBucketOrder(this.plugin.settings.buckets);
          await this.plugin.saveSettings();
          this.update();
        }).open();
      });
    });
  }
  renderTagsSection(parent) {
    const section = parent.createDiv("docket-settings-section");
    const sh = section.createDiv("docket-settings-section-header");
    new import_obsidian4.Setting(sh).setName("Semantic tags").setHeading().setDesc("Tags categorize tasks and enable filtering. Use #TagName syntax when creating tasks. The DeepWork tag is the default deep work tag.");
    const tableWrapper = section.createDiv("docket-settings-table-wrapper");
    this.renderTagRows(tableWrapper);
    const addBtn = section.createEl("button", {
      cls: "mod-cta docket-add-btn",
      text: "+ Add tag"
    });
    addBtn.addEventListener("click", async () => {
      this.plugin.settings.tags.push({
        id: generateId(),
        name: "NewTag",
        color: "#888888"
      });
      await this.plugin.saveSettings();
      this.update();
    });
  }
  renderTagRows(container) {
    container.empty();
    const headerRow = container.createDiv("docket-settings-row docket-settings-header-row");
    ["Name", "Color", "Preview", "Actions"].forEach((label) => {
      headerRow.createDiv({ cls: "docket-settings-cell", text: label });
    });
    this.plugin.settings.tags.forEach((tag) => {
      const row = container.createDiv("docket-settings-row");
      const nameCell = row.createDiv("docket-settings-cell");
      const nameInput = nameCell.createEl("input", {
        cls: "docket-settings-text-input",
        attr: { type: "text", value: tag.name }
      });
      const saveTagName = async () => {
        tag.name = nameInput.value.replace(/\s+/g, "").replace(/[^A-Za-z0-9_-]/g, "") || "Tag";
        nameInput.value = tag.name;
        previewPill.textContent = `#${tag.name}`;
        await this.plugin.saveSettings();
      };
      nameInput.addEventListener("change", saveTagName);
      nameInput.addEventListener("keydown", async (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          await saveTagName();
          nameInput.blur();
        }
      });
      const colorCell = row.createDiv("docket-settings-cell");
      const colorWrapper = colorCell.createDiv("docket-color-input-wrapper");
      const colorSwatch = colorWrapper.createDiv("docket-color-swatch");
      colorSwatch.setCssStyles({ backgroundColor: tag.color });
      const colorInput = colorWrapper.createEl("input", {
        cls: "docket-settings-color-input",
        attr: { type: "color", value: tag.color }
      });
      colorInput.addEventListener("input", async () => {
        tag.color = colorInput.value;
        colorSwatch.setCssStyles({ backgroundColor: tag.color });
        previewPill.setCssProps({ "--docket-tag-color": tag.color });
        await this.plugin.saveSettings();
      });
      const previewCell = row.createDiv("docket-settings-cell");
      const previewPill = previewCell.createSpan({
        cls: "docket-inline-tag",
        text: `#${tag.name}`
      });
      previewPill.setCssProps({ "--docket-tag-color": tag.color });
      const actCell = row.createDiv("docket-settings-cell");
      const delBtn = actCell.createEl("button", {
        cls: "mod-warning docket-del-btn",
        text: "Delete",
        attr: { title: `Delete #${tag.name} (removed from all tasks)` }
      });
      delBtn.addEventListener("click", () => {
        new ConfirmModal(this.plugin.app, `Delete tag #${tag.name}?

It will be removed from all tasks.`, async () => {
          var _a, _b;
          this.plugin.settings.tags = this.plugin.settings.tags.filter((t) => t.id !== tag.id);
          this.plugin.settings.tasks.forEach((task) => {
            task.tags = task.tags.filter((id) => id !== tag.id);
          });
          if (this.plugin.settings.deepWorkTagId === tag.id) {
            this.plugin.settings.deepWorkTagId = (_b = (_a = this.plugin.settings.tags[0]) == null ? void 0 : _a.id) != null ? _b : "";
          }
          await this.plugin.saveSettings();
          this.update();
        }).open();
      });
    });
  }
};

// src/main.ts
var DayDeckPlugin = class extends import_obsidian5.Plugin {
  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------
  async onload() {
    await this.loadSettings();
    this.registerView(VIEW_TYPE_DAYDECK, (leaf) => new DayDeckView(leaf, this));
    this.addRibbonIcon("folder-kanban", "Open DayDeck", () => {
      void this.activateView();
    });
    this.addCommand({
      id: "open-dashboard",
      name: "Open dashboard",
      callback: () => {
        void this.activateView();
      }
    });
    this.addSettingTab(new DayDeckSettingTab(this.app, this));
    this.startReminderMonitor();
  }
  onunload() {
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
  async activateView() {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(VIEW_TYPE_DAYDECK);
    if (existing.length > 0) {
      workspace.setActiveLeaf(existing[0]);
      return;
    }
    const leaf = workspace.getLeaf("tab");
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
  async loadSettings() {
    const saved = await this.loadData();
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...saved
    };
    if (!Array.isArray(this.settings.buckets) || this.settings.buckets.length === 0) {
      this.settings.buckets = DEFAULT_SETTINGS.buckets;
    } else {
      const hasLegacyColumns = this.settings.buckets.some((b) => b.column !== void 0);
      if (hasLegacyColumns) {
        this.settings.buckets.sort((a, b) => {
          var _a, _b;
          const colA = (_a = a.column) != null ? _a : 1;
          const colB = (_b = b.column) != null ? _b : 1;
          if (colA !== colB) return colA - colB;
          return a.order - b.order;
        });
        normalizeBucketOrder(this.settings.buckets);
      }
      this.settings.buckets.forEach((bucket) => {
        if (bucket.showCounter === void 0) {
          bucket.showCounter = bucket.id === "waiting";
        }
        if (bucket.widthPx === void 0) {
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
    if (!this.settings.tags.some((t) => t.id === this.settings.deepWorkTagId)) {
      this.settings.tags.push({
        id: this.settings.deepWorkTagId,
        name: "DeepWork",
        color: "#f14c4c"
      });
    }
  }
  startReminderMonitor() {
    this.stopReminderMonitor();
    this.reminderIntervalId = window.setInterval(() => {
      void this.processDueReminders();
    }, 1e4);
    this.registerInterval(this.reminderIntervalId);
    void this.processDueReminders();
  }
  stopReminderMonitor() {
    if (this.reminderIntervalId !== void 0) {
      window.clearInterval(this.reminderIntervalId);
      this.reminderIntervalId = void 0;
    }
  }
  async processDueReminders() {
    const now = Date.now();
    let changed = false;
    for (const task of this.settings.tasks) {
      if (!task.reminderAt || task.isCompleted || task.reminderAt > now || task.reminderNotified) {
        continue;
      }
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
  showReminderNotification(task) {
    const title = "DayDeck reminder";
    const body = task.text;
    if (typeof window !== "undefined" && "Notification" in window) {
      if (window.Notification.permission === "granted") {
        new window.Notification(title, { body, tag: `daydeck-reminder-${task.id}` });
        return;
      }
      if (window.Notification.permission === "default") {
        void window.Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new window.Notification(title, { body, tag: `daydeck-reminder-${task.id}` });
          } else {
            new import_obsidian5.Notice(`${title}: ${body}`);
          }
        });
        return;
      }
    }
    new import_obsidian5.Notice(`${title}: ${body}`);
  }
  /**
   * Persist the current settings object and refresh any open DayDeck views.
   */
  async saveSettings(skipRefresh = false) {
    await this.saveData(this.settings);
    if (!skipRefresh) {
      this.app.workspace.getLeavesOfType(VIEW_TYPE_DAYDECK).forEach((leaf) => {
        if (leaf.view instanceof DayDeckView) {
          leaf.view.refresh();
        }
      });
    }
  }
};
