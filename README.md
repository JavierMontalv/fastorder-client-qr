# FastOrder Client QR

Frontend público para escaneo de QR, visualización de menú y creación de pedidos por mesa.

## Requisitos

- Node.js 22 (`.nvmrc`)
- npm 10+

## Variables de entorno

Usa [`.env.example`](/C:/Users/USER/fastorder-app/client-qr/.env.example) para desarrollo local y [`.env.production.example`](/C:/Users/USER/fastorder-app/client-qr/.env.production.example) para producción.

Claves:

- `VITE_API_URL`: base de la API. Acepta `http://host:4000/api` o `/api`.
- `VITE_ASSETS_URL`: base para imágenes públicas. Déjalo vacío si los assets salen del mismo dominio.
- `VITE_VAPID_PUBLIC_KEY`: clave pública para push notifications.

## Desarrollo

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy

Este proyecto ya quedó preparado para SPA fallback en:

- Vercel: [`vercel.json`](/C:/Users/USER/fastorder-app/client-qr/vercel.json)
- Apache: [`public/.htaccess`](/C:/Users/USER/fastorder-app/client-qr/public/.htaccess)
- Netlify: [`public/_redirects`](/C:/Users/USER/fastorder-app/client-qr/public/_redirects)

### Vercel

Configura:

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`
- Root directory: repo root

Variables recomendadas en producción:

```env
VITE_API_URL=/api
VITE_ASSETS_URL=
VITE_VAPID_PUBLIC_KEY=
```

### Ubuntu + Nginx/Apache

1. `npm ci`
2. `npm run build`
3. Publica el contenido de `dist/`
4. Si usas Apache, habilita `mod_rewrite` y `AllowOverride All`
5. Si usas Nginx, configura fallback SPA a `index.html`
6. Expón `/api` hacia el backend real con proxy inverso

Ejemplo de bloque Nginx:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}

location /api/ {
  proxy_pass http://127.0.0.1:4000/api/;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```
