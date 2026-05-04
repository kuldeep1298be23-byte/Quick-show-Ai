import express from "express";
import { getFavorites, getUserBookings, updateFavorite } from "../controllers/userController.js";
import { protectUser } from "../middleware/auth.js";

const userRouter=express.Router();

userRouter.get('/bookings', protectUser, getUserBookings)
userRouter.post('/update-favorite', protectUser, updateFavorite)
userRouter.get('/favorites', protectUser, getFavorites)

export default userRouter
