"use client";
import { useState, useEffect, useCallback } from "react";
import { useChat } from "../../context/ChatContext";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";

export function AdminChat() {
  const {
    activeChats,
    selectChat,
    selectedUserId,
    connected,
    userId,
    isAdmin,
    socket, // Assuming you have a socket in your ChatContext
  } = useChat();

  const [searchTerm, setSearchTerm] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]); 

  // Fetch messages for a selected chat
  const fetchChatMessages = useCallback(async (chatUserId) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/chat-messages?userId=${chatUserId}`
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Error al obtener mensajes: ${response.status} - ${errorText}`
        );
      }
      const chatMessages = await response.json();
      setMessages(Array.isArray(chatMessages) ? chatMessages : []);
    } catch (error) {
      console.error("Error al cargar mensajes:", error);
      setMessages([]); 
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle chat selection
  const handleChatSelect = async (chatUserId) => {
    selectChat(chatUserId);
    await fetchChatMessages(chatUserId);
  };

  // Real-time message handling
  useEffect(() => {
    if (socket && selectedUserId) {
      // Listen for new messages
      const handleNewMessage = (message) => {
        // Only add message if it's related to the current selected chat
        if (
          message.usuarioId === selectedUserId || 
          message.toUserId === selectedUserId
        ) {
          setMessages((prevMessages) => {
            // Prevent duplicate messages
            const isDuplicate = prevMessages.some(
              (m) => m.id === message.id
            );
            return isDuplicate 
              ? prevMessages 
              : [...prevMessages, message];
          });
        }
      };

      socket.on('new-message', handleNewMessage);

      // Cleanup socket listener
      return () => {
        socket.off('new-message', handleNewMessage);
      };
    }
  }, [socket, selectedUserId]);

  // Update unread counts
  useEffect(() => {
    const counts = messages.reduce((acc, message) => {
      if (!message.leido && message.usuarioId !== userId) {
        acc[message.usuarioId] = (acc[message.usuarioId] || 0) + 1;
      }
      return acc;
    }, {});
    setUnreadCounts(counts);
  }, [messages, userId]);

  // Filter chats and messages
  const filteredChats = activeChats?.filter((chat) =>
    chat.userId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMessages = Array.isArray(messages)
    ? messages.filter(
        (msg) =>
          msg.usuarioId === selectedUserId || msg.toUserId === selectedUserId
      )
    : [];

  return (
    <div className="flex h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Chat List */}
      <div className="w-1/3 border-r bg-gray-50">
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Buscar chat..."
            className="w-full p-2 rounded-lg border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="overflow-y-auto h-[calc(100%-4rem)]">
          {filteredChats?.map((chat) => (
            <div
              key={chat.userId}
              onClick={() => handleChatSelect(chat.userId)}
              className={`p-4 font-medium text-black cursor-pointer hover:bg-gray-100 relative ${
                selectedUserId === chat.userId ? "bg-blue-50" : ""
              }`}
            >
              <div className="font-bold">{chat.userId}</div>
              <div className="text-blue-500 text-sm">{chat.lastMessage}</div>
              {unreadCounts[chat.userId] > 0 && (
                <span className="absolute top-2 right-2 bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                  {unreadCounts[chat.userId]}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 flex flex-col">
        {selectedUserId ? (
          <>
            <div className="p-4 border-b bg-white">
              <div className="text-blue-500 font-bold">Chat con {selectedUserId}</div>
              <div className="text-sm text-black">
                {connected ? "En línea" : "Desconectado"}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <MessageList messages={filteredMessages} />
            </div>
            <MessageInput />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Selecciona un chat para comenzar
          </div>
        )}
      </div>
    </div>
  );
}