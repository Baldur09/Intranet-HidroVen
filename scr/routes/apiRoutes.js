const express = require('express');
const router = express.Router();
const conexion = require('../conexion');
const { verificarSesion, esAdmin } = require('../middlewares/authMiddleware');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

        if (password && password.trim() !== '') {
            if (password.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: 'La nueva contraseña debe tener al menos 8 caracteres.'
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const cambiarPasswordVal = (password === '%hidrolara123%') ? 1 : 0;

            queryUsuario = `
                UPDATE usuario 
                SET cedula = ?, correo = ?, estado = ?, password = ?, cambiar_password = ? 
                WHERE Id = ?
            `;
            paramsUsuario = [cedula, correo, estado, hashedPassword, cambiarPasswordVal, id];
        } else {
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
    const { estado } = req.body;

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

    const queryBuscar = `SELECT password FROM usuario WHERE Id = ?`;
    conexion.query(queryBuscar, [userId], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(500).json({ success: false, message: 'Error al verificar el usuario.' });
        }

        try {
            const passwordHashBD = results[0].password;
            const coincide = await bcrypt.compare(actualPassword, passwordHashBD);

            if (!coincide) {
                return res.status(401).json({ success: false, message: 'La contraseña actual es incorrecta.' });
            }

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

// =========================================================================
// MÓDULO DE GESTIÓN DE ENLACES, PANTALLAS Y SUBDIVISIONES (CON MULTER)
// =========================================================================

// Crear carpeta destino si no existe (../../public/images/logos desde scr/routes/)
const dirLogos = path.join(__dirname, '../../public/images/logos');
if (!fs.existsSync(dirLogos)) {
    fs.mkdirSync(dirLogos, { recursive: true });
}

const storageLogos = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, dirLogos);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const nombreUnico = `logo-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
        cb(null, nombreUnico);
    }
});

const uploadLogo = multer({
    storage: storageLogos,
    limits: { fileSize: 2 * 1024 * 1024 }, // Máximo 2MB
    fileFilter: (req, file, cb) => {
        const permitidos = /jpeg|jpg|png|webp|svg|ico/;
        const extOk = permitidos.test(path.extname(file.originalname).toLowerCase());
        const mimeOk = permitidos.test(file.mimetype);
        if (extOk || mimeOk) {
            return cb(null, true);
        }
        cb(new Error('Solo se permiten archivos de imagen (PNG, JPG, WEBP, SVG, ICO).'));
    }
});

function extraerDominioBase(hostname) {
    const limpio = hostname.replace(/^www\./i, '');
    const partes = limpio.split('.');
    const tldsCompuestos = ['gob', 'gov', 'com', 'org', 'edu', 'net', 'mil'];

    if (partes.length > 2) {
        const penultima = partes[partes.length - 2].toLowerCase();
        if (tldsCompuestos.includes(penultima) && partes.length > 3) {
            return partes.slice(-3).join('.');
        }
        if (!tldsCompuestos.includes(penultima)) {
            return partes.slice(-2).join('.');
        }
    }
    return limpio;
}

function construirUrlLogoAutomatico(dominioBase) {
    const googleFavicon = encodeURIComponent(`https://www.google.com/s2/favicons?domain=${dominioBase}&sz=128`);
    return `https://unavatar.io/${dominioBase}?fallback=${googleFavicon}`;
}

function resolverLogo(url, logoIngresado, archivoSubido) {
    // 1. Archivo subido con Multer
    if (archivoSubido) {
        return `/images/logos/${archivoSubido.filename}`;
    }
    // 2. URL manual ingresada por el admin
    if (logoIngresado && logoIngresado.trim() !== '') {
        return logoIngresado.trim();
    }
    // 3. Automático: unavatar.io con respaldo de Google Favicons
    try {
        const hostname = new URL(url).hostname;
        const dominioBase = extraerDominioBase(hostname);
        return construirUrlLogoAutomatico(dominioBase);
    } catch (e) {
        return '/images/default-link.png';
    }
}

// 8. OBTENER PANTALLAS (GET)
router.get('/pantallas', verificarSesion, (req, res) => {
    const query = `SELECT Id, nombre, slug, estado FROM pantallas ORDER BY Id ASC`;
    conexion.query(query, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Error al cargar pantallas' });
        res.json({ success: true, pantallas: results });
    });
});

