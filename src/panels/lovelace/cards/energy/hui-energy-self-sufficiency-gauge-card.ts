import { mdiInformation } from "@mdi/js";
import type { UnsubscribeFunc } from "home-assistant-js-websocket";
import type { PropertyValues } from "lit";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators";
import { styleMap } from "lit/directives/style-map";
import "../../../../components/ha-card";
import "../../../../components/ha-gauge";
import "../../../../components/ha-svg-icon";
import "../../../../components/ha-tooltip";
import type { EnergyData } from "../../../../data/energy";
import {
  getEnergyDataCollection,
  getSummedData,
} from "../../../../data/energy";
import { SubscribeMixin } from "../../../../mixins/subscribe-mixin";
import type { HomeAssistant } from "../../../../types";
import type { LovelaceCard } from "../../types";
import { severityMap } from "../hui-gauge-card";
import type { EnergySelfSufficiencyGaugeCardConfig } from "../types";
import { hasConfigChanged } from "../../common/has-changed";

const FORMAT_OPTIONS = {
  maximumFractionDigits: 0,
};

@customElement("hui-energy-self-sufficiency-gauge-card")
class HuiEnergySelfSufficiencyGaugeCard
  extends SubscribeMixin(LitElement)
  implements LovelaceCard
{
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: EnergySelfSufficiencyGaugeCardConfig;

  @state() private _data?: EnergyData;

  protected hassSubscribeRequiredHostProps = ["_config"];

  public hassSubscribe(): UnsubscribeFunc[] {
    return [
      getEnergyDataCollection(this.hass!, {
        key: this._config?.collection_key,
      }).subscribe((data) => {
        this._data = data;
      }),
    ];
  }

  public getCardSize(): number {
    return 4;
  }

  public setConfig(config: EnergySelfSufficiencyGaugeCardConfig): void {
    this._config = config;
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    return (
      hasConfigChanged(this, changedProps) ||
      changedProps.size > 1 ||
      !changedProps.has("hass")
    );
  }

  protected render() {
    if (!this._config || !this.hass) {
      return nothing;
    }

    if (!this._data) {
      return html`${this.hass.localize(
        "ui.panel.lovelace.cards.energy.loading"
      )}`;
    }

    // The strategy only includes this card if we have a grid.
    const { summedData, compareSummedData: _ } = getSummedData(this._data);

    const hasSolarProduction = summedData.solar !== undefined;
    const hasBattery =
      summedData.to_battery !== undefined ||
      summedData.from_battery !== undefined;
    const hasReturnToGrid = summedData.to_grid !== undefined;

    const totalFromGrid = summedData.total.from_grid ?? 0;

    let totalSolarProduction: number | null = null;

    if (hasSolarProduction) {
      totalSolarProduction = summedData.total.solar ?? 0;
    }

    let totalBatteryIn: number | null = null;
    let totalBatteryOut: number | null = null;

    if (hasBattery) {
      totalBatteryIn = summedData.total.to_battery ?? 0;
      totalBatteryOut = summedData.total.from_battery ?? 0;
    }

    let returnedToGrid: number | null = null;

    if (hasReturnToGrid) {
      returnedToGrid = summedData.total.to_grid ?? 0;
    }

    let solarConsumption: number | null = null;
    if (hasSolarProduction) {
      solarConsumption =
        (totalSolarProduction || 0) -
        (returnedToGrid || 0) -
        (totalBatteryIn || 0);
    }

    let batteryFromGrid: null | number = null;
    let batteryToGrid: null | number = null;
    if (solarConsumption !== null && solarConsumption < 0) {
      // What we returned to the grid and what went in to the battery is more than produced,
      // so we have used grid energy to fill the battery
      // or returned battery energy to the grid
      if (hasBattery) {
        batteryFromGrid = solarConsumption * -1;
        if (batteryFromGrid > totalFromGrid) {
          batteryToGrid = batteryFromGrid - totalFromGrid;
          batteryFromGrid = totalFromGrid;
        }
      }
      solarConsumption = 0;
    }

    let batteryConsumption: number | null = null;
    if (hasBattery) {
      batteryConsumption = (totalBatteryOut || 0) - (batteryToGrid || 0);
    }

    const gridConsumption = Math.max(0, totalFromGrid - (batteryFromGrid || 0));

    const totalHomeConsumption = Math.max(
      0,
      gridConsumption + (solarConsumption || 0) + (batteryConsumption || 0)
    );

    let value: number | undefined;
    if (
      totalFromGrid !== null &&
      totalHomeConsumption !== null &&
      totalHomeConsumption > 0
    ) {
      value = (1 - totalFromGrid / totalHomeConsumption) * 100;
    }

    return html`
      <ha-card>
        ${value !== undefined
          ? html`
              <ha-gauge
                min="0"
                max="100"
                .value=${value}
                label="%"
                .formatOptions=${FORMAT_OPTIONS}
                .locale=${this.hass.locale}
                style=${styleMap({
                  "--gauge-color": this._computeSeverity(value),
                })}
              ></ha-gauge>
              <ha-tooltip
                placement="left"
                .content=${this.hass.localize(
                  "ui.panel.lovelace.cards.energy.self_sufficiency_gauge.card_indicates_self_sufficiency_quota"
                )}
                hoist
              >
                <ha-svg-icon .path=${mdiInformation}></ha-svg-icon>
              </ha-tooltip>
              <div class="name">
                ${this.hass.localize(
                  "ui.panel.lovelace.cards.energy.self_sufficiency_gauge.self_sufficiency_quota"
                )}
              </div>
            `
          : this.hass.localize(
              "ui.panel.lovelace.cards.energy.self_sufficiency_gauge.self_sufficiency_could_not_calc"
            )}
      </ha-card>
    `;
  }

  private _computeSeverity(numberValue: number): string {
    if (numberValue > 75) {
      return severityMap.green;
    }
    if (numberValue < 50) {
      return severityMap.yellow;
    }
    return severityMap.normal;
  }

  static styles = css`
    ha-card {
      height: 100%;
      overflow: hidden;
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      box-sizing: border-box;
    }

    ha-gauge {
      width: 100%;
      max-width: 250px;
      direction: ltr;
    }

    .name {
      text-align: center;
      line-height: initial;
      color: var(--primary-text-color);
      width: 100%;
      font-size: 15px;
      margin-top: 8px;
    }

    ha-svg-icon {
      position: absolute;
      right: 4px;
      inset-inline-end: 4px;
      inset-inline-start: initial;
      top: 4px;
      color: var(--secondary-text-color);
    }

    ha-tooltip::part(base__popup) {
      margin-top: 4px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-energy-self-sufficiency-gauge-card": HuiEnergySelfSufficiencyGaugeCard;
  }
}
