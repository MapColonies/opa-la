let router;

async function init() {
  const imported = await import('@adminjs/express');
  router = { buildRouter: imported.default.buildRouter };
}

function getRouter() {
  return router;
}

module.exports = { getRouter, init };
