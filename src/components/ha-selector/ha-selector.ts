import type { PropertyValues } from "lit";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators";
import memoizeOne from "memoize-one";
import { dynamicElement } from "../../common/dom/dynamic-element-directive";
import type { Selector } from "../../data/selector";
import {
  handleLegacyDeviceSelector,
  handleLegacyEntitySelector,
} from "../../data/selector";
import type { HomeAssistant } from "../../types";

const LOAD_ELEMENTS = {
  action: () => import("./ha-selector-action"),
  addon: () => import("./ha-selector-addon"),
  area: () => import("./ha-selector-area"),
  areas_display: () => import("./ha-selector-areas-display"),
  attribute: () => import("./ha-selector-attribute"),
  assist_pipeline: () => import("./ha-selector-assist-pipeline"),
  boolean: () => import("./ha-selector-boolean"),
  color_rgb: () => import("./ha-selector-color-rgb"),
  condition: () => import("./ha-selector-condition"),
  config_entry: () => import("./ha-selector-config-entry"),
  conversation_agent: () => import("./ha-selector-conversation-agent"),
  constant: () => import("./ha-selector-constant"),
  country: () => import("./ha-selector-country"),
  date: () => import("./ha-selector-date"),
  datetime: () => import("./ha-selector-datetime"),
  device: () => import("./ha-selector-device"),
  duration: () => import("./ha-selector-duration"),
  entity: () => import("./ha-selector-entity"),
  statistic: () => import("./ha-selector-statistic"),
  file: () => import("./ha-selector-file"),
  floor: () => import("./ha-selector-floor"),
  label: () => import("./ha-selector-label"),
  image: () => import("./ha-selector-image"),
  background: () => import("./ha-selector-background"),
  language: () => import("./ha-selector-language"),
  navigation: () => import("./ha-selector-navigation"),
  number: () => import("./ha-selector-number"),
  object: () => import("./ha-selector-object"),
  qr_code: () => import("./ha-selector-qr-code"),
  select: () => import("./ha-selector-select"),
  selector: () => import("./ha-selector-selector"),
  state: () => import("./ha-selector-state"),
  backup_location: () => import("./ha-selector-backup-location"),
  stt: () => import("./ha-selector-stt"),
  target: () => import("./ha-selector-target"),
  template: () => import("./ha-selector-template"),
  text: () => import("./ha-selector-text"),
  time: () => import("./ha-selector-time"),
  icon: () => import("./ha-selector-icon"),
  media: () => import("./ha-selector-media"),
  theme: () => import("./ha-selector-theme"),
  button_toggle: () => import("./ha-selector-button-toggle"),
  trigger: () => import("./ha-selector-trigger"),
  tts: () => import("./ha-selector-tts"),
  tts_voice: () => import("./ha-selector-tts-voice"),
  location: () => import("./ha-selector-location"),
  color_temp: () => import("./ha-selector-color-temp"),
  ui_action: () => import("./ha-selector-ui-action"),
  ui_color: () => import("./ha-selector-ui-color"),
  ui_state_content: () => import("./ha-selector-ui-state-content"),
};

const LEGACY_UI_SELECTORS = new Set(["ui-action", "ui-color"]);

@customElement("ha-selector")
export class HaSelector extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ type: Boolean }) public narrow = false;

  @property() public name?: string;

  @property({ attribute: false }) public selector!: Selector;

  @property() public value?: any;

  @property() public label?: string;

  @property() public helper?: string;

  @property({ attribute: false })
  public localizeValue?: (key: string) => string;

  @property() public placeholder?: any;

  @property({ type: Boolean }) public disabled = false;

  @property({ type: Boolean }) public required = true;

  @property({ attribute: false }) public context?: Record<string, any>;

  public async focus() {
    await this.updateComplete;
    (this.renderRoot.querySelector("#selector") as HTMLElement)?.focus();
  }

  private get _type() {
    const type = Object.keys(this.selector)[0];
    if (LEGACY_UI_SELECTORS.has(type)) {
      return type.replace("-", "_");
    }
    return type;
  }

  protected willUpdate(changedProps: PropertyValues) {
    if (changedProps.has("selector") && this.selector) {
      LOAD_ELEMENTS[this._type]?.();
    }
  }

  private _handleLegacySelector = memoizeOne((selector: Selector) => {
    if ("entity" in selector) {
      return handleLegacyEntitySelector(selector);
    }
    if ("device" in selector) {
      return handleLegacyDeviceSelector(selector);
    }
    const type = Object.keys(this.selector)[0];
    if (LEGACY_UI_SELECTORS.has(type)) {
      return { [type.replace("-", "_")]: selector[type] };
    }
    return selector;
  });

  protected render() {
    return html`
      ${dynamicElement(`ha-selector-${this._type}`, {
        hass: this.hass,
        narrow: this.narrow,
        name: this.name,
        selector: this._handleLegacySelector(this.selector),
        value: this.value,
        label: this.label,
        placeholder: this.placeholder,
        disabled: this.disabled,
        required: this.required,
        helper: this.helper,
        context: this.context,
        localizeValue: this.localizeValue,
        id: "selector",
      })}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-selector": HaSelector;
  }
}
