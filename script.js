const MAP_W = 1600;
const MAP_H = 900;

const game = {
  studentName: "",
  score: 0,
  currentCheckpoint: 1,
  completedCheckpoints: [],
  modalCheckpoint: null,
  player: {
    x: 800,
    y: 795,
    speed: 4.2,
    direction: "up",
    moving: false,
    frame: 0
  }
};

// =====================================================
// CHECKPOINT POSITIONS
// =====================================================

const checkpoints = [
  { id: 1, x: 630, y: 520, label: "Misi 1" },
  { id: 2, x: 790, y: 745, label: "Misi 2" },
  { id: 3, x: 1000, y: 520, label: "Misi 3" },
  { id: 4, x: 455, y: 205, label: "Misi 4" },
  { id: 5, x: 1190, y: 240, label: "Misi 5" }
];

const finish = {
  id: "finish",
  x: 805,
  y: 115,
  label: "Penamat"
};

const keys = new Set();

let scale = 1;
let lastAnim = 0;

// =====================================================
// ELEMENTS
// =====================================================

const startScreen = document.querySelector("#startScreen");
const gameScreen = document.querySelector("#gameScreen");
const prepScreen = document.querySelector("#prepScreen");

const nameInput = document.querySelector("#studentName");
const nameError = document.querySelector("#nameError");

const world = document.querySelector("#world");
const player = document.querySelector("#player");
const playerSprite = document.querySelector("#playerSprite");
const playerName = document.querySelector("#playerName");

const hudName = document.querySelector("#hudName");
const scoreEl = document.querySelector("#score");
const progressEl = document.querySelector("#progress");

const cpLayer = document.querySelector("#checkpointLayer");
const interaction = document.querySelector("#interactionMessage");

const modal = document.querySelector("#checkpointModal");
const modalTitle = document.querySelector("#modalTitle");
const activityArea = document.querySelector("#activityArea");

const interactBtn = document.querySelector("#interactBtn");
const resultModal = document.querySelector("#resultModal");

// =====================================================
// START GAME
// =====================================================

function startGame() {
  const name = nameInput.value.trim();

  if (!name) {
    nameError.textContent =
      "⚠️ Sila masukkan nama kamu dahulu.";
    nameInput.focus();
    return;
  }

  game.studentName = name;

  hudName.textContent = name;
  playerName.textContent = name;

  startScreen.classList.add("hidden");

  if (prepScreen) {
    prepScreen.classList.remove("hidden");
  } else {
    enterWorld();
  }
}

document
  .querySelector("#startBtn")
  .addEventListener("click", startGame);

nameInput.addEventListener("keydown", e => {
  if (e.key === "Enter") startGame();
});

nameInput.addEventListener("input", () => {
  nameError.textContent = "";
});

// =====================================================
// PREPARATION SCREEN
// =====================================================

let micTestRecognition = null;
let micTestPassed = false;

const testMicBtn = document.querySelector("#testMicBtn");
const readyBtn = document.querySelector("#readyBtn");
const micTestStatus =
  document.querySelector("#micTestStatus");

if (readyBtn) {
  readyBtn.disabled = false;
}

if (testMicBtn) {
  testMicBtn.addEventListener("click", testMicrophone);
}

if (readyBtn) {
  readyBtn.addEventListener("click", enterWorld);
}

function testMicrophone() {
  const SR =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SR) {
    if (micTestStatus) {
      micTestStatus.textContent =
        "⚠️ Ujian suara tidak disokong oleh pelayar ini. Kamu masih boleh terus bermain.";

      micTestStatus.className =
        "mic-test-status warning";
    }

    return;
  }

  if (micTestRecognition) {
    try {
      micTestRecognition.stop();
    } catch (e) {}
  }

  micTestPassed = false;

  const r = new SR();

  r.lang = "ms-MY";
  r.continuous = false;
  r.interimResults = true;
  r.maxAlternatives = 3;

  micTestRecognition = r;

  if (micTestStatus) {
    micTestStatus.textContent =
      '🎙️ Sedang mendengar... Sebut "Hai, PeTaRa!"';

    micTestStatus.className =
      "mic-test-status listening";
  }

  let heard = "";

  r.onresult = event => {
    heard = "";

    for (
      let i = event.resultIndex;
      i < event.results.length;
      i++
    ) {
      heard +=
        " " + event.results[i][0].transcript;
    }

    const text = norm(heard);

    if (
      text.includes("hai") ||
      text.includes("petara") ||
      text.includes("pe tara")
    ) {
      micTestPassed = true;

      if (micTestStatus) {
        micTestStatus.textContent =
          "✅ Mikrofon berfungsi dengan baik. Anda sudah bersedia!";

        micTestStatus.className =
          "mic-test-status success";
      }

      try {
        r.stop();
      } catch (e) {}
    }

    else if (micTestStatus) {
      micTestStatus.textContent =
        `🎙️ Suara dikesan: "${heard.trim()}"`;
    }
  };

  r.onerror = event => {
    if (!micTestStatus) return;

    if (
      event.error === "not-allowed" ||
      event.error === "service-not-allowed"
    ) {
      micTestStatus.textContent =
        "⚠️ Mikrofon tidak dapat digunakan. Sila benarkan akses kepada mikrofon pada peranti anda dan cuba lagi.";
    }

    else if (event.error === "no-speech") {
      micTestStatus.textContent =
        "🎤 Suara belum dapat dikesan. Cuba sekali lagi.";
    }

    else {
      micTestStatus.textContent =
        "⚠️ Mikrofon belum dapat diuji. Cuba sekali lagi.";
    }

    micTestStatus.className =
      "mic-test-status warning";
  };

  r.onend = () => {
    micTestRecognition = null;

    if (
      !micTestPassed &&
      micTestStatus &&
      !micTestStatus.textContent.includes("⚠️")
    ) {
      micTestStatus.textContent =
        "🎤 Suara belum dapat dikesan. Cuba UJI MIKROFON sekali lagi.";

      micTestStatus.className =
        "mic-test-status warning";
    }
  };

  try {
    r.start();
  }

  catch (e) {
    if (micTestStatus) {
      micTestStatus.textContent =
        "⚠️ Mikrofon belum dapat dimulakan. Cuba sekali lagi.";
    }
  }
}

