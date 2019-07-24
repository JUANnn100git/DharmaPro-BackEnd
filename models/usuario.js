var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

var Schema = mongoose.Schema;

var rolesValidos = {
    values: [
        'ADMIN_ROLE',
        'USER_ROLE',
        'Dharma_Gerencia',
        'Dharma_Sistemas',
        'Dharma_Administracion',
        'Dharma_Operaciones',
        'Dharma_Consultoria',
        'Dharma_Desarrollo',
        'Dharma_Capacitacion'
    ],
    message: '{VALUE} no es un rol permitido'
}

var estadosValidos = {
    values: [
        'Activo',
        'Inactivo',
        'Bloqueado'
    ],
    message: '{VALUE} no es un estado permitido'
};

var usuarioSchema = new Schema({

    nombres: { type: String, required: [true, 'Los nombres son necesarios'] },
    email: { type: String, unique: true, required: [true, 'El correo es necesario'] },
    password: { type: String, required: [true, 'La contraseña es necesaria'] },
    img: { type: String, required: false },
    role: { type: Schema.Types.ObjectId, ref: 'Rol', required: true },
    estado: { type: String, required: false, default: 'Activo', enum: estadosValidos },
    contadorLogin: { type: Number, required: false, default: 0 },
    esAdmin: { type: Boolean, default: false },
    estaVerificado: { type: Boolean, default: false }

});

usuarioSchema.plugin(uniqueValidator, { message: '{PATH} debe ser único' });

module.exports = mongoose.model('Usuario', usuarioSchema);