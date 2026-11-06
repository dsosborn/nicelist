import * as stylex from "@stylexjs/stylex";
import { authStyles } from "./authStyles";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div {...stylex.props(authStyles.shell)}>
      <div {...stylex.props(authStyles.panel)}>{children}</div>
    </div>
  );
}
