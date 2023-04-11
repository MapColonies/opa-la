/* eslint-disable */
let _execa;

async function execa(file, args, options) {
  if (_execa === undefined) {
    const i = await import('execa');
    _execa = i.execa;
  }
  return _execa(file, args, options);
}

module.exports = { execa };
