const normal = require('./.prettierrc');

/** @type {import("prettier").Config} */
const config = {
  ...normal,
  organizeImportsSkipDestructiveCodeActions: false,
};
module.exports = config;
