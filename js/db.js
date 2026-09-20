/**
 * PORKCENTER - Base de Datos Local y Gestión de Persistencia (js/db.js)
 * Manejo unificado y vinculado de Usuarios, Roles, Catálogo de Productos, Compras/Pedidos y Carrito.
 */

const DB = (function () {
    const API_URL = (function() {
        if (typeof window !== 'undefined' && window.location && window.location.hostname.includes('railway.app')) {
            return window.location.origin;
        }
        return 'https://porkcentertogithub-production.up.railway.app';
    })();

    function syncConServidor(endpoint, datos) {
        try {
            if (typeof fetch !== 'undefined') {
                fetch(API_URL + endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datos)
                }).catch(() => {});
            }
        } catch (e) {}
    }

    const STORAGE_KEYS = {
        USUARIOS: 'pc_usuarios',
        PRODUCTOS: 'pc_productos',
        COMPRAS: 'pc_compras',
        SESION: 'pc_sesion',
        CARRITO: 'pc_carrito'
    };

    // Usuarios predeterminados para pruebas
    const SEED_USUARIOS = [
        {
            id: 'usr_vendedor_1',
            usuario: 'Carlos Rodríguez',
            email: 'vendedor@porcimarket.com',
            pass: '123456',
            rol: 'vendedor',
            telefono: '3108373303',
            ubicacion: 'Ubalá, Cundinamarca',
            bio: 'Criador y productor porcícola con más de 8 años en genética Duroc y Pietrain.',
            fechaRegistro: '2026-01-10',
            avatar: '🐷'
        },
        {
            id: 'usr_comprador_1',
            usuario: 'Juan Porcicultor',
            email: 'comprador@porcimarket.com',
            pass: '123456',
            rol: 'comprador',
            telefono: '3201234567',
            ubicacion: 'Gachalá, Cundinamarca',
            bio: 'Comprador de lechones y cerdos de engorde.',
            fechaRegistro: '2026-02-15',
            avatar: '🛒'
        },
        {
            id: 'usr_ambos_1',
            usuario: 'Granja La Esperanza',
            email: 'admin@porcimarket.com',
            pass: '123456',
            rol: 'ambos',
            telefono: '3159876543',
            ubicacion: 'Ubalá, Cundinamarca',
            bio: 'Productor y comercializador integral de porcinos.',
            fechaRegistro: '2026-01-01',
            avatar: '🔄'
        }
    ];

    // Productos iniciales del catálogo
    const SEED_PRODUCTOS = [
        {
            id: 1,
            titulo: 'Cerdo Duroc Reproductor',
            nombre: 'Cerdo Duroc Reproductor',
            categoria: 'Alta Genética',
            raza: 'duroc',
            imagen: 'images/pig_duroc.png',
            precio: 1200000,
            precioStr: '$1,200,000 COP',
            edad: '18 meses',
            peso: '120 kg',
            cantidad: 1,
            lugar: 'Ubalá, Cundinamarca',
            lugarKey: 'ubala',
            descripcion: 'Excelente reproductor de raza Duroc puro con registro genético. Ideal para mejorar la calidad cárnica de su piara. Animal sano, vacunado y desparasitado con todos sus certificados al día.',
            fechaPublicacion: '2026-08-15',
            vendedor: {
                id: 'usr_vendedor_1',
                nombre: 'Carlos Rodríguez',
                telefono: '3108373303',
                contacto: '📞 310 837 3303 | Ubalá, Cund.'
            }
        },
        {
            id: 2,
            titulo: 'Lote Lechones Pietrain',
            nombre: 'Lote Lechones Pietrain',
            categoria: 'Carne Magra',
            raza: 'pietrain',
            imagen: 'images/pig_pietrain.png',
            precio: 300000,
            precioStr: '$300,000 COP c/u',
            edad: '3 meses',
            peso: '12 kg prom.',
            cantidad: 15,
            lugar: 'Gachalá, Cundinamarca',
            lugarKey: 'gachala',
            descripcion: 'Lote de 15 lechones Pietrain de excelente conversión cárnica. Alta proporción de carne magra, músculo definido. Animales destetados, con vacunas completas y en perfectas condiciones sanitarias.',
            fechaPublicacion: '2026-08-16',
            vendedor: {
                id: 'seed-2',
                nombre: 'María Gómez',
                telefono: '3001234567',
                contacto: '📞 300 123 4567 | Gachalá, Cund.'
            }
        },
        {
            id: 3,
            titulo: 'Cerdos de Engorde Landrace',
            nombre: 'Cerdos de Engorde Landrace',
            categoria: 'Ceba',
            raza: 'landrace',
            imagen: 'images/cerdo_landrace.jpg',
            precio: 850000,
            precioStr: '$850,000 COP',
            edad: '10 meses',
            peso: '90 kg prom.',
            cantidad: 5,
            lugar: 'La Calera, Cund.',
            lugarKey: 'calera',
            descripcion: 'Cerdos de engorde raza Landrace, reconocidos por su excelente longitud corporal y calidad de canal. Listos para sacrificio o como base reproductiva. Manejo sanitario completo.',
            fechaPublicacion: '2026-08-17',
            vendedor: {
                id: 'seed-3',
                nombre: 'Jhon Vargas',
                telefono: '3209876543',
                contacto: '📞 320 987 6543 | La Calera, Cund.'
            }
        },
        {
            id: 4,
            titulo: 'Hembra de Cría F1',
            nombre: 'Hembra de Cría F1',
            categoria: 'Reproductora',
            raza: 'duroc',
            imagen: 'images/cerda_f1.jpg',
            precio: 1500000,
            precioStr: '$1,500,000 COP',
            edad: '8 meses',
            peso: '75 kg',
            cantidad: 1,
            lugar: 'Ubalá, Cundinamarca',
            lugarKey: 'ubala',
            descripcion: 'Hembra F1 cruce Duroc x Landrace, seleccionada por su capacidad materna y prolificidad. Primer celo registrado, excelente temperamento y adaptación al medio.',
            fechaPublicacion: '2026-08-18',
            vendedor: {
                id: 'seed-4',
                nombre: 'Ana Martínez',
                telefono: '3156789012',
                contacto: '📞 315 678 9012 | Ubalá, Cund.'
            }
        },
        {
            id: 5,
            titulo: 'Lechones Pietrain',
            nombre: 'Lechones Pietrain',
            categoria: 'Cerditos',
            raza: 'pietrain',
            imagen: 'images/cerditos_pietrain.png',
            precio: 250000,
            precioStr: '$250,000 COP c/u',
            edad: '2 meses',
            peso: '8 kg prom.',
            cantidad: 10,
            lugar: 'Ubalá, Cundinamarca',
            lugarKey: 'ubala',
            descripcion: 'Lechones Pietrain recién destetados, de alta calidad genética. Excelente conformación corporal y buena ganancia diaria de peso. Paquete sanitario completo incluido.',
            fechaPublicacion: '2026-08-19',
            vendedor: {
                id: 'seed-5',
                nombre: 'Luis Peña',
                telefono: '3112345678',
                contacto: '📞 311 234 5678 | Ubalá, Cund.'
            }
        }
    ];

    // Inicialización de almacenamiento
    function init() {
        if (!localStorage.getItem(STORAGE_KEYS.PRODUCTOS)) {
            localStorage.setItem(STORAGE_KEYS.PRODUCTOS, JSON.stringify(SEED_PRODUCTOS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.USUARIOS)) {
            localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(SEED_USUARIOS));
        } else {
            // Asegurar que existan los seed users si la lista está vacía
            try {
                const u = JSON.parse(localStorage.getItem(STORAGE_KEYS.USUARIOS) || '[]');
                if (!u.length) {
                    localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(SEED_USUARIOS));
                }
            } catch (e) {
                localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(SEED_USUARIOS));
            }
        }
        if (!localStorage.getItem(STORAGE_KEYS.COMPRAS)) {
            localStorage.setItem(STORAGE_KEYS.COMPRAS, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.CARRITO)) {
            localStorage.setItem(STORAGE_KEYS.CARRITO, JSON.stringify([]));
        }
    }

    // Formateador de precios en COP
    function formatPrecio(n) {
        if (typeof n !== 'number') n = Number(n) || 0;
        return '$' + n.toLocaleString('es-CO') + ' COP';
    }

    // Normalizador de lugares para filtros
    function normalizarLugarKey(lugar) {
        if (!lugar) return 'otro';
        const str = lugar.toLowerCase();
        if (str.includes('ubal')) return 'ubala';
        if (str.includes('gachal')) return 'gachala';
        if (str.includes('calera')) return 'calera';
        return 'otro';
    }

    // ==========================================
    // USUARIOS Y AUTENTICACIÓN
    // ==========================================
    function getUsuarios() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.USUARIOS) || '[]');
        } catch (e) {
            return SEED_USUARIOS;
        }
    }

    function guardarUsuarios(usuarios) {
        localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(usuarios));
    }

    function getUsuarioPorEmail(email) {
        if (!email) return null;
        const norm = email.trim().toLowerCase();
        return getUsuarios().find(u => u.email && u.email.toLowerCase() === norm) || null;
    }

    function getUsuarioPorId(id) {
        if (!id) return null;
        return getUsuarios().find(u => u.id === id) || null;
    }

    function registro(data) {
        const { usuario, email, pass, rol = 'comprador', telefono = '', ubicacion = 'Ubalá, Cundinamarca' } = data;
        
        if (!usuario || !email || !pass) {
            return { ok: false, error: 'Por favor completa todos los campos obligatorios.' };
        }
        if (pass.length < 6) {
            return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
        }

        const normEmail = email.trim().toLowerCase();
        const usuarioExistente = getUsuarioPorEmail(normEmail);

        // Si ya existe con la misma contraseña, iniciar sesión directamente
        if (usuarioExistente) {
            if (usuarioExistente.pass === pass) {
                setSesion(usuarioExistente);
                return { ok: true, usuario: usuarioExistente, sesionIniciada: true };
            }
            return { ok: false, error: 'Este correo ya está registrado. Inicia sesión con tu contraseña.' };
        }

        const nuevoUsuario = {
            id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            usuario: usuario.trim(),
            email: normEmail,
            pass: pass,
            rol: rol, // 'comprador', 'vendedor', 'ambos'
            telefono: telefono ? telefono.trim() : '3108373303',
            ubicacion: ubicacion ? ubicacion.trim() : 'Ubalá, Cundinamarca',
            bio: rol === 'vendedor' ? 'Criador y productor porcícola' : (rol === 'ambos' ? 'Productor y comprador porcícola' : 'Comprador en PORKCENTER'),
            fechaRegistro: new Date().toISOString().split('T')[0],
            avatar: rol === 'vendedor' ? '🐷' : (rol === 'ambos' ? '🔄' : '🛒')
        };

        const usuarios = getUsuarios();
        usuarios.push(nuevoUsuario);
        guardarUsuarios(usuarios);

        // Iniciar sesión automáticamente
        setSesion(nuevoUsuario);
        return { ok: true, usuario: nuevoUsuario };
    }

    function login(email, pass) {
        if (!email || !pass) {
            return { ok: false, error: 'Ingresa tu correo y contraseña.' };
        }
        const normEmail = email.trim().toLowerCase();
        const user = getUsuarios().find(u => u.email && u.email.toLowerCase() === normEmail && u.pass === pass);
        
        if (!user) {
            return { ok: false, error: 'Correo o contraseña incorrectos.' };
        }

        setSesion(user);
        
        // Registrar log de inicio de sesión
        try {
            const logs = JSON.parse(localStorage.getItem('pc_log_sesiones') || '[]');
            logs.unshift({
                idLog: 'LOG-' + Date.now(),
                idUsuario: user.id,
                usuario: user.usuario,
                email: user.email,
                rol: user.rol,
                fechaHoraIngreso: new Date().toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'medium' }),
                dispositivo: navigator.userAgent.includes('Mobile') ? 'Dispositivo Móvil' : 'Navegador Web Desktop',
                estado: 'Sesión Iniciada'
            });
            localStorage.setItem('pc_log_sesiones', JSON.stringify(logs.slice(0, 50)));
        } catch (e) {}

        syncConServidor('/api/login', { email: user.email, pass: pass });

        return { ok: true, usuario: user };
    }

    function getSesion() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.SESION) || 'null');
        } catch (e) {
            return null;
        }
    }

    function setSesion(user) {
        if (!user) {
            localStorage.removeItem(STORAGE_KEYS.SESION);
        } else {
            const copia = { ...user };
            localStorage.setItem(STORAGE_KEYS.SESION, JSON.stringify(copia));
        }
    }

    function cerrarSesion() {
        const sesion = getSesion();
        if (sesion) {
            try {
                const logs = JSON.parse(localStorage.getItem('pc_log_sesiones') || '[]');
                if (logs.length && logs[0].idUsuario === sesion.id) {
                    logs[0].fechaHoraCierre = new Date().toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'medium' });
                    logs[0].estado = 'Sesión Cerrada';
                    localStorage.setItem('pc_log_sesiones', JSON.stringify(logs));
                }
            } catch (e) {}
        }
        localStorage.removeItem(STORAGE_KEYS.SESION);
    }

    function getLogSesiones() {
        try {
            const logs = JSON.parse(localStorage.getItem('pc_log_sesiones') || '[]');
            if (!logs.length) {
                return [
                    { idLog: 'LOG-101', idUsuario: 'usr_vendedor_1', usuario: 'Carlos Rodríguez', rol: 'vendedor', fechaHoraIngreso: '18/09/2026, 08:30:15', dispositivo: 'Dispositivo Móvil', estado: 'Sesión Cerrada' },
                    { idLog: 'LOG-102', idUsuario: 'usr_comprador_1', usuario: 'Juan Porcicultor', rol: 'comprador', fechaHoraIngreso: '18/09/2026, 09:15:40', dispositivo: 'Navegador Web Desktop', estado: 'Sesión Cerrada' },
                    { idLog: 'LOG-103', idUsuario: 'usr_ambos_1', usuario: 'Granja La Esperanza', rol: 'ambos', fechaHoraIngreso: '19/09/2026, 07:00:00', dispositivo: 'Navegador Web Desktop', estado: 'Sesión Iniciada' }
                ];
            }
            return logs;
        } catch (e) {
            return [];
        }
    }

    function actualizarPerfil(updates) {
        const sesion = getSesion();
        if (!sesion) return { ok: false, error: 'No hay sesión activa.' };

        const usuarios = getUsuarios();
        const idx = usuarios.findIndex(u => u.id === sesion.id || (u.email && u.email.toLowerCase() === sesion.email.toLowerCase()));
        
        if (idx === -1) return { ok: false, error: 'Usuario no encontrado.' };

        // Actualizar campos
        if (updates.usuario) usuarios[idx].usuario = updates.usuario.trim();
        if (updates.telefono !== undefined) usuarios[idx].telefono = updates.telefono.trim();
        if (updates.ubicacion !== undefined) usuarios[idx].ubicacion = updates.ubicacion.trim();
        if (updates.rol) {
            usuarios[idx].rol = updates.rol;
            usuarios[idx].avatar = updates.rol === 'vendedor' ? '🐷' : (updates.rol === 'ambos' ? '🔄' : '🛒');
        }
        if (updates.bio !== undefined) usuarios[idx].bio = updates.bio.trim();
        if (updates.pass) usuarios[idx].pass = updates.pass;

        guardarUsuarios(usuarios);
        setSesion(usuarios[idx]);
        return { ok: true, usuario: usuarios[idx] };
    }

    function cambiarRol(nuevoRol) {
        return actualizarPerfil({ rol: nuevoRol });
    }

    // ==========================================
    // PRODUCTOS Y PUBLICACIONES DE VENTA
    // ==========================================
    function getProductos() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTOS) || '[]');
        } catch (e) {
            return SEED_PRODUCTOS;
        }
    }

    function guardarProductos(productos) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTOS, JSON.stringify(productos));
    }

    function getProductoPorId(id) {
        const idNum = Number(id);
        return getProductos().find(p => p.id === idNum || p.id === id) || null;
    }

    function agregarProducto(data) {
        const sesion = getSesion();
        const precioNum = Number(data.precio) || 0;
        const cantidadNum = Number(data.cantidad) || 1;

        // Imágenes por defecto según raza si no se adjuntó foto
        let imagenUrl = data.imagen;
        if (!imagenUrl || imagenUrl.trim() === '') {
            const razaKey = (data.raza || '').toLowerCase();
            if (razaKey === 'duroc') imagenUrl = 'images/pig_duroc.png';
            else if (razaKey === 'pietrain') imagenUrl = 'images/pig_pietrain.png';
            else if (razaKey === 'landrace') imagenUrl = 'images/cerdo_landrace.jpg';
            else if (razaKey === 'f1') imagenUrl = 'images/cerda_f1.jpg';
            else imagenUrl = 'images/pig_duroc.png';
        }

        const nombreVendedor = (sesion && sesion.usuario) ? sesion.usuario : (data.vendedorNombre || 'Productor PORKCENTER');
        const telVendedor = (sesion && sesion.telefono) ? sesion.telefono : (data.vendedorTelefono || '3108373303');
        const ubicacionVendedor = data.ubicacion || (sesion && sesion.ubicacion) || 'Ubalá, Cundinamarca';
        const vendedorId = (sesion && sesion.id) ? sesion.id : 'usr_' + Date.now();

        const ahora = new Date();
        const fechaStr = ahora.toISOString().split('T')[0];
        const horaStr = ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
        const fechaHoraStr = ahora.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

        const nuevoProducto = {
            id: Date.now(),
            codigoLote: 'LOT-' + ahora.getFullYear() + '-' + Math.floor(100 + Math.random() * 900),
            titulo: data.titulo || 'Porcino en Venta',
            nombre: data.titulo || 'Porcino en Venta',
            categoria: data.categoria || 'Lechones',
            raza: data.raza || 'duroc',
            imagen: imagenUrl,
            precio: precioNum,
            precioStr: formatPrecio(precioNum) + (cantidadNum > 1 ? ' c/u' : ''),
            edad: data.edad || '3 meses',
            peso: data.peso || '25 kg prom.',
            cantidad: cantidadNum,
            lugar: ubicacionVendedor,
            lugarKey: normalizarLugarKey(ubicacionVendedor),
            descripcion: data.descripcion || 'Animal de excelente calidad genética, en óptimas condiciones de salud.',
            fechaPublicacion: fechaStr,
            horaPublicacion: horaStr,
            fechaPublicacionHora: fechaHoraStr,
            vacunado: true,
            desparasitado: true,
            certificadoIca: true,
            vendedor: {
                id: vendedorId,
                nombre: nombreVendedor,
                telefono: telVendedor,
                contacto: `📞 ${telVendedor} | ${ubicacionVendedor}`
            }
        };

        const productos = getProductos();
        productos.unshift(nuevoProducto); // Aparece inmediatamente al inicio del catálogo
        guardarProductos(productos);

        syncConServidor('/api/porcinos', {
            id_vendedor: 1,
            titulo: nuevoProducto.nombre,
            descripcion: nuevoProducto.descripcion,
            precio: nuevoProducto.precio,
            cantidad: nuevoProducto.cantidad,
            edad_texto: nuevoProducto.edad,
            peso_texto: nuevoProducto.peso,
            imagen: nuevoProducto.imagen
        });

        return { ok: true, producto: nuevoProducto };
    }

    function eliminarProducto(id) {
        const sesion = getSesion();
        const idNum = Number(id);
        let productos = getProductos();
        const prod = productos.find(p => p.id === idNum || p.id === id);

        if (!prod) return { ok: false, error: 'Producto no encontrado.' };

        // Validar permisos
        if (sesion && prod.vendedor && prod.vendedor.id) {
            const esDuenio = prod.vendedor.id === sesion.id || prod.vendedor.nombre === sesion.usuario;
            const esAdmin = sesion.rol === 'admin' || sesion.rol === 'ambos';
            if (!esDuenio && !esAdmin && prod.vendedor.id !== 'seed-1') {
                return { ok: false, error: 'No tienes permiso para eliminar esta publicación.' };
            }
        }

        productos = productos.filter(p => p.id !== idNum && p.id !== id);
        guardarProductos(productos);
        return { ok: true };
    }

    function getProductosPorVendedor(vendedorId) {
        const sesion = getSesion();
        const todos = getProductos();
        if (!vendedorId && !sesion) return [];

        return todos.filter(p => {
            if (!p.vendedor) return false;
            if (vendedorId && p.vendedor.id === vendedorId) return true;
            if (sesion && (p.vendedor.id === sesion.id || p.vendedor.nombre === sesion.usuario)) return true;
            return false;
        });
    }

    // ==========================================
    // COMPRAS, PEDIDOS Y CHECKOUT
    // ==========================================
    function getCompras() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPRAS) || '[]');
        } catch (e) {
            return [];
        }
    }

    function guardarCompras(compras) {
        localStorage.setItem(STORAGE_KEYS.COMPRAS, JSON.stringify(compras));
    }

    function getComprasPorUsuario(usuarioId) {
        const sesion = getSesion();
        const todas = getCompras();
        if (!usuarioId && !sesion) return [];

        return todas.filter(c => {
            if (usuarioId && c.idUsuario === usuarioId) return true;
            if (sesion) {
                if (c.idUsuario === sesion.id) return true;
                if (sesion.email && c.usuarioEmail && c.usuarioEmail.toLowerCase() === sesion.email.toLowerCase()) return true;
                if (sesion.usuario && c.usuarioNombre === sesion.usuario) return true;
            }
            return false;
        });
    }

    function crearCompra(datosCompra) {
        const sesion = getSesion();
        const { items, metodoPago, datosEntrega, notas } = datosCompra;

        if (!items || !items.length) {
            return { ok: false, error: 'El carrito está vacío.' };
        }

        const total = items.reduce((acc, item) => acc + (item.precio * item.cantidadCarrito), 0);
        const compraId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

        const nuevaCompra = {
            id: compraId,
            idUsuario: sesion ? sesion.id : 'invitado',
            usuarioNombre: sesion ? sesion.usuario : (datosEntrega.nombre || 'Comprador Invitado'),
            usuarioEmail: sesion ? sesion.email : (datosEntrega.email || ''),
            fecha: new Date().toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }),
            fechaIso: new Date().toISOString(),
            items: items.map(it => {
                const prodRef = getProductoPorId(it.id) || {};
                return {
                    id: it.id,
                    codigoLote: prodRef.codigoLote || ('LOT-PROD-' + it.id),
                    nombre: it.nombre || it.titulo || prodRef.titulo || 'Porcino en Venta',
                    precio: it.precio,
                    precioStr: formatPrecio(it.precio),
                    cantidad: it.cantidadCarrito,
                    subtotal: it.precio * it.cantidadCarrito,
                    subtotalStr: formatPrecio(it.precio * it.cantidadCarrito),
                    imagen: it.imagen || prodRef.imagen,
                    raza: prodRef.raza || it.raza || 'Duroc',
                    categoria: prodRef.categoria || it.categoria || 'Alta Genética',
                    edad: prodRef.edad || it.edad || '3 meses',
                    peso: prodRef.peso || it.peso || '25 kg',
                    lugar: prodRef.lugar || it.lugar || 'Ubalá, Cundinamarca',
                    fechaPublicacionOriginal: prodRef.fechaPublicacion || '2026-08-15',
                    horaPublicacionOriginal: prodRef.horaPublicacion || '08:30 AM',
                    fechaPublicacionCompleta: prodRef.fechaPublicacionHora || (prodRef.fechaPublicacion + ' ' + (prodRef.horaPublicacion || '')),
                    vendedor: it.vendedor || prodRef.vendedor || { nombre: 'Carlos Rodríguez', telefono: '3108373303', contacto: '📞 310 837 3303 | Ubalá, Cund.' }
                };
            }),
            total: total,
            totalStr: formatPrecio(total),
            metodoPago: metodoPago || 'Nequi / Daviplata',
            datosEntrega: {
                nombre: datosEntrega.nombre || (sesion ? sesion.usuario : ''),
                telefono: datosEntrega.telefono || (sesion ? sesion.telefono : ''),
                direccion: datosEntrega.direccion || 'Entrega en granja acordada',
                ciudad: datosEntrega.ciudad || 'Ubalá, Cundinamarca',
                notas: notas || ''
            },
            estado: 'Confirmado - En Preparación'
        };

        const compras = getCompras();
        compras.unshift(nuevaCompra);
        guardarCompras(compras);

        // Descontar inventario disponible
        const productos = getProductos();
        items.forEach(item => {
            const p = productos.find(x => x.id === item.id);
            if (p) {
                p.cantidad = Math.max(0, p.cantidad - item.cantidadCarrito);
            }
        });
        guardarProductos(productos);

        // Vaciar carrito
        guardarCarrito([]);

        // Sincronizar compra con la base de datos MySQL en Railway
        syncConServidor('/api/comprar', {
            id_comprador: 2,
            id_metodo_pago: 1,
            direccion: nuevaCompra.datosEntrega.direccion,
            municipio: nuevaCompra.datosEntrega.ciudad,
            telefono: nuevaCompra.datosEntrega.telefono,
            notas: nuevaCompra.datosEntrega.notas,
            id_publicacion: (items[0] && items[0].id) || 1,
            cantidad: (items[0] && items[0].cantidadCarrito) || 1
        });

        return { ok: true, compra: nuevaCompra };
    }

    // ==========================================
    // CARRITO DE COMPRAS
    // ==========================================
    function getCarrito() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.CARRITO) || '[]');
        } catch (e) {
            return [];
        }
    }

    function guardarCarrito(items) {
        localStorage.setItem(STORAGE_KEYS.CARRITO, JSON.stringify(items));
    }

    // Inicializar al cargar el script
    init();

    return {
        init,
        formatPrecio,
        // Usuarios
        getUsuarios,
        getUsuarioPorId,
        getUsuarioPorEmail,
        registro,
        login,
        getSesion,
        setSesion,
        cerrarSesion,
        actualizarPerfil,
        cambiarRol,
        // Productos
        getProductos,
        getProductoPorId,
        agregarProducto,
        eliminarProducto,
        getProductosPorVendedor,
        // Compras
        getCompras,
        getComprasPorUsuario,
        crearCompra,
        // Sesiones y Log
        getLogSesiones,
        // Carrito
        getCarrito,
        guardarCarrito
    };
})();

// Exponer globalmente
window.DB = DB;
