import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Verify a certificate" };

async function lookup(fd: FormData) {
  "use server";
  const code = String(fd.get("code") ?? "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20);
  if (code) redirect(`/verify/${code}`);
}

export default function VerifyIndex() {
  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <p className="text-6xl">🔏</p>
      <h1 className="mt-4 font-display text-4xl font-bold">Verify a Gelan English Club certificate</h1>
      <p className="mt-3 text-muted">Enter the verification code (e.g. <code className="rounded bg-paper px-1.5">WEC-ABCD-2345</code>) to confirm a member&apos;s work was reviewed and approved by our organisers.</p>
      <form action={lookup} className="mx-auto mt-8 flex max-w-md gap-2">
        <input name="code" required placeholder="WEC-XXXX-XXXX" className="input font-mono uppercase tracking-widest" maxLength={20} />
        <button className="btn-primary shrink-0">Verify</button>
      </form>
    </div>
  );
}
