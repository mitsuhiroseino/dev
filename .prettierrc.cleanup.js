const normal = require('./.prettierrc');

/** @type {import("prettier").Config} */
const config = {
  ...normal,
  organizeImportsSkipDestructiveCodeActions: true,
};
module.exports = config;
