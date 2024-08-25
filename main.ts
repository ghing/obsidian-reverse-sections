import {
  App,
  Editor,
  MarkdownView,
  Modal,
  Plugin,
  PluginSettingTab,
  Setting,
} from "obsidian";
import { headingLevels, reverseNoteSections, HeadingLevel } from "./reverse";

interface ReverseSectionsPluginSettings {
  mySetting: string;
}

const DEFAULT_SETTINGS: ReverseSectionsPluginSettings = {
  mySetting: "default",
};

export default class ReverseSectionsPlugin extends Plugin {
  settings: ReverseSectionsPluginSettings;

  async onload() {
    await this.loadSettings();

    // This adds an editor command that can perform some operation on the current editor instance
    this.addCommand({
      id: "reverse-sections-command",
      name: "Reverse sections",
      editorCallback: (editor: Editor, view: MarkdownView) => {
        new SelectLevelModal(this.app, (level: HeadingLevel) => {
          const noteText = editor.getValue();

          const reversed = reverseNoteSections(noteText, level);

          editor.setValue(reversed);
        }).open();
      },
    });

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new SampleSettingTab(this.app, this));
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class SelectLevelModal extends Modal {
  level: HeadingLevel;
  onSubmit: (result: string) => void;

  constructor(app: App, onSubmit: (level: string) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.createEl("h1", { text: "Select Level" });

    const levelOptions = headingLevels.reduce((levels, level) => {
      return {
        ...levels,
        [level]: level,
      };
    }, {});
    new Setting(contentEl)
      .setName("Level")
      .setDesc("Select the level of the section you want to reverse")
      .addDropdown((dropdown) =>
        dropdown.addOptions(levelOptions).onChange((value: HeadingLevel) => {
          this.level = value;
        })
      );

    new Setting(contentEl).addButton((button) =>
      button.setButtonText("Reverse Sections").onClick(() => {
        this.close();
        this.onSubmit(this.level);
      })
    );
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

class SampleSettingTab extends PluginSettingTab {
  plugin: ReverseSectionsPlugin;

  constructor(app: App, plugin: ReverseSectionsPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Setting #1")
      .setDesc("It's a secret")
      .addText((text) =>
        text
          .setPlaceholder("Enter your secret")
          .setValue(this.plugin.settings.mySetting)
          .onChange(async (value) => {
            this.plugin.settings.mySetting = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
