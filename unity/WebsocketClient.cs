/*
 Unity WebSocket client example using WebSocketSharp.
 Put this script into Assets/Scripts and attach to a GameObject in the scene.
 Requires: WebSocketSharp.dll and Newtonsoft.Json (optional).
*/

using UnityEngine;
using WebSocketSharp;
using Newtonsoft.Json.Linq;

public class WebsocketClient : MonoBehaviour {
    WebSocket ws;
    public string serverUrl = "ws://localhost:8080"; // change if needed

    void Start() {
        ws = new WebSocket(serverUrl);
        ws.OnOpen += (s,e) => {
            Debug.Log("WS Open");
            // register as unity
            var reg = new { role = "unity" };
            ws.Send(JsonUtility.ToJson(reg));
        };
        ws.OnMessage += (s,e) => {
            Debug.Log("WS Recv: " + e.Data);
            HandleMessage(e.Data);
        };
        ws.OnError += (s,e) => Debug.LogError("WS Error: " + e.Message);
        ws.OnClose += (s,e) => Debug.Log("WS Closed");
        ws.ConnectAsync();
    }

    void HandleMessage(string json) {
        try {
            var obj = JObject.Parse(json);
            var t = (string)obj["type"];
            if (t == "command" && (string)obj["action"] == "spawnPlayer") {
                string viewerId = (string)obj["viewerId"];
                string team = (string)obj["team"];
                SpawnViewerPlayer(viewerId, team);
            } else if (t == "input") {
                string viewerId = (string)obj["viewerId"];
                string itemId = (string)obj["itemId"];
                OnViewerUseItem(viewerId, itemId);
            } else if (t == "state" || t == "update") {
                // optional: update UI
            }
        } catch (System.Exception ex) {
            Debug.LogError("HandleMessage error: " + ex.Message);
        }
    }

    void SpawnViewerPlayer(string viewerId, string team) {
        Debug.Log($"Spawn viewer {viewerId} team={team}");
        // TODO: instantiate simple marker / AI agent in scene for viewer
    }

    void OnViewerUseItem(string viewerId, string itemId) {
        Debug.Log($"Viewer {viewerId} used {itemId}");
        // TODO: apply item effect in game world (VFX, status changes)
        // Example: if itemId == "smoke" spawn particle system at random position
    }

    // Example method to send state back to server
    public void SendStateUpdate(object state) {
        if (ws != null && ws.ReadyState == WebSocketState.Open) {
            ws.Send(JsonUtility.ToJson(state));
        }
    }

    void OnDestroy() {
        if (ws != null) ws.Close();
    }
}
