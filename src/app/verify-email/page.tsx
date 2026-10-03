import type { Metadata } from "next";
import { confirmEmailAction } from "@/app/user-actions";

export const metadata: Metadata = {
  title: "Confirm your email",
  robots: { index: false, follow: false },
};

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const validToken = /^[a-f0-9]{64}$/.test(token);

  return (
    <section className="mx-auto flex min-h-[65vh] max-w-xl items-center px-4 py-12 sm:px-5">
      <div className="w-full rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">Gelan English Club</p>
        <h1 className="mt-3 font-display text-3xl font-bold">Confirm your email</h1>
        {validToken ? (
          <>
            <p className="mt-3 text-muted">Confirm your email address to activate your account. This link expires after 24 hours.</p>
            <form action={confirmEmailAction} className="mt-7">
              <input type="hidden" name="token" value={token} />
              <button className="btn-primary">Confirm my email</button>
            </form>
          </>
        ) : (
          <>
            <p className="mt-3 text-muted">This confirmation link is missing or invalid. Request a new confirmation email from the sign-in page.</p>
            <a href="/login" className="btn-primary mt-7 inline-flex">Go to sign in</a>
          </>
        )}
      </div>
    </section>
  );
}
