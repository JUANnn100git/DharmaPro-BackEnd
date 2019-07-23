// Requires
var express = require('express');
var bcrypt = require('bcryptjs');
var crypto = require('crypto');

var mdAutenticacion = require('../middlewares/autenticacion');

var SERVER_URL = require('../config/config').SERVER_URL;

var sendMail = require('../helpers/mail');

// Inicializar variables
var app = express();

// Importar modelos
var Usuario = require('../models/usuario');
var Token = require('../models/token');

// *****************************************
// ************ CRUD Usuario ***************
// *****************************************

// =========================================
// GET: Obtener todos los usuarios
// =========================================
app.get('/', mdAutenticacion.verificaToken, (req, res) => {

    var desde = req.query.desde || 0;
    desde = Number(desde);

    Usuario.find({}, 'nombres email img role estado contadorLogin estaVerificado')
        .skip(desde)
        .limit(5)
        .exec(
            (err, usuarios) => {

                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error cargando usuarios',
                        errors: err
                    });
                }

                Usuario.countDocuments({}, (err, conteo) => {

                    res.status(200).json({
                        ok: true,
                        usuarios: usuarios,
                        total: conteo
                    });

                });

            });

});


// ==========================================
// GET: Obtener Usuario por ID
// ==========================================
app.get('/:id', mdAutenticacion.verificaToken, (req, res) => {

    var id = req.params.id;

    Usuario.findById(id)
        .exec((err, usuario) => {

            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar usuario',
                    errors: err
                });
            }

            if (!usuario) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'El usuario con el id ' + id + 'no existe',
                    errors: { message: 'No existe un usuario con ese ID' }
                });
            }

            usuario.password = ':)';

            res.status(200).json({
                ok: true,
                usuario: usuario
            });

        })

})

// =========================================
// PUT: Actualizar usuario
// =========================================
app.put('/:id', [mdAutenticacion.verificaToken, mdAutenticacion.verificaAdminRole_o_MismoUsuario], (req, res) => {

    var id = req.params.id;
    var body = req.body;

    Usuario.findById(id, (err, usuario) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar usuario',
                errors: err
            });
        }

        if (!usuario) {
            return res.status(404).json({
                ok: false,
                mensaje: 'El usuario con el id' + id + 'no existe',
                errors: { message: 'No existe un usuario con ese Id' }
            });
        }

        usuario.nombres = body.nombres;
        usuario.email = body.email;
        usuario.role = body.role;

        usuario.save((err, usuarioGuardado) => {

            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar usuario',
                    errors: err
                });
            }

            usuarioGuardado.password = ":)";

            res.status(200).json({
                ok: true,
                usuarioGuardado: usuarioGuardado
            });

        });

    });

});

// =========================================
// PUT: Actualizar password de usuario
// =========================================
app.put('/security/:id', [mdAutenticacion.verificaToken, mdAutenticacion.verificaAdminRole_o_MismoUsuario], (req, res) => {

    var id = req.params.id;
    var body = req.body;

    Usuario.findById(id, (err, usuario) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar usuario',
                errors: err
            });
        }

        if (!usuario) {
            return res.status(404).json({
                ok: false,
                mensaje: 'El usuario con el id' + id + 'no existe',
                errors: { message: 'No existe un usuario con ese Id' }
            });
        }

        usuario.password = bcrypt.hashSync(body.password, 10);

        usuario.save((err, usuarioGuardado) => {

            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar usuario',
                    errors: err
                });
            }

            usuarioGuardado.password = ":)";

            res.status(200).json({
                ok: true,
                usuarioGuardado: usuarioGuardado
            });

        });

    });

});


