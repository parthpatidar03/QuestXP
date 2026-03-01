const morgan = require('morgan');

// Custom logging format for AI processing routes
const aiRouteLogger = morgan(':method :url :status :res[content-length] - :response-time ms - user::req[user_id]', {
    skip: function (req, res) { return req.method === 'OPTIONS'; }
});

// Middleware to attach user ID to request for morgan token
const attachUserIdToLog = (req, res, next) => {
    req.user_id = req.user ? req.user._id : 'anonymous';
    next();
};

morgan.token('req', function(req, res, field) {
    if (field === 'user_id') return req.user_id;
    return req.headers[field];
});

module.exports = {
    aiRouteLogger,
    attachUserIdToLog
};