function enterWorld() {
  if (micTestRecognition) {
    try {
      micTestRecognition.stop();
    } catch (e) {}

    micTestRecognition = null;
  }

  if (prepScreen) {
    prepScreen.classList.add("hidden");
  }

  startScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  createCheckpoints();
  updateHUD();
  resizeWorld();

  requestAnimationFrame(loop);
}

// =====================================================
// CHECKPOINT STATE
// =====================================================

function checkpointState(id) {
  if (game.completedCheckpoints.includes(id)) {
    return "completed";
  }

  if (id === game.currentCheckpoint) {
    return "active";
  }

  return "locked";
}

function assetFor(id, state) {
  return `assets/checkpoints/cp${id}-${state}.png`;
}

function createCheckpoints() {
  cpLayer.innerHTML = "";

  checkpoints.forEach(cp => {
    const el = document.createElement("div");

    el.className = "checkpoint";
    el.dataset.cp = cp.id;
    el.style.left = cp.x + "px";
    el.style.top = cp.y + "px";

    el.innerHTML =
      `<img alt="${cp.label}">`;

    cpLayer.appendChild(el);
  });

  const f = document.createElement("div");

  f.className = "checkpoint";
  f.dataset.cp = "finish";
  f.style.left = finish.x + "px";
  f.style.top = finish.y + "px";

  f.innerHTML =
    `<img alt="Penamat">`;

  cpLayer.appendChild(f);

  refreshCheckpointGraphics();
}

function refreshCheckpointGraphics() {
  checkpoints.forEach(cp => {
    const state = checkpointState(cp.id);

    const el =
      document.querySelector(
        `[data-cp="${cp.id}"]`
      );

    if (!el) return;

    el.className =
      `checkpoint ${state}`;

    el.querySelector("img").src =
      assetFor(cp.id, state);
  });

  const f =
    document.querySelector(
      '[data-cp="finish"]'
    );

  if (f) {
    const state =
      game.completedCheckpoints.length === 5
        ? "active"
        : "locked";

    f.className =
      `checkpoint ${state}`;

    f.querySelector("img").src =
      `assets/checkpoints/finish-${state}.png`;
  }
}

// =====================================================
// HUD
// =====================================================

function updateHUD() {
  scoreEl.textContent = game.score;

  progressEl.textContent =
    `${game.completedCheckpoints.length}/5`;
}

// =====================================================
// NEAREST CHECKPOINT
// =====================================================

function getNearestTarget() {
  let nearest = null;
  let best = Infinity;

  [...checkpoints, finish].forEach(cp => {
    const d =
      Math.hypot(
        game.player.x - cp.x,
        game.player.y - cp.y
      );

    if (d < best) {
      best = d;
      nearest = cp;
    }
  });

  return {
    target: nearest,
    distance: best
  };
}

// =====================================================
// INTERACTION
// =====================================================

function handleInteraction() {
  const {
    target,
    distance
  } = getNearestTarget();

  if (!target || distance > 92) {
    interaction.classList.add("hidden");
    interactBtn.classList.add("hidden");
    return;
  }

  interaction.classList.remove("hidden");
  interactBtn.classList.remove("hidden");

  if (target.id === "finish") {
    if (
      game.completedCheckpoints.length === 5
    ) {
      interaction.textContent =
        "🏆 Masuk ke PENAMAT";

      interactBtn.textContent =
        "🏆 PENAMAT";
    }

    else {
      interaction.textContent =
        "🔒 Selesaikan semua checkpoint dahulu!";

      interactBtn.classList.add("hidden");
    }

    return;
  }

  const state =
    checkpointState(target.id);

  if (state === "locked") {
    interaction.textContent =
      "🔒 Selesaikan checkpoint sebelumnya dahulu!";

    interactBtn.classList.add("hidden");
  }

  else if (state === "completed") {
    interaction.textContent =
      `✓ ${target.label} telah selesai`;

    interactBtn.classList.add("hidden");
  }

  else {
    interaction.textContent =
      `✨ ${target.label} — masuk misi`;

    interactBtn.textContent =
      "✨ MASUK MISI";
  }
}

function interact() {
  const {
    target,
    distance
  } = getNearestTarget();

  if (!target || distance > 92) return;

  if (target.id === "finish") {
    if (
      game.completedCheckpoints.length === 5
    ) {
      showResults();
    }

    return;
  }

  if (
    checkpointState(target.id) !== "active"
  ) {
    return;
  }

  game.modalCheckpoint = target.id;

  modalTitle.textContent =
    `Misi ${target.id}`;

  modal.classList.remove("hidden");

  keys.clear();

  openCheckpoint(target.id);
}

// =====================================================
// CLOSE CHECKPOINT
// =====================================================

document
  .querySelector("#closeModal")
  .addEventListener("click", () => {
    stopSpeech();
    stopRecognition(true);

    modal.classList.add("hidden");
  });

// =====================================================
// CHECKPOINT DATA
// =====================================================

let activityIndex = 0;

let recognition = null;
let isRecording = false;