// =========================================
// POST: Crear un nuevo usuario
// =========================================
app.post('/', mdAutenticacion.verificaToken, (req, res) => {

    // Obtiene los datos enviados por el POST request
    var body = req.body;

    // Query Document -> Encuentra un Usuario con los parámetros establecidos y devuelvelo como "usuarioDB"
    Usuario.findOne({ email: body.email }, (err, usuarioDB) => {

        // Si existe un error en la respuesta del Query
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar usuario',
                errors: err
            });
        }

        // Si existe el usuario buscado
        if (usuarioDB) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El correo "' + usuarioDB.email + '" ya se encuentra asociado a otra cuenta',
                errors: err
            });
        }

        // Crear un Usuario
        var usuario = new Usuario({
            nombres: body.nombres,
            email: body.email,
            password: bcrypt.hashSync(body.password, 10),
            role: body.role
        });

        // Query Document -> Crear un Usuario y devuelvelo como "usuarioGuardado"
        usuario.save((err, usuarioGuardado) => {

            // Si existe un error la respuesta del Query
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar usuario',
                    errors: err
                });
            }

            // Crear Token de "emailVerification" utilizando los datos de "usuario"
            var token = new Token({ _usuarioId: usuario._id, token: crypto.randomBytes(16).toString('hex'), tipo: 'emailVerification', codigo: Math.floor(100000 + Math.random() * 900000) });

            // Query Document -> Crea un Token con los datos de "token"
            token.save((err) => {

                // Si existe un error en la respuesta del Query
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error al crear token',
                        errors: err
                    });
                }

                // Declarar variables para el envío de correo
                var email = usuarioGuardado.email;
                var template = token.tipo;
                var url = SERVER_URL + '/#/login-token/emailVerification/' + token.token;
                var context = {
                    nombres: usuarioGuardado.nombres,
                    email: email,
                    codigo: token.codigo,
                    url: url
                };

                // Enviar correo de activación de cuenta con el token
                sendMail(email, 'Solicitud de Activación de Cuenta', template, context)
                    .then(data => {
                        console.log('Envio de correo correcto');
                        return res.status(200).json({
                            ok: true,
                            mensaje: data
                        });
                        //  res.status(201).json({
                        //      ok: true,
                        //      usuario: usuarioGuardado,
                        //      usuarioToken: req.usuario
                        //  });
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
// DELETE: Borrar un usuario por el id
// =========================================
app.delete('/:id', [mdAutenticacion.verificaToken, mdAutenticacion.verificaAdminRole], (req, res) => {

    var id = req.params.id;

    Usuario.findByIdAndRemove(id, (err, usuarioBorrado) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al borrar usuario',
                errors: err
            });
        }

        if (!usuarioBorrado) {
            return res.status(404).json({
                ok: false,
                mensaje: 'El usuario con el id' + id + ' no existe',
                errors: { message: 'No existe un usuario con ese Id' }
            });
        }

        res.status(200).json({
            ok: true,
            usuario: usuarioBorrado
        });

    });

});

// =========================================
// Nuevo Verificar Cuenta
// =========================================
app.post('/nuevo-verificar-cuenta', (req, res) => {

    // Obtiene los datos enviados por el POST request
    var body = req.body;

    // Query Document -> Encuentra un Token con los parámetros establecidos y devuelvelo como "tokenDB"
    Token.findOne({ token: body.token, tipo: body.tipo }, function(err, tokenDB) {

        // Si existe un error en la respuesta del Query
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar token',
                errors: err
            });
        }

        // Si existe el token buscado
        if (tokenDB) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El token ya existe para el usuario ' + body.email,
                errors: err
            });
        }

        // Si no existe el token buscado

        // Query Document -> Encuentra un Usuario con las condiciones descritas y devuelvelo como "usuarioDB"
        Usuario.findOne({ email: body.email, estaVerificado: false }, (err, usuarioDB) => {

            // Si existe un error en la respuesta del Query
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar token',
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

            // Crear Token de "emailVerification" utilizando los datos de "usuario"
            var token = new Token({ _usuarioId: usuarioDB._id, token: crypto.randomBytes(16).toString('hex'), tipo: 'emailVerification', codigo: Math.floor(100000 + Math.random() * 900000) });

            // Query Document -> Crea un Token con los datos de "token"
            token.save((err) => {

                // Si existe un error en la respuesta del Query
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error al crear token',
                        errors: err
                    });
                }

                // Declarar variables para el envío de correo
                var email = usuarioDB.email;
                var template = token.tipo;
                var url = SERVER_URL + '/#/login-token/emailVerification/' + token.token;
                var context = {
                    nombres: usuarioDB.nombres,
                    email: email,
                    codigo: token.codigo,
                    url: url
                };

                // Enviar correo de activación de cuenta con el token
                sendMail(email, 'Solicitud de Activación de Cuenta', template, context)
                    .then(data => {
                        console.log('Envio de correo correcto');
                        return res.status(200).json({
                            ok: true,
                            mensaje: data
                        });
                        //  res.status(201).json({
                        //      ok: true,
                        //      usuario: usuarioGuardado,
                        //      usuarioToken: req.usuario
                        //  });
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
// Confirmar Verificar Cuenta
// =========================================
app.post('/confirmar-verificar-cuenta', (req, res) => {

    // Obtiene los datos enviados por el POST request
    var body = req.body;

    // Query Document -> Encuentra un Token con los parámetros establecidos y devuelvelo como "tokenDB"
    Token.findOne({ token: body.token, tipo: body.tipo, codigo: body.codigo }, function(err, tokenDB) {

        // Si existe un error en la respuesta del Query
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

            // Verificar al usuarioDB
            usuarioDB.estaVerificado = true;

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
                var template = 'emailVerificationConfirmation';
                var context = {
                    nombres: usuarioDB.nombres
                };

                // Enviar correo de confirmación de activación de cuenta
                sendMail(email, 'Confirmación de Activación de Cuenta', template, context)
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

module.exports = app;