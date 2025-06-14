import type { PropertyValues } from "lit";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators";
import { classMap } from "lit/directives/class-map";
import { ifDefined } from "lit/directives/if-defined";
import { applyThemesOnElement } from "../../../common/dom/apply_themes_on_element";
import { computeDomain } from "../../../common/entity/compute_domain";
import "../../../components/ha-card";
import type { ImageEntity } from "../../../data/image";
import { computeImageUrl } from "../../../data/image";
import type { ActionHandlerEvent } from "../../../data/lovelace/action_handler";
import type { HomeAssistant } from "../../../types";
import { actionHandler } from "../common/directives/action-handler-directive";
import { handleAction } from "../common/handle-action";
import { hasAction } from "../common/has-action";
import { hasConfigChanged } from "../common/has-changed";
import { createEntityNotFoundWarning } from "../components/hui-warning";
import type { LovelaceCard, LovelaceCardEditor } from "../types";
import type { PictureCardConfig } from "./types";
import type { PersonEntity } from "../../../data/person";

@customElement("hui-picture-card")
export class HuiPictureCard extends LitElement implements LovelaceCard {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import("../editor/config-elements/hui-picture-card-editor");
    return document.createElement("hui-picture-card-editor");
  }

  public static getStubConfig(): PictureCardConfig {
    return {
      type: "picture",
      image: "https://demo.home-assistant.io/stub_config/t-shirt-promo.png",
    };
  }

  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: PictureCardConfig;

  public getCardSize(): number {
    return 5;
  }

  public setConfig(config: PictureCardConfig): void {
    if (!config || (!config.image && !config.image_entity)) {
      throw new Error("Image required");
    }

    this._config = {
      tap_action: { action: "more-info" },
      ...config,
    };
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this._config || hasConfigChanged(this, changedProps)) {
      return true;
    }
    if (this._config.image_entity && changedProps.has("hass")) {
      const oldHass = changedProps.get("hass") as HomeAssistant | undefined;
      if (
        !oldHass ||
        oldHass.states[this._config.image_entity] !==
          this.hass!.states[this._config.image_entity]
      ) {
        return true;
      }
    }

    return false;
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (!this._config || !this.hass) {
      return;
    }
    const oldHass = changedProps.get("hass") as HomeAssistant | undefined;
    const oldConfig = changedProps.get("_config") as
      | PictureCardConfig
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
    if (!this._config || !this.hass) {
      return nothing;
    }

    let stateObj: ImageEntity | PersonEntity | undefined;

    if (this._config.image_entity) {
      stateObj = this.hass.states[this._config.image_entity];
      if (!stateObj) {
        return html`<hui-warning .hass=${this.hass}>
          ${createEntityNotFoundWarning(this.hass, this._config.image_entity)}
        </hui-warning>`;
      }
    }

    let image: string | undefined = this._config.image;
    if (this._config.image_entity) {
      const domain: string = computeDomain(this._config.image_entity);
      switch (domain) {
        case "image":
          image = computeImageUrl(stateObj as ImageEntity);
          break;
        case "person":
          if ((stateObj as PersonEntity).attributes.entity_picture) {
            image = (stateObj as PersonEntity).attributes.entity_picture;
          }
          break;
      }
    }

    return html`
      <ha-card
        @action=${this._handleAction}
        .actionHandler=${actionHandler({
          hasHold: hasAction(this._config!.hold_action),
          hasDoubleClick: hasAction(this._config!.double_tap_action),
        })}
        tabindex=${ifDefined(
          hasAction(this._config.tap_action) || this._config.image_entity
            ? "0"
            : undefined
        )}
        class=${classMap({
          clickable: Boolean(
            (this._config.image_entity && !this._config.tap_action) ||
              (this._config.tap_action &&
                this._config.tap_action.action !== "none") ||
              (this._config.hold_action &&
                this._config.hold_action.action !== "none") ||
              (this._config.double_tap_action &&
                this._config.double_tap_action.action !== "none")
          ),
        })}
      >
        <img
          alt=${ifDefined(
            this._config.alt_text || stateObj?.attributes.friendly_name
          )}
          src=${this.hass.hassUrl(image)}
        />
      </ha-card>
    `;
  }

  static styles = css`
    ha-card {
      overflow: hidden;
      height: 100%;
    }

    ha-card.clickable {
      cursor: pointer;
    }

    img {
      display: block;
      width: 100%;
    }
  `;

  private _handleAction(ev: ActionHandlerEvent) {
    handleAction(this, this.hass!, this._config!, ev.detail.action!);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-picture-card": HuiPictureCard;
  }
}
