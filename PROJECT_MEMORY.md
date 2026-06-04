# PROJECT MEMORY — Control de Pedidos NHERISA 3D

> ⚠️ Este archivo es la **memoria interna del proyecto**. Debe actualizarse cada vez que se realice una mejora importante, cambio estructural, decisión técnica relevante o corrección significativa.
> **NUNCA registrar credenciales, tokens, contraseñas ni datos sensibles en este archivo.**

---

## Identificación del Proyecto

| Campo | Valor |
|---|---|
| **Nombre** | Control de Pedidos — NHERISA 3D BI |
| **Versión actual** | 5.1.1 |
| **Última actualización** | 2026-06-04 |
| **Tipo de aplicación** | Web App + Extensión Chrome (dual) |
| **Entorno** | Client-side puro (sin backend) |
| **Carpeta raíz** | `Antigravity Nherisa3d/Control de pedidos/` |
| **Carpeta de código** | `src/` |

---

## Objetivo General

Sistema de gestión de pedidos y Business Intelligence para **NHERISA 3D**, emprendimiento de impresión 3D 3D personalizada. Permite registrar, seguir y analizar pedidos mensuales, gestionar tareas pendientes de compra y diseño, y visualizar estadísticas del negocio en tiempo real — todo sin conexión a internet ni servidores externos.

---

## Arquitectura del Sistema

### Stack tecnológico
- **Frontend**: HTML5 + CSS3 + JavaScript ES6+ (Vanilla, sin frameworks)
- **Gráficos**: Chart.js v4 (archivo local en `src/assets/lib/chart.js`)
- **Tipografía**: Google Fonts — Inter (400, 500, 600, 700, 800)
- **Persistencia**: `chrome.storage.local` (extensión) con fallback a `localStorage` (web)
- **Extensión**: Chrome Manifest V3

### Modo de funcionamiento dual
La app detecta automáticamente el entorno:
```javascript
if (typeof chrome !== 'undefined' && chrome.storage) {
    // Usa chrome.storage.local
} else {
    // Usa localStorage
}
```

### Modelo de datos (estado global)
```javascript
state = {
    months: [{ id, name, notes }],
    activeMonthId: string | null,
    orders: [{ id, monthId, product, quantity, price, productionDate, deliveryDate, isProduced, isDelivered }],
    compras: [{ id, monthId, text, completed }],
    diseños: [{ id, monthId, text, completed }]
}
```
El estado completo se serializa como JSON y se guarda en una sola clave: `nherisa_state`.

---

## Estructura de Carpetas

```
Control de pedidos/
├── src/                        ← Código fuente activo
│   ├── index.html
│   ├── app.js                  ← Lógica completa (~757 líneas, monolítico — refactorizar en futuro)
│   ├── style.css
│   ├── manifest.json           ← Chrome Extension Manifest V3
│   ├── background.js           ← Service worker (abre la app al hacer clic en el ícono)
│   └── assets/
│       ├── images/
│       │   ├── nherisalogotipo.jpg
│       │   └── background.jpg
│       └── lib/
│           └── chart.js
├── docs/
│   └── architecture.md
├── backups/
│   └── v5.0_original/          ← Snapshot antes de la reorganización
├── README.md
├── CHANGELOG.md
├── ROADMAP.md
├── PROJECT_MEMORY.md           ← Este archivo
├── .gitignore
└── .env.example
```

---

## Decisiones Técnicas Importantes

| Fecha | Decisión | Motivo |
|---|---|---|
| 2026-06-04 | Mantener Vanilla JS sin frameworks | Simplicidad, sin dependencias de build, funciona offline |
| 2026-06-04 | Chart.js embebido localmente | La extensión Chrome no puede cargar scripts externos sin CSP |
| 2026-06-04 | Estado único serializado en una clave JSON | Simplicidad de persistencia; suficiente para el volumen de datos |
| 2026-06-04 | `app.js` monolítico mantenido en esta versión | Refactorizar es prioridad futura; no romper lo que funciona |
| 2026-06-04 | Inter cargada desde Google Fonts en index.html | Mejor tipografía; solo aplica en modo web (offline usa fallback sans-serif) |

