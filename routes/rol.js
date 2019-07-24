// Requires
var express = require('express');

var mdAutenticacion = require('../middlewares/autenticacion');

// Inicializar variables
var app = express();

// Importar modelo de Rol
var Rol = require('../models/rol');

// *****************************************
// ************ CRUD Rol **************
// *****************************************

// =========================================
// GET: Obtener todos los roles
// =========================================
app.get('/', (req, res) => {

    var desde = req.query.desde || 0;
    desde = Number(desde);

    Rol.find({})
        .skip(desde)
        .limit(5)
        .exec((err, roles) => {

            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error cargando roles',
                    errors: err
                });
            }

            Rol.countDocuments({}, (err, conteo) => {

                res.status(200).json({
                    ok: true,
                    roles: roles,
                    total: conteo
                });

            });

        });

});

// ==========================================
// GET: Obtener Rol por Nombre
// ==========================================
app.get('/buscar/:rol', (req, res) => {

    var rol = req.params.rol;

    Rol.findOne({ nombre: rol }, (err, rolDB) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar rol',
                errors: err
            });
        }

        if (!rol) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El rol ' + rol + 'no existe',
                errors: { message: 'No existe un rol con ese nombre' }
            });
        }

        res.status(200).json({
            ok: true,
            rol: rolDB
        });

    });

});


// ==========================================
// GET: Obtener Rol por ID
// ==========================================
app.get('/:id', (req, res) => {

    var id = req.params.id;

    Hospital.findById(id)
        .populate('usuario', 'nombres img email')
        .exec((err, hospital) => {

            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar hospital',
                    errors: err
                });
            }

            if (!hospital) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'El hospital con el id ' + id + 'no existe',
                    errors: { message: 'No existe un hospital con ese ID' }
                });
            }

            res.status(200).json({
                ok: true,
                hospital: hospital
            });

        })

});

// =========================================
// PUT: Actualizar Rol
// =========================================
app.put('/:id', (req, res) => {

    var id = req.params.id;
    var body = req.body;

    Hospital.findById(id, (err, hospital) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar hospital',
                errors: err
            });
        }

        if (!hospital) {
            return res.status(404).json({
                ok: false,
                mensaje: 'El hospital con el id' + id + 'no existe',
                errors: { message: 'No existe un hospital con ese Id' }
            });
        }

        hospital.nombre = body.nombre;
        hospital.usuario = req.usuario._id;

        hospital.save((err, hospitalGuardado) => {

            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar hospital',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                hospital: hospitalGuardado
            });

        });

    });


});

// =========================================
// POST: Crear Rol
// =========================================
app.post('/', (req, res) => {

    var body = req.body;

    var rol = new Rol({
        nombre: body.nombre,
        esSistema: body.esSistema
    });

    if (rol.nombre === '') {
        return res.status(400).json({
            ok: false,
            mensaje: 'El nombre del rol no puede estar vacío',
            errors: { message: 'El nombre del rol no puede estar vacío' }
        });
    }

    rol.save((err, rolGuardado) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al crear rol',
                errors: err
            });
        }

        res.status(201).json({
            ok: true,
            rol: rolGuardado
        });

    });

});

// =========================================
// DELETE: Borrar Rol
// =========================================
app.delete('/:id', (req, res) => {

    var id = req.params.id;

    Hospital.findByIdAndRemove(id, (err, hospitalBorrado) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar hospital',
                errors: err
            });
        }

        if (!hospitalBorrado) {
            return res.status(404).json({
                ok: false,
                mensaje: 'El hospital con el id' + id + ' no existe',
                errors: { message: 'No existe un hospital con ese Id' }
            });
        }

        res.status(200).json({
            ok: true,
            hospital: hospitalBorrado
        });

    });

});

module.exports = app;