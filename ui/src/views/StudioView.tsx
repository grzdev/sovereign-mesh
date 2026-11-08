import React, { useState, useEffect } from 'react';
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
  ChevronDown,
  Code2,
  FileText
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
  telemetry?: any;
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
  const [sampleMenuOpen, setSampleMenuOpen] = useState(false);
  const [activeSampleTitle, setActiveSampleTitle] = useState('Payment Microservice');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSelectSample = (preset: 'vulnerable' | 'docstring' | 'circuitBreaker', title: string) => {
    onLoadPreset(preset);
    setActiveSampleTitle(title);
    setSampleMenuOpen(false);
    setToastMessage(`Loaded: ${title}`);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Automatically switch tabs based on execution lifecycle
  useEffect(() => {
    if (isProcessing) {
      setActiveConsoleTab('events');
    }
  }, [isProcessing]);

  useEffect(() => {
    if (result && !isProcessing) {
      setActiveConsoleTab('solution');
    }
  }, [result, isProcessing]);

  const availableModels = [
    { id: 'alibaba/qwen-3.5-35b-a3b', name: 'Qwen 3.5 35B (Recommended)', provider: 'Otari Cloud' },
    { id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct', provider: 'Otari Cloud' },
    { id: 'deepseek/deepseek-v3', name: 'DeepSeek V3', provider: 'Otari Cloud' },
    { id: 'mistralai/codestral-latest', name: 'Codestral Latest', provider: 'Otari Cloud' },
    { id: 'llama3.2:1b', name: 'Llama 3.2 1B (On-Device)', provider: 'Local Edge ($0)' }
  ];

  // Helper to extract clean code from markdown if present, handling CRLF & unclosed fences
  const extractCode = (content: string) => {
    if (!content) return '';
    const match = content.match(/```(?:javascript|js|typescript|ts|python)?\r?\n([\s\S]*?)(?:```|$)/);
    if (match && match[1].trim().length > 0) {
      return match[1].trim();
    }
    return content;
  };

  const getCleanCodeOrFull = () => {
    if (!result?.finalContent) return '';
    if (showFullExplanation) return result.finalContent;
    const extracted = extractCode(result.finalContent);
    return extracted || result.finalContent;
  };

  const handleCopy = () => {
    const textToCopy = getCleanCodeOrFull();
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const codeLines = code.split('\n');

  return (
    <div className="h-full flex-1 flex flex-col p-3 sm:p-4 gap-3 overflow-y-auto lg:overflow-hidden max-w-[1700px] w-full mx-auto">
      
      {/* 1. TOP TOOLBAR: Compact, Streamlined & In-Sync */}
      <div className="bg-[#0D121B] border border-[#1A2332] rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2.5 shadow-md flex-shrink-0">
        
        {/* Left: Model Selector & Switchable Segmented Control */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Model Gateway Dropdown */}
          <div className="relative">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-[#121926] text-xs text-white font-medium pl-2.5 pr-7 py-1.5 rounded-lg border border-[#222E42] focus:border-[#00C4B4] focus:outline-none appearance-none cursor-pointer shadow-sm"
            >
              {availableModels.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#0E131D] text-slate-200">
                  {m.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Switchable Segmented Control */}
          <div className="flex items-center gap-1 bg-[#06090F] p-1 rounded-xl border border-[#1E2B3E] shadow-inner text-xs">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-500 px-1.5 hidden sm:inline select-none">
              Routing:
            </span>

            {/* Auto Triage */}
            <button
              type="button"
              onClick={() => setPreference('auto')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                preference === 'auto'
                  ? 'bg-gradient-to-r from-[#00C4B4] to-[#009688] text-[#051414] shadow-sm border border-[#00E5D0]'
                  : 'bg-[#0E1420] text-slate-400 hover:text-white border border-[#1C2638]'
              }`}
            >
              <Zap className="w-3 h-3 fill-current" />
              <span>Auto</span>
            </button>

            {/* Local Edge */}
            <button
              type="button"
              onClick={() => setPreference('local')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                preference === 'local'
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-black shadow-sm border border-emerald-400'
                  : 'bg-[#0E1420] text-slate-400 hover:text-white border border-[#1C2638]'
              }`}
            >
              <Cpu className="w-3 h-3" />
              <span>Edge ($0)</span>
            </button>

            {/* Otari Cloud */}
            <button
              type="button"
              onClick={() => setPreference('cloud')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                preference === 'cloud'
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-black shadow-sm border border-cyan-400'
                  : 'bg-[#0E1420] text-slate-400 hover:text-white border border-[#1C2638]'
              }`}
            >
              <Cloud className="w-3 h-3" />
              <span>Otari Cloud</span>
            </button>
          </div>
        </div>

        {/* Right: Load Sample Selector with Dropdown */}
        <div className="relative flex items-center gap-2">
          {toastMessage && (
            <span className="text-[11px] font-medium text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded whitespace-nowrap">
              ✓ {toastMessage}
            </span>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setSampleMenuOpen(!sampleMenuOpen)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-[#14202B] hover:bg-[#1C2C3D] border border-[#00C4B4]/40 hover:border-[#00C4B4] text-[#00E5D0] font-semibold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Select sample code scenario to test Air-Gap Sanitization or Edge Triage"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00C4B4]" />
              <span>Load Sample: <strong className="text-white font-normal">{activeSampleTitle}</strong></span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${sampleMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {sampleMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setSampleMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-72 rounded-xl bg-[#0D121B] border border-[#233146] shadow-2xl p-1.5 z-50 flex flex-col gap-1 text-xs">
                  <div className="px-2 py-1 text-[10px] font-mono uppercase text-slate-500 border-b border-[#182232]">
                    Select Test Scenario
                  </div>

                  {/* Preset 1: Vulnerable Payment Service */}
                  <button
                    type="button"
                    onClick={() => handleSelectSample('vulnerable', 'Payment Microservice')}
                    className={`w-full text-left p-2 rounded-lg transition-colors cursor-pointer flex flex-col gap-0.5 ${
                      activeSampleTitle === 'Payment Microservice'
                        ? 'bg-[#142130] border border-[#00C4B4]/30'
                        : 'hover:bg-[#121926] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-purple-400" />
                        <span>Payment Microservice</span>
                      </span>
                      <span className="text-[10px] font-mono text-purple-300 bg-purple-500/20 px-1.5 py-0.2 rounded">5 Secrets</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Tests Air-Gap RAM quarantine + Otari Cloud synthesis.
                    </p>
                  </button>

                  {/* Preset 2: Local Math Docstring */}
                  <button
                    type="button"
                    onClick={() => handleSelectSample('docstring', 'Local Docstring ($0)')}
                    className={`w-full text-left p-2 rounded-lg transition-colors cursor-pointer flex flex-col gap-0.5 ${
                      activeSampleTitle === 'Local Docstring ($0)'
                        ? 'bg-[#142130] border border-[#00C4B4]/30'
                        : 'hover:bg-[#121926] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <Cpu className="w-3 h-3 text-emerald-400" />
                        <span>Local Docstring ($0)</span>
                      </span>
                      <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-1.5 py-0.2 rounded">Ollama Edge</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Tests $0 fast-path local edge execution (0 network bytes).
                    </p>
                  </button>

                  {/* Preset 3: Circuit Breaker */}
                  <button
                    type="button"
                    onClick={() => handleSelectSample('circuitBreaker', 'Circuit Breaker')}
                    className={`w-full text-left p-2 rounded-lg transition-colors cursor-pointer flex flex-col gap-0.5 ${
                      activeSampleTitle === 'Circuit Breaker'
                        ? 'bg-[#142130] border border-[#00C4B4]/30'
                        : 'hover:bg-[#121926] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <Cloud className="w-3 h-3 text-cyan-400" />
                        <span>Circuit Breaker</span>
                      </span>
                      <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-1.5 py-0.2 rounded">Otari Llama 3.3</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Tests distributed fault-tolerance reasoning on Otari.
                    </p>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* 2. DUAL-PANE WORKSPACE: Responsive Split Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 lg:overflow-hidden">
        
        {/* ======================================================== */}
        {/* LEFT PANE: Prompt & Code Editor (5 cols)                 */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 flex flex-col gap-2.5 min-h-[380px] lg:min-h-0 lg:overflow-hidden">
          
          {/* Prompt Box */}
          <div className="bg-[#0D121B] border border-[#1A2332] rounded-xl p-2.5 flex flex-col gap-1 shadow-md flex-shrink-0">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#00C4B4]" /> Task Instructions
              </label>
              <span className="text-[10px] text-slate-500 font-mono">Air-gapped</span>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
              placeholder="Describe the task (e.g., refactor, optimize, add retry logic)..."
              className="w-full bg-[#080B10] border border-[#1C2638] focus:border-[#00C4B4] rounded-lg p-2 text-xs font-sans text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#00C4B4]/30 transition resize-none leading-relaxed"
            />
          </div>

          {/* IDE-Grade Code Canvas */}
          <div className="flex-1 bg-[#0D121B] border border-[#1A2332] rounded-xl flex flex-col overflow-hidden shadow-md min-h-0">
            
            {/* Editor File Tab Bar */}
            <div className="bg-[#090C12] border-b border-[#1A2332] px-3 py-1.5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#111724] border border-[#1F2B3E] text-xs font-mono text-slate-200">
                  <FileCode className="w-3.5 h-3.5 text-[#00C4B4]" />
                  <span>payment_sync_service.js</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">JS</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">{codeLines.length} lines</span>
            </div>

            {/* Editor Textarea with Gutter */}
            <div className="flex-1 relative flex bg-[#080B10] overflow-hidden min-h-0">
              {/* Line Numbers Gutter */}
              <div className="py-2.5 px-1.5 text-right select-none font-mono text-[11px] text-slate-600 border-r border-[#151D2A] bg-[#07090E] w-9 flex-shrink-0 overflow-hidden">
                {codeLines.slice(0, 50).map((_, i) => (
                  <div key={i} className="leading-relaxed">{i + 1}</div>
                ))}
              </div>

              {/* Code Textarea */}
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste code payload here..."
                className="flex-1 p-2.5 bg-transparent text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none resize-none leading-relaxed overflow-y-auto min-h-0"
                spellCheck={false}
              />
            </div>

            {/* Editor Bottom Bar: Execute Button ALWAYS Visible */}
            <div className="bg-[#090C12] border-t border-[#1A2332] p-2 flex items-center justify-between flex-shrink-0">
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline">Secrets isolated in RAM</span>
                <span className="sm:hidden">RAM-only</span>
              </div>
              <button
                type="button"
                onClick={onRun}
                disabled={isProcessing || !prompt.trim()}
                className="otari-button-primary text-xs font-bold px-3.5 py-1.5 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md"
              >
                {isProcessing ? (
                  <>
                    <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                    <span>Running...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3 fill-current" />
                    <span>Execute Pipeline</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

        {/* ======================================================== */}
        {/* RIGHT PANE: Output Console & Air-Gap Diff (7 cols)       */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 flex flex-col bg-[#0D121B] border border-[#1A2332] rounded-xl overflow-hidden shadow-md min-h-[420px] lg:min-h-0">
          
          {/* Console Tab Bar: Clean, Single-Line, In-Sync, No Wrapping */}
          <div className="bg-[#090C12] border-b border-[#1A2332] px-2.5 py-1.5 flex items-center justify-between gap-2 flex-shrink-0 overflow-x-auto">
            
            {/* Tabs List with whitespace-nowrap */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Tab 1: Solution */}
              <button
                type="button"
                onClick={() => setActiveConsoleTab('solution')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeConsoleTab === 'solution'
                    ? 'bg-[#141C29] text-[#00E5D0] border border-[#233146] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Solution</span>
                {result && (
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono whitespace-nowrap">
                    Ready
                  </span>
                )}
              </button>

              {/* Tab 2: Air-Gap Diff */}
              <button
                type="button"
                onClick={() => setActiveConsoleTab('diff')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeConsoleTab === 'diff'
                    ? 'bg-[#141C29] text-[#00E5D0] border border-[#233146] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>Air-Gap Diff</span>
                {result?.sanitization?.scrubbedCount ? (
                  <span className="px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-mono whitespace-nowrap">
                    {result.sanitization.scrubbedCount}
                  </span>
                ) : null}
              </button>

              {/* Tab 3: Stream */}
              <button
                type="button"
                onClick={() => setActiveConsoleTab('events')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeConsoleTab === 'events'
                    ? 'bg-[#141C29] text-[#00E5D0] border border-[#233146] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-[#00C4B4]" />
                <span>Stream</span>
                {events.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#00C4B4]/20 text-[#00C4B4] text-[10px] font-mono whitespace-nowrap">
                    {events.length}
                  </span>
                )}
              </button>
            </div>

            {/* Actions on the Right: Compact, Never Cut Off */}
            {activeConsoleTab === 'solution' && result && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Mode Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowFullExplanation(!showFullExplanation)}
                  className={`text-[11px] px-2 py-1 rounded transition cursor-pointer font-medium whitespace-nowrap ${
                    showFullExplanation 
                      ? 'bg-[#00C4B4]/20 text-[#00E5D0] border border-[#00C4B4]/40' 
                      : 'bg-[#121824] text-slate-300 border border-[#1E283A] hover:text-white'
                  }`}
                  title={showFullExplanation ? "Switch to Clean Code view" : "Switch to Full Explanation view"}
                >
                  {showFullExplanation ? 'Docs View' : 'Code View'}
                </button>

                {/* Copy Button */}
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#00C4B4]/15 hover:bg-[#00C4B4]/25 text-[#00E5D0] border border-[#00C4B4]/40 flex items-center gap-1 transition cursor-pointer whitespace-nowrap shadow-sm"
                  title="Copy patch to clipboard"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            )}
          </div>

          {/* TAB 1: RESTORED SOLUTION (Always Visible & Never Blank) */}
          {activeConsoleTab === 'solution' && (
            <div className="flex-1 p-3 flex flex-col justify-between overflow-hidden min-h-0">
              {result ? (
                <div className="flex-1 flex flex-col gap-2 min-h-0">
                  <pre className="flex-1 p-3 rounded-xl bg-[#080B10] border border-[#1A2230] text-xs font-mono text-slate-200 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text min-h-0">
                    {getCleanCodeOrFull()}
                  </pre>

                  {/* Summary Footer */}
                  <div className="p-2.5 rounded-xl bg-[#101520] border border-[#1B2434] grid grid-cols-2 md:grid-cols-4 gap-2 text-xs flex-shrink-0">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Tier</span>
                      <strong className="text-white font-medium text-[11px] truncate block">{result.execution.tier}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Model Engine</span>
                      <strong className="text-[#00C4B4] font-medium text-[11px] truncate block">{result.execution.model}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Latency</span>
                      <strong className="text-white font-medium text-[11px]">{result.execution.durationMs}ms</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Cost</span>
                      <strong className="text-emerald-400 font-medium text-[11px]">
                        {result.execution.tier === 'LOCAL_ONLY' ? '$0.00 (Edge)' : '$' + ((result.execution.tokens / 1000) * 0.0004).toFixed(4)}
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2 py-12">
                  <CheckCircle2 className="w-10 h-10 text-[#00C4B4]/20" />
                  <div className="text-center">
                    <p className="text-xs font-medium text-slate-300">Ready to Generate Patch</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Execute the task to receive the fully rehydrated and audited patch.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AIR-GAP REDACTION DIFF */}
          {activeConsoleTab === 'diff' && (
            <div className="flex-1 p-3 flex flex-col gap-2.5 overflow-y-auto min-h-0">
              
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5 flex-shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-300">Zero Bytes of Sensitive Credentials Left Your Device</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    Credentials were automatically detected by the local AST engine and swapped with deterministic in-memory session tokens (<code className="text-[#00E5D0] font-mono">[VAULT_...]</code>) in RAM before touching external networks.
                  </p>
                </div>
              </div>

              {result?.sanitization?.report && result.sanitization.report.length > 0 ? (
                <div className="flex flex-col gap-2.5 min-h-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Quarantined Credentials
                    </span>
                    <span className="text-xs text-purple-400 font-mono">
                      {result.sanitization.report.length} items isolated
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-[#1A2230] rounded-xl bg-[#080B10] flex-shrink-0">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#0F1420] text-slate-400 border-b border-[#1A2230] font-medium text-[11px]">
                        <tr>
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3">Air-Gap Vault Token</th>
                          <th className="py-2 px-3">Masked Value</th>
                          <th className="py-2 px-3">Isolation Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#151D2A] font-mono text-[11px]">
                        {result.sanitization.report.map((item, i) => (
                          <tr key={i} className="hover:bg-[#0F1522] transition">
                            <td className="py-2 px-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-sans text-[11px]">
                                {item.type === 'API_KEY' && <KeyRound className="w-3 h-3" />}
                                {item.type === 'DB_URL' && <Database className="w-3 h-3" />}
                                {item.type === 'PRIVATE_IP' && <Network className="w-3 h-3" />}
                                {item.type === 'EMAIL' && <Mail className="w-3 h-3" />}
                                {item.type}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-[#00E5D0] font-bold">{item.token}</td>
                            <td className="py-2 px-3 text-slate-400">{item.maskedPreview}</td>
                            <td className="py-2 px-3 text-emerald-400 font-sans">✔ Quarantined in RAM</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Scrubbed Payload */}
                  <div className="flex flex-col gap-1 flex-1 min-h-0">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Scrubbed Abstract Logic Dispatched to Cloud
                    </span>
                    <pre className="flex-1 p-2.5 rounded-xl bg-[#080B10] border border-[#1A2230] text-xs font-mono text-slate-300 overflow-y-auto leading-relaxed">
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
            <div className="flex-1 p-3 flex flex-col gap-2 overflow-y-auto min-h-0">
              {events.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2 py-12">
                  <Terminal className="w-10 h-10 text-[#00C4B4]/20" />
                  <p className="text-xs">Pipeline is idle. Execute a task to stream steps live.</p>
                </div>
              ) : (
                events.map((evt, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-[#080B10] border border-[#171F2C] flex flex-col gap-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-[#141C29] text-[#00E5D0] border border-[#233146]">
                        {evt.step}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-200 mt-0.5">{evt.message}</p>
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
