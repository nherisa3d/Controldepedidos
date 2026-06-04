# ROADMAP — Control de Pedidos NHERISA 3D

Tareas pendientes, mejoras planificadas y visión futura del proyecto.
Las prioridades pueden cambiar según las necesidades del negocio.

---

## 🔥 Alta Prioridad (próximas mejoras)

- [ ] **Editar pedidos existentes** — actualmente solo se pueden eliminar, no editar
- [ ] **Filtros en la tabla de pedidos** — por estado (producido / entregado / pendiente)
- [ ] **Buscador de pedidos** — buscar por nombre de producto o fecha
- [ ] **Ordenamiento de tabla** — ordenar por fecha, precio, cantidad
- [ ] **Validación mejorada de formularios** — mensajes de error inline, no alerts del navegador

---

## 📊 Mejoras de BI y estadísticas

- [ ] **Gráfico de ingresos por mes** — línea temporal comparativa entre meses
- [ ] **Estadística de ticket promedio** — precio promedio por pedido
- [ ] **Estadística de tiempo promedio de entrega** — días entre producción y entrega
- [ ] **Vista de pedidos pendientes de entrega** — filtro rápido de pedidos no entregados
- [ ] **Comparativa mensual** — comparar ingresos y pedidos entre dos meses seleccionados

---

## 🗂️ Gestión de datos

- [ ] **Importar backup** — poder restaurar un archivo JSON de respaldo desde la interfaz
- [ ] **Exportar a CSV/Excel** — exportar la tabla de pedidos del mes seleccionado
- [ ] **Confirmación antes de eliminar mes** — modal de confirmación más descriptivo
- [ ] **Archivar meses** — marcar meses como "archivados" sin eliminarlos

---

## 🎨 Mejoras de interfaz y UX

- [ ] **Modo responsivo / mobile** — adaptar el layout para tablets y celulares
- [ ] **Animaciones de entrada** — fade-in en tarjetas al cargar el dashboard
- [ ] **Notificaciones toast** — reemplazar `alert()` y `confirm()` nativos por notificaciones visuales
- [ ] **Tema claro opcional** — toggle de modo oscuro/claro
- [ ] **Indicadores de estado en tabla** — badges de color según estado del pedido

---

## 🏗️ Mejoras técnicas y de código

- [ ] **Refactorizar `app.js`** — separar en módulos: `state.js`, `render.js`, `events.js`, `utils.js`
- [ ] **Sistema de configuración** — permitir cambiar moneda, idioma de fechas, etc.
- [ ] **Tests básicos** — validar funciones críticas de cálculo y formato
- [ ] **Actualizar Chart.js** — evaluar si conviene CDN o bundler en lugar de archivo local
- [ ] **Migrar a módulos ES6** — usar `import/export` para mejor organización

---

## 🔌 Integraciones futuras (largo plazo)

- [ ] **Sincronización con Google Sheets** — exportar pedidos a una hoja de cálculo automáticamente
- [ ] **Notificaciones de pedidos próximos** — alerta cuando la fecha de entrega se acerca
- [ ] **Multi-usuario** — soporte para acceso desde distintos dispositivos (requeriría backend)

---

## ✅ Completado

- [x] Dashboard completo con sidebar, tabla de pedidos, gráfico y listas de tareas (v5.0)
- [x] Persistencia dual chrome.storage / localStorage (v5.0)
- [x] Backup manual en JSON (v5.0)
- [x] Estructura profesional del proyecto (v5.1)
- [x] Corrección de bug de extensiones duplicadas en imágenes (v5.1)
- [x] Documentación inicial: README, CHANGELOG, ROADMAP, PROJECT_MEMORY (v5.1)
