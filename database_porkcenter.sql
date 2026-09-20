-- =============================================================================
-- BASE DE DATOS OFICIAL: PORKCENTER (PORCIMARKET COLOMBIA)
-- SISTEMA INTEGRAL DE GESTIÓN, TRAZABILIDAD Y COMERCIALIZACIÓN PORCÍCOLA
-- =============================================================================
-- MODELO: Relacional Normalizado en Tercera Forma Normal (3NF)
-- MOTOR COMPATIBLE: MySQL 8.0+ / MariaDB 10.4+ / PostgreSQL / SQLite
-- CODIFICACIÓN: UTF-8 Unicode (utf8mb4_unicode_ci)
-- HORA DE REFERENCIA: América/Bogotá (UTC-5)
-- FECHA DE REVISIÓN: 2026
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. CREACIÓN Y CONFIGURACIÓN DEL ENTORNO DE BASE DE DATOS
-- -----------------------------------------------------------------------------
DROP DATABASE IF EXISTS db_porkcenter;
CREATE DATABASE db_porkcenter 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE db_porkcenter;

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = "-05:00"; -- Hora de Colombia

-- -----------------------------------------------------------------------------
-- 2. TABLAS PARAMÉTRICAS Y GEOGRÁFICAS (DIVISIÓN POLÍTICA COLOMBIA)
-- -----------------------------------------------------------------------------

-- 2.1 Departamentos
DROP TABLE IF EXISTS departamentos;
CREATE TABLE departamentos (
    id_departamento INT AUTO_INCREMENT PRIMARY KEY,
    codigo_dane VARCHAR(5) NOT NULL UNIQUE,
    nombre_departamento VARCHAR(60) NOT NULL
) ENGINE=InnoDB COMMENT='Departamentos de Colombia';

-- 2.2 Municipios
DROP TABLE IF EXISTS municipios;
CREATE TABLE municipios (
    id_municipio INT AUTO_INCREMENT PRIMARY KEY,
    id_departamento INT NOT NULL,
    codigo_dane VARCHAR(10) NOT NULL UNIQUE,
    nombre_municipio VARCHAR(80) NOT NULL,
    FOREIGN KEY (id_departamento) REFERENCES departamentos(id_departamento) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Municipios donde operan granjas y compradores';

-- 2.3 Roles de Usuario
DROP TABLE IF EXISTS roles;
CREATE TABLE roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    codigo_rol VARCHAR(20) NOT NULL UNIQUE, -- 'comprador', 'vendedor', 'ambos', 'admin'
    nombre_rol VARCHAR(50) NOT NULL,
    descripcion TEXT
) ENGINE=InnoDB COMMENT='Roles de acceso y privilegios en la plataforma';

-- 2.4 Categorías del Mercado Porcino
DROP TABLE IF EXISTS categorias_porcino;
CREATE TABLE categorias_porcino (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    codigo_categoria VARCHAR(30) NOT NULL UNIQUE,
    nombre_categoria VARCHAR(60) NOT NULL, -- 'Alta Genética', 'Carne Magra', 'Ceba y Engorde', 'Cría', 'Destete'
    descripcion TEXT,
    color_badge VARCHAR(10) DEFAULT '#e82b10'
) ENGINE=InnoDB COMMENT='Clasificación zootécnica y comercial de los porcinos';

-- 2.5 Razas Porcinas
DROP TABLE IF EXISTS razas_porcino;
CREATE TABLE razas_porcino (
    id_raza INT AUTO_INCREMENT PRIMARY KEY,
    codigo_raza VARCHAR(30) NOT NULL UNIQUE,
    nombre_raza VARCHAR(60) NOT NULL, -- 'Duroc', 'Pietrain', 'Landrace', 'Large White', 'Hampshire'
    pais_origen VARCHAR(80),
    aptitud_principal ENUM('Carne', 'Reproducción', 'Doble Propósito', 'Rusticidad') DEFAULT 'Carne',
    caracteristicas_geneticas TEXT
) ENGINE=InnoDB COMMENT='Líneas genéticas y razas porcinas registradas';

