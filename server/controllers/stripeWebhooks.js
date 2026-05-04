import stripe from "stripe"
import Booking from '../models/Booking.js'
import { inngest } from "../inngest/index.js";
import { sendBookingConfirmationEmail } from "../services/bookingEmailService.js";

const markBookingPaid = async (bookingId) => {
    if (!bookingId) return;
    const booking = await Booking.findOneAndUpdate({
        _id: bookingId,
        isPaid: false,
    }, {
        isPaid: true,
        paymentLink: "",
    });

    if (booking) {
        await inngest.send({
            name: "booking/paid",
            data: { bookingId: booking._id.toString() },
        });

        try {
            await sendBookingConfirmationEmail(booking._id.toString());
        } catch (error) {
            console.error("Booking confirmation email failed:", error.message);
        }
    }
};


export const stripeWebhooks = async (request, response)=>{
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
        return response.status(500).send("Stripe webhook is not configured");
    }
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
    const sig = request.headers['stripe-signature'];
    if (!sig) {
        return response.status(400).send("Missing stripe-signature header");
    }

    let event;
    try{
        event=stripeInstance.webhooks.constructEvent(request.body,sig,process.env.STRIPE_WEBHOOK_SECRET)
    }catch (error){
        return response.status(400).send(`Webhook Error: ${error.message}`);
    }

    try {
         switch (event.type) {
            case "payment_intent.succeeded":{
                const paymentIntent= event.data.object;
                const sessionList=await stripeInstance.checkout.sessions.list({
                    payment_intent: paymentIntent.id
                })
                if (!sessionList.data?.length) {
                    break;
                }
                const session=sessionList.data[0];
                const bookingId = session.metadata?.bookingId;
                if (!bookingId) {
                    break;
                }

                await markBookingPaid(bookingId)
                break;
            }

            case "checkout.session.completed": {
                const session = event.data.object;
                const bookingId = session.metadata?.bookingId;
                await markBookingPaid(bookingId);
                break;
            }
                
         
            default:
console.log('Unhandled event type:' , event.type) 
        }
        response.json({received: true})
    } catch (err) {
        console.error("Webhook processing error:", err);
        response.status(500).send("Internal server Error");
        
    }
}
