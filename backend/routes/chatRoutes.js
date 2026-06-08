import express from "express";
const router = express.Router();
import { sendMessage, getChatHistory, getChat, deleteChat } from "../controllers/geminiChatController.js";

const chatRouter = express.Router();

chatRouter.post("/message", sendMessage);
chatRouter.get("/history", getChatHistory);
chatRouter.get("/:id", getChat);
chatRouter.delete("/:id", deleteChat);

export default chatRouter;