// 9. OBTENER SUBDIVISIONES (GET)
router.get('/subdivisiones', verificarSesion, (req, res) => {
    const query = `
        SELECT s.Id, s.id_pantalla, s.nombre, s.estado, p.nombre AS pantalla_nombre
        FROM subdivision s
        INNER JOIN pantallas p ON s.id_pantalla = p.Id
        ORDER BY p.Id ASC, s.Id ASC
    `;
    conexion.query(query, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Error al cargar subdivisiones' });
        res.json({ success: true, subdivisiones: results });
    });
});

// 10. CREAR SUBDIVISIÓN (POST)
router.post('/subdivisiones', verificarSesion, esAdmin, (req, res) => {
    const { id_pantalla, nombre } = req.body;
    if (!id_pantalla || !nombre || nombre.trim() === '') {
        return res.status(400).json({ success: false, message: 'La pantalla y el nombre de la subdivisión son obligatorios.' });
    }
    const query = `INSERT INTO subdivision (id_pantalla, nombre, estado) VALUES (?, ?, 'Activo')`;
    conexion.query(query, [Number(id_pantalla), nombre.trim()], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Error al crear la subdivisión.' });
        res.json({ success: true, message: 'Subdivisión creada exitosamente.', id: result.insertId });
    });
});

// 11. OBTENER ENLACES (GET)
router.get('/enlaces', verificarSesion, (req, res) => {
    const query = `
        SELECT e.Id AS id, e.titulo, e.url, e.logo, e.estado, e.id_subdivision,
               s.nombre AS subdivision, s.id_pantalla,
               p.nombre AS pantalla, p.slug AS pantalla_slug
        FROM enlaces e
        INNER JOIN subdivision s ON e.id_subdivision = s.Id
        INNER JOIN pantallas p ON s.id_pantalla = p.Id
        ORDER BY e.Id DESC
    `;
    conexion.query(query, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Error al cargar los enlaces.' });
        res.json({ success: true, enlaces: results });
    });
});

// 12. CREAR ENLACE (POST con Multer)
router.post('/enlaces', verificarSesion, esAdmin, uploadLogo.single('logoArchivo'), (req, res) => {
    const { titulo, url, logo, id_subdivision } = req.body;
    if (!titulo || !url || !id_subdivision) {
        return res.status(400).json({ success: false, message: 'Título, URL y subdivisión son obligatorios.' });
    }
    const urlFormateada = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    const logoFinal = resolverLogo(urlFormateada, logo, req.file);

    const query = `INSERT INTO enlaces (titulo, url, logo, estado, id_subdivision) VALUES (?, ?, ?, 'Activo', ?)`;
    conexion.query(query, [titulo.trim(), urlFormateada, logoFinal, Number(id_subdivision)], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Error al guardar el enlace.' });
        res.json({ success: true, message: 'Enlace registrado exitosamente.' });
    });
});

// 13. ACTUALIZAR ENLACE (PUT con Multer)
router.put('/enlaces/:id', verificarSesion, esAdmin, uploadLogo.single('logoArchivo'), (req, res) => {
    const { id } = req.params;
    const { titulo, url, logo, id_subdivision, estado, logoActual } = req.body;
    if (!titulo || !url || !id_subdivision) {
        return res.status(400).json({ success: false, message: 'Todos los campos obligatorios deben completarse.' });
    }
    const urlFormateada = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;

    let logoFinal;
    if (req.file) {
        logoFinal = `/images/logos/${req.file.filename}`;
    } else if (logo && logo.trim() !== '') {
        logoFinal = logo.trim();
    } else if (logoActual && logoActual.startsWith('/images/logos/')) {
        logoFinal = logoActual;
    } else {
        logoFinal = resolverLogo(urlFormateada, '', null);
    }

    const query = `UPDATE enlaces SET titulo = ?, url = ?, logo = ?, estado = ?, id_subdivision = ? WHERE Id = ?`;
    conexion.query(query, [titulo.trim(), urlFormateada, logoFinal, estado || 'Activo', Number(id_subdivision), id], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Error al actualizar el enlace.' });
        res.json({ success: true, message: 'Enlace actualizado correctamente.' });
    });
});

