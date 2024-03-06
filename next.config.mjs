/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => ({
        ...config,
        experiments: {
            asyncWebAssembly: true,
        },
    }),
};

export default nextConfig;
