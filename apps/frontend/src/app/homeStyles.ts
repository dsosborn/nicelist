import * as stylex from "@stylexjs/stylex";
import { homeColors } from "./homeTokens.stylex";

const HOVER = "@media (hover: hover) and (pointer: fine)";
const NARROW = "@media (max-width: 800px)";

export const homeStyles = stylex.create({
  page: {
    backgroundColor: "#f6f1ea",
    color: "#1c1410",
    fontFamily: "var(--font-geist-sans), sans-serif",
  },
  hero: {
    position: "relative",
    display: "flex",
    minHeight: {
      default: "100vh",
      [NARROW]: "auto",
    },
    flexDirection: "column",
    color: "#fff",
    backgroundColor: "#f6f1ea",
  },
  photo: {
    position: {
      default: "absolute",
      [NARROW]: "relative",
    },
    inset: {
      default: 0,
      [NARROW]: "auto",
    },
    height: {
      default: "100%",
      [NARROW]: "72vh",
    },
    backgroundColor: "#3a2416",
    backgroundImage:
      "linear-gradient(100deg, rgba(28, 16, 8, 0.42) 0%, rgba(28, 16, 8, 0.12) 46%, rgba(28, 16, 8, 0) 68%), url(/hero-holiday.jpg)",
    backgroundSize: "cover",
    backgroundPosition: "right center",
    backgroundRepeat: "no-repeat",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: {
      default: "28px 48px",
      [NARROW]: "20px 20px",
    },
  },
  brand: {
    fontSize: 18,
    fontWeight: 600,
    letterSpacing: "-0.04em",
    color: "#fff",
    textDecoration: "none",
  },
  signIn: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 40,
    paddingInline: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "rgba(255, 255, 255, 0.42)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 500,
    textDecoration: "none",
    backgroundColor: {
      default: "transparent",
      [HOVER]: {
        ":hover": "rgba(255, 255, 255, 0.12)",
      },
    },
  },
  heroBody: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flex: 1,
    alignItems: {
      default: "center",
      [NARROW]: "flex-start",
    },
    padding: {
      default: "0 7vw 10vh",
      [NARROW]: "0 20px 32px",
    },
  },
  copy: {
    display: "flex",
    width: {
      default: "46%",
      [NARROW]: "100%",
    },
    maxWidth: 520,
    flexDirection: "column",
    gap: 28,
  },
  title: {
    maxWidth: 440,
    fontSize: {
      default: 64,
      [NARROW]: 40,
    },
    fontWeight: 500,
    lineHeight: 0.92,
    letterSpacing: "-0.045em",
    textWrap: "balance",
    color: {
      default: "#fff",
      [NARROW]: "#1c1410",
    },
  },
  field: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minHeight: 68,
    padding: 8,
    paddingLeft: 22,
    borderRadius: 18,
    backgroundColor: "#fff",
    boxShadow: "0 18px 50px rgba(28, 16, 8, 0.28)",
  },
  label: {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    borderWidth: 0,
  },
  input: {
    minWidth: 0,
    flex: 1,
    borderWidth: 0,
    backgroundColor: "transparent",
    color: "#1c1410",
    fontFamily: "inherit",
    fontSize: 17,
    lineHeight: "24px",
    outline: "none",
  },
  submit: {
    display: "inline-flex",
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    paddingInline: 18,
    borderWidth: 0,
    borderRadius: 12,
    backgroundColor: {
      default: "#1c1410",
      [HOVER]: {
        ":hover": "#3a2a22",
      },
    },
    color: "#fff",
    fontFamily: "inherit",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
  error: {
    marginTop: -12,
    color: {
      default: "#fff",
      [NARROW]: "#8a3b24",
    },
    fontSize: 14,
  },
  examples: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  example: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 36,
    paddingInline: 14,
    borderWidth: 1,
    borderStyle: "solid",
    borderRadius: 999,
    backgroundColor: {
      default: "rgba(255, 255, 255, 0.14)",
      [HOVER]: {
        ":hover": "rgba(255, 255, 255, 0.24)",
      },
      [NARROW]: "#fff",
    },
    color: {
      default: "#fff",
      [NARROW]: "#1c1410",
    },
    borderColor: {
      default: "rgba(255, 255, 255, 0.34)",
      [NARROW]: "#e4d9cf",
    },
    fontFamily: "inherit",
    fontSize: 14,
    cursor: "pointer",
    backdropFilter: "blur(10px)",
  },
  benefits: {
    padding: {
      default: "112px 7vw 120px",
      [NARROW]: "72px 20px 80px",
    },
  },
  benefitsInner: {
    maxWidth: 1080,
  },
  kicker: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "#8a6a52",
  },
  benefitsTitle: {
    maxWidth: 640,
    marginTop: 16,
    fontSize: {
      default: 48,
      [NARROW]: 34,
    },
    fontWeight: 500,
    lineHeight: 1.05,
    letterSpacing: "-0.04em",
    textWrap: "balance",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: {
      default: "repeat(3, 1fr)",
      [NARROW]: "1fr",
    },
    gap: {
      default: 48,
      [NARROW]: 36,
    },
    marginTop: 64,
  },
  itemIndex: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.08em",
    color: "#8a6a52",
  },
  itemTitle: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: "-0.03em",
  },
  itemBody: {
    marginTop: 10,
    maxWidth: 320,
    fontSize: 16,
    lineHeight: 1.5,
    color: "#5c4b40",
  },
  cta: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: 40,
    paddingBlock: 0,
    paddingInline: 16,
    borderRadius: 128,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "transparent",
    cursor: "pointer",
    width: "fit-content",
    fontWeight: 500,
  },
  primary: {
    backgroundColor: {
      default: homeColors.textPrimary,
      [HOVER]: {
        ":hover": homeColors.buttonPrimaryHover,
      },
    },
    color: homeColors.background,
  },
  secondary: {
    backgroundColor: "transparent",
    borderColor: homeColors.buttonSecondaryBorder,
  },
});
