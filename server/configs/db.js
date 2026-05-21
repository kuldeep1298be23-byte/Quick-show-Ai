import mongoose from "mongoose";

mongoose.set("bufferCommands", false);

const getMongoUri = () => {
    const mongoUri = process.env.MONGODB_URI?.trim();

    if (!mongoUri) {
        throw new Error("MONGODB_URI is missing in server/.env");
    }

    const queryStartIndex = mongoUri.indexOf("?");
    const baseUri = queryStartIndex === -1 ? mongoUri : mongoUri.slice(0, queryStartIndex);
    const queryString = queryStartIndex === -1 ? "" : mongoUri.slice(queryStartIndex);
    const protocolEndIndex = baseUri.indexOf("://");

    if (protocolEndIndex === -1) {
        throw new Error("MONGODB_URI must start with mongodb:// or mongodb+srv://");
    }

    const authorityAndPath = baseUri.slice(protocolEndIndex + 3);
    const pathStartIndex = authorityAndPath.indexOf("/");
    const hasDatabaseName =
        pathStartIndex !== -1 &&
        authorityAndPath.slice(pathStartIndex + 1).trim().length > 0;

    return hasDatabaseName
        ? `${baseUri}${queryString}`
        : `${baseUri.replace(/\/$/, "")}/quickshow${queryString}`;
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
        throw error;
    }
};

export default connectDB
