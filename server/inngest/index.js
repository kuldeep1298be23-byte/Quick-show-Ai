import { Inngest } from "inngest";
import User from "../models/user.js";
import { sendBookingConfirmationEmail as sendBookingEmail } from "../services/bookingEmailService.js";


export const inngest = new Inngest({ id: "movie-ticket-booking"});


const syncUserCreation=inngest.createFunction(
   {id: 'sync-user-from-clerk'},
   {event:'clerk/user.created'},
   async({ event })=>{
    const {id,first_name,last_name,email_addresses,image_url}=event.data;
    const userData={
        _id:id,
        email:email_addresses?.[0]?.email_address || "",
        name:[first_name, last_name].filter(Boolean).join(" ") || email_addresses?.[0]?.email_address || "QuickShow user",
        image:image_url || "",
    };
    await User.findByIdAndUpdate(id, userData, { upsert: true });
   }
);
//inngist function to delete user from database
const syncUserDeletion = inngest.createFunction(
    {id: 'delete-user-with-clerk'},
    {event: 'clerk/user.deleted'},
    async({event}) =>{
        const {id} =event.data;
        await User.findByIdAndDelete(id);
    }
);

//inngest function to update user data in database
const syncUserUpdation =inngest.createFunction(
    {id:'update-user-from-clerk'},
    {event:'clerk/user.updated'},
    async({event})=>{
        const {id,first_name,last_name,email_addresses,image_url}=event.data
        const userData={
            _id:id,
            email:email_addresses?.[0]?.email_address || "",
            name:[first_name, last_name].filter(Boolean).join(" ") || email_addresses?.[0]?.email_address || "QuickShow user",
            image: image_url || "",
        };
        await User.findByIdAndUpdate(id, userData, { upsert: true })
    }

);

const sendBookingConfirmationEmail = inngest.createFunction(
    { id: "send-booking-confirmation-email" },
    { event: "booking/paid" },
    async ({ event, step }) => {
        const { bookingId } = event.data;
        if (!bookingId) {
            throw new Error("bookingId is required");
        }

        return step.run("send-email", async () => sendBookingEmail(bookingId));
    }
);

export const functions=[
 syncUserCreation,
    syncUserDeletion,
    syncUserUpdation,
    sendBookingConfirmationEmail
];
