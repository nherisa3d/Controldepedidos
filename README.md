# Control de Pedidos — NHERISA 3D BI

> Sistema de gestión de pedidos y Business Intelligence para **NHERISA 3D**, emprendimiento de impresión 3D.

---

## ¿Qué es este proyecto?

**Control de Pedidos** es una aplicación web / extensión de Chrome que permite gestionar de forma visual y ordenada:

- 📋 **Pedidos mensuales** — producto, cantidad, precio, fechas de producción y entrega
- 📊 **Estadísticas en tiempo real** — ingresos del mes, total de pedidos y unidades
- 🛒 **Compras pendientes** — lista de materiales o insumos a comprar
- 🎨 **Diseños pendientes** — lista de diseños a preparar
- 📈 **Gráfico de productos más pedidos** — visual tipo donut por mes
- 📝 **Anotaciones del mes** — notas libres por período
- 💾 **Backup manual** — descarga del estado completo en JSON

---

## Tecnologías utilizadas

| Herramienta | Uso |
|---|---|
| HTML5 + CSS3 | Estructura e interfaz |
| JavaScript (Vanilla ES6+) | Lógica de la aplicación |
| Chart.js v4 | Gráficos de productos |
| Chrome Storage API | Persistencia como extensión |
| localStorage | Persistencia como web app standalone |
| Google Fonts (Inter) | Tipografía del sistema |

---

## Estructura del proyecto

```
Control de pedidos/
├── src/                        ← Código fuente principal
│   ├── index.html              ← Interfaz principal
│   ├── app.js                  ← Lógica de la aplicación
│   ├── style.css               ← Estilos (dark mode, paleta violeta)
│   ├── manifest.json           ← Manifiesto extensión Chrome v3
│   ├── background.js           ← Service worker Chrome
│   └── assets/
│       ├── images/             ← Recursos gráficos
│       │   ├── nherisalogotipo.jpg
│       │   └── background.jpg
│       └── lib/
│           └── chart.js        ← Librería Chart.js (local)
│
├── docs/                       ← Documentación técnica
│   └── architecture.md
│
├── backups/                    ← Snapshots y respaldos
│   └── v5.0_original/          ← Estado original antes de reorganizar
│
├── .gitignore
├── .env.example
├── README.md                   ← Este archivo
├── CHANGELOG.md
├── ROADMAP.md
└── PROJECT_MEMORY.md
```

---

## Cómo usar

### Opción A — Como página web (recomendado para desarrollo)

1. Abrí `src/index.html` directamente en el navegador
2. La app usa `localStorage` automáticamente para guardar los datos

### Opción B — Como extensión de Chrome

1. Abrí Chrome y andá a `chrome://extensions/`
2. Activá el **Modo desarrollador** (toggle arriba a la derecha)
3. Hacé clic en **"Cargar desempaquetada"**
4. Seleccioná la carpeta `src/`
5. La extensión aparece en la barra de herramientas

---

## Backup de datos

Hacé clic en **💾 Descargar Respaldo** en el sidebar para exportar todos tus datos como archivo JSON. Guardalo en la carpeta `backups/` con la fecha correspondiente.

---

## Seguridad

- Este proyecto no usa backend ni envía datos a servidores externos
- Todos los datos se almacenan localmente en el navegador
- No hay credenciales ni API keys en el código
- Ver `.env.example` para variables de entorno de futuras integraciones

---

## Historial de versiones

Ver [CHANGELOG.md](./CHANGELOG.md)

## Próximas mejoras

Ver [ROADMAP.md](./ROADMAP.md)

---

*Proyecto desarrollado y mantenido con asistencia de **Antigravity AI** (Google DeepMind).*
