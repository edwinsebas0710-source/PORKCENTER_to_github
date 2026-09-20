/**
 * PORKCENTER - Servidor Backend API REST (Node.js + Express + MySQL)
 * Archivo de enlace entre la página web (Frontend) y la Base de Datos MySQL (database_porkcenter.sql)
 */

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Servir HTML, CSS, JS e imágenes

// Configuración de conexión a la base de datos MySQL
const dbConfig = {
    host: process.env.MYSQLHOST || 'localhost',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || 's3b4st23nr0m3r0',
    database: process.env.MYSQLDATABASE || 'db_porkcenter',
    port: process.env.MYSQLPORT || 330,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const fs = require('fs');

async function ejecutarScriptSQL(connection) {
    const sqlPath = path.join(__dirname, 'database_porkcenter.sql');
    if (!fs.existsSync(sqlPath)) {
        throw new Error('database_porkcenter.sql no encontrado');
    }

    let rawSql = fs.readFileSync(sqlPath, 'utf8');
    rawSql = rawSql.replace(/--.*$/gm, '');
    rawSql = rawSql.replace(/\/\*[\s\S]*?\*\//g, '');
    rawSql = rawSql.replace(/DROP DATABASE IF EXISTS[^;]+;/gi, '');
    rawSql = rawSql.replace(/CREATE DATABASE[^;]+;/gi, '');
    rawSql = rawSql.replace(/USE [^;]+;/gi, '');

    const cleanSql = rawSql.replace(/DELIMITER\s+\$\$[\s\S]*?DELIMITER\s*;/gi, '');
    const statements = cleanSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 5);

    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    let ejecutadas = 0;
    for (const statement of statements) {
        try {
            await connection.query(statement);
            ejecutadas++;
        } catch (err) {
            // Ignorar errores no críticos (como DROP TABLE de tablas que aún no existen)
        }
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    return ejecutadas;
}

// Pool de conexiones
let pool;
async function conectarDB() {
    try {
        const connectionConfig = process.env.MYSQL_URL || process.env.DATABASE_URL || dbConfig;
        pool = mysql.createPool(connectionConfig);
        const connection = await pool.getConnection();
        console.log('✅ Conexión exitosa a la base de datos MySQL');

        // Auto-inicializar tablas si la base de datos está vacía
        try {
            const [rows] = await connection.query("SHOW TABLES LIKE 'publicaciones_porcino'");
            if (rows.length === 0) {
                console.log('🔄 Inicializando base de datos en la nube...');
                const count = await ejecutarScriptSQL(connection);
                console.log(`✅ Base de datos lista con ${count} sentencias ejecutadas.`);
            } else {
                console.log('✅ Tablas de PorkCenter ya existen en la base de datos.');
            }
        } catch (initErr) {
            console.warn('Aviso en inicialización:', initErr.message);
        }

        connection.release();
    } catch (error) {
        console.error('⚠️ Error al conectar a MySQL:', error.message);
        console.log('👉 Asegúrate de haber importado database_porkcenter.sql y tener MySQL encendido en XAMPP o Workbench.');
    }
}
conectarDB();

// Ruta manual para inicializar o recargar la base de datos en la nube
app.get('/api/setup-db', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const count = await ejecutarScriptSQL(connection);
        connection.release();
        res.json({ ok: true, mensaje: `Base de datos inicializada con éxito (${count} sentencias ejecutadas)` });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// ==========================================
// ENDPOINTS / RUTAS DE LA API
// ==========================================

// 1. Obtener catálogo de marranos disponibles (Vista SQL)
app.get('/api/porcinos', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM vista_catalogo_porcinos_disponibles');
        res.json({ ok: true, data: rows });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// 2. Registrar un nuevo marrano en Vender
app.post('/api/porcinos', async (req, res) => {
    try {
        const { id_vendedor, id_raza, id_categoria, id_municipio, titulo, descripcion, edad_meses, edad_texto, peso_kg, peso_texto, cantidad, precio, imagen } = req.body;
        const codigoLote = 'LOT-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900);
        
        const sql = `INSERT INTO publicaciones_porcino 
            (codigo_lote, id_vendedor, id_raza, id_categoria, id_municipio, titulo_publicacion, descripcion_detallada, edad_meses, edad_texto, peso_kg, peso_texto, cantidad_inicial, cantidad_disponible, precio_unitario, imagen_principal, fecha_publicacion, hora_publicacion) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), CURTIME())`;
            
        const [result] = await pool.query(sql, [
            codigoLote, id_vendedor || 1, id_raza || 1, id_categoria || 1, id_municipio || 1,
            titulo, descripcion, edad_meses || 3, edad_texto || '3 meses',
            peso_kg || 25, peso_texto || '25 kg', cantidad || 1, cantidad || 1,
            precio, imagen || 'images/pig_duroc.png'
        ]);
        
        res.json({ ok: true, id_publicacion: result.insertId, codigoLote, mensaje: 'Marrano publicado con éxito en la base de datos' });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// 3. Procesar una compra completa (Llamando al Stored Procedure)
app.post('/api/comprar', async (req, res) => {
    try {
        const { id_comprador, id_metodo_pago, direccion, municipio, telefono, notas, id_publicacion, cantidad } = req.body;
        
        // Ejecutar Stored Procedure de compra segura
        const [rows] = await pool.query('CALL sp_realizar_compra_porcino(?, ?, ?, ?, ?, ?, ?, ?, @res_msg, @id_orden, @cod_factura)', [
            id_comprador || 2, id_metodo_pago || 1, direccion || 'Entrega acordada',
            municipio || 'Ubalá', telefono || '3201234567', notas || '',
            id_publicacion, cantidad || 1
        ]);
        
        const [outParams] = await pool.query('SELECT @res_msg AS mensaje, @id_orden AS id_pedido, @cod_factura AS codigo_factura');
        const respuesta = outParams[0];
        
        if (respuesta.id_pedido === 0) {
            return res.status(400).json({ ok: false, error: respuesta.mensaje });
        }
        
        res.json({ ok: true, data: respuesta });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// 4. Iniciar sesión y registrar log de acceso
app.post('/api/login', async (req, res) => {
    try {
        const { email, pass } = req.body;
        const [users] = await pool.query(`
            SELECT u.*, r.codigo_rol, r.nombre_rol 
            FROM usuarios u 
            INNER JOIN roles r ON u.id_rol = r.id_rol 
            WHERE u.email = ? AND u.password_hash = SHA2(?, 256)`, 
            [email, pass]
        );
        
        if (!users.length) {
            return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });
        }
        
        const user = users[0];
        
        // Registrar inicio de sesión en log_inicios_sesion
        await pool.query('INSERT INTO log_inicios_sesion (id_usuario, rol_al_ingresar, fecha_hora_ingreso, ip_conexion, dispositivo_navegador) VALUES (?, ?, NOW(), ?, ?)', [
            user.id_usuario, user.codigo_rol, req.ip || '127.0.0.1', req.headers['user-agent'] || 'Web Browser'
        ]);
        
        res.json({ ok: true, usuario: user });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// 5. Historial de compras completas
app.get('/api/compras', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM vista_compras_completas ORDER BY fecha_hora_compra DESC');
        res.json({ ok: true, compras: rows });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor PORKCENTER funcionando en: http://localhost:${PORT}`);
    console.log(`📄 Abre http://localhost:${PORT}/index.html en tu navegador`);
});
