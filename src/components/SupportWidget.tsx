"use client";

import Link from "next/link";
import Icon from "@/components/Icon";

export default function SupportWidget() {
  return (
    <div className="fixed bottom-5 right-5 z-50">
      <Link
        href="/help"
        className="group inline-flex items-center gap-3 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white shadow-2xl ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-brand"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-gold transition group-hover:bg-white/20">
          <Icon name="help" size={17} />
        </span>
        Help & support
      </Link>
    </div>
  );
}
