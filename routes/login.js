// Requires
var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

var SEED = require('../config/config').SEED;

var sendMail =  require('../helpers/mail');

// Inicializar variables
var app = express();

// Importar modelo de Usuario
var Usuario =  require('../models/usuario');

var mdAutenticacion = require('../middlewares/autenticacion');

// =========================================
// Recuperar password
// =========================================
app.post('/recupera-password', (req, res) => {

    // Obtiene los datos enviados por el POST request
    var body = req.body;

    // Query Document -> Encuentra un Usuario con el email = body.email y lo devuelve como "usuarioDB"
    Usuario.findOne({ email: body.email }, (err, usuarioDB) => {

        // Si existe un error la respueta del Query
        if (err){
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
        if ( usuarioDB.estado === 'Inactivo' ){
            return res.status(400).json({
                ok: false,
                mensaje: 'Este Usuario se encuentra <b>Inactivo</b> no se puede recuperar la contraseña',
                errors: err
            });
        }


        // Crear Token de "passwordRestore" utilizando los datos de "usuarioDB"

        // Query Document -> Crea un Token con los datos de "token"

        // Si existe un error la respueta del Query

        // Enviar correo de recuperación con el token


        // ##################################################################################################


        // Generar una nueva contraseña
        var passwordActualizada = generarPassword();

        // Asignar la contraseña encriptada (Autogeneración del salt[10] y del hash) al usuarioDB
        usuarioDB.password = bcrypt.hashSync(passwordActualizada, 10);

        // Query Document -> Crea un Usuario con los datos de "usuarioDB"
        usuarioDB.save( (err, usuarioGuardado) => {

            // Si existe un error
            if (err){
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar usuario',
                    errors: err
                });
            }

            // Declarar variables para el envío de correo
            var email = 'jvillanueva@dharma-consulting.com';
            var context = {
                nombres: usuarioDB.nombres,
                passwordActualizada: passwordActualizada
            }

            // Enviar correo de recuperación con la contraseña actualizada
            sendMail(email, 'Recuperación de Contraseña', 'passwordRestore', context)
                .then( data => {
                        console.log('Envio de correo correcto');
                        return  res.status(200).json({
                                    ok: true,
                                    mensaje: data
                                });
                    }
                )
                .catch( error => {
                    console.error('Error en la promesa', error);
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error al ejecutar envio de correo',
                        errors: err
                    });
                } );

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
    Usuario.findOne({ email: body.email }, (err, usuarioDB) => {

        if (err){
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

        if ( usuarioDB.estado === 'Inactivo' ){
            return res.status(400).json({
                ok: false,
                mensaje: 'Este Usuario se encuentra <b>Inactivo</b>',
                errors: err
            });
        }

        if ( usuarioDB.estado === 'Bloqueado' ){
            return res.status(400).json({
                ok: false,
                mensaje: 'Usuario Bloqueado.<br> Póngase en contacto con el administrador del Sistema',
                errors: err
            });
        }

        if ( !bcrypt.compareSync(body.password, usuarioDB.password) ){

            usuarioDB.contador_login++;
            
            if (usuarioDB.contador_login == 6) {
                usuarioDB.estado = 'Bloqueado';
            }

            usuarioDB.save( (err, usuarioGuardado) => {

                if (err){
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



function obtenerMenu( role ) {

    menu = [];
    
    // pop(): Remove an item from the end of an array.
    // push(): Add items to the end of an array.
    // shift(): Remove an item from the beginning of an array.
    // unshift(): Add items to the beginning of an array.

    if ( role === 'ADMIN_ROLE' ) {
        menu.push(
            {
                titulo: 'Principal', // menu[0]
                icono: 'mdi mdi-gauge',
                submenu: [
                    { titulo: 'Dashboard', url: '/dashboard' },
                    { titulo: 'ProgressBar', url: '/progress' },
                    { titulo: 'Gráficas', url: '/graficas1' },
                    { titulo: 'Promesas', url: '/promesas' },
                    { titulo: 'RxJs', url: '/rxjs' }
                ]
            }
        );
        menu.push(
            {
                titulo: 'Mantenimientos', // menu[1]
                icono: 'mdi mdi-folder-lock-open',
                submenu: [
                    
                ]
            }
        );
        menu[1].submenu.push( { titulo: 'Usuarios', url: '/usuarios' } );
        menu[1].submenu.push( { titulo: 'Hospitales', url: '/hospitales' } );
        menu[1].submenu.push( { titulo: 'Médicos', url: '/medicos' } );
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
