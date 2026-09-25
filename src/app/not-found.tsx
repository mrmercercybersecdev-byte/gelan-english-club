import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <p className="font-display text-7xl font-bold text-brand">404</p>
      <h1 className="mt-4 font-display text-3xl font-bold">Lost for words?</h1>
      <p className="mt-3 text-muted">
        We couldn&apos;t find that page. Perhaps it went <em>out of the blue</em> — or it never existed.
      </p>
      <Link href="/" className="btn-primary mt-8">Back to the homepage</Link>
    </div>
  );
}
