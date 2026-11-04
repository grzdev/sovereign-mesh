/**
 * SovereignMesh - Telemetry & Gateway Server
 * Exposes REST and WebSocket endpoints for the Developer CLI and Cyber-Dashboard.
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { MeshOrchestrator, ProcessRequest } from '../core/orchestrator.js';

const app = Fastify({ logger: false });
const orchestrator = new MeshOrchestrator();

// Active WebSocket connections
const clients = new Set<any>();

async function main() {
  await app.register(cors, { origin: '*' });
  await app.register(websocket);

  // WebSocket endpoint for real-time telemetry streaming
  app.get('/ws/telemetry', { websocket: true }, (connection) => {
    clients.add(connection);

    // Send initial stats on connect
    connection.send(JSON.stringify({
      type: 'INIT_STATS',
      telemetry: orchestrator.getGovernor().getStats(),
      auditLog: orchestrator.getGovernor().getAuditLog()
    }));

    connection.on('close', () => {
      clients.delete(connection);
    });
  });

  const broadcast = (data: any) => {
    const msg = JSON.stringify(data);
    for (const client of clients) {
      try {
        client.send(msg);
      } catch {
        clients.delete(client);
      }
    }
  };

  // Health & Model Status
  app.get('/api/mesh/health', async () => {
    const ollamaOk = await orchestrator.getOllama().isAvailable();
    const otariConfigured = orchestrator.getOtari().isConfigured();
    const localModels = ollamaOk ? await orchestrator.getOllama().listModels() : [];

    return {
      status: 'ok',
      version: '1.0.0',
      nodes: {
        local: {
          available: ollamaOk,
          engine: 'Ollama',
          defaultModel: 'llama3.2:1b',
          models: localModels
        },
        cloud: {
          configured: otariConfigured,
          gateway: 'Mozilla Otari.ai',
          defaultModel: 'alibaba/qwen-3.5-35b-a3b',
          endpoint: 'https://otari.ai/api/v1'
        }
      }
    };
  });

  // Telemetry stats
  app.get('/api/mesh/telemetry', async () => {
    return orchestrator.getGovernor().getStats();
  });

  // Request Audit Log
  app.get('/api/mesh/audit', async () => {
    return orchestrator.getGovernor().getAuditLog();
  });

  // Process a task through the air-gap pipeline
  app.post('/api/mesh/process', async (req, reply) => {
    const body = req.body as ProcessRequest;
    if (!body || !body.prompt) {
      return reply.status(400).send({ error: 'Prompt is required' });
    }

    try {
      const result = await orchestrator.process(body, (event) => {
        broadcast({ type: 'PROCESS_EVENT', event });
      });

      broadcast({
        type: 'TASK_COMPLETE',
        telemetry: result.telemetry,
        decision: result.decision,
        auditLog: orchestrator.getGovernor().getAuditLog()
      });

      return result;
    } catch (err: any) {
      const errorMsg = err.message || 'Unknown processing error';
      broadcast({ type: 'PROCESS_ERROR', error: errorMsg });
      return reply.status(500).send({ error: errorMsg });
    }
  });

  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3333;
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`[SovereignMesh Server] Live at http://localhost:${PORT}`);
    console.log(`[SovereignMesh WebSocket] Live at ws://localhost:${PORT}/ws/telemetry`);
  } catch (err) {
    console.error('Server failed to start:', err);
    process.exit(1);
  }
}

main();
