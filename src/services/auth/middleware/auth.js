const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = (req, res) => {
    const authHeader = req.headers['authorization'];
    const expiresIn = '1h';
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log(decoded);
        req.body.user = decoded; // Attach user info (id, role) to the request
        console.log(req);
        return res.status(200).json(req.body.user);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token has expired' });
        }
        return res.status(403).json({ error: 'Invalid token' });
    }
};

module.exports = authenticateToken;