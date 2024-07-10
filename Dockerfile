# Base node image
FROM node:18-alpine

# Set working directory to host the project
WORKDIR /app

# Copy manifest files to install dependencies first
COPY package.json package-lock.json /app/

# Install app dependencies
RUN npm install

# Copy the rest of the project
COPY . /app/

# Expose default node port
EXPOSE 3000

# Start app
CMD ["npm", "start"]