---

## Funcionalidades Desarrolladas

### v5.0 (estado original)
- ✅ Gestión de meses (crear, seleccionar, eliminar)
- ✅ Registro de pedidos (producto, cantidad, precio, fechas)
- ✅ Estados de pedido: producido / entregado (checkboxes)
- ✅ Eliminación de pedidos con confirmación
- ✅ Estadísticas: ingresos del mes, total de pedidos, unidades totales
- ✅ Gráfico donut de productos más pedidos (agrupado por palabra clave en mayúscula)
- ✅ Compras pendientes por mes (agregar, completar, eliminar)
- ✅ Diseños pendientes por mes (agregar, completar, eliminar)
- ✅ Anotaciones del mes (texto libre)
- ✅ Backup manual: descarga JSON con todos los datos
- ✅ Secciones colapsables (toggle con animación)
- ✅ Diseño dark mode glassmorphism, paleta violeta (#9d4edd)
- ✅ Modal reutilizable para todos los formularios

### v5.1 (reorganización profesional)
- ✅ Estructura de proyecto profesional creada
- ✅ Bug de extensiones duplicadas corregido (`.jpg.jpg` → `.jpg`)
- ✅ Documentación completa inicializada
- ✅ Backup del estado original preservado

---

## Problemas Encontrados y Soluciones

| Fecha | Problema | Solución |
|---|---|---|
| 2026-06-04 | Imágenes con extensión `.jpg.jpg` no cargaban correctamente | Copiadas con nombre correcto `.jpg` a `assets/images/`; referencias actualizadas en HTML, CSS y manifest |
| 2026-06-04 | Proyecto sin documentación ni estructura | Reorganización completa con carpetas estándar y archivos de documentación |
| 2026-06-04 | `chart.js` en raíz del proyecto (208 KB) | Movido a `src/assets/lib/chart.js` |
| 2026-06-04 | Límites visuales en todas las secciones (800px pedidos, 250px compras/diseños, 220px scroll forzado) | `max-height` forzados a `9999px` en HTML y JS; eliminado max-height interno de contenedores |

---

## Dependencias y Herramientas

| Herramienta | Versión | Tipo | Notas |
|---|---|---|---|
| Chart.js | v4.x | Local (embebida) | `src/assets/lib/chart.js` |
| Google Fonts — Inter | — | CDN | Solo carga en modo web online |
| Chrome Extensions API | Manifest V3 | Plataforma | `chrome.storage`, `chrome.action` |
| Antigravity AI | — | Asistente de desarrollo | Google DeepMind |

---

## Seguridad

- ✅ No hay credenciales en el código ni en este archivo
- ✅ No hay peticiones a servidores externos (excepto Google Fonts en modo web)
- ✅ Todos los datos son locales del usuario
- ✅ `.env` excluido del control de versiones
- ✅ Si en el futuro se integran APIs externas, usar variables de entorno (ver `.env.example`)

---

## Próximos Pasos Recomendados

1. **Editar pedidos** — es la funcionalidad más demandada funcionalmente
2. **Notificaciones toast** — reemplazar `alert()` y `confirm()` nativos
3. **Filtros y buscador** en la tabla de pedidos
4. **Refactorizar `app.js`** en módulos cuando supere las 1000 líneas o se agreguen features complejas
5. **Importar backup** desde la interfaz (actualmente solo se puede exportar)

Ver lista completa en [ROADMAP.md](./ROADMAP.md)

---

## Notas para Continuar el Desarrollo

- El código fuente activo está en **`src/`** — siempre trabajar sobre esa carpeta
- El backup original está en `backups/v5.0_original/` — no modificar
- Antes de cambios grandes: crear backup en `backups/` con nombre descriptivo y fecha
- Actualizar **siempre** este archivo y `CHANGELOG.md` al terminar cada sesión relevante
- El estado de la app en producción vive en el navegador del usuario (localStorage/chrome.storage) — los datos no están en el repositorio
- Para probar: abrir `src/index.html` directamente en el navegador o cargar `src/` como extensión Chrome desempaquetada

---

*Última actualización: 2026-06-04 | Asistido por Antigravity AI (Google DeepMind)*
