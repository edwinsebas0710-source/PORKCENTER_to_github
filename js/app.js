/**
 * PORKCENTER - Lógica Compartida de la Aplicación (js/app.js)
 * Interfaz unificada: Barra de navegación, Modales Auth con Roles, Dashboard de Cuenta Interactivo,
 * Carrito de Compras, Modal de Checkout / Proceder al Pago y Comprobante de Compra.
 */

// ==========================================
// NOTIFICACIONES TOAST
// ==========================================
function mostrarToast(mensaje, tipo = 'info') {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = mensaje;
    toast.className = 'toast visible ' + tipo;
    setTimeout(() => {
        toast.className = 'toast';
    }, 3200);
}

// ==========================================
// MENÚ MÓVIL Y NAVEGACIÓN
// ==========================================
function toggleMenuMovil() {
    const enlaces = document.getElementById('enlaces-nav');
    const overlay = document.getElementById('overlay-menu-movil');
    if (!enlaces) return;
    const estaActivo = enlaces.classList.toggle('activo');
    if (overlay) overlay.classList.toggle('activo', estaActivo);
    document.body.style.overflow = estaActivo ? 'hidden' : '';
}

function cerrarMenuMovil() {
    const enlaces = document.getElementById('enlaces-nav');
    const overlay = document.getElementById('overlay-menu-movil');
    if (enlaces) enlaces.classList.remove('activo');
    if (overlay) overlay.classList.remove('activo');
    document.body.style.overflow = '';
}

function abrirCuentaOMenu() {
    const sesion = DB.getSesion();
    if (sesion) {
        abrirModalCuenta('perfil');
    } else {
        abrirModalAuth('login');
    }
}

// ==========================================
// ESTADO DE SESIÓN EN NAVBAR
// ==========================================
function actualizarUISesion() {
    const sesion = DB.getSesion();
    const btnLogin = document.getElementById('btn-login-nav');
    const btnUsuario = document.getElementById('btn-usuario-nav');
    const nombreUsuario = document.getElementById('nombre-usuario-nav');
    const rolBadge = document.getElementById('rol-usuario-nav');
    const itemsSoloSesion = document.querySelectorAll('.item-solo-sesion');
    const itemsSinSesion = document.querySelectorAll('.item-sin-sesion');

    // Elementos drawer móvil
    const menuMovilSinSesion = document.getElementById('menu-movil-sin-sesion');
    const menuMovilConSesion = document.getElementById('menu-movil-con-sesion');
    const menuMovilUsuarioNombre = document.getElementById('menu-movil-usuario-nombre');
    const menuMovilUsuarioRol = document.getElementById('menu-movil-usuario-rol');
    const labelCuentaMovil = document.getElementById('label-cuenta-movil');

    if (sesion) {
        if (btnLogin) btnLogin.style.display = 'none';
        if (btnUsuario) btnUsuario.style.display = 'flex';
        if (nombreUsuario) nombreUsuario.textContent = sesion.usuario;
        
        // Badge de rol
        let rolText = '🛒 Comprador';
        let rolClass = 'badge-rol-comprador';
        if (sesion.rol === 'vendedor') {
            rolText = '🐷 Vendedor';
            rolClass = 'badge-rol-vendedor';
        } else if (sesion.rol === 'ambos') {
            rolText = '🔄 Vendedor & Comprador';
            rolClass = 'badge-rol-ambos';
        }

        if (rolBadge) {
            rolBadge.textContent = rolText;
            rolBadge.className = 'badge-rol ' + rolClass;
        }

        if (menuMovilSinSesion) menuMovilSinSesion.style.display = 'none';
        if (menuMovilConSesion) menuMovilConSesion.style.display = 'block';
        if (menuMovilUsuarioNombre) menuMovilUsuarioNombre.textContent = sesion.usuario;
        if (menuMovilUsuarioRol) {
            menuMovilUsuarioRol.textContent = rolText;
            menuMovilUsuarioRol.className = 'badge-rol ' + rolClass;
        }
        if (labelCuentaMovil) labelCuentaMovil.textContent = 'Perfil';

        itemsSoloSesion.forEach(el => el.style.display = 'block');
        itemsSinSesion.forEach(el => el.style.display = 'none');
    } else {
        if (btnLogin) btnLogin.style.display = 'flex';
        if (btnUsuario) btnUsuario.style.display = 'none';

        if (menuMovilSinSesion) menuMovilSinSesion.style.display = 'block';
        if (menuMovilConSesion) menuMovilConSesion.style.display = 'none';
        if (labelCuentaMovil) labelCuentaMovil.textContent = 'Cuenta';

        itemsSoloSesion.forEach(el => el.style.display = 'none');
        itemsSinSesion.forEach(el => el.style.display = 'block');
    }
}

