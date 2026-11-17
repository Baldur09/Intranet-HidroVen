const express = require('express');
const router = express.Router();
const conexion = require('../conexion');
const { verificarSesion, esAdmin } = require('../middlewares/authMiddleware');

// Función reutilizable para consultar subdivisiones y enlaces activos de cada pantalla
function renderizarVistaEnlaces(res, slug, vistaEjs) {
    const queryPantalla = `SELECT Id, nombre, slug FROM pantallas WHERE slug = ? AND estado = 'Activo' LIMIT 1`;
    conexion.query(queryPantalla, [slug], (err, pantallas) => {
        if (err || pantallas.length === 0) {
            return res.redirect('/inicio');
        }

        const pantalla = pantallas[0];
        const queryContenido = `
            SELECT s.Id AS id_subdivision, s.nombre AS subdivision_nombre,
                   e.Id AS id_enlace, e.titulo, e.url, e.logo
            FROM subdivision s
            LEFT JOIN enlaces e ON e.id_subdivision = s.Id AND e.estado = 'Activo'
            WHERE s.id_pantalla = ? AND s.estado = 'Activo'
            ORDER BY s.Id ASC, e.Id ASC
        `;

        conexion.query(queryContenido, [pantalla.Id], (errSub, rows) => {
            if (errSub) {
                console.error(`Error al cargar contenido de ${slug}:`, errSub);
                return res.redirect('/inicio');
            }

            const mapaSubdivisiones = new Map();
            rows.forEach(row => {
                if (!mapaSubdivisiones.has(row.id_subdivision)) {
                    mapaSubdivisiones.set(row.id_subdivision, {
                        id: row.id_subdivision,
                        nombre: row.subdivision_nombre,
                        enlaces: []
                    });
                }
                if (row.id_enlace) {
                    mapaSubdivisiones.get(row.id_subdivision).enlaces.push({
                        id: row.id_enlace,
                        titulo: row.titulo,
                        url: row.url,
                        logo: row.logo
                    });
                }
            });

            res.render(vistaEjs, {
                pantalla,
                subdivisiones: Array.from(mapaSubdivisiones.values())
            });
        });
    });
}

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

router.get('/gestion-enlaces', verificarSesion, esAdmin, (req, res) => {
    res.render('gestion-enlaces');
});

// Rutas para ambos roles (Administrador y Empleado)
router.get('/apps', verificarSesion, (req, res) => {
    res.render('apps');
});

router.get('/bancos', verificarSesion, (req, res) => {
    renderizarVistaEnlaces(res, 'bancos', 'bancos');
});

router.get('/organismos', verificarSesion, (req, res) => {
    renderizarVistaEnlaces(res, 'organismos', 'organismos');
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