// scr/middlewares/authMiddleware.js
const conexion = require('../conexion');

// 1. Verifica que exista sesión Y que el usuario siga activo en la BD
function verificarSesion(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.redirect('/login');
    }

    const userId = req.session.user.id;
    const query = 'SELECT estado FROM usuario WHERE Id = ?';

    conexion.query(query, [userId], (err, results) => {
        if (err || results.length === 0) {
            return req.session.destroy(() => res.redirect('/login'));
        }

        const estadoActual = results[0].estado.toLowerCase();

        // Si fue desactivado mientras navegaba, destruimos su sesión al instante
        if (estadoActual !== 'activo') {
            return req.session.destroy(() => {
                // Si la petición viene de un fetch (/api/...), devolvemos JSON
                if (req.originalUrl.startsWith('/api')) {
                    return res.status(401).json({ 
                        success: false, 
                        message: 'Su usuario ha sido desactivado.' 
                    });
                }
                return res.redirect('/login');
            });
        }

        return next();
    });
}

// 2. Verifica que el usuario logueado tenga el rol de Administrador
function esAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.rol === 'Administrador') {
        return next();
    }

    // Si intenta consumir una API de administrador mediante fetch
    if (req.originalUrl.startsWith('/api')) {
        return res.status(403).json({ 
            success: false, 
            message: 'Acceso denegado. Se requieren permisos de Administrador.' 
        });
    }

    // Si intenta entrar escribiendo la URL en el navegador, lo devolvemos a inicio
    return res.redirect('/inicio');
}

module.exports = {
    verificarSesion,
    esAdmin
};