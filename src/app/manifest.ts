import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gelan English Club",
    short_name: "Gelan",
    description: "Speak English with confidence — live rooms, AI tutors, games, groups and meetups.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf7f0",
    theme_color: "#061435",
    icons: [{ src: "/images/gelan-english-club-logo.jpeg", sizes: "any", type: "image/jpeg" }],
  };
}
