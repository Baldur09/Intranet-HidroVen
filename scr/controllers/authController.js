// src/controllers/authController.js
const conexion = require('../conexion');
const bcrypt = require('bcrypt');
const {
    generarCodigoOTP,
    mascararCorreo,
    enviarCodigoRecuperacion
} = require('../services/mailer');

const limpiarDigitos = (valor = '') => String(valor).replace(/\D/g, '');

const validarCorreoFormato = (correo = '') =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(correo).trim());

// Controlador para procesar el inicio de sesión
const loginUsuario = async (req, res) => {
    const { usuario, password } = req.body;
    const cedula = limpiarDigitos(usuario) || usuario;

    const query = `
        SELECT 
            u.Id, u.cedula, u.correo, u.password, u.estado, u.cambiar_password,
            r.nombre AS rol, r.Id AS id_rol,
            i.nombres, i.apellidos, i.telefono,
            g.nombre AS gerencia
        FROM usuario u
        INNER JOIN info_usuario i ON u.Id = i.id_usuario
        INNER JOIN gerencia g ON i.id_gerencia = g.Id
        INNER JOIN rol r ON i.id_rol = r.Id
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
            return res.json({
                success: false,
                message: 'Su usuario se encuentra inactivo en el sistema. Comuníquese con la Gerencia de Telemática para más información.'
            });
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

                    // Actualizar automáticamente a hash en la base de datos de forma segura
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

            // 3. NUEVA VALIDACIÓN: Si el usuario tiene clave por defecto (cambiar_password = 1)
            if (empleado.cambiar_password === 1) {
                return res.json({
                    success: true,
                    requiereCambioClave: true,
                    userId: empleado.Id,
                    message: 'Debe actualizar su contraseña por defecto.'
                });
            }

            // Guardamos los datos completos del usuario en la sesión si ya la había cambiado antes
            req.session.user = {
                id: empleado.Id,
                cedula: empleado.cedula,
                correo: empleado.correo,
                rol: empleado.rol,
                nombres: empleado.nombres,
                apellidos: empleado.apellidos,
                gerencia: empleado.gerencia
            };

            return res.json({ success: true, message: '¡Bienvenido!' });
        } catch (error) {
            console.error('Error al procesar la contraseña:', error);
            if (!res.headersSent) {
                return res.json({ success: false, message: 'Error interno del servidor' });
            }
        }
    });
};

// Controlador para cerrar sesión
const logoutUsuario = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
};

// Auxiliar: busca empleado activo y valida últimos 4 dígitos del teléfono
const buscarEmpleadoVerificado = (cedulaRaw, ultimos4Raw, callback) => {
    const cedula = limpiarDigitos(cedulaRaw);
    const ultimos4 = limpiarDigitos(ultimos4Raw);

    if (!cedula || ultimos4.length !== 4) {
        return callback(null, {
            ok: false,
            message: 'Ingrese una cédula válida y los últimos 4 dígitos de su teléfono.'
        });
    }

    const query = `
        SELECT u.Id, u.cedula, u.correo, u.estado, i.telefono, i.nombres, i.apellidos
        FROM usuario u
        INNER JOIN info_usuario i ON u.Id = i.id_usuario
        WHERE u.cedula = ?
        LIMIT 1
    `;

    conexion.query(query, [cedula], (err, rows) => {
        if (err) return callback(err);

        if (rows.length === 0) {
            return callback(null, {
                ok: false,
                message: 'No se pudo verificar la información ingresada.'
            });
        }

        const emp = rows[0];
        if (String(emp.estado).toLowerCase() !== 'activo') {
            return callback(null, {
                ok: false,
                message: 'Su usuario se encuentra inactivo. Contacte a la Gerencia de Telemática.'
            });
        }

        const telDigitos = limpiarDigitos(emp.telefono);
        if (telDigitos.length < 4 || !telDigitos.endsWith(ultimos4)) {
            return callback(null, {
                ok: false,
                message: 'Los datos de verificación (cédula o últimos 4 dígitos del teléfono) no coinciden.'
            });
        }

        return callback(null, { ok: true, empleado: emp });
    });
};

// Auxiliar: genera OTP de 6 dígitos, guarda hash con 10 min de expiración y envía correo
const crearYEnviarCodigo = async (idUsuario, correoDestino, esCorreoNuevo, res, extraPayload = {}) => {
    const codigo = generarCodigoOTP();
    const codigoHash = await bcrypt.hash(codigo, 10);

    conexion.query(
        'UPDATE recuperacion_password SET usado = 1 WHERE id_usuario = ? AND usado = 0',
        [idUsuario],
        (errUpdate) => {
            if (errUpdate) {
                console.error('Error al invalidar códigos previos:', errUpdate);
                return res.json({ success: false, message: 'Error interno al generar el código.' });
            }

            const insertQuery = `
                INSERT INTO recuperacion_password
                    (id_usuario, correo_destino, es_correo_nuevo, codigo_hash, intentos, expira_en, verificado, usado)
                VALUES (?, ?, ?, ?, 0, DATE_ADD(NOW(), INTERVAL 10 MINUTE), 0, 0)
            `;

            conexion.query(
                insertQuery,
                [idUsuario, correoDestino, esCorreoNuevo ? 1 : 0, codigoHash],
                async (errInsert, result) => {
                    if (errInsert) {
                        console.error('Error al guardar código de recuperación:', errInsert);
                        return res.json({ success: false, message: 'Error interno al registrar el código.' });
                    }

                    try {
                        await enviarCodigoRecuperacion(correoDestino, codigo);
                        return res.json({
                            success: true,
                            recuperacionId: result.insertId,
                            ...extraPayload
                        });
                    } catch (mailErr) {
                        console.error('Error al enviar correo SMTP:', mailErr);
                        return res.json({
                            success: false,
                            message: 'No se pudo enviar el correo de verificación. Intente más tarde.'
                        });
                    }
                }
            );
        }
    );
};

// Paso 1: Verificar cédula + últimos 4 dígitos del teléfono
const solicitarRecuperacion = (req, res) => {
    const { cedula, ultimos4 } = req.body;

    buscarEmpleadoVerificado(cedula, ultimos4, (err, check) => {
        if (err) {
            console.error('Error en solicitarRecuperacion:', err);
            return res.json({ success: false, message: 'Error interno del servidor.' });
        }

        if (!check.ok) {
            return res.json({ success: false, message: check.message });
        }

        const { empleado } = check;
        const correoExistente = empleado.correo ? String(empleado.correo).trim() : '';

        if (correoExistente) {
            return crearYEnviarCodigo(empleado.Id, correoExistente, false, res, {
                requiereCorreo: false,
                correoEnmascarado: mascararCorreo(correoExistente),
                message: 'Enviamos un código de 6 dígitos a tu correo registrado.'
            });
        }

        return res.json({
            success: true,
            requiereCorreo: true,
            message: 'Verificación correcta. Ingresa tu correo electrónico para recibir el código de 6 dígitos.'
        });
    });
};

// Paso 1B: Enviar código al correo ingresado por un usuario sin correo previo
const enviarCodigoCorreoNuevo = (req, res) => {
    const { cedula, ultimos4, correo } = req.body;
    const correoLimpio = String(correo || '').trim().toLowerCase();

    if (!validarCorreoFormato(correoLimpio)) {
        return res.json({ success: false, message: 'Ingresa un correo electrónico válido.' });
    }

    buscarEmpleadoVerificado(cedula, ultimos4, (err, check) => {
        if (err) {
            console.error('Error en enviarCodigoCorreoNuevo:', err);
            return res.json({ success: false, message: 'Error interno del servidor.' });
        }

        if (!check.ok) {
            return res.json({ success: false, message: check.message });
        }

        const { empleado } = check;
        return crearYEnviarCodigo(empleado.Id, correoLimpio, true, res, {
            requiereCorreo: false,
            correoEnmascarado: mascararCorreo(correoLimpio),
            message: 'Enviamos un código de 6 dígitos al correo ingresado.'
        });
    });
};

// Paso 2: Verificar el código OTP de 6 dígitos
const verificarCodigoRecuperacion = (req, res) => {
    const { recuperacionId, codigo } = req.body;
    const codigoLimpio = limpiarDigitos(codigo);

    if (!recuperacionId || codigoLimpio.length !== 6) {
        return res.json({ success: false, message: 'Ingresa el código de 6 dígitos.' });
    }

    const query = `
        SELECT id, id_usuario, codigo_hash, intentos, usado, verificado,
               (expira_en > NOW()) AS vigente
        FROM recuperacion_password
        WHERE id = ?
        LIMIT 1
    `;

    conexion.query(query, [recuperacionId], async (err, rows) => {
        if (err) {
            console.error('Error en verificarCodigoRecuperacion:', err);
            return res.json({ success: false, message: 'Error interno del servidor.' });
        }

        if (rows.length === 0) {
            return res.json({ success: false, message: 'Solicitud de recuperación no encontrada.' });
        }

        const rec = rows[0];

        if (rec.usado === 1) {
            return res.json({ success: false, message: 'Este código ya fue utilizado.' });
        }

        if (!rec.vigente) {
            return res.json({ success: false, message: 'El código ha expirado. Solicita uno nuevo.' });
        }

        if (rec.intentos >= 5) {
            return res.json({ success: false, message: 'Superaste el límite de intentos. Solicita un código nuevo.' });
        }

        try {
            const coincide = await bcrypt.compare(codigoLimpio, rec.codigo_hash);

            if (!coincide) {
                conexion.query(
                    'UPDATE recuperacion_password SET intentos = intentos + 1 WHERE id = ?',
                    [rec.id]
                );
                return res.json({ success: false, message: 'El código ingresado es incorrecto.' });
            }

            conexion.query(
                'UPDATE recuperacion_password SET verificado = 1 WHERE id = ?',
                [rec.id],
                (errVer) => {
                    if (errVer) {
                        console.error('Error al marcar código verificado:', errVer);
                        return res.json({ success: false, message: 'Error interno al verificar el código.' });
                    }

                    return res.json({
                        success: true,
                        message: 'Código verificado. Ahora define tu nueva contraseña.'
                    });
                }
            );
        } catch (error) {
            console.error('Error comparando OTP:', error);
            return res.json({ success: false, message: 'Error interno del servidor.' });
        }
    });
};

// Paso 3: Guardar nueva contraseña (y vincular correo si era nuevo)
const restablecerPasswordRecuperacion = async (req, res) => {
    const { recuperacionId, codigo, nuevaPassword, confirmarPassword } = req.body;
    const codigoLimpio = limpiarDigitos(codigo);

    if (!recuperacionId || codigoLimpio.length !== 6) {
        return res.json({ success: false, message: 'Solicitud inválida.' });
    }

    if (!nuevaPassword || nuevaPassword.length < 8) {
        return res.json({ success: false, message: 'La nueva contraseña debe tener al menos 8 caracteres.' });
    }

    if (nuevaPassword !== confirmarPassword) {
        return res.json({ success: false, message: 'Las contraseñas no coinciden.' });
    }

    if (nuevaPassword === '%hidrolara123%') {
        return res.json({ success: false, message: 'No puedes usar la contraseña por defecto.' });
    }

    const query = `
        SELECT id, id_usuario, correo_destino, es_correo_nuevo, codigo_hash, verificado, usado,
               (expira_en > NOW()) AS vigente
        FROM recuperacion_password
        WHERE id = ?
        LIMIT 1
    `;

    conexion.query(query, [recuperacionId], async (err, rows) => {
        if (err) {
            console.error('Error en restablecerPasswordRecuperacion:', err);
            return res.json({ success: false, message: 'Error interno del servidor.' });
        }

        if (rows.length === 0) {
            return res.json({ success: false, message: 'Solicitud de recuperación no válida.' });
        }

        const rec = rows[0];

        if (rec.usado === 1 || rec.verificado !== 1 || !rec.vigente) {
            return res.json({
                success: false,
                message: 'La sesión de recuperación expiró o no fue verificada. Inicia el proceso nuevamente.'
            });
        }

        try {
            const codigoValido = await bcrypt.compare(codigoLimpio, rec.codigo_hash);
            if (!codigoValido) {
                return res.json({ success: false, message: 'Código de verificación inválido.' });
            }

            const hashedPassword = await bcrypt.hash(nuevaPassword, 10);

            const updateUsuarioQuery = rec.es_correo_nuevo === 1
                ? 'UPDATE usuario SET password = ?, correo = ?, cambiar_password = 0 WHERE Id = ?'
                : 'UPDATE usuario SET password = ?, cambiar_password = 0 WHERE Id = ?';

            const paramsUsuario = rec.es_correo_nuevo === 1
                ? [hashedPassword, rec.correo_destino, rec.id_usuario]
                : [hashedPassword, rec.id_usuario];

            conexion.query(updateUsuarioQuery, paramsUsuario, (errUpd) => {
                if (errUpd) {
                    console.error('Error al actualizar contraseña/correo:', errUpd);
                    return res.json({ success: false, message: 'Error al guardar la nueva contraseña.' });
                }

                conexion.query(
                    'UPDATE recuperacion_password SET usado = 1 WHERE id = ?',
                    [rec.id]
                );

                return res.json({
                    success: true,
                    message: 'Contraseña actualizada con éxito. Ya puedes iniciar sesión.'
                });
            });
        } catch (error) {
            console.error('Error al restablecer contraseña:', error);
            return res.json({ success: false, message: 'Error interno del servidor.' });
        }
    });
};

module.exports = {
    loginUsuario,
    logoutUsuario,
    solicitarRecuperacion,
    enviarCodigoCorreoNuevo,
    verificarCodigoRecuperacion,
    restablecerPasswordRecuperacion
};