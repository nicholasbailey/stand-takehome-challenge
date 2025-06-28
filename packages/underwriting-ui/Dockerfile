FROM node:18-alpine

WORKDIR /app

# Copy root package files for workspace setup
COPY package*.json ./

# Copy shared packages
COPY packages/shared-models ./packages/shared-models
COPY packages/shared-components ./packages/shared-components

# Copy this service's package.json
COPY packages/underwriting-ui/package*.json ./packages/underwriting-ui/

# Install dependencies for the workspace
RUN npm ci

# Build shared-components package
RUN cd packages/shared-components && npm run build

# Copy the source code
COPY packages/underwriting-ui ./packages/underwriting-ui

# Set working directory to this service
WORKDIR /app/packages/underwriting-ui

EXPOSE 3000

# Use development server for hot reloading
CMD ["npm", "start"] 