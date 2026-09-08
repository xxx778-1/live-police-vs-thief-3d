# Use a lightweight Node image to run the server
FROM node:18-alpine
WORKDIR /app
COPY server/package.json ./
RUN npm install --production
COPY server ./server
EXPOSE 8080
CMD ["node", "server/server.js"]
