//@ts-check

import { composePlugins, withNx } from '@nx/next';

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // Use this to set Nx-specific options
  // See: https://nx.dev/recipes/next/next-config-setup
  nx: {},

  // Enable static export for Firebase Hosting
  output: 'export',

  // Disable image optimization for static export
  // (Firebase Hosting doesn't support Next.js Image Optimization API)
  images: {
    unoptimized: true,
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

export default composePlugins(...plugins)(nextConfig);
