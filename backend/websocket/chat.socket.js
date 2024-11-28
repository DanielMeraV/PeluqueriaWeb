const ChatMessagesService = require('../services/chatMessages.service.js');
const service = new ChatMessagesService();

module.exports = (io) => {
    const connectedUsers = new Map();
    const adminSockets = new Set();

    io.on('connection', async (socket) => {
        const userId = socket.handshake.query.userId;
        const isAdmin = socket.handshake.query.isAdmin === 'true';

        if (!userId) {
            socket.emit('error', 'userId no válido.');
            return;
        }

        connectedUsers.set(userId, socket.id);
        if (isAdmin) {
            adminSockets.add(socket.id);
            try {
                const chats = await service.findAllChats();
                socket.emit('activeChats', chats);
            } catch (error) {
                console.error('Error al cargar chats:', error);
                socket.emit('error', 'Error al cargar chats activos');
            }
        }

        try {
            const messages = await service.findByUser(userId);
            socket.emit('previousMessages', messages);
        } catch (error) {
            console.error('Error al cargar mensajes:', error);
        }

        // En chat.socket.js (backend)
        socket.on('sendMessage', async (messageData) => {
            try {
                console.log('Validando datos:', messageData);

                // Verificar que el usuario existe antes de crear el mensaje
                const userExists = await service.verifyUserExists(messageData.userId);
                if (!userExists) {
                    throw new Error('Usuario remitente no existe');
                }

                if (messageData.toUserId) {
                    const recipientExists = await service.verifyUserExists(messageData.toUserId);
                    if (!recipientExists) {
                        throw new Error('Usuario destinatario no existe');
                    }
                }

                const newMessage = await service.create({
                    usuarioId: messageData.userId,
                    mensaje: messageData.content,
                    toUserId: messageData.toUserId,
                    fechaEnvio: new Date()
                });

                // resto del código...
            } catch (error) {
                console.error('Error detallado:', error);
                socket.emit('error', { message: error.message });
            }
        });

        socket.on('disconnect', () => {
            connectedUsers.delete(userId);
            if (isAdmin) {
                adminSockets.delete(socket.id);
            }
        });
    });
};