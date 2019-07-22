// =========================================
// Variables Globales
// =========================================
// Bcryptjs
module.exports.SEED = "@super-%seed@-[2019]@";

// Server URI
module.exports.SERVER_URL = "http://localhost:4200";

// =========================================
// Puerto
// =========================================
process.env.PORT = process.env.PORT || 3000;

// =========================================
// Entorno
// =========================================
process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

// =========================================
// Base de Datos
// =========================================
let urlDB;

if ( process.env.NODE_ENV === 'dev' ) {
    urlDB = 'mongodb://localhost:27017/hospitalDB';
} else {
    urlDB = process.env.MONGO_URI;
}

process.env.URLDB = urlDB;