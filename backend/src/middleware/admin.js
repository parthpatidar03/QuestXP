const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ 
            error: 'FORBIDDEN', 
            message: 'Admin privileges required for this action.' 
        });
    }
};

module.exports = admin;
