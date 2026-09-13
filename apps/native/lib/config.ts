/** Backend base URL as reachable from the phone (see .env.example). */
export const BACKEND_URL = (process.env.EXPO_PUBLIC_BACKEND_URL ?? "").trim().replace(/\/+$/, "");

export const TOKEN_STORAGE_KEY = "sportify_api_token";
