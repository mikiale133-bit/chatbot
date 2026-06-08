import Chat from "../models/chatModel.js";
import axios from "axios";

// Hugging Face API configuration
const HUGGING_FACE_API_URL = "https://router.huggingface.co/hf-inference/models/microsoft/DialoGPT-medium";
const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY; // Get from https://huggingface.co/settings/tokens

console.log("tEST: ", process.env.TESTING);

// Send message and get response
export const sendMessage = async (req, res) => {
  try {
    const { message, chatId } = req.body;

    // Validate request
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

    // Add user message
    chat.messages.push({
      role: "user",
      content: message,
      timestamp: new Date(),
    });

    // Get response from Hugging Face
    const botResponse = await getHuggingFaceResponse(message);

    // Add bot response
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
    console.error("Error in sendMessage:", error);
    res.status(500).json({ error: "Internal server error" });
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

// Helper function to call Hugging Face API
async function getHuggingFaceResponse(message) {
  try {
    if (!HUGGING_FACE_API_KEY) {
      console.warn("HUGGING_FACE_API_KEY is missing. Using fallback message.");
      return "HUGGING_FACE_API_KEY Error! Please set your environment variable.";
    }

    // FIXED: Correct schema structure for Hugging Face Inference API
    const response = await axios.post(
      HUGGING_FACE_API_URL,
      {
        inputs: message,
        parameters: {
          max_new_tokens: 100, // Better practice than max_length for chat
          temperature: 0.7,
          top_p: 0.9,
          do_sample: true, // Required if you want to use temperature/top_p
        },
      },
      {
        headers: {
          Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    let botResponse = "";

    // FIXED: Parsing logic matching HF text-generation array output
    if (Array.isArray(response.data) && response.data[0]?.generated_text) {
      botResponse = response.data[0].generated_text;
    } else if (response.data?.generated_text) {
      botResponse = response.data.generated_text;
    }

    // Clean up response if the model echoed back the user's prompt
    if (botResponse.startsWith(message)) {
      botResponse = botResponse.substring(message.length).trim();
    }

    return botResponse || "Interesting! Tell me more.";
  } catch (error) {
    console.error("Hugging Face API error:", error.response?.data || error.message);
    return "I'm having trouble connecting to my knowledge base. Could you please rephrase that?";
  }
}
