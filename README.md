# live-police-vs-thief-3d

Prototype project for a live 3D interactive game "Police vs Thief" where viewers join teams and use items via an OBS BrowserSource overlay. This repository contains a runnable Node.js relay server, an OBS-friendly overlay page, and a Unity WebSocket client example.

This is a minimal prototype to get the end-to-end loop working locally: overlay -> server -> Unity -> server -> overlay.

## Contents
- server/ - Node.js relay server and public overlay
- unity/ - example Unity C# WebSocket client script

## Quick local run (Windows)
1. Clone:

   git clone https://github.com/xxx778-1/live-police-vs-thief-3d.git

2. Start the Node relay server:

   cd live-police-vs-thief-3d/server
   npm install
   npm start

   Server listens on port 8080 by default. Visit http://localhost:8080/overlay.html to open the overlay in a browser or add it as a BrowserSource in OBS.

3. Unity client:
- Open your Unity project (2020.3 LTS or newer recommended), copy `unity/WebsocketClient.cs` into `Assets/Scripts`.
- Add WebSocketSharp.dll to Plugins, or use another WebSocket library.
- Attach the script to an empty GameObject and set serverUrl to `ws://localhost:8080`.
- Play in Editor or build a Windows standalone — the Unity client will register as the authoritative game server side and receive overlay messages.

## Files added
- server/server.js - Node+ws relay server
- server/public/overlay.html - OBS overlay for viewers
- unity/WebsocketClient.cs - Unity example script to receive spawn/useItem commands
- server/package.json - Node dependencies
- Dockerfile - container for the server
- README.md - this file

## Next steps
- Implement GameManager and ItemSystem in Unity, authoritative game logic, VFX and NavMesh scene
- Add persistent session/points storage (Redis or DB)
- Harden server (WSS, rate limits, auth with Twitch/YouTube)

