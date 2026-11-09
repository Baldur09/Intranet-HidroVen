const express = require('express');
const router = express.Router();
const conexion = require('../conexion');
const verificarSesion = require('../middlewares/authMiddleware');
const bcrypt = require('bcrypt'); // 1. Importar bcrypt

router.get('/gerencias', verificarSesion, (req, res) => {
    const query = `SELECT Id, nombre FROM gerencia WHERE estado = 'Activo'`;
    conexion.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener gerencias:', err);
            return res.status(500).json({ success: false, message: 'Error en el servidor' });
        }
        res.json({ success: true, gerencias: results });
    });
});

router.get('/usuarios', verificarSesion, (req, res) => {
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

// Ruta para registrar un nuevo usuario desde la vista de gestión con contraseña hasheada
router.post('/usuarios', verificarSesion, async (req, res) => {
    try {
        const { nombres, apellidos, nacionalidad, cedula, correo, telefono, id_gerencia, rol, password } = req.body;

        // 1. Hashear la contraseña provisional que viene del formulario
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 2. Insertar primero en la tabla 'usuario'
        const queryUsuario = `INSERT INTO usuario (cedula, correo, password, rol, estado) VALUES (?, ?, ?, ?, 'Activo')`;

        conexion.query(queryUsuario, [cedula, correo, hashedPassword, rol], (err, resultadoUsuario) => {
            if (err) {
                console.error('Error al insertar usuario:', err);
                return res.status(500).json({ success: false, message: 'Error al registrar el usuario en la base de datos.' });
            }

            const idUsuarioGenerado = resultadoUsuario.insertId;

            // 3. Insertar en la tabla 'info_usuario' los datos personales y la relación con la gerencia
            const queryInfo = `INSERT INTO info_usuario (id_usuario, nombres, apellidos, telefono, id_gerencia) VALUES (?, ?, ?, ?, ?)`;

            conexion.query(queryInfo, [idUsuarioGenerado, nombres, apellidos, telefono, id_gerencia], (errInfo) => {
                if (errInfo) {
                    console.error('Error al insertar info_usuario:', errInfo);
                    return res.status(500).json({ success: false, message: 'Error al registrar la información personal.' });
                }

                res.json({ success: true, message: '¡Usuario registrado exitosamente!' });
            });
        });

    } catch (error) {
        console.error('Error en el servidor al registrar usuario:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

module.exports = router;

//[cite: 14]
 //¿Qué logramos con esto?
//* Cuando hagas clic en **Registrar Usuario** desde tu modal en la interfaz de `usuarios.ejs`, los datos viajarán por la API[cite: 10, 11].
//* El backend tomará la contraseña en texto plano, la pasará por `bcrypt.hash()` y **almacenará el hash resultante de 60 caracteres** en la base de datos de XAMPP.
//* Como ya tienes configurado el login con `bcrypt.compare` en tu `authController.js`, cualquier usuario nuevo que registres a través de este formulario podrá iniciar sesión sin problemas.