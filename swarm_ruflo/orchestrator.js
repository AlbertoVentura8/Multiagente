'use strict';

const fs = require('fs');
const path = require('path');

const { executeBITask } = require('./nodes/bi/bi_worker');
const { generateMarkdownDoc } = require('./nodes/docs/docs_worker');

const CONFIG_PATH = path.join(__dirname, 'ruflo_config.json');
const LOG_PATH = path.join(__dirname, '..', 'logs', 'swarm.log');

function loadConfig() {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
  return JSON.parse(raw);
}

function logEntry(agentName, taskDescription, status, result) {
  const timestamp = new Date().toISOString();
  const resultStr = result ? ` result=${JSON.stringify(result)}` : '';
  const line = `[${timestamp}] agent=${agentName} status=${status} task="${taskDescription}"${resultStr}\n`;
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.appendFileSync(LOG_PATH, line);
  return line;
}

function runWorker(agentName, taskDescription, payload) {
  if (agentName === 'Agent_BI') {
    return executeBITask({ target: payload.target || taskDescription });
  }

  if (agentName === 'Agent_Docs') {
    return generateMarkdownDoc(
      payload.title || taskDescription,
      payload.content || taskDescription
    );
  }

  return { status: 'SKIPPED', reason: 'no hay worker registrado para este agente' };
}

function dispatchTask(agentName, taskDescription, payload = {}) {
  const config = loadConfig();
  const agent = config.agents.find((a) => a.id === agentName);

  if (!agent) {
    logEntry(agentName, taskDescription, 'REJECTED_UNKNOWN_AGENT');
    console.error(`✗ Agente "${agentName}" no existe en ${path.basename(CONFIG_PATH)}`);
    return { ok: false, agent: null, result: null };
  }

  let result;
  try {
    result = runWorker(agentName, taskDescription, payload);
  } catch (err) {
    result = { status: 'ERROR', message: err.message };
  }

  logEntry(agentName, taskDescription, 'DISPATCHED', result);
  console.log(`✓ Tarea despachada a ${agent.id} (${agent.role}): ${taskDescription}`);
  console.log('  → resultado:', result);

  return { ok: true, agent, result };
}

if (require.main === module) {
  console.log('--- Prueba de dispatchTask ---');

  dispatchTask('Agent_BI', 'Sincronizar modelo dbt y refrescar dashboard Qlik de ventas', {
    target: 'stg_ventas',
  });

  dispatchTask('Agent_Docs', 'Exportar documentación técnica del pipeline a Markdown', {
    title: 'Pipeline de Ventas',
    content:
      'Este documento describe el pipeline dbt/Qlik de ventas, generado automáticamente por Agent_Docs.',
  });

  console.log('\n--- Contenido actual de ../logs/swarm.log ---');
  console.log(fs.readFileSync(LOG_PATH, 'utf8'));
}

module.exports = { dispatchTask, loadConfig };