// ==========================================
// MODAL DE AUTENTICACIÓN (LOGIN / REGISTRO CON ROLES)
// ==========================================
let rolSeleccionadoRegistro = 'comprador';

function abrirModalAuth(tab = 'login') {
    const overlay = document.getElementById('overlay-auth');
    if (!overlay) return;
    overlay.classList.add('activo');
    document.body.style.overflow = 'hidden';
    cambiarTabAuth(tab);
}

function cerrarModalAuth() {
    const overlay = document.getElementById('overlay-auth');
    if (!overlay) return;
    overlay.classList.remove('activo');
    document.body.style.overflow = '';
    
    // Limpiar campos y errores
    const inputs = ['login-email', 'login-pass', 'reg-nombre', 'reg-email', 'reg-pass', 'reg-pass2', 'reg-telefono', 'reg-ubicacion'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.querySelectorAll('.auth-error').forEach(e => e.textContent = '');
}

function cambiarTabAuth(tab) {
    document.querySelectorAll('.auth-tab-btn').forEach(b => b.classList.toggle('activo', b.dataset.tab === tab));
    document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('activo'));
    const panel = document.getElementById('auth-panel-' + tab);
    if (panel) panel.classList.add('activo');
}

function seleccionarRolRegistro(rol, btn) {
    rolSeleccionadoRegistro = rol;
    document.querySelectorAll('.btn-opcion-rol').forEach(b => b.classList.remove('activo'));
    if (btn) btn.classList.add('activo');
    
    // Mostrar campos específicos según rol
    const campoVendedor = document.getElementById('campo-adicional-vendedor');
    if (campoVendedor) {
        if (rol === 'vendedor' || rol === 'ambos') {
            campoVendedor.style.display = 'block';
        } else {
            campoVendedor.style.display = 'none';
        }
    }
}

function hacerLogin(e) {
    if (e && e.preventDefault) e.preventDefault();
    const email = document.getElementById('login-email')?.value?.trim();
    const pass = document.getElementById('login-pass')?.value;
    const err = document.getElementById('login-error');
    if (err) err.textContent = '';

    const res = DB.login(email, pass);
    if (!res.ok) {
        if (err) err.textContent = '❌ ' + res.error;
        return;
    }

    actualizarUISesion();
    cerrarModalAuth();
    mostrarToast('👋 ¡Bienvenido de nuevo, ' + res.usuario.usuario + '!');

    if (typeof actualizarAvisoVendedor === 'function') {
        actualizarAvisoVendedor();
    }
    if (typeof recargarCatalogo === 'function') {
        recargarCatalogo();
    }
}

function hacerRegistro(e) {
    if (e && e.preventDefault) e.preventDefault();
    const usuario = document.getElementById('reg-nombre')?.value?.trim();
    const email = document.getElementById('reg-email')?.value?.trim();
    const pass = document.getElementById('reg-pass')?.value;
    const pass2 = document.getElementById('reg-pass2')?.value;
    const telefono = document.getElementById('reg-telefono')?.value?.trim() || '';
    const ubicacion = document.getElementById('reg-ubicacion')?.value?.trim() || 'Ubalá, Cundinamarca';
    const err = document.getElementById('reg-error');
    if (err) err.textContent = '';

    if (!usuario || !email || !pass) {
        if (err) err.textContent = '❌ Completa todos los campos obligatorios.';
        return;
    }
    if (pass !== pass2) {
        if (err) err.textContent = '❌ Las contraseñas no coinciden.';
        return;
    }
    if (pass.length < 6) {
        if (err) err.textContent = '❌ La contraseña debe tener mínimo 6 caracteres.';
        return;
    }

    const res = DB.registro({
        usuario,
        email,
        pass,
        rol: rolSeleccionadoRegistro || 'comprador',
        telefono,
        ubicacion
    });

    if (!res.ok) {
        if (err) err.textContent = '❌ ' + res.error;
        return;
    }

    actualizarUISesion();
    cerrarModalAuth();
    mostrarToast('🎉 ¡Bienvenido ' + res.usuario.usuario + '! Cuenta creada como ' + res.usuario.rol.toUpperCase());

    if (typeof actualizarAvisoVendedor === 'function') {
        actualizarAvisoVendedor();
    }
    if (typeof recargarCatalogo === 'function') {
        recargarCatalogo();
    }
}

