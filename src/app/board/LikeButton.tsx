"use client";

import { useOptimistic, useState, useTransition } from "react";
import { likePostAction } from "@/app/actions";

export default function LikeButton({ id, likes }: { id: number; likes: number }) {
  const [optimistic, addLike] = useOptimistic(likes, (s: number) => s + 1);
  const [liked, setLiked] = useState(false);
  const [, start] = useTransition();

  return (
    <button
      type="button"
      disabled={liked}
      onClick={() => {
        setLiked(true);
        start(async () => {
          addLike(null);
          await likePostAction(id);
        });
      }}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold transition ${
        liked ? "bg-rose-100 text-brand" : "bg-cream text-muted hover:bg-rose-50 hover:text-brand"
      }`}
      aria-label="Like"
    >
      <span>{liked ? "♥" : "♡"}</span>
      {optimistic}
    </button>
  );
}
