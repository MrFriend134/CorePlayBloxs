# CorePlayBlox

Prototipo funcional de una plataforma inspirada en Roblox: una sola aplicación web con menú principal, juegos 3D multijugador en tiempo real, editor de mapas, avatar, catálogo, economía (Robux) y códigos de canje.

## Requisitos

- Node.js 18+
- npm

## Instalación y ejecución

1. **Instalar dependencias del servidor**
   ```bash
   npm install
   ```

2. **Instalar dependencias del cliente** (incluye fengari para Lua en el editor)
   ```bash
   cd client && npm install && cd ..
   ```

3. **Modo desarrollo** (servidor + cliente)
   ```bash
   npm run dev
   ```
   Abre **http://localhost:5173**. El proxy de Vite redirige `/api` y `/socket.io` al servidor (puerto 3001).

4. **Modo producción** (una sola app servida por Express)
   ```bash
   npm run build
   npm start
   ```
   Abre **http://localhost:3000**. El servidor sirve el build del cliente y la API/WebSockets en el mismo puerto.

## Funcionalidades

- **Menú principal**: Estética verde CorePlayBlox, buscador de juegos y jugadores, login/registro, ajustes, amigos.
- **Juegos 3D**: Tres juegos preconstruidos (Obby Park, Tag, City Lobby) con entorno 3D (Three.js), multijugador en tiempo real vía WebSockets y chat del servidor.
- **Avatar**: Personalización de color de piel; accesorios se compran en el catálogo.
- **Catálogo**: Tienda de accesorios con moneda virtual (Robux).
- **Robux y códigos**: Panel de saldo y canje de códigos. Códigos de prueba:
  - `MRFLOWERS` → 3.000
  - `MrFriend` → 10.000
  - `TheBestDev` → 200.000
  - `pepiato123` → 400.000.000
  - `Dell` → 10.000.000.000.000
  - `OSFTHEBEST` → 90
- **Admin**: En Ajustes, código secreto `coreplayblox-admin-secret` desbloquea la consola para setear Robux a cualquier usuario.
- **Editor Lua**: En el editor de mapas, panel "Lua (lógica)" con **▶ Ejecutar Lua**: se ejecuta Lua 5.3 (fengari) en el navegador; `print()` se muestra en la consola bajo el editor.

## Controles en juego

- **W / S**: Avanzar / Retroceder  
- **A / D**: Girar  
- Chat: escribe en el cuadro inferior y Enviar.

## Estructura

- `server/`: Express, Socket.io, rutas auth, economy, admin, users, games; store en JSON en `server/data/`.
- `client/`: React + Vite, páginas MainMenu, GameView, Editor; componentes de login, avatar, catálogo, Robux, admin.
