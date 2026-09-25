export const ANNOUNCE_STYLES: Record<string, { label: string; icon: string; chip: string; bar: string; banner: string }> = {
  news: { label: "News", icon: "📰", chip: "bg-sky-100 text-sky-900", bar: "from-sky-400 to-blue-600", banner: "from-sky-600 via-blue-600 to-indigo-600" },
  event: { label: "Event", icon: "📅", chip: "bg-violet-100 text-violet-900", bar: "from-violet-400 to-fuchsia-600", banner: "from-violet-600 via-fuchsia-600 to-pink-600" },
  urgent: { label: "Urgent", icon: "⚠️", chip: "bg-rose-100 text-rose-900", bar: "from-rose-500 to-red-700", banner: "from-red-700 via-rose-600 to-orange-600" },
  update: { label: "Update", icon: "✨", chip: "bg-emerald-100 text-emerald-900", bar: "from-emerald-400 to-teal-600", banner: "from-emerald-600 via-teal-600 to-cyan-700" },
  celebration: { label: "Celebration", icon: "🎉", chip: "bg-amber-100 text-amber-900", bar: "from-amber-300 to-orange-500", banner: "from-amber-500 via-orange-500 to-rose-500" },
};
