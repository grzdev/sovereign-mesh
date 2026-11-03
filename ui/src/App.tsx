import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Cpu, 
  Cloud, 
  Terminal, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  Zap, 
  Layers, 
  DollarSign, 
  TrendingUp, 
  Eye, 
  Sparkles,
  ArrowRight,
  Code2,
  FileCode,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  KeyRound,
  Database,
  Network,
  Mail,
  HelpCircle
} from 'lucide-react';

interface TelemetryStats {
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

interface ProcessEvent {
  step: 'TRIAGE' | 'SANITIZATION' | 'EXECUTION' | 'REHYDRATION' | 'COMPLETE' | 'ERROR';
  message: string;
  timestamp: number;
  data?: any;
}

interface ProcessResponse {
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
  telemetry: TelemetryStats;
  events: ProcessEvent[];
}

const SAMPLE_VULNERABLE_CODE = `/**
 * Enterprise Payment & User Sync Service
 * ⚠️ CONTAINS PROPRIETARY SECRETS TO VERIFY AIR-GAP SANITIZATION
 */

const AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE";
const STRIPE_SECRET_KEY = "sk-live-51NzExampleKey998877665544332211";
const MONGO_URI = "mongodb+srv://db_admin:P@ssw0rd999Vault@cluster0.internal.company.com/production";
const INTERNAL_BILLING_GATEWAY = "10.14.2.19";
const ADMIN_CONTACT = "security-lead@fintech-enterprise.internal";

class PaymentSyncService {
  constructor() {
    this.connectionString = MONGO_URI;
    this.apiKey = STRIPE_SECRET_KEY;
    this.gatewayIp = INTERNAL_BILLING_GATEWAY;
  }

  // BUGGY BLOCKING IMPLEMENTATION: Synchronous loop that hangs on large batches
  syncBatchTransactions(transactions) {
    let results = [];
    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      // Simulated heavy unoptimized synchronous processing
      results.push({ id: tx.id, status: 'processed', syncedTo: this.gatewayIp });
    }
    return results;
  }
}

module.exports = { PaymentSyncService };`;

const SAMPLE_LOCAL_CODE = `// Fast-path task: Add clean JSDoc comments and TypeScript types
function calculateTokenSavings(tokensProcessed, ratePer1k) {
  if (!tokensProcessed || tokensProcessed <= 0) return 0;
  return (tokensProcessed / 1000) * ratePer1k;
}

module.exports = { calculateTokenSavings };`;

export default function App() {
  const [prompt, setPrompt] = useState('Architect an asynchronous connection pool and retry policy with exponential backoff');
  const [code, setCode] = useState(SAMPLE_VULNERABLE_CODE);
  const [preference, setPreference] = useState<'auto' | 'local' | 'cloud'>('auto');
  const [activeTab, setActiveTab] = useState<'diff' | 'pipeline' | 'solution'>('diff');
  const [isProcessing, setIsProcessing] = useState(false);
  const [events, setEvents] = useState<ProcessEvent[]>([]);
  const [result, setResult] = useState<ProcessResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);
  
  const [telemetry, setTelemetry] = useState<TelemetryStats>({
    totalRequests: 0,
    localRequests: 0,
    cloudRequests: 0,
    localTokensProcessed: 0,
    cloudTokensConsumed: 0,
    dollarsSaved: 0,
    dollarsSpent: 0,
    budgetRemainingUSD: 2.0,
    zeroLeakRedactionsCount: 0
  });

