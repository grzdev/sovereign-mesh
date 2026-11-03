/**
 * SovereignMesh - Dual-Tier Triage Router
 * Evaluates whether an incoming task can be solved 100% locally on PC ($0 cost, 0 network leakage)
 * or requires Otari's cloud open-weight reasoning muscle.
 */

export type ExecutionTier = 'LOCAL_ONLY' | 'OTARI_HYBRID';

export interface TriageDecision {
  tier: ExecutionTier;
  confidence: number;
  reason: string;
  estimatedTokens: number;
  localCost: number;       // Always $0.00
  estimatedCloudCost: number; // Based on token rate
}

export class TriageRouter {
  // Approximate pricing per 1K tokens for open-weight hosted models
  private static readonly EST_CLOUD_PRICE_PER_1K = 0.0004;

  /**
   * Evaluates prompt intent and payload complexity to route the request.
   */
  static evaluate(prompt: string, codePayload: string = '', userPreference: 'auto' | 'local' | 'cloud' = 'auto'): TriageDecision {
    if (userPreference === 'local') {
      return {
        tier: 'LOCAL_ONLY',
        confidence: 1.0,
        reason: 'User forced local execution (100% air-gapped)',
        estimatedTokens: this.estimateTokens(prompt, codePayload),
        localCost: 0,
        estimatedCloudCost: 0
      };
    }

    if (userPreference === 'cloud') {
      const estTokens = this.estimateTokens(prompt, codePayload);
      return {
        tier: 'OTARI_HYBRID',
        confidence: 1.0,
        reason: 'User forced Otari cloud acceleration',
        estimatedTokens: estTokens,
        localCost: 0,
        estimatedCloudCost: (estTokens / 1000) * this.EST_CLOUD_PRICE_PER_1K
      };
    }

    const lowerPrompt = prompt.toLowerCase();
    const lineCount = codePayload ? codePayload.split('\n').length : 0;
    const estTokens = this.estimateTokens(prompt, codePayload);
    const estCloudCost = (estTokens / 1000) * this.EST_CLOUD_PRICE_PER_1K;

    // Fast-path local patterns: lightweight tasks ideal for 1B-3B models
    const localKeywords = [
      'format', 'lint', 'typo', 'comment', 'docstring', 'rename',
      'regex', 'explain simple', 'syntax', 'add type', 'one-liner'
    ];

    // Heavy-path cloud patterns: architectural and multi-step tasks requiring Qwen 35B
    const heavyKeywords = [
      'architect', 'refactor', 'redesign', 'optimize performance',
      'concurrency', 'deadlock', 'database migration', 'security audit',
      'full microservice', 'algorithm', 'distributed', 'async pipeline'
    ];

    const hasLocalMatch = localKeywords.some(k => lowerPrompt.includes(k));
    const hasHeavyMatch = heavyKeywords.some(k => lowerPrompt.includes(k));

    // Decision Logic
    if (hasHeavyMatch || lineCount > 60 || estTokens > 800) {
      return {
        tier: 'OTARI_HYBRID',
        confidence: 0.92,
        reason: `Complex task detected (${lineCount} lines, heavy reasoning required). Routing to Otari with air-gap sanitization.`,
        estimatedTokens: estTokens,
        localCost: 0,
        estimatedCloudCost: estCloudCost
      };
    }

    if (hasLocalMatch || (lineCount < 30 && estTokens < 350)) {
      return {
        tier: 'LOCAL_ONLY',
        confidence: 0.88,
        reason: `Lightweight task (${lineCount} lines). Triaged 100% locally on Ollama (llama3.2:1b) for $0 with zero network exposure.`,
        estimatedTokens: estTokens,
        localCost: 0,
        estimatedCloudCost: estCloudCost
      };
    }

    // Default fallback: If under 45 lines, try local first
    if (lineCount <= 45) {
      return {
        tier: 'LOCAL_ONLY',
        confidence: 0.75,
        reason: 'Standard complexity: running locally on device to preserve privacy.',
        estimatedTokens: estTokens,
        localCost: 0,
        estimatedCloudCost: estCloudCost
      };
    }

    return {
      tier: 'OTARI_HYBRID',
      confidence: 0.85,
      reason: 'Medium/high complexity: air-gap scrubbing enabled for Otari cloud acceleration.',
      estimatedTokens: estTokens,
      localCost: 0,
      estimatedCloudCost: estCloudCost
    };
  }

  private static estimateTokens(prompt: string, code: string): number {
    const totalChars = (prompt.length + (code?.length || 0));
    // Rule of thumb: ~4 characters per token
    return Math.ceil(totalChars / 4);
  }
}
