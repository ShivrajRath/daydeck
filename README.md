# docket

**Your day, compiled.**

Docket is a cognitive task management dashboard for Obsidian designed to bridge the gap between **strategic thinking** and **immediate execution**. It replaces traditional linear to-do lists with a flexible, two-column Kanban system that adapts to your workflow.

## 🧠 The Philosophy

In the "Two Hat" workflow:

- **Hat 1: The Strategist** - High-level sections (Learning, Admin, Backlog). This is your conceptual workspace where you organize _what_ needs to be done, not _when_.
- **Hat 2: The Operator** - "Today" and "Next". This is your execution engine. Time is the only resource here, so tasks must be specific and actionable.

Docket ensures you never lose sight of the big picture while staying focused on shipping today's work.

---

## 🌟 Key Features

- **Responsive Section Grid**: Drag-and-drop sections (Today, Next, Waiting, Focus Hub, Learning, Ideas, Watch, etc.) to organize your workflow. Sections can be reordered and customized with icons and colors.

- **Smart Capture**: Type or paste anything into the Quick Capture bar. Use inline syntax `#tag` to instantly categorize tasks. Tag suggestions appear as you type with keyboard navigation support.

- **Semantic Tagging**: Define custom tags (e.g., `#DeepWork`, `#Architecture`, `#Data`) with unique colors to filter your entire view on the fly via clickable tag pills.

- **Task Reminders**: Set reminders on individual tasks with date/time pickers. Overdue reminders are visually highlighted.

- **Waiting Time Counters**: Enable time counters on specific sections (like "Waiting") to track how long tasks have been waiting.

- **Archive**: A time-filtered history of completed tasks, grouped by month with search functionality. Restore tasks back to active sections with one click.

---

## 🛠️ Installation

1.  **Build the Plugin**:

    - Make sure you have Node.js and npm installed.
    - Run `npm install` to fetch dependencies.
    - Run `npm run dev` for continuous development mode.

2.  **Install in Obsidian**:
    - Navigate to your Obsidian vault's plugin folder: `.obsidian/plugins`.
    - Copy the entire `docket` folder there.
    - Restart Obsidian.
    - Go to **Settings -> Community Plugins**, disable **Restricted Mode**, and enable **Docket**.
    - Click the "Docket" button on your left sidebar to open the view.

---

## ⚙️ Configuration

Open the **Docket Settings** tab from the plugin's sidebar menu to customize:

- **Sections**: Rename sections, change icons (emoji support), adjust their order, and enable waiting time counters.
- **Tags**: Add custom semantic tags and assign colors. The DeepWork tag is automatically created and used for focus filtering.

---

## ⌨️ Usage Quick Reference

| Action          | Method                             | Description                           |
| :-------------- | :--------------------------------- | :------------------------------------ |
| Open Docket     | `Ctrl+P` → "Open Docket dashboard" | Opens/focuses the dashboard           |
| New Task        | Type in Quick Capture + `Enter`    | Adds task to active section           |
| Tag Task        | `#tag` in task text                | Assigns a semantic tag                |
| Filter by Tag   | Click tag pill in Quick Capture    | Filter view to show only tagged tasks |
| Move Task       | Drag task card                     | Move between sections or reorder      |
| Reorder Section | Drag section header                | Reorder sections on dashboard         |
| Edit Task       | Double-click task text             | Inline edit with tag support          |
| Set Reminder    | Click 🔔 icon on task              | Set date/time reminder                |
| Delete Task     | Click × on card                    | Permanently removes                   |
| Complete Task   | Click checkbox on card             | Moves to Archive                      |
| Restore Task    | Click "Restore" in Archive         | Moves back to Today section           |
