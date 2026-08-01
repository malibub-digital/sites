FROM node:22

WORKDIR /app

# Copy package files
COPY package.json ./
COPY packages/core/package.json ./packages/core/
COPY template/package.json ./template/

# Replace local dsml dependency with NPM package during docker build
RUN node -e " \
  const fs = require('fs'); \
  const pkgs = ['template/package.json', 'packages/core/package.json']; \
  pkgs.forEach(p => { \
    if (fs.existsSync(p)) { \
      let content = fs.readFileSync(p, 'utf8'); \
      content = content.replace(/\"file:.*?dsml\/packages\/core\"/g, '\"latest\"'); \
      fs.writeFileSync(p, content, 'utf8'); \
    } \
  }); \
"

# Install root dependencies
RUN npm install

# Copy all source code
COPY . .

# Build the site
RUN npm run build

# Environment variables for Astro Node server
ENV HOST=0.0.0.0
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start Astro Node server
CMD ["node", "template/dist/server/entry.mjs"]
