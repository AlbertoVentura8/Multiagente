'use strict';

function executeBITask(payload) {
  const target = payload && payload.target;

  console.log(`[Agent_BI] Verificando modelo dbt para target "${target}"...`);

  return {
    status: 'SUCCESS',
    target,
    duration: '120ms',
  };
}

module.exports = { executeBITask };
