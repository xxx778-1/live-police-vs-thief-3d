// Simple WebSocket relay server for Live Police vs Thief prototype
// Usage: node server.js
// Requires: npm install express ws

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let viewers = {}; // viewerId -> {name, team, wsOverlay}
let unitySocket = null;

function broadcastToOverlays(obj) {
  const msg = JSON.stringify(obj);
  Object.values(viewers).forEach(v => {
    if (v.wsOverlay && v.wsOverlay.readyState === WebSocket.OPEN) {
      try { v.wsOverlay.send(msg); } catch(e) { }
    }
  });
}

wss.on('connection', (ws, req) => {
  ws.isAlive = true;
  ws.on('pong', () => ws.isAlive = true);

  ws.on('message', msg => {
    try {
      const data = JSON.parse(msg);
      // Registration
      if (data.role === 'overlay') {
        viewers[data.viewerId] = { name: data.name || data.viewerId, team: null, wsOverlay: ws };
        ws.viewerId = data.viewerId;
        console.log('Overlay connected:', data.viewerId);
        // send current summary
        sendSummaryToOverlay(ws);
        return;
      }
      if (data.role === 'unity') {
        unitySocket = ws;
        ws.role = 'unity';
        console.log('Unity connected');
        return;
      }

      // Forward actions
      if (data.type === 'join') {
        const v = viewers[data.viewerId] || { name: data.name };
        v.team = data.team;
        viewers[data.viewerId] = v;
        const cmd = { type:'command', action:'spawnPlayer', viewerId:data.viewerId, name:data.name, team:data.team };
        if (unitySocket && unitySocket.readyState === WebSocket.OPEN) unitySocket.send(JSON.stringify(cmd));
        // immediately broadcast team counts
        broadcastSummary();
        return;
      }
      if (data.type === 'useItem') {
        const cmd = { type:'input', viewerId:data.viewerId, itemId:data.itemId };
        if (unitySocket && unitySocket.readyState === WebSocket.OPEN) unitySocket.send(JSON.stringify(cmd));
        // optional echo to overlays
        broadcastToOverlays({ type:'broadcast', msg:`${viewers[data.viewerId]?.name || data.viewerId} 使用了 ${data.itemId}`});
        return;
      }

      // Messages from Unity forwarded to overlays
      if (data.type === 'state' || data.type === 'update' || data.type === 'broadcast') {
        broadcastToOverlays(data);
        return;
      }

    } catch (e) { console.error('Bad message', e); }
  });

  ws.on('close', () => {
    if (ws.viewerId) {
      console.log('Overlay disconnected:', ws.viewerId);
      delete viewers[ws.viewerId];
      broadcastSummary();
    } else if (ws.role === 'unity') {
      console.log('Unity disconnected');
      unitySocket = null;
    }
  });
});

function sendSummaryToOverlay(ws) {
  const counts = { police:0, thief:0 };
  Object.values(viewers).forEach(v=>{ if (v.team) counts[v.team] = (counts[v.team]||0) + 1; });
  const summary = { type:'update', teams:counts, scores:{ police:0, thief:0 } };
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(summary));
}

function broadcastSummary() {
  const counts = { police:0, thief:0 };
  Object.values(viewers).forEach(v=>{ if (v.team) counts[v.team] = (counts[v.team]||0) + 1; });
  const summary = { type:'update', teams:counts, scores:{ police:0, thief:0 } };
  broadcastToOverlays(summary);
}

// Health ping
setInterval(() => {
  wss.clients.forEach(ws => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping(() => {});
  });
}, 30000);

// Admin status endpoint
app.get('/status', (req, res) => {
  const counts = { police:0, thief:0 };
  Object.values(viewers).forEach(v=>{ if (v.team) counts[v.team] = (counts[v.team]||0) + 1; });
  res.json({ viewersCount:Object.keys(viewers).length, counts, unityConnected: !!unitySocket });
});

server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