-- 2.6 Métodos de Pago
DROP TABLE IF EXISTS metodos_pago;
CREATE TABLE metodos_pago (
    id_metodo INT AUTO_INCREMENT PRIMARY KEY,
    codigo_metodo VARCHAR(30) NOT NULL UNIQUE, -- 'nequi', 'daviplata', 'pse', 'transferencia', 'contra_entrega'
    nombre_metodo VARCHAR(60) NOT NULL,
    instrucciones_pago VARCHAR(255),
    activo BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB COMMENT='Pasarelas y medios de pago soportados';

-- -----------------------------------------------------------------------------
-- 3. TABLAS DE USUARIOS, GRANJAS Y CONTROL DE SESIONES
-- -----------------------------------------------------------------------------

-- 3.1 Usuarios / Productores / Compradores
DROP TABLE IF EXISTS usuarios;
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    id_rol INT NOT NULL,
    id_municipio INT NOT NULL,
    nombre_completo VARCHAR(120) NOT NULL,
    nombre_granja VARCHAR(120),
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    telefono_contacto VARCHAR(20) NOT NULL,
    direccion_residencia VARCHAR(180) NOT NULL,
    bio_descripcion TEXT,
    avatar_icono VARCHAR(10) DEFAULT '🐷',
    registro_ica_granja VARCHAR(50), -- Registro de Granja Porcícola Biosegura ante el ICA
    reputacion_promedio DECIMAL(3,2) DEFAULT 5.00,
    total_ventas_realizadas INT DEFAULT 0,
    total_compras_realizadas INT DEFAULT 0,
    estado_cuenta ENUM('activo', 'inactivo', 'suspendido') DEFAULT 'activo',
    fecha_registro_usuario DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_ultima_conexion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (id_municipio) REFERENCES municipios(id_municipio) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Usuarios del sistema con roles de comprador, criador o ambos';

-- 3.2 Historial y Bitácora de Inicios de Sesión (Logins)
DROP TABLE IF EXISTS log_inicios_sesion;
CREATE TABLE log_inicios_sesion (
    id_log_sesion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    rol_al_ingresar VARCHAR(30) NOT NULL,
    fecha_hora_ingreso DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_hora_cierre DATETIME NULL,
    ip_conexion VARCHAR(45) DEFAULT '127.0.0.1',
    dispositivo_navegador VARCHAR(255) DEFAULT 'Dispositivo Móvil / Web Browser',
    estado_sesion ENUM('activa', 'cerrada_por_usuario', 'cerrada_por_inactividad') DEFAULT 'activa',
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Registro detallado de accesos e inicios de sesión';

-- -----------------------------------------------------------------------------
-- 4. TABLAS DE PUBLICACIONES DE PORCINOS (VENDER) Y SANIDAD
-- -----------------------------------------------------------------------------

-- 4.1 Catálogo de Cerdos / Marranos en Venta
DROP TABLE IF EXISTS publicaciones_porcino;
CREATE TABLE publicaciones_porcino (
    id_publicacion INT AUTO_INCREMENT PRIMARY KEY,
    codigo_lote VARCHAR(30) NOT NULL UNIQUE, -- ej. 'LOT-2026-001'
    id_vendedor INT NOT NULL,
    id_raza INT NOT NULL,
    id_categoria INT NOT NULL,
    id_municipio INT NOT NULL,
    titulo_publicacion VARCHAR(150) NOT NULL,
    descripcion_detallada TEXT NOT NULL,
    edad_meses INT NOT NULL,
    edad_texto VARCHAR(40) NOT NULL, -- ej. '18 meses', '3 meses'
    peso_kg DECIMAL(6,2) NOT NULL,
    peso_texto VARCHAR(40) NOT NULL, -- ej. '120 kg', '12 kg prom.'
    cantidad_inicial INT NOT NULL DEFAULT 1,
    cantidad_disponible INT NOT NULL DEFAULT 1, -- Stock dinámico
    precio_unitario DECIMAL(12,2) NOT NULL, -- Precio por marrano en COP
    imagen_principal VARCHAR(255) NOT NULL,
    vacunado BOOLEAN DEFAULT TRUE,
    desparasitado BOOLEAN DEFAULT TRUE,
    certificado_genetico_ica BOOLEAN DEFAULT FALSE,
    estado_publicacion ENUM('disponible', 'reservado', 'agotado', 'pausado') DEFAULT 'disponible',
    fecha_publicacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    hora_publicacion TIME DEFAULT (CURRENT_TIME),
    fecha_ultima_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_vendedor) REFERENCES usuarios(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_raza) REFERENCES razas_porcino(id_raza) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (id_categoria) REFERENCES categorias_porcino(id_categoria) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (id_municipio) REFERENCES municipios(id_municipio) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Animales y lotes porcinos ofertados por vendedores';

-- 4.2 Galería de Fotos del Animal
DROP TABLE IF EXISTS imagenes_porcino;
CREATE TABLE imagenes_porcino (
    id_imagen INT AUTO_INCREMENT PRIMARY KEY,
    id_publicacion INT NOT NULL,
    url_foto VARCHAR(255) NOT NULL,
    descripcion_foto VARCHAR(100),
    orden_visualizacion INT DEFAULT 1,
    fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_publicacion) REFERENCES publicaciones_porcino(id_publicacion) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Fotos adicionales de porcinos para el carrusel de detalles';

-- 4.3 Trazabilidad Sanitaria y Esquema de Vacunación ICA
DROP TABLE IF EXISTS trazabilidad_sanitaria;
CREATE TABLE trazabilidad_sanitaria (
    id_sanitario INT AUTO_INCREMENT PRIMARY KEY,
    id_publicacion INT NOT NULL,
    tipo_procedimiento ENUM('Vacunación', 'Desparasitación', 'Vitaminización', 'Certificación ICA') NOT NULL,
    nombre_medicamento VARCHAR(120) NOT NULL,
    lote_laboratorio VARCHAR(60) NOT NULL,
    dosis_aplicada VARCHAR(40),
    fecha_aplicacion_vacuna DATE NOT NULL,
    veterinario_responsable VARCHAR(120) NOT NULL,
    tarjeta_profesional_veterinario VARCHAR(50) NOT NULL,
    observaciones_sanitarias TEXT,
    FOREIGN KEY (id_publicacion) REFERENCES publicaciones_porcino(id_publicacion) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Esquemas sanitarios avalados para trazabilidad porcina';

-- -----------------------------------------------------------------------------
-- 5. TABLAS DE COMPRAS, PEDIDOS, FACTURACIÓN Y DETALLES
-- -----------------------------------------------------------------------------

-- 5.1 Encabezado de Órdenes y Compras
DROP TABLE IF EXISTS pedidos;
CREATE TABLE pedidos (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    codigo_factura VARCHAR(40) NOT NULL UNIQUE, -- ej. 'ORD-20260919-8834'
    id_comprador INT NOT NULL,
    id_metodo_pago INT NOT NULL,
    subtotal_bruto DECIMAL(12,2) NOT NULL,
    costo_flete_transporte DECIMAL(12,2) DEFAULT 0.00,
    total_neto_pagado DECIMAL(12,2) NOT NULL,
    estado_pedido ENUM('pendiente_pago', 'confirmado', 'en_cuarentena_transporte', 'en_camino', 'entregado', 'cancelado') DEFAULT 'confirmado',
    estado_pago ENUM('pendiente', 'aprobado', 'rechazado', 'reembolsado') DEFAULT 'aprobado',
    direccion_entrega_destino VARCHAR(180) NOT NULL,
    municipio_entrega VARCHAR(80) NOT NULL,
    telefono_receptor VARCHAR(20) NOT NULL,
    instrucciones_entrega TEXT,
    fecha_hora_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega_acordada DATE,
    FOREIGN KEY (id_comprador) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (id_metodo_pago) REFERENCES metodos_pago(id_metodo) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Encabezado principal de pedidos y compras realizadas';

-- 5.2 Detalle de Items del Pedido (Renglones de Compra)
DROP TABLE IF EXISTS detalles_pedido;
CREATE TABLE detalles_pedido (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_publicacion INT NOT NULL,
    cantidad_comprada INT NOT NULL,
    precio_unitario_venta DECIMAL(12,2) NOT NULL,
    subtotal_renglon DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_publicacion) REFERENCES publicaciones_porcino(id_publicacion) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Detalle pormenorizado de los marranos adquiridos en cada orden';

-- 5.3 Calificaciones y Reseñas Posventa
DROP TABLE IF EXISTS calificaciones_resenas;
CREATE TABLE calificaciones_resenas (
    id_resena INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_comprador INT NOT NULL,
    id_vendedor INT NOT NULL,
    puntuacion_estrellas INT NOT NULL CHECK (puntuacion_estrellas BETWEEN 1 AND 5),
    comentario_resena TEXT,
    fecha_publicacion_resena DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_comprador) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (id_vendedor) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Sistema de reputación y feedback entre compradores y vendedores';

-- -----------------------------------------------------------------------------
-- 6. TABLA DE NOTICIAS Y ARTÍCULOS PORCÍCOLAS
-- -----------------------------------------------------------------------------

DROP TABLE IF EXISTS noticias_sector;
CREATE TABLE noticias_sector (
    id_noticia INT AUTO_INCREMENT PRIMARY KEY,
    ambito_noticia ENUM('Internacional', 'Nacional', 'Departamental', 'Local') NOT NULL,
    titulo_noticia VARCHAR(200) NOT NULL,
    resumen_noticia VARCHAR(300) NOT NULL,
    cuerpo_completo_noticia LONGTEXT NOT NULL,
    imagen_portada VARCHAR(255) NOT NULL,
    autor_publicacion VARCHAR(100) DEFAULT 'Redacción PORKCENTER',
    fuente_oficial VARCHAR(100) DEFAULT 'Porkcolombia / Fedeporcina',
    contador_visitas INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    fecha_hora_publicacion DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Artículos y noticias técnicas del sector porcícola';

-- -----------------------------------------------------------------------------
-- 7. TABLA DE AUDITORÍA Y BITÁCORA DEL SISTEMA
-- -----------------------------------------------------------------------------

DROP TABLE IF EXISTS logs_auditoria;
CREATE TABLE logs_auditoria (
    id_log INT AUTO_INCREMENT PRIMARY KEY,
    tabla_afectada VARCHAR(50) NOT NULL,
    tipo_evento ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    id_registro_afectado INT NOT NULL,
    descripcion_evento TEXT NOT NULL,
    usuario_responsable VARCHAR(120) DEFAULT 'Sistema Automatizado',
    fecha_hora_evento DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Bitácora inmutable de eventos críticos del sistema';

-- -----------------------------------------------------------------------------
-- 8. VISTAS SQL (REPORTES GERENCIALES Y CONSULTAS DE EXPOSICIÓN)
-- -----------------------------------------------------------------------------

-- 8.1 Vista de Compras y Facturación Completa (Trazabilidad Total)
CREATE OR REPLACE VIEW vista_compras_completas AS
SELECT 
    p.id_pedido,
    p.codigo_factura,
    p.fecha_hora_pedido AS fecha_hora_compra,
    -- Datos del Comprador
    u_comp.id_usuario AS id_comprador,
    u_comp.nombre_completo AS nombre_comprador,
    u_comp.email AS email_comprador,
    u_comp.telefono_contacto AS telefono_comprador,
    r_comp.nombre_rol AS rol_comprador,
    -- Datos del Animal Comprado
    pub.id_publicacion,
    pub.codigo_lote,
    pub.titulo_publicacion AS nombre_marrano,
    raz.nombre_raza AS raza,
    cat.nombre_categoria AS categoria,
    pub.edad_texto AS edad_marrano,
    pub.peso_texto AS peso_marrano,
    pub.fecha_publicacion AS fecha_publicacion_marrano,
    pub.hora_publicacion AS hora_publicacion_marrano,
    -- Datos del Vendedor
    u_vend.id_usuario AS id_vendedor,
    u_vend.nombre_completo AS nombre_vendedor,
    u_vend.nombre_granja AS granja_vendedora,
    u_vend.telefono_contacto AS telefono_vendedor,
    m_vend.nombre_municipio AS municipio_granja_origen,
    -- Datos Económicos de la Compra
    dp.cantidad_comprada,
    dp.precio_unitario_venta,
    CONCAT('$', FORMAT(dp.precio_unitario_venta, 0), ' COP') AS precio_unitario_formateado,
    dp.subtotal_renglon,
    CONCAT('$', FORMAT(dp.subtotal_renglon, 0), ' COP') AS subtotal_formateado,
    p.total_neto_pagado AS total_factura_orden,
    CONCAT('$', FORMAT(p.total_neto_pagado, 0), ' COP') AS total_factura_formateado,
    mp.nombre_metodo AS metodo_pago,
    p.estado_pedido,
    p.estado_pago,
    p.direccion_entrega_destino,
    p.municipio_entrega
FROM pedidos p
INNER JOIN usuarios u_comp ON p.id_comprador = u_comp.id_usuario
INNER JOIN roles r_comp ON u_comp.id_rol = r_comp.id_rol
INNER JOIN metodos_pago mp ON p.id_metodo_pago = mp.id_metodo
INNER JOIN detalles_pedido dp ON p.id_pedido = dp.id_pedido
INNER JOIN publicaciones_porcino pub ON dp.id_publicacion = pub.id_publicacion
INNER JOIN razas_porcino raz ON pub.id_raza = raz.id_raza
INNER JOIN categorias_porcino cat ON pub.id_categoria = cat.id_categoria
INNER JOIN usuarios u_vend ON pub.id_vendedor = u_vend.id_usuario
INNER JOIN municipios m_vend ON pub.id_municipio = m_vend.id_municipio;

-- 8.2 Vista de Catálogo Activo con Fechas, Horas y Vendedor
CREATE OR REPLACE VIEW vista_catalogo_porcinos_disponibles AS
SELECT 
    pub.id_publicacion,
    pub.codigo_lote,
    pub.titulo_publicacion AS nombre_porcino,
    cat.nombre_categoria AS categoria,
    raz.nombre_raza AS raza,
    pub.precio_unitario,
    CONCAT('$', FORMAT(pub.precio_unitario, 0), ' COP') AS precio_formateado,
    pub.edad_texto AS edad,
    pub.peso_texto AS peso,
    pub.cantidad_disponible AS stock_actual,
    CONCAT(m.nombre_municipio, ', ', d.nombre_departamento) AS ubicacion_finca,
    pub.imagen_principal,
    pub.fecha_publicacion,
    pub.hora_publicacion,
    CONCAT(DATE_FORMAT(pub.fecha_publicacion, '%Y-%m-%d'), ' ', TIME_FORMAT(pub.hora_publicacion, '%h:%i %p')) AS fecha_hora_publicacion_completa,
    u.id_usuario AS id_vendedor,
    u.nombre_completo AS nombre_vendedor,
    u.nombre_granja,
    u.telefono_contacto AS telefono_vendedor,
    CONCAT('📞 ', u.telefono_contacto, ' | ', m.nombre_municipio, ', Cund.') AS contacto_vendedor,
    u.reputacion_promedio AS calificacion_vendedor,
    pub.vacunado,
    pub.desparasitado,
    pub.certificado_genetico_ica
FROM publicaciones_porcino pub
INNER JOIN categorias_porcino cat ON pub.id_categoria = cat.id_categoria
INNER JOIN razas_porcino raz ON pub.id_raza = raz.id_raza
INNER JOIN municipios m ON pub.id_municipio = m.id_municipio
INNER JOIN departamentos d ON m.id_departamento = d.id_departamento
INNER JOIN usuarios u ON pub.id_vendedor = u.id_usuario
WHERE pub.estado_publicacion = 'disponible' AND pub.cantidad_disponible > 0;

-- 8.3 Vista de Inicios de Sesión y Actividad de Usuarios
CREATE OR REPLACE VIEW vista_inicios_sesion_usuarios AS
SELECT 
    l.id_log_sesion,
    u.id_usuario,
    u.nombre_completo AS usuario,
    u.email,
    r.nombre_rol AS rol_asignado,
    l.rol_al_ingresar,
    l.fecha_hora_ingreso,
    l.fecha_hora_cierre,
    TIMESTAMPDIFF(MINUTE, l.fecha_hora_ingreso, COALESCE(l.fecha_hora_cierre, NOW())) AS duracion_sesion_minutos,
    l.ip_conexion,
    l.dispositivo_navegador,
    l.estado_sesion
FROM log_inicios_sesion l
INNER JOIN usuarios u ON l.id_usuario = u.id_usuario
INNER JOIN roles r ON u.id_rol = r.id_rol;

-- 8.4 Vista de Resumen y Rendimiento Financiero por Vendedor
CREATE OR REPLACE VIEW vista_dashboard_financiero_vendedor AS
SELECT 
    u.id_usuario AS id_vendedor,
    u.nombre_completo AS nombre_vendedor,
    u.nombre_granja,
    COUNT(DISTINCT pub.id_publicacion) AS total_lotes_publicados,
    COALESCE(SUM(dp.cantidad_comprada), 0) AS total_marranos_vendidos,
    COALESCE(SUM(dp.subtotal_renglon), 0) AS ingresos_totales_cop,
    CONCAT('$', FORMAT(COALESCE(SUM(dp.subtotal_renglon), 0), 0), ' COP') AS ingresos_totales_formateados,
    u.reputacion_promedio AS estrellas_promedio,
    u.total_ventas_realizadas
FROM usuarios u
LEFT JOIN publicaciones_porcino pub ON u.id_usuario = pub.id_vendedor
LEFT JOIN detalles_pedido dp ON pub.id_publicacion = dp.id_publicacion
WHERE u.id_rol IN (2, 3) -- Criador / Ambos
GROUP BY u.id_usuario, u.nombre_completo, u.nombre_granja, u.reputacion_promedio, u.total_ventas_realizadas;

-- -----------------------------------------------------------------------------
-- 9. TRIGGERS AUTOMÁTICOS (DISPARADORES DE REGLAS DE NEGOCIO)
-- -----------------------------------------------------------------------------

DELIMITER $$

-- 9.1 Descontar Stock de Cerdos al Registrarse un Detalle de Pedido
DROP TRIGGER IF EXISTS trg_descontar_stock_porcino$$
CREATE TRIGGER trg_descontar_stock_porcino
AFTER INSERT ON detalles_pedido
FOR EACH ROW
BEGIN
    UPDATE publicaciones_porcino
    SET cantidad_disponible = cantidad_disponible - NEW.cantidad_comprada,
        estado_publicacion = IF(cantidad_disponible - NEW.cantidad_comprada <= 0, 'agotado', 'disponible')
    WHERE id_publicacion = NEW.id_publicacion;
    
    -- Actualizar contador de compras del usuario y ventas del vendedor
    UPDATE usuarios u
    INNER JOIN pedidos p ON p.id_pedido = NEW.id_pedido
    SET u.total_compras_realizadas = u.total_compras_realizadas + 1
    WHERE u.id_usuario = p.id_comprador;
    
    UPDATE usuarios u
    INNER JOIN publicaciones_porcino pub ON pub.id_publicacion = NEW.id_publicacion
    SET u.total_ventas_realizadas = u.total_ventas_realizadas + NEW.cantidad_comprada
    WHERE u.id_usuario = pub.id_vendedor;
END$$

-- 9.2 Actualizar Reputación Promedio de Vendedor al recibir calificación
DROP TRIGGER IF EXISTS trg_actualizar_reputacion_vendedor$$
CREATE TRIGGER trg_actualizar_reputacion_vendedor
AFTER INSERT ON calificaciones_resenas
FOR EACH ROW
BEGIN
    DECLARE v_nuevo_promedio DECIMAL(3,2);

    SELECT AVG(puntuacion_estrellas)
    INTO v_nuevo_promedio
    FROM calificaciones_resenas
    WHERE id_vendedor = NEW.id_vendedor;

    UPDATE usuarios
    SET reputacion_promedio = v_nuevo_promedio
    WHERE id_usuario = NEW.id_vendedor;
END$$

-- 9.3 Auditoría de Nuevas Publicaciones en Vender
DROP TRIGGER IF EXISTS trg_auditoria_publicaciones$$
CREATE TRIGGER trg_auditoria_publicaciones
AFTER INSERT ON publicaciones_porcino
FOR EACH ROW
BEGIN
    INSERT INTO logs_auditoria (tabla_afectada, tipo_evento, id_registro_afectado, descripcion_evento, usuario_responsable)
    VALUES (
        'publicaciones_porcino', 
        'INSERT', 
        NEW.id_publicacion, 
        CONCAT('Nuevo cerdo publicado: "', NEW.titulo_publicacion, '" | Precio: $', FORMAT(NEW.precio_unitario, 0), ' COP | Cantidad: ', NEW.cantidad_disponible, ' unid. | Fecha/Hora: ', NEW.fecha_publicacion, ' ', NEW.hora_publicacion), 
        CONCAT('Vendedor ID: ', NEW.id_vendedor)
    );
END$$

DELIMITER ;

-- -----------------------------------------------------------------------------
-- 10. PROCEDIMIENTO ALMACENADO (TRANSACCIÓN COMPLETA DE COMPRA)
-- -----------------------------------------------------------------------------

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_realizar_compra_porcino$$
CREATE PROCEDURE sp_realizar_compra_porcino (
    IN p_id_comprador INT,
    IN p_id_metodo_pago INT,
    IN p_direccion_entrega VARCHAR(180),
    IN p_municipio_entrega VARCHAR(80),
    IN p_telefono_receptor VARCHAR(20),
    IN p_instrucciones TEXT,
    IN p_id_publicacion INT,
    IN p_cantidad INT,
    OUT p_resultado_msg VARCHAR(150),
    OUT p_id_nuevo_pedido INT,
    OUT p_codigo_factura_generado VARCHAR(40)
)
BEGIN
    DECLARE v_precio DECIMAL(12,2);
    DECLARE v_stock_disponible INT;
    DECLARE v_subtotal DECIMAL(12,2);
    DECLARE v_codigo_factura VARCHAR(40);

    -- Manejo de reversión automática ante cualquier error
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_resultado_msg = 'ERROR: No se pudo procesar la compra. Se realizó Rollback de la transacción.';
        SET p_id_nuevo_pedido = 0;
        SET p_codigo_factura_generado = NULL;
    END;

    START TRANSACTION;

    -- Validar existencia y stock con bloqueo de fila
    SELECT precio_unitario, cantidad_disponible 
    INTO v_precio, v_stock_disponible
    FROM publicaciones_porcino 
    WHERE id_publicacion = p_id_publicacion FOR UPDATE;

    IF v_stock_disponible IS NULL THEN
        SET p_resultado_msg = 'ERROR: La publicación de porcino no existe.';
        SET p_id_nuevo_pedido = 0;
        SET p_codigo_factura_generado = NULL;
        ROLLBACK;
    ELSEIF v_stock_disponible < p_cantidad THEN
        SET p_resultado_msg = CONCAT('ERROR: Stock insuficiente. Disponibles: ', v_stock_disponible, ' | Solicitados: ', p_cantidad);
        SET p_id_nuevo_pedido = 0;
        SET p_codigo_factura_generado = NULL;
        ROLLBACK;
    ELSE
        SET v_subtotal = v_precio * p_cantidad;
        SET v_codigo_factura = CONCAT('ORD-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 99999), 5, '0'));

        -- 1. Insertar orden de compra
        INSERT INTO pedidos (
            codigo_factura, id_comprador, id_metodo_pago, subtotal_bruto, 
            costo_flete_transporte, total_neto_pagado, estado_pedido, 
            estado_pago, direccion_entrega_destino, municipio_entrega, 
            telefono_receptor, instrucciones_entrega, fecha_hora_pedido
        ) VALUES (
            v_codigo_factura, p_id_comprador, p_id_metodo_pago, v_subtotal, 
            0.00, v_subtotal, 'confirmado', 
            'aprobado', p_direccion_entrega, p_municipio_entrega, 
            p_telefono_receptor, p_instrucciones, NOW()
        );

        SET p_id_nuevo_pedido = LAST_INSERT_ID();

        -- 2. Insertar renglón del detalle (El trigger descontará el inventario)
        INSERT INTO detalles_pedido (
            id_pedido, id_publicacion, cantidad_comprada, 
            precio_unitario_venta, subtotal_renglon
        ) VALUES (
            p_id_nuevo_pedido, p_id_publicacion, p_cantidad, 
            v_precio, v_subtotal
        );

        -- 3. Log en auditoría
        INSERT INTO logs_auditoria (tabla_afectada, tipo_evento, id_registro_afectado, descripcion_evento, usuario_responsable)
        VALUES ('pedidos', 'INSERT', p_id_nuevo_pedido, CONCAT('Compra exitosa de ', p_cantidad, ' cerdo(s) por valor de $', FORMAT(v_subtotal, 0), ' COP. Factura: ', v_codigo_factura), CONCAT('Comprador ID: ', p_id_comprador));

        COMMIT;
        SET p_resultado_msg = 'EXITO: Compra registrada y confirmada correctamente.';
        SET p_codigo_factura_generado = v_codigo_factura;
    END IF;

END$$

DELIMITER ;

-- -----------------------------------------------------------------------------
-- 11. INSERCIÓN DE DATOS DE PRUEBA (SEED DATA REAL DE LA PLATAFORMA)
-- -----------------------------------------------------------------------------

-- 11.1 Departamentos
INSERT INTO departamentos (codigo_dane, nombre_departamento) VALUES
('25', 'Cundinamarca'),
('05', 'Antioquia'),
('76', 'Valle del Cauca'),
('68', 'Santander'),
('54', 'Norte de Santander'),
('50', 'Meta'),
('17', 'Caldas'),
('66', 'Risaralda');

-- 11.2 Municipios de Cundinamarca y Alrededores
INSERT INTO municipios (id_departamento, codigo_dane, nombre_municipio) VALUES
(1, '25839', 'Ubalá'),
(1, '25297', 'Gachalá'),
(1, '25377', 'La Calera'),
(1, '25299', 'Gachetá'),
(1, '25322', 'Guasca'),
(1, '25175', 'Chía'),
(1, '25269', 'Facatativá'),
(1, '25754', 'Soacha'),
(2, '05001', 'Medellín'),
(2, '05615', 'Rionegro');

-- 11.3 Roles del Sistema
INSERT INTO roles (codigo_rol, nombre_rol, descripcion) VALUES
('comprador', 'Comprador Porcícola', 'Usuario interesado en comprar cerdos reproductores, lotes de lechones o carne en canal.'),
('vendedor', 'Criador / Productor Porcino', 'Granja o porcicultor verificado habilitado para publicar animales y lotes en el catálogo.'),
('ambos', 'Productor y Comercializador', 'Perfil completo con capacidad dual de compra y venta simultánea.'),
('admin', 'Superintendente / Administrador', 'Control maestro de la plataforma, verificación de certificaciones ICA y auditoría.');

-- 11.4 Categorías del Catálogo
INSERT INTO categorias_porcino (codigo_categoria, nombre_categoria, descripcion, color_badge) VALUES
('alta_genetica', 'Alta Genética', 'Ejemplares puros con pedigrí genealógico, óptimos para pie de cría y mejora de piara.', '#e82b10'),
('carne_magra', 'Carne Magra', 'Porcinos con conformación muscular superior, mínimo espesor graso y óptima conversión.', '#f27405'),
('ceba', 'Ceba y Engorde', 'Cerdos en etapa final de ceba listos para comercialización directa en frigorífico.', '#10b981'),
('cria', 'Cría y Reproducción', 'Hembras de reemplazo F1 y machos reproductores seleccionados por fertilidad.', '#3b82f6'),
('destete', 'Lechones Destetados', 'Lotes de lechones de 2 a 3 meses con plan vacunal completo y peso uniforme.', '#8b5cf6');

-- 11.5 Razas Porcinas
INSERT INTO razas_porcino (codigo_raza, nombre_raza, pais_origen, aptitud_principal, caracteristicas_geneticas) VALUES
('duroc', 'Duroc', 'Estados Unidos', 'Reproducción', 'Raza roja destacada por infiltración de grasa intramuscular (marmoleo), rusticidad y excelente ganancia diaria de peso.'),
('pietrain', 'Pietrain', 'Bélgica', 'Carne', 'Máximo desarrollo de jamones y lomos, mínima grasa dorsal, excelente rendimiento cárnico en canal.'),
('landrace', 'Landrace', 'Dinamarca', 'Doble Propósito', 'Cuerpo alargado con 16 a 17 pares de costillas, excepcionales cualidades maternales, alta producción láctea y docilidad.'),
('large_white', 'Large White / Yorkshire', 'Reino Unido', 'Doble Propósito', 'Gran tamaño, alta prolificidad, excelente velocidad de crecimiento y gran adaptabilidad climática.'),
('hampshire', 'Hampshire', 'Estados Unidos', 'Carne', 'Cinturón blanco característico, excelente masa muscular, carne magra y buena resistencia en pastoreo.');

-- 11.6 Métodos de Pago
INSERT INTO metodos_pago (codigo_metodo, nombre_metodo, instrucciones_pago) VALUES
('nequi', 'Nequi', 'Transferencia digital inmediata a través de número de celular o código QR verificado.'),
('daviplata', 'DaviPlata', 'Pago seguro mediante monedero digital del Banco Davivienda.'),
('pse', 'PSE / Tarjetas de Crédito y Débito', 'Débito bancario en línea certificado por ACH Colombia y tarjetas Visa/Mastercard.'),
('transferencia', 'Bancolombia Transferencia Directa', 'Transferencia electrónica a cuenta corriente o de ahorros empresarial.'),
('contra_entrega', 'Pago Contra Entrega en Granja', 'Pago en efectivo o datáfono verificado al momento del descargue en granja.');

-- 11.7 Usuarios / Inicios de Sesión / Granjas
INSERT INTO usuarios (
    id_rol, id_municipio, nombre_completo, nombre_granja, email, 
    password_hash, telefono_contacto, direccion_residencia, 
    bio_descripcion, avatar_icono, registro_ica_granja, 
    reputacion_promedio, total_ventas_realizadas, total_compras_realizadas
) VALUES
(2, 1, 'Carlos Rodríguez', 'Granja Porcícola El Roble', 'vendedor@porcimarket.com', SHA2('123456', 256), '3108373303', 'Vereda San Pedro, Finca Los Pinos', 'Criador y productor porcícola con más de 8 años de trayectoria en genética pura Duroc y Pietrain.', '🐷', 'ICA-25839-2024', 4.95, 18, 2),
(1, 2, 'Juan Porcicultor', 'Inversiones Porcinas del Guavio', 'comprador@porcimarket.com', SHA2('123456', 256), '3201234567', 'Vereda El Carmen, Lote 4', 'Comprador habitual de lotes de lechones y porcinos de engorde para distribución mayorista.', '🛒', NULL, 5.00, 0, 12),
(3, 3, 'María Gómez', 'Porcícola La Esperanza', 'maria.gomez@porcimarket.com', SHA2('123456', 256), '3001234567', 'Km 5 Vía Guasca, La Calera', 'Granja tecnificada dedicada a la reproducción y ceba con certificación ambiental y sanitaria al día.', '🔄', 'ICA-25377-2023', 4.90, 32, 5),
(4, 1, 'Administración Central', 'PORKCENTER Colombia S.A.S.', 'admin@porcimarket.com', SHA2('123456', 256), '3159876543', 'Sede Principal Ubalá', 'Mesa de control, verificación de sanidad y gestión de la plataforma nacional porcícola.', '👑', 'REG-NAC-001', 5.00, 0, 0);

-- 11.8 Historial de Inicios de Sesión (Logins)
INSERT INTO log_inicios_sesion (id_usuario, rol_al_ingresar, fecha_hora_ingreso, fecha_hora_cierre, ip_conexion, dispositivo_navegador, estado_sesion) VALUES
(1, 'vendedor', '2026-09-18 08:30:15', '2026-09-18 10:45:20', '186.84.90.12', 'Chrome Móvil - Android 14', 'cerrada_por_usuario'),
(2, 'comprador', '2026-09-18 09:15:40', '2026-09-18 09:55:10', '190.158.42.88', 'Safari Móvil - iPhone 15 Pro', 'cerrada_por_usuario'),
(3, 'ambos', '2026-09-19 07:00:00', NULL, '181.61.12.33', 'Chrome Desktop - Windows 11', 'activa'),
(1, 'vendedor', '2026-09-19 14:20:00', NULL, '186.84.90.12', 'Chrome Móvil - Android 14', 'activa');

-- 11.9 Publicaciones de Marranos / Porcinos en Venta (Con Fecha y Hora Exacta)
INSERT INTO publicaciones_porcino (
    codigo_lote, id_vendedor, id_raza, id_categoria, id_municipio, 
    titulo_publicacion, descripcion_detallada, edad_meses, edad_texto, 
    peso_kg, peso_texto, cantidad_inicial, cantidad_disponible, 
    precio_unitario, imagen_principal, vacunado, desparasitado, 
    certificado_genetico_ica, estado_publicacion, fecha_publicacion, hora_publicacion
) VALUES
('LOT-2026-001', 1, 1, 1, 1, 'Cerdo Duroc Reproductor', 'Excelente reproductor de raza Duroc puro con registro genético. Ideal para mejorar la calidad cárnica de su piara. Animal sano, vacunado y desparasitado con todos sus certificados al día.', 18, '18 meses', 120.00, '120 kg', 1, 1, 1200000.00, 'images/pig_duroc.png', TRUE, TRUE, TRUE, 'disponible', '2026-08-15 08:30:00', '08:30:00'),
('LOT-2026-002', 3, 2, 2, 2, 'Lote Lechones Pietrain', 'Lote de 15 lechones Pietrain de excelente conversión cárnica. Alta proporción de carne magra, músculo definido. Animales destetados, con vacunas completas y en perfectas condiciones sanitarias.', 3, '3 meses', 12.00, '12 kg prom.', 15, 13, 300000.00, 'images/pig_pietrain.png', TRUE, TRUE, TRUE, 'disponible', '2026-08-16 10:15:00', '10:15:00'),
('LOT-2026-003', 3, 3, 3, 3, 'Cerdos de Engorde Landrace', 'Cerdos de engorde raza Landrace, reconocidos por su excelente longitud corporal y calidad de canal. Listos para sacrificio o como base reproductiva. Manejo sanitario completo.', 10, '10 meses', 90.00, '90 kg prom.', 5, 5, 850000.00, 'images/cerdo_landrace.jpg', TRUE, TRUE, FALSE, 'disponible', '2026-08-17 14:45:00', '14:45:00'),
('LOT-2026-004', 1, 4, 4, 1, 'Cerdas de Reemplazo F1 (Landrace x Large White)', 'Hembras primerizas F1 seleccionadas con aplomos fuertes, 14 pezones funcionales y excelente docilidad maternal.', 7, '7 meses', 85.00, '85 kg prom.', 4, 4, 950000.00, 'images/cerda_f1.jpg', TRUE, TRUE, TRUE, 'disponible', '2026-09-10 11:20:00', '11:20:00');

-- 11.10 Trazabilidad Sanitaria y Vacunación
INSERT INTO trazabilidad_sanitaria (
    id_publicacion, tipo_procedimiento, nombre_medicamento, lote_laboratorio, 
    dosis_aplicada, fecha_aplicacion_vacuna, veterinario_responsable, 
    tarjeta_profesional_veterinario, observaciones_sanitarias
) VALUES
(1, 'Vacunación', 'Circovac (PCV2) + Parvovirus Porcino', 'LOTE-CIR-8842', '2 ml intramuscular', '2026-05-10', 'Dr. Andrés Mendoza', 'TP-18492-COMVEZCOL', 'Esquema de vacunación reproductiva al 100% verificado.'),
(1, 'Desparasitación', 'Ivermectina 1% L.A.', 'LOTE-IVM-1029', '1 ml / 33 kg', '2026-07-01', 'Dr. Andrés Mendoza', 'TP-18492-COMVEZCOL', 'Tratamiento preventivo para endo y ectoparásitos.'),
(2, 'Vacunación', 'Mycoplasma Hyopneumoniae + Circovirus', 'LOTE-MYC-4411', '1 ml subcutánea', '2026-07-15', 'Dra. Camila Vargas', 'TP-22104-COMVEZCOL', 'Primera y segunda dosis completas al destete.'),
(3, 'Vacunación', 'Peste Porcina Clásica (PPC) Cepa China', 'LOTE-ICA-PPC-2026', '2 ml intramuscular', '2026-02-20', 'Dr. Andrés Mendoza', 'TP-18492-COMVEZCOL', 'Vacunación oficial avalada por ICA en zona libre.'),
(4, 'Vacunación', 'Leptospirosis 6 Serotipos', 'LOTE-LEP-9921', '2 ml intramuscular', '2026-08-05', 'Dra. Camila Vargas', 'TP-22104-COMVEZCOL', 'Protección reproductiva para hembras de reemplazo.');

-- 11.11 Compras y Pedidos Realizados (Con Factura, Fecha, Hora y Entrega)
INSERT INTO pedidos (
    codigo_factura, id_comprador, id_metodo_pago, subtotal_bruto, 
    costo_flete_transporte, total_neto_pagado, estado_pedido, 
    estado_pago, direccion_entrega_destino, municipio_entrega, 
    telefono_receptor, instrucciones_entrega, fecha_hora_pedido, fecha_entrega_acordada
) VALUES
('ORD-20260818-1001', 2, 1, 600000.00, 0.00, 600000.00, 'entregado', 'aprobado', 'Finca El Porvenir, Vereda El Salitre', 'Gachalá', '3201234567', 'Entregar en corrales principales de cuarentena.', '2026-08-18 10:30:15', '2026-08-20'),
('ORD-20260912-2045', 2, 3, 1200000.00, 50000.00, 1250000.00, 'confirmado', 'aprobado', 'Granja La Cascada, Km 3 Vía Palomas', 'Ubalá', '3201234567', 'Transporte con desinfección de vehículo previa.', '2026-09-12 16:45:00', '2026-09-15');

-- Detalles de Compra (Items)
INSERT INTO detalles_pedido (id_pedido, id_publicacion, cantidad_comprada, precio_unitario_venta, subtotal_renglon) VALUES
(1, 2, 2, 300000.00, 600000.00), -- Compra de 2 lechones Pietrain
(2, 1, 1, 1200000.00, 1200000.00); -- Compra de 1 reproductor Duroc

-- Calificaciones y Reseñas
INSERT INTO calificaciones_resenas (id_pedido, id_comprador, id_vendedor, puntuacion_estrellas, comentario_resena, fecha_publicacion_resena) VALUES
(1, 2, 3, 5, 'Excelente camada de lechones Pietrain. Llegaron activos, con certificado de vacunación y gran vigor.', '2026-08-21 09:30:00'),
(2, 2, 1, 5, 'El reproductor Duroc superó las expectativas. Muy buena conformación física y excelente docilidad.', '2026-09-16 11:15:00');

-- 11.12 Noticias Reales del Sector
INSERT INTO noticias_sector (ambito_noticia, titulo_noticia, resumen_noticia, cuerpo_completo_noticia, imagen_portada, autor_publicacion) VALUES
('Internacional', 'Tendencias del Mercado Porcino Global 2026', 'La demanda de carne magra y genética sostenible impulsa las exportaciones latinoamericanas hacia Asia y Europa.', 'El panorama internacional para la industria porcícola muestra un crecimiento proyectado del 4.8% para el presente ciclo, con un fuerte enfoque en trazabilidad digital y bienestar animal.', 'images/noticia_global.jpg', 'Federación Iberoamericana de Porcicultura'),
('Nacional', 'Porkcolombia reporta récord de producción', 'El consumo per cápita de carne de cerdo en Colombia supera los 14.5 kg anuales gracias a campañas de nutrición.', 'La tecnificación de granjas medianas en Cundinamarca, Antioquia y Eje Cafetero ha permitido estabilizar precios al productor y garantizar suministro continuo.', 'images/noticia_nacional.jpg', 'Redacción Agropecuaria'),
('Departamental', 'Apoyo a Porcicultores de Cundinamarca', 'Nuevos programas de subsidio en concentrados y asesoría genética para la provincia del Guavio.', 'La Gobernación de Cundinamarca en convenio con PORKCENTER habilitó créditos blandos con tasa preferencial para mejoramiento de instalaciones porcícolas.', 'images/noticia_cundinamarca.jpg', 'Secretaría de Agricultura'),
('Local', 'Feria Porcícola y Ganadera en Ubalá', 'Gran encuentro de criadores con subasta en vivo y muestra de reproductores de alta pureza.', 'Productores de Gachalá, Gachetá y Ubalá se reúnen este fin de semana para intercambiar experiencias zootécnicas y comercializar pie de cría.', 'images/noticia_local.jpg', 'Comité de Ganaderos del Guavio');

-- =============================================================================
-- FIN DEL SCRIPT SQL - BASE DE DATOS PORKCENTER LISTA PARA EXPOSICIÓN
-- =============================================================================
SET FOREIGN_KEY_CHECKS = 1;
