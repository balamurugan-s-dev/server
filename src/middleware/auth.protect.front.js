import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    const token = req.cookies.jwt || req.headers['authorization']?.split(' ')[1]; 

    if (!token) {
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    jwt.verify(token, process.env.JWT_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }
        req.user = decoded.userId;
        req.name = decoded.userName;
        req.email = decoded.email;
        req.admin = decoded.isAdmin;
        next();
    });
};
