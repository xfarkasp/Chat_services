# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install --only=production

# Copy the rest of the app
COPY src ./src

# Expose the port (if service runs on 3000)
EXPOSE 3001

# Run the application
CMD ["node", "src/index.js"]
