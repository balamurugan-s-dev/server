import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const generateToken = (user, res) =>{
    const token = jwt.sign({userId: user._id, userName: user.name, email: user.email, isAdmin: user.isAdmin}, process.env.JWT_TOKEN, {
        expiresIn: "7d"
    })

    // res.cookie('jwt', token, {
    //     maxAge: 7* 24* 60* 60* 1000 ,
    //     httpOnly: true,
    //     sameSite: "strict", 
    //     secure: process.env.NODE_ENV !== "development"
    // })
    res.cookie("jwt", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "None",
        secure: true,
    });
    
    return token;
}