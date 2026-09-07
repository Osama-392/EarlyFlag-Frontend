/** @type {import('next').NextConfig} */
const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');

module.exports = (phase) => ({
  // Keep the dev server and production builds from overwriting each other's
  // webpack runtime/vendor chunks when they run at the same time.
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',
  eslint: {
    ignoreDuringBuilds: true,
  },
});
