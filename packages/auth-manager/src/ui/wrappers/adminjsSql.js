async function getAdminSql() {
  const adminjsSql = await import('@adminjs/sql');
  return { Database: adminjsSql.Database, Resource: adminjsSql.Resource, Adapter: adminjsSql.default };
}

module.exports = { getAdminSql };
