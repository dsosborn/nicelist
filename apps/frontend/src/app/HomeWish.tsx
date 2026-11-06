"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as stylex from "@stylexjs/stylex";
import { useAuth } from "@/hooks/useAuth";
import { homeStyles } from "./homeStyles";

const EXAMPLES = [
  { label: "A product link", value: "https://" },
  { label: "The navy sweater", value: "The navy sweater at the shop on Oak" },
  { label: "White Sox tickets", value: "White Sox tickets" },
  { label: "The zoo membership", value: "The zoo membership" },
];

export function HomeWish() {
  const router = useRouter();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [wish, setWish] = useState("");
  const [error, setError] = useState("");

  function chooseExample(value: string) {
    setWish(value);
    setError("");
    inputRef.current?.focus();
  }

  function startList(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = wish.trim();
    if (!trimmed || trimmed === "https://") {
      setError("Paste a link or describe what you want.");
      inputRef.current?.focus();
      return;
    }
    sessionStorage.setItem("nicelist-wish", trimmed);
    const next = user ? "/list" : "/signup";
    router.push(`${next}?wish=${encodeURIComponent(trimmed)}`);
  }

  return (
    <>
      <form onSubmit={startList} {...stylex.props(homeStyles.field)}>
        <label htmlFor="wish" {...stylex.props(homeStyles.label)}>
          Paste a link, or describe what you want
        </label>
        <input
          ref={inputRef}
          id="wish"
          name="wish"
          value={wish}
          placeholder="Paste a link, or describe what you want"
          autoComplete="off"
          onChange={(event) => {
            setWish(event.target.value);
            setError("");
          }}
          {...stylex.props(homeStyles.input)}
        />
        <button type="submit" {...stylex.props(homeStyles.submit)}>
          Start a list
        </button>
      </form>
      {error ? <p {...stylex.props(homeStyles.error)}>{error}</p> : null}
      <ul {...stylex.props(homeStyles.examples)}>
        {EXAMPLES.map((example) => (
          <li key={example.label}>
            <button
              type="button"
              onClick={() => chooseExample(example.value)}
              {...stylex.props(homeStyles.example)}
            >
              {example.label}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
