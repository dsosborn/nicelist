"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { GiftForm } from "@/components/GiftForm";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuthContext } from "@/context/AuthContext";
import { addGift, fetchMyLists, previewProduct, type ListSummary } from "@/lib/api";

function AddBody() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, loading } = useAuthContext();
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [listId, setListId] = useState("");
  const shared =
    params.get("url") ||
    params.get("text") ||
    params.get("title") ||
    "";
  const url = /^https?:\/\//i.test(shared.trim()) ? shared.trim() : "";

  useEffect(() => {
    if (loading || !user) return;
    void fetchMyLists().then((next) => {
      const editable = next.filter((item) => !item.readOnly && !item.revealedAt);
      setLists(editable);
      const own = editable.find((item) => item.recipientId === user.userId) ?? editable[0];
      if (own) setListId(own.id);
    });
  }, [loading, user]);

  return (
    <>
      <AppHeader />
      <main>
        <h1>Add a gift</h1>
        <label htmlFor="add-list">List</label>
        <select
          id="add-list"
          value={listId}
          onChange={(event) => setListId(event.target.value)}
        >
          {lists.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        {listId ? (
          <GiftForm
            initialUrl={url}
            onPreview={previewProduct}
            onAdd={async (input) => {
              await addGift(listId, input);
              router.push(`/list?id=${listId}`);
            }}
          />
        ) : (
          <p>Create a list first.</p>
        )}
      </main>
    </>
  );
}

export default function AddPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<p>Loading…</p>}>
        <AddBody />
      </Suspense>
    </ProtectedRoute>
  );
}
