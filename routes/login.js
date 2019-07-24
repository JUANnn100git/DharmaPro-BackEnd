// Requires
var express = require('express');
var bcrypt = require('bcryptjs');
var crypto = require('crypto');
var cryptoRandomString = require('crypto-random-string');

var jwt = require('jsonwebtoken');

var SEED = require('../config/config').SEED;
var SERVER_URL = require('../config/config').SERVER_URL;

var sendMail = require('../helpers/mail');

// Inicializar variables
var app = express();

// Importar modelos
var Usuario = require('../models/usuario');
var Token = require('../models/token');

var mdAutenticacion = require('../middlewares/autenticacion');

// ===========================================
// Generar Token de Restauración de Contraseña
// ===========================================
app.post('/token-restaurar-passsword', (req, res) => {

    // Obtiene los datos enviados por el POST request
    var body = req.body;

    // Query Document -> Encuentra un Usuario con el email = body.email y lo devuelve como "usuarioDB"
    Usuario.findOne({ email: body.email }, (err, usuarioDB) => {

        // Si existe un error la respueta del Query
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar usuario',
                errors: err
            });
        }

        // Si no existe el usuario buscado
        if (!usuarioDB) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No existe un usuario con el correo: ' + body.email,
                errors: err
            });
        }

        // Si el usuario se encuentra inactivo
        if (usuarioDB.estado === 'Inactivo') {
            return res.status(400).json({
                ok: false,
                mensaje: 'Este Usuario se encuentra <b>Inactivo</b> no se puede recuperar la contraseña',
                errors: err
            });
        }

        // Query Document -> Encuentra un Token con los parámetros establecidos y devuelvelo como "tokenDB"
        Token.findOne({ _usuarioId: usuarioDB._id, tipo: 'passwordRestore' }, function(err, tokenDB) {

            // Si existe un error la respueta del Query
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar token',
                    errors: err
                });
            }

            // Si Existe el Token de Restauración de Contraseña
            if (tokenDB) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Ya existe un Token de Restauración de Contraseña para el usuario: ' + usuarioDB.email,
                    errors: err
                });
            }

            // Si No Existe el Token de Restauración de Contraseña para el usuarioDB

            // Crear Token de "passwordRestore" utilizando los datos de "usuarioDB"
            var token = new Token({ _usuarioId: usuarioDB._id, token: cryptoRandomString({ length: 32 }), tipo: 'passwordRestore', codigo: Math.floor(100000 + Math.random() * 900000) });

            // Query Document -> Crea un Token con los datos de "token"
            token.save((err) => {

                // Si existe un error la respuesta del Query
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        mensaje: 'Error al actualizar token',
                        errors: err
                    });
                }

                // Declarar variables para el envío de correo
                var email = usuarioDB.email;
                var template = token.tipo;
                var url = SERVER_URL + '/#/login-token/passwordRestore/' + token.token;
                var context = {
                    nombres: usuarioDB.nombres,
                    email: email,
                    codigo: token.codigo,
                    url: url
                };

                // Enviar correo de recuperación con el token
                sendMail(email, 'Solicitud de Restauración de Contraseña', template, context)
                    .then(data => {
                        console.log('Envio de correo correcto');
                        return res.status(200).json({
                            ok: true,
                            mensaje: data
                        });
                    })
                    .catch(error => {
                        console.error('Error en la promesa', error);
                        return res.status(500).json({
                            ok: false,
                            mensaje: 'Error al ejecutar envio de correo',
                            errors: err
                        });
                    });

            });

        });

    });

});

// =========================================
// Confirmar Restauración de Contraseña
// =========================================
app.post('/confirmar-restaurar-password', (req, res) => {

    // Obtiene los datos enviados por el POST request
    var body = req.body;

    // Query Document -> Encuentra un Token con los parámetros establecidos y devuelvelo como "tokenDB"
    Token.findOne({ token: body.token, tipo: body.tipo, codigo: body.codigo }, function(err, tokenDB) {

        // Si existe un error la respuesta del Query
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar token',
                errors: err
            });
        }

        // Si no existe el token buscado
        if (!tokenDB) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No existe el token: ' + body.token,
                errors: err
            });
        }

        // Query Document -> Encuentra un Usuario con las condiciones descritas y devuelvelo como "usuarioDB"
        Usuario.findOne({ _id: tokenDB._usuarioId, email: body.email }, (err, usuarioDB) => {

            // Si existe un error la respueta del Query
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar usuario',
                    errors: err
                });
            }

            // Si no existe el usuario buscado
            if (!usuarioDB) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'No existe un usuario con el correo: ' + body.email,
                    errors: err
                });
            }

            // Si el usuario se encuentra inactivo
            if (usuarioDB.estado === 'Inactivo') {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Este Usuario se encuentra <b>Inactivo</b> no se puede recuperar la contraseña',
                    errors: err
                });
            }

            // Generar una nueva contraseña
            var passwordActualizada = generarPassword();

            // Asignar la contraseña encriptada (Autogeneración del salt[10] y del hash) al usuarioDB
            usuarioDB.password = bcrypt.hashSync(passwordActualizada, 10);

            // Query Document -> Crea un Usuario con los datos de "usuarioDB"
            usuarioDB.save((err, usuarioGuardado) => {

                // Si existe un error
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        mensaje: 'Error al actualizar usuario',
                        errors: err
                    });
                }

                // Declarar variables para el envío de correo
                var email = usuarioDB.email;
                var template = 'passwordRestoreConfirmation';
                var context = {
                    nombres: usuarioDB.nombres,
                    passwordActualizada: passwordActualizada
                };

                // Enviar correo de restauración de contraseña
                sendMail(email, 'Confirmación de Restauración de Contraseña', template, context)
                    .then(data => {
                        console.log('Envio de correo correcto');
                        return res.status(200).json({
                            ok: true,
                            mensaje: data
                        });
                    })
                    .catch(error => {
                        console.error('Error en la promesa', error);
                        return res.status(500).json({
                            ok: false,
                            mensaje: 'Error al ejecutar envio de correo',
                            errors: err
                        });
                    });

            });

        });

    });

});

