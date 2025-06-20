FROM node:18-alpine

WORKDIR /app

# Copy root package files for workspace setup
COPY package*.json ./

# Copy shared package
COPY packages/shared ./packages/shared

# Copy this service's package.json
COPY packages/underwriting-ui/package*.json ./packages/underwriting-ui/

# Install dependencies for the workspace
RUN npm ci

# Copy the source code
COPY packages/underwriting-ui ./packages/underwriting-ui

# Set working directory to this service
WORKDIR /app/packages/underwriting-ui

EXPOSE 3000

# Use development server for hot reloading
CMD ["npm", "start"] 