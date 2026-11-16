const express = require('express');
const router = express.Router();
const conexion = require('../conexion');
const { verificarSesion, esAdmin } = require('../middlewares/authMiddleware');
const bcrypt = require('bcrypt'); // 1. Importar bcrypt

router.post('/actualizar-clave-inicial', async (req, res) => {
    const { userId, nuevaPassword, confirmarPassword } = req.body;

    if (!nuevaPassword || nuevaPassword.length < 8) {
        return res.json({ success: false, message: 'La nueva contraseña debe tener al menos 8 caracteres.' });
    }

    if (nuevaPassword !== confirmarPassword) {
        return res.json({ success: false, message: 'Las contraseñas no coinciden.' });
    }

    if (nuevaPassword === '%hidrolara123%') {
        return res.json({ success: false, message: 'No puedes seguir usando la contraseña por defecto.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(nuevaPassword, 10);
        const query = `UPDATE usuario SET password = ?, cambiar_password = 0 WHERE Id = ?`;

        conexion.query(query, [hashedPassword, userId], (err) => {
            if (err) {
                return res.json({ success: false, message: 'Error al actualizar la contraseña.' });
            }
            res.json({ success: true, message: 'Contraseña actualizada con éxito. Por favor, inicie sesión nuevamente.' });
        });
    } catch (error) {
        res.json({ success: false, message: 'Error interno del servidor.' });
    }
});  

// 1. OBTENER GERENCIAS ACTIVAS
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

// 2. OBTENER TODOS LOS USUARIOS (GET)
router.get('/usuarios', verificarSesion, (req, res) => {
    const query = `
        SELECT u.Id as id, u.cedula, u.correo, u.estado,
               r.nombre as rol, r.Id as id_rol,
               i.nombres, i.apellidos, i.telefono,
               g.nombre as gerencia, g.Id as id_gerencia
        FROM usuario u
        INNER JOIN info_usuario i ON u.Id = i.id_usuario
        INNER JOIN gerencia g ON i.id_gerencia = g.Id
        INNER JOIN rol r ON i.id_rol = r.Id
        ORDER BY u.Id DESC
    `;
    conexion.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener usuarios:', err);
            return res.status(500).json({ success: false, message: 'Error en el servidor' });
        }
        res.json({ success: true, usuarios: results });
    });
});

// NUEVA RUTA PARA CARGAR LOS ROLES DINÁMICAMENTE
router.get('/roles', verificarSesion, (req, res) => {
    const query = `SELECT Id, nombre FROM rol WHERE estado = 'Activo'`;
    conexion.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener roles:', err);
            return res.status(500).json({ success: false, message: 'Error en el servidor' });
        }
        res.json({ success: true, roles: results });
    });
});

