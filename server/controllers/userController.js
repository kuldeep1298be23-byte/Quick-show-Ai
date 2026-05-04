import { clerkClient } from '@clerk/express';
import Booking from '../models/Booking.js'
import Movie from '../models/Movie.js';

//api controller function to get user bookings 

export const getUserBookings =async(req,res)=>{
    try{
        const user=req.auth().userId;
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const bookings=await Booking.find({user}).populate({
            path:"show",
            populate:{path:"movie"}
        }).sort({createdAt:-1})
        res.json({success: true,bookings})
    } catch(error){
        console.error(error.message);
        res.json({success: false, message:error.message});
        
    }
    
}

//api controller function to update favorite movie in clerk user metadata

export const updateFavorite =async(req,res)=>{
    try{
        const { movieId } =req.body;
        const userId = req.auth().userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const user=await clerkClient.users.getUser(userId)
        const favorites = user.privateMetadata?.favorites || [];

        if(!favorites.includes(movieId)){
            favorites.push(movieId)
        } else{
            const index = favorites.indexOf(movieId);
            favorites.splice(index, 1);
        }
        await clerkClient.users.updateUserMetadata(userId, {
            privateMetadata: {
                ...user.privateMetadata,
                favorites,
            },
        })

        res.json({success:true, message:"Favorite updated."})

    } catch(error){
        console.error(error.message);
        res.json({ success:false, message: error.message});
    }
}
export const getFavorites =async(req,res)=>{
    try{
        const userId = req.auth().userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const user =await clerkClient.users.getUser(userId)
        const favorites = user.privateMetadata?.favorites || [];

        //getting movies from database
        const movies =await Movie.find({_id: {$in: favorites}})

        res.json({success: true, movies})
    } catch (error){
        console.error(error.message);
        res.json({ success: false, message:error.message});
    }
}