function togglePass(id, btn) {
    const input = document.getElementById(id);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
    if (btn) btn.textContent = input.type === 'password' ? '👁️' : '🙈';
}

// ==========================================
// MENÚ INTERACTIVO DE CUENTA / PERFIL
// ==========================================
function abrirModalCuenta(tab = 'perfil') {
    const sesion = DB.getSesion();
    if (!sesion) {
        mostrarToast('⚠️ Inicia sesión para acceder a tu cuenta');
        abrirModalAuth('login');
        return;
    }

    const overlay = document.getElementById('overlay-cuenta');
    if (!overlay) return;

    renderizarDatosCuenta();
    overlay.classList.add('activo');
    document.body.style.overflow = 'hidden';
    cambiarTabCuenta(tab);
}

function cerrarModalCuenta() {
    const overlay = document.getElementById('overlay-cuenta');
    if (!overlay) return;
    overlay.classList.remove('activo');
    document.body.style.overflow = '';
}

function cambiarTabCuenta(tab) {
    document.querySelectorAll('.tab-btn-cuenta').forEach(b => b.classList.toggle('activo', b.dataset.tab === tab));
    document.querySelectorAll('.cuenta-panel').forEach(p => p.classList.remove('activo'));
    const panel = document.getElementById('cuenta-panel-' + tab);
    if (panel) panel.classList.add('activo');

    if (tab === 'compras') renderizarMisCompras();
    if (tab === 'ventas') renderizarMisPublicaciones();
}

function renderizarDatosCuenta() {
    const sesion = DB.getSesion();
    if (!sesion) return;

    // Header del perfil
    const elNombre = document.getElementById('cuenta-header-nombre');
    const elEmail = document.getElementById('cuenta-header-email');
    const elRolBadge = document.getElementById('cuenta-header-rol');
    const elFecha = document.getElementById('cuenta-header-fecha');

    if (elNombre) elNombre.textContent = sesion.usuario;
    if (elEmail) elEmail.textContent = sesion.email;
    if (elFecha) elFecha.textContent = 'Miembro desde: ' + (sesion.fechaRegistro || '2026');

    if (elRolBadge) {
        let rolIcon = '🛒';
        let rolLabel = 'Comprador';
        let rolClass = 'badge-rol-comprador';
        if (sesion.rol === 'vendedor') {
            rolIcon = '🐷';
            rolLabel = 'Vendedor';
            rolClass = 'badge-rol-vendedor';
        } else if (sesion.rol === 'ambos') {
            rolIcon = '🔄';
            rolLabel = 'Vendedor & Comprador';
            rolClass = 'badge-rol-ambos';
        }
        elRolBadge.innerHTML = `${rolIcon} <strong>${rolLabel}</strong>`;
        elRolBadge.className = 'cuenta-rol-badge ' + rolClass;
    }

    // Formulario de edición
    const inNombre = document.getElementById('perfil-nombre');
    const inTel = document.getElementById('perfil-telefono');
    const inUbicacion = document.getElementById('perfil-ubicacion');
    const inBio = document.getElementById('perfil-bio');
    const selRol = document.getElementById('perfil-rol-select');

    if (inNombre) inNombre.value = sesion.usuario || '';
    if (inTel) inTel.value = sesion.telefono || '';
    if (inUbicacion) inUbicacion.value = sesion.ubicacion || '';
    if (inBio) inBio.value = sesion.bio || '';
    if (selRol) selRol.value = sesion.rol || 'comprador';
}