let finalTranscript = "";
let interimTranscript = "";

const CP = {

  1: [
    {
      audio: "assets/audio/cp1-1.m4a",
      options: ["🥕", "🍎", "🌽"],
      correct: "🥕"
    },

    {
      audio: "assets/audio/cp1-2.m4a",
      options: ["✏️", "📏", "✂️"],
      correct: "✏️"
    }
  ],

  2: [
    {
      audio: "assets/audio/cp2-1.m4a",

      items: [
        ["🔪", "pisau"],
        ["🥄", "sudu"],
        ["🍴", "garpu"]
      ],

      target: ["🐟", "ikan"],
      correct: "pisau"
    },

    {
      audio: "assets/audio/cp2-2.m4a",

      items: [
        ["🧂", "garam"],
        ["🥄", "sudu"],
        ["🔪", "pisau"]
      ],

      target: ["🥣", "mangkuk"],
      correct: "garam"
    }
  ],

  3: [
    {
      audio: "assets/audio/cp3-1.m4a",
      keywords: ["tiga", "3"]
    },

    {
      audio: "assets/audio/cp3-2.m4a",
      keywords: ["biru"]
    }
  ],

  4: [
    {
      audio: "assets/audio/cp4-1.m4a",
      any: ["ya", "boleh", "bantu"]
    },

    {
      audio: "assets/audio/cp4-2.m4a",
      any: ["baik", "boleh", "beli"]
    },

    {
      audio: "assets/audio/cp4-3.m4a",
      all: ["cuka", "kicap", "garam"]
    }
  ],

  5: [
    {
      audio: "assets/audio/cp5-1.m4a",

      all: [
        "saya",
        "suka",
        "membaca",
        "buku"
      ]
    },

    {
      audio: "assets/audio/cp5-2.m4a",

      all: [
        "kami",
        "bermain",
        "bola",
        "di",
        "padang"
      ]
    }
  ]
};

// =====================================================
// CHECKPOINT INSTRUCTIONS
// =====================================================

const checkpointInstructions = {

  1: {
    icon: "👂",

    title:
      "Dengar dan Pilih Jawapan",

    text:
      'Dengar audio dengan <strong>teliti</strong>, kemudian <strong>pilih jawapan yang betul</strong>.'
  },

  2: {
    icon: "👂",

    title:
      "Dengar dan Lakukan",

    text:
      'Dengar arahan dengan <strong>teliti</strong>, kemudian <strong>seret objek yang betul ke tempat yang sesuai</strong>.'
  },

  3: {
    icon: "🎤",

    title:
      "Dengar dan Berbual",

    text:
      'Dengar dengan <strong>teliti</strong>, kemudian <strong>berikan jawapan secara lisan</strong>.'
  },

  4: {
    icon: "🗣️",

    title:
      "Dengar dan Berikan Respons",

    text:
      'Dengar dengan <strong>teliti</strong>, kemudian <strong>berikan respons yang sesuai</strong>.'
  },

  5: {
    icon: "🎙️",

    title:
      "Dengar dan Sebut Semula",

    text:
      'Dengar ayat dengan <strong>teliti</strong>, kemudian <strong>sebut semula ayat yang didengar</strong>.'
  }

};

// =====================================================
// OPEN CHECKPOINT
// =====================================================

function openCheckpoint(id) {
  activityIndex = 0;

  stopSpeech();
  stopRecognition(true);

  showCheckpointInstruction(id);
}

// =====================================================
// INSTRUCTION SCREEN
// =====================================================

function showCheckpointInstruction(id) {
  const info =
    checkpointInstructions[id];

  modalTitle.textContent =
    `Misi ${id}`;

  activityArea.innerHTML = `
    <div class="instruction-screen">

      <div class="instruction-icon">
        ${info.icon}
      </div>

      <h3>
        ${info.title}
      </h3>

      <p>
        ${info.text}
      </p>

      <div class="activity-actions">

        <button
          id="instructionDoneBtn"
          class="primary-btn"
        >
          ✅ SAYA SUDAH FAHAM
        </button>

      </div>

    </div>
  `;

  const instructionDoneBtn =
    document.querySelector(
      "#instructionDoneBtn"
    );

  instructionDoneBtn.onclick = () => {
    renderActivity(id);
  };
}

// =====================================================
// ACTIVITY SHELL
// =====================================================

function shell(title, total, body) {

  const missionNumber =
    game.modalCheckpoint || "";

  const questionNumber =
    activityIndex + 1;

  activityArea.classList.remove(
    "outer-question-1",
    "outer-question-2",
    "outer-question-3"
  );

  activityArea.classList.add(
    `outer-question-${questionNumber}`
  );

  activityArea.innerHTML = `

    <div class="question-page">

      <div class="activity-mission">
        🚩 MISI ${missionNumber}
      </div>

      <div class="activity-question">
        SOALAN ${questionNumber}
      </div>

      ${body}

      <div class="activity-title">
        ${title}
      </div>

      <div
        id="feedback"
        class="feedback"
      ></div>

    </div>
  `;
}

// =====================================================
// RENDER ACTIVITY
// =====================================================

function renderActivity(id) {
  stopSpeech();
  

  const d =
    CP[id][activityIndex];

  const total =
    CP[id].length;

  if (id === 1) {
    return cp1(d, total);
  }

  if (id === 2) {
    return cp2(d, total);
  }

  renderVoice(
    d,
    total,

    id === 3
      ? "Dengar dan Berbual"
      : id === 4
        ? "Dengar dan Berikan Respons"
        : "Dengar dan Sebut Semula",

    id === 4,
    id === 5
  );
}

// =====================================================
// AUDIO
// =====================================================

