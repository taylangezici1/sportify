declare namespace NodeJS {
  export interface ProcessEnv {
    DATABASE_URL: string;
    SPOTIFY_CLIENT_ID: string;
    SPOTIFY_CLIENT_SECRET: string;
    SPOTIFY_REDIRECT_URI: string;
  }
}
