const { join } = require('path');

/**
 * Keep Chrome inside the project so it ships with the build. On Render the
 * default ~/.cache/puppeteer is populated at build time but not carried into
 * the runtime container, which leaves the server unable to find Chrome.
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
