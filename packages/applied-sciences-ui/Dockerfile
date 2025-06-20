FROM node:18-alpine

WORKDIR /app

# Copy root package files for workspace setup
COPY package*.json ./

# Copy shared package
COPY packages/shared ./packages/shared

# Copy this service's package.json
COPY packages/applied-sciences-ui/package*.json ./packages/applied-sciences-ui/

# Install dependencies for the workspace
RUN npm ci

# Copy the source code
COPY packages/applied-sciences-ui ./packages/applied-sciences-ui

# Set working directory to this service
WORKDIR /app/packages/applied-sciences-ui

EXPOSE 3000

# Use development server for hot reloading
CMD ["npm", "start"] 