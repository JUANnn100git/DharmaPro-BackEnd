// Requires
var express = require('express');
const path = require('path');
const fs = require('fs');

// Inicializar variables
var app = express();

// Rutas
app.get('/:tipo/:img', (req, res, next) => {

    var tipo = req.params.tipo;
    var img = req.params.img;

    // Tipos de colección
    var tiposValidos = ['hospitales', 'medicos', 'usuarios'];

    if ( tiposValidos.indexOf(tipo) < 0 ){
        return res.status(400).json({
            ok: false,
            mensaje: 'Tipo de colección no es válida',
            errors: {message: 'Tipo de colección no es válida'}
        });
    }

    var pathImagen = path.resolve(__dirname, `../uploads/${ tipo }/${ img }`);

    if (fs.existsSync(pathImagen)){

        res.sendFile(pathImagen);

    } else {

        var pathNoImagen  = path.resolve(__dirname, '../assets/no-img.jpg');
        res.sendFile(pathNoImagen);

    }

});

module.exports = app;
