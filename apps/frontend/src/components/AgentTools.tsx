"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { registerNicelistTools, subscribeChildSafe } from "@/lib/webmcp";

export function AgentTools() {
  const { user, loading } = useAuth();
  const params = useSearchParams();
  const token = params.get("t");
  const [childSafe, setChildSafe] = useState(false);

  useEffect(() => subscribeChildSafe(setChildSafe), []);

  useEffect(() => {
    if (loading) return;
    const controller = new AbortController();
    registerNicelistTools(controller.signal, {
      signedIn: !!user,
      childSafe,
      shareToken: token,
    });
    return () => controller.abort();
  }, [user, loading, childSafe, token]);

  return null;
}
