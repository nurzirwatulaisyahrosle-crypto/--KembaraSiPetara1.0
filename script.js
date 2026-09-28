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

  // Selepas nama, pergi ke skrin persediaan.
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
  // Murid masih boleh masuk jika browser tidak menyokong
  // SpeechRecognition. Earphone/microphone ialah bantuan,
  // bukan syarat untuk membuka game.
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
          "✅ Mikrofon berfungsi! Kamu sudah bersedia.";
        micTestStatus.className =
          "mic-test-status success";
      }

      try {
        r.stop();
      } catch (e) {}
    } else if (micTestStatus) {
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
        "⚠️ Mikrofon belum dibenarkan. Benarkan penggunaan mikrofon dan cuba lagi.";
    } else if (event.error === "no-speech") {
      micTestStatus.textContent =
        "🎤 Suara belum dapat dikesan. Cuba sekali lagi.";
    } else {
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
  } catch (e) {
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
    } else {
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
    title: "Dengar dan Pilih Gambar",
    text:
      "Tekan DENGAR AUDIO. Dengar dengan teliti. Kemudian, pilih gambar yang betul."
  },

  2: {
    icon: "👂",
    title: "Dengar dan Lakukan",
    text:
      "Tekan DENGAR AUDIO. Dengar arahan dengan teliti. Kemudian, pilih barang dan letakkan pada tempat yang betul."
  },

  3: {
    icon: "🎤",
    title: "Dengar dan Jawab",
    text:
      "Tekan DENGAR AUDIO. Selepas mendengar, tekan MULA RAKAM dan jawab dengan suara. Tekan BERHENTI RAKAM apabila selesai."
  },

  4: {
    icon: "🗣️",
    title: "Misi Kedai Runcit Pak Ali",
    text:
      "Dengar percakapan dengan teliti. Tekan MULA RAKAM untuk memberikan jawapan. Tekan BERHENTI RAKAM apabila selesai."
  },

  5: {
    icon: "🎙️",
    title: "Dengar dan Ulang",
    text:
      "Tekan DENGAR AYAT. Selepas itu, tekan MULA RAKAM dan ulang ayat yang didengar. Tekan BERHENTI RAKAM apabila selesai."
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

      <h3>${info.title}</h3>

      <p>${info.text}</p>

      <div class="activity-actions">
        <button
          id="instructionDoneBtn"
          class="primary-btn"
        >
          ✅ SELESAI BACA ARAHAN
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
  activityArea.innerHTML = `
    <div class="activity-head">
      ${title} • ${activityIndex + 1}/${total}
    </div>

    ${body}

    <div
      id="feedback"
      class="feedback"
    ></div>
  `;
}

// =====================================================
// RENDER ACTIVITY
// =====================================================

function renderActivity(id) {
  stopSpeech();
  stopRecognition(true);

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
      ? "Dengar dan jawab dengan suara"
      : id === 4
        ? "Misi Kedai Runcit Pak Ali"
        : "Dengar dan ulang",

    id === 4,
    id === 5
  );
}

// =====================================================
// AUDIO
// =====================================================

let currentAudio = null;

function speak(src) {
  stopSpeech();

  currentAudio =
    new Audio(src);

  currentAudio.preload =
    "auto";

  currentAudio
    .play()
    .catch(() => {
      fb(
        "🔊 Audio tidak dapat dimainkan. Tekan DENGAR AUDIO sekali lagi.",
        0
      );
    });
}

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
      goodFeedback ? "good" : "bad"
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
      Math.random() * messages.length
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
      Math.random() * messages.length
    )
  ];
}

// =====================================================
// CP1
// =====================================================

