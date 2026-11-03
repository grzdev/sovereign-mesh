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
  EyeOff, 
  Sparkles,
  ArrowRight
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

const SAMPLE_DEMO_CODE = `/**
 * Sample Enterprise Payment & User Sync Service
 * ⚠️ CONTAINS SENSITIVE SECRETS FOR TESTING AIR-GAP SANITIZATION
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

  // BUGGY & BLOCKING IMPLEMENTATION: Needs refactoring to asynchronous connection pooling
  syncBatchTransactions(transactions) {
    let results = [];
    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      results.push({ id: tx.id, status: 'processed', syncedTo: this.gatewayIp });
    }
    return results;
  }
}

module.exports = { PaymentSyncService };`;

export default function App() {
  const [prompt, setPrompt] = useState('Architect an asynchronous connection pool and retry policy with exponential backoff');
  const [code, setCode] = useState(SAMPLE_DEMO_CODE);
  const [preference, setPreference] = useState<'auto' | 'local' | 'cloud'>('auto');
  const [activeTab, setActiveTab] = useState<'pipeline' | 'diff' | 'output'>('pipeline');
  const [isProcessing, setIsProcessing] = useState(false);
  const [events, setEvents] = useState<ProcessEvent[]>([]);
  const [result, setResult] = useState<ProcessResponse | null>(null);
  const [copied, setCopied] = useState(false);
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

  // Fetch initial telemetry
  useEffect(() => {
    fetch('/api/mesh/telemetry')
      .then(res => res.json())
      .then(data => setTelemetry(data))
      .catch(() => {});

    // Connect WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/telemetry`);

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'PROCESS_EVENT') {
          setEvents(prev => [...prev, msg.event]);
        } else if (msg.type === 'TASK_COMPLETE') {
          setTelemetry(msg.telemetry);
        } else if (msg.type === 'INIT_STATS') {
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
      setActiveTab('output');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (result?.finalContent) {
      navigator.clipboard.writeText(result.finalContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans">
      {/* Top Cyber Navigation Bar */}
      <header className="border-b border-[#161f30] bg-[#0c101a]/80 backdrop-blur px-6 py-3.5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00ffcc] to-[#0077ff] p-0.5 flex items-center justify-center shadow-lg shadow-[#00ffcc]/10">
            <div className="w-full h-full bg-[#0c101a] rounded-[10px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#00ffcc]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                SovereignMesh
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#00ffcc]/10 text-[#00ffcc] border border-[#00ffcc]/30 font-semibold tracking-wider">
                Mozilla Otari Edition
              </span>
            </div>
            <p className="text-xs text-slate-400">Zero-Leak Hybrid Gateway • Edge Triage & Hosted Muscle</p>
          </div>
        </div>

        {/* Node Connectivity Badges */}
        <div className="flex items-center gap-3">
          {/* Local Node */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121927] border border-[#1f2c42] text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300 font-medium">Local Edge:</span>
            <span className="font-mono text-emerald-300 font-semibold">llama3.2:1b</span>
          </div>

          {/* Cloud Gateway */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121927] border border-[#1f2c42] text-xs">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <Cloud className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-300 font-medium">Cloud Gateway:</span>
            <span className="font-mono text-cyan-300 font-semibold">Otari (Qwen-35B)</span>
          </div>

          {/* Air-Gap Verification Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>Air-Gap Active</span>
          </div>
        </div>
      </header>

      {/* Real-Time Telemetry Bar */}
      <section className="bg-[#0e1320] border-b border-[#161f30] px-6 py-3">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] uppercase font-mono text-slate-400 tracking-wider">Total Requests</div>
              <div className="text-base font-bold text-white font-mono">{telemetry.totalRequests}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] uppercase font-mono text-slate-400 tracking-wider">Saved by Edge ($0)</div>
              <div className="text-base font-bold text-emerald-400 font-mono">${telemetry.dollarsSaved.toFixed(4)}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] uppercase font-mono text-slate-400 tracking-wider">Secrets Isolated</div>
              <div className="text-base font-bold text-purple-300 font-mono">{telemetry.zeroLeakRedactionsCount}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] uppercase font-mono text-slate-400 tracking-wider">Otari Spent</div>
              <div className="text-base font-bold text-cyan-300 font-mono">${telemetry.dollarsSpent.toFixed(4)}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] uppercase font-mono text-slate-400 tracking-wider">Otari Budget Cap</div>
              <div className="text-base font-bold text-amber-300 font-mono">${telemetry.budgetRemainingUSD.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Workspace Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Panel (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-[#0e1320] border border-[#1a2436] rounded-xl p-5 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#00ffcc]" /> Task Instructions
              </span>
              <button
                type="button"
                onClick={() => {
                  setPrompt('Architect an asynchronous connection pool and retry policy with exponential backoff');
                  setCode(SAMPLE_DEMO_CODE);
                }}
                className="text-xs font-mono text-[#00ffcc] hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" /> Load Sample Code
              </button>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., Refactor this service to use connection pooling and exponential backoff..."
              rows={3}
              className="w-full bg-[#080b12] border border-[#1f2b40] rounded-lg p-3 text-sm font-sans focus:outline-none focus:border-[#00ffcc] transition"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Attached Code / Payload</span>
              <span className="text-[11px] font-mono text-slate-500">{code.split('\n').length} lines</span>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste code or file content here..."
              rows={12}
              className="w-full bg-[#080b12] border border-[#1f2b40] rounded-lg p-3 text-xs font-mono focus:outline-none focus:border-[#00ffcc] transition text-slate-300"
            />

            {/* Execution Mode Controls */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[#1a2436]">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Routing Policy</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPreference('auto')}
                  className={`py-2 px-3 rounded-lg text-xs font-mono transition border ${
                    preference === 'auto'
                      ? 'bg-[#00ffcc]/10 border-[#00ffcc] text-[#00ffcc] font-semibold'
                      : 'bg-[#121826] border-[#1f2b40] text-slate-400 hover:border-slate-600'
                  }`}
                >
                  ⚡ Auto Triage
                </button>
                <button
                  type="button"
                  onClick={() => setPreference('local')}
                  className={`py-2 px-3 rounded-lg text-xs font-mono transition border ${
                    preference === 'local'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-semibold'
                      : 'bg-[#121826] border-[#1f2b40] text-slate-400 hover:border-slate-600'
                  }`}
                >
                  🔒 Force Edge ($0)
                </button>
                <button
                  type="button"
                  onClick={() => setPreference('cloud')}
                  className={`py-2 px-3 rounded-lg text-xs font-mono transition border ${
                    preference === 'cloud'
                      ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 font-semibold'
                      : 'bg-[#121826] border-[#1f2b40] text-slate-400 hover:border-slate-600'
                  }`}
                >
                  ☁️ Force Otari
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRun}
              disabled={isProcessing || !prompt.trim()}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#00ffcc] to-[#0099ff] hover:opacity-90 disabled:opacity-50 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#00ffcc]/20 transition transform active:scale-[0.99]"
            >
              {isProcessing ? (
                <>
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                  Air-Gap Pipeline Running...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" /> Execute via SovereignMesh
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Telemetry, Diff & Solution (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-[#1a2436] pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('pipeline')}
              className={`px-4 py-2 rounded-lg text-xs font-mono transition flex items-center gap-2 ${
                activeTab === 'pipeline'
                  ? 'bg-[#141b2b] text-[#00ffcc] font-semibold border border-[#222f47]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" /> Pipeline Live Stream
              {events.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#00ffcc]/20 text-[#00ffcc] text-[10px]">
                  {events.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('diff')}
              className={`px-4 py-2 rounded-lg text-xs font-mono transition flex items-center gap-2 ${
                activeTab === 'diff'
                  ? 'bg-[#141b2b] text-[#00ffcc] font-semibold border border-[#222f47]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" /> Air-Gap Redaction Diff
              {result?.sanitization?.scrubbedCount ? (
                <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px]">
                  {result.sanitization.scrubbedCount} isolated
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('output')}
              className={`px-4 py-2 rounded-lg text-xs font-mono transition flex items-center gap-2 ${
                activeTab === 'output'
                  ? 'bg-[#141b2b] text-[#00ffcc] font-semibold border border-[#222f47]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Restored Solution
              {result && (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px]">
                  Ready
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: Live Pipeline Stream */}
          {activeTab === 'pipeline' && (
            <div className="bg-[#0e1320] border border-[#1a2436] rounded-xl p-5 flex flex-col gap-3 min-h-[460px]">
              <div className="flex items-center justify-between pb-2 border-b border-[#161f30]">
                <span className="text-xs font-mono uppercase text-slate-400">Execution Trajectory</span>
                {result && (
                  <span className="text-xs font-mono text-emerald-400">
                    Finished in {result.execution.durationMs}ms
                  </span>
                )}
              </div>

              {events.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3">
                  <Terminal className="w-10 h-10 opacity-30" />
                  <p className="text-xs font-mono">Ready to process. Submit a task to watch the air-gap stream live.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[500px] pr-1">
                  {events.map((evt, idx) => {
                    const badgeStyles: Record<string, string> = {
                      TRIAGE: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
                      SANITIZATION: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
                      EXECUTION: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
                      REHYDRATION: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
                      COMPLETE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                      ERROR: 'bg-red-500/10 text-red-400 border-red-500/30'
                    };
                    const badge = badgeStyles[evt.step] || 'bg-slate-800 text-slate-300';

                    return (
                      <div key={idx} className="p-3 rounded-lg bg-[#080b12] border border-[#182335] flex flex-col gap-1.5 text-xs font-mono">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge}`}>
                            {evt.step}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(evt.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-slate-200">{evt.message}</p>
                        {evt.data?.reason && (
                          <p className="text-slate-400 text-[11px] pl-2 border-l border-slate-700">
                            ↳ {evt.data.reason}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Air-Gap Redaction Diff */}
          {activeTab === 'diff' && (
            <div className="bg-[#0e1320] border border-[#1a2436] rounded-xl p-5 flex flex-col gap-4 min-h-[460px]">
              <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div className="text-xs">
                  <div className="font-bold text-emerald-300">0 Bytes of Credentials or Sensitive Data Left Your Machine</div>
                  <div className="text-emerald-400/80 text-[11px]">
                    All API keys, DB strings, IPs, and emails were tokenized locally into session RAM before hitting the cloud.
                  </div>
                </div>
              </div>

              {result?.sanitization?.report && result.sanitization.report.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-mono uppercase text-slate-400">Isolated Credentials Table</span>
                  <div className="overflow-x-auto border border-[#1c273a] rounded-lg">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#121826] text-slate-400 border-b border-[#1c273a]">
                        <tr>
                          <th className="p-2.5">Category</th>
                          <th className="p-2.5">Air-Gap Vault Token</th>
                          <th className="p-2.5">Masked Preview</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#162030]">
                        {result.sanitization.report.map((item, i) => (
                          <tr key={i} className="hover:bg-[#121927]">
                            <td className="p-2.5 text-purple-300 font-semibold">{item.type}</td>
                            <td className="p-2.5 text-[#00ffcc] font-bold">{item.token}</td>
                            <td className="p-2.5 text-slate-400">{item.maskedPreview}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <span className="text-xs font-mono uppercase text-slate-400 mt-2">Scrubbed Payload Sent to Otari</span>
                  <pre className="p-3 rounded-lg bg-[#080b12] border border-[#1a2436] text-[11px] font-mono text-slate-300 overflow-x-auto max-h-[220px]">
                    {result.sanitization.sanitizedPreview}
                  </pre>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2">
                  <Lock className="w-8 h-8 opacity-30" />
                  <p className="text-xs font-mono">No active diff available yet. Execute a task to inspect.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Restored Solution Output */}
          {activeTab === 'output' && (
            <div className="bg-[#0e1320] border border-[#1a2436] rounded-xl p-5 flex flex-col gap-3 min-h-[460px]">
              <div className="flex items-center justify-between pb-2 border-b border-[#161f30]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase text-slate-400">Rehydrated Solution</span>
                  {result && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {result.rehydration.restoredCount} secrets safely restored
                    </span>
                  )}
                </div>

                {result && (
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-xs font-mono px-3 py-1.5 rounded-lg bg-[#141b2b] border border-[#222f47] hover:border-slate-500 text-slate-300 flex items-center gap-1.5 transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy Patch'}
                  </button>
                )}
              </div>

              {result ? (
                <div className="flex-1 flex flex-col gap-3">
                  <pre className="flex-1 p-4 rounded-lg bg-[#080b12] border border-[#1a2436] text-xs font-mono text-slate-200 overflow-x-auto max-h-[500px] whitespace-pre-wrap leading-relaxed">
                    {result.finalContent}
                  </pre>

                  {/* Summary Bar */}
                  <div className="p-3 rounded-lg bg-[#121927] border border-[#1e2a3f] flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">
                      Model: <strong className="text-white">{result.execution.model}</strong> ({result.execution.tier})
                    </span>
                    <span className="text-slate-400">
                      Latency: <strong className="text-white">{result.execution.durationMs}ms</strong>
                    </span>
                    <span className="text-slate-400">
                      Tokens: <strong className="text-white">{result.execution.tokens}</strong>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2">
                  <CheckCircle2 className="w-8 h-8 opacity-30" />
                  <p className="text-xs font-mono">Solution will appear here once executed.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#161f30] bg-[#0c101a] py-3 px-6 text-center text-xs text-slate-500 font-mono">
        SovereignMesh • Built for Mozilla Otari Hackathon ("Developers Wilding: Online") • Owners, Not Renters
      </footer>
    </div>
  );
}
