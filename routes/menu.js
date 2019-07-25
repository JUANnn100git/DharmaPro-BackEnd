// Requires
var express = require('express');

var mdAutenticacion = require('../middlewares/autenticacion');

// Inicializar variables
var app = express();

// Importar modelo de Rol
var Menu = require('../models/menu');

// *****************************************
// ************** CRUD Menu ****************
// *****************************************

// =========================================
// GET: Obtener todos los menus
// =========================================
app.get('/', (req, res) => {

    Menu.find({})
        .exec((err, menus) => {

            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error cargando menus',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                menus: menus
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
// POST: Crear Menu
// =========================================
app.post('/', (req, res) => {

    var body = req.body;

    var menu = new Menu({
        titulo: body.titulo,
        icono: body.icono,
        submenu: body.submenu
    });

    if (menu.titulo === '' || !menu.titulo) {
        return res.status(400).json({
            ok: false,
            mensaje: 'El titulo del menu no puede estar vacío',
            errors: { message: 'El titulo del menu no puede estar vacío' }
        });
    }

    menu.save((err, menuGuardado) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al crear menu',
                errors: err
            });
        }

        res.status(201).json({
            ok: true,
            menu: menuGuardado
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