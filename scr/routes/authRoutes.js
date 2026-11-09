const express = require('express');
const router = express.Router();
const { loginUsuario, logoutUsuario } = require('../controllers/authController');

router.get('/', (req, res) => {
    res.redirect('/login');
});

router.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/inicio');
    res.render('login');
});

router.post('/login', loginUsuario);
router.get('/logout', logoutUsuario);

module.exports = router;