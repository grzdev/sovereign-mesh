import React from 'react';
import { 
  Lock, 
  Sparkles, 
  ChevronRight,
  Zap
} from 'lucide-react';
import { MeshLogo } from './MeshLogo';

interface HeaderProps {
  activeView: string;
  onResetPresets: () => void;
  isProcessing: boolean;
  onRun: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeView, 
  onResetPresets, 
  isProcessing, 
  onRun 
}) => {
  const viewTitles: Record<string, { title: string; subtitle: string }> = {
    studio: {
      title: 'Gateway Studio & Playground',
      subtitle: 'Air-gap sandbox testing across local models and Otari open-weights'
    },
    observability: {
      title: 'Token Observability & Audit Trail',
      subtitle: 'Real-time telemetry showing where every token goes and dollar savings'
    },
    vault: {
      title: 'Air-Gap Vault & Data Compliance',
      subtitle: 'In-memory isolated credentials and zero-leak verification matrix'
    },
    models: {
      title: 'Open-Weight Model Registry',
      subtitle: 'Connected providers via Mozilla Otari gateway and local edge runners'
    }
  };

  const current = viewTitles[activeView] || viewTitles.studio;

  return (
    <header className="h-14 border-b border-[#171F2D] bg-[#0A0D13]/95 backdrop-blur px-6 flex items-center justify-between flex-shrink-0 z-40">
      {/* Breadcrumbs & Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <MeshLogo className="w-4 h-4" />
          <span className="text-xs text-slate-500 font-mono">sovereign-mesh</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="text-xs text-slate-300 font-medium font-mono">{activeView}</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="hidden md:flex items-center gap-2">
          <span className="text-xs font-semibold text-white">{current.title}</span>
        </div>
      </div>

      {/* Global Action Pills */}
      <div className="flex items-center gap-3">
        {/* Air-Gap Verification Shield */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium">
          <Lock className="w-3 h-3" />
          <span>Air-Gap Active: 0 Bytes Leaked</span>
        </div>

        {/* Quick Reset Button */}
        {activeView === 'studio' && (
          <button
            type="button"
            onClick={onResetPresets}
            className="text-xs px-2.5 py-1.5 rounded-md bg-[#121824] hover:bg-[#1A2333] border border-[#202C3E] text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
            title="Load sample vulnerable microservice"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00C4B4]" />
            <span>Load Sample</span>
          </button>
        )}

        {/* Header Run Action Button (Studio only) */}
        {activeView === 'studio' && (
          <button
            type="button"
            onClick={onRun}
            disabled={isProcessing}
            className="otari-button-primary text-xs font-bold px-3 py-1.5 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                <span>Executing...</span>
              </>
            ) : (
              <>
                <Zap className="w-3 h-3 fill-current" />
                <span>Run Pipeline</span>
              </>
            )}
          </button>
        )}
      </div>
    </header>
  );
};
