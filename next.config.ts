import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();
const nextConfig: NextConfig = {
  /* config options here */
    allowedDevOrigins: ['173.249.18.125'],
};

export default withNextIntl(nextConfig);
