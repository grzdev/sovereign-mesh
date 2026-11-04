import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  Database, 
  Network, 
  Mail, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  FileText
} from 'lucide-react';

interface VaultViewProps {
  sanitizationReport: Array<{
    type: string;
    token: string;
    maskedPreview: string;
  }>;
  telemetry: {
    zeroLeakRedactionsCount: number;
    totalRequests: number;
  };
}

export const VaultView: React.FC<VaultViewProps> = ({ sanitizationReport, telemetry }) => {
  const handleExportAudit = () => {
    const auditData = {
      timestamp: new Date().toISOString(),
      complianceStandard: "Air-Gap In-Memory Zero-Leak Protocol v1.0",
      totalProtectedSecrets: telemetry.zeroLeakRedactionsCount,
      sessionStatus: "COMPLIANT_ZERO_LEAK",
      quarantinedTokens: sanitizationReport
    };
    const blob = new Blob([JSON.stringify(auditData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sovereign-mesh-audit-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto max-w-[1600px] w-full mx-auto">
      
      {/* 1. VIEW HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-[#18202D]">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Air-Gap Vault & Data Compliance Matrix</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Enterprise in-memory secret quarantine verifying that zero credentials, connection URIs, or internal IPs leave your host.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportAudit}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#14202B] hover:bg-[#1C2C3D] border border-[#00C4B4]/40 text-[#00E5D0] flex items-center gap-1.5 transition cursor-pointer shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Compliance Audit</span>
        </button>
      </div>

      {/* 2. COMPLIANCE CERTIFICATE BANNER */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-[#00C4B4]/5 to-transparent border border-emerald-500/25 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-emerald-300">Zero-Leak Air-Gap Protocol Active</h3>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300">
                PASSED
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Every sensitive string is tokenized locally into an ephemeral RAM dictionary before network packets leave your computer. The external cloud model only receives anonymous syntax tokens.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-[#1F2B3E] pt-3 md:pt-0 md:pl-5 text-xs font-mono">
          <div>
            <span className="text-slate-500 block text-[11px]">Quarantined Items</span>
            <strong className="text-emerald-400 text-lg font-bold">{telemetry.zeroLeakRedactionsCount}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Storage Mode</span>
            <strong className="text-slate-200">RAM Only (0 Disk)</strong>
          </div>
        </div>
      </div>

      {/* 3. ACTIVE ISOLATED CREDENTIALS TABLE */}
      <div className="bg-[#0D121B] border border-[#1A2332] rounded-xl flex flex-col overflow-hidden shadow-md">
        <div className="p-4 border-b border-[#1A2332] bg-[#090C12] flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Active Session Quarantined Credentials
          </span>
          <span className="text-xs text-slate-500 font-mono">
            {sanitizationReport.length} tokens registered in RAM
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0F17] text-slate-400 border-b border-[#1A2332] font-medium text-[11px]">
              <tr>
                <th className="py-3 px-4">Pattern Category</th>
                <th className="py-3 px-4">Deterministic Vault Token</th>
                <th className="py-3 px-4">Masked Value</th>
                <th className="py-3 px-4">Protection Mechanism</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#151D2A] font-mono text-[11px]">
              {sanitizationReport.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-sans text-xs">
                    No active credentials quarantined in this session yet. Run a task with secrets in the Studio to observe.
                  </td>
                </tr>
              ) : (
                sanitizationReport.map((item, i) => (
                  <tr key={i} className="hover:bg-[#101622] transition">
                    <td className="py-3 px-4 font-sans">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium text-[11px]">
                        {item.type === 'API_KEY' && <KeyRound className="w-3.5 h-3.5" />}
                        {item.type === 'DB_URL' && <Database className="w-3.5 h-3.5" />}
                        {item.type === 'PRIVATE_IP' && <Network className="w-3.5 h-3.5" />}
                        {item.type === 'EMAIL' && <Mail className="w-3.5 h-3.5" />}
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#00E5D0] font-bold">
                      {item.token}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {item.maskedPreview}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300">
                      SHA-256 In-Memory Map
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Quarantined
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. TECHNICAL ARCHITECTURE EXPLANATION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#0D121B] border border-[#1A2332] flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <span className="w-5 h-5 rounded-full bg-[#182333] border border-[#27374E] flex items-center justify-center text-[10px] text-[#00C4B4]">1</span>
            <span>Zero-Leak AST Interception</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Prior to any network egress, source code is parsed for secrets, connection strings, and IPs using specialized AST regex engines.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#0D121B] border border-[#1A2332] flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <span className="w-5 h-5 rounded-full bg-[#182333] border border-[#27374E] flex items-center justify-center text-[10px] text-[#00C4B4]">2</span>
            <span>Ephemeral RAM Mapping</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Secrets are mapped to tokens like <code className="text-[#00E5D0] font-mono">[VAULT_KEY_1]</code> exclusively in process memory and never written to disk or logs.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#0D121B] border border-[#1A2332] flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <span className="w-5 h-5 rounded-full bg-[#182333] border border-[#27374E] flex items-center justify-center text-[10px] text-[#00C4B4]">3</span>
            <span>Local Patch Rehydration</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            When Otari’s solution returns, the original secrets are re-injected safely in local RAM so the user receives a fully working patch.
          </p>
        </div>
      </div>

    </div>
  );
};
