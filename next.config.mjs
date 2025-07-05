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
    // Handle WASM files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    
    // Handle intmax2-server-sdk
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('intmax2-server-sdk');
    }
    
    return config;
  },
}

export default nextConfig
