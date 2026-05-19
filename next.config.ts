import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // Transpile Excalidraw for proper bundling with the App Router.
  transpilePackages: ["@excalidraw/excalidraw"],
};

export default nextConfig;
