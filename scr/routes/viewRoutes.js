const express = require('express');
const router = express.Router();
const { verificarSesion, esAdmin } = require('../middlewares/authMiddleware');

router.get('/inicio', verificarSesion, (req, res) => {
    res.render('inicio');
});

// Rutas exclusivas de Administrador
router.get('/dashboard', verificarSesion, esAdmin, (req, res) => {
    res.render('dashboard');
});

router.get('/usuarios', verificarSesion, esAdmin, (req, res) => {
    res.render('usuarios');
});

// Rutas para ambos roles (Administrador y Empleado)
router.get('/apps', verificarSesion, (req, res) => {
    res.render('apps');
});

router.get('/nosotros', verificarSesion, (req, res) => {
    res.render('nosotros');
});

router.get('/directorio', verificarSesion, (req, res) => {
    res.render('directorio');
});

router.get('/perfil', verificarSesion, (req, res) => {
    res.render('perfil');
});

router.get('/partials/sidebar.ejs', verificarSesion, (req, res) => {
    res.render('partials/sidebar');
});

module.exports = router;