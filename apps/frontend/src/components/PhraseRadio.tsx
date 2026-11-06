"use client";

import { useId } from "react";
import { RadioGroup } from "radix-ui";
import * as stylex from "@stylexjs/stylex";
import { app } from "@/app/appStyles";
import {
  membershipCopy,
  timingCopy,
  visibilityCopy,
  type MembershipPhrase,
  type TimingPhrase,
  type Visibility,
} from "@/lib/api";

function SentenceRadioGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Record<T, string>;
  onChange: (value: T) => void;
}) {
  const baseId = useId();
  return (
    <RadioGroup.Root
      value={value}
      onValueChange={(next) => onChange(next as T)}
      aria-label={label}
      {...stylex.props(app.stack)}
    >
      {(Object.keys(options) as T[]).map((item) => {
        const selected = item === value;
        const itemId = `${baseId}-${item}`;
        return (
          <div
            key={item}
            {...stylex.props(
              app.radioOption,
              selected && app.radioOptionSelected,
            )}
          >
            <RadioGroup.Item
              id={itemId}
              value={item}
              aria-label={options[item]}
              onFocus={() => {
                if (item !== value) onChange(item);
              }}
              {...stylex.props(app.radioDot)}
            >
              <RadioGroup.Indicator {...stylex.props(app.radioIndicator)} />
            </RadioGroup.Item>
            <label htmlFor={itemId} style={{ cursor: "pointer" }}>
              {options[item]}
              {selected ? " (Selected)" : ""}
            </label>
          </div>
        );
      })}
    </RadioGroup.Root>
  );
}

export function VisibilityRadio({
  value,
  onChange,
}: {
  value: Visibility;
  onChange: (value: Visibility) => void;
}) {
  return (
    <SentenceRadioGroup
      label="Who can see this list"
      value={value}
      options={visibilityCopy}
      onChange={onChange}
    />
  );
}

export function TimingRadio({
  value,
  onChange,
}: {
  value: TimingPhrase;
  onChange: (value: TimingPhrase) => void;
}) {
  return (
    <SentenceRadioGroup
      label="When this experience happens"
      value={value}
      options={timingCopy}
      onChange={onChange}
    />
  );
}

export function MembershipRadio({
  value,
  onChange,
}: {
  value: MembershipPhrase;
  onChange: (value: MembershipPhrase) => void;
}) {
  return (
    <SentenceRadioGroup
      label="Membership type"
      value={value}
      options={membershipCopy}
      onChange={onChange}
    />
  );
}
