import React from 'react';
import { 
  Lock, 
  Sparkles, 
  ChevronRight,
  Zap,
  Menu
} from 'lucide-react';
import { MeshLogo } from './MeshLogo';

interface HeaderProps {
  activeView: string;
  onResetPresets: () => void;
  isProcessing: boolean;
  onRun: () => void;
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeView, 
  onResetPresets, 
  isProcessing, 
  onRun,
  onToggleMobileMenu
}) => {
  const viewTitles: Record<string, { title: string; subtitle: string }> = {
    studio: {
      title: 'Studio & Gateway',
      subtitle: 'Air-gap sandbox testing'
    },
    observability: {
      title: 'Token Observability',
      subtitle: 'Audit trail & spend telemetry'
    },
    vault: {
      title: 'Air-Gap Vault',
      subtitle: 'Data compliance matrix'
    },
    models: {
      title: 'Model Registry',
      subtitle: 'Connected open-weight providers'
    }
  };

  const current = viewTitles[activeView] || viewTitles.studio;

  return (
    <header className="h-14 border-b border-[#171F2D] bg-[#0A0D13]/95 backdrop-blur px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-30">
      {/* Left: Mobile Menu Trigger + Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="md:hidden p-1.5 rounded-lg bg-[#121824] border border-[#1E2738] text-slate-300 hover:text-white cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <MeshLogo className="w-4 h-4 flex-shrink-0 hidden sm:block" />
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">sovereign-mesh</span>
          <ChevronRight className="w-3 h-3 text-slate-600 hidden sm:inline" />
          <span className="text-xs text-slate-200 font-semibold font-mono truncate">{current.title}</span>
        </div>
      </div>

      {/* Right: Actions & Status Pills */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Air-Gap Verification Shield */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium">
          <Lock className="w-3 h-3" />
          <span>Air-Gap Active: 0 Bytes Leaked</span>
        </div>

        {/* Quick Sample Load Button (Studio only) */}
        {activeView === 'studio' && (
          <button
            type="button"
            onClick={onResetPresets}
            className="text-xs px-2.5 py-1.5 rounded-md bg-[#121824] hover:bg-[#1A2333] border border-[#202C3E] text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
            title="Load sample vulnerable microservice"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00C4B4]" />
            <span className="hidden sm:inline">Sample</span>
          </button>
        )}

        {/* Execute Pipeline Action Button (Studio only) */}
        {activeView === 'studio' && (
          <button
            type="button"
            onClick={onRun}
            disabled={isProcessing}
            className="otari-button-primary text-xs font-bold px-3 py-1.5 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {isProcessing ? (
              <>
                <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                <span>Running...</span>
              </>
            ) : (
              <>
                <Zap className="w-3 h-3 fill-current" />
                <span>Run</span>
              </>
            )}
          </button>
        )}
      </div>
    </header>
  );
};
