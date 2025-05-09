import type { PropertyValues } from "lit";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators";

@customElement("hui-marquee")
class HuiMarquee extends LitElement {
  @property() public text?: string;

  @property({ type: Boolean }) public active = false;

  // @todo Consider reworking to eliminate need for attribute since it is manipulated internally
  @property({ reflect: true, type: Boolean }) public animating = false;

  protected firstUpdated(changedProps) {
    super.firstUpdated(changedProps);

    this.addEventListener("mouseover", () => this.classList.add("hovering"), {
      // Capture because we need to run before a parent sets active on us.
      // Hovering will disable the overflow, allowing us to calc if we overflow.
      capture: true,
    });

    this.addEventListener("mouseout", () => this.classList.remove("hovering"));
  }

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    if (changedProperties.has("text") && this.animating) {
      this.animating = false;
    }

    if (
      changedProperties.has("active") &&
      this.active &&
      this.offsetWidth < this.scrollWidth
    ) {
      this.animating = true;
    }
  }

  protected render() {
    if (!this.text) {
      return nothing;
    }

    return html`
      <div class="marquee-inner" @animationiteration=${this._onIteration}>
        <span>${this.text}</span>
        ${this.animating ? html` <span>${this.text}</span> ` : ""}
      </div>
    `;
  }

  private _onIteration() {
    if (!this.active) {
      this.animating = false;
    }
  }

  static styles = css`
    :host {
      display: flex;
      position: relative;
      align-items: center;
      height: 1.2em;
      contain: strict;
    }

    .marquee-inner {
      position: absolute;
      left: 0;
      right: 0;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    :host(.hovering) .marquee-inner {
      text-overflow: initial;
      overflow: initial;
    }

    :host([animating]) .marquee-inner {
      left: initial;
      right: initial;
      animation: marquee 10s linear infinite;
    }

    :host([animating]) .marquee-inner span {
      padding-right: 16px;
      padding-inline-end: 16px;
      padding-inline-start: initial;
    }

    @keyframes marquee {
      0% {
        transform: translateX(0%);
      }
      100% {
        transform: translateX(-50%);
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-marquee": HuiMarquee;
  }
}
