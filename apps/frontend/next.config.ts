import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Static export for S3/CloudFront hosting
  output: "export",
};

export default nextConfig;
