/**
 * SovereignMesh - Mozilla Otari Gateway Adapter
 * Connects to Otari's hosted open-weight gateway (defaulting to alibaba/qwen-3.5-35b-a3b).
 * Injects Otari-Key server-side without exposing it to clients or logs.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface OtariChatResponse {
  content: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  durationMs: number;
}

export class OtariGateway {
  private baseUrl: string;
  private defaultModel: string;
  private apiKey: string;

  constructor(
    baseUrl: string = 'https://otari.ai/api/v1',
    defaultModel: string = 'alibaba/qwen-3.5-35b-a3b'
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.defaultModel = defaultModel;
    this.apiKey = this.loadKey();
  }

  /**
   * Securely loads key from process.env or .env.local without printing/exposing it.
   */
  private loadKey(): string {
    if (process.env.OTARI_API_KEY && process.env.OTARI_API_KEY.trim().length > 0) {
      return process.env.OTARI_API_KEY.trim();
    }

    // Check .env.local and .env in current or project directory
    const candidatePaths = [
      path.resolve(process.cwd(), '.env.local'),
      path.resolve(process.cwd(), '.env'),
      path.resolve(__dirname, '../../.env.local'),
      path.resolve(__dirname, '../../.env')
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          const content = fs.readFileSync(p, 'utf8');
          for (const line of content.split('\n')) {
            const trimmed = line.trim();
            if (trimmed.startsWith('OTARI_API_KEY=')) {
              let val = trimmed.slice('OTARI_API_KEY='.length).trim();
              if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
              }
              if (val) return val;
            }
          }
        } catch {
          // Ignore read errors
        }
      }
    }

    return '';
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      // Light ping with abort timeout
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Otari-Key': this.apiKey },
        signal: AbortSignal.timeout(3500)
      });
      return res.status === 200 || res.status === 404; // Even 404 on /models confirms endpoint reachability
    } catch {
      return false;
    }
  }

  async chat(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    model: string = this.defaultModel
  ): Promise<OtariChatResponse> {
    if (!this.isConfigured()) {
      throw new Error('OTARI_API_KEY is not configured in environment or .env.local');
    }

    const candidateModels = [
      model,
      'alibaba/qwen-3.5-35b-a3b',
      'meta/llama-3.1-8b-instruct',
      'deepseek/deepseek-v3'
    ];
    // Remove duplicates while preserving order
    const modelsToTry = Array.from(new Set(candidateModels));

    let lastError = '';

    for (const currentModel of modelsToTry) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        const startTime = Date.now();
        try {
          const res = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Otari-Key': this.apiKey
            },
            body: JSON.stringify({
              model: currentModel,
              messages,
              max_tokens: 1500
            })
          });

          if (res.ok) {
            const data = await res.json() as {
              choices?: Array<{ message?: { content: string } }>;
              model?: string;
              usage?: {
                prompt_tokens?: number;
                completion_tokens?: number;
                total_tokens?: number;
              };
            };

            const durationMs = Date.now() - startTime;
            const content = data.choices?.[0]?.message?.content || '';
            const promptTokens = data.usage?.prompt_tokens || 0;
            const completionTokens = data.usage?.completion_tokens || Math.ceil(content.length / 4);
            const totalTokens = data.usage?.total_tokens || (promptTokens + completionTokens);

            return {
              content,
              model: data.model || currentModel,
              promptTokens,
              completionTokens,
              totalTokens,
              durationMs
            };
          }

          const errText = await res.text();
          const safeErr = this.apiKey ? errText.replace(new RegExp(this.apiKey, 'g'), '[REDACTED]') : errText;
          lastError = `[${res.status}]: ${safeErr.slice(0, 300)}`;

          // If 504 / 502 / 503, wait briefly and retry or try next model
          if ([502, 503, 504].includes(res.status)) {
            await new Promise(r => setTimeout(r, 1200 * attempt));
            continue;
          } else {
            // Client error (4xx) - don't retry same model
            break;
          }
        } catch (fetchErr: any) {
          lastError = fetchErr.message;
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }

    throw new Error(`Otari Gateway Error: All candidate models timed out or failed. Last error: ${lastError}`);
  }
}
