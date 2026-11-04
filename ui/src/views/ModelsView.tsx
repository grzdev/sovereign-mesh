import React from 'react';
import { 
  Layers, 
  Cpu, 
  Cloud, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  Zap, 
  Terminal,
  ShieldCheck
} from 'lucide-react';

interface ModelsViewProps {
  onSelectModel: (modelId: string) => void;
}

export const ModelsView: React.FC<ModelsViewProps> = ({ onSelectModel }) => {
  const modelCatalog = [
    {
      id: 'alibaba/qwen-3.5-35b-a3b',
      name: 'Qwen 3.5 35B (a3b)',
      provider: 'Mozilla Otari',
      type: 'Open-Weight Cloud',
      context: '128K',
      cost: '$0.0004 / 1K',
      badge: 'Recommended',
      description: 'State-of-the-art open-weight model delivering frontier-level code synthesis, refactoring, and distributed architecture reasoning.'
    },
    {
      id: 'llama3.2:1b',
      name: 'Llama 3.2 1B',
      provider: 'Local Ollama',
      type: 'Local Edge ($0.00)',
      context: '8K',
      cost: '$0.0000 / 1K',
      badge: 'Zero-Cost Edge',
      description: 'Ultra-lightweight on-device runner on your PC. Instant zero-latency triage for docstrings, syntax checks, and offline linting.'
    },
    {
      id: 'meta/llama-3.3-70b-instruct',
      name: 'Llama 3.3 70B Instruct',
      provider: 'Mozilla Otari',
      type: 'Open-Weight Cloud',
      context: '128K',
      cost: '$0.0006 / 1K',
      badge: 'Heavy Reasoning',
      description: 'Flagship Meta open-weight model for multi-file architectural planning, full-stack migrations, and complex logic verification.'
    },
    {
      id: 'deepseek/deepseek-v3',
      name: 'DeepSeek V3',
      provider: 'Mozilla Otari',
      type: 'Open-Weight Cloud',
      context: '64K',
      cost: '$0.0003 / 1K',
      badge: 'High Efficiency',
      description: 'High-throughput reasoning engine optimized for code execution, algorithmic problem solving, and complex system refactoring.'
    },
    {
      id: 'mistralai/codestral-latest',
      name: 'Codestral Latest',
      provider: 'Mozilla Otari',
      type: 'Open-Weight Cloud',
      context: '32K',
      cost: '$0.0005 / 1K',
      badge: 'Specialized Code',
      description: 'Mistral AI’s purpose-built coding assistant trained on 80+ programming languages for precision code completion and debugging.'
    },
    {
      id: 'google/gemma-3-27b-it',
      name: 'Gemma 3 27B IT',
      provider: 'Mozilla Otari',
      type: 'Open-Weight Cloud',
      context: '32K',
      cost: '$0.0004 / 1K',
      badge: 'Google Open Weights',
      description: 'Google’s latest open-weight conversational model engineered for deep technical analysis, code audits, and concise explanations.'
    }
  ];

  return (
    <div className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto max-w-[1600px] w-full mx-auto">
      
      {/* 1. VIEW HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-[#18202D]">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#00C4B4]" />
            <span>Open-Weight Model Gateway Registry</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Switch effortlessly between on-device edge models and Mozilla Otari's catalog of 150+ hosted open-weights without vendor lock-in.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Connected Gateway:</span>
          <span className="font-mono font-semibold px-2.5 py-1 rounded bg-[#131A26] border border-[#202B3E] text-[#00C4B4]">
            https://otari.ai/api/v1
          </span>
        </div>
      </div>

      {/* 2. MODEL CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modelCatalog.map((model) => (
          <div
            key={model.id}
            className="bg-[#0D121B] border border-[#1A2332] hover:border-[#27374E] rounded-xl p-5 flex flex-col justify-between gap-4 transition shadow-md"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white">{model.name}</h3>
                  <span className="text-[11px] font-mono text-slate-400 block mt-0.5">{model.id}</span>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#131A26] border border-[#222E42] text-[#00E5D0]">
                  {model.badge}
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                {model.description}
              </p>
            </div>

            <div className="pt-3 border-t border-[#171F2D] flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">Provider</span>
                  <span className="text-slate-200 font-medium">{model.provider}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Context</span>
                  <span className="text-slate-200 font-medium">{model.context}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Cost</span>
                  <span className="text-emerald-400 font-medium">{model.cost}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectModel(model.id)}
                className="w-full py-2 px-3 rounded-lg bg-[#141C29] hover:bg-[#1E2A3D] border border-[#233146] text-xs font-semibold text-[#00E5D0] flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Select for Studio</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 3. "OWNERS, NOT RENTERS" FOOTER NOTE */}
      <div className="p-4 rounded-xl bg-[#0A0D14] border border-[#171F2D] flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#00C4B4]" />
          <span>Need more models? Otari supports over 150 open-weight and frontier models out of the box.</span>
        </div>
        <a
          href="https://otari.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00C4B4] hover:underline flex items-center gap-1 font-medium"
        >
          <span>Otari Documentation</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

    </div>
  );
};
