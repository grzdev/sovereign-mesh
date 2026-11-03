/**
 * SovereignMesh - Air-Gap Code & Prompt Sanitizer
 * Detects confidential patterns and swaps them with reversible Vault tokens.
 */

import { SecretVault, VaultEntry } from './vault.js';

export interface SanitizeResult {
  sanitizedContent: string;
  vault: SecretVault;
  scrubbedCount: number;
  report: {
    type: VaultEntry['type'];
    token: string;
    maskedPreview: string;
    line?: number;
  }[];
}

export class CodeSanitizer {
  /**
   * Masks a raw secret for safe display in UI/logs (e.g., "AKIA************4A2F")
   */
  static maskSecret(secret: string): string {
    if (secret.length <= 8) return '****';
    const head = secret.slice(0, 4);
    const tail = secret.slice(-4);
    return `${head}${'*'.repeat(Math.max(4, secret.length - 8))}${tail}`;
  }

  /**
   * Sanitizes text/code using an optional existing vault or creates a new one.
   */
  static sanitize(content: string, vault: SecretVault = new SecretVault()): SanitizeResult {
    let sanitized = content;
    const report: SanitizeResult['report'] = [];

    // 1. AWS Access Keys
    const awsRegex = /\b(AKIA[0-9A-Z]{16})\b/g;
    sanitized = sanitized.replace(awsRegex, (match) => {
      const token = vault.register(match, 'API_KEY');
      report.push({
        type: 'API_KEY',
        token,
        maskedPreview: this.maskSecret(match)
      });
      return token;
    });

    // 2. OpenAI / Claude / Otari / Generic sk-* style keys
    const skRegex = /\b(sk-[a-zA-Z0-9_\-]{20,})\b/g;
    sanitized = sanitized.replace(skRegex, (match) => {
      const token = vault.register(match, 'API_KEY');
      report.push({
        type: 'API_KEY',
        token,
        maskedPreview: this.maskSecret(match)
      });
      return token;
    });

    // 3. Database URLs (postgres, mongodb, mysql, redis)
    const dbRegex = /\b((postgres|postgresql|mongodb|mongodb\+srv|mysql|redis):\/\/[^\s"']+)\b/g;
    sanitized = sanitized.replace(dbRegex, (match) => {
      const token = vault.register(match, 'DB_URL');
      report.push({
        type: 'DB_URL',
        token,
        maskedPreview: this.maskSecret(match)
      });
      return token;
    });

    // 4. Key-Value Config Assignments (e.g. apiKey: "xyz", SECRET_KEY = 'abc')
    const configRegex = /(["']?(?:api_?key|apiKey|secret_?key|secret|password|access_?token|auth_?token|private_?key)["']?\s*[:=]\s*["'])([^"'\r\n]{8,})(["'])/gi;
    sanitized = sanitized.replace(configRegex, (match, prefix, secretValue, suffix) => {
      // Don't re-sanitize already tokenized placeholders
      if (secretValue.startsWith('[VAULT_')) return match;
      const token = vault.register(secretValue, 'SECRET_TOKEN');
      report.push({
        type: 'SECRET_TOKEN',
        token,
        maskedPreview: this.maskSecret(secretValue)
      });
      return `${prefix}${token}${suffix}`;
    });

    // 5. Private IP Addresses
    const ipRegex = /\b((?:10\.\d{1,3}\.\d{1,3}\.\d{1,3})|(?:192\.168\.\d{1,3}\.\d{1,3})|(?:172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}))\b/g;
    sanitized = sanitized.replace(ipRegex, (match) => {
      const token = vault.register(match, 'PRIVATE_IP');
      report.push({
        type: 'PRIVATE_IP',
        token,
        maskedPreview: this.maskSecret(match)
      });
      return token;
    });

    // 6. Corporate Emails
    const emailRegex = /\b([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)\b/g;
    sanitized = sanitized.replace(emailRegex, (match) => {
      // Skip common public domains in documentation if needed, or tokenize all
      if (match.endsWith('@example.com') || match.endsWith('@test.com')) return match;
      const token = vault.register(match, 'EMAIL');
      report.push({
        type: 'EMAIL',
        token,
        maskedPreview: this.maskSecret(match)
      });
      return token;
    });

    return {
      sanitizedContent: sanitized,
      vault,
      scrubbedCount: report.length,
      report
    };
  }
}