let currentAudio = null;


// =====================================================
// IOS / IPADOS AUDIO SESSION
// =====================================================

function setAudioPlaybackMode() {

  try {

    if (
      navigator.audioSession &&
      "type" in navigator.audioSession
    ) {

      navigator.audioSession.type = "playback";

    }

  } catch (e) {

    console.log("Audio playback mode tidak tersedia.");

  }
}




// =====================================================
// PLAY AUDIO
// =====================================================

function speak(src) {

  stopSpeech();

  // Pastikan iPhone/iPad berada dalam mod media
  setAudioPlaybackMode();

  currentAudio = new Audio(src);

  currentAudio.muted = false;
  currentAudio.volume = 1.0;
  currentAudio.preload = "auto";

  currentAudio.addEventListener(
    "canplaythrough",

    function playAudio() {

      if (!currentAudio) return;

      // Pastikan sekali lagi sebelum play
      setAudioPlaybackMode();

      currentAudio.muted = false;
      currentAudio.volume = 1.0;

      currentAudio
        .play()
        .catch(() => {

          fb(
            "🔊 Audio tidak dapat dimainkan. Tekan DENGAR AUDIO sekali lagi.",
            0
          );

        });

    },

    { once: true }
  );

  currentAudio.load();
}


// =====================================================
// STOP AUDIO
// =====================================================

function stopSpeech() {

  if (currentAudio) {

    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;

  }

}
// =====================================================
// FEEDBACK
// =====================================================

function fb(text, goodFeedback) {

  const el =
    document.querySelector("#feedback");

  if (!el) return;

  el.textContent = text;

  el.className =
    `feedback ${
      goodFeedback
        ? "good"
        : "bad"
    }`;
}

function good() {

  const messages = [
    "⭐ Hebat! Jawapan kamu betul!",
    "🎉 Tahniah! Kamu berjaya!",
    "🌟 Bagus! Teruskan!",
    "🏆 Syabas! Jawapan tepat!"
  ];

  return messages[
    Math.floor(
      Math.random() *
      messages.length
    )
  ];
}

function bad() {

  const messages = [
    "💪 Hampir betul. Cuba sekali lagi!",
    "👂 Dengar semula dengan teliti.",
    "🌱 Cuba lagi. Kamu pasti boleh!",
    "🔊 Tekan DENGAR AUDIO dan cuba lagi."
  ];

  return messages[
    Math.floor(
      Math.random() *
      messages.length
    )
  ];
}

// =====================================================
// CP1
// =====================================================

function cp1(d, total) {

  shell(
    "Dengar dan Pilih Jawapan",
    total,
    `
      <div class="activity-actions">

        <button
          class="audio-btn"
          id="listenBtn"
        >
          🔊 DENGAR AUDIO
        </button>

      </div>

      <div class="picture-options">

        ${
          d.options
            .map(
              option => `
                <button
                  class="picture-option"
                  data-a="${option}"
                >
                  ${option}
                </button>
              `
            )
            .join("")
        }

      </div>
    `
  );

  const listenBtn =
    document.querySelector("#listenBtn");

  listenBtn.onclick = () =>
    speak(d.audio);

  document
    .querySelectorAll(".picture-option")
    .forEach(button => {

      button.onclick = () => {

        if (
          button.dataset.a ===
          d.correct
        ) {

          fb(good(), 1);
          advance();
        }

        else {

          fb(bad(), 0);

        }
      };
    });
}

// =====================================================
// CP2
// =====================================================

function cp2(d, total) {

  shell(
    "Dengar dan Lakukan",
    total,
    `
      <div class="activity-actions">

        <button
          class="audio-btn"
          id="listenBtn"
        >
          🔊 DENGAR AUDIO
        </button>

      </div>

      <div class="kitchen">

        <div class="drag-zone">

          ${
            d.items
              .map(
                item => `
                  <div
                    class="drag-item"
                    draggable="true"
                    data-value="${item[1]}"
                  >
                    ${item[0]}
                  </div>
                `
              )
              .join("")
          }

        </div>

        <div
          class="drop-zone"
          id="dropZone"
          data-target="${d.target[1]}"
        >
          ${d.target[0]}
        </div>

      </div>
    `
  );

  const listenBtn =
    document.querySelector("#listenBtn");

  listenBtn.onclick = () =>
    speak(d.audio);

  const items =
    document.querySelectorAll(
      ".drag-item"
    );

  const zone =
    document.querySelector(
      "#dropZone"
    );

  let selected = null;

  items.forEach(item => {

    item.addEventListener(
      "dragstart",
      e => {

        e.dataTransfer.setData(
          "text/plain",
          item.dataset.value
        );

      }
    );

    item.addEventListener(
      "click",
      () => {

        items.forEach(x =>
          x.classList.remove(
            "selected"
          )
        );

        item.classList.add(
          "selected"
        );

        selected =
          item.dataset.value;
      }
    );

    item.addEventListener(
      "touchend",
      e => {

        e.preventDefault();

        items.forEach(x =>
          x.classList.remove(
            "selected"
          )
        );

        item.classList.add(
          "selected"
        );

        selected =
          item.dataset.value;
      },
      {
        passive: false
      }
    );

  });

  zone.addEventListener(
    "dragover",
    e => {
      e.preventDefault();
    }
  );

  zone.addEventListener(
    "drop",
    e => {

      e.preventDefault();

      const value =
        e.dataTransfer.getData(
          "text/plain"
        );

      checkDrop(value);

    }
  );

  zone.addEventListener(
    "click",
    () => {

      if (selected) {
        checkDrop(selected);
      }

    }
  );

  zone.addEventListener(
    "touchend",
    e => {

      if (!selected) return;

      e.preventDefault();

      checkDrop(selected);

    },
    {
      passive: false
    }
  );

  function checkDrop(value) {

    if (
      value ===
      d.correct
    ) {

      fb(good(), 1);
      advance();
    }

    else {

      fb(bad(), 0);

    }
  }
}
// =====================================================
// TEXT NORMALIZATION
// =====================================================

