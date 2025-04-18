
export const logoSizes = {
  sm: "h-10 w-auto",
  md: "h-14 w-auto",
  lg: "h-24 w-auto",
  xl: "h-32 w-auto"
} as const;

export type LogoSize = keyof typeof logoSizes;
