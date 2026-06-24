FROM node:18-alpine

# Install git (needed for deploy hook)
RUN apk add --no-cache git

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 5000

# Set environment
ENV NODE_ENV=production

# Start application
CMD ["npm", "start"]
