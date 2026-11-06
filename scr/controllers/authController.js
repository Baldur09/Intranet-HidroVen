// src/controllers/authController.js
const conexion = require('../conexion'); // Ajusta los puntos según dónde guardes la carpeta

// Controlador para procesar el inicio de sesión
const loginUsuario = (req, res) => {
    const { usuario, password } = req.body;
    const cedula = usuario; 

    const query = `
        SELECT 
            u.Id, u.cedula, u.correo, u.password, u.rol, u.estado,
            i.nombres, i.apellidos, i.telefono,
            g.nombre AS gerencia
        FROM usuario u
        INNER JOIN info_usuario i ON u.Id = i.id_usuario
        INNER JOIN gerencia g ON i.id_gerencia = g.Id
        WHERE u.cedula = ?
    `;

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

        if (empleado.estado.toLowerCase() !== 'activo') {
            return res.json({ success: false, message: 'Su usuario se encuentra inactivo.' });
        }

        // Guardamos los datos completos del usuario en la sesión
        req.session.user = {
            id: empleado.Id,
            cedula: empleado.cedula,
            correo: empleado.correo,
            rol: empleado.rol,
            nombres: empleado.nombres,
            apellidos: empleado.apellidos,
            gerencia: empleado.gerencia
        };

        res.json({ success: true, message: '¡Bienvenido!' });
    });
};

// Controlador para cerrar sesión
const logoutUsuario = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
};

module.exports = {
    loginUsuario,
    logoutUsuario
};