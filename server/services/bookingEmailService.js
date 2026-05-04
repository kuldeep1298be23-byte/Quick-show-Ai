import nodemailer from "nodemailer";
import { clerkClient } from "@clerk/express";
import Booking from "../models/Booking.js";
import User from "../models/user.js";

const getTransporter = () => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.SENDER_EMAIL) {
        throw new Error("SMTP email settings are not configured");
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

const formatShowDate = (date) => {
    return new Date(date).toLocaleString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
    });
};

const loadBookingUser = async (userId) => {
    try {
        const clerkUser = await clerkClient.users.getUser(userId);
        const primaryEmail =
            clerkUser.emailAddresses?.find((email) => email.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
            clerkUser.emailAddresses?.[0]?.emailAddress;

        if (primaryEmail) {
            return {
                name: clerkUser.fullName || clerkUser.firstName || "QuickShow user",
                email: primaryEmail,
            };
        }
    } catch (error) {
        console.error("Clerk user email lookup failed:", error.message);
    }

    const dbUser = await User.findById(userId).lean();
    if (dbUser?.email) return dbUser;

    return null;
};

export const sendBookingConfirmationEmail = async (bookingId) => {
    const booking = await Booking.findById(bookingId).populate({
        path: "show",
        populate: { path: "movie" },
    });

    if (!booking) {
        throw new Error("Booking not found");
    }

    if (booking.paymentEmailSent) {
        return { sent: false, skipped: true, reason: "already_sent" };
    }

    const user = await loadBookingUser(booking.user);
    if (!user?.email) {
        throw new Error("User email not found");
    }

    const movieTitle = booking.show?.movie?.title || "your movie";
    const showTime = booking.show?.showDateTime ? formatShowDate(booking.show.showDateTime) : "N/A";
    const seats = Array.isArray(booking.bookedSeats) ? booking.bookedSeats.join(", ") : "N/A";
    const currency = process.env.CURRENCY || process.env.VITE_CURRENCY || "$";

    const transporter = getTransporter();
    await transporter.sendMail({
        from: `"QuickShow" <${process.env.SENDER_EMAIL}>`,
        to: user.email,
        subject: `Booking confirmed: ${movieTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                <h2>Your QuickShow booking is confirmed</h2>
                <p>Hi ${user.name || "there"},</p>
                <p>Your payment was successful and your seats are booked.</p>
                <table style="border-collapse: collapse;">
                    <tr><td style="padding: 4px 12px 4px 0;"><strong>Movie</strong></td><td>${movieTitle}</td></tr>
                    <tr><td style="padding: 4px 12px 4px 0;"><strong>Show Time</strong></td><td>${showTime}</td></tr>
                    <tr><td style="padding: 4px 12px 4px 0;"><strong>Seats</strong></td><td>${seats}</td></tr>
                    <tr><td style="padding: 4px 12px 4px 0;"><strong>Amount</strong></td><td>${currency}${booking.amount}</td></tr>
                </table>
                <p>Enjoy the show.</p>
            </div>
        `,
    });

    booking.paymentEmailSent = true;
    booking.paymentEmailSentAt = new Date();
    await booking.save();

    return { sent: true, email: user.email };
};
