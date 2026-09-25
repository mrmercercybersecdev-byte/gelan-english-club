import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-24 bg-ink text-white/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-2xl font-bold text-white">Gelan English Club</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/60">
            A welcoming community where people from all over the world practise English
            together — one conversation at a time.
          </p>
          <p className="mt-6 text-sm text-white/50">&ldquo;The limits of my language mean the limits of my world.&rdquo; — Wittgenstein</p>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gold">Explore</p>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-white" href="/learn">🧠 AI Learning Lab</Link></li>
            <li><Link className="hover:text-white" href="/speak">🎙️ Speaking Studio</Link></li>
            <li><Link className="hover:text-white" href="/meet">📹 Live rooms</Link></li>
            <li><Link className="hover:text-white" href="/chat">💬 Chat channels</Link></li>
            <li><Link className="hover:text-white" href="/leaderboard">🏆 Leaderboard</Link></li>
            <li><Link className="hover:text-white" href="/blog">📰 Blog</Link></li>
            <li><Link className="hover:text-white" href="/events">📅 Events</Link></li>
            <li><Link className="hover:text-white" href="/groups">👥 Study groups</Link></li>
            <li><Link className="hover:text-white" href="/games">🧩 Word games</Link></li>
            <li><Link className="hover:text-white" href="/announcements">📣 Announcements</Link></li>
            <li><Link className="hover:text-white" href="/submit">📤 Submit work</Link></li>
            <li><Link className="hover:text-white" href="/verify">✅ Verify certificate</Link></li>
            <li><Link className="hover:text-white" href="/board">💡 Phrase Wall</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gold">Find us</p>
          <ul className="space-y-2 text-sm">
            <li>Gelan English Club</li>
            <li><Link className="hover:text-white" href="/contact">Send a message →</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-5 text-xs text-white/40">
          <span>© {new Date().getFullYear()} Gelan English Club.</span>
          <Link href="/admin" className="hover:text-white/70">Organiser login</Link>
        </div>
      </div>
    </footer>
  );
}
