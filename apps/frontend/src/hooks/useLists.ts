"use client";

import { useCallback, useEffect, useState } from "react";
import { getGraphQLClient } from "@/lib/graphqlClient";
import * as queries from "@/graphql/queries";
import * as mutations from "@/graphql/mutations";
import type { List } from "@/graphql/types";

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null) {
    const o = err as Record<string, unknown>;
    if (typeof o.message === "string") return o.message;
    const body = o.body as Record<string, unknown> | undefined;
    if (body?.errors && Array.isArray(body.errors)) {
      const first = body.errors[0] as { message?: string } | undefined;
      if (first?.message) return first.message;
    }
  }
  return "Failed to fetch lists";
}

export function useLists() {
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLists = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const client = getGraphQLClient();
      const result = await client.graphql({
        query: queries.listLists,
        authMode: "userPool",
      });
      const data = (result as { data?: { listLists?: List[] } }).data;
      const items = data?.listLists ?? [];
      setLists(Array.isArray(items) ? items : []);
    } catch (err) {
      const msg = getErrorMessage(err);
      if (process.env.NODE_ENV === "development") {
        const errObj = err as Record<string, unknown> | undefined;
        console.error("[useLists] fetch error:", msg, {
          name: err instanceof Error ? err.name : undefined,
          cause: err instanceof Error ? err.cause : undefined,
          body: errObj?.body,
          errors: errObj?.errors,
        });
      }
      setError(msg);
      setLists([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const createList = useCallback(async (name: string) => {
    setError(null);
    try {
      const client = getGraphQLClient();
      const result = await client.graphql({
        query: mutations.createList,
        variables: { name },
        authMode: "userPool",
      });
      const data = (result as { data?: { createList?: List } }).data;
      const newList = data?.createList;
      if (newList) {
        setLists((prev) => [...prev, newList]);
        return newList;
      }
      throw new Error("Failed to create list");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create list";
      setError(message);
      throw err;
    }
  }, []);

  const deleteList = useCallback(async (id: string) => {
    setError(null);
    try {
      const client = getGraphQLClient();
      await client.graphql({
        query: mutations.deleteList,
        variables: { id },
        authMode: "userPool",
      });
      setLists((prev) => prev.filter((list) => list.id !== id));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete list";
      setError(message);
      throw err;
    }
  }, []);

  return {
    lists,
    loading,
    error,
    createList,
    deleteList,
    refetch: fetchLists,
  };
}