function guardarCambiosPerfil(e) {
    e.preventDefault();
    const usuario = document.getElementById('perfil-nombre')?.value.trim();
    const telefono = document.getElementById('perfil-telefono')?.value.trim();
    const ubicacion = document.getElementById('perfil-ubicacion')?.value.trim();
    const bio = document.getElementById('perfil-bio')?.value.trim();
    const rol = document.getElementById('perfil-rol-select')?.value;
    const nuevoPass = document.getElementById('perfil-pass')?.value;

    const updates = { usuario, telefono, ubicacion, bio, rol };
    if (nuevoPass && nuevoPass.trim().length >= 6) {
        updates.pass = nuevoPass.trim();
    }

    const res = DB.actualizarPerfil(updates);
    if (!res.ok) {
        mostrarToast('❌ ' + res.error, 'error');
        return;
    }

    actualizarUISesion();
    renderizarDatosCuenta();
    mostrarToast('✅ Perfil y rol actualizados correctamente');
}

function cambiarRolRapido(nuevoRol) {
    const res = DB.cambiarRol(nuevoRol);
    if (res.ok) {
        actualizarUISesion();
        renderizarDatosCuenta();
        mostrarToast('🔄 Rol cambiado a ' + nuevoRol.toUpperCase());
    }
}

function cerrarSesionApp() {
    DB.cerrarSesion();
    actualizarUISesion();
    cerrarModalCuenta();
    mostrarToast('👋 Has cerrado sesión');
    // Redirigir a inicio si es necesario o refrescar UI
    if (window.location.pathname.includes('vender.html')) {
        setTimeout(() => window.location.reload(), 1000);
    }
}

// ==========================================
// RENDERIZADO DE "MIS COMPRAS" (HISTORIAL)
// ==========================================
function renderizarMisCompras() {
    const sesion = DB.getSesion();
    const contenedor = document.getElementById('lista-mis-compras');
    if (!contenedor) return;

    if (!sesion) {
        contenedor.innerHTML = `<div class="cuenta-vacia"><p>Inicia sesión para ver tu historial de compras.</p></div>`;
        return;
    }

    const compras = DB.getComprasPorUsuario(sesion.id);

    if (!compras.length) {
        contenedor.innerHTML = `
            <div class="cuenta-vacia">
                <span class="icono-vacio">🛒</span>
                <h3>Aún no has realizado compras</h3>
                <p>Explora nuestro mercado porcino y encuentra los mejores ejemplares para tu granja.</p>
                <a href="comprar.html" class="btn-principal" style="margin-top:15px;display:inline-block;">Explorar Mercado</a>
            </div>`;
        return;
    }

    contenedor.innerHTML = compras.map(c => `
        <div class="tarjeta-orden-compra">
            <div class="cabecera-orden">
                <div>
                    <span class="num-orden">Pedido #${c.id}</span>
                    <span class="fecha-orden">📅 ${c.fecha}</span>
                </div>
                <span class="estado-orden">${c.estado}</span>
            </div>
            <div class="items-orden">
                ${c.items.map(it => `
                    <div class="item-fila-orden">
                        <img src="${it.imagen}" alt="${it.nombre}" class="img-orden-min">
                        <div class="info-orden-min">
                            <h4>${it.nombre}</h4>
                            <p>${it.cantidad} unidad(es) × ${it.precioStr}</p>
                        </div>
                        <div class="subtotal-orden-min">${it.subtotalStr}</div>
                    </div>
                `).join('')}
            </div>
            <div class="pie-orden">
                <div class="entrega-info-orden">
                    <strong>📍 Entrega:</strong> ${c.datosEntrega.ciudad || 'Ubalá, Cundinamarca'} | <strong>Método:</strong> ${c.metodoPago}
                </div>
                <div class="total-orden-box">
                    <span>Total Pagado:</span>
                    <strong class="total-orden-monto">${c.totalStr}</strong>
                </div>
            </div>
        </div>
    `).join('');
}

