# Use Node.js 20 as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# executed when you build the docker image using 'docker build -t questxp-backend'
RUN npm install --production

# Copy application source
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Start the application 
# executed when you run the docker container using 'docker run questxp-backend'
CMD ["npm", "start"]
