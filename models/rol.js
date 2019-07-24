var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

var Schema = mongoose.Schema;

var rolSchema = new Schema({
    nombre: { type: String, unique: true, require: [true, 'El nombre es requerido'] },
    permisos: [{ type: String }],
    guards: [{ type: String }],
    esSistema: { type: Boolean, default: false }
}, { collection: 'roles' });

rolSchema.plugin(uniqueValidator, { message: 'El campo ({PATH}) debe ser único' });

module.exports = mongoose.model('Rol', rolSchema);