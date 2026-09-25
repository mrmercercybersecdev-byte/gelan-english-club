"use client";

import { useFormStatus } from "react-dom";
import type { FormState } from "@/app/actions";

export function SubmitButton({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`btn-primary ${className}`}>
      {pending ? "Sending…" : children}
    </button>
  );
}

export function FormNotice({ state }: { state: FormState }) {
  if (!state) return null;
  return (
    <div
      role="status"
      className={`rounded-xl px-4 py-3 text-sm font-medium ${
        state.ok ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200" : "bg-rose-50 text-rose-900 ring-1 ring-rose-200"
      }`}
    >
      {state.ok ? "✓ " : "⚠ "}
      {state.message}
    </div>
  );
}
