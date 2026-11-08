// Estado de la aplicación
let state = {
    months: [],
    activeMonthId: null,
    orders: [],
    compras: [],
    diseños: [],
    settings: {
        primaryColor: '#6A4C93',
        backgroundImage: null,
        profileImage: null
    }
};

function applySettings() {
    if (state.settings) {
        if (state.settings.primaryColor) {
            const hex = state.settings.primaryColor;
            document.documentElement.style.setProperty('--primary', hex);
            
            let r = parseInt(hex.slice(1, 3), 16) || 106;
            let g = parseInt(hex.slice(3, 5), 16) || 76;
            let b = parseInt(hex.slice(5, 7), 16) || 147;
            
            document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
            
            let hr = Math.min(255, Math.floor(r * 1.2));
            let hg = Math.min(255, Math.floor(g * 1.2));
            let hb = Math.min(255, Math.floor(b * 1.2));
            document.documentElement.style.setProperty('--primary-hover', `rgb(${hr}, ${hg}, ${hb})`);
        }
        if (state.settings.backgroundImage) {
            document.body.style.backgroundImage = `url('${state.settings.backgroundImage}')`;
        }
        if (state.settings.profileImage) {
            const logo = document.getElementById('main-logo');
            if (logo) logo.src = state.settings.profileImage;
        }
    }
}

// Cargar estado de forma asíncrona usando chrome.storage o localStorage
async function loadState() {
    try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            const result = await chrome.storage.local.get(['nherisa_state']);
            if (result.nherisa_state) {
                state = JSON.parse(result.nherisa_state);
            }
        } else {
            const savedState = localStorage.getItem('nherisa_state');
            if (savedState) {
                state = JSON.parse(savedState);
            }
        }
        // Asegurar que existan las listas de compras y diseños
        if (!state.compras) state.compras = [];
        if (!state.diseños) state.diseños = [];
        if (!state.settings) state.settings = { primaryColor: '#6A4C93', backgroundImage: null, profileImage: null };
    } catch (e) {
        console.error("Error al cargar datos:", e);
    }
}

// Guardar estado
function saveState() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ 'nherisa_state': JSON.stringify(state) });
    } else {
        localStorage.setItem('nherisa_state', JSON.stringify(state));
    }
}

// Variables de control de filtros, búsqueda y ordenamiento
let currentFilter = 'all'; // 'all' | 'pending' | 'produced' | 'delivered'
let searchQuery = '';
let currentSortKey = 'deliveryDate';
let currentSortDir = 'asc';

// Sistema de Notificaciones Toast
function showToast(message, type = 'success', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-body">
            <span class="toast-icon">${icons[type] || '🔔'}</span>
            <span>${message}</span>
        </div>
        <button class="toast-close" title="Cerrar">✕</button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    const removeToast = () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 350);
    };

    closeBtn.addEventListener('click', removeToast);
    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(removeToast, duration);
}

// Referencias del DOM
const DOM = {
    monthSelector: document.getElementById('month-selector'),
    btnNewMonth: document.getElementById('btn-new-month'),
    btnNewOrder: document.getElementById('btn-new-order'),
    btnExportCsv: document.getElementById('btn-export-csv'),
    btnBackup: document.getElementById('btn-backup'),
    btnRestore: document.getElementById('btn-restore'),
    inputRestoreFile: document.getElementById('input-restore-file'),
    btnViewDashboard: document.getElementById('btn-view-dashboard'),
    btnViewGallery: document.getElementById('btn-view-gallery'),
    viewDashboard: document.getElementById('view-dashboard'),
    viewGallery: document.getElementById('view-gallery'),
    galleryGrid: document.getElementById('gallery-grid'),
    
    // Stats
    statIncome: document.getElementById('stat-income'),
    statAvgTicket: document.getElementById('stat-avg-ticket'),
    statOrders: document.getElementById('stat-orders'),
    statUnits: document.getElementById('stat-units'),
    statPending: document.getElementById('stat-pending'),
    
    // Tables & Filters
    ordersTableBody: document.getElementById('orders-table-body'),
    orderSearchInput: document.getElementById('order-search-input'),
    btnClearSearch: document.getElementById('btn-clear-search'),
    orderSortSelect: document.getElementById('order-sort-select'),
    countAll: document.getElementById('count-all'),
    countPending: document.getElementById('count-pending'),
    countProduced: document.getElementById('count-produced'),
    countDelivered: document.getElementById('count-delivered'),
    topProductsChart: document.getElementById('topProductsChart'),
    monthNotes: document.getElementById('month-notes'),
    
    // Modal
    modalOverlay: document.getElementById('modal-overlay'),
    modalTitle: document.getElementById('modal-title'),
    modalBody: document.getElementById('modal-body'),
    btnCloseModal: document.getElementById('btn-close-modal')
};

// --- Inicialización ---
async function init() {
    await loadState();
    applySettings();
    setupEventListeners();
    renderMonths();
    if (state.months.length > 0 && !state.activeMonthId) {
        setActiveMonth(state.months[0].id);
    } else if (state.activeMonthId) {
        setActiveMonth(state.activeMonthId); // Trigger render
    }
}

// --- Renderizadores ---
function renderMonths() {
    if (!DOM.monthSelector) return;
    DOM.monthSelector.innerHTML = '';

    if (state.months.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'Sin meses creados';
        DOM.monthSelector.appendChild(opt);
        return;
    }

    state.months.forEach(month => {
        const opt = document.createElement('option');
        opt.value = month.id;
        opt.textContent = month.name;
        if (month.id === state.activeMonthId) {
            opt.selected = true;
        }
        DOM.monthSelector.appendChild(opt);
    });
}

function setActiveMonth(id) {
    state.activeMonthId = id;
    saveState();
    renderMonths();
    renderDashboard();
}

function renderDashboard() {
    if (!state.activeMonthId) {
        if (DOM.ordersTableBody) {
            DOM.ordersTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem 1rem;">Selecciona o crea un mes para empezar</td></tr>';
        }
        updateStats([], 0, 0);
        updateFilterCounts([]);
        if (window.myChart) window.myChart.destroy();
        renderTodoLists();
        return;
    }

    const month = state.months.find(m => m.id === state.activeMonthId);
    if (month && DOM.monthNotes) {
        DOM.monthNotes.value = month.notes || '';
    }

    const monthOrders = state.orders.filter(o => o.monthId === state.activeMonthId);
    
    // Calcular estadísticas
    let totalIncome = 0;
    let totalUnits = 0;
    
    monthOrders.forEach(order => {
        totalIncome += Number(order.price) || 0;
        totalUnits += Number(order.quantity) || 0;
    });
    
    updateStats(monthOrders, totalIncome, totalUnits);
    renderOrdersTable(monthOrders);
    renderTopProducts(monthOrders);
    renderTodoLists();
    
    if (DOM.viewGallery && DOM.viewGallery.style.display !== 'none') {
        renderGallery();
    }
}

