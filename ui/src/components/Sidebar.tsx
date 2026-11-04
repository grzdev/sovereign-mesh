import React, { useState } from 'react';
import { 
  Terminal, 
  Activity, 
  ShieldCheck, 
  Layers, 
  Zap, 
  Lock,
  Wrench,
  Sparkles,
  X,
  ChevronDown
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
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onLoadPreset: (type: 'vulnerable' | 'docstring' | 'circuitBreaker') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  setActiveView, 
  telemetry,
  mobileOpen,
  onCloseMobile,
  onLoadPreset
}) => {
  const budgetPercentUsed = Math.min(100, Math.max(0, (telemetry.dollarsSpent / 2.0) * 100));

  // Accordion dropdown states (Default collapsed to keep sidebar minimalist & calm)
  const [toolsOpen, setToolsOpen] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(false);

  const navItems = [
    {
      id: 'studio' as ActiveView,
      label: 'Studio & Gateway',
      icon: Terminal,
      badge: 'Core'
    },
    {
      id: 'observability' as ActiveView,
      label: 'Token Observability',
      icon: Activity,
      badge: telemetry.totalRequests > 0 ? `${telemetry.totalRequests}` : undefined
    },
    {
      id: 'vault' as ActiveView,
      label: 'Air-Gap Vault',
      icon: ShieldCheck,
      badge: telemetry.zeroLeakRedactionsCount > 0 ? `${telemetry.zeroLeakRedactionsCount}` : undefined
    },
    {
      id: 'models' as ActiveView,
      label: 'Model Registry',
      icon: Layers,
      badge: '150+'
    }
  ];

  const equippedTools = [
    { name: 'AirGap Sanitizer', desc: 'RAM-only secret vault' },
    { name: 'AST Linter', desc: 'Syntax & leak scanner' },
    { name: 'RAM Rehydrator', desc: 'Secret restorer' }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Drawer */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-[#0A0D13] border-r border-[#171F2D] flex flex-col justify-between flex-shrink-0 select-none h-screen
        transform transition-transform duration-200 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 border-b border-[#171F2D] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#00C4B4]/20 to-[#005B63]/30 border border-[#00C4B4]/40 flex items-center justify-center shadow-sm">
                <MeshLogo className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm text-white tracking-tight">SovereignMesh</span>
                <p className="text-[10px] text-slate-500 font-medium">Mozilla Otari Gateway</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#131A26] border border-[#222E42] text-[#00C4B4]">
                v1.0
              </span>
              {/* Mobile Close Button */}
              <button 
                type="button"
                onClick={onCloseMobile}
                className="md:hidden text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Section */}
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
                  onClick={() => {
                    setActiveView(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors cursor-pointer border ${
                    isActive
                      ? 'bg-[#131B27] text-white border-[#223147] shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#0E1420] border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#00C4B4]' : 'text-slate-500'}`} />
                    <span className="text-xs font-medium truncate">{item.label}</span>
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

          {/* Collapsible Dropdown 1: Equipped Tools with Ease-in-out Animation */}
          <div className="px-3 pt-2">
            <button
              type="button"
              onClick={() => setToolsOpen(!toolsOpen)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 rounded-lg hover:bg-[#0E1420] transition-colors cursor-pointer border border-transparent"
            >
              <span className="flex items-center gap-2 text-[11px] font-medium">
                <Wrench className="w-3.5 h-3.5 text-[#00C4B4]" />
                <span>Equipped Tools</span>
                <span className="text-[10px] text-emerald-400 font-mono">(3)</span>
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-300 ease-in-out ${toolsOpen ? 'rotate-180 text-[#00C4B4]' : 'rotate-0'}`} />
            </button>

            {/* Smooth Accordion Content */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${toolsOpen ? 'max-h-48 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
              <div className="flex flex-col gap-1 pl-2 border-l border-[#192231] ml-2">
                {equippedTools.map((tool, idx) => (
                  <div key={idx} className="px-2 py-1.5 rounded-md bg-[#0D121B] border border-[#161F2E] flex items-center justify-between text-[11px]">
                    <span className="text-slate-300 truncate">{tool.name}</span>
                    <span className="text-[9px] text-[#00C4B4] font-mono font-semibold">Active</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Collapsible Dropdown 2: Quick Presets with Ease-in-out Animation */}
          <div className="px-3 pt-2">
            <button
              type="button"
              onClick={() => setPresetsOpen(!presetsOpen)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 rounded-lg hover:bg-[#0E1420] transition-colors cursor-pointer border border-transparent"
            >
              <span className="flex items-center gap-2 text-[11px] font-medium">
                <Sparkles className="w-3.5 h-3.5 text-[#00C4B4]" />
                <span>Quick Presets</span>
                <span className="text-[10px] text-slate-500 font-mono">(2)</span>
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-300 ease-in-out ${presetsOpen ? 'rotate-180 text-[#00C4B4]' : 'rotate-0'}`} />
            </button>

            {/* Smooth Accordion Content */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${presetsOpen ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
              <div className="flex flex-col gap-1 pl-2 border-l border-[#192231] ml-2">
                <button
                  type="button"
                  onClick={() => {
                    onLoadPreset('vulnerable');
                    setActiveView('studio');
                    onCloseMobile();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-md bg-[#0D121B] hover:bg-[#141E2D] border border-[#161F2E] text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer truncate"
                >
                  ⚡ Payment Service
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLoadPreset('docstring');
                    setActiveView('studio');
                    onCloseMobile();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-md bg-[#0D121B] hover:bg-[#141E2D] border border-[#161F2E] text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer truncate"
                >
                  🔒 Local Docstring ($0)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Infrastructure & Budget Footer */}
        <div className="p-3 border-t border-[#171F2D] flex flex-col gap-2.5 bg-[#080B10] flex-shrink-0">
          {/* Virtual Key Budget Card */}
          <div className="p-2.5 rounded-lg bg-[#0F141F] border border-[#1C2638] flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-[#00C4B4]" /> Otari Spend
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
              <span>Cap: $2.00</span>
              <span className="text-emerald-400">${telemetry.budgetRemainingUSD.toFixed(2)} free</span>
            </div>
          </div>

          {/* Ethos Footer */}
          <div className="text-[10px] text-slate-500 flex items-center justify-between px-1">
            <span>Mozilla AI: Owners, Not Renters</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> Air-Gapped
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
