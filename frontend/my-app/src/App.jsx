import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Send, MessageCircle, Menu, Plus, Trash2, Bot, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

const API_URL = "https://chatbot-backend-w9cw.onrender.com";

function App() {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchChats = async () => {
    try {
      const response = await axios.get(`${API_URL}/chat/history`);
      setChats(response.data);
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchChats();
  }, []);

  const loadChat = async (chatId) => {
    try {
      const response = await axios.get(`${API_URL}/api/chat/${chatId}`);
      setCurrentChat(response.data);
      setMessages(response.data.messages);
    } catch (error) {
      console.error("Error loading chat:", error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage;
    setInputMessage("");
    setIsLoading(true);

    // Add user message to UI immediately
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
        timestamp: new Date(),
      },
    ]);

    try {
      const response = await axios.post(`${API_URL}/api/chat/message`, {
        message: userMessage,
        chatId: currentChat?._id,
      });

      setMessages(response.data.messages);
      setCurrentChat({ _id: response.data.chatId, messages: response.data.messages });
      fetchChats(); // Refresh chat list
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const newChat = () => {
    setCurrentChat(null);
    setMessages([]);
  };

  const deleteChat = async (chatId, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API_URL}/chat/${chatId}`);
      fetchChats();
      if (currentChat?._id === chatId) {
        newChat();
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-64" : "w-0 overflow-hidden"} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={newChat}
            className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus size={18} />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <div
              key={chat._id}
              onClick={() => loadChat(chat._id)}
              className={`flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                currentChat?._id === chat._id ? "bg-blue-50" : ""
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <MessageCircle size={16} className="text-gray-500 flex-shrink-0" />
                <span className="text-sm truncate">{chat.messages[0]?.content.substring(0, 30) || "New Chat"}</span>
              </div>
              <button onClick={(e) => deleteChat(chat._id, e)} className="text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col max-w-full">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Bot size={24} className="text-blue-500" />
            <h1 className="text-xl font-semibold">AI Chatbot</h1>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className={`${sidebarOpen ? "max-sm:w-screen max-sm:p-1 max-sm:overflow-x-hidden" : ""} max-w-3xl mx-auto space-y-4 p-4`}>
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-20">
                <Bot size={64} className="mx-auto mb-4 text-gray-300" />
                <h2 className="text-2xl font-semibold mb-2">Welcome to AI Chatbot!</h2>
                <p>Ask me anything, and I'll do my best to help you.</p>
              </div>
            )}

            {messages.map((message, index) => (
              <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                {/* {message.role === "assistant" && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                      <Bot size={16} className="text-white" />
                    </div>
                  </div>
                )} */}

                <div
                  className={`max-w-full sm:max-w-[90%] rounded-lg px-4 py-2 ${
                    message.role === "user"
                      ? "bg-gray-200 group rounded-xl max-sm:max-w-[80%] sm:max-w-[50%]"
                      : "bg-white text-gray-800 border border-gray-200 w-full"
                  }`}
                >
                  <p className={`whitespace-pre-wrap w-full overflow-x-scroll ${sidebarOpen ? "max-sm:w-screen" : "max-w-full"}`}>
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </p>
                  <span className="text-xs opacity-70 hidden group-hover:block">{new Date(message.timestamp).toLocaleTimeString()}</span>
                </div>

                {/* {message.role === "user" && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                      <User size={16} className="text-white" />
                    </div>
                  </div>
                )} */}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Bot size={16} className="text-white" />
                  </div>
                </div>
                <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
                  <Loader2 size={20} className="animate-spin text-blue-500" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="1"
                style={{ minHeight: "44px", maxHeight: "120px" }}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
