var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

var Schema = mongoose.Schema;

var menuSchema = new Schema({
    titulo: { type: String, unique: true, require: true },
    icono: { type: String },
    submenu: [{
        titulo: { type: String, require: true },
        url: { type: String, require: true }
    }]
});

menuSchema.plugin(uniqueValidator, { message: 'El campo ({PATH}) debe ser único' });

module.exports = mongoose.model('Menu', menuSchema);