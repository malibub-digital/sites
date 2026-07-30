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
      content = content.replace(/\"file:.*?dsml\/packages\/core\"/g, '\"^0.1.0\"'); \
      fs.writeFileSync(p, content, 'utf8'); \
    } \
  }); \
"

# Install root dependencies and sirv-cli for static serving
RUN npm install -g sirv-cli && npm install

# Copy all source code
COPY . .

# Build the site
RUN npm run build

# Expose port
EXPOSE 3000

# Start static server
CMD ["sirv", "template/dist", "--port", "3000", "--host", "0.0.0.0", "--cors"]
