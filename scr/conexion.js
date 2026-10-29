const mysql = require('mysql2');
require('dotenv').config();

// Creamos la conexión usando los datos locales de XAMPP
const conexion = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Por defecto en XAMPP viene sin contraseña, así que se deja vacío
    database: 'intranet_hidroven' // El nombre exacto de tu base de datos
});

// Verificamos si la conexión funciona
conexion.connect((error) => {
    if (error) {
        console.error('Error al conectar a la base de datos:', error);
        return;
    }
    console.log('¡Conexión exitosa a la base de datos MySQL de la Intranet!');
});

module.exports = conexion;