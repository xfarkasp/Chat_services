# Use an official Node.js runtime as a parent image.
FROM node:16-alpine

# Set the working directory inside the container.
WORKDIR /app

# Copy package.json and package-lock.json (if available) to leverage Docker cache.
COPY package*.json ./

# Install app dependencies.
RUN npm install

# Copy the rest of the application code.
COPY . .

# Expose the port your application listens on.
EXPOSE 5005

# Define the command to run your app.
CMD ["node", "index.js"]
