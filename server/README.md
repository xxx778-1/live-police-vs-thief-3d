# Server README

This directory contains a minimal Node.js WebSocket relay server and a simple overlay page for embedding in OBS.

Requirements
- Node.js 14+

Install & Run

cd server
npm install
npm start

Open overlay
http://localhost:8080/overlay.html

Endpoints
- /overlay.html - OBS-friendly viewer overlay
- /status - JSON status showing connected viewers and unity connection

Notes
- This server is intentionally minimal for prototype purposes.
- Use WSS/HTTPS and proper validation in production.
