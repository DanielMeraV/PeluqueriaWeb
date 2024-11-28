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
                console.log('Mensaje recibido:', messageData);
                const newMessage = await service.create({
                    usuarioId: messageData.userId,
                    mensaje: messageData.content,
                    toUserId: messageData.toUserId,
                    fechaEnvio: new Date()
                });

                // Notificar siempre al remitente
                socket.emit('message', newMessage);

                // Notificar al destinatario
                if (isAdmin) {
                    const clientSocket = connectedUsers.get(messageData.toUserId);
                    if (clientSocket) {
                        io.to(clientSocket).emit('message', newMessage);
                    }
                } else {
                    // Notificar a todos los admins
                    Array.from(adminSockets).forEach(adminSocketId => {
                        io.to(adminSocketId).emit('message', newMessage);
                    });
                }

                console.log('Mensaje enviado a todos los destinatarios');
            } catch (error) {
                console.error('Error:', error);
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