// 3. CREAR USUARIO (POST)
router.post('/usuarios', verificarSesion, esAdmin, async (req, res) => {
    const { nombres, apellidos, cedula, correo, telefono, id_gerencia, id_rol, password } = req.body;

    if (!nombres || !apellidos || !cedula || !correo || !telefono || !id_gerencia || !id_rol || !password) {
        return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
    }

    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // LÓGICA CLAVE: Si la contraseña es la predeterminada, cambiar_password = 1. Si puso otra, = 0.
        const cambiarPasswordVal = (password === '%hidrolara123%') ? 1 : 0;

        const queryUsuario = `
            INSERT INTO usuario (cedula, correo, password, estado, cambiar_password) 
            VALUES (?, ?, ?, 'Activo', ?)
        `;

        conexion.query(queryUsuario, [cedula, correo, hashedPassword, cambiarPasswordVal], (err, resultadoUsuario) => {
            if (err) {
                console.error('Error al insertar en usuario:', err);
                return res.status(500).json({ success: false, message: 'Error al registrar credenciales' });
            }

            const id_usuario = resultadoUsuario.insertId;
            const queryInfo = `
                INSERT INTO info_usuario (id_usuario, nombres, apellidos, telefono, id_gerencia, id_rol) 
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            conexion.query(queryInfo, [id_usuario, nombres, apellidos, telefono, id_gerencia, id_rol], (errInfo) => {
                if (errInfo) {
                    console.error('Error al insertar en info_usuario:', errInfo);
                    return res.status(500).json({ success: false, message: 'Error al registrar datos personales' });
                }
                res.json({ success: true, message: 'Usuario creado exitosamente.' });
            });
        });
    } catch (error) {
        console.error('Error en el servidor:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// 4. ACTUALIZAR USUARIO (PUT)
router.put('/usuarios/:id', verificarSesion, esAdmin, async (req, res) => {
    const { id } = req.params;
    const { nombres, apellidos, cedula, correo, telefono, id_gerencia, id_rol, estado, password } = req.body;

    try {
        let queryUsuario;
        let paramsUsuario;

        // Si el administrador escribió una contraseña nueva en el modal
        if (password && password.trim() !== '') {
            if (password.length < 8) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'La nueva contraseña debe tener al menos 8 caracteres.' 
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            // Si pone la clave por defecto (%hidrolara123%), obliga al empleado a cambiarla al entrar
            const cambiarPasswordVal = (password === '%hidrolara123%') ? 1 : 0;

            queryUsuario = `
                UPDATE usuario 
                SET cedula = ?, correo = ?, estado = ?, password = ?, cambiar_password = ? 
                WHERE Id = ?
            `;
            paramsUsuario = [cedula, correo, estado, hashedPassword, cambiarPasswordVal, id];
        } else {
            // Si dejó el campo de contraseña vacío, mantiene la clave actual
            queryUsuario = `
                UPDATE usuario 
                SET cedula = ?, correo = ?, estado = ? 
                WHERE Id = ?
            `;
            paramsUsuario = [cedula, correo, estado, id];
        }

        conexion.query(queryUsuario, paramsUsuario, (err) => {
            if (err) {
                console.error('Error al actualizar usuario:', err);
                return res.status(500).json({ success: false, message: 'Error al actualizar credenciales' });
            }

            const queryInfo = `
                UPDATE info_usuario 
                SET nombres = ?, apellidos = ?, telefono = ?, id_gerencia = ?, id_rol = ? 
                WHERE id_usuario = ?
            `;

            conexion.query(queryInfo, [nombres, apellidos, telefono, id_gerencia, id_rol, id], (errInfo) => {
                if (errInfo) {
                    console.error('Error al actualizar info_usuario:', errInfo);
                    return res.status(500).json({ success: false, message: 'Error al actualizar información personal' });
                }
                res.json({ success: true, message: 'Usuario actualizado correctamente.' });
            });
        });
    } catch (error) {
        console.error('Error interno al actualizar usuario:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});

// 5. DESACTIVAR / BAJA LÓGICA (PATCH)
router.patch('/usuarios/:id/baja', verificarSesion, esAdmin, (req, res) => {
    const { id } = req.params;
    const { estado } = req.body; // Solo necesitamos cambiar el estado a 'Inactivo'

    const query = `UPDATE usuario SET estado = ? WHERE Id = ?`;
    conexion.query(query, [estado || 'Inactivo', id], (err) => {
        if (err) {
            console.error('Error al dar de baja:', err);
            return res.status(500).json({ success: false, message: 'Error al cambiar estado del usuario.' });
        }
        res.json({ success: true, message: 'Usuario dado de baja exitosamente.' });
    });
});
// 6. OBTENER DATOS DEL PERFIL DEL USUARIO LOGUEADO (GET)
router.get('/perfil', verificarSesion, (req, res) => {
    const userId = req.session.user.id || req.session.user.Id;

    const query = `
        SELECT u.Id as id, u.cedula, u.correo,
               i.nombres, i.apellidos, i.telefono,
               g.nombre as gerencia, r.nombre as rol
        FROM usuario u
        INNER JOIN info_usuario i ON u.Id = i.id_usuario
        INNER JOIN gerencia g ON i.id_gerencia = g.Id
        INNER JOIN rol r ON i.id_rol = r.Id
        WHERE u.Id = ?
    `;

    conexion.query(query, [userId], (err, results) => {
        if (err || results.length === 0) {
            console.error('Error al obtener datos del perfil:', err);
            return res.status(500).json({ success: false, message: 'No se pudo cargar la información del perfil.' });
        }
        res.json({ success: true, perfil: results[0] });
    });
});

// 7. CAMBIAR CONTRASEÑA DEL PERFIL (PUT)
router.put('/perfil/password', verificarSesion, (req, res) => {
    const userId = req.session.user.id || req.session.user.Id;
    const { actualPassword, nuevaPassword } = req.body;

    if (!actualPassword || !nuevaPassword) {
        return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });
    }

    if (nuevaPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'La nueva contraseña debe tener al menos 8 caracteres.' });
    }

    // 1. Buscar la contraseña actual encriptada en la BD
    const queryBuscar = `SELECT password FROM usuario WHERE Id = ?`;
    conexion.query(queryBuscar, [userId], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(500).json({ success: false, message: 'Error al verificar el usuario.' });
        }

        try {
            const passwordHashBD = results[0].password;
            // 2. Comparar la contraseña ingresada con la de la BD
            const coincide = await bcrypt.compare(actualPassword, passwordHashBD);

            if (!coincide) {
                return res.status(401).json({ success: false, message: 'La contraseña actual es incorrecta.' });
            }

            // 3. Encriptar la nueva contraseña y guardar
            const nuevoHash = await bcrypt.hash(nuevaPassword, 10);
            const queryActualizar = `UPDATE usuario SET password = ? WHERE Id = ?`;

            conexion.query(queryActualizar, [nuevoHash, userId], (errUpdate) => {
                if (errUpdate) {
                    console.error('Error al actualizar contraseña:', errUpdate);
                    return res.status(500).json({ success: false, message: 'Error al guardar la nueva contraseña.' });
                }
                res.json({ success: true, message: 'Contraseña actualizada con éxito.' });
            });
        } catch (error) {
            console.error('Error en bcrypt:', error);
            res.status(500).json({ success: false, message: 'Error interno al procesar la contraseña.' });
        }
    });
});
module.exports = router;