import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ShowPrep",
    short_name: "ShowPrep",
    description: "Case-centric show planning for student crews",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f5ef",
    theme_color: "#0f766e",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
}
