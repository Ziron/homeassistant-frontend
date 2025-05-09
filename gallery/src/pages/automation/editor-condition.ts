import type { TemplateResult } from "lit";
import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators";
import { mockAreaRegistry } from "../../../../demo/src/stubs/area_registry";
import { mockDeviceRegistry } from "../../../../demo/src/stubs/device_registry";
import { mockEntityRegistry } from "../../../../demo/src/stubs/entity_registry";
import { mockHassioSupervisor } from "../../../../demo/src/stubs/hassio_supervisor";
import "../../../../src/components/ha-formfield";
import type { ConditionWithShorthand } from "../../../../src/data/automation";
import { provideHass } from "../../../../src/fake_data/provide_hass";
import "../../../../src/panels/config/automation/condition/ha-automation-condition";
import { HaAndCondition } from "../../../../src/panels/config/automation/condition/types/ha-automation-condition-and";
import { HaDeviceCondition } from "../../../../src/panels/config/automation/condition/types/ha-automation-condition-device";
import { HaNotCondition } from "../../../../src/panels/config/automation/condition/types/ha-automation-condition-not";
import HaNumericStateCondition from "../../../../src/panels/config/automation/condition/types/ha-automation-condition-numeric_state";
import { HaOrCondition } from "../../../../src/panels/config/automation/condition/types/ha-automation-condition-or";
import { HaStateCondition } from "../../../../src/panels/config/automation/condition/types/ha-automation-condition-state";
import { HaSunCondition } from "../../../../src/panels/config/automation/condition/types/ha-automation-condition-sun";
import { HaTemplateCondition } from "../../../../src/panels/config/automation/condition/types/ha-automation-condition-template";
import { HaTimeCondition } from "../../../../src/panels/config/automation/condition/types/ha-automation-condition-time";
import { HaTriggerCondition } from "../../../../src/panels/config/automation/condition/types/ha-automation-condition-trigger";
import { HaZoneCondition } from "../../../../src/panels/config/automation/condition/types/ha-automation-condition-zone";
import type { HomeAssistant } from "../../../../src/types";
import "../../components/demo-black-white-row";

const SCHEMAS: { name: string; conditions: ConditionWithShorthand[] }[] = [
  {
    name: "State",
    conditions: [{ ...HaStateCondition.defaultConfig }],
  },
  {
    name: "Numeric State",
    conditions: [{ ...HaNumericStateCondition.defaultConfig }],
  },
  {
    name: "Sun",
    conditions: [{ ...HaSunCondition.defaultConfig }],
  },
  {
    name: "Zone",
    conditions: [{ ...HaZoneCondition.defaultConfig }],
  },
  {
    name: "Time",
    conditions: [{ ...HaTimeCondition.defaultConfig }],
  },
  {
    name: "Template",
    conditions: [{ ...HaTemplateCondition.defaultConfig }],
  },
  {
    name: "Device",
    conditions: [{ ...HaDeviceCondition.defaultConfig }],
  },
  {
    name: "And",
    conditions: [{ ...HaAndCondition.defaultConfig }],
  },
  {
    name: "Or",
    conditions: [{ ...HaOrCondition.defaultConfig }],
  },
  {
    name: "Not",
    conditions: [{ ...HaNotCondition.defaultConfig }],
  },
  {
    name: "Trigger",
    conditions: [{ ...HaTriggerCondition.defaultConfig }],
  },
  {
    name: "Shorthand",
    conditions: [
      {
        ...HaAndCondition.defaultConfig,
      },
      {
        ...HaOrCondition.defaultConfig,
      },
      {
        ...HaNotCondition.defaultConfig,
      },
    ],
  },
];

@customElement("demo-automation-editor-condition")
export class DemoAutomationEditorCondition extends LitElement {
  @state() private hass!: HomeAssistant;

  @state() private _disabled = false;

  private data: any = SCHEMAS.map((info) => info.conditions);

  constructor() {
    super();
    const hass = provideHass(this);
    hass.updateTranslations(null, "en");
    hass.updateTranslations("config", "en");
    mockEntityRegistry(hass);
    mockDeviceRegistry(hass);
    mockAreaRegistry(hass);
    mockHassioSupervisor(hass);
  }

  protected render(): TemplateResult {
    return html`
      <div class="options">
        <ha-formfield label="Disabled">
          <ha-switch
            .name=${"disabled"}
            .checked=${this._disabled}
            @change=${this._handleOptionChange}
          ></ha-switch>
        </ha-formfield>
      </div>
      ${SCHEMAS.map(
        (info, sampleIdx) => html`
          <demo-black-white-row
            .title=${info.name}
            .value=${this.data[sampleIdx]}
          >
            ${["light", "dark"].map(
              (slot) => html`
                <ha-automation-condition
                  slot=${slot}
                  .hass=${this.hass}
                  .conditions=${this.data[sampleIdx]}
                  .sampleIdx=${sampleIdx}
                  .disabled=${this._disabled}
                  @value-changed=${this._handleValueChange}
                ></ha-automation-condition>
              `
            )}
          </demo-black-white-row>
        `
      )}
    `;
  }

  private _handleValueChange(ev) {
    const sampleIdx = ev.target.sampleIdx;
    this.data[sampleIdx] = ev.detail.value;
    this.requestUpdate();
  }

  private _handleOptionChange(ev) {
    this[`_${ev.target.name}`] = ev.target.checked;
  }

  static styles = css`
    .options {
      max-width: 800px;
      margin: 16px auto;
    }
    .options ha-formfield {
      margin-right: 16px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "demo-automation-editor-condition": DemoAutomationEditorCondition;
  }
}
