const ChatMessagesService = require('../services/chatMessages.service.js');
const service = new ChatMessagesService();

module.exports = (io) => {
    const connectedUsers = new Map();
    const adminSockets = new Set();

    // Log de conexiones activas periódicamente
    setInterval(() => {
        console.log('Usuarios conectados:', connectedUsers.size);
        console.log('Admins conectados:', adminSockets.size);
    }, 30000);

    io.on('connection', async (socket) => {
        const userId = socket.handshake.query.userId;
        const isAdmin = socket.handshake.query.isAdmin === 'true';

        console.log(`Nueva conexión - Usuario ID: ${userId}, Admin: ${isAdmin}`);

        if (!userId) {
            console.log('Conexión rechazada: userId no válido');
            socket.emit('error', 'userId no válido.');
            return;
        }

        // Manejar reconexión
        if (connectedUsers.has(userId)) {
            console.log(`Reconexión del usuario ${userId}`);
            const oldSocketId = connectedUsers.get(userId);
            io.sockets.sockets.get(oldSocketId)?.disconnect();
        }

        connectedUsers.set(userId, socket.id);
        if (isAdmin) {
            adminSockets.add(socket.id);
            try {
                const chats = await service.findAllChats();
                socket.emit('activeChats', chats);
                console.log(`Chats enviados al admin ${userId}`);
            } catch (error) {
                console.error('Error al cargar chats:', error);
                socket.emit('error', 'Error al cargar chats activos');
            }
        }

        try {
            const messages = await service.findByUser(userId);
            socket.emit('previousMessages', messages);
            console.log(`Mensajes previos enviados al usuario ${userId}`);
        } catch (error) {
            console.error('Error al cargar mensajes:', error);
        }

        socket.on('sendMessage', async (messageData) => {
            try {
                console.log('Mensaje recibido:', messageData);
                const newMessage = await service.create({
                    usuarioId: messageData.userId,
                    mensaje: messageData.content,
                    toUserId: messageData.toUserId,
                    fechaEnvio: new Date()
                });

                // Notificar al remitente
                socket.emit('message', newMessage);
                console.log(`Mensaje enviado al remitente ${messageData.userId}`);

                // Notificar al destinatario
                if (isAdmin) {
                    const clientSocket = connectedUsers.get(messageData.toUserId);
                    if (clientSocket) {
                        io.to(clientSocket).emit('message', newMessage);
                        console.log(`Mensaje enviado al cliente ${messageData.toUserId}`);
                    }
                } else {
                    // Notificar a todos los admins
                    Array.from(adminSockets).forEach(adminSocketId => {
                        io.to(adminSocketId).emit('message', newMessage);
                    });
                    console.log('Mensaje enviado a todos los admins');
                }
            } catch (error) {
                console.error('Error al enviar mensaje:', error);
                socket.emit('error', { message: error.message });
            }
        });

        socket.on('disconnect', () => {
            console.log(`Desconexión - Usuario ID: ${userId}, Admin: ${isAdmin}`);
            connectedUsers.delete(userId);
            if (isAdmin) {
                adminSockets.delete(socket.id);
            }
        });

        // Manejar errores de socket
        socket.on('error', (error) => {
            console.error(`Error en socket ${socket.id}:`, error);
        });
    });
};