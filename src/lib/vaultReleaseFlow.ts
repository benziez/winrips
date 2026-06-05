import { VAULT_SHIPPING_COST } from "../constants/shipping";
import { processShippingRequest } from "./shippingLogic";

export interface VaultShippingConfirmInput {
  name: string;
  address: string;
}

export interface VaultReleaseConfirmDeps {
  vaultItemId: string;
  markVaultItemPendingShipment: (
    vaultId: string,
    shippingName: string,
    shippingAddress: string,
    serverGemsBalance?: number,
  ) => void;
}

/** Shared finalize handler for vault locker and post-drop shipping. */
export function createVaultReleaseOnConfirm(deps: VaultReleaseConfirmDeps) {
  return async ({
    name,
    address,
  }: {
    name: string;
    address: string;
  }): Promise<{ ok: boolean; error?: string }> => {
    const result = await processShippingRequest({
      itemId: deps.vaultItemId,
      name,
      address,
    });

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    deps.markVaultItemPendingShipment(
      deps.vaultItemId,
      name,
      address,
      result.gemsBalance,
    );
    return { ok: true };
  };
}

export { VAULT_SHIPPING_COST };
