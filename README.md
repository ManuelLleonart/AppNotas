# AppNotas

App instalable para movil hecha con React y Vite. Organiza tareas ciclicas por zonas de la casa y funciona tambien sin conexion.

## Arranque local

```bash
npm install
npm run dev -- --host
```

Abre en tu movil la URL que muestre Vite mientras ambos dispositivos estan en la misma red.

## Publicar en Vercel

1. Sube esta carpeta a un repositorio en GitHub.
2. Entra en Vercel y crea un proyecto importando ese repositorio.
3. Vercel detectara Vite automaticamente.
4. Usa estos valores si te los pide:

```text
Build Command: npm run build
Output Directory: dist
```

Al terminar, abre la URL publica desde el movil y usa la opcion de instalar app.

## Publicar en Netlify

1. Sube esta carpeta a un repositorio en GitHub.
2. Entra en Netlify y crea un sitio nuevo desde ese repositorio.
3. Usa estos valores:

```text
Build Command: npm run build
Publish Directory: dist
```

El archivo `netlify.toml` ya deja configurado el despliegue.

## Instalar en el telefono

- Android con Chrome: abre la web publicada y pulsa `Instalar app`.
- iPhone con Safari: abre la web publicada y usa `Compartir > Añadir a pantalla de inicio`.

## Archivos importantes

- `src/App.jsx`: logica principal de la app
- `src/styles.css`: interfaz optimizada para movil
- `public/manifest.webmanifest`: metadatos de instalacion
- `public/sw.js`: soporte offline
- `vercel.json` y `netlify.toml`: despliegue listo para publicar
