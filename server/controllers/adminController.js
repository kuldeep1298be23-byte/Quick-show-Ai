import Show from '../models/Show.js';
import User from '../models/user.js'
import Booking from '../models/Booking.js'
import { clerkClient } from '@clerk/express';


//api to check if user is admin
export const isAdmin=async (req,res)=>{
    res.json({success:true, isAdmin: true})
}

//api to get dashboard data
export const getDashboardData  =async (req,res)=>{
    try{
        const bookings =await Booking.find({isPaid: true});
        const activeShows = await Show.find({}).populate('movie').sort({ showDateTime: 1 });

        const totalUsers =await User.countDocuments();
          const dashboardData={
            totalBookings: bookings.length,
            totalRevenue: bookings.reduce((acc, booking)=> acc+booking.amount, 0),activeShows,
            totalUsers
          }
            res.json({success: true, dashboardData})
    } catch (error){
        console.error(error);
        res.json({success: false, message: error.message})

    }
}

//api to get all shows

export const getAllShows = async (req,res)=>{
    try{
        const shows =await Show.find({}).populate('movie').sort({ showDateTime: 1 })
        res.json({success: true, shows})
    } catch(error) {
        console.error(error);
    res.json({success: false, message:error.message })
}
}

//api to get all bookings 

export const getAllBookings = async (req,res)=>{
    try{
        const bookings =await Booking.find({}).populate({
            path:"show",
            populate:{path: "movie"}
        }).sort({createdAt: -1}).lean()

        const userIds = [...new Set(bookings.map((booking) => booking.user).filter(Boolean))];
        const dbUsers = await User.find({ _id: { $in: userIds } }).lean();
        const userMap = new Map(dbUsers.map((user) => [user._id, user]));

        await Promise.all(userIds.map(async (userId) => {
            if (userMap.has(userId)) return;

            try {
                const clerkUser = await clerkClient.users.getUser(userId);
                const name = clerkUser.fullName || clerkUser.firstName || clerkUser.emailAddresses?.[0]?.emailAddress || userId;
                userMap.set(userId, {
                    _id: userId,
                    name,
                    email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
                    image: clerkUser.imageUrl || '',
                });
            } catch (error) {
                userMap.set(userId, {
                    _id: userId,
                    name: userId,
                    email: '',
                    image: '',
                });
            }
        }));

        const bookingsWithUsers = bookings.map((booking) => ({
            ...booking,
            user: userMap.get(booking.user) || {
                _id: booking.user,
                name: booking.user || 'Unknown user',
                email: '',
                image: '',
            },
        }));

        res.json({success: true, bookings: bookingsWithUsers })


    } catch (error){
        console.error(error);
        res.json({success: false, message:error.message})
    }
}