function norm(text = "") {

  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-z0-9\s]/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}


// =====================================================
// VOICE ACTIVITIES
// Misi 3, Misi 4 dan Misi 5
// =====================================================

function renderVoice(
  d,
  total,
  title,
  isCP4 = false,
  isCP5 = false
) {

  const audioText =
    isCP5
      ? "🔊 DENGAR AYAT"
      : "🔊 DENGAR AUDIO";

  shell(
    title,
    total,
    `
      <div class="activity-actions">

        <button
          class="audio-btn"
          id="listenBtn"
        >
          ${audioText}
        </button>

      </div>

      ${
        isCP4
          ? `
            <div class="goods">
              🧂 🧴 🥫
            </div>
          `
          : ""
      }

      <div
        id="micIndicator"
        class="mic-indicator"
      >
        🎤 Mikrofon belum aktif
      </div>

      <div class="activity-actions">

        <button
          class="record-btn"
          id="recordBtn"
        >
          🎙️ MULA RAKAM
        </button>

      </div>

      <div
        id="statusLine"
        class="status-line"
      ></div>

      <div
        id="transcript"
        class="transcript"
      >
        Respons suara akan dipaparkan di sini.
      </div>
    `
  );

  const listenBtn =
    document.querySelector(
      "#listenBtn"
    );

  const recordBtn =
    document.querySelector(
      "#recordBtn"
    );

  listenBtn.onclick = () => {
    speak(d.audio);
  };

  /*
    PENTING UNTUK MOBILE:
    SpeechRecognition dimulakan terus
    daripada tindakan pengguna menekan butang.
  */

  recordBtn.onclick = () => {

    if (isRecording) {

      stopRecognition(false);

    }

    else {

      startRecognition(
        d,
        isCP4,
        isCP5
      );

    }
  };
}


// =====================================================
// SPEECH RECOGNITION HELPERS
// =====================================================

function getSpeechRecognition() {

  return (
    window.SpeechRecognition ||
    window.webkitSpeechRecognition ||
    null
  );
}


function setMicIndicator(
  active,
  text
) {

  const indicator =
    document.querySelector(
      "#micIndicator"
    );

  if (!indicator) return;

  indicator.textContent =
    text;

  indicator.classList.toggle(
    "active",
    !!active
  );
}


function setRecordButton(
  recording
) {

  const button =
    document.querySelector(
      "#recordBtn"
    );

  if (!button) return;

  if (recording) {

    button.textContent =
      "⏹️ BERHENTI RAKAM";

    button.classList.add(
      "recording"
    );

  }

  else {

    button.textContent =
      "🎙️ MULA RAKAM";

    button.classList.remove(
      "recording"
    );

  }
}


function setStatus(
  text = ""
) {

  const el =
    document.querySelector(
      "#statusLine"
    );

  if (!el) return;

  el.textContent =
    text;
}


function setTranscript(
  text = ""
) {

  const el =
    document.querySelector(
      "#transcript"
    );

  if (!el) return;

  el.textContent =
    text;
}


// =====================================================
// SPEECH RECOGNITION STATE
// SIMPLE VERSION — SAME APPROACH AS MIC TEST
// =====================================================

let recognitionSession = 0;
let recognitionShouldStop = false;
let recognitionEvaluated = false;

let currentVoiceData = null;
let currentVoiceIsCP4 = false;
let currentVoiceIsCP5 = false;


// =====================================================
// START RECOGNITION
// =====================================================

