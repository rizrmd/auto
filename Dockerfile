FROM oven/bun:latest

WORKDIR /app

# Install git
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Clone the repository
RUN git clone https://github.com/rizrmd/auto.git .

# Install dependencies
RUN bun install --frozen-lockfile

# Expose port
EXPOSE 3000

# Development mode command
CMD ["bun", "run", "dev"]