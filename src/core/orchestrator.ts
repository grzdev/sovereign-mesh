/**
 * SovereignMesh - Core Orchestrator
 * Glues Triage, Air-Gap Sanitization, Dual-Tier Execution, and Rehydration into a unified pipeline.
 */

import { SecretVault } from './vault.js';
import { CodeSanitizer, SanitizeResult } from './sanitizer.js';
import { CodeRehydrator, RehydrateResult } from './rehydrator.js';
import { TriageRouter, TriageDecision } from './triage.js';
import { BudgetGovernor, TelemetryStats } from './governor.js';
import { OllamaGateway } from '../gateway/ollama.js';
import { OtariGateway } from '../gateway/otari.js';

export interface ProcessRequest {
  prompt: string;
  codePayload?: string;
  preference?: 'auto' | 'local' | 'cloud';
  localModel?: string;
  cloudModel?: string;
}

export interface ProcessEvent {
  step: 'TRIAGE' | 'SANITIZATION' | 'EXECUTION' | 'REHYDRATION' | 'COMPLETE' | 'ERROR';
  message: string;
  timestamp: number;
  data?: any;
}

export interface ProcessResponse {
  finalContent: string;
  decision: TriageDecision;
  sanitization: {
    scrubbedCount: number;
    sanitizedPreview: string;
    report: SanitizeResult['report'];
  };
  execution: {
    tier: 'LOCAL_ONLY' | 'OTARI_HYBRID';
    model: string;
    durationMs: number;
    tokens: number;
  };
  rehydration: RehydrateResult;
  telemetry: TelemetryStats;
  events: ProcessEvent[];
}

export class MeshOrchestrator {
  private ollama: OllamaGateway;
  private otari: OtariGateway;
  private governor: BudgetGovernor;

  constructor(
    ollama: OllamaGateway = new OllamaGateway(),
    otari: OtariGateway = new OtariGateway(),
    governor: BudgetGovernor = new BudgetGovernor()
  ) {
    this.ollama = ollama;
    this.otari = otari;
    this.governor = governor;
  }

  getGovernor(): BudgetGovernor {
    return this.governor;
  }

  getOllama(): OllamaGateway {
    return this.ollama;
  }

  getOtari(): OtariGateway {
    return this.otari;
  }

