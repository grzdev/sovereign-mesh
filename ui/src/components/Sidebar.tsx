import React from 'react';
import { 
  Terminal, 
  Activity, 
  ShieldCheck, 
  Layers, 
  Zap, 
  Lock
} from 'lucide-react';
import { MeshLogo } from './MeshLogo';

export type ActiveView = 'studio' | 'observability' | 'vault' | 'models';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  telemetry: {
    dollarsSpent: number;
    budgetRemainingUSD: number;
    totalRequests: number;
    zeroLeakRedactionsCount: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, telemetry }) => {
  const budgetPercentUsed = Math.min(100, Math.max(0, (telemetry.dollarsSpent / 2.0) * 100));

  const navItems = [
    {
      id: 'studio' as ActiveView,
      label: 'Studio & Gateway',
      description: 'Agent playground & air-gap pipeline',
      icon: Terminal,
      badge: 'Core'
    },
    {
      id: 'observability' as ActiveView,
      label: 'Token Observability',
      description: 'Audit trail & spend telemetry',
      icon: Activity,
      badge: telemetry.totalRequests > 0 ? `${telemetry.totalRequests}` : undefined
    },
    {
      id: 'vault' as ActiveView,
      label: 'Air-Gap Vault',
      description: 'Data governance & quarantined keys',
      icon: ShieldCheck,
      badge: telemetry.zeroLeakRedactionsCount > 0 ? `${telemetry.zeroLeakRedactionsCount}` : undefined
    },
    {
      id: 'models' as ActiveView,
      label: 'Model Registry',
      description: 'Otari open-weights & edge SLMs',
      icon: Layers,
      badge: '150+'
    }
  ];

  return (
    <aside className="w-64 bg-[#0A0D13] border-r border-[#171F2D] flex flex-col justify-between flex-shrink-0 select-none h-screen">
      {/* Brand Header */}
      <div>
        <div className="p-4 border-b border-[#171F2D] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Metadata Favicon Geometric Mesh Logo */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#00C4B4]/20 to-[#005B63]/30 border border-[#00C4B4]/40 flex items-center justify-center shadow-sm">
              <MeshLogo className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white tracking-tight">SovereignMesh</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Mozilla Otari Gateway</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#131A26] border border-[#222E42] text-[#00C4B4]">
            v1.0
          </span>
        </div>

        {/* Navigation Section with Zero Twitching */}
        <div className="p-3 flex flex-col gap-1">
          <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
            Platform Views
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer border ${
                  isActive
                    ? 'bg-[#131B27] text-white border-[#223147] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#0E1420] border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#00C4B4]' : 'text-slate-500'}`} />
                  <div className="truncate">
                    <div className="text-xs font-medium leading-none truncate">{item.label}</div>
                    <div className="text-[10px] text-slate-500 truncate mt-1">{item.description}</div>
                  </div>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                    isActive ? 'bg-[#00C4B4]/15 text-[#00E5D0] border border-[#00C4B4]/30' : 'bg-[#141B26] text-slate-500'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Infrastructure & Budget Footer */}
      <div className="p-3.5 border-t border-[#171F2D] flex flex-col gap-3 bg-[#080B10]">
        
        {/* Virtual Key Budget Card */}
        <div className="p-2.5 rounded-lg bg-[#0F141F] border border-[#1C2638] flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#00C4B4]" /> Otari Spend Cap
            </span>
            <span className="font-mono text-slate-200 font-semibold">
              ${telemetry.dollarsSpent.toFixed(4)}
            </span>
          </div>
          <div className="w-full bg-[#182130] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#00C4B4] to-[#00E5D0] h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.max(5, budgetPercentUsed)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>Limit: $2.00</span>
            <span className="text-emerald-400">${telemetry.budgetRemainingUSD.toFixed(2)} free</span>
          </div>
        </div>

        {/* Live Nodes Status */}
        <div className="flex flex-col gap-1.5 text-[11px] text-slate-400">
          <div className="flex items-center justify-between px-1">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Local Edge:
            </span>
            <span className="font-mono text-emerald-400 font-medium">llama3.2:1b</span>
          </div>
          <div className="flex items-center justify-between px-1">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00C4B4] animate-pulse"></span>
              Gateway:
            </span>
            <span className="font-mono text-[#00C4B4] font-medium">Mozilla Otari</span>
          </div>
        </div>

        {/* Ethos Footer */}
        <div className="pt-2 border-t border-[#171F2D] text-[10px] text-slate-500 flex items-center justify-between px-1">
          <span>Owners, Not Renters</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" /> Air-Gapped
          </span>
        </div>
      </div>
    </aside>
  );
};
