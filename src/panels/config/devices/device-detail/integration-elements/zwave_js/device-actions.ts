import {
  mdiChatQuestion,
  mdiCog,
  mdiDeleteForever,
  mdiHospitalBox,
  mdiInformation,
  mdiPlus,
  mdiUpload,
  mdiWrench,
} from "@mdi/js";
import { getConfigEntries } from "../../../../../../data/config_entries";
import type { DeviceRegistryEntry } from "../../../../../../data/device_registry";
import {
  fetchZwaveIntegrationSettings,
  fetchZwaveIsAnyOTAFirmwareUpdateInProgress,
  fetchZwaveIsNodeFirmwareUpdateInProgress,
  fetchZwaveNetworkStatus,
  fetchZwaveNodeStatus,
} from "../../../../../../data/zwave_js";
import { showConfirmationDialog } from "../../../../../../dialogs/generic/show-dialog-box";
import type { HomeAssistant } from "../../../../../../types";
import { showZWaveJSRebuildNodeRoutesDialog } from "../../../../integrations/integration-panels/zwave_js/show-dialog-zwave_js-rebuild-node-routes";
import { showZWaveJSNodeStatisticsDialog } from "../../../../integrations/integration-panels/zwave_js/show-dialog-zwave_js-node-statistics";
import { showZWaveJSReinterviewNodeDialog } from "../../../../integrations/integration-panels/zwave_js/show-dialog-zwave_js-reinterview-node";
import { showZWaveJSRemoveFailedNodeDialog } from "../../../../integrations/integration-panels/zwave_js/show-dialog-zwave_js-remove-failed-node";
import { showZWaveJSUpdateFirmwareNodeDialog } from "../../../../integrations/integration-panels/zwave_js/show-dialog-zwave_js-update-firmware-node";
import type { DeviceAction } from "../../../ha-config-device-page";
import { showZWaveJSHardResetControllerDialog } from "../../../../integrations/integration-panels/zwave_js/show-dialog-zwave_js-hard-reset-controller";
import { showZWaveJSAddNodeDialog } from "../../../../integrations/integration-panels/zwave_js/add-node/show-dialog-zwave_js-add-node";

export const getZwaveDeviceActions = async (
  el: HTMLElement,
  hass: HomeAssistant,
  device: DeviceRegistryEntry
): Promise<DeviceAction[]> => {
  const configEntries = await getConfigEntries(hass, {
    domain: "zwave_js",
  });

  const configEntry = configEntries.find((entry) =>
    device.config_entries.includes(entry.entry_id)
  );

  if (!configEntry) {
    return [];
  }

  const entryId = configEntry.entry_id;

  const nodeStatus = await fetchZwaveNodeStatus(hass, device.id);

  if (!nodeStatus) {
    return [];
  }

  const actions: DeviceAction[] = [];

  if (!nodeStatus.is_controller_node) {
    actions.push(
      {
        label: hass.localize(
          "ui.panel.config.zwave_js.device_info.device_config"
        ),
        icon: mdiCog,
        href: `/config/zwave_js/node_config/${device.id}?config_entry=${entryId}`,
      },
      {
        label: hass.localize(
          "ui.panel.config.zwave_js.device_info.reinterview_device"
        ),
        icon: mdiChatQuestion,
        action: () =>
          showZWaveJSReinterviewNodeDialog(el, {
            device_id: device.id,
          }),
      },
      {
        label: hass.localize(
          "ui.panel.config.zwave_js.device_info.rebuild_routes"
        ),
        icon: mdiHospitalBox,
        action: () =>
          showZWaveJSRebuildNodeRoutesDialog(el, {
            device,
          }),
      },
      {
        label: hass.localize(
          "ui.panel.config.zwave_js.device_info.remove_failed"
        ),
        icon: mdiDeleteForever,
        action: () =>
          showZWaveJSRemoveFailedNodeDialog(el, {
            device_id: device.id,
          }),
      },
      {
        label: hass.localize(
          "ui.panel.config.zwave_js.device_info.node_statistics"
        ),
        icon: mdiInformation,
        action: () =>
          showZWaveJSNodeStatisticsDialog(el, {
            device,
          }),
      }
    );
  }

  const integrationSettings = await fetchZwaveIntegrationSettings(hass);

  if (integrationSettings.installer_mode) {
    actions.push({
      label: hass.localize(
        "ui.panel.config.zwave_js.device_info.installer_settings"
      ),
      icon: mdiWrench,
      href: `/config/zwave_js/node_installer/${device.id}?config_entry=${entryId}`,
    });
  }

  if (
    !(
      nodeStatus.ready &&
      (nodeStatus.is_controller_node || nodeStatus.has_firmware_update_cc)
    )
  ) {
    return actions;
  }

  const [isAnyFirmwareUpdateInProgress, isNodeFirmwareUpdateInProgress] =
    await Promise.all([
      fetchZwaveIsAnyOTAFirmwareUpdateInProgress(hass, entryId),
      fetchZwaveIsNodeFirmwareUpdateInProgress(hass, device.id),
    ]);

  if (!isAnyFirmwareUpdateInProgress || isNodeFirmwareUpdateInProgress) {
    actions.push({
      label: hass.localize(
        "ui.panel.config.zwave_js.device_info.update_firmware"
      ),
      icon: mdiUpload,
      action: async () => {
        if (
          isNodeFirmwareUpdateInProgress ||
          (await fetchZwaveIsNodeFirmwareUpdateInProgress(hass, device.id)) ||
          (await showConfirmationDialog(el, {
            text: hass.localize(
              `ui.panel.config.zwave_js.update_firmware.${
                nodeStatus.is_controller_node ? "warning_controller" : "warning"
              }`
            ),
            dismissText: hass.localize("ui.common.no"),
            confirmText: hass.localize("ui.common.yes"),
          }))
        ) {
          showZWaveJSUpdateFirmwareNodeDialog(el, {
            device,
          });
        }
      },
    });
  }

  if (nodeStatus.is_controller_node) {
    const networkStatus = await fetchZwaveNetworkStatus(hass, {
      entry_id: entryId,
    });
    actions.unshift({
      label: hass.localize("ui.panel.config.zwave_js.common.add_node"),
      icon: mdiPlus,
      action: async () => {
        showZWaveJSAddNodeDialog(el, {
          entry_id: entryId,
          longRangeSupported: networkStatus.controller?.supports_long_range,
        });
      },
    });
    actions.push({
      label: hass.localize(
        "ui.panel.config.zwave_js.device_info.hard_reset_controller"
      ),
      icon: mdiDeleteForever,
      action: async () => {
        showZWaveJSHardResetControllerDialog(el, {
          entryId,
        });
      },
    });
  }

  return actions;
};
