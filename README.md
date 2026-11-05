# Mynted · Frontend

Aplicación web de **Mynted**: marketplace y foro para coleccionistas de nicho, con comunidades por franquicia, chat 1 a 1 con vendedores, compras con pasarela simulada, insignias y Mynted Pro. Proyecto final del curso EIF-409 Aplicaciones Informáticas Globales (UNA, II ciclo 2026).

Backend: <https://github.com/KarinaMD16/mynted-backend>

## Qué incluye

- Comunidades públicas y privadas, foro con respuestas anidadas, votos y favoritos
- Marketplace con filtros, reseñas y reputación del vendedor
- Chat en tiempo real y notificaciones
- Checkout con pasarela simulada, seguimiento del pedido y reclamos
- Mynted Pro, insignias, panel de moderación y panel de administración
- Interfaz en 6 idiomas (español, inglés, alemán, francés, portugués y coreano) y precios en 16 monedas

## Tecnologías

React 19 · Vite · TypeScript · TanStack Router y Query · Tailwind CSS · React Aria Components · Zod · Socket.IO (cliente)

## Requisitos

- Node.js 20 o superior y npm
- El [backend](https://github.com/KarinaMD16/mynted-backend) corriendo en `http://localhost:3000`

## Instalación y ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar las variables de entorno
cp .env.example .env        # en Windows: copy .env.example .env

# 3. Levantar el servidor de desarrollo
npm run dev
```

La app queda en **http://localhost:5173**. Ese puerto debe mantenerse, porque el backend solo permite CORS desde esa dirección.

### Variables de entorno

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL del backend. Por defecto `http://localhost:3000` |
| `VITE_GOOGLE_CLIENT_ID` | Opcional. Debe ser el mismo `GOOGLE_CLIENT_ID` del backend. Vacío desactiva el botón de Google |
| `VITE_FACEBOOK_APP_ID` | Opcional. Debe ser el mismo `FACEBOOK_APP_ID` del backend. Vacío desactiva el botón de Facebook |

## Probar la aplicación

1. Levanta primero el backend y carga los datos de ejemplo (ver el README del backend, sección *Datos de ejemplo*).
2. Abre <http://localhost:5173>.
3. Inicia sesión con un usuario sembrado, por ejemplo `twilightbuns` (vendedor) o `lunadreamer`, con contraseña `Test1234`; o crea una cuenta nueva.
4. Pago simulado: usa la tarjeta `4242 4242 4242 4242` (cualquier vencimiento futuro y CVV).

El recorrido completo, con capturas de cada rol, está en el **Manual de usuario**: [`manual/Manual-de-usuario-Mynted.pdf`](manual/Manual-de-usuario-Mynted.pdf).

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga |
| `npm run build` | Compila TypeScript y genera la versión de producción en `dist/` |
| `npm run preview` | Sirve la versión compilada localmente |
| `npm run lint` | Revisa el código con ESLint |

## Estructura

```
src/
  features/     Módulos por área: auth, community, products, chat, payments,
                notifications, profile, settings, admin, pro, badges, search...
  components/   Componentes reutilizables y layout
  i18n/         Traducciones (es, en, de, fr, pt, ko)
  api/          Cliente HTTP
  router.tsx    Rutas de la aplicación
manual/         Manual de usuario (PDF y scripts con los que se generó)
docs/           Notas técnicas del frontend
```

## Autoría

Karina Moreno, Elein Rodríguez, Orlando Baltodano y Axel Badilla, 2026.
