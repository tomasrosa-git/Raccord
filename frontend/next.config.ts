import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],

    // Un año. Las URLs de TMDB llevan el hash del archivo en el nombre: si la
    // imagen cambia, cambia la URL. No hay nada que revalidar, y el default
    // (4 h) hace que la instancia re-optimice todo el catálogo cada 4 horas.
    minimumCacheTTL: 31536000,

    // Anchos que la app realmente pide. Los slots chicos son 44/48/56 px
    // (avatares, mini pósters) y los medianos 160/180 px (pósters, fotos de
    // perfil); estos cubren 1x–3x de todos. Menos variantes = menos trabajo de
    // optimización y mayor tasa de acierto en el caché de Next y de Cloudflare.
    imageSizes: [64, 96, 128, 256, 384],

    // El único slot full-width es el backdrop del hero (1152 px). Se sacan
    // 2048 y 3840: nunca se piden, pero eran el `src` de fallback de cada
    // <img>, y bastaba un navegador sin srcset para pedirle al server una
    // imagen de 3840 px.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
};

export default nextConfig;