function updateStats(orders, income, units) {
    const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
    const totalOrders = orders.length;
    const avgTicket = totalOrders > 0 ? Math.round(income / totalOrders) : 0;
    const pendingOrders = orders.filter(o => !o.isDelivered).length;

    if (DOM.statIncome) DOM.statIncome.textContent = formatter.format(income);
    if (DOM.statAvgTicket) DOM.statAvgTicket.textContent = formatter.format(avgTicket);
    if (DOM.statOrders) DOM.statOrders.textContent = totalOrders;
    if (DOM.statUnits) DOM.statUnits.textContent = units;
    if (DOM.statPending) DOM.statPending.textContent = pendingOrders;
}

function updateFilterCounts(orders) {
    const total = orders.length;
    const pending = orders.filter(o => !o.isDelivered).length;
    const produced = orders.filter(o => o.isProduced).length;
    const delivered = orders.filter(o => o.isDelivered).length;

    if (DOM.countAll) DOM.countAll.textContent = total;
    if (DOM.countPending) DOM.countPending.textContent = pending;
    if (DOM.countProduced) DOM.countProduced.textContent = produced;
    if (DOM.countDelivered) DOM.countDelivered.textContent = delivered;
}

function renderOrdersTable(orders) {
    if (!DOM.ordersTableBody) return;
    DOM.ordersTableBody.innerHTML = '';
    const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

    updateFilterCounts(orders);

    if (orders.length === 0) {
        DOM.ordersTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem 1rem;">No hay pedidos en este mes</td></tr>';
        return;
    }

    // Filtrar según el botón de estado activo
    let filtered = orders.filter(order => {
        if (currentFilter === 'pending') return !order.isDelivered;
        if (currentFilter === 'produced') return order.isProduced;
        if (currentFilter === 'delivered') return order.isDelivered;
        return true;
    });

    // Filtrar por búsqueda en tiempo real
    if (searchQuery.trim() !== '') {
        const q = searchQuery.trim().toLowerCase();
        filtered = filtered.filter(order => {
            const prod = (order.product || '').toLowerCase();
            const prodDate = (order.productionDate || '').toLowerCase();
            const delDate = (order.deliveryDate || '').toLowerCase();
            const priceStr = String(order.price || '');
            return prod.includes(q) || prodDate.includes(q) || delDate.includes(q) || priceStr.includes(q);
        });
    }

    // Ordenamiento dinámico
    filtered.sort((a, b) => {
        let valA = a[currentSortKey];
        let valB = b[currentSortKey];

        if (currentSortKey === 'product') {
            valA = (valA || '').toLowerCase();
            valB = (valB || '').toLowerCase();
            return currentSortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (currentSortKey === 'quantity' || currentSortKey === 'price') {
            valA = Number(valA) || 0;
            valB = Number(valB) || 0;
            return currentSortDir === 'asc' ? valA - valB : valB - valA;
        }
        if (currentSortKey === 'deliveryDate' || currentSortKey === 'productionDate') {
            valA = valA || '9999-99-99';
            valB = valB || '9999-99-99';
            return currentSortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return 0;
    });

    // Actualizar indicadores visuales de flechas en las cabeceras
    document.querySelectorAll('.th-sortable').forEach(th => {
        const sortKey = th.dataset.sort;
        const indicator = th.querySelector('.sort-indicator');
        if (indicator) {
            if (sortKey === currentSortKey) {
                indicator.textContent = currentSortDir === 'asc' ? ' ▲' : ' ▼';
            } else {
                indicator.textContent = '';
            }
        }
    });

    if (filtered.length === 0) {
        DOM.ordersTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem 1rem;">No se encontraron pedidos con los filtros aplicados</td></tr>';
        return;
    }

    filtered.forEach(order => {
        const tr = document.createElement('tr');
        const imgHtml = order.image 
            ? `<img src="${order.image}" alt="${order.product}" class="order-thumbnail img-trigger" title="Clic para ampliar imagen">` 
            : `<div class="order-thumbnail-placeholder">📦</div>`;
        
        // Badge de estado visual inteligente con alertas de fecha
        const todayStr = new Date().toISOString().split('T')[0];
        let statusBadge = '';
        if (order.isDelivered) {
            statusBadge = `<span class="status-badge badge-delivered">🟢 Entregado</span>`;
        } else if (order.deliveryDate && order.deliveryDate < todayStr) {
            statusBadge = `<span class="status-badge badge-overdue" title="Fecha de entrega superada (${formatDate(order.deliveryDate)})">🔴 Atrasado</span>`;
        } else if (order.deliveryDate && order.deliveryDate === todayStr) {
            statusBadge = `<span class="status-badge badge-today" title="¡Entrega programada para hoy!">🟠 Entrega Hoy</span>`;
        } else if (order.isProduced) {
            statusBadge = `<span class="status-badge badge-produced">🟣 Producido</span>`;
        } else {
            statusBadge = `<span class="status-badge badge-pending">🟡 Pendiente</span>`;
        }

        tr.innerHTML = `
            <td>${imgHtml}</td>
            <td style="font-weight: 600;">${order.product}</td>
            <td style="text-align: center; font-weight: 600;">${order.quantity}</td>
            <td style="color: var(--green); font-weight: 600;">${formatter.format(order.price)}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="checkbox" class="produced-check" ${order.isProduced ? 'checked' : ''} style="accent-color: var(--primary); width: 1.1rem; height: 1.1rem; cursor: pointer;">
                    <span style="${order.isProduced ? 'text-decoration: line-through; color: var(--text-muted);' : ''}">${formatDate(order.productionDate)}</span>
                </div>
            </td>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="checkbox" class="delivered-check" ${order.isDelivered ? 'checked' : ''} style="accent-color: var(--primary); width: 1.1rem; height: 1.1rem; cursor: pointer;">
                    <span style="${order.isDelivered ? 'text-decoration: line-through; color: var(--text-muted);' : ''}">${formatDate(order.deliveryDate)}</span>
                </div>
            </td>
            <td>${statusBadge}</td>
            <td>
                <div class="table-actions">
                    <button class="table-action-btn edit" title="Editar pedido">✏️</button>
                    <button class="table-action-btn delete" title="Eliminar pedido">🗑️</button>
                </div>
            </td>
        `;
        
        if (order.image) {
            const imgTrigger = tr.querySelector('.img-trigger');
            if (imgTrigger) {
                imgTrigger.addEventListener('click', () => showOrderDetails(order));
            }
        }
        
        const producedCheck = tr.querySelector('.produced-check');
        producedCheck.addEventListener('change', () => toggleOrderStatus(order.id, 'isProduced'));
        
        const deliveredCheck = tr.querySelector('.delivered-check');
        deliveredCheck.addEventListener('change', () => toggleOrderStatus(order.id, 'isDelivered'));
        
        const editBtn = tr.querySelector('.table-action-btn.edit');
        editBtn.addEventListener('click', () => openEditOrderModal(order.id));

        const deleteBtn = tr.querySelector('.table-action-btn.delete');
        deleteBtn.addEventListener('click', () => deleteOrder(order.id));

        DOM.ordersTableBody.appendChild(tr);
    });
}

window.myChart = null;

function renderTopProducts(orders) {
    if (window.myChart) {
        window.myChart.destroy();
    }
    
    if (orders.length === 0) {
        return;
    }

    // Función para extraer palabras clave en mayúscula al inicio
    function extractKeyword(productName) {
        const words = productName.trim().split(/\s+/);
        let keywordTokens = [];
        for (let word of words) {
            // Si la palabra está en mayúscula y no contiene minúsculas
            if (word === word.toUpperCase() && !/[a-záéíóúñ]/.test(word)) {
                keywordTokens.push(word);
            } else {
                break;
            }
        }
        return keywordTokens.length > 0 ? keywordTokens.join(' ') : productName;
    }

    // Agrupar por producto clave
    const productCounts = {};
    orders.forEach(o => {
        const keyword = extractKeyword(o.product);
        if (!productCounts[keyword]) {
            productCounts[keyword] = 0;
        }
        productCounts[keyword] += o.quantity;
    });

    // Ordenar de mayor a menor y tomar todos los productos
    const sorted = Object.keys(productCounts)
        .map(p => ({ product: p, count: productCounts[p] }))
        .sort((a, b) => b.count - a.count);

    const labels = sorted.map(item => item.product);
    const data = sorted.map(item => item.count);

    if (!DOM.topProductsChart) return;
    const ctx = DOM.topProductsChart.getContext('2d');
    
    Chart.defaults.color = '#8e8a9f';
    Chart.defaults.font.family = "'Inter', sans-serif";

    // Generar colores hermosos que mantengan la estética púrpura/violeta/indigo de Nherisa
    const backgroundColors = sorted.map((_, i) => {
        const hue = 240 + (i * 37) % 85; // Distribuye tonos entre 240 (Índigo/Azul) y 325 (Violeta/Rosa)
        const saturation = 65 + (i * 11) % 16; // Saturación entre 65% y 80%
        const lightness = 48 + (i * 7) % 20; // Luminosidad entre 48% y 68%
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    });

    window.myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#fff',
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

// --- Helpers ---
window.switchView = function(viewName) {
    if (viewName === 'dashboard') {
        if (DOM.viewDashboard) DOM.viewDashboard.style.display = 'block';
        if (DOM.viewGallery) DOM.viewGallery.style.display = 'none';
        if (DOM.btnViewDashboard) {
            DOM.btnViewDashboard.style.backgroundColor = 'rgba(157, 78, 221, 0.2)';
            DOM.btnViewDashboard.style.borderColor = 'var(--primary)';
        }
        if (DOM.btnViewGallery) {
            DOM.btnViewGallery.style.backgroundColor = 'transparent';
            DOM.btnViewGallery.style.borderColor = 'var(--border-color)';
        }
    } else {
        if (DOM.viewDashboard) DOM.viewDashboard.style.display = 'none';
        if (DOM.viewGallery) DOM.viewGallery.style.display = 'block';
        if (DOM.btnViewGallery) {
            DOM.btnViewGallery.style.backgroundColor = 'rgba(157, 78, 221, 0.2)';
            DOM.btnViewGallery.style.borderColor = 'var(--primary)';
        }
        if (DOM.btnViewDashboard) {
            DOM.btnViewDashboard.style.backgroundColor = 'transparent';
            DOM.btnViewDashboard.style.borderColor = 'var(--border-color)';
        }
        renderGallery();
    }
};

window.renderGallery = function() {
    if (!DOM.galleryGrid) return;
    DOM.galleryGrid.innerHTML = '';
    
    if (!state.activeMonthId) {
        DOM.galleryGrid.innerHTML = '<p style="color: var(--text-muted); grid-column: 1 / -1; text-align: center;">Selecciona o crea un mes para ver su galería</p>';
        return;
    }

    const monthOrders = state.orders.filter(o => o.monthId === state.activeMonthId && o.image);
    
    if (monthOrders.length === 0) {
        DOM.galleryGrid.innerHTML = '<p style="color: var(--text-muted); grid-column: 1 / -1; text-align: center; padding: 2rem; background: var(--bg-card); border-radius: 12px;">No hay pedidos con imagen guardada en este mes.</p>';
        return;
    }
    
    const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

    monthOrders.forEach(order => {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        div.style.backgroundColor = 'var(--bg-card)';
        div.style.borderRadius = '12px';
        div.style.overflow = 'hidden';
        div.style.border = '1px solid rgba(255, 255, 255, 0.05)';
        div.style.cursor = 'pointer';
        div.style.transition = 'transform 0.2s, box-shadow 0.2s';
        
        div.innerHTML = `
            <img src="${order.image}" alt="${order.product}" style="width: 100%; height: 180px; object-fit: cover; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
            <div style="padding: 1rem;">
                <h4 style="margin: 0 0 0.5rem 0; font-size: 0.95rem; font-weight: 600;">${order.product}</h4>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: var(--text-muted); font-size: 0.8rem;">Cant: ${order.quantity}</span>
                    <span style="color: var(--green); font-weight: 600; font-size: 0.9rem;">${formatter.format(order.price)}</span>
                </div>
            </div>
        `;
        
        div.addEventListener('click', () => showOrderDetails(order));
        div.addEventListener('mouseover', () => { div.style.transform = 'translateY(-5px)'; div.style.boxShadow = '0 10px 20px rgba(0,0,0,0.4)'; });
        div.addEventListener('mouseout', () => { div.style.transform = 'translateY(0)'; div.style.boxShadow = 'none'; });
        
        DOM.galleryGrid.appendChild(div);
    });
};

window.showOrderDetails = function(order) {
    const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
    
    // Función para abrir la imagen en pantalla completa
    const zoomScript = `
        const w = window.open('');
        w.document.write('<html><body style="margin:0; background:#000; display:flex; justify-content:center; align-items:center; height:100vh;"><img src="${order.image}" style="max-width:100%; max-height:100vh; object-fit:contain;"></body></html>');
    `;
    
    const imageHtml = order.image ? `<img src="${order.image}" onclick="${zoomScript.replace(/"/g, '&quot;').replace(/\n/g, '')}" style="cursor: zoom-in; width: 100%; max-height: 350px; object-fit: contain; border-radius: 10px; margin-bottom: 1rem; border: 1px solid var(--border-color); background: rgba(0,0,0,0.5);" title="Haz clic para ampliar a pantalla completa">` : '';
    
    const bodyHtml = `
        <div style="text-align: center;">
            ${imageHtml}
            <h2 style="margin-bottom: 0.5rem; color: var(--text-main); font-size: 1.5rem;">${order.product}</h2>
            <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1.5rem;">Detalles del Pedido</p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; text-align: left; background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 10px;">
                <div>
                    <span style="color: var(--text-muted); font-size: 0.8rem; display: block; margin-bottom: 0.2rem;">Cantidad</span>
                    <span style="font-weight: 600; font-size: 1.1rem;">${order.quantity} unidades</span>
                </div>
                <div>
                    <span style="color: var(--text-muted); font-size: 0.8rem; display: block; margin-bottom: 0.2rem;">Precio Total</span>
                    <span style="color: var(--green); font-weight: 600; font-size: 1.1rem;">${formatter.format(order.price)}</span>
                </div>
                <div>
                    <span style="color: var(--text-muted); font-size: 0.8rem; display: block; margin-bottom: 0.2rem;">Producción</span>
                    <span style="font-weight: 600; font-size: 1.1rem;">${formatDate(order.productionDate)}</span>
                </div>
                <div>
                    <span style="color: var(--text-muted); font-size: 0.8rem; display: block; margin-bottom: 0.2rem;">Entrega</span>
                    <span style="font-weight: 600; font-size: 1.1rem;">${formatDate(order.deliveryDate)}</span>
                </div>
            </div>
            <div style="margin-top: 1.5rem;">
                <button type="button" class="btn btn-outline cancel-btn" style="width: 100%;">Cerrar Ventana</button>
            </div>
        </div>
    `;
    
    openModal('Información del Pedido', bodyHtml, () => {});
};

window.toggleOrderStatus = function(orderId, field) {
    const order = state.orders.find(o => o.id === orderId);
    if (order) {
        order[field] = !order[field];
        saveState();
        renderDashboard();
    }
};

window.customConfirm = function(message, onConfirm) {
    const bodyHtml = `
        <div style="text-align: center; padding: 1rem 0;">
            <p style="font-size: 1.1rem; margin-bottom: 2rem; color: var(--text-main);">${message}</p>
            <div style="display: flex; gap: 1rem; justify-content: center;">
                <button type="button" class="btn btn-outline cancel-btn" style="flex: 1;">Cancelar</button>
                <button type="button" id="btn-confirm-action" class="btn btn-primary" style="flex: 1; background-color: #ef4444; border-color: #ef4444; box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);">Eliminar</button>
            </div>
        </div>
    `;
    
    openModal('⚠️ Confirmar Acción', bodyHtml, () => {});
    
    setTimeout(() => {
        const confirmBtn = document.getElementById('btn-confirm-action');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                onConfirm();
                closeModal();
            });
        }
    }, 10);
};

