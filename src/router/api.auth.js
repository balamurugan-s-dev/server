import express from 'express';
import { signup, login, logout } from '../controller/auth.controller.js';
import { verifyToken } from '../middleware/auth.protect.front.js';
import {uploadMiddleware, updateProfile, postUserProfile } from '../controller/auth.update.profile.js';
import { searchSong } from '../controller/song.controller.js';

const router = express.Router();

router.post('/auth/signup', signup);
router.post('/auth/login' , login);
router.post('/auth/logout', logout);
router.put('/auth/update/profile', verifyToken, uploadMiddleware, updateProfile);
router.get('/auth/userprofile',verifyToken, postUserProfile);
router.get('/auth/status', verifyToken, (req, res) => {
    res.status(200).json({ message: "JWT is valid, user authenticated", userId: req.user, name: req.name, email: req.email, isAdmin: req.admin });
});
export default router;