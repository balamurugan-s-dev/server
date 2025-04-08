import User from "../model/user.model.js";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage });

export const updateProfile = async (req, res) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ message: "No image uploaded" });
        }

        const bufferData = Buffer.from(req.file.buffer);
        const contentType = req.file.mimetype;

        if (!contentType.startsWith("image/")) {
            return res.status(400).json({ message: "Invalid image type" });
        }

        const user = await User.findById(req.user);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.pic = { data: bufferData, contentType: contentType };
        await user.save();

        res.status(200).json({ message: "Profile updated successfully" });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Error updating profile" });
    }
}

export const uploadMiddleware = upload.single("image");

export const postUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const bufferData = user.pic.data;
        const contentType = user.pic.contentType;

        res.set("Content-Type", contentType);
        res.send(bufferData);
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: "Error fetching user profile" });
    }
}