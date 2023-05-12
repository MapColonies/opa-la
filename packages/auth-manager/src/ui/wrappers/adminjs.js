async function getAdmin() {
  const adminjs = await import('adminjs');
  // console.log(adminjs);
  return { AdminJS: adminjs.AdminJS };
}

module.exports = { getAdmin };
