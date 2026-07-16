import { App, Modal, Setting } from 'obsidian';

export class ConfirmModal extends Modal {
  private message: string;
  private onConfirm: () => void;
  private onCancel?: () => void;

  constructor(app: App, message: string, onConfirm: () => void, onCancel?: () => void) {
    super(app);
    this.message = message;
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    
    contentEl.createEl('h2', { text: 'Confirm' });
    
    // Support basic newlines in the message by splitting on \n
    const lines = this.message.split('\n');
    lines.forEach(line => {
      contentEl.createEl('p', { text: line });
    });

    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText('Cancel')
          .onClick(() => {
            this.close();
            if (this.onCancel) {
              this.onCancel();
            }
          })
      )
      .addButton((btn) =>
        btn
          .setButtonText('Confirm')
          .setCta()
          .onClick(() => {
            this.close();
            this.onConfirm();
          })
      );
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
