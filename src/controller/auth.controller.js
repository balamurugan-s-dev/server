import User from '../model/user.model.js';
import bcrypt from 'bcryptjs';
import {generateToken} from '../lib/util.js';

export const signup = async (req, res) => {
    const {name, email, password, isAdmin} = req.body;
    try {
        if(!name || !email || !password){
            return res.status(400).json({error: "Please fill all the fields"});
        }

        if(password.length < 6){
            return res.status(400).json({error: "Password must be at least 6 characters"});
        }

        const userExists = await User.findOne({email});
        if(userExists){
            return res.status(400).json({message: "User already exists"});
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User({
            name,
            email,
            password: hashedPassword,
            isAdmin: isAdmin || false,
        });

        if(newUser){    
            generateToken(newUser, res);
            await newUser.save();

            res.status(201).json({
                message: "User created successfully",
                _id:newUser._id,
                fullName: newUser.name,
                email: newUser.email,
            });

        }
        else{
            res.status(400).json({message: "Invalid user data"});
        }
    }
    catch (error) {
        console.log("Error in signup controller ", error);
        res.status(500).json({error: "Internal server error"});
    }
}

export const login = async (req, res) => {
    const {email, password} = req.body;
    try {
        if(!email || !password){
            return res.status(400).json({error: "Please fill all the fields"});
        }

        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({message: "User does not exist"});
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({message: "Invalid credentials"});
        }

        // Generate token
        generateToken(user, res);

        res.status(200).json({
            message: "Login successful",
            _id:user._id,
            fullName: user.name,
            email: user.email,
        });
    }
    catch (error) {
        console.log("Error in login controller ", error);
        res.status(500).json({error: "Internal server error"});
    }
}

export const logout = async (req, res) => {
    try{
        res.cookie('jwt', '', {maxAge: 0});
        res.status(200).json({message: "Logout successful"});
    }
    catch(error){
        console.log("Error in logout controller ", error);
        res.status(500).json({error: "Internal server error"});
    }
}

