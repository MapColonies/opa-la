/* eslint-disable */
/**
 * This file exists to enable importing execa into cjs project, as execa only supports module.
 * @module
 * @ignore
 */
let _execa;

async function execa(file, args, options) {
  if (_execa === undefined) {
    const i = await import('execa');
    _execa = i.execa;
  }
  return _execa(file, args, options);
}

module.exports = { execa };
