import type { NextConfig } from "next";

// Cabeçalhos de segurança enviados em todas as respostas.
const securityHeaders = [
  // O navegador não "adivinha" o tipo do arquivo (evita certos ataques de upload).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Ninguém pode colocar o sistema dentro de outro site (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Links externos recebem só o endereço de origem, nunca o caminho completo
  // (o caminho da pesquisa de satisfação contém o link secreto).
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // O sistema não usa câmera, microfone nem localização.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
