# CHANGELOG — Control de Pedidos NHERISA 3D

Todos los cambios importantes del proyecto están documentados en este archivo.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).

---

## [5.1.1] — 2026-06-04

### Corregido
- **Límites eliminados en todas las secciones**: pedidos, compras pendientes, diseños pendientes, productos más pedidos y anotaciones ahora crecen de forma ilimitada
- `max-height` de `orders-table-wrapper` ampliado de `800px` → `9999px` (ilimitado)
- `max-height` de `compras-wrapper` y `diseños-wrapper` ampliados de `250px` → `9999px`
- Eliminado el `max-height: 220px` interno de los contenedores de compras y diseños (ya no se cortan ni tienen scroll forzado)
- `max-height` de `products-wrapper` y `notes-wrapper` ampliados de `300px` → `9999px`
- Toggles de colapso/expansión en `app.js` actualizados con los nuevos valores consistentes

---

## [5.1.0] — 2026-06-04

### Agregado
- Estructura profesional del proyecto (carpetas `src/`, `docs/`, `backups/`)
- Archivo `README.md` con descripción completa del proyecto
- Archivo `CHANGELOG.md` (este archivo)
- Archivo `ROADMAP.md` con próximas mejoras planificadas
- Archivo `PROJECT_MEMORY.md` como memoria interna del proyecto
- Archivo `.gitignore` con exclusiones de seguridad
- Archivo `.env.example` para documentar variables de entorno futuras
- Archivo `docs/architecture.md` con descripción técnica de la arquitectura
- Fuente **Inter** cargada desde Google Fonts (antes implícita, ahora explícita)
- Meta description en `index.html` para SEO básico

### Corregido
- **Bug crítico**: nombres de imágenes con extensión duplicada (`.jpg.jpg`) corregidos a `.jpg`
- Rutas de imágenes actualizadas en `index.html`, `style.css` y `manifest.json`
- Ruta de `chart.js` actualizada a `assets/lib/chart.js`
- Ruta del logo actualizada en `manifest.json`
- Versión del manifiesto actualizada de `5.0` a `5.1`

### Infraestructura
- Backup completo del estado original en `backups/v5.0_original/`
- Código fuente migrado a `src/` con organización modular de assets

---

## [5.0.0] — (fecha original desconocida)

### Estado inicial del proyecto
- Dashboard completo con sidebar de gestión de meses
- Tabla de pedidos con campos: producto, cantidad, precio, producción, entrega
- Estadísticas: ingresos del mes, total de pedidos, unidades
- Gráfico donut de productos más pedidos (Chart.js)
- Sección de compras pendientes con checkboxes
- Sección de diseños pendientes con checkboxes
- Anotaciones del mes (textarea libre)
- Backup manual de datos en JSON
- Persistencia dual: `chrome.storage` + `localStorage` fallback
- Diseño dark mode con paleta violeta/púrpura glassmorphism
- Compatible como extensión Chrome v3 y como web app standalone
