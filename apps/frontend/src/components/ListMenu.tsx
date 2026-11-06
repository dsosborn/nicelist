"use client";

import { DropdownMenu } from "radix-ui";
import * as stylex from "@stylexjs/stylex";
import { app } from "@/app/appStyles";
import type { ListSummary } from "@/lib/api";

export function ListMenu({ lists }: { lists: ListSummary[] }) {
  if (lists.length <= 1) return null;
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button type="button" {...stylex.props(app.quiet)}>
          Switch list
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content {...stylex.props(app.menu)}>
          {lists.map((item) => (
            <DropdownMenu.Item
              key={item.id}
              {...stylex.props(app.menuItem)}
              onSelect={() => {
                window.location.assign(`/list?id=${item.id}`);
              }}
            >
              {item.recipientName}: {item.name}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
