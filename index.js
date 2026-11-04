const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Conexión a la base de datos
const conexion = require('./scr/conexion');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 1. Configurar la carpeta 'public' para servir archivos estáticos (como sidebar.js e imágenes)
app.use(express.static(path.join(__dirname, 'public')));

// 2. Configurar el motor de vistas EJS y la carpeta 'views'
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Ruta principal (redirige o muestra bienvenida)
app.get('/', (req, res) => {
    res.render('login'); // O el mensaje de bienvenida que prefieras
});

// Ruta GET para cargar el login (renderiza login.ejs)
app.get('/login', (req, res) => {
    res.render('login');
});

// Ruta POST para procesar el inicio de sesión
app.post('/login', (req, res) => {
    const { usuario, password } = req.body;
    const cedula = usuario; 

    console.log(`Intento de inicio de sesión para la cédula: ${cedula}`);

    const query = `SELECT * FROM usuario WHERE cedula = ?`;

    conexion.query(query, [cedula], (err, results) => {
        if (err) {
            console.error('Error al consultar la base de datos:', err);
            return res.json({ success: false, message: 'Error interno del servidor' });
        }

        if (results.length === 0) {
            return res.json({ success: false, message: 'La cédula ingresada no está registrada.' });
        }

        const empleado = results[0];

        if (empleado.password !== password) {
            return res.json({ success: false, message: 'Contraseña incorrecta.' });
        }

        res.json({ success: true, message: '¡Bienvenido!' });
    });
});

// Ruta para la pantalla de inicio (renderiza inicio.ejs)
app.get('/inicio', (req, res) => {
    res.render('inicio');
});

// Ruta para el Panel de Control / Dashboard (renderiza dashboard.ejs)
app.get('/dashboard', (req, res) => {
    res.render('dashboard');
});

// 3. Ruta especial para servir el sidebar parcial mediante fetch si lo requiere el script
app.get('/partials/sidebar.ejs', (req, res) => {
    res.render('partials/sidebar');
});

// 4. Encender el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
// Ruta para la pantalla de Gestión de Usuarios (renderiza usuarios.ejs)
app.get('/usuarios', (req, res) => {
    res.render('usuarios');
});