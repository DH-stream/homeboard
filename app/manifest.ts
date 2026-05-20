import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HomeBoard",
    short_name: "HomeBoard",
    description: "A self-hostable family wall calendar and task dashboard.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#fbf7ef",
    theme_color: "#fbf7ef",
    icons: [
      {
        src: "/icons/homeboard-icon-day-1024.png",
        sizes: "1024x1024",
        type: "image/png",
      },
      {
        src: "/icons/homeboard-icon-day-1024.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
