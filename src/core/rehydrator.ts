/**
 * SovereignMesh - In-Memory Secret Rehydrator
 * Re-integrates confidential values into the cloud-generated code patch safely in local RAM.
 */

import { SecretVault } from './vault.js';

export interface RehydrateResult {
  rehydratedContent: string;
  restoredCount: number;
  hallucinatedTokens: string[];
}

export class CodeRehydrator {
  /**
   * Rehydrates vault tokens back to original secrets using the session vault.
   */
  static rehydrate(content: string, vault: SecretVault): RehydrateResult {
    let rehydrated = content;
    let restoredCount = 0;
    const hallucinatedTokens: string[] = [];

    // Find all [VAULT_TYPE_N] tokens in the generated response
    const tokenRegex = /\[VAULT_[A-Z_]+_\d+\]/g;

    rehydrated = rehydrated.replace(tokenRegex, (match) => {
      const entry = vault.get(match);
      if (entry) {
        restoredCount++;
        return entry.secret;
      } else {
        hallucinatedTokens.push(match);
        return match; // Keep as-is if unrecognized
      }
    });

    return {
      rehydratedContent: rehydrated,
      restoredCount,
      hallucinatedTokens
    };
  }
}
