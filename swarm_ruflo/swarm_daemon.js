'use strict';

const fs = require('fs');
const path = require('path');

const { dispatchTask } = require('./orchestrator');

const QUEUE_PATH = path.join(__dirname, 'tasks_queue.json');
const LOG_PATH = path.join(__dirname, '..', 'logs', 'swarm.log');
const POLL_INTERVAL_MS = 15000;

function logLine(text) {
  const timestamp = new Date().toISOString();
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.appendFileSync(LOG_PATH, `[${timestamp}] ${text}\n`);
}

function readQueue() {
  const raw = fs.readFileSync(QUEUE_PATH, 'utf8');
  return raw.trim() ? JSON.parse(raw) : [];
}

function writeQueue(queue) {
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2), 'utf8');
}

async function processQueue() {
  try {
    const queue = readQueue();

    if (queue.length === 0) {
      console.log(`[swarm_daemon] ${new Date().toISOString()} - cola vacía, nada que procesar`);
      return;
    }

    const task = queue.shift();
    writeQueue(queue);

    console.log(`[swarm_daemon] Procesando tarea FIFO para ${task.agent}: ${task.description}`);
    dispatchTask(task.agent, task.description, task.payload || {});
  } catch (err) {
    logLine(`agent=swarm_daemon status=QUEUE_ERROR detail="${err.message}"`);
    console.error(`[swarm_daemon] Error al evaluar tasks_queue.json, el daemon sigue activo: ${err.message}`);
  }
}

process.on('uncaughtException', (err) => {
  logLine(`agent=swarm_daemon status=UNCAUGHT_EXCEPTION detail="${err.message}"`);
  console.error(`[swarm_daemon] Excepción no controlada capturada, el daemon sigue activo: ${err.message}`);
});

console.log(`[swarm_daemon] Iniciado. Polling cada ${POLL_INTERVAL_MS / 1000}s sobre ${QUEUE_PATH}`);
setInterval(() => {
  processQueue().catch((err) => {
    logLine(`agent=swarm_daemon status=QUEUE_ERROR_UNHANDLED detail="${err.message}"`);
  });
}, POLL_INTERVAL_MS);
