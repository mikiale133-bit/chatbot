import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Send, MessageCircle, Plus, Trash2, Bot, Loader2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";

const API_URL = "https://chatbot-backend-w9cw.onrender.com/api";
// const API_URL = "http://localhost:5000/api";

function App() {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      const response = await axios.get(`${API_URL}/chat/${chatId}`);
      setCurrentChat(response.data);
      setMessages(response.data.messages);
      // Auto-close sidebar on mobile devices once a chat is selected
      if (window.innerWidth < 640) {
        setSidebarOpen(false);
      }
    } catch (error) {
      console.error("Error loading chat:", error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage;
    setInputMessage("");
    setIsLoading(true);

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
        timestamp: new Date(),
      },
    ]);

    try {
      const response = await axios.post(`${API_URL}/chat/message`, {
        message: userMessage,
        chatId: currentChat?._id,
      });

      setMessages(response.data.messages);
      setCurrentChat({ _id: response.data.chatId, messages: response.data.messages });
      fetchChats();
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
    if (window.innerWidth < 640) {
      setSidebarOpen(false);
    }
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
    <div className="flex h-screen bg-white overflow-hidden relative">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/10 z-20 sm:hidden transition-opacity duration-300" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar - Handles responsive absolute mobile positioning and smooth width transitions */}
      <div
        className={`bg-white border-r border-gray-200 flex flex-col h-full transition-all duration-300 ease-in-out shrink-0 whitespace-nowrap
          fixed inset-y-0 left-0 z-30 sm:relative sm:z-auto
          ${sidebarOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full sm:translate-x-0 overflow-hidden border-r-0"}`}
      >
        <div className="p-4 relative border-b border-gray-200  items-center justify-between gap-2">
          <button
            onClick={newChat}
            className="flex-1 flex items-center justify-center gap-0 bg-black text-white px-3 py-1 hover:bg-gray-700 transition-colors"
          >
            <Plus size={18} />
            New Chat
          </button>

          <X className="absolute top-5 right-5 sm:hidden" onClick={() => setSidebarOpen(false)} />
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
                <MessageCircle size={16} className="text-gray-500 shrink-0" />
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
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <div className="flex gap-1 flex-col">
              <span className="w-7 h-0.5 bg-black"></span>
              <span className="w-7 h-0.5 bg-black"></span>
              <span className="w-5 h-0.5 bg-black"></span>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <Bot size={24} className="text-blue-500" />
            <h1 className="text-xl font-semibold">AI Chatbot</h1>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-20">
                <Bot size={64} className="mx-auto mb-4 text-gray-300" />
                <h2 className="text-2xl font-semibold mb-2">Welcome to AI Chatbot!</h2>
                <p>Ask me anything, and I'll do my best to help you.</p>
              </div>
            )}

            {messages.map((message, index) => {
              const isUser = message.role === "user";
              return (
                <div key={index} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`rounded-xl px-4 py-2.5 border transition-all
                      ${isUser ? "group bg-gray-100 border-blue-500 max-w-[85%] sm:max-w-[70%]" : "bg-white text-gray-800 border-gray-300 max-w-full"}`}
                  >
                    {/* Markdown Renderer with proper text wraps */}
                    <div className="prose prose-sm max-w-none wrap-break-word overflow-x-auto leading-relaxed">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                    {/* <span className="text-[10px] block opacity-0 group-hover:opacity-70 text-right mt-1">
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span> */}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="shrink-0">
                  <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                    <Bot size={16} className="text-white" />
                  </div>
                </div>
                <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm flex items-center gap-2">
                  <Loader2 size={18} className="animate-spin text-blue-500" />
                  <span className="text-xs text-gray-500">Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4 shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2 items-end bg-white border border-gray-300 rounded-xl p-1 focus-within:ring-2 focus-within:ring-gray-500/20 focus-within:border-black transition-all">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message here..."
                className="flex-1 resize-none border-0 bg-transparent px-3 py-2.5 focus:outline-none focus:ring-0 text-[15px]"
                rows="1"
                style={{ minHeight: "40px", maxHeight: "140px" }}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="bg-black text-white w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 mb-0.5 mr-0.5"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
