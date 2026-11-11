const express = require('express');
const router = express.Router();
const conexion = require('../conexion');
const verificarSesion = require('../middlewares/authMiddleware');
const bcrypt = require('bcrypt'); // 1. Importar bcrypt

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
router.post('/usuarios', verificarSesion, async (req, res) => {
    const { nombres, apellidos, cedula, correo, telefono, id_gerencia, id_rol, password } = req.body;

    if (!nombres || !apellidos || !cedula || !correo || !telefono || !id_gerencia || !id_rol || !password) {
        return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
    }

    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const queryUsuario = `
            INSERT INTO usuario (cedula, correo, password, estado) 
            VALUES (?, ?, ?, 'Activo')
        `;

        conexion.query(queryUsuario, [cedula, correo, hashedPassword], (err, resultadoUsuario) => {
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
router.put('/usuarios/:id', verificarSesion, (req, res) => {
    const { id } = req.params;
    const { nombres, apellidos, cedula, correo, id_gerencia, id_rol, estado } = req.body;

    const queryUsuario = `
        UPDATE usuario 
        SET cedula = ?, correo = ?, estado = ? 
        WHERE Id = ?
    `;

    conexion.query(queryUsuario, [cedula, correo, estado, id], (err) => {
        if (err) {
            console.error('Error al actualizar usuario:', err);
            return res.status(500).json({ success: false, message: 'Error al actualizar credenciales' });
        }

        const queryInfo = `
            UPDATE info_usuario 
            SET nombres = ?, apellidos = ?, id_gerencia = ?, id_rol = ? 
            WHERE id_usuario = ?
        `;

        conexion.query(queryInfo, [nombres, apellidos, id_gerencia, id_rol, id], (errInfo) => {
            if (errInfo) {
                console.error('Error al actualizar info_usuario:', errInfo);
                return res.status(500).json({ success: false, message: 'Error al actualizar información personal' });
            }
            res.json({ success: true, message: 'Usuario actualizado correctamente.' });
        });
    });
});

// 5. DESACTIVAR / BAJA LÓGICA (PATCH)
router.patch('/usuarios/:id/baja', verificarSesion, (req, res) => {
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
module.exports = router;