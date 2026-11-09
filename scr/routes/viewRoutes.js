const express = require('express');
const router = express.Router();
const verificarSesion = require('../middlewares/authMiddleware');

router.get('/inicio', verificarSesion, (req, res) => {
    res.render('inicio');
});

router.get('/dashboard', verificarSesion, (req, res) => {
    res.render('dashboard');
});

router.get('/usuarios', verificarSesion, (req, res) => {
    res.render('usuarios');
});

router.get('/apps', verificarSesion, (req, res) => {
    res.render('apps');
});

router.get('/nosotros', verificarSesion, (req, res) => {
    res.render('nosotros');
});

router.get('/directorio', verificarSesion, (req, res) => {
    res.render('directorio');
});

router.get('/partials/sidebar.ejs', verificarSesion, (req, res) => {
    res.render('partials/sidebar');
});

module.exports = router;