window.deleteOrder = function(orderId) {
    customConfirm('¿Estás seguro de que deseas eliminar este pedido?', () => {
        state.orders = state.orders.filter(o => o.id !== orderId);
        saveState();
        renderDashboard();
        if (DOM.viewGallery && DOM.viewGallery.style.display !== 'none') renderGallery();
        showToast('Pedido eliminado correctamente 🗑️', 'info');
    });
};

window.deleteMonth = function(monthId) {
    customConfirm('¿Estás seguro de que deseas eliminar este mes, todos sus pedidos, compras y diseños?', () => {
        state.months = state.months.filter(m => m.id !== monthId);
        state.orders = state.orders.filter(o => o.monthId !== monthId);
        if (state.compras) state.compras = state.compras.filter(c => c.monthId !== monthId);
        if (state.diseños) state.diseños = state.diseños.filter(d => d.monthId !== monthId);
        
        if (state.activeMonthId === monthId) {
            state.activeMonthId = state.months.length > 0 ? state.months[0].id : null;
        }
        
        saveState();
        renderMonths();
        renderDashboard();
        showToast('Mes eliminado correctamente 🗑️', 'info');
    });
};
function formatDate(dateString) {
    if (!dateString) return '-';
    const parts = dateString.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}`;
    }
    return dateString;
}

// Modal para editar pedidos existentes
function openEditOrderModal(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    const currentImageHtml = order.image 
        ? `<div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.6rem; background: rgba(0,0,0,0.25); padding: 0.5rem 0.8rem; border-radius: 8px;">
            <img src="${order.image}" alt="Vista previa" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-color);">
            <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer; color: #ef4444; font-size: 0.82rem;">
                <input type="checkbox" id="remove-image-check" style="accent-color: #ef4444;"> Quitar foto actual
            </label>
          </div>`
        : '';

    const bodyHtml = `
        <form id="dynamic-form">
            <div class="form-group">
                <label for="editProduct">Producto</label>
                <input type="text" id="editProduct" name="product" class="form-control" required autocomplete="off" value="${order.product.replace(/"/g, '&quot;')}">
            </div>
            <div class="form-group">
                <label>Foto del Pedido</label>
                ${currentImageHtml}
                <input type="file" id="editOrderImage" name="orderImage" accept="image/*" class="form-control" style="padding: 0.6rem 1rem;">
                <small style="color: var(--text-muted); font-size: 0.75rem; display: block; margin-top: 0.25rem;">(Deja vacío si quieres conservar la foto)</small>
            </div>
            <div style="display: flex; gap: 1rem;">
                <div class="form-group" style="flex: 1;">
                    <label for="editQuantity">Cantidad</label>
                    <input type="number" id="editQuantity" name="quantity" class="form-control" required min="1" value="${order.quantity}">
                </div>
                <div class="form-group" style="flex: 1;">
                    <label for="editPrice">Precio Total ($)</label>
                    <input type="number" id="editPrice" name="price" class="form-control" required min="0" step="100" value="${order.price}">
                </div>
            </div>
            <div style="display: flex; gap: 1rem;">
                <div class="form-group" style="flex: 1;">
                    <label for="editProductionDate">Fecha Producción</label>
                    <input type="date" id="editProductionDate" name="productionDate" class="form-control" required value="${order.productionDate}">
                </div>
                <div class="form-group" style="flex: 1;">
                    <label for="editDeliveryDate">Fecha Entrega</label>
                    <input type="date" id="editDeliveryDate" name="deliveryDate" class="form-control" required value="${order.deliveryDate}">
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-outline cancel-btn">Cancelar</button>
                <button type="submit" class="btn btn-primary">Guardar Cambios</button>
            </div>
        </form>
    `;

    openModal('✏️ Editar Pedido', bodyHtml, async (data) => {
        let finalImage = order.image;
        const removeCheck = document.getElementById('remove-image-check');
        if (removeCheck && removeCheck.checked) {
            finalImage = null;
        }

        if (data.orderImage && data.orderImage.size > 0) {
            finalImage = await compressImage(data.orderImage, 800);
        }

        order.product = data.product;
        order.image = finalImage;
        order.quantity = parseInt(data.quantity, 10);
        order.price = parseFloat(data.price);
        order.productionDate = data.productionDate;
        order.deliveryDate = data.deliveryDate;

        saveState();
        renderDashboard();
        closeModal();
        showToast('¡Pedido actualizado con éxito! ✏️', 'success');
    });
}

// Exportar pedidos del mes a formato CSV / Excel
function exportOrdersToCSV() {
    if (!state.activeMonthId) {
        showToast('Selecciona un mes primero para exportar sus pedidos.', 'warning');
        return;
    }

    const activeMonth = state.months.find(m => m.id === state.activeMonthId);
    const monthName = activeMonth ? activeMonth.name : 'Mes';
    const monthOrders = state.orders.filter(o => o.monthId === state.activeMonthId);

    if (monthOrders.length === 0) {
        showToast('No hay pedidos en este mes para exportar.', 'warning');
        return;
    }

    const headers = ['Producto', 'Cantidad', 'Precio Total ($)', 'Fecha Producción', 'Fecha Entrega', 'Producido', 'Entregado'];
    const rows = monthOrders.map(order => [
        `"${(order.product || '').replace(/"/g, '""')}"`,
        order.quantity,
        order.price,
        `"${order.productionDate || ''}"`,
        `"${order.deliveryDate || ''}"`,
        order.isProduced ? 'SÍ' : 'NO',
        order.isDelivered ? 'SÍ' : 'NO'
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const cleanMonthName = monthName.replace(/[^a-zA-Z0-9_\-]/g, '_');
    link.setAttribute('href', url);
    link.setAttribute('download', `pedidos_nherisa_${cleanMonthName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    showToast(`Pedidos de ${monthName} exportados a Excel/CSV con éxito 📊`, 'success');
}

// Cargar y actualizar respaldo JSON
function handleRestoreFile(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedState = JSON.parse(e.target.result);
            if (!importedState || !Array.isArray(importedState.months) || !Array.isArray(importedState.orders)) {
                showToast('El archivo no parece ser un respaldo válido de NHERISA 3D.', 'error');
                return;
            }

            const monthsCount = importedState.months.length;
            const ordersCount = importedState.orders.length;

            const bodyHtml = `
                <div style="text-align: center; padding: 0.5rem 0;">
                    <p style="font-size: 1.05rem; margin-bottom: 0.5rem; color: var(--text-main);">
                        Se detectaron <strong>${monthsCount} meses</strong> y <strong>${ordersCount} pedidos</strong> en el respaldo.
                    </p>
                    <p style="font-size: 0.88rem; margin-bottom: 1.8rem; color: var(--text-muted);">
                        Elige cómo deseas cargar y actualizar los datos en el sistema:
                    </p>
                    <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                        <button type="button" id="btn-restore-merge" class="btn btn-primary" style="width: 100%; text-align: center; padding: 0.9rem;">
                            🔄 Fusionar / Actualizar (Recomendado)<br>
                            <span style="font-size: 0.75rem; font-weight: normal; opacity: 0.9;">Conserva tus datos actuales y añade/actualiza con los del respaldo</span>
                        </button>
                        <button type="button" id="btn-restore-replace" class="btn btn-outline" style="width: 100%; text-align: center; border-color: #ef4444; color: #ef4444; padding: 0.9rem;">
                            ⚠️ Reemplazar Todo<br>
                            <span style="font-size: 0.75rem; font-weight: normal; opacity: 0.9;">Sobrescribe completamente la base actual con este archivo</span>
                        </button>
                        <button type="button" class="btn btn-outline cancel-btn" style="width: 100%; margin-top: 0.5rem;">
                            Cancelar
                        </button>
                    </div>
                </div>
            `;

            openModal('📂 Cargar y Actualizar Respaldo', bodyHtml, () => {});

            setTimeout(() => {
                const btnMerge = document.getElementById('btn-restore-merge');
                if (btnMerge) {
                    btnMerge.addEventListener('click', () => {
                        // Fusionar meses
                        importedState.months.forEach(impMonth => {
                            const existingIndex = state.months.findIndex(m => m.id === impMonth.id || m.name.toLowerCase() === impMonth.name.toLowerCase());
                            if (existingIndex >= 0) {
                                state.months[existingIndex] = { ...state.months[existingIndex], ...impMonth };
                            } else {
                                state.months.push(impMonth);
                            }
                        });

                        // Fusionar pedidos
                        importedState.orders.forEach(impOrder => {
                            const existingIndex = state.orders.findIndex(o => o.id === impOrder.id);
                            if (existingIndex >= 0) {
                                state.orders[existingIndex] = { ...state.orders[existingIndex], ...impOrder };
                            } else {
                                state.orders.push(impOrder);
                            }
                        });

                        // Fusionar compras
                        if (Array.isArray(importedState.compras)) {
                            if (!state.compras) state.compras = [];
                            importedState.compras.forEach(impComp => {
                                if (!state.compras.some(c => c.id === impComp.id)) {
                                    state.compras.push(impComp);
                                }
                            });
                        }

                        // Fusionar diseños
                        if (Array.isArray(importedState.diseños)) {
                            if (!state.diseños) state.diseños = [];
                            importedState.diseños.forEach(impDis => {
                                if (!state.diseños.some(d => d.id === impDis.id)) {
                                    state.diseños.push(impDis);
                                }
                            });
                        }

                        if (importedState.settings) {
                            state.settings = { ...state.settings, ...importedState.settings };
                        }

                        saveState();
                        applySettings();
                        renderMonths();
                        if (!state.activeMonthId && state.months.length > 0) {
                            setActiveMonth(state.months[0].id);
                        } else {
                            renderDashboard();
                        }
                        closeModal();
                        showToast('¡Respaldo cargado y actualizado con éxito! 🔄', 'success');
                    });
                }

                const btnReplace = document.getElementById('btn-restore-replace');
                if (btnReplace) {
                    btnReplace.addEventListener('click', () => {
                        state = {
                            months: importedState.months || [],
                            activeMonthId: importedState.activeMonthId || (importedState.months[0]?.id || null),
                            orders: importedState.orders || [],
                            compras: importedState.compras || [],
                            diseños: importedState.diseños || [],
                            settings: importedState.settings || state.settings
                        };
                        saveState();
                        applySettings();
                        renderMonths();
                        if (state.activeMonthId) {
                            setActiveMonth(state.activeMonthId);
                        } else if (state.months.length > 0) {
                            setActiveMonth(state.months[0].id);
                        } else {
                            renderDashboard();
                        }
                        closeModal();
                        showToast('¡Base de datos restaurada completamente! 🎉', 'success');
                    });
                }
            }, 20);

        } catch (err) {
            console.error(err);
            showToast('Error al leer el archivo JSON de respaldo.', 'error');
        }
    };
    reader.readAsText(file);
}

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function compressImage(file, maxSize = 120) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxSize) {
                        height *= maxSize / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width *= maxSize / height;
                        height = maxSize;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = () => resolve(null);
        };
        reader.onerror = () => resolve(null);
    });
}

// --- Modales ---
function openModal(title, bodyHtml, onFormSubmit) {
    DOM.modalTitle.textContent = title;
    DOM.modalBody.innerHTML = bodyHtml;
    DOM.modalOverlay.classList.remove('hidden');

    const form = document.getElementById('dynamic-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            onFormSubmit(data);
        });
    }

    const cancelBtns = DOM.modalBody.querySelectorAll('.cancel-btn');
    cancelBtns.forEach(btn => btn.addEventListener('click', closeModal));
}

function closeModal() {
    DOM.modalOverlay.classList.add('hidden');
    setTimeout(() => {
        DOM.modalBody.innerHTML = '';
    }, 300);
}

// --- Listas de Compras y Diseños Pendientes ---
function renderTodoLists() {
    const comprasContainer = document.getElementById('compras-container');
    const diseñosContainer = document.getElementById('diseños-container');
    
    if (!comprasContainer || !diseñosContainer) return;
    
    if (!state.activeMonthId) {
        comprasContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center; margin-top: 1.5rem; font-size: 0.9rem;">Selecciona un mes para ver las compras pendientes</p>';
        diseñosContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center; margin-top: 1.5rem; font-size: 0.9rem;">Selecciona un mes para ver los diseños pendientes</p>';
        return;
    }
    
    // Render Compras
    const monthCompras = (state.compras || []).filter(c => c.monthId === state.activeMonthId);
    comprasContainer.innerHTML = '';
    if (monthCompras.length === 0) {
        comprasContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center; margin-top: 1.5rem; font-size: 0.9rem;">No hay compras pendientes</p>';
    } else {
        monthCompras.forEach(item => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.justifyContent = 'space-between';
            div.style.gap = '0.5rem';
            div.style.padding = '0.6rem 0.8rem';
            div.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
            div.style.borderRadius = '10px';
            div.style.border = '1px solid rgba(255, 255, 255, 0.05)';
            div.style.transition = 'background-color 0.2s';
            
            div.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1;">
                    <input type="checkbox" class="todo-check" ${item.completed ? 'checked' : ''} style="accent-color: var(--primary); width: 1.1rem; height: 1.1rem; cursor: pointer;">
                    <span style="${item.completed ? 'text-decoration: line-through; color: var(--text-muted);' : ''}; font-size: 0.9rem; word-break: break-all;">${item.text}</span>
                </div>
                <button class="todo-delete" style="background: none; border: none; color: #ef4444; font-size: 1.1rem; cursor: pointer; opacity: 0.7; transition: opacity 0.2s, transform 0.2s;" title="Eliminar">🗑️</button>
            `;
            
            const check = div.querySelector('.todo-check');
            check.addEventListener('change', () => {
                item.completed = check.checked;
                saveState();
                renderTodoLists();
            });
            
            const delBtn = div.querySelector('.todo-delete');
            delBtn.addEventListener('mouseover', () => { delBtn.style.opacity = '1'; delBtn.style.transform = 'scale(1.1)'; });
            delBtn.addEventListener('mouseout', () => { delBtn.style.opacity = '0.7'; delBtn.style.transform = 'scale(1)'; });
            delBtn.addEventListener('click', () => {
                state.compras = state.compras.filter(c => c.id !== item.id);
                saveState();
                renderTodoLists();
            });
            
            comprasContainer.appendChild(div);
        });
    }
    
    // Render Diseños
    const monthDiseños = (state.diseños || []).filter(d => d.monthId === state.activeMonthId);
    diseñosContainer.innerHTML = '';
    if (monthDiseños.length === 0) {
        diseñosContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center; margin-top: 1.5rem; font-size: 0.9rem;">No hay diseños pendientes</p>';
    } else {
        monthDiseños.forEach(item => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.justifyContent = 'space-between';
            div.style.gap = '0.5rem';
            div.style.padding = '0.6rem 0.8rem';
            div.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
            div.style.borderRadius = '10px';
            div.style.border = '1px solid rgba(255, 255, 255, 0.05)';
            div.style.transition = 'background-color 0.2s';
            
            div.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1;">
                    <input type="checkbox" class="todo-check" ${item.completed ? 'checked' : ''} style="accent-color: var(--primary); width: 1.1rem; height: 1.1rem; cursor: pointer;">
                    <span style="${item.completed ? 'text-decoration: line-through; color: var(--text-muted);' : ''}; font-size: 0.9rem; word-break: break-all;">${item.text}</span>
                </div>
                <button class="todo-delete" style="background: none; border: none; color: #ef4444; font-size: 1.1rem; cursor: pointer; opacity: 0.7; transition: opacity 0.2s, transform 0.2s;" title="Eliminar">🗑️</button>
            `;
            
            const check = div.querySelector('.todo-check');
            check.addEventListener('change', () => {
                item.completed = check.checked;
                saveState();
                renderTodoLists();
            });
            
            const delBtn = div.querySelector('.todo-delete');
            delBtn.addEventListener('mouseover', () => { delBtn.style.opacity = '1'; delBtn.style.transform = 'scale(1.1)'; });
            delBtn.addEventListener('mouseout', () => { delBtn.style.opacity = '0.7'; delBtn.style.transform = 'scale(1)'; });
            delBtn.addEventListener('click', () => {
                state.diseños = state.diseños.filter(d => d.id !== item.id);
                saveState();
                renderTodoLists();
            });
            
            diseñosContainer.appendChild(div);
        });
    }
}

// --- Event Listeners ---
function setupEventListeners() {
    DOM.btnCloseModal.addEventListener('click', closeModal);
    DOM.modalOverlay.addEventListener('click', (e) => {
        if (e.target === DOM.modalOverlay) closeModal();
    });

    if (DOM.btnViewDashboard) DOM.btnViewDashboard.addEventListener('click', () => switchView('dashboard'));
    if (DOM.btnViewGallery) DOM.btnViewGallery.addEventListener('click', () => switchView('gallery'));

    // Plegar/desplegar tabla de pedidos
    const btnToggleOrders = document.getElementById('btn-toggle-orders');
    const ordersTableWrapper = document.getElementById('orders-table-wrapper');
    const ordersToggleIcon = document.getElementById('orders-toggle-icon');
    if (btnToggleOrders && ordersTableWrapper && ordersToggleIcon) {
        btnToggleOrders.addEventListener('click', () => {
            const isCollapsed = ordersTableWrapper.style.maxHeight === '0px';
            if (isCollapsed) {
                ordersTableWrapper.style.maxHeight = '9999px';
                ordersTableWrapper.style.opacity = '1';
                ordersToggleIcon.style.transform = 'rotate(0deg)';
            } else {
                ordersTableWrapper.style.maxHeight = '0px';
                ordersTableWrapper.style.opacity = '0';
                ordersToggleIcon.style.transform = 'rotate(-90deg)';
            }
        });
    }

    // Buscador en tiempo real de pedidos
    if (DOM.orderSearchInput) {
        DOM.orderSearchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            if (DOM.btnClearSearch) {
                DOM.btnClearSearch.style.display = searchQuery ? 'inline-block' : 'none';
            }
            if (state.activeMonthId) {
                renderOrdersTable(state.orders.filter(o => o.monthId === state.activeMonthId));
            }
        });
    }

    // Botón para limpiar búsqueda
    if (DOM.btnClearSearch) {
        DOM.btnClearSearch.addEventListener('click', () => {
            searchQuery = '';
            if (DOM.orderSearchInput) DOM.orderSearchInput.value = '';
            DOM.btnClearSearch.style.display = 'none';
            if (state.activeMonthId) {
                renderOrdersTable(state.orders.filter(o => o.monthId === state.activeMonthId));
            }
        });
    }

    // Filtros por estado (Todos, Pendientes, Producidos, Entregados)
    const filterPills = document.querySelectorAll('.filter-pill');
    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentFilter = pill.dataset.filter || 'all';
            if (state.activeMonthId) {
                renderOrdersTable(state.orders.filter(o => o.monthId === state.activeMonthId));
            }
        });
    });

    // Selector de ordenamiento
    if (DOM.orderSortSelect) {
        DOM.orderSortSelect.addEventListener('change', (e) => {
            const parts = e.target.value.split('_');
            currentSortKey = parts[0];
            currentSortDir = parts[1] || 'asc';
            if (state.activeMonthId) {
                renderOrdersTable(state.orders.filter(o => o.monthId === state.activeMonthId));
            }
        });
    }

    // Ordenamiento por clic en encabezados de tabla
    document.querySelectorAll('.th-sortable').forEach(th => {
        th.addEventListener('click', () => {
            const sortKey = th.dataset.sort;
            if (currentSortKey === sortKey) {
                currentSortDir = currentSortDir === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortKey = sortKey;
                currentSortDir = 'asc';
            }
            if (DOM.orderSortSelect) {
                DOM.orderSortSelect.value = `${currentSortKey}_${currentSortDir}`;
            }
            if (state.activeMonthId) {
                renderOrdersTable(state.orders.filter(o => o.monthId === state.activeMonthId));
            }
        });
    });

    // Exportar a Excel / CSV
    if (DOM.btnExportCsv) {
        DOM.btnExportCsv.addEventListener('click', exportOrdersToCSV);
    }

    // Cargar / Restaurar Respaldo
    if (DOM.btnRestore && DOM.inputRestoreFile) {
        DOM.btnRestore.addEventListener('click', () => {
            DOM.inputRestoreFile.click();
        });
        DOM.inputRestoreFile.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                handleRestoreFile(this.files[0]);
                this.value = '';
            }
        });
    }

    // Plegar/desplegar compras pendientes
    const btnToggleCompras = document.getElementById('btn-toggle-compras');
    const comprasWrapper = document.getElementById('compras-wrapper');
    const comprasToggleIcon = document.getElementById('compras-toggle-icon');
    if (btnToggleCompras && comprasWrapper && comprasToggleIcon) {
        btnToggleCompras.addEventListener('click', () => {
            const isCollapsed = comprasWrapper.style.maxHeight === '0px';
            if (isCollapsed) {
                comprasWrapper.style.maxHeight = '9999px';
                comprasWrapper.style.opacity = '1';
                comprasToggleIcon.style.transform = 'rotate(0deg)';
            } else {
                comprasWrapper.style.maxHeight = '0px';
                comprasWrapper.style.opacity = '0';
                comprasToggleIcon.style.transform = 'rotate(-90deg)';
            }
        });
    }

    // Plegar/desplegar diseños pendientes
    const btnToggleDiseños = document.getElementById('btn-toggle-diseños');
    const diseñosWrapper = document.getElementById('diseños-wrapper');
    const diseñosToggleIcon = document.getElementById('diseños-toggle-icon');
    if (btnToggleDiseños && diseñosWrapper && diseñosToggleIcon) {
        btnToggleDiseños.addEventListener('click', () => {
            const isCollapsed = diseñosWrapper.style.maxHeight === '0px';
            if (isCollapsed) {
                diseñosWrapper.style.maxHeight = '9999px';
                diseñosWrapper.style.opacity = '1';
                diseñosToggleIcon.style.transform = 'rotate(0deg)';
            } else {
                diseñosWrapper.style.maxHeight = '0px';
                diseñosWrapper.style.opacity = '0';
                diseñosToggleIcon.style.transform = 'rotate(-90deg)';
            }
        });
    }

    // Plegar/desplegar productos más pedidos
    const btnToggleProducts = document.getElementById('btn-toggle-products');
    const productsWrapper = document.getElementById('products-wrapper');
    const productsToggleIcon = document.getElementById('products-toggle-icon');
    if (btnToggleProducts && productsWrapper && productsToggleIcon) {
        btnToggleProducts.addEventListener('click', () => {
            const isCollapsed = productsWrapper.style.maxHeight === '0px';
            if (isCollapsed) {
                productsWrapper.style.maxHeight = '9999px';
                productsWrapper.style.opacity = '1';
                productsToggleIcon.style.transform = 'rotate(0deg)';
            } else {
                productsWrapper.style.maxHeight = '0px';
                productsWrapper.style.opacity = '0';
                productsToggleIcon.style.transform = 'rotate(-90deg)';
            }
        });
    }

    // Plegar/desplegar anotaciones del mes
    const btnToggleNotes = document.getElementById('btn-toggle-notes');
    const notesWrapper = document.getElementById('notes-wrapper');
    const notesToggleIcon = document.getElementById('notes-toggle-icon');
    if (btnToggleNotes && notesWrapper && notesToggleIcon) {
        btnToggleNotes.addEventListener('click', () => {
            const isCollapsed = notesWrapper.style.maxHeight === '0px';
            if (isCollapsed) {
                notesWrapper.style.maxHeight = '9999px';
                notesWrapper.style.opacity = '1';
                notesToggleIcon.style.transform = 'rotate(0deg)';
            } else {
                notesWrapper.style.maxHeight = '0px';
                notesWrapper.style.opacity = '0';
                notesToggleIcon.style.transform = 'rotate(-90deg)';
            }
        });
    }

    if (DOM.monthSelector) {
        DOM.monthSelector.addEventListener('change', (e) => {
            setActiveMonth(e.target.value);
        });
    }

    const btnDeleteMonth = document.getElementById('btn-delete-month');
    if (btnDeleteMonth) {
        btnDeleteMonth.addEventListener('click', () => {
            if (state.activeMonthId) {
                deleteMonth(state.activeMonthId);
            } else {
                showToast('Por favor, selecciona un mes para eliminar.', 'warning');
            }
        });
    }

    // Configuración
    const btnSettings = document.getElementById('btn-settings');
    if (btnSettings) {
        btnSettings.addEventListener('click', () => {
            const currentSettings = state.settings || { primaryColor: '#6A4C93' };
            const bodyHtml = `
                <form id="dynamic-form">
                    <div class="form-group">
                        <label for="primaryColor">Color Principal</label>
                        <input type="color" id="primaryColor" name="primaryColor" value="${currentSettings.primaryColor}" class="form-control" style="height: 50px; padding: 0.2rem;">
                    </div>
                    <div class="form-group">
                        <label for="profileImage">Foto de Perfil (Opcional)</label>
                        <input type="file" id="profileImage" name="profileImage" accept="image/*" class="form-control" style="padding: 0.6rem 1rem;">
                    </div>
                    <div class="form-group">
                        <label for="backgroundImage">Fondo de Pantalla (Opcional)</label>
                        <input type="file" id="backgroundImage" name="backgroundImage" accept="image/*" class="form-control" style="padding: 0.6rem 1rem;">
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-outline cancel-btn">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Guardar Cambios</button>
                    </div>
                </form>
            `;
            openModal('Configuración de Estética', bodyHtml, async (data) => {
                let profileBase64 = currentSettings.profileImage;
                let bgBase64 = currentSettings.backgroundImage;
                
                if (data.profileImage && data.profileImage.size > 0) {
                    profileBase64 = await compressImage(data.profileImage, 250);
                }
                if (data.backgroundImage && data.backgroundImage.size > 0) {
                    bgBase64 = await compressImage(data.backgroundImage, 1920);
                }
                
                state.settings = {
                    primaryColor: data.primaryColor,
                    profileImage: profileBase64,
                    backgroundImage: bgBase64
                };
                saveState();
                applySettings();
                closeModal();
                showToast('Configuración estética guardada 🎨', 'success');
            });
        });
    }

    // Nueva Compra Pendiente
    const btnNewCompra = document.getElementById('btn-new-compra');
    if (btnNewCompra) {
        btnNewCompra.addEventListener('click', () => {
            if (!state.activeMonthId) {
                showToast('Por favor, selecciona o crea un mes primero.', 'warning');
                return;
            }
            const bodyHtml = `
                <form id="dynamic-form">
                    <div class="form-group">
                        <label for="compraText">Descripción de la Compra</label>
                        <input type="text" id="compraText" name="compraText" class="form-control" required autocomplete="off" placeholder="Ej. Comprar resmas de papel A4">
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-outline cancel-btn">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Agregar Compra</button>
                    </div>
                </form>
            `;
            openModal('Agregar Compra Pendiente', bodyHtml, (data) => {
                const newItem = {
                    id: generateId(),
                    monthId: state.activeMonthId,
                    text: data.compraText,
                    completed: false
                };
                state.compras.push(newItem);
                saveState();
                renderTodoLists();
                closeModal();
                showToast('Compra pendiente agregada 🛒', 'success');
            });
        });
    }

    // Nuevo Diseño Pendiente
    const btnNewDiseño = document.getElementById('btn-new-diseño');
    if (btnNewDiseño) {
        btnNewDiseño.addEventListener('click', () => {
            if (!state.activeMonthId) {
                showToast('Por favor, selecciona o crea un mes primero.', 'warning');
                return;
            }
            const bodyHtml = `
                <form id="dynamic-form">
                    <div class="form-group">
                        <label for="diseñoText">Descripción del Diseño</label>
                        <input type="text" id="diseñoText" name="diseñoText" class="form-control" required autocomplete="off" placeholder="Ej. Llavero Logo Nherisa v2">
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-outline cancel-btn">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Agregar Diseño</button>
                    </div>
                </form>
            `;
            openModal('Agregar Diseño Pendiente', bodyHtml, (data) => {
                const newItem = {
                    id: generateId(),
                    monthId: state.activeMonthId,
                    text: data.diseñoText,
                    completed: false
                };
                state.diseños.push(newItem);
                saveState();
                renderTodoLists();
                closeModal();
                showToast('Diseño pendiente agregado 🎨', 'success');
            });
        });
    }

    if (DOM.monthNotes) {
        DOM.monthNotes.addEventListener('change', (e) => {
            if (!state.activeMonthId) return;
            const month = state.months.find(m => m.id === state.activeMonthId);
            if (month) {
                month.notes = e.target.value;
                saveState();
            }
        });
    }

    // Nuevo Mes
    DOM.btnNewMonth.addEventListener('click', () => {
        const bodyHtml = `
            <form id="dynamic-form">
                <div class="form-group">
                    <label for="monthName">Nombre del Mes (ej. Mayo 2026)</label>
                    <input type="text" id="monthName" name="monthName" class="form-control" required autocomplete="off">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-outline cancel-btn">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Crear Mes</button>
                </div>
            </form>
        `;
        openModal('Crear Nuevo Mes', bodyHtml, (data) => {
            const newMonth = {
                id: generateId(),
                name: data.monthName
            };
            state.months.push(newMonth);
            saveState();
            setActiveMonth(newMonth.id);
            closeModal();
            showToast('¡Mes creado con éxito! 📅', 'success');
        });
    });

    // Registrar Pedido
    DOM.btnNewOrder.addEventListener('click', () => {
        if (!state.activeMonthId) {
            showToast('Por favor, selecciona o crea un mes primero.', 'warning');
            return;
        }

        const bodyHtml = `
            <form id="dynamic-form">
                <div class="form-group">
                    <label for="product">Producto</label>
                    <input type="text" id="product" name="product" class="form-control" required autocomplete="off" placeholder="Ej. Llavero Personalizado">
                </div>
                <div class="form-group">
                    <label for="orderImage">Imagen del Pedido (Opcional)</label>
                    <input type="file" id="orderImage" name="orderImage" accept="image/*" class="form-control" style="padding: 0.6rem 1rem;">
                </div>
                <div style="display: flex; gap: 1rem;">
                    <div class="form-group" style="flex: 1;">
                        <label for="quantity">Cantidad</label>
                        <input type="number" id="quantity" name="quantity" class="form-control" required min="1" value="1">
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label for="price">Precio Total ($)</label>
                        <input type="number" id="price" name="price" class="form-control" required min="0" step="100">
                    </div>
                </div>
                <div style="display: flex; gap: 1rem;">
                    <div class="form-group" style="flex: 1;">
                        <label for="productionDate">Fecha Producción</label>
                        <input type="date" id="productionDate" name="productionDate" class="form-control" required>
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label for="deliveryDate">Fecha Entrega</label>
                        <input type="date" id="deliveryDate" name="deliveryDate" class="form-control" required>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-outline cancel-btn">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar Pedido</button>
                </div>
            </form>
        `;
        openModal('Registrar Nuevo Pedido', bodyHtml, async (data) => {
            let base64Image = null;
            if (data.orderImage && data.orderImage.size > 0) {
                base64Image = await compressImage(data.orderImage, 800);
            }
            
            const newOrder = {
                id: generateId(),
                monthId: state.activeMonthId,
                product: data.product,
                image: base64Image,
                quantity: parseInt(data.quantity, 10),
                price: parseFloat(data.price),
                productionDate: data.productionDate,
                deliveryDate: data.deliveryDate,
                isProduced: false,
                isDelivered: false
            };
            state.orders.push(newOrder);
            saveState();
            renderDashboard();
            closeModal();
            showToast('¡Pedido registrado con éxito! 📦', 'success');
        });
    });

    // Descargar Respaldo
    DOM.btnBackup.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href",     dataStr);
        downloadAnchorNode.setAttribute("download", "nherisa_backup_" + new Date().toISOString().split('T')[0] + ".json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        showToast('¡Copia de respaldo descargada con éxito! 💾', 'success');
    });
}

// Iniciar app al cargar la página
window.addEventListener('DOMContentLoaded', init);
