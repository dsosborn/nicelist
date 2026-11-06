"use client";

import { AlertDialog } from "radix-ui";
import * as stylex from "@stylexjs/stylex";
import { app } from "@/app/appStyles";

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  keepLabel = "Keep it",
  onConfirm,
  children,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  keepLabel?: string;
  onConfirm: () => void;
  children: React.ReactNode;
}) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>{children}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay {...stylex.props(app.overlay)} />
        <AlertDialog.Content {...stylex.props(app.dialog)}>
          <AlertDialog.Title>{title}</AlertDialog.Title>
          <AlertDialog.Description>{description}</AlertDialog.Description>
          <div {...stylex.props(app.row)}>
            <AlertDialog.Cancel asChild>
              <button type="button" autoFocus {...stylex.props(app.button)}>
                {keepLabel}
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button type="button" {...stylex.props(app.quiet)} onClick={onConfirm}>
                {confirmLabel}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
