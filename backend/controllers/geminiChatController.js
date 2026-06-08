import Chat from "../models/chatModel.js";
import { GoogleGenAI } from "@google/genai";

// Initialize the Google Gen AI client.
// It automatically picks up process.env.GEMINI_API_KEY by default.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = "gemini-3.5-flash"; // Or use "gemini-2.5-flash" if available

// Send message and get response
export const sendMessage = async (req, res) => {
  try {
    const { message, chatId } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message content is required" });
    }

    let chat;
    if (chatId) {
      chat = await Chat.findById(chatId);
      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }
    } else {
      chat = new Chat({ messages: [] });
    }

    // Append the new user message to your database history
    chat.messages.push({
      role: "user",
      content: message,
      timestamp: new Date(),
    });

    // 1. Format past chat history into the structure Gemini's SDK expects
    // Google uses 'user' and 'model' as the valid roles.
    const formattedContents = chat.messages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // 2. Call the official Google Gen AI SDK
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: formattedContents, // Sends the whole multi-turn thread
      config: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      },
    });

    const botResponse = response.text || "I'm not sure how to respond to that.";

    // Append the bot response to your database history
    chat.messages.push({
      role: "assistant",
      content: botResponse,
      timestamp: new Date(),
    });

    await chat.save();

    res.json({
      chatId: chat._id,
      response: botResponse,
      messages: chat.messages,
    });
  } catch (error) {
    console.error("Gemini API Error:", error.message || error);
    res.status(500).json({ error: "Internal server error connecting to Gemini" });
  }
};

// Get chat history
export const getChatHistory = async (req, res) => {
  try {
    const chats = await Chat.find().sort({ createdAt: -1 });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: "Error fetching chat history" });
  }
};

// Get single chat
export const getChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: "Error fetching chat" });
  }
};

// Delete chat
export const deleteChat = async (req, res) => {
  try {
    await Chat.findByIdAndDelete(req.params.id);
    res.json({ message: "Chat deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting chat" });
  }
};
