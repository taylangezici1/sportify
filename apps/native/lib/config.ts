/** Where the published app talks to when no env var is baked in. */
const PRODUCTION_BACKEND_URL = "https://sportify-web-seven.vercel.app";

/**
 * Backend base URL as reachable from the phone. Development takes it from
 * apps/native/.env; published updates from the EAS environment variable of
 * the same name, falling back to the production deployment.
 */
export const BACKEND_URL = (process.env.EXPO_PUBLIC_BACKEND_URL ?? (__DEV__ ? "" : PRODUCTION_BACKEND_URL))
  .trim()
  .replace(/\/+$/, "");

export const TOKEN_STORAGE_KEY = "sportify_api_token";
