'use strict';

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'ruflo_config.json');
const LOG_PATH = path.join(__dirname, '..', 'logs', 'swarm.log');

function loadConfig() {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
  return JSON.parse(raw);
}

function logEntry(agentName, taskDescription, status) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] agent=${agentName} status=${status} task="${taskDescription}"\n`;
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.appendFileSync(LOG_PATH, line);
  return line;
}

function dispatchTask(agentName, taskDescription) {
  const config = loadConfig();
  const agent = config.agents.find((a) => a.id === agentName);

  if (!agent) {
    logEntry(agentName, taskDescription, 'REJECTED_UNKNOWN_AGENT');
    console.error(`✗ Agente "${agentName}" no existe en ${path.basename(CONFIG_PATH)}`);
    return { ok: false, agent: null };
  }

  logEntry(agentName, taskDescription, 'DISPATCHED');
  console.log(`✓ Tarea despachada a ${agent.id} (${agent.role}): ${taskDescription}`);
  return { ok: true, agent };
}

if (require.main === module) {
  console.log('--- Prueba de dispatchTask ---');

  dispatchTask('Agent_BI', 'Sincronizar modelo dbt y refrescar dashboard Qlik de ventas');
  dispatchTask('Agent_Docs', 'Exportar documentación técnica del pipeline a Markdown');

  console.log('\n--- Contenido actual de ../logs/swarm.log ---');
  console.log(fs.readFileSync(LOG_PATH, 'utf8'));
}

module.exports = { dispatchTask, loadConfig };
