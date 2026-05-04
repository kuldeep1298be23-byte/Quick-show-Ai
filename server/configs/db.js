import mongoose from "mongoose";

const getMongoUri = () => {
    const mongoUri = process.env.MONGODB_URI?.trim();

    if (!mongoUri) {
        throw new Error("MONGODB_URI is missing in server/.env");
    }

    return mongoUri.includes("?")
        ? mongoUri.replace("?", "/quickshow?")
        : `${mongoUri}/quickshow`;
};

const connectDB = async () => {
    try {
        mongoose.connection.on("connected", () => console.log("database connected"));

        await mongoose.connect(getMongoUri(), {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
        });
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
    }
};

export default connectDB
