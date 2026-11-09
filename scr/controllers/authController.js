// src/controllers/authController.js
const conexion = require('../conexion');
const bcrypt = require('bcrypt');

// Controlador para procesar el inicio de sesión
const loginUsuario = async (req, res) => {
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

    conexion.query(query, [cedula], async (err, results) => {
        if (err) {
            console.error('Error al consultar la base de datos:', err);
            return res.json({ success: false, message: 'Error interno del servidor' });
        }

        if (results.length === 0) {
            return res.json({ success: false, message: 'La cédula ingresada no está registrada.' });
        }

        const empleado = results[0];

        if (empleado.estado.toLowerCase() !== 'activo') {
            return res.json({ success: false, message: 'Su usuario se encuentra inactivo.' });
        }

        try {
            let passwordMatch = false;

            // 1. Verificar si la contraseña en la base de datos ya es un hash de bcrypt
            if (empleado.password.startsWith('$2b$') || empleado.password.startsWith('$2a$')) {
                passwordMatch = await bcrypt.compare(password, empleado.password);
            } else {
                // 2. SOPORTE LEGACY: Si la contraseña todavía está en texto plano
                if (empleado.password === password) {
                    passwordMatch = true;

                    // Actualizar automáticamente a hash en la base de datos sin borrar nada
                    const saltRounds = 10;
                    const hashedPassword = await bcrypt.hash(password, saltRounds);
                    
                    conexion.query(
                        'UPDATE usuario SET password = ? WHERE Id = ?',
                        [hashedPassword, empleado.Id],
                        (updateErr) => {
                            if (updateErr) {
                                console.error('Error al actualizar contraseña antigua a hash:', updateErr);
                            } else {
                                console.log(`[Seguridad] Contraseña del usuario ID ${empleado.Id} migrada a hash exitosamente.`);
                            }
                        }
                    );
                }
            }

            if (!passwordMatch) {
                return res.json({ success: false, message: 'Contraseña incorrecta.' });
            }

            // Guardamos los datos completos del usuario en la sesión si todo es correcto
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

        } catch (error) {
            console.error('Error al procesar la contraseña:', error);
            res.json({ success: false, message: 'Error interno del servidor' });
        }
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
