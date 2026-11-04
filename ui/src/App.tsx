import React, { useState, useEffect } from 'react';
import { Sidebar, ActiveView } from './components/Sidebar';
import { Header } from './components/Header';
import { StudioView, ProcessResponse } from './views/StudioView';
import { ObservabilityView, AuditEntry } from './views/ObservabilityView';
import { VaultView } from './views/VaultView';
import { ModelsView } from './views/ModelsView';

const SAMPLE_VULNERABLE_CODE = `/**
 * Enterprise Payment & User Sync Service
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

  // BUGGY & BLOCKING IMPLEMENTATION: Synchronous loop that hangs on large batches
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

const SAMPLE_CIRCUIT_BREAKER_CODE = `// Distributed payment gateway connector requiring circuit breaker & exponential backoff
class PaymentGatewayClient {
  async chargeCard(token, amountCents) {
    // Unhandled timeout and missing retry policy
    const res = await fetch("https://api.stripe.internal/v1/charges", {
      method: "POST",
      body: JSON.stringify({ token, amount: amountCents })
    });
    return res.json();
  }
}`;

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('studio');
  const [prompt, setPrompt] = useState('Architect an asynchronous connection pool and retry policy with exponential backoff');
  const [code, setCode] = useState(SAMPLE_VULNERABLE_CODE);
  const [selectedModel, setSelectedModel] = useState('alibaba/qwen-3.5-35b-a3b');
  const [preference, setPreference] = useState<'auto' | 'local' | 'cloud'>('auto');
  const [isProcessing, setIsProcessing] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [result, setResult] = useState<ProcessResponse | null>(null);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

  const [telemetry, setTelemetry] = useState({
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

  // Fetch initial telemetry and audit log
  useEffect(() => {
    fetch('/api/mesh/telemetry')
      .then(res => res.json())
      .then(data => setTelemetry(data))
      .catch(() => {});

    fetch('/api/mesh/audit')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAuditLog(data);
      })
      .catch(() => {});

    // WebSocket connection for real-time updates
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/telemetry`);

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'PROCESS_EVENT') {
          setEvents(prev => [...prev, msg.event]);
        } else if (msg.type === 'TASK_COMPLETE') {
          if (msg.telemetry) setTelemetry(msg.telemetry);
          if (msg.auditLog) setAuditLog(msg.auditLog);
        } else if (msg.type === 'INIT_STATS') {
          if (msg.telemetry) setTelemetry(msg.telemetry);
          if (msg.auditLog) setAuditLog(msg.auditLog);
        }
      } catch {}
    };

    return () => ws.close();
  }, []);

  const handleRun = async () => {
    if (!prompt.trim()) return;
    setIsProcessing(true);
    setEvents([]);

    try {
      const res = await fetch('/api/mesh/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          codePayload: code,
          preference,
          cloudModel: selectedModel,
          localModel: 'llama3.2:1b'
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Execution failed');
      }

      const data: ProcessResponse = await res.json();
      setResult(data);
      if (data.telemetry) setTelemetry(data.telemetry);

      // Re-fetch audit log
      fetch('/api/mesh/audit')
        .then(r => r.json())
        .then(logs => { if (Array.isArray(logs)) setAuditLog(logs); })
        .catch(() => {});

    } catch (err: any) {
      alert(`Pipeline Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadPreset = (type: 'vulnerable' | 'docstring' | 'circuitBreaker') => {
    if (type === 'vulnerable') {
      setPrompt('Architect an asynchronous connection pool and retry policy with exponential backoff');
      setCode(SAMPLE_VULNERABLE_CODE);
      setSelectedModel('alibaba/qwen-3.5-35b-a3b');
      setPreference('cloud');
    } else if (type === 'docstring') {
      setPrompt('Add detailed JSDoc documentation and TypeScript parameter annotations to this function');
      setCode(SAMPLE_LOCAL_CODE);
      setSelectedModel('llama3.2:1b');
      setPreference('local');
    } else if (type === 'circuitBreaker') {
      setPrompt('Implement a resilient circuit breaker with exponential backoff and jitter for chargeCard');
      setCode(SAMPLE_CIRCUIT_BREAKER_CODE);
      setSelectedModel('meta/llama-3.3-70b-instruct');
      setPreference('cloud');
    }
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#08090A] text-slate-100 font-sans overflow-hidden">
      {/* 1. Collapsible Sidebar with Mobile Support */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        telemetry={telemetry}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onLoadPreset={handleLoadPreset}
      />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Minimalist Header */}
        <Header
          activeView={activeView}
          onResetPresets={() => handleLoadPreset('vulnerable')}
          isProcessing={isProcessing}
          onRun={handleRun}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        {/* Dynamic Views */}
        <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
          {activeView === 'studio' && (
            <StudioView
              prompt={prompt}
              setPrompt={setPrompt}
              code={code}
              setCode={setCode}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              preference={preference}
              setPreference={setPreference}
              isProcessing={isProcessing}
              onRun={handleRun}
              result={result}
              events={events}
              onLoadPreset={handleLoadPreset}
            />
          )}

          {activeView === 'observability' && (
            <ObservabilityView
              telemetry={telemetry}
              auditLog={auditLog}
            />
          )}

          {activeView === 'vault' && (
            <VaultView
              sanitizationReport={result?.sanitization?.report || []}
              telemetry={telemetry}
            />
          )}

          {activeView === 'models' && (
            <ModelsView
              onSelectModel={(modelId) => {
                setSelectedModel(modelId);
                setActiveView('studio');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
