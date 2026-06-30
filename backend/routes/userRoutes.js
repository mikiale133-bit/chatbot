import express from "express";
import { getUser, getUsers, loginUser, registerUser } from "../controllers/userController.js";
import { verifyAdmin } from "../middlewares/authMiddleware.js";

const usersRouter = express.Router();

// routes
usersRouter.post("/register", registerUser);
usersRouter.post("/login", loginUser);
usersRouter.get("/", verifyAdmin, getUsers);
usersRouter.get("/:userId", verifyAdmin, getUser);

export default usersRouter;