function cp1(d, total) {
  shell(
    "Dengar dan pilih gambar",
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
          // Audio TIDAK dimainkan semula
          // secara automatik.
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
    "Dengar dan lakukan",
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
                    data-i="${item[1]}"
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
        >
          ${d.target[0]}
        </div>

      </div>
    `
  );

  const listenBtn =
    document.querySelector("#listenBtn");

  const dropZone =
    document.querySelector("#dropZone");

  listenBtn.onclick = () =>
    speak(d.audio);

  let selected = "";

  document
    .querySelectorAll(".drag-item")
    .forEach(item => {

      item.ondragstart = event => {
        event.dataTransfer.setData(
          "text/plain",
          item.dataset.i
        );
      };

      // Untuk telefon/tablet:
      // tekan barang, kemudian tekan sasaran.
      item.onclick = () => {
        selected =
          item.dataset.i;

        document
          .querySelectorAll(".drag-item")
          .forEach(x =>
            x.classList.remove("selected")
          );

        item.classList.add("selected");
      };
    });

  dropZone.ondragover = event =>
    event.preventDefault();

  dropZone.ondrop = event => {
    event.preventDefault();

    dropCheck(
      event.dataTransfer.getData(
        "text/plain"
      ),
      d
    );
  };

  dropZone.onclick = () => {
    if (selected) {
      dropCheck(selected, d);
    }
  };
}

function dropCheck(answer, d) {
  if (answer === d.correct) {
    fb(
      "⭐ Bagus! Kamu mengikut arahan dengan betul!",
      1
    );

    advance();
  }

  else {
    // Audio tidak dimainkan semula
    // secara automatik.
    fb(
      "👂 Belum tepat. Tekan DENGAR AUDIO dan cuba sekali lagi.",
      0
    );
  }
}

// =====================================================
// TEXT NORMALISATION
// =====================================================

function norm(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[.,!?;:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function any(text, words) {
  text = norm(text);

  return words.some(word =>
    text.includes(norm(word))
  );
}

function all(text, words) {
  text =
    " " + norm(text) + " ";

  return words.every(word =>
    text.includes(
      " " + norm(word) + " "
    )
  );
}

// =====================================================
// VOICE ACTIVITIES CP3 - CP5
// =====================================================

function renderVoice(
  d,
  total,
  title,
  dialog = false,
  repeat = false
) {
  shell(
    title,
    total,
    `
      <div class="activity-actions">

        <button
          class="audio-btn"
          id="listenBtn"
        >
          🔊 ${
            repeat
              ? "DENGAR AYAT"
              : "DENGAR AUDIO"
          }
        </button>

        <button
          class="record-btn"
          id="recordBtn"
        >
          🎙️ MULA RAKAM
        </button>

      </div>

      <div
        id="recordStatus"
        class="status-line"
      ></div>

      <div
        class="mic-indicator"
        id="micIndicator"
      >
        🎤 Mikrofon sedia
      </div>

      <div
        class="transcript"
        id="transcript"
      >
        ${
          repeat
            ? "Perkataan kamu akan muncul di sini..."
            : "Jawapan suara akan muncul di sini."
        }
      </div>

      ${
        dialog &&
        activityIndex === 2
          ? '<div class="goods">🍶 🧴 🧂</div>'
          : ""
      }
    `
  );

  const listenBtn =
    document.querySelector("#listenBtn");

  const recordBtn =
    document.querySelector("#recordBtn");

  listenBtn.onclick = () =>
    speak(d.audio);

  recordBtn.onclick = () =>
    toggleRec(d, repeat);
}

// =====================================================
// SPEECH RECOGNITION
// =====================================================

// =====================================================
// SPEECH RECOGNITION - STABLE VERSION
// CP3, CP4 & CP5
// =====================================================

let stopRequested = false;
let currentVoiceData = null;
let currentRepeatMode = false;
let recognitionStarting = false;


// =====================================================
// CREATE A COMPLETELY NEW RECOGNITION SESSION
// =====================================================

function newRec() {

  const SR =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SR) return null;

  const r = new SR();

  r.lang = "ms-MY";

  // PENTING:
  // Kita guna satu sesi rakaman yang bersih.
  // Jangan auto-restart recognition lama.
  r.continuous = true;
  r.interimResults = true;
  r.maxAlternatives = 3;


  // ---------------------------------------------------
  // MICROPHONE REALLY STARTED
  // ---------------------------------------------------

  r.onstart = () => {

    recognitionStarting = false;

    const indicator =
      document.querySelector("#micIndicator");

    const status =
      document.querySelector("#recordStatus");

    if (indicator) {
      indicator.textContent =
        "🟢 Mikrofon sedang mendengar...";

      indicator.classList.add("active");
    }

    if (status) {
      status.textContent =
        "🎙️ Sedang mendengar... Bercakap sekarang.";
    }
  };


  // ---------------------------------------------------
  // SPEECH DETECTED
  // ---------------------------------------------------

  r.onspeechstart = () => {

    const indicator =
      document.querySelector("#micIndicator");

    if (indicator) {
      indicator.textContent =
        "🗣️ Suara dikesan!";

      indicator.classList.add("active");
    }
  };


  // ---------------------------------------------------
  // SPEECH ENDED
  // ---------------------------------------------------

  r.onspeechend = () => {

    const indicator =
      document.querySelector("#micIndicator");

    if (
      indicator &&
      isRecording
    ) {
      indicator.textContent =
        "🎤 Mikrofon masih aktif. Teruskan bercakap atau tekan BERHENTI RAKAM.";
    }
  };


  // ---------------------------------------------------
  // GET TRANSCRIPT
  // ---------------------------------------------------

  r.onresult = event => {

    let newInterim = "";

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

        finalTranscript +=
          " " + text;

      } else {

        newInterim +=
          " " + text;
      }
    }

    interimTranscript =
      newInterim;

    const transcriptBox =
      document.querySelector("#transcript");

    const combined =
      (
        finalTranscript +
        " " +
        interimTranscript
      ).trim();

    if (transcriptBox) {

      transcriptBox.textContent =
        combined ||
        "🎙️ Sedang mendengar...";
    }
  };


  // ---------------------------------------------------
  // RECOGNITION ERROR
  // ---------------------------------------------------

  r.onerror = event => {

    console.log(
      "Speech recognition error:",
      event.error
    );

    const indicator =
      document.querySelector("#micIndicator");

    const status =
      document.querySelector("#recordStatus");


    // No speech bukan jawapan salah.
    if (event.error === "no-speech") {

      if (indicator) {
        indicator.textContent =
          "🎤 Belum dengar suara. Cuba bercakap sekali lagi.";
      }

      if (status) {
        status.textContent =
          "🎙️ Mikrofon masih menunggu suara...";
      }

      return;
    }


    // Permission microphone
    if (
      event.error === "not-allowed" ||
      event.error === "service-not-allowed"
    ) {

      isRecording = false;
      recognitionStarting = false;

      if (indicator) {
        indicator.textContent =
          "🔴 Mikrofon tidak dibenarkan.";
      }

      fb(
        "⚠️ Mikrofon belum dibenarkan. Benarkan penggunaan mikrofon dan cuba lagi.",
        0
      );

      updateRecordButton();

      return;
    }


    // Audio capture error
    if (event.error === "audio-capture") {

      isRecording = false;
      recognitionStarting = false;

      if (indicator) {
        indicator.textContent =
          "🔴 Mikrofon tidak dapat digunakan.";
      }

      fb(
        "⚠️ Mikrofon tidak dapat digunakan. Cuba rakam semula.",
        0
      );

      updateRecordButton();

      return;
    }


    // Other errors
    if (
      event.error !== "aborted"
    ) {

      if (indicator) {
        indicator.textContent =
          "⚠️ Rakaman terganggu. Cuba sekali lagi.";
      }
    }
  };


  // ---------------------------------------------------
  // RECOGNITION SESSION REALLY ENDED
  // ---------------------------------------------------

  r.onend = () => {

    recognitionStarting = false;

    const wasStopRequested =
      stopRequested;

    // Jangan restart recognition secara automatik.
    // Ini yang kita mahu elakkan supaya CP4 / CP5
    // tidak menggunakan sesi lama.
    isRecording = false;

    recognition = null;

    updateRecordButton();


    const indicator =
      document.querySelector("#micIndicator");

    if (indicator) {
      indicator.classList.remove("active");
    }


    // Kalau murid memang tekan BERHENTI RAKAM,
    // barulah kita nilai jawapan.
    if (
      wasStopRequested &&
      currentVoiceData
    ) {

      stopRequested = false;

      const dataToCheck =
        currentVoiceData;

      const repeatToCheck =
        currentRepeatMode;

      currentVoiceData = null;

      // Beri browser sedikit masa untuk
      // menyimpan transcript terakhir.
      setTimeout(() => {

        evalVoice(
          dataToCheck,
          repeatToCheck
        );

      }, 250);

      return;
    }


    // Jika browser menamatkan recognition sendiri
    // sebelum murid tekan BERHENTI,
    // jangan terus kata jawapan salah.
    if (
      !wasStopRequested
    ) {

      stopRequested = false;

      if (indicator) {

        const existingText =
          norm(
            finalTranscript +
            " " +
            interimTranscript
          );

        if (existingText) {

          indicator.textContent =
            "🎤 Suara sudah dikesan. Tekan MULA RAKAM jika mahu cuba semula.";

        } else {

          indicator.textContent =
            "🎤 Rakaman berhenti. Tekan MULA RAKAM dan cuba lagi.";
        }
      }
    }
  };


  return r;
}


// =====================================================
// START / STOP RECORDING
// =====================================================

function toggleRec(d, repeat) {

  // ---------------------------------------------------
  // START A NEW RECORDING
  // ---------------------------------------------------

  if (!isRecording && !recognitionStarting) {

    startFreshRecording(
      d,
      repeat
    );

    return;
  }


  // ---------------------------------------------------
  // STOP RECORDING
  // ---------------------------------------------------

  if (isRecording) {

    stopRequested = true;

    isRecording = false;

    const status =
      document.querySelector("#recordStatus");

    const indicator =
      document.querySelector("#micIndicator");

    if (status) {
      status.textContent =
        "⏳ Memproses suara...";
    }

    if (indicator) {
      indicator.textContent =
        "⏳ Sedang menyemak rakaman...";
    }

    updateRecordButton();


    if (recognition) {

      try {

        // STOP, bukan abort.
        // Stop membenarkan browser menghantar
        // transcript terakhir sebelum onend.
        recognition.stop();

      } catch (error) {

        console.log(
          "Recognition stop error:",
          error
        );

        recognition = null;

        setTimeout(() => {

          evalVoice(
            currentVoiceData,
            currentRepeatMode
          );

          currentVoiceData = null;
          stopRequested = false;

        }, 300);
      }

    } else {

      setTimeout(() => {

        evalVoice(
          currentVoiceData,
          currentRepeatMode
        );

        currentVoiceData = null;
        stopRequested = false;

      }, 300);
    }
  }
}


// =====================================================
// START A COMPLETELY FRESH RECORDING
// =====================================================

function startFreshRecording(
  d,
  repeat
) {

  // Simpan soalan yang sedang dijawab.
  currentVoiceData = d;
  currentRepeatMode = repeat;

  stopRequested = false;


  // ---------------------------------------------------
  // 1. STOP AUDIO COMPLETELY
  // ---------------------------------------------------

  stopSpeech();


  // ---------------------------------------------------
  // 2. DESTROY OLD RECOGNITION SESSION
  // ---------------------------------------------------

  if (recognition) {

    recognition.onend = null;
    recognition.onerror = null;
    recognition.onresult = null;

    try {
      recognition.abort();
    } catch (error) {}

    recognition = null;
  }


  // ---------------------------------------------------
  // 3. CLEAR OLD TRANSCRIPT
  // ---------------------------------------------------

  finalTranscript = "";
  interimTranscript = "";


  const transcriptBox =
    document.querySelector("#transcript");

  const indicator =
    document.querySelector("#micIndicator");

  const status =
    document.querySelector("#recordStatus");


  if (transcriptBox) {
    transcriptBox.textContent =
      "⏳ Membuka mikrofon...";
  }

  if (indicator) {
    indicator.textContent =
      "⏳ Menyediakan mikrofon...";

    indicator.classList.remove("active");
  }

  if (status) {
    status.textContent =
      "⏳ Sila tunggu...";
  }


  recognitionStarting = true;

  updateRecordButton();


  // ---------------------------------------------------
  // 4. SMALL DELAY
  //
  // Memberi masa kepada audio lama untuk benar-benar
  // berhenti sebelum SpeechRecognition dibuka.
  // ---------------------------------------------------

  setTimeout(() => {

    const freshRecognition =
      newRec();


    if (!freshRecognition) {

      recognitionStarting = false;
      isRecording = false;

      updateRecordButton();

      fb(
        "🎙️ Rakaman suara tidak disokong oleh pelayar ini.",
        0
      );

      if (indicator) {
        indicator.textContent =
          "🔴 Rakaman suara tidak disokong.";
      }

      return;
    }


    recognition =
      freshRecognition;

    isRecording = true;


    try {

      recognition.start();

      updateRecordButton();

    } catch (error) {

      console.log(
        "Recognition start error:",
        error
      );

      recognitionStarting = false;
      isRecording = false;

      recognition = null;

      updateRecordButton();

      if (indicator) {
        indicator.textContent =
          "⚠️ Mikrofon belum dapat dimulakan.";
      }

      fb(
        "⚠️ Mikrofon belum dapat dimulakan. Tekan MULA RAKAM dan cuba lagi.",
        0
      );
    }

  }, 400);
}


// =====================================================
// UPDATE RECORD BUTTON
// =====================================================

function updateRecordButton() {

  const button =
    document.querySelector("#recordBtn");

  if (!button) return;


  if (recognitionStarting) {

    button.textContent =
      "⏳ MEMBUKA MIKROFON...";

    button.classList.remove(
      "recording"
    );

    button.disabled = true;

    return;
  }


  button.disabled = false;


  if (isRecording) {

    button.textContent =
      "⏹️ BERHENTI RAKAM";

    button.classList.add(
      "recording"
    );

  } else {

    button.textContent =
      "🎙️ MULA RAKAM";

    button.classList.remove(
      "recording"
    );
  }
}


// =====================================================
// OLD recBtn COMPATIBILITY
// =====================================================

function recBtn() {
  updateRecordButton();
}


// =====================================================
// STOP / DESTROY RECOGNITION
// =====================================================

function stopRecognition(
  clear = false
) {

  stopRequested = false;
  isRecording = false;
  recognitionStarting = false;

  currentVoiceData = null;


  if (recognition) {

    // Putuskan event lama dahulu supaya
    // sesi lama tidak hidup semula.
    recognition.onend = null;
    recognition.onerror = null;
    recognition.onresult = null;

    try {
      recognition.abort();
    } catch (error) {}

    recognition = null;
  }


  if (clear) {

    finalTranscript = "";
    interimTranscript = "";
  }


  updateRecordButton();
}


// =====================================================
// EVALUATE VOICE
// =====================================================

function evalVoice(
  d,
  repeat
) {

  if (!d) return;


  const answer =
    norm(
      finalTranscript +
      " " +
      interimTranscript
    );


  const transcriptBox =
    document.querySelector("#transcript");

  const indicator =
    document.querySelector("#micIndicator");


  // ---------------------------------------------------
  // NO VOICE DETECTED
  // ---------------------------------------------------

  if (!answer) {

    if (transcriptBox) {

      transcriptBox.textContent =
        "🎤 Tiada suara dikesan.";
    }


    if (indicator) {

      indicator.textContent =
        "🔄 Tekan MULA RAKAM dan cuba sekali lagi.";

      indicator.classList.remove(
        "active"
      );
    }


    fb(
      "🎤 Suara belum dapat dikesan. Cuba rakam semula.",
      0
    );


    return;
  }


  // ---------------------------------------------------
  // SHOW WHAT THE BROWSER HEARD
  // ---------------------------------------------------

  if (transcriptBox) {

    transcriptBox.textContent =
      answer;
  }


  if (indicator) {

    indicator.textContent =
      "✅ Suara berjaya dikesan.";

    indicator.classList.remove(
      "active"
    );
  }


  // ---------------------------------------------------
  // CHECK ANSWER
  // ---------------------------------------------------

  let correct = false;


  if (d.keywords) {

    correct =
      any(
        answer,
        d.keywords
      );

  } else if (d.any) {

    correct =
      any(
        answer,
        d.any
      );

  } else if (d.all) {

    correct =
      all(
        answer,
        d.all
      );
  }


  // ---------------------------------------------------
  // CORRECT
  // ---------------------------------------------------

  if (correct) {

    fb(
      repeat
        ? "🌟 Hebat! Sebutan kamu lengkap!"
        : good(),
      1
    );


    advance();

    return;
  }


  // ---------------------------------------------------
  // WRONG / INCOMPLETE
  // ---------------------------------------------------

  let message =
    repeat
      ? "👂 Ada perkataan yang belum lengkap. Dengar dan cuba sekali lagi."
      : "🌱 Jawapan belum tepat. Dengar semula dan cuba rakam sekali lagi.";


  if (
    game.modalCheckpoint === 4 &&
    activityIndex === 2
  ) {

    message =
      "👂 Hampir betul. Cuba ingat semua barang tadi.";
  }


  fb(
    message,
    0
  );
}
// =====================================================
// ADVANCE
// =====================================================

function advance() {
  const cp =
    game.modalCheckpoint;

  if (cp !== 4) {
    game.score += 10;
  }

  updateHUD();

  setTimeout(() => {

    activityIndex++;

    if (
      activityIndex <
      CP[cp].length
    ) {
      renderActivity(cp);
    }

    else {
      completeCP(cp);
    }

  }, 750);
}

// =====================================================
// COMPLETE CHECKPOINT
// =====================================================

function completeCP(id) {
  if (
    game.completedCheckpoints.includes(id)
  ) {
    return;
  }

  if (id === 4) {
    game.score += 10;
  }

  game.completedCheckpoints.push(id);

  game.currentCheckpoint =
    id < 5
      ? id + 1
      : 6;

  updateHUD();
  refreshCheckpointGraphics();

  stopSpeech();
  stopRecognition(true);

  activityArea.innerHTML = `
    <div class="activity-head">
      🎉 CHECKPOINT ${id} SELESAI!
    </div>

    <p>
      Syabas, ${game.studentName}!
      Laluan seterusnya telah dibuka.
    </p>

    <button
      class="next-btn"
      id="backWorldBtn"
    >
      ➡️ KEMBALI KE DUNIA
    </button>
  `;

  const backWorldBtn =
    document.querySelector(
      "#backWorldBtn"
    );

  backWorldBtn.onclick = () => {
    modal.classList.add("hidden");
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

function setKey(key, down) {
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

  if (!allowed.includes(key)) {
    return;
  }

  down
    ? keys.add(key.toLowerCase())
    : keys.delete(key.toLowerCase());
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
      ].includes(event.key)
    ) {
      event.preventDefault();
    }

    if (
      (
        event.key === "e" ||
        event.key === "E"
      ) &&
      modal.classList.contains("hidden") &&
      !gameScreen.classList.contains("hidden")
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
    !modal.classList.contains("hidden") ||
    !resultModal.classList.contains("hidden")
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
    dx !== 0 || dy !== 0;

  if (dx && dy) {
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
          dx * game.player.speed
      )
    );

  game.player.y =
    Math.max(
      100,
      Math.min(
        MAP_H - 30,
        game.player.y +
          dy * game.player.speed
      )
    );

  if (
    game.player.moving &&
    time - lastAnim > 130
  ) {
    game.player.frame =
      (game.player.frame % 4) + 1;

    lastAnim = time;
  }

  if (game.player.moving) {
    playerSprite.src =
      `assets/player/petara-${game.player.direction}-${game.player.frame || 1}.png`;
  }

  else {
    playerSprite.src =
      game.player.direction === "down"
        ? "assets/player/petara-idle.png"
        : `assets/player/petara-${game.player.direction}-1.png`;
  }

  player.style.left =
    game.player.x + "px";

  player.style.top =
    game.player.y + "px";
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
    MAP_W * scale;

  const scaledH =
    MAP_H * scale;

  let tx =
    vw / 2 -
    game.player.x * scale;

  let ty =
    vh / 2 -
    game.player.y * scale;

  if (scaledW <= vw) {
    tx =
      (vw - scaledW) / 2;
  }

  else {
    tx =
      Math.min(
        0,
        Math.max(
          vw - scaledW,
          tx
        )
      );
  }

  if (scaledH <= vh) {
    ty =
      (vh - scaledH) / 2;
  }

  else {
    ty =
      Math.min(
        0,
        Math.max(
          vh - scaledH,
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
    MAP_W + "px";

  world.style.height =
    MAP_H + "px";

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

  requestAnimationFrame(loop);
}
