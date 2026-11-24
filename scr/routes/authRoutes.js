const express = require('express');
const router = express.Router();
const {
    loginUsuario,
    logoutUsuario,
    solicitarRecuperacion,
    enviarCodigoCorreoNuevo,
    verificarCodigoRecuperacion,
    restablecerPasswordRecuperacion
} = require('../controllers/authController');

router.get('/', (req, res) => {
    res.redirect('/login');
});

router.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/inicio');
    res.render('login');
});

router.post('/login', loginUsuario);
router.get('/logout', logoutUsuario);

// Rutas de recuperación de contraseña
router.post('/recuperar/solicitar', solicitarRecuperacion);
router.post('/recuperar/correo-nuevo', enviarCodigoCorreoNuevo);
router.post('/recuperar/verificar-codigo', verificarCodigoRecuperacion);
router.post('/recuperar/restablecer', restablecerPasswordRecuperacion);

module.exports = router;
