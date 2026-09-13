import type { NextConfig } from "next";

// @repo/ui imports react-native for its tiny shared button; on the web that
// resolves to react-native-web.
const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui"],
  turbopack: {
    resolveAlias: {
      "react-native": "react-native-web",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "*.ytimg.com" },
      { protocol: "https", hostname: "yt3.ggpht.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
