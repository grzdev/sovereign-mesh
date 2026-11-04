import React, { useState } from 'react';
import { 
  Terminal, 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  Cloud, 
  CheckCircle2, 
  Copy, 
  Check, 
  Zap, 
  FileCode, 
  Shield, 
  Lock, 
  KeyRound, 
  Database, 
  Network, 
  Mail,
  Layers,
  ChevronDown,
  Wrench,
  Code2
} from 'lucide-react';

export interface ProcessResponse {
  finalContent: string;
  decision: {
    tier: 'LOCAL_ONLY' | 'OTARI_HYBRID';
    reason: string;
    confidence: number;
    estimatedTokens: number;
    localCost: number;
    estimatedCloudCost: number;
  };
  sanitization: {
    scrubbedCount: number;
    sanitizedPreview: string;
    report: Array<{
      type: string;
      token: string;
      maskedPreview: string;
    }>;
  };
  execution: {
    tier: string;
    model: string;
    durationMs: number;
    tokens: number;
  };
  rehydration: {
    restoredCount: number;
    hallucinatedTokens: string[];
  };
  toolsEquipped: string[];
  telemetry: any;
  events: Array<{
    step: 'TRIAGE' | 'SANITIZATION' | 'EXECUTION' | 'REHYDRATION' | 'COMPLETE' | 'ERROR';
    message: string;
    timestamp: number;
    data?: any;
  }>;
}

interface StudioViewProps {
  prompt: string;
  setPrompt: (p: string) => void;
  code: string;
  setCode: (c: string) => void;
  selectedModel: string;
  setSelectedModel: (m: string) => void;
  preference: 'auto' | 'local' | 'cloud';
  setPreference: (p: 'auto' | 'local' | 'cloud') => void;
  isProcessing: boolean;
  onRun: () => void;
  result: ProcessResponse | null;
  events: any[];
  onLoadPreset: (type: 'vulnerable' | 'docstring' | 'circuitBreaker') => void;
}