function startRecognition(
  d,
  isCP4 = false,
  isCP5 = false
) {

  const SR = getSpeechRecognition();

  if (!SR) {

    setStatus(
      "⚠️ Rakaman suara tidak disokong oleh pelayar ini."
    );

    return;
  }


  // Pastikan tiada recognition lama tertinggal
  if (recognition) {

    try {
      recognition.abort();
    } catch (e) {}

    recognition = null;
  }


  stopSpeech();


  // Simpan soalan semasa
  currentVoiceData = d;
  currentVoiceIsCP4 = isCP4;
  currentVoiceIsCP5 = isCP5;


  // Reset rakaman
  finalTranscript = "";
  interimTranscript = "";

  recognitionShouldStop = false;
  recognitionEvaluated = false;

  recognitionSession++;

  const thisSession =
    recognitionSession;


  // Recognition BARU setiap kali tekan MULA RAKAM
  const r =
    new SR();

  recognition = r;


  // Sama seperti UJI MIKROFON
  r.lang = "ms-MY";
  r.continuous = false;
  r.interimResults = true;
  r.maxAlternatives = 5;


  setTranscript(
    "Mula bertutur..."
  );

  setStatus(
    "🎙️ Membuka mikrofon..."
  );

  setMicIndicator(
    true,
    "🎤 Membuka mikrofon..."
  );


  // ===================================================
  // START
  // ===================================================

  r.onstart = () => {

    if (
      thisSession !== recognitionSession
    ) {
      return;
    }

    isRecording = true;

    setRecordButton(true);

    setMicIndicator(
      true,
      "🎙️ Mikrofon aktif — sedang mendengar..."
    );

    setStatus(
      "Saya sedang mendengar..."
    );
  };


  // ===================================================
  // SPEECH START
  // ===================================================

  r.onspeechstart = () => {

    if (
      thisSession !== recognitionSession
    ) {
      return;
    }

    setMicIndicator(
      true,
      "🗣️ Suara dikesan"
    );

    setStatus(
      "🗣️ Suara sedang dikesan..."
    );
  };


  // ===================================================
  // RESULT
  // ===================================================

  r.onresult = event => {

    if (
      thisSession !== recognitionSession
    ) {
      return;
    }


    let finalText = "";
    let interimText = "";


    for (
      let i = event.resultIndex;
      i < event.results.length;
      i++
    ) {

      const result =
        event.results[i];

      const text =
        result[0].transcript;


      if (result.isFinal) {

        finalText +=
          " " + text;

      } else {

        interimText +=
          " " + text;
      }
    }


    if (finalText) {

      finalTranscript +=
        " " + finalText;
    }


    interimTranscript =
      interimText;


    const display =
      (
        finalTranscript +
        " " +
        interimTranscript
      )
        .replace(/\s+/g, " ")
        .trim();


    if (display) {

      setTranscript(display);

      setStatus(
        "✅ Suara dikesan."
      );

      setMicIndicator(
        true,
        "🗣️ Suara dikesan"
      );
    }
  };


  // ===================================================
  // ERROR
  // ===================================================

  r.onerror = event => {

    if (
      thisSession !== recognitionSession
    ) {
      return;
    }


    if (
      event.error === "aborted"
    ) {
      return;
    }


    if (
      event.error === "not-allowed" ||
      event.error === "service-not-allowed"
    ) {

      setStatus(
        "⚠️ Sila benarkan akses mikrofon."
      );

      return;
    }


    if (
      event.error === "no-speech"
    ) {

      setStatus(
        "🎤 Suara belum dapat dikesan. Tekan MULA RAKAM dan cuba lagi."
      );

      return;
    }


    if (
      event.error === "audio-capture"
    ) {

      setStatus(
        "⚠️ Mikrofon tidak dapat digunakan. Cuba sekali lagi."
      );

      return;
    }


    setStatus(
      "⚠️ Rakaman terganggu. Cuba sekali lagi."
    );
  };


  // ===================================================
  // END
  // ===================================================

 r.onend = () => {

    // Mic sudah tamat → pulangkan audio iPhone/iPad ke mod media
    setAudioPlaybackMode();

    if (
      thisSession !== recognitionSession
    ) {
      return;
    }


    if (recognition === r) {
      recognition = null;
    }


    isRecording = false;
    setRecordButton(false);

    setMicIndicator(
      false,
      "🎤 Mikrofon tidak aktif"
    );


    const heard =
      (
        finalTranscript +
        " " +
        interimTranscript
      )
        .replace(/\s+/g, " ")
        .trim();


    // Ada suara → terus nilai
    if (heard) {

      if (!recognitionEvaluated) {

        recognitionEvaluated = true;

        evaluateVoiceResponse(
          currentVoiceData,
          currentVoiceIsCP4,
          currentVoiceIsCP5
        );
      }

      return;
    }


    // Tiada suara
    if (!recognitionShouldStop) {

      setStatus(
        "🎤 Suara belum dapat dikesan. Tekan MULA RAKAM dan cuba lagi."
      );
    }
  };


  // ===================================================
  // MULAKAN
  // ===================================================

try {

  r.start();

} catch (err) {

  setAudioPlaybackMode();

    recognition = null;
    isRecording = false;

    setRecordButton(false);

    setMicIndicator(
      false,
      "🎤 Mikrofon tidak aktif"
    );

    setStatus(
      "🎤 Tekan MULA RAKAM sekali lagi."
    );
  }
}


// =====================================================
// STOP RECOGNITION
// =====================================================

function stopRecognition(silent = false) {

  const r = recognition;

  // ===================================================
  // TIADA RECOGNITION YANG SEDANG AKTIF
  // ===================================================

  if (!r) {

    isRecording = false;

    setRecordButton(false);

    if (silent) {
      finalTranscript = "";
      interimTranscript = "";
    }

    return;
  }


  // ===================================================
  // TUKAR SOALAN / KELUAR MISI
  // ===================================================

  if (silent) {

    recognitionShouldStop = true;
    recognitionEvaluated = true;

    /*
      PENTING UNTUK IPHONE / SAFARI:

      Jangan:
      - abort()
      - buang onend
      - terus recognition = null

      Biarkan WebKit tutup sesi sendiri.
    */

    try {

      r.stop();

    } catch (e) {

      if (recognition === r) {
        recognition = null;
      }

      isRecording = false;

      finalTranscript = "";
      interimTranscript = "";

      setRecordButton(false);

      setMicIndicator(
        false,
        "🎤 Mikrofon tidak aktif"
      );
    }

    return;
  }


  // ===================================================
  // MURID TEKAN BERHENTI RAKAM
  // ===================================================

  recognitionShouldStop = true;

  setStatus(
    "⏳ Memproses rakaman..."
  );

  setMicIndicator(
    false,
    "⏹️ Rakaman dihentikan"
  );

  try {

    r.stop();

  } catch (e) {

    if (recognition === r) {
      recognition = null;
    }

    isRecording = false;

    setRecordButton(false);

    const heard =
      (
        finalTranscript +
        " " +
        interimTranscript
      )
        .replace(/\s+/g, " ")
        .trim();

    if (
      heard &&
      !recognitionEvaluated
    ) {

      recognitionEvaluated = true;

      evaluateVoiceResponse(
        currentVoiceData,
        currentVoiceIsCP4,
        currentVoiceIsCP5
      );

    } else if (!heard) {

      setStatus(
        "🎤 Suara belum dapat dikesan. Tekan MULA RAKAM dan cuba lagi."
      );
    }
  }
}

