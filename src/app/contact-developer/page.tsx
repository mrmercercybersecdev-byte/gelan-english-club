import type { Metadata } from "next";
import ContactForm from "../contact/ContactForm";

export const metadata: Metadata = { title: "Contact the developer" };

export default function ContactDeveloperPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="self-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">Contact the developer</p>
        <h1 className="mt-2 font-display text-5xl font-bold leading-tight">Ideas, feedback, or a bug to report?</h1>
        <p className="mt-5 text-lg text-muted">
          Send a note about the Gelan English Club website or learning tools. Your message will be delivered to the club organisers for follow-up.
        </p>
        <div className="mt-7 rounded-2xl bg-brand/10 p-5 text-sm leading-relaxed text-ink">
          Please don&apos;t include passwords, API keys, or other private credentials in your message.
        </div>
      </div>
      <div className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-black/5 md:p-9">
        <ContactForm defaultSubject="Developer contact" />
      </div>
    </div>
  );
}
