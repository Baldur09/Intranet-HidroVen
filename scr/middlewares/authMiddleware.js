// src/middlewares/authMiddleware.js
function verificarSesion(req, res, next) {
    if (req.session && req.session.user) {
        return next(); // Si hay sesión activa, pasa a la siguiente función
    }
    return res.redirect('/login'); // Si no, lo manda al login
}

module.exports = verificarSesion;