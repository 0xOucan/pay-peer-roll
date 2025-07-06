/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['intmax2-server-sdk'],
  webpack: (config, { isServer }) => {
    // Handle WASM files for both client and server
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      syncWebAssembly: true,
      layers: true,
    };

    // Handle WASM file loading
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    });

    // Handle intmax2-server-sdk on server side
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('intmax2-server-sdk');
    }

    // Handle intmax2-client-sdk on client side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    // Ensure proper handling of ES modules
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
      '.mjs': ['.mjs', '.mts'],
    };
    
    return config;
  },
}

export default nextConfig