export const StudioView: React.FC<StudioViewProps> = ({
  prompt,
  setPrompt,
  code,
  setCode,
  selectedModel,
  setSelectedModel,
  preference,
  setPreference,
  isProcessing,
  onRun,
  result,
  events,
  onLoadPreset
}) => {
  const [activeConsoleTab, setActiveConsoleTab] = useState<'solution' | 'diff' | 'events'>('solution');
  const [copied, setCopied] = useState(false);
  const [showFullExplanation, setShowFullExplanation] = useState(false);

  const availableModels = [
    { id: 'alibaba/qwen-3.5-35b-a3b', name: 'Qwen 3.5 35B (Recommended)', provider: 'Otari Cloud', tier: 'Open-Weight' },
    { id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct', provider: 'Otari Cloud', tier: 'Open-Weight' },
    { id: 'deepseek/deepseek-v3', name: 'DeepSeek V3', provider: 'Otari Cloud', tier: 'Open-Weight' },
    { id: 'mistralai/codestral-latest', name: 'Codestral Latest', provider: 'Otari Cloud', tier: 'Open-Weight' },
    { id: 'llama3.2:1b', name: 'Llama 3.2 1B (On-Device)', provider: 'Local Ollama', tier: 'Local Edge ($0)' }
  ];

  // Helper to extract clean code from markdown if present
  const extractCode = (content: string) => {
    const match = content.match(/```(?:javascript|js|typescript|ts)?\n([\s\S]*?)```/);
    return match ? match[1].trim() : content;
  };

  const handleCopy = () => {
    if (result?.finalContent) {
      const textToCopy = showFullExplanation ? result.finalContent : extractCode(result.finalContent);
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Generate line numbers for editor
  const codeLines = code.split('\n');

  return (
    <div className="flex-1 flex flex-col p-5 gap-4 overflow-y-auto max-w-[1600px] w-full mx-auto">
      
      {/* 1. TOP TOOLBAR: Model Gateway, Tools Bar & Quick Presets */}
      <div className="bg-[#0D121B] border border-[#1A2332] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
        
        {/* Left: Model Selector & Routing Mode */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Model Gateway Dropdown */}
          <div className="relative">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-[#121926] text-xs text-white font-medium pl-3 pr-8 py-2 rounded-lg border border-[#222E42] focus:border-[#00C4B4] focus:outline-none appearance-none cursor-pointer"
            >
              {availableModels.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#0E131D] text-slate-200">
                  {m.name} • {m.provider}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Routing Policy Segmented Control */}
          <div className="flex items-center bg-[#090C12] p-1 rounded-lg border border-[#1A2230] text-xs">
            <button
              type="button"
              onClick={() => setPreference('auto')}
              className={`px-2.5 py-1 rounded-md transition font-medium ${
                preference === 'auto'
                  ? 'bg-[#00C4B4]/15 text-[#00E5D0] border border-[#00C4B4]/40 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚡ Auto Triage
            </button>
            <button
              type="button"
              onClick={() => setPreference('local')}
              className={`px-2.5 py-1 rounded-md transition font-medium ${
                preference === 'local'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🔒 Edge ($0)
            </button>
            <button
              type="button"
              onClick={() => setPreference('cloud')}
              className={`px-2.5 py-1 rounded-md transition font-medium ${
                preference === 'cloud'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ☁️ Otari Cloud
            </button>
          </div>
        </div>

        {/* Middle: Active Tools Given to Open-Weight Models */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#080B10] border border-[#192231]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Wrench className="w-3 h-3 text-[#00C4B4]" /> Tools Equipped:
          </span>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            AirGap Sanitizer
          </span>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
            AST Linter
          </span>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#00C4B4]/10 text-[#00E5D0] border border-[#00C4B4]/20">
            RAM Rehydrator
          </span>
        </div>

        {/* Right: Quick Action Presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 hidden sm:inline">Presets:</span>
          <button
            type="button"
            onClick={() => onLoadPreset('vulnerable')}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-[#14202B] hover:bg-[#1C2C3D] border border-[#00C4B4]/40 hover:border-[#00C4B4] text-[#00E5D0] font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3 h-3 text-[#00C4B4]" />
            <span>Vulnerable Payment Service</span>
          </button>
          <button
            type="button"
            onClick={() => onLoadPreset('docstring')}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-[#111724] hover:bg-[#182133] border border-[#1F2B3E] text-slate-300 transition flex items-center gap-1 cursor-pointer"
          >
            <span>Local Docstring ($0)</span>
          </button>
        </div>

      </div>

      {/* 2. DUAL-PANE WORKSPACE: LEFT EDITOR & RIGHT CONSOLE */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[620px]">
        
        {/* ======================================================== */}
        {/* LEFT PANE: Prompt & Code Editor (5 cols)                 */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Prompt Box */}
          <div className="bg-[#0D121B] border border-[#1A2332] rounded-xl p-4 flex flex-col gap-2 shadow-md">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#00C4B4]" /> Task Instructions
              </label>
              <span className="text-[11px] text-slate-500">Air-gap scrubbed before dispatch</span>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
              placeholder="E.g., Architect an async connection pool and retry policy with exponential backoff..."
              className="w-full bg-[#080B10] border border-[#1C2638] focus:border-[#00C4B4] rounded-lg p-3 text-xs font-sans text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#00C4B4]/30 transition resize-none"
            />
          </div>

          {/* IDE-Grade Code Canvas */}
          <div className="flex-1 bg-[#0D121B] border border-[#1A2332] rounded-xl flex flex-col overflow-hidden shadow-md">
            
            {/* Editor File Tab Bar */}
            <div className="bg-[#090C12] border-b border-[#1A2332] px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#111724] border border-[#1F2B3E] text-xs font-mono text-slate-200">
                  <FileCode className="w-3.5 h-3.5 text-[#00C4B4]" />
                  <span>payment_sync_service.js</span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">JavaScript</span>
              </div>
              <span className="text-xs font-mono text-slate-500">{codeLines.length} lines</span>
            </div>

            {/* Editor Textarea with Gutter */}
            <div className="flex-1 relative flex bg-[#080B10] overflow-hidden">
              {/* Line Numbers Gutter */}
              <div className="py-3 px-2 text-right select-none font-mono text-[11px] text-slate-600 border-r border-[#151D2A] bg-[#07090E] w-10 flex-shrink-0">
                {codeLines.slice(0, 40).map((_, i) => (
                  <div key={i} className="leading-relaxed">{i + 1}</div>
                ))}
                {codeLines.length > 40 && <div className="text-slate-700">...</div>}
              </div>

              {/* Code Textarea */}
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={16}
                placeholder="Paste code payload here..."
                className="flex-1 p-3 bg-transparent text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none resize-none leading-relaxed overflow-y-auto"
                spellCheck={false}
              />
            </div>

            {/* Editor Bottom Bar */}
            <div className="bg-[#090C12] border-t border-[#1A2332] p-3 flex items-center justify-between">
              <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Secrets isolated in RAM</span>
              </div>
              <button
                type="button"
                onClick={onRun}
                disabled={isProcessing || !prompt.trim()}
                className="otari-button-primary text-xs font-bold px-4 py-2 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                    <span>Running Air-Gap Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Execute Pipeline (Ctrl+Enter)</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

        {/* ======================================================== */}
        {/* RIGHT PANE: Output Console & Air-Gap Diff (7 cols)       */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 flex flex-col bg-[#0D121B] border border-[#1A2332] rounded-xl overflow-hidden shadow-md min-h-[550px]">
          
          {/* Console Tabs */}
          <div className="bg-[#090C12] border-b border-[#1A2332] px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveConsoleTab('solution')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  activeConsoleTab === 'solution'
                    ? 'bg-[#141C29] text-[#00E5D0] border border-[#233146] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Restored Solution</span>
                {result && (
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                    Verified
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveConsoleTab('diff')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  activeConsoleTab === 'diff'
                    ? 'bg-[#141C29] text-[#00E5D0] border border-[#233146] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Air-Gap Redaction Diff</span>
                {result?.sanitization?.scrubbedCount ? (
                  <span className="px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-mono">
                    {result.sanitization.scrubbedCount} isolated
                  </span>
                ) : null}
              </button>

              <button
                type="button"
                onClick={() => setActiveConsoleTab('events')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  activeConsoleTab === 'events'
                    ? 'bg-[#141C29] text-[#00E5D0] border border-[#233146] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Live Stream</span>
                {events.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#00C4B4]/20 text-[#00C4B4] text-[10px] font-mono">
                    {events.length}
                  </span>
                )}
              </button>
            </div>

            {/* Solution Header Actions */}
            {activeConsoleTab === 'solution' && result && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFullExplanation(!showFullExplanation)}
                  className="text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-[#121824] border border-[#1E283A] transition"
                >
                  {showFullExplanation ? 'Code Only' : 'Explanation'}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#00C4B4]/15 hover:bg-[#00C4B4]/25 text-[#00E5D0] border border-[#00C4B4]/40 flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Patch'}</span>
                </button>
              </div>
            )}
          </div>

          {/* TAB 1: RESTORED SOLUTION */}
          {activeConsoleTab === 'solution' && (
            <div className="flex-1 p-4 flex flex-col justify-between overflow-y-auto">
              {result ? (
                <div className="flex-1 flex flex-col gap-3">
                  <pre className="flex-1 p-4 rounded-xl bg-[#080B10] border border-[#1A2230] text-xs font-mono text-slate-200 overflow-x-auto max-h-[520px] whitespace-pre-wrap leading-relaxed select-text">
                    {showFullExplanation ? result.finalContent : extractCode(result.finalContent)}
                  </pre>

                  {/* Summary Bar */}
                  <div className="p-3.5 rounded-xl bg-[#101520] border border-[#1B2434] grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Execution Tier</span>
                      <strong className="text-white font-medium">{result.execution.tier}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Model Engine</span>
                      <strong className="text-[#00C4B4] font-medium truncate block">{result.execution.model}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Total Latency</span>
                      <strong className="text-white font-medium">{result.execution.durationMs}ms</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Total Cost</span>
                      <strong className="text-emerald-400 font-medium">
                        {result.execution.tier === 'LOCAL_ONLY' ? '$0.00 (Edge)' : '$' + ((result.execution.tokens / 1000) * 0.0004).toFixed(4)}
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3 py-16">
                  <CheckCircle2 className="w-12 h-12 text-[#00C4B4]/20" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-300">Ready to Generate Patch</p>
                    <p className="text-xs text-slate-500 mt-1">Execute the task to receive the fully rehydrated and audited patch.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AIR-GAP REDACTION DIFF */}
          {activeConsoleTab === 'diff' && (
            <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
              
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-300">Zero Bytes of Sensitive Credentials Left Your Device</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    Credentials were automatically detected by the local AST engine and swapped with deterministic in-memory session tokens (<code className="text-[#00E5D0] font-mono">[VAULT_...]</code>) in RAM before touching external networks.
                  </p>
                </div>
              </div>

              {result?.sanitization?.report && result.sanitization.report.length > 0 ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Quarantined Credentials
                    </span>
                    <span className="text-xs text-purple-400 font-mono">
                      {result.sanitization.report.length} items isolated
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-[#1A2230] rounded-xl bg-[#080B10]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#0F1420] text-slate-400 border-b border-[#1A2230] font-medium text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">Air-Gap Vault Token</th>
                          <th className="py-2.5 px-3">Masked Value</th>
                          <th className="py-2.5 px-3">Isolation Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#151D2A] font-mono text-[11px]">
                        {result.sanitization.report.map((item, i) => (
                          <tr key={i} className="hover:bg-[#0F1522] transition">
                            <td className="py-2.5 px-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-sans text-[11px]">
                                {item.type === 'API_KEY' && <KeyRound className="w-3 h-3" />}
                                {item.type === 'DB_URL' && <Database className="w-3 h-3" />}
                                {item.type === 'PRIVATE_IP' && <Network className="w-3 h-3" />}
                                {item.type === 'EMAIL' && <Mail className="w-3 h-3" />}
                                {item.type}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[#00E5D0] font-bold">{item.token}</td>
                            <td className="py-2.5 px-3 text-slate-400">{item.maskedPreview}</td>
                            <td className="py-2.5 px-3 text-emerald-400 font-sans">✔ Quarantined in RAM</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Scrubbed Payload */}
                  <div className="flex flex-col gap-1.5 mt-2">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Scrubbed Abstract Logic Dispatched to Cloud
                    </span>
                    <pre className="p-3 rounded-xl bg-[#080B10] border border-[#1A2230] text-xs font-mono text-slate-300 overflow-x-auto max-h-[220px]">
                      {result.sanitization.sanitizedPreview}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2 py-12">
                  <ShieldCheck className="w-10 h-10 text-[#00C4B4]/20" />
                  <p className="text-xs">No active diff available yet. Execute a task to inspect.</p>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: LIVE STREAM (EVENTS) */}
          {activeConsoleTab === 'events' && (
            <div className="flex-1 p-4 flex flex-col gap-2.5 overflow-y-auto max-h-[550px]">
              {events.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2 py-12">
                  <Terminal className="w-10 h-10 text-[#00C4B4]/20" />
                  <p className="text-xs">Pipeline is idle. Execute a task to stream steps live.</p>
                </div>
              ) : (
                events.map((evt, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-[#080B10] border border-[#171F2C] flex flex-col gap-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-[#141C29] text-[#00E5D0] border border-[#233146]">
                        {evt.step}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-200 mt-1">{evt.message}</p>
                    {evt.data?.reason && (
                      <p className="text-[11px] text-slate-400 pl-2 border-l border-slate-700 mt-0.5">
                        {evt.data.reason}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
