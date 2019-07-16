// Requires
var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

var SEED = require('../config/config').SEED;

// Inicializar variables
var app = express();

// Importar modelo de Usuario
var Usuario =  require('../models/usuario');

var mdAutenticacion = require('../middlewares/autenticacion');

// =========================================
// Recuperar password
// =========================================
app.post('/recupera-password', (req, res) => {

    "use strict";
    const nodemailer = require("nodemailer");

    var mensaje = '';
    
    // async..await is not allowed in global scope, must use a wrapper
    async function main( newpass ){
    
      // Generate test SMTP service account from ethereal.email
      // Only needed if you don't have a real mail account for testing
      let testAccount = await nodemailer.createTestAccount();
    
      // create reusable transporter object using the default SMTP transport
      let transporter = nodemailer.createTransport({
        host: "mail.dharma-consulting.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
          user: 'jvillanueva@dharma-consulting.com', // generated ethereal user
          pass: 'dc*2014' // generated ethereal password
        }
      });

      var currentDate = new Date();
      var date = currentDate.getDate();
      var month = currentDate.getMonth(); 
      var year = currentDate.getFullYear();
      var hours = currentDate.getHours();
      var minutes = currentDate.getMinutes();
      var seconds = currentDate.getSeconds(); 

      var timestamp  = (month+1) + "/" + date + "/" + year + " " + hours + ":" + minutes + ":" + seconds;

      // send mail with defined transport object
      let info = await transporter.sendMail({
        from: '"DharmaPro 👻" <admin@dharma-consulting.com>', // sender address
        to: "jvillanueva@dharma-consulting.com", // list of receivers
        subject: timestamp, // Subject line
        text: "Hello world?", // plain text body
        html: "<b>Contraseña: </b>" + newpass // html body
      });
    
      mensaje = info.messageId;
      // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
    
    }
    



    var body = req.body;

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
                mensaje: 'No existe un usuario con el correo: ' + body.email,
                errors: err
            });
        }

        if ( usuarioDB.estado === 'Inactivo' ){
            return res.status(400).json({
                ok: false,
                mensaje: 'Este Usuario se encuentra <b>Inactivo</b> no se puede recuperar la contraseña',
                errors: err
            });
        }

        var passwordActualizada = generarPassword();

        usuarioDB.password = bcrypt.hashSync(passwordActualizada, 10);

        usuarioDB.save( (err, usuarioGuardado) => {

            if (err){
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar usuario',
                    errors: err
                });
            }


            main(passwordActualizada).then( 
                data => {
                    console.log('Envio de correo correcto');
                    return  res.status(200).json({
                                ok: true,
                                mensaje: mensaje
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
