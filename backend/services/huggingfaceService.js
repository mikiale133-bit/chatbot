import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const HF_API_KEY = process.env.HF_API_KEY;
const HF_API_URL = process.env.HF_API_URL || "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium";

if (!HF_API_KEY || HF_API_KEY.trim() === "") {
  throw new Error("Missing Hugging Face API key. Set HF_API_KEY in your .env file.");
}

export async function getHuggingFaceResponse(prompt) {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("Prompt text is required for the Hugging Face request.");
  }

  try {
    const response = await axios.post(
      HF_API_URL,
      {
        inputs: prompt,
        parameters: {
          max_new_tokens: 250,
          temperature: 0.7,
          top_p: 0.9,
          repetition_penalty: 1.2,
          do_sample: true,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      },
    );

    const data = response.data;
    let botResponse = "";

    if (typeof data === "string") {
      botResponse = data;
    } else if (data.generated_text) {
      botResponse = data.generated_text;
    } else if (Array.isArray(data) && data[0]?.generated_text) {
      botResponse = data[0].generated_text;
    } else if (data.error) {
      throw new Error(data.error);
    } else {
      throw new Error("Unexpected response format from Hugging Face API.");
    }

    botResponse = botResponse.trim();
    if (!botResponse) {
      throw new Error("Hugging Face returned an empty response.");
    }

    return botResponse;
  } catch (error) {
    console.error("Hugging Face API Error Details:", {
      message: error.message,
      status: error.response?.status,
      response: error.response?.data,
      code: error.code,
    });

    if (error.code === "ENOTFOUND") {
      throw new Error("Cannot reach Hugging Face API. Please check your internet connection and DNS settings.");
    }

    if (error.code === "ECONNABORTED") {
      throw new Error("Request timeout. The AI model is taking too long to respond. Please try again.");
    }

    if (error.response?.status === 401) {
      throw new Error("Invalid Hugging Face API key. Please check HF_API_KEY and try again.");
    }

    if (error.response?.status === 503) {
      throw new Error("Hugging Face service is unavailable right now. Please try again later.");
    }

    if (error.response?.status === 429) {
      throw new Error("Rate limit exceeded. Please wait before sending more requests.");
    }

    throw new Error(error.response?.data?.error || error.message || "Failed to get response from Hugging Face API.");
  }
}