  async process(
    req: ProcessRequest,
    onEvent?: (event: ProcessEvent) => void
  ): Promise<ProcessResponse> {
    const events: ProcessEvent[] = [];
    const emit = (step: ProcessEvent['step'], message: string, data?: any) => {
      const evt: ProcessEvent = { step, message, timestamp: Date.now(), data };
      events.push(evt);
      if (onEvent) onEvent(evt);
    };

    // Step 1: Triage
    emit('TRIAGE', 'Evaluating task complexity and routing strategy...');
    const decision = TriageRouter.evaluate(req.prompt, req.codePayload || '', req.preference || 'auto');
    emit('TRIAGE', `Decision made: ${decision.tier} (${decision.reason})`, decision);

    const vault = new SecretVault();
    let sanitizedCode = req.codePayload || '';
    let sanitizationReport: SanitizeResult['report'] = [];
    let scrubbedCount = 0;

    // Step 2: Sanitization (Air-gap protection)
    emit('SANITIZATION', 'Scanning input for secrets, keys, database URIs, and PII...');
    if (sanitizedCode) {
      const sanitizeRes = CodeSanitizer.sanitize(sanitizedCode, vault);
      sanitizedCode = sanitizeRes.sanitizedContent;
      sanitizationReport = sanitizeRes.report;
      scrubbedCount = sanitizeRes.scrubbedCount;
    }

    // Also sanitize prompt in case sensitive keys were pasted in instructions
    const promptSanitize = CodeSanitizer.sanitize(req.prompt, vault);
    const sanitizedPrompt = promptSanitize.sanitizedContent;
    sanitizationReport = [...sanitizationReport, ...promptSanitize.report];
    scrubbedCount += promptSanitize.scrubbedCount;

    emit('SANITIZATION', `Sanitization complete: ${scrubbedCount} sensitive items isolated in local RAM.`, {
      scrubbedCount,
      report: sanitizationReport
    });

    // Step 3: Execution
    let rawOutput = '';
    let modelUsed = '';
    let durationMs = 0;
    let tokens = 0;

    if (decision.tier === 'LOCAL_ONLY') {
      emit('EXECUTION', `Dispatching to local edge runner (Ollama: ${req.localModel || 'llama3.2:1b'})...`);
      modelUsed = req.localModel || 'llama3.2:1b';

      const userContent = sanitizedCode
        ? `${sanitizedPrompt}\n\n\`\`\`\n${sanitizedCode}\n\`\`\``
        : sanitizedPrompt;

      const localRes = await this.ollama.chat(
        [
          {
            role: 'system',
            content: 'You are a precise, privacy-preserving AI assistant running locally on the user machine. Provide clean, correct, directly applicable solutions.'
          },
          { role: 'user', content: userContent }
        ],
        modelUsed
      );

      rawOutput = localRes.content;
      durationMs = localRes.durationMs;
      tokens = localRes.totalTokens;
      this.governor.recordLocal(tokens);

      emit('EXECUTION', `Local inference finished in ${durationMs}ms ($0 cost, 0 network leakage).`, {
        tokens,
        durationMs
      });
    } else {
      // Cloud tier check
      const budgetCheck = this.governor.canExecuteCloud(decision.estimatedTokens);
      if (!budgetCheck.allowed) {
        throw new Error(`Governor Block: ${budgetCheck.reason}`);
      }

      emit('EXECUTION', `Dispatching scrubbed payload to Mozilla Otari Cloud (${req.cloudModel || 'alibaba/qwen-3.5-35b-a3b'})...`);
      modelUsed = req.cloudModel || 'alibaba/qwen-3.5-35b-a3b';

      const userContent = sanitizedCode
        ? `${sanitizedPrompt}\n\n\`\`\`\n${sanitizedCode}\n\`\`\``
        : sanitizedPrompt;

      const cloudRes = await this.otari.chat(
        [
          {
            role: 'system',
            content: 'You are an advanced software architect reasoning on an open-weight model via Mozilla Otari. Note that identifiers formatted as [VAULT_...] are placeholder tokens. Preserve these placeholder tokens exactly in your code patches.'
          },
          { role: 'user', content: userContent }
        ],
        modelUsed
      );

      rawOutput = cloudRes.content;
      durationMs = cloudRes.durationMs;
      tokens = cloudRes.totalTokens;
      this.governor.recordCloud(tokens, scrubbedCount);

      emit('EXECUTION', `Otari reasoning completed in ${durationMs}ms (${tokens} tokens consumed).`, {
        tokens,
        durationMs
      });
    }

    // Step 4: Rehydration
    emit('REHYDRATION', 'Rehydrating local secrets from RAM vault into the generated patch...');
    const rehydration = CodeRehydrator.rehydrate(rawOutput, vault);

    emit('REHYDRATION', `Rehydration finished: ${rehydration.restoredCount} secrets safely restored locally in RAM.`, {
      restoredCount: rehydration.restoredCount,
      hallucinatedTokens: rehydration.hallucinatedTokens
    });

    const finalTelemetry = this.governor.getStats();
    emit('COMPLETE', 'SovereignMesh execution cycle complete.', { telemetry: finalTelemetry });

    return {
      finalContent: rehydration.rehydratedContent,
      decision,
      sanitization: {
        scrubbedCount,
        sanitizedPreview: sanitizedCode,
        report: sanitizationReport
      },
      execution: {
        tier: decision.tier,
        model: modelUsed,
        durationMs,
        tokens
      },
      rehydration,
      telemetry: finalTelemetry,
      events
    };
  }
}
