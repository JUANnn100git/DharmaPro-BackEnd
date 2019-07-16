// Requires
var express = require('express');
var bcrypt = require('bcryptjs');

var mdAutenticacion = require('../middlewares/autenticacion');

// Inicializar variables
var app = express();

// Importar modelo de Usuario
var Usuario =  require('../models/usuario');

// *****************************************
// ************ CRUD Usuario ***************
// *****************************************

// =========================================
// GET: Obtener todos los usuarios
// =========================================
app.get('/', mdAutenticacion.verificaToken, (req, res) => {

    var desde = req.query.desde || 0;
    desde = Number(desde);

    Usuario.find({ }, 'nombres email img role estado contador_login')
        .skip(desde)
        .limit(5)
        .exec(
            (err, usuarios) => {

            if (err){
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

        if (err){
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

        usuario.save( (err, usuarioGuardado) => {

            if (err){
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

        if (err){
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

        usuario.save( (err, usuarioGuardado) => {

            if (err){
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
    
    var body = req.body;

    var usuario = new Usuario({
        nombres: body.nombres,
        email: body.email,
        password: bcrypt.hashSync(body.password, 10),
        role: body.role
    });

    usuario.save( (err, usuarioGuardado) => {

        if (err){
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al crear usuario',
                errors: err
            });
        }

        res.status(201).json({
            ok: true,
            usuario: usuarioGuardado,
            usuarioToken:  req.usuario
        });

    });

});

// =========================================
// DELETE: Borrar un usuario por el id
// =========================================
app.delete('/:id', [mdAutenticacion.verificaToken, mdAutenticacion.verificaAdminRole], (req, res) => {

    var id = req.params.id;

    Usuario.findByIdAndRemove(id, (err, usuarioBorrado) => {

        if (err){
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

module.exports = app;
