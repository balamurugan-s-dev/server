import jwt from 'jsonwebtoken';
import User from '../model/user.model.js';
import dotenv from 'dotenv';
dotenv.config();

export const protect = async (req, res, next) => {
    try{
        const token = req.cookies.jwt;
        if(!token){
            return res.status(401).json({message: "Not authorized"});
        }

        const decoded = jwt.verify(token, process.env.JWT_TOKEN);

        if(!decoded){
            return res.status(401).json({message: "Not authorized"});
        }

        const user = await User.findById(decoded.userId).select("-password");
        if(!user){
            return res.status(401).json({message: "Not authorized"});
        }

        req.user = user;
        next();
    }
    catch(error){
        console.log("There is an error in the auth middleware ",error);
        res.status(500).json({ error: "Internal server error" });
    }
}