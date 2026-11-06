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

// Ruta para la pantalla de Gestión de Usuarios (renderiza usuarios.ejs)
app.get('/usuarios', (req, res) => {
    res.render('usuarios');
});
// Ruta para la pantalla de Aplicaciones Corporativas
app.get('/apps', (req, res) => {
    res.render('apps');
});
// Ruta para la pantalla de Nosotros
app.get('/nosotros', (req, res) => {
    res.render('nosotros');
});
// Ruta para la pantalla de Directorio Telefónico
app.get('/directorio', (req, res) => {
    res.render('directorio');
});

// ==========================================
// RUTAS DE LA API PARA GESTIÓN DE USUARIOS
// ==========================================

// 1. Obtener la lista de gerencias
app.get('/api/gerencias', (req, res) => {
    const query = `SELECT Id, nombre FROM gerencia WHERE estado = 'Activo'`;
    conexion.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener gerencias:', err);
            return res.status(500).json({ success: false, message: 'Error en el servidor' });
        }
        res.json({ success: true, gerencias: results });
    });
});

// 2. Obtener todos los usuarios con su gerencia
app.get('/api/usuarios', (req, res) => {
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

// 3. Registrar un nuevo usuario
app.post('/api/usuarios', (req, res) => {
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
    const { nombres, apellidos, nacionalidad, cedula, correo, telefono, id_gerencia, rol, password } = body;
    const nombresLimpios = typeof nombres === 'string' ? nombres.trim() : '';
    const apellidosLimpios = typeof apellidos === 'string' ? apellidos.trim() : '';
    const telefonoLimpio = typeof telefono === 'string' ? telefono.trim() : '';
    const correoLimpio = typeof correo === 'string' ? correo.trim().toLowerCase() : '';
    const passwordValido = typeof password === 'string' ? password : '';
    const cedulaLimpia = typeof cedula === 'string' ? cedula.trim().replace(/\./g, '') : '';
    const nacionalidadValida = nacionalidad === 'V' || nacionalidad === 'E';
    const idGerencia = typeof id_gerencia === 'number' ? id_gerencia : NaN;
    const rolesPermitidos = ['empleado', 'administrador'];

    if (
        !nombresLimpios || nombresLimpios.length > 100 ||
        !apellidosLimpios || apellidosLimpios.length > 100 ||
        !nacionalidadValida || !/^\d{5,12}$/.test(cedulaLimpia) ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio) || correoLimpio.length > 100 ||
        !telefonoLimpio || telefonoLimpio.length > 20 ||
        !Number.isInteger(idGerencia) || idGerencia < 1 ||
        !rolesPermitidos.includes(rol) || rol.length > 20 ||
        passwordValido.length < 8 || passwordValido.length > 255
    ) {
        return res.status(400).json({ success: false, message: 'Revise los campos obligatorios y sus formatos.' });
    }

    const cedulaCompleta = `${nacionalidad}-${cedulaLimpia}`;

    conexion.query(
        `SELECT Id FROM gerencia WHERE Id = ? AND estado = 'Activo'`,
        [idGerencia],
        (err, gerencias) => {
            if (err) {
                console.error('Error al validar la gerencia del usuario:', err);
                return res.status(500).json({ success: false, message: 'No se pudo validar la gerencia.' });
            }
            if (gerencias.length === 0) {
                return res.status(400).json({ success: false, message: 'La gerencia seleccionada no está disponible.' });
            }

            conexion.beginTransaction(err => {
                if (err) {
                    console.error('Error al iniciar la transacción de usuario:', err);
                    return res.status(500).json({ success: false, message: 'No se pudo iniciar el registro del usuario.' });
                }

                const responderConRollback = (status, message, error) => {
                    if (error) console.error('Error al registrar usuario:', error);
                    conexion.rollback(rollbackError => {
                        if (rollbackError) console.error('Error al revertir el registro del usuario:', rollbackError);
                        res.status(status).json({ success: false, message });
                    });
                };

                const queryUsuario = `INSERT INTO usuario (cedula, correo, password, rol, estado) VALUES (?, ?, ?, ?, 'Activo')`;
                conexion.query(queryUsuario, [cedulaCompleta, correoLimpio, passwordValido, rol], (err, resultUsuario) => {
                    if (err) {
                        if (err.code === 'ER_DUP_ENTRY') {
                            return responderConRollback(409, 'La cédula o el correo ya se encuentran registrados.');
                        }
                        return responderConRollback(500, 'No se pudo guardar el usuario.', err);
                    }

                    const queryInfo = `INSERT INTO info_usuario (id_usuario, nombres, apellidos, telefono, id_gerencia) VALUES (?, ?, ?, ?, ?)`;
                    conexion.query(queryInfo, [resultUsuario.insertId, nombresLimpios, apellidosLimpios, telefonoLimpio, idGerencia], err => {
                        if (err) {
                            if (err.code === 'ER_DUP_ENTRY') {
                                return responderConRollback(409, 'La información de este usuario ya está registrada.');
                            }
                            return responderConRollback(500, 'No se pudo guardar la información de contacto del usuario.', err);
                        }

                        conexion.commit(err => {
                            if (err) return responderConRollback(500, 'No se pudo confirmar el registro del usuario.', err);
                            res.status(201).json({ success: true, message: 'Usuario registrado exitosamente.' });
                        });
                    });
                });
            });
        }
    );
});

// 4. Encender el servidor (ESTO VA SIEMPRE AL FINAL DE TODO)
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});