// 14. CAMBIAR ESTADO DE ENLACE (PATCH)
router.patch('/enlaces/:id/estado', verificarSesion, esAdmin, (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    const query = `UPDATE enlaces SET estado = ? WHERE Id = ?`;
    conexion.query(query, [estado || 'Inactivo', id], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Error al cambiar el estado.' });
        res.json({ success: true, message: `Enlace marcado como ${estado || 'Inactivo'}.` });
    });
});
// =========================================================================
// MÓDULO DE GESTIÓN DE CARRUSEL DE FOTOS (CON MULTER)
// =========================================================================

const dirCarrusel = path.join(__dirname, '../../public/images/carrusel');
if (!fs.existsSync(dirCarrusel)) {
    fs.mkdirSync(dirCarrusel, { recursive: true });
}

const storageCarrusel = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, dirCarrusel);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const nombreUnico = `slide-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
        cb(null, nombreUnico);
    }
});

const uploadCarrusel = multer({
    storage: storageCarrusel,
    limits: { fileSize: 5 * 1024 * 1024 }, // Máximo 5MB por foto
    fileFilter: (req, file, cb) => {
        const permitidos = /\/(jpeg|jpg|png|webp)$/i;
        const extOk = /\.(jpeg|jpg|png|webp)$/i.test(path.extname(file.originalname));
        const mimeOk = permitidos.test(file.mimetype);
        if (extOk || mimeOk) {
            return cb(null, true);
        }
        cb(new Error('Solo se permiten imágenes JPG, JPEG, PNG o WEBP para el carrusel.'));
    }
});

function eliminarArchivoCarruselSiEsLocal(rutaImagen) {
    if (!rutaImagen || typeof rutaImagen !== 'string') return;
    if (rutaImagen.startsWith('/images/carrusel/')) {
        const nombreArchivo = path.basename(rutaImagen);
        const rutaFisica = path.join(dirCarrusel, nombreArchivo);
        if (fs.existsSync(rutaFisica)) {
            fs.unlink(rutaFisica, (err) => {
                if (err) console.error('No se pudo eliminar archivo del carrusel:', err);
            });
        }
    }
}

// 15. OBTENER FOTOS DEL CARRUSEL (GET)
router.get('/carrusel', verificarSesion, (req, res) => {
    const query = `
        SELECT Id AS id, titulo, ubicacion, imagen, estado, creado_en
        FROM carrusel
        ORDER BY Id ASC
    `;
    conexion.query(query, (err, results) => {
        if (err) {
            console.error('Error al cargar el carrusel:', err);
            return res.status(500).json({ success: false, message: 'Error al cargar las fotos del carrusel.' });
        }
        res.json({ success: true, slides: results });
    });
});

// 16. CREAR FOTO EN CARRUSEL (POST con Multer)
router.post('/carrusel', verificarSesion, esAdmin, (req, res) => {
    uploadCarrusel.single('imagenArchivo')(req, res, (errUpload) => {
        if (errUpload) {
            return res.status(400).json({ success: false, message: errUpload.message || 'Error al subir la imagen.' });
        }

        const { titulo, ubicacion, estado } = req.body;
        if (!titulo || !titulo.trim() || !ubicacion || !ubicacion.trim()) {
            if (req.file) eliminarArchivoCarruselSiEsLocal(`/images/carrusel/${req.file.filename}`);
            return res.status(400).json({ success: false, message: 'El título y la ubicación son obligatorios.' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Debes seleccionar una foto desde tu PC.' });
        }

        const rutaImagen = `/images/carrusel/${req.file.filename}`;
        const estadoValido = estado === 'Inactivo' ? 'Inactivo' : 'Activo';

        const query = `INSERT INTO carrusel (titulo, ubicacion, imagen, estado) VALUES (?, ?, ?, ?)`;
        conexion.query(query, [titulo.trim(), ubicacion.trim(), rutaImagen, estadoValido], (err, result) => {
            if (err) {
                eliminarArchivoCarruselSiEsLocal(rutaImagen);
                console.error('Error al guardar foto en carrusel:', err);
                return res.status(500).json({ success: false, message: 'Error al guardar la foto en la base de datos.' });
            }
            res.json({ success: true, message: 'Foto agregada al carrusel exitosamente.', id: result.insertId });
        });
    });
});

// 17. ACTUALIZAR FOTO DEL CARRUSEL (PUT con Multer)
router.put('/carrusel/:id', verificarSesion, esAdmin, (req, res) => {
    uploadCarrusel.single('imagenArchivo')(req, res, (errUpload) => {
        if (errUpload) {
            return res.status(400).json({ success: false, message: errUpload.message || 'Error al subir la imagen.' });
        }

        const { id } = req.params;
        const { titulo, ubicacion, estado } = req.body;

        if (!titulo || !titulo.trim() || !ubicacion || !ubicacion.trim()) {
            if (req.file) eliminarArchivoCarruselSiEsLocal(`/images/carrusel/${req.file.filename}`);
            return res.status(400).json({ success: false, message: 'El título y la ubicación son obligatorios.' });
        }

        conexion.query(`SELECT imagen FROM carrusel WHERE Id = ?`, [id], (errSelect, rows) => {
            if (errSelect || rows.length === 0) {
                if (req.file) eliminarArchivoCarruselSiEsLocal(`/images/carrusel/${req.file.filename}`);
                return res.status(404).json({ success: false, message: 'La foto indicada no existe.' });
            }

            const imagenAnterior = rows[0].imagen;
            const nuevaImagen = req.file ? `/images/carrusel/${req.file.filename}` : imagenAnterior;
            const estadoValido = estado === 'Inactivo' ? 'Inactivo' : 'Activo';

            const queryUpdate = `UPDATE carrusel SET titulo = ?, ubicacion = ?, imagen = ?, estado = ? WHERE Id = ?`;
            conexion.query(queryUpdate, [titulo.trim(), ubicacion.trim(), nuevaImagen, estadoValido, id], (errUpdate) => {
                if (errUpdate) {
                    if (req.file) eliminarArchivoCarruselSiEsLocal(nuevaImagen);
                    console.error('Error al actualizar foto del carrusel:', errUpdate);
                    return res.status(500).json({ success: false, message: 'Error al actualizar la foto.' });
                }

                if (req.file && imagenAnterior !== nuevaImagen) {
                    eliminarArchivoCarruselSiEsLocal(imagenAnterior);
                }

                res.json({ success: true, message: 'Foto actualizada correctamente.' });
            });
        });
    });
});

// 18. CAMBIAR ESTADO DE FOTO DEL CARRUSEL (PATCH)
router.patch('/carrusel/:id/estado', verificarSesion, esAdmin, (req, res) => {
    const { id } = req.params;
    const estadoValido = req.body.estado === 'Inactivo' ? 'Inactivo' : 'Activo';

    const query = `UPDATE carrusel SET estado = ? WHERE Id = ?`;
    conexion.query(query, [estadoValido, id], (err) => {
        if (err) {
            console.error('Error al cambiar estado de foto:', err);
            return res.status(500).json({ success: false, message: 'Error al cambiar el estado.' });
        }
        res.json({ success: true, message: `Foto marcada como ${estadoValido}.` });
    });
});

// 19. ELIMINAR FOTO DEL CARRUSEL (DELETE)
router.delete('/carrusel/:id', verificarSesion, esAdmin, (req, res) => {
    const { id } = req.params;

    conexion.query(`SELECT imagen FROM carrusel WHERE Id = ?`, [id], (errSelect, rows) => {
        if (errSelect || rows.length === 0) {
            return res.status(404).json({ success: false, message: 'La foto no fue encontrada.' });
        }

        const imagenGuardada = rows[0].imagen;
        conexion.query(`DELETE FROM carrusel WHERE Id = ?`, [id], (errDelete) => {
            if (errDelete) {
                console.error('Error al eliminar foto del carrusel:', errDelete);
                return res.status(500).json({ success: false, message: 'Error al eliminar la foto.' });
            }

            eliminarArchivoCarruselSiEsLocal(imagenGuardada);
            res.json({ success: true, message: 'Foto eliminada del carrusel.' });
        });
    });
});
module.exports = router;