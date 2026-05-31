export const openVisiTailwindTheme = {
  colors: {
    background: "#F7FAFC",
    foreground: "#0A2540",
    surface: {
      0: "#FFFFFF",
      1: "#F7FAFC",
      2: "#EEF4F8",
      3: "#D9E2EC",
      dark: "#07131F",
      darkRaised: "#0B1D2E"
    },
    border: {
      subtle: "#D9E2EC",
      strong: "#BCCCDC",
      inverse: "rgba(255, 255, 255, 0.16)"
    },
    text: {
      primary: "#0A2540",
      secondary: "#334E68",
      muted: "#627D98",
      inverse: "#F7FAFC",
      data: "#102A43"
    },
    brand: {
      primary: "#0A2540",
      secondary: "#102A43",
      accent: "#00D4FF",
      highlight: "#64FFDA"
    },
    status: {
      success: "#00C853",
      warning: "#FFB020",
      error: "#FF5252",
      info: "#00D4FF",
      neutral: "#829AB1"
    },
    score: {
      excellent: "#00C853",
      good: "#64FFDA",
      watch: "#FFB020",
      risk: "#FF5252",
      unknown: "#829AB1"
    },
    chart: {
      presence: "#00D4FF",
      clarity: "#64FFDA",
      citation: "#7C9CBF",
      competition: "#FFB020",
      trust: "#00C853",
      displacement: "#FF5252"
    }
  },
  fontFamily: {
    sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
    mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "monospace"]
  },
  borderRadius: {
    xs: "3px",
    sm: "4px",
    md: "6px",
    lg: "8px",
    xl: "12px"
  },
  boxShadow: {
    panel: "0 1px 2px rgba(10, 37, 64, 0.06), 0 0 0 1px rgba(10, 37, 64, 0.05)",
    elevated: "0 10px 30px rgba(10, 37, 64, 0.10), 0 0 0 1px rgba(10, 37, 64, 0.08)",
    focus: "0 0 0 3px rgba(0, 212, 255, 0.24)"
  },
  spacing: {
    pageX: "32px",
    pageY: "28px",
    panel: "16px",
    dense: "8px"
  }
} as const;

export type OpenVisiTailwindTheme = typeof openVisiTailwindTheme;

