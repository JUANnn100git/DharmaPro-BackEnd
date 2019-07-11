// Requires
var express = require('express');
var fileUpload = require('express-fileupload');
var fs = require('fs');

// Inicializar variables
var app = express();

// Importar Modelos
var Usuario = require('../models/usuario');
var Medico = require('../models/medico');
var Hospital = require('../models/hospital');

// Middleware fileUpload (default options)
app.use(fileUpload());

// Rutas
app.put('/:tipo/:id', (req, res, next) => {

    var tipo = req.params.tipo;
    var id = req.params.id;

    // Tipos de colección
    var tiposValidos = ['hospitales', 'medicos', 'usuarios'];

    if ( tiposValidos.indexOf(tipo) < 0 ){
        return res.status(400).json({
            ok: false,
            mensaje: 'Tipo de colección no es válida',
            errors: {message: 'Tipo de colección no es válida'}
        });
    }

    if (!req.files){
        return res.status(400).json({
            ok: false,
            mensaje: 'No selecciono nada',
            errors: {message: 'Debe de seleccionar una imagen'}
        });
    }

    // Obtener nombre y extensión del archivo
    var archivo = req.files.imagen;
    var nombreCortado = archivo.name.split('.');
    var extensionArchivo = nombreCortado[ nombreCortado.length - 1 ];

    // Sólo estas extensiones aceptamos
    var extensionesValidas = ['png', 'jpg', 'gif', 'jpeg'];

    if ( extensionesValidas.indexOf(extensionArchivo) < 0 ){
        return res.status(400).json({
            ok: false,
            mensaje: 'Extensión no válida',
            errors: {message: 'Las extensiones válidas son: ' + extensionesValidas.join(', ')}
        });
    }

    // Nombre de archivo personalizado
    // 546879876548987-6546.png
    var nombreArchivo = `${ id }-${ new Date().getMilliseconds() }.${ extensionArchivo }`;

    // Mover el arvhivo del temporal a un path
    var path = `./uploads/${ tipo }/${ nombreArchivo }`;

    archivo.mv( path, err => {

        if (err){
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al mover archivo',
                errors: err
            });
        }

        subirPorTipo( tipo, id, nombreArchivo, res );

        // res.status(200).json({
        //     ok: true,
        //     mensaje: 'Archivo movido',
        //     extensionArchivo: extensionArchivo
        // });

    });

});


function subirPorTipo( tipo, id, nombreArchivo, res ){

    if( tipo === 'usuarios' ){

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

            var pathViejo = './uploads/usuarios/' + usuario.img

            // Si existe, elimina la imagen anterior
            if (fs.existsSync(pathViejo)){
                fs.unlinkSync(pathViejo, err => {
                    return res.status(400).json({
                        ok: false,
                        mensaje: 'No se pudo reemplazar la imagen!',
                        errors: err
                    });
                });
            }

            usuario.img = nombreArchivo;

            usuario.save( (err, usuarioActualizado) => {

                if (err){
                    return res.status(400).json({
                        ok: false,
                        mensaje: 'Error al actualizar usuario',
                        errors: err
                    });
                }
    
                usuarioActualizado.password = ":)";
    
                return res.status(200).json({
                    ok: true,
                    mensaje: 'Imagen de usuario actualizada',
                    usuarioActualizado: usuarioActualizado
                });

            });

        });

    }    

    if( tipo === 'medicos' ){

        Medico.findById(id, (err, medico) => {

            if (err){
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar medico',
                    errors: err
                });
            }
    
            if (!medico) {
                return res.status(404).json({
                    ok: false,
                    mensaje: 'El medico con el id' + id + 'no existe',
                    errors: { message: 'No existe un medico con ese Id' }
                });     
            }

            var pathViejo = './uploads/medicos/' + medico.img

            // Si existe, elimina la imagen anterior
            if (fs.existsSync(pathViejo)){
                fs.unlinkSync(pathViejo, err => {
                    return res.status(400).json({
                        ok: false,
                        mensaje: 'No se pudo reemplazar la imagen!',
                        errors: err
                    });
                });
            }

            medico.img = nombreArchivo;

            medico.save( (err, medicoActualizado) => {

                if (err){
                    return res.status(400).json({
                        ok: false,
                        mensaje: 'Error al actualizar medico',
                        errors: err
                    });
                }
    
                return res.status(200).json({
                    ok: true,
                    mensaje: 'Imagen de medico actualizada',
                    medicoActualizado: medicoActualizado
                });

            });

        });

    }    

    if( tipo === 'hospitales' ){

        Hospital.findById(id, (err, hospital) => {

            if (err){
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

            var pathViejo = './uploads/hospitales/' + hospital.img

            // Si existe, elimina la imagen anterior
            if (fs.existsSync(pathViejo)){
                fs.unlinkSync(pathViejo, err => {
                    return res.status(400).json({
                        ok: false,
                        mensaje: 'No se pudo reemplazar la imagen!',
                        errors: err
                    });
                });
            }

            hospital.img = nombreArchivo;

            hospital.save( (err, hospitalActualizado) => {

                if (err){
                    return res.status(400).json({
                        ok: false,
                        mensaje: 'Error al actualizar hospital',
                        errors: err
                    });
                }
    
                return res.status(200).json({
                    ok: true,
                    mensaje: 'Imagen de hospital actualizada',
                    hospitalActualizado: hospitalActualizado
                });

            });

        });

    }    

}

module.exports = app;
