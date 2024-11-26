const { models } = require('../libs/sequelize');

class ChatMessagesService {
    constructor() { }

    async find() {
        const messages = await models.ChatMessage.findAll({
            order: [['fechaEnvio', 'ASC']]
        });
        return messages;
    }

    async findByUser(userId) {
        const messages = await models.ChatMessage.findAll({
            where: { usuarioId: userId },
            order: [['fechaEnvio', 'ASC']]
        });
        return messages;
    }

    async create(data) {
        const newMessage = await models.ChatMessage.create(data);
        return newMessage;
    }

    async markAsRead(id) {
        const message = await models.ChatMessage.findByPk(id);
        if (!message) {
            throw new Error('Mensaje no encontrado');
        }
        return await message.update({ leido: true });
    }
}

module.exports = ChatMessagesService;