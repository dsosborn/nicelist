"use client";

import { useCallback, useEffect, useState } from "react";
import { getGraphQLClient } from "@/lib/graphqlClient";
import * as queries from "@/graphql/queries";
import * as mutations from "@/graphql/mutations";
import type { TodoItem } from "@/graphql/types";
import { useAuth } from "@/hooks/useAuth";

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
  return "Failed to fetch todos";
}

export function useListTodos(listId: string | null) {
  const { user } = useAuth();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTodos = useCallback(async () => {
    if (!listId) {
      setTodos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const client = getGraphQLClient();
      const result = await client.graphql({
        query: queries.listTodoItems,
        variables: { listId },
        authMode: "userPool",
      });
      const data = (result as { data?: { listTodoItems?: TodoItem[] } }).data;
      const items = data?.listTodoItems ?? [];
      setTodos(Array.isArray(items) ? items : []);
    } catch (err) {
      const msg = getErrorMessage(err);
      if (process.env.NODE_ENV === "development") {
        const errObj = err as Record<string, unknown> | undefined;
        console.error("[useListTodos] fetch error:", msg, {
          name: err instanceof Error ? err.name : undefined,
          cause: err instanceof Error ? err.cause : undefined,
          body: errObj?.body,
          errors: errObj?.errors,
        });
      }
      setError(
        msg === "Unauthorized"
          ? "This list wasn't found or you don't have permission to view it."
          : msg
      );
      setTodos([]);
    } finally {
      setLoading(false);
    }
  }, [listId]);

  useEffect(() => {
    if (user && listId) {
      fetchTodos();
    } else if (!listId) {
      setTodos([]);
      setLoading(false);
    }
  }, [fetchTodos, user, listId]);

  const addTodo = useCallback(
    async (title: string) => {
      if (!listId) return;
      setError(null);
      try {
        const client = getGraphQLClient();
        const result = await client.graphql({
          query: mutations.createTodoItem,
          variables: { listId, title },
          authMode: "userPool",
        });
        const data = (result as { data?: { createTodoItem?: TodoItem } }).data;
        const newTodo = data?.createTodoItem;
        if (newTodo) {
          setTodos((prev) => [...prev, newTodo]);
          return newTodo;
        }
        throw new Error("Failed to add todo");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to add todo";
        setError(message);
        throw err;
      }
    },
    [listId]
  );

  const toggleTodo = useCallback(
    async (id: string, completed: boolean) => {
      if (!listId) return;
      setError(null);
      try {
        const client = getGraphQLClient();
        const result = await client.graphql({
          query: mutations.updateTodoItem,
          variables: { listId, id, completed },
          authMode: "userPool",
        });
        const data = (result as { data?: { updateTodoItem?: TodoItem } }).data;
        const updated = data?.updateTodoItem;
        if (updated) {
          setTodos((prev) =>
            prev.map((t) => (t.id === id ? updated : t))
          );
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update todo";
        setError(message);
        throw err;
      }
    },
    [listId]
  );

  const removeTodo = useCallback(
    async (id: string) => {
      if (!listId) return;
      setError(null);
      try {
        const client = getGraphQLClient();
        await client.graphql({
          query: mutations.deleteTodoItem,
          variables: { listId, id },
          authMode: "userPool",
        });
        setTodos((prev) => prev.filter((t) => t.id !== id));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to delete todo";
        setError(message);
        throw err;
      }
    },
    [listId]
  );

  return {
    todos,
    loading,
    error,
    addTodo,
    toggleTodo,
    removeTodo,
    refetch: fetchTodos,
  };
}
