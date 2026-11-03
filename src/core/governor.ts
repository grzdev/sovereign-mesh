/**
 * SovereignMesh - Token & Budget Governor
 * Enforces per-task and session budget limits for Otari cloud queries,
 * tracks token telemetry, and calculates money saved by local PC triage.
 */

export interface GovernorConfig {
  sessionBudgetUSD: number;    // e.g. $1.00 max spend
  maxTokensPerRequest: number; // e.g. 15,000 max tokens per task
  estPricePer1KTokens: number; // e.g. $0.0004 per 1k tokens
}

export interface TelemetryStats {
  totalRequests: number;
  localRequests: number;
  cloudRequests: number;
  localTokensProcessed: number;
  cloudTokensConsumed: number;
  dollarsSaved: number;
  dollarsSpent: number;
  budgetRemainingUSD: number;
  zeroLeakRedactionsCount: number;
}

export class BudgetGovernor {
  private config: GovernorConfig;
  private totalRequests = 0;
  private localRequests = 0;
  private cloudRequests = 0;
  private localTokens = 0;
  private cloudTokens = 0;
  private totalRedactions = 0;

  constructor(config: Partial<GovernorConfig> = {}) {
    this.config = {
      sessionBudgetUSD: config.sessionBudgetUSD ?? 2.00,
      maxTokensPerRequest: config.maxTokensPerRequest ?? 20000,
      estPricePer1KTokens: config.estPricePer1KTokens ?? 0.0004
    };
  }

  /**
   * Pre-flight budget check before sending a request to Otari.
   */
  canExecuteCloud(estimatedTokens: number): { allowed: boolean; reason?: string } {
    if (estimatedTokens > this.config.maxTokensPerRequest) {
      return {
        allowed: false,
        reason: `Request exceeds max allowed tokens (${estimatedTokens} > ${this.config.maxTokensPerRequest})`
      };
    }

    const estimatedCost = (estimatedTokens / 1000) * this.config.estPricePer1KTokens;
    const spent = (this.cloudTokens / 1000) * this.config.estPricePer1KTokens;
    if (spent + estimatedCost > this.config.sessionBudgetUSD) {
      return {
        allowed: false,
        reason: `Session budget limit reached (Spent: $${spent.toFixed(4)}, Limit: $${this.config.sessionBudgetUSD.toFixed(2)})`
      };
    }

    return { allowed: true };
  }

  recordLocal(tokens: number): void {
    this.totalRequests++;
    this.localRequests++;
    this.localTokens += tokens;
  }

  recordCloud(tokens: number, redactionsCount: number = 0): void {
    this.totalRequests++;
    this.cloudRequests++;
    this.cloudTokens += tokens;
    this.totalRedactions += redactionsCount;
  }

  getStats(): TelemetryStats {
    const dollarsSpent = (this.cloudTokens / 1000) * this.config.estPricePer1KTokens;
    const dollarsSaved = (this.localTokens / 1000) * this.config.estPricePer1KTokens;
    const budgetRemaining = Math.max(0, this.config.sessionBudgetUSD - dollarsSpent);

    return {
      totalRequests: this.totalRequests,
      localRequests: this.localRequests,
      cloudRequests: this.cloudRequests,
      localTokensProcessed: this.localTokens,
      cloudTokensConsumed: this.cloudTokens,
      dollarsSaved: parseFloat(dollarsSaved.toFixed(4)),
      dollarsSpent: parseFloat(dollarsSpent.toFixed(4)),
      budgetRemainingUSD: parseFloat(budgetRemaining.toFixed(4)),
      zeroLeakRedactionsCount: this.totalRedactions
    };
  }
}