// ==========================================
// RENDERIZADO DE "MIS PUBLICACIONES" (VENDEDOR)
// ==========================================
function renderizarMisPublicaciones() {
    const sesion = DB.getSesion();
    const contenedor = document.getElementById('lista-mis-ventas');
    if (!contenedor) return;

    if (!sesion) {
        contenedor.innerHTML = `<div class="cuenta-vacia"><p>Inicia sesión para ver tus publicaciones.</p></div>`;
        return;
    }

    const publicaciones = DB.getProductosPorVendedor(sesion.id);

    if (!publicaciones.length) {
        contenedor.innerHTML = `
            <div class="cuenta-vacia">
                <span class="icono-vacio">🐷</span>
                <h3>No tienes cerdos publicados en venta</h3>
                <p>Publica tus animales o lotes y llega a miles de compradores en toda la región.</p>
                <a href="vender.html" class="btn-principal" style="margin-top:15px;display:inline-block;">+ Publicar Anuncio</a>
            </div>`;
        return;
    }

    contenedor.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
            <p style="color:#666;font-size:0.9rem;">Tienes <strong>${publicaciones.length}</strong> publicación(es) activa(s)</p>
            <a href="vender.html" class="btn-principal" style="padding:7px 16px;font-size:0.85rem;">+ Nueva Publicación</a>
        </div>
        <div class="grilla-mis-publicaciones">
            ${publicaciones.map(p => `
                <div class="tarjeta-mi-publicacion">
                    <div class="img-mi-pub" style="background-image:url('${p.imagen}')">
                        <span class="badge-stock">${p.cantidad > 0 ? p.cantidad + ' disp.' : 'Agotado'}</span>
                    </div>
                    <div class="info-mi-pub">
                        <span class="cat-mi-pub">${p.categoria} · ${p.raza.toUpperCase()}</span>
                        <h4>${p.nombre}</h4>
                        <div class="precio-mi-pub">${p.precioStr}</div>
                        <p class="det-mi-pub">📍 ${p.lugar} · 📅 ${p.fechaPublicacion || 'Reciente'}</p>
                        <div class="acciones-mi-pub">
                            <a href="comprar.html" class="btn-ver-tienda">Ver en Tienda</a>
                            <button class="btn-eliminar-pub" onclick="eliminarPublicacion(${p.id})">🗑️ Eliminar</button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function eliminarPublicacion(id) {
    if (confirm('¿Estás seguro de que deseas retirar esta publicación de la venta?')) {
        const res = DB.eliminarProducto(id);
        if (res.ok) {
            mostrarToast('✅ Publicación eliminada con éxito');
            renderizarMisPublicaciones();
            // Si estamos en comprar.html, refrescar productos
            if (typeof window.recargarCatalogo === 'function') {
                window.recargarCatalogo();
            }
        } else {
            mostrarToast('❌ ' + res.error, 'error');
        }
    }
}

// ==========================================
// CARRITO DE COMPRAS
// ==========================================
let carrito = DB.getCarrito();

function guardarCarrito() {
    DB.guardarCarrito(carrito);
}

function formatPrecio(n) {
    return DB.formatPrecio(n);
}

function actualizarBadge() {
    const total = carrito.reduce((s, i) => s + i.cantidadCarrito, 0);
    document.querySelectorAll('.badge-carrito').forEach(b => b.textContent = total);
}

function actualizarCarrito() {
    const lista = document.getElementById('lista-carrito');
    const pie = document.getElementById('pie-carrito');
    actualizarBadge();
    guardarCarrito();
    if (!lista) return;

    if (!carrito.length) {
        lista.innerHTML = `
            <div class="carrito-vacio">
                <span>🛒</span>
                <p>Tu carrito está vacío</p>
                <p style="font-size:.85rem;color:#bbb;">¡Explora los porcinos disponibles!</p>
                <a href="comprar.html" class="btn-principal" style="padding:8px 18px;font-size:0.85rem;margin-top:10px;" onclick="cerrarCarrito()">Comprar Ahora</a>
            </div>`;
        if (pie) pie.style.display = 'none';
        return;
    }

    lista.innerHTML = carrito.map(i => `
        <div class="item-carrito">
            <div class="img-item-carrito" style="background-image:url('${i.imagen}')"></div>
            <div class="info-item-carrito">
                <h4>${i.nombre}</h4>
                <div class="precio-item">${formatPrecio(i.precio * i.cantidadCarrito)}</div>
                <div class="controles-cantidad">
                    <button onclick="cambiarCantidadCarrito(${i.id}, -1)">−</button>
                    <span>${i.cantidadCarrito}</span>
                    <button onclick="cambiarCantidadCarrito(${i.id}, 1)">+</button>
                </div>
            </div>
            <button class="btn-eliminar-item" onclick="eliminarItemCarrito(${i.id})" title="Eliminar producto">🗑️</button>
        </div>`).join('');

    const total = carrito.reduce((s, i) => s + (i.precio * i.cantidadCarrito), 0);
    const elTotal = document.getElementById('total-carrito');
    if (elTotal) elTotal.textContent = formatPrecio(total);
    if (pie) pie.style.display = 'block';
}

function cambiarCantidadCarrito(id, d) {
    const it = carrito.find(i => i.id === id);
    if (it) {
        it.cantidadCarrito = Math.max(1, it.cantidadCarrito + d);
        actualizarCarrito();
    }
}

function eliminarItemCarrito(id) {
    carrito = carrito.filter(i => i.id !== id);
    actualizarCarrito();
    mostrarToast('🗑️ Producto retirado del carrito');
}

function agregarItemCarrito(p, cantidad = 1) {
    if (!p) return;
    const ex = carrito.find(i => i.id === p.id);
    const cantNum = Number(cantidad) || 1;
    const stockMax = p.cantidad || 99;

    if (ex) {
        ex.cantidadCarrito = Math.min(ex.cantidadCarrito + cantNum, stockMax);
    } else {
        carrito.push({
            id: p.id,
            nombre: p.nombre || p.titulo,
            precio: p.precio,
            imagen: p.imagen,
            cantidad: p.cantidad,
            vendedor: p.vendedor,
            cantidadCarrito: Math.min(cantNum, stockMax)
        });
    }
    actualizarCarrito();
    mostrarToast('✅ "' + (p.nombre || p.titulo) + '" añadido al carrito');
}

function abrirCarrito() {
    const panel = document.getElementById('panel-carrito');
    const overlay = document.getElementById('overlay-carrito');
    if (panel && overlay) {
        panel.classList.add('abierto');
        overlay.classList.add('activo');
        document.body.style.overflow = 'hidden';
    }
}

function cerrarCarrito() {
    const panel = document.getElementById('panel-carrito');
    const overlay = document.getElementById('overlay-carrito');
    if (panel && overlay) {
        panel.classList.remove('abierto');
        overlay.classList.remove('activo');
        document.body.style.overflow = '';
    }
}

// ==========================================
// CHECKOUT Y PROCEDER CON LA COMPRA
// ==========================================
let metodoPagoSeleccionado = 'Nequi / Daviplata';

function procesarPago() {
    if (!carrito.length) {
        mostrarToast('⚠️ El carrito está vacío');
        return;
    }
    cerrarCarrito();
    abrirModalCheckout();
}

function abrirModalCheckout() {
    const overlay = document.getElementById('overlay-checkout');
    if (!overlay) return;

    const sesion = DB.getSesion();
    const resumenItems = document.getElementById('checkout-items-resumen');
    const totalPagar = document.getElementById('checkout-total-pagar');

    // Cargar datos del usuario si existen
    if (sesion) {
        const inNombre = document.getElementById('checkout-nombre');
        const inTel = document.getElementById('checkout-telefono');
        const inDir = document.getElementById('checkout-direccion');
        const inCiudad = document.getElementById('checkout-ciudad');

        if (inNombre && !inNombre.value) inNombre.value = sesion.usuario || '';
        if (inTel && !inTel.value) inTel.value = sesion.telefono || '';
        if (inDir && !inDir.value) inDir.value = sesion.ubicacion || '';
        if (inCiudad && !inCiudad.value) inCiudad.value = 'Ubalá, Cundinamarca';
    }

    // Renderizar resumen de productos
    const total = carrito.reduce((s, i) => s + (i.precio * i.cantidadCarrito), 0);
    if (resumenItems) {
        resumenItems.innerHTML = carrito.map(it => `
            <div class="checkout-item-fila">
                <img src="${it.imagen}" alt="${it.nombre}">
                <div class="checkout-item-info">
                    <strong>${it.nombre}</strong>
                    <span>${it.cantidadCarrito} unid. × ${formatPrecio(it.precio)}</span>
                </div>
                <div class="checkout-item-subtotal">${formatPrecio(it.precio * it.cantidadCarrito)}</div>
            </div>
        `).join('');
    }

    if (totalPagar) totalPagar.textContent = formatPrecio(total);

    overlay.classList.add('activo');
    document.body.style.overflow = 'hidden';
}

function cerrarModalCheckout() {
    const overlay = document.getElementById('overlay-checkout');
    if (overlay) overlay.classList.remove('activo');
    document.body.style.overflow = '';
}

function seleccionarMetodoPago(metodo, btn) {
    metodoPagoSeleccionado = metodo;
    document.querySelectorAll('.metodo-pago-card').forEach(c => c.classList.remove('activo'));
    if (btn) btn.classList.add('activo');
}

function confirmarCompraCheckout(e) {
    e.preventDefault();
    if (!carrito.length) {
        mostrarToast('⚠️ El carrito está vacío');
        cerrarModalCheckout();
        return;
    }

    const nombre = document.getElementById('checkout-nombre')?.value.trim();
    const telefono = document.getElementById('checkout-telefono')?.value.trim();
    const direccion = document.getElementById('checkout-direccion')?.value.trim();
    const ciudad = document.getElementById('checkout-ciudad')?.value.trim();
    const notas = document.getElementById('checkout-notas')?.value.trim();

    if (!nombre || !telefono || !direccion) {
        mostrarToast('❌ Por favor completa los datos de entrega', 'error');
        return;
    }

    const datosCompra = {
        items: [...carrito],
        metodoPago: metodoPagoSeleccionado,
        datosEntrega: { nombre, telefono, direccion, ciudad },
        notas: notas
    };

    const res = DB.crearCompra(datosCompra);
    if (!res.ok) {
        mostrarToast('❌ ' + res.error, 'error');
        return;
    }

    // Actualizar carrito local en memoria
    carrito = [];
    actualizarCarrito();
    cerrarModalCheckout();

    // Mostrar recibo / comprobante de éxito
    mostrarReciboCompra(res.compra);
}

function mostrarReciboCompra(compra) {
    const overlay = document.getElementById('overlay-recibo');
    if (!overlay) {
        mostrarToast('🎉 ¡Compra realizada con éxito! Orden #' + compra.id);
        return;
    }

    document.getElementById('recibo-orden-id').textContent = '#' + compra.id;
    document.getElementById('recibo-fecha').textContent = compra.fecha;
    document.getElementById('recibo-cliente').textContent = compra.usuarioNombre;
    document.getElementById('recibo-metodo').textContent = compra.metodoPago;
    document.getElementById('recibo-entrega').textContent = compra.datosEntrega.direccion + ', ' + compra.datosEntrega.ciudad;
    document.getElementById('recibo-total').textContent = compra.totalStr;

    const listaItems = document.getElementById('recibo-lista-items');
    if (listaItems) {
        listaItems.innerHTML = compra.items.map(it => `
            <div class="recibo-item-fila">
                <span>${it.nombre} (${it.cantidad}x)</span>
                <strong>${it.subtotalStr}</strong>
            </div>
        `).join('');
    }

    overlay.classList.add('activo');
    document.body.style.overflow = 'hidden';
}

function cerrarModalRecibo() {
    const overlay = document.getElementById('overlay-recibo');
    if (overlay) overlay.classList.remove('activo');
    document.body.style.overflow = '';
}

// ==========================================
// AUTO-INICIALIZACIÓN AL CARGAR CUALQUIER PÁGINA
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    cerrarMenuMovil();
    actualizarUISesion();
    actualizarCarrito();

    // Registro de Service Worker para PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('SW registrado', reg.scope))
                .catch(err => console.log('Error SW', err));
        });
    }
});
