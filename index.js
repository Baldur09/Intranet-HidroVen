const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Conexión a la base de datos
const conexion = require('./scr/conexion');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 1. Configurar la carpeta 'Html' para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'Html')));

// Ruta principal
app.get('/', (req, res) => {
    res.send('🚀 Servidor de la Intranet de Hidroven funcionando correctamente');
});

// 2. Ruta GET para cargar el login.html
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'Html', 'login.html'));
});

// Modificacion para el Fecth
// Ruta POST para procesar el inicio de sesión con validación separada

app.post('/login', (req, res) => {
    const { usuario, password } = req.body;
    const cedula = usuario; // El input del HTML se llama 'usuario'

    console.log(`Intento de inicio de sesión para la cédula: ${cedula}`);

    // 1. Primero buscamos si la cédula existe en la base de datos
    const query = `SELECT * FROM usuario WHERE cedula = ?`;

    conexion.query(query, [cedula], (err, results) => {
        if (err) {
            console.error('Error al consultar la base de datos:', err);
            return res.json({ success: false, message: 'Error interno del servidor' });
        }

        // Si no se encuentra la cédula
        if (results.length === 0) {
            return res.json({ success: false, message: 'La cédula ingresada no está registrada.' });
        }

        const empleado = results[0];

        // 2. Si la cédula existe, validamos la contraseña 
        // (Nota: aquí estamos comparando texto plano por ahora, luego integraremos bcrypt)
        if (empleado.password !== password) {
            return res.json({ success: false, message: 'Contraseña incorrecta.' });
        }

        // 3. Si todo es correcto, permitimos el acceso
        res.json({ success: true, message: '¡Bienvenido!' });
    });
});

// Ruta para la pantalla de inicio (que se abrirá al loguearse con éxito)
app.get('/inicio', (req, res) => {
    res.sendFile(path.join(__dirname, 'Html', 'Inicio.html'));
});


// 4. Encender el servidor (Siempre va al final)
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});