  // Load initial telemetry & connect WebSocket
  useEffect(() => {
    fetch('/api/mesh/telemetry')
      .then(res => res.json())
      .then(data => setTelemetry(data))
      .catch(() => {});

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/telemetry`);

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'PROCESS_EVENT') {
          setEvents(prev => [...prev, msg.event]);
        } else if (msg.type === 'TASK_COMPLETE' || msg.type === 'INIT_STATS') {
          setTelemetry(msg.telemetry);
        }
      } catch {}
    };

    return () => ws.close();
  }, []);

  const handleRun = async () => {
    if (!prompt.trim()) return;
    setIsProcessing(true);
    setEvents([]);
    setActiveTab('pipeline');

    try {
      const res = await fetch('/api/mesh/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          codePayload: code,
          preference
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Request failed');
      }

      const data: ProcessResponse = await res.json();
      setResult(data);
      setTelemetry(data.telemetry);
      setActiveTab('solution');
    } catch (err: any) {
      alert(`Execution Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to extract clean code from markdown if present
  const extractCode = (content: string) => {
    const match = content.match(/```(?:javascript|js|typescript|ts)?\n([\s\S]*?)```/);
    return match ? match[1].trim() : content;
  };

  const handleCopy = () => {
    if (result?.finalContent) {
      const toCopy = showRawMarkdown ? result.finalContent : extractCode(result.finalContent);
      navigator.clipboard.writeText(toCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const budgetPercentUsed = Math.min(100, Math.max(0, (telemetry.dollarsSpent / 2.0) * 100));

  return (
    <div className="min-h-screen bg-[#08090A] text-slate-100 flex flex-col font-sans selection:bg-[#00C4B4] selection:text-black">
      
      {/* ======================================================== */}
      {/* 1. TOP HEADER (Mozilla & Otari Official Aesthetic)        */}
      {/* ======================================================== */}
      <header className="border-b border-[#1A222E] bg-[#0B0E13]/90 backdrop-blur-md px-6 py-3.5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & Product Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00C4B4] to-[#005B63] p-[1.5px] shadow-lg shadow-[#00C4B4]/15 flex items-center justify-center">
              <div className="w-full h-full bg-[#08090A] rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#00C4B4]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-bold text-lg text-white tracking-tight">SovereignMesh</h1>
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#00C4B4]/10 text-[#00C4B4] border border-[#00C4B4]/30">
                  Mozilla Otari Hackathon
                </span>
              </div>
              <p className="text-xs text-slate-400">Zero-Leak Hybrid Gateway • Edge Triage & Hosted Muscle</p>
            </div>
          </div>

          {/* Dual-Engine Connectivity Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Local Node */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111622] border border-[#1E2738] text-xs shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Local Edge:</span>
              <span className="font-mono text-emerald-300 font-medium">llama3.2:1b</span>
            </div>

            {/* Cloud Gateway */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111622] border border-[#1E2738] text-xs shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#00C4B4] animate-pulse"></span>
              <Cloud className="w-3.5 h-3.5 text-[#00C4B4]" />
              <span className="text-slate-400">Cloud Gateway:</span>
              <span className="font-mono text-[#00C4B4] font-medium">Otari (Qwen-35B)</span>
            </div>

            {/* Air-Gap Verification Shield */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Air-Gap Active</span>
            </div>
          </div>

        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. REAL-TIME GOVERNOR TELEMETRY BAR                      */}
      {/* ======================================================== */}
      <section className="bg-[#0B0E14] border-b border-[#18202D] px-6 py-3.5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-3.5">
          
          {/* Card 1: Total Tasks */}
          <div className="bg-[#10141D] border border-[#1A2332] rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Total Requests</div>
              <div className="text-lg font-bold text-white tracking-tight">{telemetry.totalRequests}</div>
            </div>
          </div>

          {/* Card 2: Edge Savings */}
          <div className="bg-[#10141D] border border-[#1A2332] rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Saved by Local Edge</div>
              <div className="text-lg font-bold text-emerald-400 tracking-tight">${telemetry.dollarsSaved.toFixed(4)}</div>
            </div>
          </div>

          {/* Card 3: Isolated Secrets */}
          <div className="bg-[#10141D] border border-[#1A2332] rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Secrets Isolated</div>
              <div className="text-lg font-bold text-purple-300 tracking-tight">{telemetry.zeroLeakRedactionsCount} items</div>
            </div>
          </div>

          {/* Card 4: Otari Spent */}
          <div className="bg-[#10141D] border border-[#1A2332] rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#00C4B4]/10 border border-[#00C4B4]/20 flex items-center justify-center text-[#00C4B4] flex-shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Otari Cloud Spend</div>
              <div className="text-lg font-bold text-[#00C4B4] tracking-tight">${telemetry.dollarsSpent.toFixed(4)}</div>
            </div>
          </div>

          {/* Card 5: Budget Cap */}
          <div className="bg-[#10141D] border border-[#1A2332] rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Otari Budget Cap</span>
              <span className="text-xs font-mono font-semibold text-slate-300">${telemetry.budgetRemainingUSD.toFixed(2)} left</span>
            </div>
            <div className="w-full bg-[#1A2230] h-2 rounded-full overflow-hidden mt-1.5">
              <div 
                className="bg-gradient-to-r from-[#00C4B4] to-[#00E5D0] h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.max(4, budgetPercentUsed)}%` }}
              ></div>
            </div>
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. MAIN WORKSPACE                                         */}
      {/* ======================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: TASK CREATOR & PAYLOAD (5 COLS) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-[#0E1218] border border-[#1E2736] rounded-xl p-5 flex flex-col gap-4 shadow-xl">
            
            {/* Header with Prominent Sample Code Buttons */}
            <div className="flex flex-col gap-2.5 pb-3 border-b border-[#18202E]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Terminal className="w-4 h-4 text-[#00C4B4]" /> Task Instructions
                </span>
                
                {/* PROMINENT SAMPLE CODE ACTION BUTTON */}
                <button
                  type="button"
                  onClick={() => {
                    setPrompt('Architect an asynchronous connection pool and retry policy with exponential backoff');
                    setCode(SAMPLE_VULNERABLE_CODE);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14202B] hover:bg-[#1A2A3A] border border-[#00C4B4]/40 hover:border-[#00C4B4] text-[#00E5D0] text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#00C4B4]" />
                  <span>Load Sample Code</span>
                </button>
              </div>

              {/* Quick Template Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-500 font-medium">Quick Presets:</span>
                <button
                  type="button"
                  onClick={() => {
                    setPrompt('Architect an asynchronous connection pool and retry policy with exponential backoff');
                    setCode(SAMPLE_VULNERABLE_CODE);
                    setPreference('cloud');
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-[#131924] hover:bg-[#1A2230] border border-[#1E2738] text-slate-300 transition"
                >
                  🛡️ Cloud Refactor (Otari)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPrompt('Add detailed JSDoc documentation and TypeScript parameter annotations to this function');
                    setCode(SAMPLE_LOCAL_CODE);
                    setPreference('local');
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-[#131924] hover:bg-[#1A2230] border border-[#1E2738] text-slate-300 transition"
                >
                  ⚡ Fast Docstring (Edge)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPrompt('');
                    setCode('');
                  }}
                  className="text-[11px] px-2 py-1 rounded-md bg-transparent hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition"
                  title="Clear inputs"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Prompt Textarea */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">Prompt / Task Objective</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what to do (e.g., refactor, optimize, add retry logic, audit security)..."
                rows={3}
                className="w-full bg-[#080B10] border border-[#1E2738] focus:border-[#00C4B4] rounded-lg p-3 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#00C4B4]/40 transition text-slate-200 placeholder-slate-500"
              />
            </div>

            {/* Code Payload Textarea */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">Attached Source Code</label>
                <span className="text-xs font-mono text-slate-400">{code.split('\n').length} lines</span>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste sensitive code here. Real keys and URIs are isolated locally in RAM."
                rows={11}
                className="w-full bg-[#080B10] border border-[#1E2738] focus:border-[#00C4B4] rounded-lg p-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#00C4B4]/40 transition text-slate-300 leading-relaxed"
              />
            </div>

            {/* Routing Policy Segmented Toggle */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[#18202E]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Execution Routing Policy</span>
                <span className="text-[11px] text-slate-400">
                  {preference === 'auto' && 'Smart complexity triage'}
                  {preference === 'local' && '100% on-device ($0.00)'}
                  {preference === 'cloud' && 'Otari open-weight cloud'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-[#090C12] p-1.5 rounded-xl border border-[#1A2230]">
                <button
                  type="button"
                  onClick={() => setPreference('auto')}
                  className={`py-2 px-2.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                    preference === 'auto'
                      ? 'bg-[#00C4B4]/15 border border-[#00C4B4]/50 text-[#00E5D0] shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> Auto Triage
                </button>

                <button
                  type="button"
                  onClick={() => setPreference('local')}
                  className={`py-2 px-2.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                    preference === 'local'
                      ? 'bg-emerald-500/15 border border-emerald-500/50 text-emerald-300 shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" /> Local Edge ($0)
                </button>

                <button
                  type="button"
                  onClick={() => setPreference('cloud')}
                  className={`py-2 px-2.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                    preference === 'cloud'
                      ? 'bg-cyan-500/15 border border-cyan-500/50 text-cyan-300 shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Cloud className="w-3.5 h-3.5" /> Otari Cloud
                </button>
              </div>
            </div>

            {/* Execute Button */}
            <button
              type="button"
              onClick={handleRun}
              disabled={isProcessing || !prompt.trim()}
              className="otari-button-primary w-full py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                  <span>Executing Air-Gap Pipeline...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Execute via SovereignMesh</span>
                </>
              )}
            </button>

          </div>
        </div>

        {/* RIGHT COLUMN: INSPECTOR & RESULTS (7 COLS) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Segmented Tab Bar */}
          <div className="flex items-center gap-2 bg-[#0E1218] p-1.5 rounded-xl border border-[#1E2736]">
            
            {/* Tab 1: Air-Gap Diff */}
            <button
              type="button"
              onClick={() => setActiveTab('diff')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'diff'
                  ? 'bg-[#151D29] text-[#00E5D0] border border-[#233145] shadow-sm'
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

            {/* Tab 2: Live Pipeline */}
            <button
              type="button"
              onClick={() => setActiveTab('pipeline')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'pipeline'
                  ? 'bg-[#151D29] text-[#00E5D0] border border-[#233145] shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Live Trajectory</span>
              {events.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#00C4B4]/20 text-[#00C4B4] text-[10px] font-mono">
                  {events.length} steps
                </span>
              )}
            </button>

            {/* Tab 3: Solution */}
            <button
              type="button"
              onClick={() => setActiveTab('solution')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'solution'
                  ? 'bg-[#151D29] text-[#00E5D0] border border-[#233145] shadow-sm'
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

          </div>

          {/* TAB 1: AIR-GAP REDACTION DIFF */}
          {activeTab === 'diff' && (
            <div className="bg-[#0E1218] border border-[#1E2736] rounded-xl p-5 flex flex-col gap-4 min-h-[500px]">
              
              {/* Air-Gap Guarantee Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/25 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-emerald-300">Zero Bytes of Sensitive Credentials Left This Device</h4>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    All API keys, database connection strings, private IPs, and corporate emails were intercepted and converted into deterministic session tokens (<code className="text-[#00E5D0] font-mono">[VAULT_...]</code>) in local RAM before dispatching to the cloud.
                  </p>
                </div>
              </div>

              {/* Table of Isolated Secrets */}
              {result?.sanitization?.report && result.sanitization.report.length > 0 ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      RAM Vault: Isolated Credentials
                    </span>
                    <span className="text-xs text-purple-400 font-mono">
                      {result.sanitization.report.length} items protected
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-[#1E2738] rounded-xl bg-[#090C12]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#101520] text-slate-400 border-b border-[#1E2738] font-medium">
                        <tr>
                          <th className="py-2.5 px-3.5">Category</th>
                          <th className="py-2.5 px-3.5">Air-Gap Vault Token</th>
                          <th className="py-2.5 px-3.5">Masked Preview</th>
                          <th className="py-2.5 px-3.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#151D29] font-mono text-[11px]">
                        {result.sanitization.report.map((item, i) => (
                          <tr key={i} className="hover:bg-[#111722] transition">
                            <td className="py-2.5 px-3.5">
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 font-sans font-medium text-[11px]">
                                {item.type === 'API_KEY' && <KeyRound className="w-3 h-3" />}
                                {item.type === 'DB_URL' && <Database className="w-3 h-3" />}
                                {item.type === 'PRIVATE_IP' && <Network className="w-3 h-3" />}
                                {item.type === 'EMAIL' && <Mail className="w-3 h-3" />}
                                {item.type}
                              </span>
                            </td>
                            <td className="py-2.5 px-3.5 text-[#00E5D0] font-bold">{item.token}</td>
                            <td className="py-2.5 px-3.5 text-slate-400">{item.maskedPreview}</td>
                            <td className="py-2.5 px-3.5 text-emerald-400 font-sans font-medium">
                              ✔ Isolated in RAM
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Sanitized Cloud Payload Preview */}
                  <div className="flex flex-col gap-1.5 mt-2">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Scrubbed Abstract Logic Payload Dispatched to Otari
                    </span>
                    <pre className="p-3.5 rounded-xl bg-[#080B10] border border-[#1A2230] text-xs font-mono text-slate-300 overflow-x-auto max-h-[220px] leading-relaxed">
                      {result.sanitization.sanitizedPreview}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3 py-12">
                  <ShieldCheck className="w-12 h-12 text-[#00C4B4]/20" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-300">Ready to Audit & Scrub</p>
                    <p className="text-xs text-slate-500 mt-1">Execute a task to inspect detected secrets and the air-gapped payload.</p>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: LIVE TRAJECTORY (PIPELINE STREAM) */}
          {activeTab === 'pipeline' && (
            <div className="bg-[#0E1218] border border-[#1E2736] rounded-xl p-5 flex flex-col gap-3 min-h-[500px]">
              
              <div className="flex items-center justify-between pb-3 border-b border-[#18202E]">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Real-Time Execution Steps
                </span>
                {result && (
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    Cycle finished in {result.execution.durationMs}ms
                  </span>
                )}
              </div>

              {events.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3 py-12">
                  <Terminal className="w-12 h-12 text-[#00C4B4]/20" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-300">Pipeline Idle</p>
                    <p className="text-xs text-slate-500 mt-1">Submit your task to observe live triage, sanitization, and execution.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[520px] pr-1">
                  {events.map((evt, idx) => {
                    const stepStyles: Record<string, { bg: string; text: string; border: string }> = {
                      TRIAGE: { bg: 'bg-amber-500/10', text: 'text-amber-300', border: 'border-amber-500/20' },
                      SANITIZATION: { bg: 'bg-purple-500/10', text: 'text-purple-300', border: 'border-purple-500/20' },
                      EXECUTION: { bg: 'bg-[#00C4B4]/10', text: 'text-[#00E5D0]', border: 'border-[#00C4B4]/20' },
                      REHYDRATION: { bg: 'bg-blue-500/10', text: 'text-blue-300', border: 'border-blue-500/20' },
                      COMPLETE: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', border: 'border-emerald-500/20' },
                      ERROR: { bg: 'bg-red-500/10', text: 'text-red-300', border: 'border-red-500/20' },
                    };
                    const style = stepStyles[evt.step] || { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700' };

                    return (
                      <div key={idx} className="p-3.5 rounded-xl bg-[#080B10] border border-[#18202D] flex flex-col gap-1.5 transition">
                        <div className="flex items-center justify-between">
                          <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${style.bg} ${style.text} ${style.border}`}>
                            {evt.step}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            {new Date(evt.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-200 mt-0.5">{evt.message}</p>
                        {evt.data?.reason && (
                          <div className="text-[11px] text-slate-400 pl-2.5 border-l-2 border-slate-700 mt-0.5">
                            {evt.data.reason}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* TAB 3: RESTORED SOLUTION */}
          {activeTab === 'solution' && (
            <div className="bg-[#0E1218] border border-[#1E2736] rounded-xl p-5 flex flex-col gap-3 min-h-[500px]">
              
              <div className="flex items-center justify-between pb-3 border-b border-[#18202E]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Rehydrated Code Solution
                  </span>
                  {result && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                      {result.rehydration.restoredCount} secrets safely restored
                    </span>
                  )}
                </div>

                {result && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRawMarkdown(!showRawMarkdown)}
                      className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-[#131924] border border-[#1E2738] transition cursor-pointer"
                    >
                      {showRawMarkdown ? 'Show Clean Code' : 'Show Explanation'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00C4B4]/15 hover:bg-[#00C4B4]/25 text-[#00E5D0] border border-[#00C4B4]/40 text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                    </button>
                  </div>
                )}
              </div>

              {result ? (
                <div className="flex-1 flex flex-col gap-3">
                  <pre className="flex-1 p-4 rounded-xl bg-[#080B10] border border-[#1A2230] text-xs font-mono text-slate-200 overflow-x-auto max-h-[500px] whitespace-pre-wrap leading-relaxed select-text">
                    {showRawMarkdown ? result.finalContent : extractCode(result.finalContent)}
                  </pre>

                  {/* Execution Summary Footer */}
                  <div className="p-3.5 rounded-xl bg-[#10141D] border border-[#1A2332] grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block">Tier</span>
                      <strong className="text-white font-medium">{result.execution.tier}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Model</span>
                      <strong className="text-[#00C4B4] font-medium truncate block">{result.execution.model}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Latency</span>
                      <strong className="text-white font-medium">{result.execution.durationMs}ms</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Cost</span>
                      <strong className="text-emerald-400 font-medium">
                        {result.execution.tier === 'LOCAL_ONLY' ? '$0.00 (Edge)' : '$' + ((result.execution.tokens / 1000) * 0.0004).toFixed(4)}
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3 py-12">
                  <CheckCircle2 className="w-12 h-12 text-[#00C4B4]/20" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-300">No Active Solution</p>
                    <p className="text-xs text-slate-500 mt-1">Execute a task to receive the fully rehydrated and audited patch.</p>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </main>

      {/* ======================================================== */}
      {/* 4. FOOTER                                                 */}
      {/* ======================================================== */}
      <footer className="border-t border-[#161F2C] bg-[#0A0D13] py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SovereignMesh • Built for Mozilla Otari Hackathon ("Developers Wilding: Online")</span>
          <span className="text-slate-400 font-medium">Mozilla.ai • "Owners, Not Renters"</span>
        </div>
      </footer>

    </div>
  );
}
