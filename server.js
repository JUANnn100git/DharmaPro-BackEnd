// Requires
require('dotenv').config();
require('./config/config');
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

var createAdmin = require('./helpers/admin');

// Inicializar variables
var app = express();

// CORS
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
    next();
});

// Body Parser: parse application/x-www-form-urlencoded & application/json
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Importar Rutas
var appRoutes = require('./routes/app');
var rolRoutes = require('./routes/rol');
var usuarioRoutes = require('./routes/usuario');
var hospitalRoutes = require('./routes/hospital');
var medicoRoutes = require('./routes/medico');
var loginRoutes = require('./routes/login');
var busquedaRoutes = require('./routes/busqueda');
var uploadRoutes = require('./routes/upload');
var imagenesRoutes = require('./routes/imagenes');

// Conexión a la base de datos
mongoose.connect(process.env.URLDB, { useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false }, (err, res) => {
    if (err) throw err;
    console.log('\x1b[32m\x1b[36m' + 'Base de datos:\x1b[32m\x1b[93m', 'Online');
});

// Server index config
// var serveIndex = require('serve-index');
// app.use(express.static(__dirname + '/'))
// app.use('/uploads', serveIndex(__dirname + '/uploads'));

// Rutas

app.use('/login', loginRoutes);
app.use('/rol', rolRoutes);
app.use('/usuario', usuarioRoutes);
app.use('/hospital', hospitalRoutes);
app.use('/medico', medicoRoutes);
app.use('/busqueda', busquedaRoutes);
app.use('/upload', uploadRoutes);
app.use('/img', imagenesRoutes);

// Última Ruta
app.use('/', appRoutes);

// Escuchar peticiones
app.listen(process.env.PORT, () => {
    console.log('\x1b[32m\x1b[36m' + 'Express server en puerto \x1b[32m\x1b[91m' + process.env.PORT + '\x1b[32m\x1b[36m:\x1b[32m\x1b[93m', 'Online');
});

// Crear la Credenciales del Administrador en caso no exista en la BD
createAdmin();