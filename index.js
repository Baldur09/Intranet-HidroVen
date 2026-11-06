const express = require('express');
const path = require('path');
const session = require('express-session'); // <-- Nuevo para las sesiones

const app = express();
const PORT = 3000;

// Importar conexión y controladores/middlewares
const conexion = require('./scr/conexion');
const verificarSesion = require('./scr/middlewares/authMiddleware');
const { loginUsuario, logoutUsuario } = require('./scr/controllers/authController');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 1. Configuración de Sesiones
app.use(session({
    secret: 'hidroven_intranet_secreto_seguro',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// 2. Middleware global para hacer disponible la variable 'user' en todas las vistas .ejs
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// 3. Archivos estáticos y motor de vistas
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ==========================================
// RUTAS DE AUTENTICACIÓN
// ==========================================
app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/inicio');
    res.render('login');
});

// Usamos la función importada del controlador
app.post('/login', loginUsuario);

app.get('/logout', logoutUsuario);

// ==========================================
// RUTAS PROTEGIDAS (Añadimos 'verificarSesion')
// ==========================================
app.get('/inicio', verificarSesion, (req, res) => {
    res.render('inicio');
});

app.get('/dashboard', verificarSesion, (req, res) => {
    res.render('dashboard');
});

app.get('/usuarios', verificarSesion, (req, res) => {
    res.render('usuarios');
});

app.get('/apps', verificarSesion, (req, res) => {
    res.render('apps');
});

app.get('/nosotros', verificarSesion, (req, res) => {
    res.render('nosotros');
});

app.get('/directorio', verificarSesion, (req, res) => {
    res.render('directorio');
});

// Ruta parcial para sidebar
app.get('/partials/sidebar.ejs', verificarSesion, (req, res) => {
    res.render('partials/sidebar');
});

// ==========================================
// RUTAS DE LA API (Gestión de gerencias y usuarios)
// ==========================================
app.get('/api/gerencias', verificarSesion, (req, res) => {
    const query = `SELECT Id, nombre FROM gerencia WHERE estado = 'Activo'`;
    conexion.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener gerencias:', err);
            return res.status(500).json({ success: false, message: 'Error en el servidor' });
        }
        res.json({ success: true, gerencias: results });
    });
});

app.get('/api/usuarios', verificarSesion, (req, res) => {
    const query = `
        SELECT u.Id as id, u.cedula, u.correo, u.rol, u.estado,
               i.nombres, i.apellidos, i.telefono,
               g.nombre as gerencia, g.Id as id_gerencia
        FROM usuario u
        INNER JOIN info_usuario i ON u.Id = i.id_usuario
        INNER JOIN gerencia g ON i.id_gerencia = g.Id
    `;
    conexion.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener usuarios:', err);
            return res.status(500).json({ success: false, message: 'Error en el servidor' });
        }
        res.json({ success: true, usuarios: results });
    });
});

// (Aquí conservas tu ruta POST /api/usuarios para registrar empleados que ya tenías)

// Encender el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});