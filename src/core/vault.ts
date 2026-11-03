/**
 * SovereignMesh - Air-Gap In-Memory Secret Vault
 * Keeps sensitive identifiers strictly in local RAM and issues reversible tokens.
 */

export interface VaultEntry {
  id: string;             // e.g. "VAULT_API_KEY_1"
  token: string;          // e.g. "[VAULT_API_KEY_1]"
  secret: string;         // Real secret value in RAM only
  type: 'API_KEY' | 'DB_URL' | 'PRIVATE_IP' | 'EMAIL' | 'SECRET_TOKEN' | 'CUSTOM';
  detectedAt: Date;
}

export class SecretVault {
  private entries: Map<string, VaultEntry> = new Map(); // token -> VaultEntry
  private secretToToken: Map<string, string> = new Map(); // secret -> token
  private counter: Map<string, number> = new Map();

  /**
   * Register a secret into the in-memory vault.
   * If secret already exists, returns existing token to ensure reference equality.
   */
  register(secret: string, type: VaultEntry['type']): string {
    if (!secret || secret.trim().length === 0) return secret;

    if (this.secretToToken.has(secret)) {
      return this.secretToToken.get(secret)!;
    }

    const count = (this.counter.get(type) || 0) + 1;
    this.counter.set(type, count);

    const id = `VAULT_${type}_${count}`;
    const token = `[${id}]`;

    const entry: VaultEntry = {
      id,
      token,
      secret,
      type,
      detectedAt: new Date()
    };

    this.entries.set(token, entry);
    this.secretToToken.set(secret, token);

    return token;
  }

  /**
   * Retrieve an entry by its token.
   */
  get(token: string): VaultEntry | undefined {
    return this.entries.get(token);
  }

  /**
   * Get all registered tokens in this session.
   */
  getAll(): VaultEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Number of scrubbed items currently in memory.
   */
  get size(): number {
    return this.entries.size;
  }

  /**
   * Clear the vault from RAM.
   */
  clear(): void {
    this.entries.clear();
    this.secretToToken.clear();
    this.counter.clear();
  }
}
