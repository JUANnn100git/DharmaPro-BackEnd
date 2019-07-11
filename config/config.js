// =========================================
// Variables Globales
// =========================================
// Bcryptjs
module.exports.SEED = "@super-%seed@-[2019]@";

// Google
module.exports.CLIENT_ID = "613348891397-mdr9sdtqg4pi6qfolss3u49lqn56b1r9.apps.googleusercontent.com";

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