# Koyeb (or any container host) — Express API from backend/
# Render Blueprint (render.yaml) does not use this file; it runs `npm start` in backend/.
FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ .

EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

# Override on Koyeb if the platform injects PORT (the app reads process.env.PORT).
# Optional worker: command `node worker.js` plus REDIS_URL (not required for launch).
CMD ["npm", "start"]