// =====================================================
// VOICE RESPONSE EVALUATION
// =====================================================

function evaluateVoiceResponse(
  d,
  isCP4 = false,
  isCP5 = false
) {

  const raw =
    (
      finalTranscript +
      " " +
      interimTranscript
    ).trim();


  const spoken =
    norm(raw);


  // ===================================================
  // TIADA SUARA
  // ===================================================

  if (!spoken) {

    setTranscript(
      "Tiada suara yang dapat dikenal pasti."
    );


    setStatus(
      "🎤 Suara belum dapat dikesan. Sila cuba rakam sekali lagi."
    );


    fb(
      "🎤 Cuba rakam sekali lagi.",
      0
    );


    return;
  }


  setTranscript(
    raw
  );


  let correct =
    false;


  // ===================================================
  // MISI 3
  // Salah satu keyword diterima
  // ===================================================

  if (
    Array.isArray(
      d.keywords
    )
  ) {

    correct =
      d.keywords.some(
        keyword =>
          spoken.includes(
            norm(keyword)
          )
      );

  }


  // ===================================================
  // MISI 4
  // Salah satu respons diterima
  // ===================================================

  else if (
    Array.isArray(
      d.any
    )
  ) {

    correct =
      d.any.some(
        keyword =>
          spoken.includes(
            norm(keyword)
          )
      );

  }


  // ===================================================
  // MISI 4 SOALAN 3 / MISI 5
  // Semua keyword perlu ada
  // ===================================================

  else if (
    Array.isArray(
      d.all
    )
  ) {

    correct =
      d.all.every(
        keyword =>
          spoken.includes(
            norm(keyword)
          )
      );

  }


  // ===================================================
  // BETUL
  // ===================================================

  if (correct) {

    setStatus(
      "✅ Respons diterima."
    );


    fb(
      good(),
      1
    );


    advance();

  }


  // ===================================================
  // SALAH
  // ===================================================

  else {

    setStatus(
      "🔄 Cuba berikan respons sekali lagi."
    );


    fb(
      isCP5
        ? "👂 Dengar ayat semula dan cuba sebut dengan lebih lengkap."
        : isCP4
          ? "🗣️ Dengar semula dan berikan respons yang sesuai."
          : "👂 Dengar semula dan cuba jawab sekali lagi.",
      0
    );

  }
}
// =====================================================
// ADVANCE ACTIVITY
// =====================================================

function advance() {

  stopSpeech();

  stopRecognition(true);

  const id =
    game.modalCheckpoint;

  if (!id) return;

  /*
    CP4 memberikan 10 markah selepas
    keseluruhan misi selesai.

    Checkpoint lain memberikan
    10 markah bagi setiap aktiviti.
  */

  if (id !== 4) {

    game.score += 10;

    updateHUD();
  }

  window.setTimeout(
    () => {

      activityIndex += 1;

      if (
        activityIndex <
        CP[id].length
      ) {

        renderActivity(id);

      }

      else {

        completeCP(id);

      }
    },
    900
  );
}


// =====================================================
// COMPLETE CHECKPOINT
// =====================================================

function completeCP(id) {

  stopSpeech();

  stopRecognition(true);

  if (
    !game.completedCheckpoints.includes(
      id
    )
  ) {

    game.completedCheckpoints.push(
      id
    );
  }

  /*
    Misi 4:
    +10 selepas seluruh misi selesai.
  */

  if (id === 4) {

    game.score += 10;

  }

  if (id < 5) {

    game.currentCheckpoint =
      id + 1;

  }

  else {

    game.currentCheckpoint =
      6;

  }

  updateHUD();

  refreshCheckpointGraphics();

  activityArea.innerHTML = `

    <div class="instruction-screen">

      <div class="instruction-icon">
        ⭐
      </div>

      <h3>
        Misi ${id} Selesai!
      </h3>

      <p>
        Syabas! Kamu telah berjaya
        menyelesaikan Misi ${id}.
      </p>

      <div class="activity-actions">

        <button
          id="continueMapBtn"
          class="primary-btn"
        >
          🗺️ KEMBALI KE PETA
        </button>

      </div>

    </div>
  `;

  const continueMapBtn =
    document.querySelector(
      "#continueMapBtn"
    );

  continueMapBtn.onclick = () => {

    modal.classList.add(
      "hidden"
    );

    game.modalCheckpoint =
      null;

    handleInteraction();
  };
}


// =====================================================
// MOBILE INTERACTION BUTTON
// =====================================================

interactBtn.addEventListener(
  "pointerup",
  event => {

    event.preventDefault();

    interact();

  }
);


// =====================================================
// RESULT
// =====================================================

function showResults() {

  stopSpeech();

  stopRecognition(true);

  document
    .querySelector("#resultText")
    .textContent =
      `${game.studentName} telah berjaya menamatkan Kembara Si PeTaRa!`;

  document
    .querySelector("#resultScore")
    .textContent =
      game.score;

  resultModal.classList.remove(
    "hidden"
  );
}


document
  .querySelector("#restartBtn")
  .addEventListener(
    "click",
    () => location.reload()
  );


document
  .querySelector("#homeBtn")
  .addEventListener(
    "click",
    () => location.reload()
  );


// =====================================================
// KEYBOARD
// =====================================================

function setKey(
  key,
  down
) {

  const allowed = [
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "w",
    "a",
    "s",
    "d",
    "W",
    "A",
    "S",
    "D"
  ];

  if (
    !allowed.includes(key)
  ) {
    return;
  }

  down
    ? keys.add(
        key.toLowerCase()
      )
    : keys.delete(
        key.toLowerCase()
      );
}


