import type { HassEntity } from "home-assistant-js-websocket";
import { isComponentLoaded } from "../../common/config/is_component_loaded";
import { computeDomain } from "../../common/entity/compute_domain";
import type { GroupEntity } from "../../data/group";
import { computeGroupDomain } from "../../data/group";
import { CONTINUOUS_DOMAINS } from "../../data/logbook";
import type { HomeAssistant } from "../../types";
import { isNumericEntity } from "../../data/history";

export const DOMAINS_NO_INFO = ["camera", "configurator"];
/**
 * Entity domains that should be editable *if* they have an id present;
 * {@see shouldShowEditIcon}.
 * */
export const EDITABLE_DOMAINS_WITH_ID = ["scene", "automation"];
/**
 * Entity Domains that should always be editable; {@see shouldShowEditIcon}.
 * */
export const EDITABLE_DOMAINS_WITH_UNIQUE_ID = ["script"];
/** Domains with with new more info design. */
export const DOMAINS_WITH_NEW_MORE_INFO = [
  "alarm_control_panel",
  "cover",
  "climate",
  "conversation",
  "fan",
  "humidifier",
  "input_boolean",
  "light",
  "lock",
  "siren",
  "script",
  "switch",
  "valve",
  "water_heater",
  "weather",
];
/** Domains with full height more info dialog */
export const DOMAINS_FULL_HEIGHT_MORE_INFO = ["update"];

/** Domains with separate more info dialog. */
export const DOMAINS_WITH_MORE_INFO = [
  "alarm_control_panel",
  "automation",
  "camera",
  "climate",
  "configurator",
  "conversation",
  "counter",
  "cover",
  "date",
  "datetime",
  "fan",
  "group",
  "humidifier",
  "image",
  "input_boolean",
  "input_datetime",
  "lawn_mower",
  "light",
  "lock",
  "media_player",
  "person",
  "remote",
  "script",
  "scene",
  "siren",
  "sun",
  "switch",
  "time",
  "timer",
  "update",
  "vacuum",
  "valve",
  "water_heater",
  "weather",
];

/** Domains that do not show the default more info dialog content (e.g. the attribute section)
 *  and do not have a separate more info (so not in DOMAINS_WITH_MORE_INFO). */
export const DOMAINS_HIDE_DEFAULT_MORE_INFO = [
  "input_number",
  "input_select",
  "input_text",
  "number",
  "scene",
  "select",
  "text",
  "update",
  "event",
];

/** Domains that should have the history hidden in the more info dialog. */
export const DOMAINS_MORE_INFO_NO_HISTORY = ["camera", "configurator"];

export const computeShowHistoryComponent = (
  hass: HomeAssistant,
  entityId: string
) =>
  isComponentLoaded(hass, "history") &&
  !DOMAINS_MORE_INFO_NO_HISTORY.includes(computeDomain(entityId));

export const computeShowLogBookComponent = (
  hass: HomeAssistant,
  entityId: string,
  sensorNumericalDeviceClasses: string[] = []
): boolean => {
  if (!isComponentLoaded(hass, "logbook")) {
    return false;
  }

  const stateObj = hass.states[entityId];
  if (!stateObj) {
    return false;
  }

  const domain = computeDomain(entityId);
  if (
    (CONTINUOUS_DOMAINS.includes(domain) &&
      isNumericEntity(
        domain,
        stateObj,
        undefined,
        sensorNumericalDeviceClasses
      )) ||
    DOMAINS_MORE_INFO_NO_HISTORY.includes(domain)
  ) {
    return false;
  }

  return true;
};

export const computeShowNewMoreInfo = (stateObj: HassEntity): boolean => {
  const domain = computeDomain(stateObj.entity_id);
  if (domain === "group") {
    const groupDomain = computeGroupDomain(stateObj as GroupEntity);
    return (
      groupDomain != null &&
      groupDomain !== "group" &&
      DOMAINS_WITH_NEW_MORE_INFO.includes(groupDomain)
    );
  }
  return DOMAINS_WITH_NEW_MORE_INFO.includes(domain);
};
