const segments = [
  { label: "৳50", amount: 50 },
  { label: "৳100", amount: 100 },
  { label: "৳200", amount: 200 },
  { label: "৳500", amount: 500 },
  { label: "৳1000", amount: 1000 },
  { label: "৳2000", amount: 2000 },
  { label: "৳5000", amount: 5000 },
  { label: "Try Again", amount: 0 }
];

const SITE_URL = "https://elegant-frangipane-0276a0.netlify.app/?v=4";

const relations = [
  "Soulmate",
  "Best Friend",
  "Situationship Mate",
  "Lover",
  "Hater",
  "Mother",
  "Father",
  "Brother",
  "Sister"
];

const wheel = document.getElementById("wheel");
const wheelLabels = document.getElementById("wheelLabels");
const spinBtn = document.getElementById("spinBtn");
const spinCenter = document.getElementById("spinCenter");
const modal = document.getElementById("resultModal");
const resultAmount = document.getElementById("resultAmount");
const friendName = document.getElementById("friendName");
const friendAvatar = document.getElementById("friendAvatar");
const friendDesc = document.getElementById("friendDesc");
const resultMessage = document.getElementById("resultMessage");
const shareBtn = document.getElementById("shareBtn");
const closeModal = document.getElementById("closeModal");
const spinAgainBtn = document.getElementById("spinAgainBtn");
const copyBtn = document.getElementById("copyBtn");
const soundToggle = document.getElementById("soundToggle");
const confettiToggle = document.getElementById("confettiToggle");
const confetti = document.getElementById("confetti");

let currentRotation = 0;
let spinning = false;
let pendingIndex = 0;
let soundOn = true;
let confettiOn = true;

const segmentAngle = 360 / segments.length;
const START_ANGLE = -90;
const POINTER_ANGLE = -90;

function getResultIndexFromLabels() {
  const labels = Array.from(wheelLabels.querySelectorAll(".wheel-label"));
  if (!labels.length) {
    return pendingIndex;
  }
  const wheelRect = wheel.getBoundingClientRect();
  const cx = wheelRect.left + wheelRect.width / 2;
  const cy = wheelRect.top + wheelRect.height / 2;
  const pointerAngle = -Math.PI / 2;

  let bestIndex = pendingIndex;
  let bestDiff = Infinity;

  labels.forEach((label) => {
    const rect = label.getBoundingClientRect();
    const lx = rect.left + rect.width / 2;
    const ly = rect.top + rect.height / 2;
    const ang = Math.atan2(ly - cy, lx - cx);
    const diff = Math.abs(Math.atan2(Math.sin(ang - pointerAngle), Math.cos(ang - pointerAngle)));
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIndex = Number(label.dataset.index);
    }
  });

  return bestIndex;
}

function buildLabels() {
  wheelLabels.innerHTML = "";
  const radius = wheel.offsetWidth / 2;
  const labelRadius = radius * 0.72;

  segments.forEach((segment, index) => {
    const label = document.createElement("div");
    label.className = "wheel-label";
    if (segment.label.toLowerCase().includes("try")) {
      label.classList.add("try-again");
    }
    label.textContent = segment.label;
    label.dataset.index = index;

    const angle = START_ANGLE + index * segmentAngle + segmentAngle / 2;
    label.style.transform = `rotate(${angle}deg) translateY(-${labelRadius}px) rotate(90deg)`;

    wheelLabels.appendChild(label);
  });
}

function playBeep(duration = 0.12, frequency = 520) {
  if (!soundOn) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = frequency;
  gain.gain.value = 0.07;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
  osc.onended = () => ctx.close();
}

function spinWheel() {
  if (spinning) return;
  spinning = true;
  spinBtn.disabled = true;
  spinCenter.classList.add("active");

  pendingIndex = Math.floor(Math.random() * segments.length);

  const current = ((currentRotation % 360) + 360) % 360;
  const targetAngle = START_ANGLE + pendingIndex * segmentAngle + segmentAngle / 2;
  const desiredEnd = (POINTER_ANGLE - targetAngle + 3600) % 360;
  let delta = desiredEnd - current;
  if (delta < 0) delta += 360;
  const extraSpins = (4 + Math.floor(Math.random() * 3)) * 360;

  currentRotation += extraSpins + delta;
  wheel.style.transform = `rotate(${currentRotation}deg)`;
  playBeep(0.2, 440);
}

wheel.addEventListener("transitionend", () => {
  if (!spinning) return;
  spinning = false;
  spinBtn.disabled = false;
  spinCenter.classList.remove("active");

  const resultIndex = getResultIndexFromLabels();
  const result = segments[resultIndex];
  const relation = relations[Math.floor(Math.random() * relations.length)];
  resultAmount.textContent = result.label;
  friendName.textContent = relation;
  friendAvatar.textContent = relation.charAt(0).toUpperCase();
  friendDesc.textContent = "Your lucky giver";

  let quote = "";
  if (result.label === "Try Again") {
    resultMessage.textContent = "No Salami this time — spin again for a new result!";
    quote = "I got Try Again on Salami Spinner — spinning again!";
  } else {
    resultMessage.textContent = "Go remind them. Don't forget to send bKash request!";
    quote = `I just got ${result.label} Salami from my ${relation} on Salami Spinner!`;
  }
  const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE_URL)}&quote=${encodeURIComponent(quote)}`;
  shareBtn.href = shareUrl;

  if (confettiOn && result.label !== "Try Again") {
    launchConfetti();
  }

  playBeep(0.15, 660);
  openModal();
});

function openModal() {
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function closeModalFn() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

function launchConfetti() {
  confetti.innerHTML = "";
  const colors = ["#f2c84b", "#138f4a", "#e84949", "#ffd86b"];
  for (let i = 0; i < 60; i += 1) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = `${Math.random() * 0.4}s`;
    piece.style.transform = `translateY(-20vh) rotate(${Math.random() * 360}deg)`;
    confetti.appendChild(piece);
  }
  setTimeout(() => {
    confetti.innerHTML = "";
  }, 3000);
}

spinBtn.addEventListener("click", spinWheel);
spinCenter.addEventListener("click", spinWheel);
closeModal.addEventListener("click", closeModalFn);
spinAgainBtn.addEventListener("click", () => {
  closeModalFn();
  spinWheel();
});

modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModalFn();
});

copyBtn.addEventListener("click", async () => {
  const text = `${resultAmount.textContent} Salami from ${friendName.textContent}.`;
  try {
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = "Copied!";
    setTimeout(() => (copyBtn.textContent = "Copy Result"), 1400);
  } catch (err) {
    copyBtn.textContent = "Copy failed";
    setTimeout(() => (copyBtn.textContent = "Copy Result"), 1400);
  }
});

soundToggle.addEventListener("click", () => {
  soundOn = !soundOn;
  soundToggle.textContent = `Sound: ${soundOn ? "On" : "Off"}`;
});

confettiToggle.addEventListener("click", () => {
  confettiOn = !confettiOn;
  confettiToggle.textContent = `Confetti: ${confettiOn ? "On" : "Off"}`;
});

window.addEventListener("resize", buildLabels);

buildLabels();
