// Importar modelos
var Usuario = require('../models/usuario');

function createAdmin() {

    var usuario = new Usuario({
        nombres: 'DharmaPro Admin System',
        email: 'dharmapro@dharma-consulting.com',
        password: '$2a$10$imjOI/V5zYEXB.FR1Mm.uOPOdU9X8eCtwfvAcnJGW/ttPTwq4ZUuy',
        role: 'ADMIN_ROLE',
        estado: 'Activo',
        img: '5d374a0c3d04e60e90812d2b-931.png',
        contadorLogin: 0,
        esAdmin: true,
        estaVerificado: true
    });

    // Query Document -> Encuentra un Usuario con el email = usuario.email y lo devuelve como "usuarioDB"
    Usuario.findOne({ email: usuario.email }, (err, usuarioDB) => {

        // Si existe un error la respueta del Query
        if (err) {
            return console.log('Error al buscar Admin: ', err);
        }

        // Si no existe el usuario buscado
        if (usuarioDB) {

            return console.log('El Admin ya existe!!');

        }

        usuario.save((err, usuarioGuardado) => {

            if (err) {
                return console.log('Error al crear Admin: ', err);
            }

            console.log('Admin Creado!!');

        });

    });

}

module.exports = createAdmin;