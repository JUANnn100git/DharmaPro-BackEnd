// Requires
var express = require('express');

var mdAutenticacion = require('../middlewares/autenticacion');

// Inicializar variables
var app = express();

// Importar modelo de Medico
var Medico = require('../models/medico');

// *****************************************
// ************* CRUD Medico ***************
// *****************************************

// =========================================
// GET: Obtener todos los medicos
// =========================================
app.get('/', mdAutenticacion.verificaToken, (req, res) => {

    var desde = req.query.desde || 0;
    desde = Number(desde);

    Medico.find({})
        .skip(desde)
        .limit(5)
        .populate('usuario', 'nombres email')
        .populate('hospital')
        .exec(
            (err, medicos) => {

            if (err){
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error cargando medicos',
                    errors: err
                });
            }

            Medico.countDocuments({}, (err, conteo) => {
                
                res.status(200).json({
                    ok: true,
                    medicos: medicos,
                    total: conteo
                });

            })

        });

});

// ==========================================
// GET: Obtener Medico por ID
// ==========================================
app.get('/:id', mdAutenticacion.verificaToken, (req, res) => {

    var id = req.params.id;

    Medico.findById(id)
        .populate('usuario', 'nombres img email')
        .populate('hospital')
        .exec((err, medico) => {

            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar medico',
                    errors: err
                });
            }

            if (!medico) {
                return res.status(400).json({
                    ok: false, 
                    mensaje: 'El medico con el id ' + id + 'no existe',
                    errors: { message: 'No existe un medico con ese ID' }
                });
            }

            res.status(200).json({
                ok: true,
                medico: medico
            });

        })
 
}) 

// =========================================
// PUT: Actualizar medico
// =========================================
app.put('/:id', mdAutenticacion.verificaToken, (req, res) => {

    var id = req.params.id;
    var body = req.body;

    Medico.findById(id, (err, medico) => {

        if (err){
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar medico',
                errors: err
            });
        }

        if (!medico){
            return res.status(404).json({
                ok: false,
                mensaje: 'El medico con el id' + id + 'no existe',
                errors: { message: 'No existe un hospital con ese Id' }
            });
        }

        medico.nombre = body.nombre;
        medico.usuario = req.usuario._id;
        medico.hospital = body.hospital;

        medico.save( (err, medicoGuardado) => {

            if (err){
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar medico',
                    errors: err
                });
            }
    
            res.status(201).json({
                ok: true,
                medico: medicoGuardado
            });
    
        });

    });

});

// =========================================
// POST: Crear medico
// =========================================
app.post('/', mdAutenticacion.verificaToken, (req, res) => {

    var body = req.body;

    var medico = new Medico({
        nombre: body.nombre,
        usuario: req.usuario._id,
        hospital: body.hospital
    });

    medico.save( (err, medicoGuardado) => {

        if (err){
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al crear medico',
                errors: err
            });
        }

        res.status(201).json({
            ok: true,
            medico: medicoGuardado,
            usuarioToken:  req.usuario
        });

    });

});

// =========================================
// DELETE: Borrar medico
// =========================================
app.delete('/:id', mdAutenticacion.verificaToken, (req, res) => {

    var id = req.params.id;

    Medico.findByIdAndRemove(id, (err, medicoBorrado) => {

        if (err){
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar medico',
                errors: err
            });
        }

        if (!medicoBorrado){
            return res.status(404).json({
                ok: false,
                mensaje: 'El medico con el id' + id + 'no existe',
                errors: { message: 'No existe un hospital con ese Id' }
            });
        }

        res.status(200).json({
            ok: true,
            medico: medicoBorrado
        });
    });

});

module.exports = app;