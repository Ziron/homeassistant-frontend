import { mdiTelevision } from "@mdi/js";
import { css, html, LitElement, nothing } from "lit";
import { customElement, state } from "lit/decorators";
import type { CastManager } from "../../../src/cast/cast_manager";
import { castSendShowDemo } from "../../../src/cast/receiver_messages";
import "../../../src/components/ha-icon";
import type {
  CastConfig,
  LovelaceRow,
} from "../../../src/panels/lovelace/entity-rows/types";
import type { HomeAssistant } from "../../../src/types";

@customElement("cast-demo-row")
class CastDemoRow extends LitElement implements LovelaceRow {
  public hass!: HomeAssistant;

  @state() private _castManager?: CastManager | null;

  public setConfig(_config: CastConfig): void {
    // No config possible.
  }

  protected render() {
    if (
      !this._castManager ||
      this._castManager.castState === "NO_DEVICES_AVAILABLE"
    ) {
      return nothing;
    }
    return html`
      <ha-svg-icon .path=${mdiTelevision}></ha-svg-icon>
      <div class="flex">
        <div class="name">Show Chromecast interface</div>
        <google-cast-launcher></google-cast-launcher>
      </div>
    `;
  }

  protected firstUpdated(changedProps) {
    super.firstUpdated(changedProps);
    import("../../../src/cast/cast_manager").then(({ getCastManager }) =>
      getCastManager().then((mgr) => {
        this._castManager = mgr;
        mgr.addEventListener("state-changed", () => {
          this.requestUpdate();
        });
        mgr.castContext.addEventListener(
          cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
          (ev) => {
            // On Android, opening a new session always results in SESSION_RESUMED.
            // So treat both as the same.
            if (
              ev.sessionState === "SESSION_STARTED" ||
              ev.sessionState === "SESSION_RESUMED"
            ) {
              castSendShowDemo(mgr);
            }
          }
        );
      })
    );
  }

  protected updated(changedProps) {
    super.updated(changedProps);
    this.style.display = this._castManager ? "" : "none";
  }

  static styles = css`
    :host {
      display: flex;
      align-items: center;
    }
    ha-svg-icon {
      padding: 8px;
      color: var(--state-icon-color);
    }
    .flex {
      flex: 1;
      overflow: hidden;
      margin-left: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    google-cast-launcher {
      cursor: pointer;
      display: inline-block;
      height: 24px;
      width: 24px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "cast-demo-row": CastDemoRow;
  }
}
