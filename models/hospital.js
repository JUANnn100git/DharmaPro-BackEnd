var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var hospitalSchema = new Schema({
    nombre: {type: String, require: [true, 'El nombre es necesario']},
    img: {type: String, require: false},
    usuario: {type: Schema.Types.ObjectId, ref: 'Usuario', required: true},
}, {collection: 'hospitales'});

module.exports = mongoose.model('Hospital', hospitalSchema);