import type { Metadata } from "next";
import ContactForm from "./ContactForm";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">Get in touch</p>
        <h1 className="mt-2 font-display text-5xl font-bold leading-tight">We&apos;d love to hear from you</h1>
        <p className="mt-5 text-lg text-muted">
          Questions about events, volunteering, partnerships or anything else? Drop us a line.
        </p>
        <div className="mt-10 space-y-4">
          {[
            ["🙋", "Volunteering", "Native & fluent speakers always welcome"],
          ].map(([icon, k, v]) => (
            <div key={k} className="flex items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-black/5">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-cream text-xl">{icon}</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">{k}</p>
                <p className="font-medium">{v}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-black/5 md:p-9">
        <ContactForm />
      </div>
    </div>
  );
}
