FROM oven/bun:latest

WORKDIR /app

# Copy package files first for better caching
COPY package.json bunfig.toml ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Development mode command
CMD ["bun", "run", "dev"]