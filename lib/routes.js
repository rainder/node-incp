'use strict';

const fs = require('fs');
const path = require('path');

const DIR = path.resolve(__dirname, 'routes');

module.exports = loadRoutes();

/**
 *
 * @returns {{}}
 */
function loadRoutes() {
  const result = {};
  const files = [DIR];

  const IGNORE_PATTERN = /^_/;
  const FILTER_PATTERN = /\.js$/;

  for (let file of files) {
    const filename = path.basename(file);

    if (IGNORE_PATTERN.test(filename)) {
      continue;
    }

    if (fs.statSync(file).isDirectory()) {
      const dirFiles = fs.readdirSync(file);
      for (let dirFile of dirFiles) {
        files.push(path.resolve(file, dirFile));
      }
      continue;
    }

    if (!FILTER_PATTERN.test(filename)) {
      continue;
    }

    const extname = path.extname(file);
    const endpoint = file.substr(DIR.length + 1, file.length - DIR.length - extname.length - 1);
    result[endpoint] = require(file);
  }

  return result;
}