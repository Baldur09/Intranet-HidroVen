const express = require('express');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = 3000;

// 1. Configuración de Sesiones
app.use(session({
    secret: 'hidroven_intranet_secreto_seguro',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// 2. Middleware global para inyectar el usuario en las vistas EJS
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// 3. Configuración general
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 4. Importar las Rutas Modularizadas
const authRoutes = require('./scr/routes/authRoutes');
const viewRoutes = require('./scr/routes/viewRoutes');
const apiRoutes = require('./scr/routes/apiRoutes');

// 5. Usar las rutas en la app
app.use('/', authRoutes);
app.use('/', viewRoutes);
app.use('/api', apiRoutes);

// 6. Encender el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});