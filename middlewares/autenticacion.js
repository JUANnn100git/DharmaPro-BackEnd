var jwt = require('jsonwebtoken');

var SEED = require('../config/config').SEED;

// =========================================
// Verificar Token
// =========================================

exports.verificaToken = function(req, res, next) {

    // console.log('Verifica Token');

    // var token = req.query.token;
    var token = req.headers.authorization;

    token = token.replace('Bearer ', '');

    // console.log('token', token);

    jwt.verify(token, SEED, (err, decoded) => {

        if (err) {
            return res.status(401).json({
                ok: false,
                mensaje: 'Token incorrecto 123',
                errors: err
            });
        }

        req.usuario = decoded.usuario;

        next();

    });

}


// =========================================
// Verificar Admin
// =========================================

exports.verificaAdminRole = function(req, res, next) {

    var usuario = req.usuario;

    if (usuario.role === 'ADMIN_ROLE') {
        next();
        return;
    } else {
        return res.status(401).json({
            ok: false,
            mensaje: 'Token incorrecto - No es administrador',
            errors: { message: 'No es administrador, no puede hacer eso' }
        });;
    }

}


// =========================================
// Verificar Admin o mismo Usuario
// =========================================

exports.verificaAdminRole_o_MismoUsuario = function(req, res, next) {

    var usuario = req.usuario;

    var id = req.params.id;

    if (usuario.role === 'ADMIN_ROLE' || usuario._id === id) {
        next();
        return;
    } else {
        return res.status(401).json({
            ok: false,
            mensaje: 'Token incorrecto - No es administrador ni es el mismo usuario',
            errors: { message: 'No es administrador, no puede hacer eso' }
        });;
    }

}