const morgan = require('morgan');
const { apiLogger } = require('../utils/logger');

const stream = {
    write: (message) => apiLogger.info(message.trim())
};

const skip = () => {
    const env = process.env.NODE_ENV || 'development';
    return env !== 'development';
};

const morganMiddleware = morgan(
    ':method :url :status :res[content-length] - :response-time ms',
    { stream }
);

module.exports = morganMiddleware;
