import { ResizeController } from "@lit-labs/observers/resize-controller";
import { mdiDotsVertical } from "@mdi/js";
import type { PropertyValues } from "lit";
import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators";
import { styleMap } from "lit/directives/style-map";
import { applyThemesOnElement } from "../../../common/dom/apply_themes_on_element";
import { fireEvent } from "../../../common/dom/fire_event";
import { computeStateName } from "../../../common/entity/compute_state_name";
import { stateColorCss } from "../../../common/entity/state_color";
import "../../../components/ha-card";
import "../../../components/ha-icon-button";
import type { ClimateEntity } from "../../../data/climate";
import "../../../state-control/climate/ha-state-control-climate-temperature";
import type { HomeAssistant } from "../../../types";
import "../card-features/hui-card-features";
import type { LovelaceCardFeatureContext } from "../card-features/types";
import { findEntities } from "../common/find-entities";
import { createEntityNotFoundWarning } from "../components/hui-warning";
import type {
  LovelaceCard,
  LovelaceCardEditor,
  LovelaceGridOptions,
} from "../types";
import type { ThermostatCardConfig } from "./types";

@customElement("hui-thermostat-card")
export class HuiThermostatCard extends LitElement implements LovelaceCard {
  private _resizeController = new ResizeController(this, {
    callback: (entries) => {
      const container = entries[0]?.target.shadowRoot?.querySelector(
        ".container"
      ) as HTMLElement | undefined;
      return container?.clientHeight;
    },
  });

  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import("../editor/config-elements/hui-thermostat-card-editor");
    return document.createElement("hui-thermostat-card-editor");
  }

  public static getStubConfig(
    hass: HomeAssistant,
    entities: string[],
    entitiesFallback: string[]
  ): ThermostatCardConfig {
    const includeDomains = ["climate"];
    const maxEntities = 1;
    const foundEntities = findEntities(
      hass,
      maxEntities,
      entities,
      entitiesFallback,
      includeDomains
    );

    return { type: "thermostat", entity: foundEntities[0] || "" };
  }

  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: ThermostatCardConfig;

  @state() private _featureContext: LovelaceCardFeatureContext = {};

  public getCardSize(): number {
    return 7;
  }

  public setConfig(config: ThermostatCardConfig): void {
    if (!config.entity || config.entity.split(".")[0] !== "climate") {
      throw new Error("Specify an entity from within the climate domain");
    }

    this._config = config;
    this._featureContext = {
      entity_id: config.entity,
    };
  }

  private _handleMoreInfo() {
    fireEvent(this, "hass-more-info", {
      entityId: this._config!.entity,
    });
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);

    if (
      !this._config ||
      !this.hass ||
      (!changedProps.has("hass") && !changedProps.has("_config"))
    ) {
      return;
    }

    const oldHass = changedProps.get("hass") as HomeAssistant | undefined;
    const oldConfig = changedProps.get("_config") as
      | ThermostatCardConfig
      | undefined;

    if (
      !oldHass ||
      !oldConfig ||
      oldHass.themes !== this.hass.themes ||
      oldConfig.theme !== this._config.theme
    ) {
      applyThemesOnElement(this, this.hass.themes, this._config.theme);
    }
  }

  protected render() {
    if (!this.hass || !this._config) {
      return nothing;
    }
    const stateObj = this.hass.states[this._config.entity] as ClimateEntity;

    if (!stateObj) {
      return html`
        <hui-warning .hass=${this.hass}>
          ${createEntityNotFoundWarning(this.hass, this._config.entity)}
        </hui-warning>
      `;
    }

    const name = this._config!.name || computeStateName(stateObj);

    const color = stateColorCss(stateObj);

    const controlMaxWidth = this._resizeController.value
      ? `${this._resizeController.value}px`
      : undefined;

    return html`
      <ha-card>
        <p class="title">${name}</p>
        <div class="container">
          <ha-state-control-climate-temperature
            style=${styleMap({
              maxWidth: controlMaxWidth,
            })}
            prevent-interaction-on-scroll
            .showCurrentAsPrimary=${this._config.show_current_as_primary}
            show-secondary
            .hass=${this.hass}
            .stateObj=${stateObj}
          ></ha-state-control-climate-temperature>
        </div>
        <ha-icon-button
          class="more-info"
          .label=${this.hass!.localize(
            "ui.panel.lovelace.cards.show_more_info"
          )}
          .path=${mdiDotsVertical}
          @click=${this._handleMoreInfo}
          tabindex="0"
        ></ha-icon-button>
        ${this._config.features?.length
          ? html`<hui-card-features
              style=${styleMap({
                "--feature-color": color,
              })}
              .hass=${this.hass}
              .context=${this._featureContext}
              .features=${this._config.features}
            ></hui-card-features>`
          : nothing}
      </ha-card>
    `;
  }

  public getGridOptions(): LovelaceGridOptions {
    const columns = 12;
    let rows = 5;
    let min_rows = 2;
    const min_columns = 6;
    if (this._config?.features?.length) {
      const featureHeight = Math.ceil((this._config.features.length * 2) / 3);
      rows += featureHeight;
      min_rows += featureHeight;
    }
    return {
      columns,
      rows,
      min_columns,
      min_rows,
    };
  }

  static styles = css`
    :host {
      position: relative;
      display: block;
      height: 100%;
    }
    ha-card {
      position: relative;
      height: 100%;
      width: 100%;
      padding: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
    }

    .title {
      width: 100%;
      font-size: var(--ha-font-size-l);
      line-height: var(--ha-line-height-expanded);
      padding: 8px 30px 8px 30px;
      margin: 0;
      text-align: center;
      box-sizing: border-box;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: none;
    }

    .container {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      max-width: 100%;
      box-sizing: border-box;
      flex: 1;
    }

    .container:before {
      content: "";
      display: block;
      padding-top: 100%;
    }

    .container > * {
      padding: 8px;
    }

    .more-info {
      position: absolute;
      cursor: pointer;
      top: 0;
      right: 0;
      inset-inline-end: 0px;
      inset-inline-start: initial;
      border-radius: 100%;
      color: var(--secondary-text-color);
      direction: var(--direction);
    }

    hui-card-features {
      width: 100%;
      flex: none;
      padding: 0 12px 12px 12px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-thermostat-card": HuiThermostatCard;
  }
}
