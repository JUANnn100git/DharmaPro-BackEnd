var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var tiposValidos = {
    values: [
        'emailVerification',
        'passwordRestore'
    ],
    message: '{VALUE} no es un tipo permitido'
}

const tokenSchema = new Schema({
    _usuarioId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Usuario' },
    token: { type: String, required: true },
    tipo: { type: String, required: true, enum: tiposValidos },
    fechaCreacion: { type: Date, required: true, default: Date.now, expires: 120 }
});

module.exports = mongoose.model('Token', tokenSchema);