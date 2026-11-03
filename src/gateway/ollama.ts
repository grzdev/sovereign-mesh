/**
 * SovereignMesh - Local Ollama Gateway Adapter
 * Interacts with the local PC inference runner (defaulting to llama3.2:1b).
 */

export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
}

export class OllamaGateway {
  private baseUrl: string;
  private defaultModel: string;

  constructor(baseUrl: string = 'http://localhost:11434', defaultModel: string = 'llama3.2:1b') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.defaultModel = defaultModel;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(2500)
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`);
      if (!res.ok) return [];
      const data = await res.json() as { models?: Array<{ name: string }> };
      return data.models?.map(m => m.name) || [];
    } catch {
      return [];
    }
  }

  async chat(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    model: string = this.defaultModel
  ): Promise<{ content: string; totalTokens: number; durationMs: number }> {
    const startTime = Date.now();
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Ollama Error [${res.status}]: ${errText}`);
    }

    const data = await res.json() as {
      message?: { content: string };
      prompt_eval_count?: number;
      eval_count?: number;
    };

    const durationMs = Date.now() - startTime;
    const totalTokens = (data.prompt_eval_count || 0) + (data.eval_count || 0);

    return {
      content: data.message?.content || '',
      totalTokens: totalTokens || Math.ceil((data.message?.content?.length || 0) / 4),
      durationMs
    };
  }
}