window.addEventListener(
  "keydown",
  event => {

    if (
      [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight"
      ].includes(
        event.key
      )
    ) {

      event.preventDefault();

    }

    if (
      (
        event.key === "e" ||
        event.key === "E"
      ) &&
      modal.classList.contains(
        "hidden"
      ) &&
      !gameScreen.classList.contains(
        "hidden"
      )
    ) {

      interact();

    }

    setKey(
      event.key,
      true
    );
  }
);


window.addEventListener(
  "keyup",
  event =>

    setKey(
      event.key,
      false
    )
);


// =====================================================
// D-PAD
// =====================================================

document
  .querySelectorAll(
    "#dpad button"
  )
  .forEach(button => {

    const key =
      button.dataset.key.toLowerCase();

    const on = event => {

      event.preventDefault();

      keys.add(key);

      button.classList.add(
        "pressed"
      );
    };


    const off = event => {

      event.preventDefault();

      keys.delete(key);

      button.classList.remove(
        "pressed"
      );
    };


    button.addEventListener(
      "pointerdown",
      on
    );


    button.addEventListener(
      "pointerup",
      off
    );


    button.addEventListener(
      "pointercancel",
      off
    );


    button.addEventListener(
      "pointerleave",
      off
    );

  });


// =====================================================
// PLAYER MOVEMENT
// =====================================================

function updatePlayer(time) {

  if (
    !modal.classList.contains(
      "hidden"
    ) ||
    !resultModal.classList.contains(
      "hidden"
    )
  ) {

    return;

  }


  let dx = 0;
  let dy = 0;


  if (
    keys.has("arrowleft") ||
    keys.has("a")
  ) {

    dx--;

  }


  if (
    keys.has("arrowright") ||
    keys.has("d")
  ) {

    dx++;

  }


  if (
    keys.has("arrowup") ||
    keys.has("w")
  ) {

    dy--;

  }


  if (
    keys.has("arrowdown") ||
    keys.has("s")
  ) {

    dy++;

  }


  game.player.moving =
    dx !== 0 ||
    dy !== 0;


  if (
    dx &&
    dy
  ) {

    dx *= 0.707;
    dy *= 0.707;

  }


  if (dy > 0) {

    game.player.direction =
      "down";

  }

  else if (dy < 0) {

    game.player.direction =
      "up";

  }

  else if (dx < 0) {

    game.player.direction =
      "left";

  }

  else if (dx > 0) {

    game.player.direction =
      "right";

  }


  game.player.x =
    Math.max(
      70,
      Math.min(
        MAP_W - 70,
        game.player.x +
          dx *
          game.player.speed
      )
    );


  game.player.y =
    Math.max(
      100,
      Math.min(
        MAP_H - 30,
        game.player.y +
          dy *
          game.player.speed
      )
    );


  if (
    game.player.moving &&
    time - lastAnim > 130
  ) {

    game.player.frame =
      (
        game.player.frame %
        4
      ) + 1;

    lastAnim =
      time;

  }


  if (
    game.player.moving
  ) {

    playerSprite.src =
      `assets/player/petara-${game.player.direction}-${game.player.frame || 1}.png`;

  }

  else {

    playerSprite.src =
      game.player.direction ===
      "down"
        ? "assets/player/petara-idle.png"
        : `assets/player/petara-${game.player.direction}-1.png`;

  }


  player.style.left =
    game.player.x +
    "px";

  player.style.top =
    game.player.y +
    "px";
}


// =====================================================
// CAMERA
// =====================================================

function updateCamera() {

  const viewport =
    document.querySelector(
      "#worldViewport"
    );


  const vw =
    viewport.clientWidth;

  const vh =
    viewport.clientHeight;


  const scaledW =
    MAP_W *
    scale;

  const scaledH =
    MAP_H *
    scale;


  let tx =
    vw / 2 -
    game.player.x *
    scale;


  let ty =
    vh / 2 -
    game.player.y *
    scale;


  if (
    scaledW <= vw
  ) {

    tx =
      (
        vw -
        scaledW
      ) / 2;

  }

  else {

    tx =
      Math.min(
        0,
        Math.max(
          vw -
            scaledW,
          tx
        )
      );

  }


  if (
    scaledH <= vh
  ) {

    ty =
      (
        vh -
        scaledH
      ) / 2;

  }

  else {

    ty =
      Math.min(
        0,
        Math.max(
          vh -
            scaledH,
          ty
        )
      );

  }


  world.style.transform =
    `translate(${tx}px,${ty}px) scale(${scale})`;
}


// =====================================================
// RESPONSIVE WORLD
// =====================================================

function resizeWorld() {

  const viewport =
    document.querySelector(
      "#worldViewport"
    );


  const vw =
    viewport.clientWidth;

  const vh =
    viewport.clientHeight;


  const cover =
    Math.max(
      vw / MAP_W,
      vh / MAP_H
    );


  const portrait =
    vh > vw;


  const minimum =
    portrait
      ? 0.78
      : (
          vh <= 600
            ? 0.68
            : 0.72
        );


  scale =
    Math.max(
      minimum,
      cover
    );


  world.style.width =
    MAP_W +
    "px";

  world.style.height =
    MAP_H +
    "px";


  updateCamera();
}


window.addEventListener(
  "resize",
  resizeWorld
);


window.addEventListener(
  "orientationchange",
  () =>

    setTimeout(
      resizeWorld,
      180
    )
);


// =====================================================
// GAME LOOP
// =====================================================

function loop(time) {

  updatePlayer(time);

  updateCamera();

  handleInteraction();

  requestAnimationFrame(
    loop
  );
}
// redeploy
