FROM node:18-alpine

WORKDIR /app

# copy root manifests for workspaces
COPY package*.json ./
COPY packages/shared-models/package*.json ./packages/shared-models/
COPY packages/mitigation-rules-engine/package*.json ./packages/mitigation-rules-engine/

# install dependencies including dev (nodemon, ts-node)
RUN npm ci

# copy source code for shared and service packages
COPY packages/shared-models ./packages/shared-models
COPY packages/mitigation-rules-engine ./packages/mitigation-rules-engine

# install postgres client for pg_isready
RUN apk add --no-cache postgresql-client

# copy entrypoint
COPY packages/mitigation-rules-engine/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

WORKDIR /app/packages/mitigation-rules-engine

EXPOSE 3001

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "dev"] 