// =========================================
// Renovar Token
// =========================================
app.get('/renuevatoken', mdAutenticacion.verificaToken, (req, res) => {

    var token = jwt.sign({ usuario: req.usuario }, SEED, { expiresIn: 14400 }); // 4 horas -> 14400

    res.status(200).json({
        ok: false,
        token: token
    });
});

// =========================================
// Autenticación Normal
// =========================================
app.post('/', (req, res) => {

    var body = req.body;
    // { $and: [ { email: body.email }, { estado: { $ne: 'Inactivo' }} ] }
    Usuario.findOne({ email: body.email })
        .populate('role')
        .exec((err, usuarioDB) => {

            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar usuario',
                    errors: err
                });
            }

            if (!usuarioDB) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Credenciales incorrectas - email',
                    errors: err
                });
            }

            if (!usuarioDB.estaVerificado) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Esta cuenta no se encuentra Verificada',
                    errors: err
                });
            }

            if (usuarioDB.estado === 'Inactivo') {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Este Usuario se encuentra <b>Inactivo</b>',
                    errors: err
                });
            }

            if (usuarioDB.estado === 'Bloqueado') {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Usuario Bloqueado.<br> Póngase en contacto con el administrador del Sistema',
                    errors: err
                });
            }

            if (!bcrypt.compareSync(body.password, usuarioDB.password)) {

                usuarioDB.contador_login++;

                if (usuarioDB.contador_login == 6) {
                    usuarioDB.estado = 'Bloqueado';
                }

                usuarioDB.save((err, usuarioGuardado) => {

                    if (err) {
                        return res.status(400).json({
                            ok: false,
                            mensaje: 'Error al actualizar usuario',
                            errors: err
                        });
                    }

                });

                return res.status(400).json({
                    ok: false,
                    mensaje: 'Credenciales incorrectas - password',
                    errors: err
                });
            }

            // Crear un token !!!
            usuarioDB.password = ':)';
            var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 }); // 4 horas -> 14400

            res.status(200).json({
                ok: true,
                usuario: usuarioDB,
                token: token,
                id: usuarioDB._id,
                menu: obtenerMenu(usuarioDB.role)
            });

        });

});



function obtenerMenu(role) {

    const menu = [];

    // pop(): Remove an item from the end of an array.
    // push(): Add items to the end of an array.
    // shift(): Remove an item from the beginning of an array.
    // unshift(): Add items to the beginning of an array.

    if (role === 'ADMIN_ROLE') {
        menu.push({
            titulo: 'Principal', // menu[0]
            icono: 'mdi mdi-gauge',
            submenu: [
                { titulo: 'Dashboard', url: '/dashboard' },
                { titulo: 'ProgressBar', url: '/progress' },
                { titulo: 'Gráficas', url: '/graficas1' },
                { titulo: 'Promesas', url: '/promesas' },
                { titulo: 'RxJs', url: '/rxjs' }
            ]
        });
        menu.push({
            titulo: 'Mantenimientos', // menu[1]
            icono: 'mdi mdi-folder-lock-open',
            submenu: [

            ]
        });
        menu[1].submenu.push({ titulo: 'Roles', url: '/roles' });
        menu[1].submenu.push({ titulo: 'Usuarios', url: '/usuarios' });
        menu[1].submenu.push({ titulo: 'Hospitales', url: '/hospitales' });
        menu[1].submenu.push({ titulo: 'Médicos', url: '/medicos' });
    }

    if (role === 'Dharma_Consultoria') {
        menu.push({
            titulo: 'Consultoría', // menu[1]
            icono: 'mdi mdi-folder-lock-open',
            submenu: [

            ]
        });
        menu[0].submenu.push({ titulo: 'Usuarios', url: '/usuarios' });
    }


    return menu;
}

function generarPassword() {
    var length = 8,
        charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}

module.exports = app;