/** Design tokens mirroring apps/web/src/app/globals.css. */
export const colors = {
  bg: "#0b0b0c",
  surface: "#141416",
  surface2: "#1b1b1e",
  surface3: "#262629",
  line: "#2b2b30",
  text: "#f3f3f4",
  muted: "#9b9ba4",
  subtle: "#5f5f68",
  brand: "#ff3d3d",
  workout: "#ff7a1a",
  chill: "#4cc9ff",
  danger: "#ff4d4f",
  black: "#000000",
} as const;

export const fonts = {
  regular: "Lato_400Regular",
  bold: "Lato_700Bold",
  black: "Lato_900Black",
  mono: "monospace",
} as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
