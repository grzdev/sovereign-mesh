import React, { useState } from 'react';
import { 
  Activity, 
  DollarSign, 
  Layers, 
  Zap, 
  Clock, 
  ShieldCheck, 
  Search, 
  Cpu, 
  Cloud, 
  ArrowUpRight,
  TrendingDown,
  Filter
} from 'lucide-react';

export interface AuditEntry {
  id: string;
  timestamp: string;
  task: string;
  tier: 'LOCAL_ONLY' | 'OTARI_HYBRID';
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  durationMs: number;
  costUSD: number;
  secretsProtected: number;
  toolsUsed: string[];
}

interface ObservabilityViewProps {
  telemetry: {
    totalRequests: number;
    localRequests: number;
    cloudRequests: number;
    localTokensProcessed: number;
    cloudTokensConsumed: number;
    dollarsSaved: number;
    dollarsSpent: number;
    budgetRemainingUSD: number;
    zeroLeakRedactionsCount: number;
  };
  auditLog: AuditEntry[];
}

export const ObservabilityView: React.FC<ObservabilityViewProps> = ({ telemetry, auditLog }) => {
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState<'all' | 'LOCAL_ONLY' | 'OTARI_HYBRID'>('all');

  const filteredLogs = auditLog.filter((item) => {
    const matchesSearch = item.task.toLowerCase().includes(search.toLowerCase()) || 
                          item.model.toLowerCase().includes(search.toLowerCase());
    const matchesTier = filterTier === 'all' || item.tier === filterTier;
    return matchesSearch && matchesTier;
  });

  const totalTokens = telemetry.localTokensProcessed + telemetry.cloudTokensConsumed;
  const localRatio = totalTokens > 0 ? ((telemetry.localTokensProcessed / totalTokens) * 100).toFixed(1) : '0';
  const cloudRatio = totalTokens > 0 ? ((telemetry.cloudTokensConsumed / totalTokens) * 100).toFixed(1) : '0';

  return (
    <div className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto max-w-[1600px] w-full mx-auto">
      
      {/* 1. VIEW HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-[#18202D]">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#00C4B4]" />
            <span>Token Observability & Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time telemetry showing where every token goes, per-task latency, and cost savings from local edge routing.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Otari Session Spend Limit:</span>
          <span className="font-mono font-semibold px-2 py-0.5 rounded bg-[#131A26] border border-[#202B3E] text-slate-200">
            $2.0000 Cap
          </span>
        </div>
      </div>

      {/* 2. TOP METRICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Metric 1: Total Tokens */}
        <div className="bg-[#0D121B] border border-[#1A2332] rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-400" /> Total Tokens
          </span>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-white">{totalTokens.toLocaleString()}</div>
            <div className="text-[11px] text-slate-500 mt-1">
              {telemetry.totalRequests} requests recorded
            </div>
          </div>
        </div>

        {/* Metric 2: Dollars Saved Locally */}
        <div className="bg-[#0D121B] border border-[#1A2332] rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
            <DollarSign className="w-4 h-4" /> Saved by Local Edge
          </span>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-emerald-400">${telemetry.dollarsSaved.toFixed(4)}</div>
            <div className="text-[11px] text-emerald-500/80 mt-1">
              {localRatio}% of tokens triaged for $0.00
            </div>
          </div>
        </div>

        {/* Metric 3: Otari Cloud Spend */}
        <div className="bg-[#0D121B] border border-[#1A2332] rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs text-[#00C4B4] font-medium flex items-center gap-1.5">
            <Zap className="w-4 h-4" /> Otari Cloud Spend
          </span>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-[#00C4B4]">${telemetry.dollarsSpent.toFixed(4)}</div>
            <div className="text-[11px] text-slate-500 mt-1">
              ${telemetry.budgetRemainingUSD.toFixed(4)} budget free
            </div>
          </div>
        </div>

        {/* Metric 4: Secrets Protected */}
        <div className="bg-[#0D121B] border border-[#1A2332] rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs text-purple-400 font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Secrets Protected
          </span>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-purple-300">{telemetry.zeroLeakRedactionsCount}</div>
            <div className="text-[11px] text-purple-400/80 mt-1">
              0 bytes leaked to cloud
            </div>
          </div>
        </div>

        {/* Metric 5: Edge vs Cloud Ratio */}
        <div className="bg-[#0D121B] border border-[#1A2332] rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-amber-400" /> Triage Distribution
          </span>
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="text-emerald-400">Local {telemetry.localRequests}</span>
              <span className="text-[#00C4B4]">Cloud {telemetry.cloudRequests}</span>
            </div>
            <div className="w-full bg-[#1A2230] h-2 rounded-full overflow-hidden flex">
              <div 
                className="bg-emerald-400 h-full transition-all duration-300" 
                style={{ width: `${telemetry.totalRequests > 0 ? (telemetry.localRequests / telemetry.totalRequests) * 100 : 50}%` }}
              />
              <div 
                className="bg-[#00C4B4] h-full transition-all duration-300" 
                style={{ width: `${telemetry.totalRequests > 0 ? (telemetry.cloudRequests / telemetry.totalRequests) * 100 : 50}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. REQUEST AUDIT TRAIL TABLE */}
      <div className="bg-[#0D121B] border border-[#1A2332] rounded-xl flex flex-col overflow-hidden shadow-md">
        
        {/* Table Toolbar */}
        <div className="p-4 border-b border-[#1A2332] bg-[#090C12] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Request Execution Audit Log
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#141C29] text-[#00E5D0] border border-[#233146]">
              {filteredLogs.length} entries
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search prompt or model..."
                className="bg-[#121824] border border-[#1F2B3E] focus:border-[#00C4B4] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none w-48 sm:w-64"
              />
            </div>

            {/* Filter Tier */}
            <div className="flex items-center bg-[#121824] border border-[#1F2B3E] rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setFilterTier('all')}
                className={`px-2 py-1 rounded-md transition ${filterTier === 'all' ? 'bg-[#1D2738] text-white font-semibold' : 'text-slate-400'}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterTier('LOCAL_ONLY')}
                className={`px-2 py-1 rounded-md transition ${filterTier === 'LOCAL_ONLY' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400'}`}
              >
                Edge ($0)
              </button>
              <button
                type="button"
                onClick={() => setFilterTier('OTARI_HYBRID')}
                className={`px-2 py-1 rounded-md transition ${filterTier === 'OTARI_HYBRID' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400'}`}
              >
                Otari Cloud
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0F17] text-slate-400 border-b border-[#1A2332] font-medium text-[11px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Task Objective</th>
                <th className="py-3 px-4">Execution Tier</th>
                <th className="py-3 px-4">Model Engine</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Tokens</th>
                <th className="py-3 px-4">Cost</th>
                <th className="py-3 px-4">Quarantined</th>
                <th className="py-3 px-4">Equipped Tools</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#151D2A] font-mono text-[11px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-sans text-xs">
                    No matching audit records found. Run tasks in the Studio to generate telemetry.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((entry) => (
                  <tr key={entry.id} className="hover:bg-[#101622] transition">
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-200 font-medium max-w-xs truncate">
                      {entry.task}
                    </td>
                    <td className="py-3 px-4">
                      {entry.tier === 'LOCAL_ONLY' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-sans text-[11px]">
                          <Cpu className="w-3 h-3" /> Local Edge
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#00C4B4]/10 text-[#00E5D0] border border-[#00C4B4]/20 font-sans text-[11px]">
                          <Cloud className="w-3 h-3" /> Otari Cloud
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-semibold truncate max-w-[140px]">
                      {entry.model}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {entry.durationMs}ms
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {entry.totalTokens}
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      {entry.tier === 'LOCAL_ONLY' ? (
                        <span className="text-emerald-400">$0.0000</span>
                      ) : (
                        <span className="text-[#00C4B4]">${entry.costUSD.toFixed(4)}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-purple-300 font-bold">
                      {entry.secretsProtected > 0 ? `${entry.secretsProtected} isolated` : '0'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 font-sans text-[10px]">
                        {entry.toolsUsed?.slice(0, 2).map((tool, ti) => (
                          <span key={ti} className="px-1.5 py-0.2 rounded bg-[#162030] text-slate-400 border border-[#212E42]">
                            {tool.replace(/-/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
