/* Kembara Si PeTara: multiplayer presence (30 slots). Gameplay remains independent. */
(() => {
  "use strict";
  const status = document.createElement("div");
  status.id = "multiplayerStatus";
  status.setAttribute("aria-live", "polite");
  status.textContent = "👥 Pemain: belum bersambung";
  status.style.cssText = "position:absolute;top:78px;right:12px;z-index:60;background:rgba(12,29,65,.85);color:white;padding:7px 12px;border-radius:12px;font:600 13px sans-serif;pointer-events:none;";
  const world = document.getElementById("world");
  const config = {
    apiKey: "AIzaSyB93v_WO_qGHuYN2qeaI0QIoeKT7gdoWj0",
    authDomain: "kembara-si-petara.firebaseapp.com",
    databaseURL: "https://kembara-si-petara-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "kembara-si-petara",
    appId: "1:516080734737:web:61492c4996f241dedf57b0",
    messagingSenderId: "516080734737"
  };
  let db, auth, uid = "", slotRef = null, slotsRef = null;
  let started = false, lastSend = 0, lastX = -1, lastY = -1;
  const ghosts = new Map();
  const setStatus = message => { status.textContent = message; };
  const keyOf = slot => String(slot);
  function showPlayers(snapshot) {
    const slots = snapshot.val() || {};
    const active = Object.entries(slots).filter(([key, value]) =>
      Number(key) >= 1 && Number(key) <= 30 && value && typeof value.name === "string"
    );
    setStatus("👥 Pemain: " + active.length + "/30");
    const ids = new Set();
    for (const [key, data] of active) {
      if (data.uid === uid) continue;
      ids.add(key);
      let ghost = ghosts.get(key);
      if (!ghost) {
        ghost = document.createElement("div");
        ghost.className = "ksp-remote-player";
        ghost.style.cssText = "position:absolute;z-index:16;transform:translate(-50%,-100%);pointer-events:none;display:flex;align-items:center;flex-direction:column;gap:2px;";
        const label = document.createElement("span");
        label.style.cssText = "background:rgba(17,40,80,.85);color:#fff;font:bold 14px sans-serif;padding:3px 7px;border-radius:9px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;";
        const img = document.createElement("img");
        img.src = "assets/player/petara-idle.png";
        img.alt = "";
        img.style.cssText = "width:48px;height:auto;image-rendering:pixelated;";
        ghost.append(label, img);
        world.appendChild(ghost);
        ghosts.set(key, ghost);
      }
      ghost.firstChild.textContent = data.name.slice(0, 24);
      ghost.style.left = Math.max(0, Math.min(1600, Number(data.x) || 0)) + "px";
      ghost.style.top = Math.max(0, Math.min(900, Number(data.y) || 0)) + "px";
    }
    for (const [key, ghost] of ghosts) {
      if (!ids.has(key)) { ghost.remove(); ghosts.delete(key); }
    }
  }
  async function claimSlot() {
    if (slotRef || !auth.currentUser) return;
    const name = String(game.studentName || "Pengembara").trim().slice(0, 24);
    const position = game.player;
    const value = { uid, name, x: Math.round(position.x), y: Math.round(position.y) };
    try {
      for (let i = 1; i <= 30; i++) {
        const candidate = slotsRef.child(keyOf(i));
        const result = await candidate.transaction(existing => {
          if (existing == null || existing.uid === uid) return value;
          return;
        }, undefined, false);
        if (result.committed && result.snapshot.val()?.uid === uid) {
          slotRef = candidate;
          await slotRef.onDisconnect().remove();
          setStatus("👥 Pemain bersambung");
          return;
        }
      }
      setStatus("👥 Ruang penuh (30/30). Bermain secara individu.");
    } catch (error) {
      console.warn("KSP multiplayer slot:", error);
      setStatus("👥 Sambungan pemain terganggu");
    }
  }
  async function start() {
    if (started) return;
    started = true;
    document.getElementById("worldViewport")?.appendChild(status);
    try {
      if (!window.firebase?.apps) throw new Error("Firebase SDK unavailable");
      const app = firebase.apps.find(a => a.name === "ksp-multiplayer") ||
        firebase.initializeApp(config, "ksp-multiplayer");
      auth = app.auth();
      db = app.database();
      const credential = await auth.signInAnonymously();
      uid = credential.user.uid;
      slotsRef = db.ref("multiplayer/slots");
      slotsRef.on("value", showPlayers, e => {
        console.warn("Multiplayer read:", e); setStatus("👥 Tidak dapat membaca pemain");
      });
      db.ref(".info/connected").on("value", snapshot => {
        if (!snapshot.val()) {
          slotRef = null;
          setStatus("👥 Menyambung semula...");
        } else {
          claimSlot();
        }
      });
    } catch (error) {
      console.warn("KSP multiplayer connection:", error);
      setStatus("👥 Mod individu (sambungan tidak tersedia)");
    }
  }
  function updatePosition(player) {
    if (!slotRef) return;
    const now = Date.now();
    if (now - lastSend < 250) return;
    const x = Math.round(player.x), y = Math.round(player.y);
    if (x === lastX && y === lastY) return;
    lastSend = now; lastX = x; lastY = y;
    slotRef.update({ x, y }).catch(e => console.warn("Position update:", e));
  }
  window.KSPMultiplayer = { start, updatePosition };
})();
