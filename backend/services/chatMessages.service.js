const { models } = require('../libs/sequelize');
const { Op } = require('sequelize'); // Asegúrate de importar 
const { User } = require('../db/models/users.model'); // Importa el modelo User
const { sequelize } = require('../libs/sequelize.js');


class ChatMessagesService {
    constructor() {
        // Si necesitas acceder a los modelos en el constructor
        this.models = models;
    }

    async find(userId) {
        if (!userId) return [];

        return await models.ChatMessage.findAll({
            where: {
                [Op.or]: [
                    { usuarioId: userId },
                    { toUserId: userId },
                ],
            },
            order: [['fechaEnvio', 'ASC']],
            include: [
                {
                    model: models.User,
                    as: 'remitente',
                    attributes: ['id', 'nombre', 'email'],
                },
                {
                    model: models.User,
                    as: 'destinatario',
                    attributes: ['id', 'nombre', 'email'],
                },
            ],
        });
    }


    async findByUser(userId) {
        if (!userId) return [];

        const messages = await models.ChatMessage.findAll({
            where: {
                [Op.or]: [
                    { usuarioId: userId },
                    { toUserId: userId }
                ]
            },
            order: [["fechaEnvio", "ASC"]],
            include: [
                {
                    model: User,
                    as: "remitente",
                    attributes: ["id", "nombre", "email"]
                },
                {
                    model: User,
                    as: "destinatario",
                    attributes: ["id", "nombre", "email"]
                }
            ]
        });

        return messages;
    }



    async create(data) {
        try {
            return await models.ChatMessage.create(data);
        } catch (error) {
            console.error('Error en create:', error);
            throw error;
        }
    }

    async markAsRead(id) {
        try {
            const message = await models.ChatMessage.findByPk(id);
            if (!message) {
                throw new Error('Mensaje no encontrado');
            }
            return await message.update({ leido: true });
        } catch (error) {
            console.error('Error en markAsRead:', error);
            throw error;
        }
    }

    async findAllChats() {
        const messages = await sequelize.query(`
            SELECT DISTINCT ON (cm."usuarioid") 
                cm."usuarioid",
                cm."mensaje",
                cm."fechaenvio",
                u."nombre"
            FROM "chatmensajes" cm
            LEFT JOIN "usuarios" u ON cm."usuarioid" = u."id"
            WHERE cm."usuarioid" NOT LIKE 'admin_%'
            ORDER BY cm."usuarioid", cm."fechaenvio" DESC
        `, {
            type: sequelize.QueryTypes.SELECT
        });

        return messages.map(msg => ({
            userId: msg.usuarioid,
            nombre: msg.nombre || `Usuario ${msg.usuarioid}`,
            lastMessage: msg.mensaje,
            timestamp: msg.fechaenvio
        }));
    }



}

module.exports = ChatMessagesService;