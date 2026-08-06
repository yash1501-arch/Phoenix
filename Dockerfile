# Use Node.js LTS (v20) alpine image for a small footprint
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package files from the backend directory to install dependencies
COPY backend/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy the rest of the backend files
COPY backend/ .

# Expose port 8080 (the port configured in the Koyeb UI)
EXPOSE 8080

# Environment variable to run on port 8080 by default
ENV PORT=8080

# Start the Express server
CMD ["node", "index.js"]
