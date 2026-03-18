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

const fallbackNames = [
  "Yusuf Islam",
  "Nusrat Jahan",
  "Arafat Hossain",
  "Mahi Ahmed",
  "Rafiq Rahman",
  "Tasnim Akter",
  "Tanvir Hasan",
  "Sabrina Noor",
  "Imran Chowdhury",
  "Lamia Sultana",
  "Farhan Kabir",
  "Jannat Ara"
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
const connectFacebook = document.getElementById("connectFacebook");
const connectionStatus = document.getElementById("connectionStatus");

let currentRotation = 0;
let spinning = false;
let pendingIndex = 0;
let soundOn = true;
let confettiOn = true;

const segmentAngle = 360 / segments.length;

function randomFallbackName() {
  return fallbackNames[Math.floor(Math.random() * fallbackNames.length)];
}

function setFriendDisplay(name, source = "demo") {
  friendName.textContent = `From: ${name}`;
  friendAvatar.textContent = name.charAt(0).toUpperCase();
  if (source === "facebook") {
    friendDesc.textContent = "From your connected Facebook friends";
  } else {
    friendDesc.textContent = "Demo friend";
  }
}

function setShareLink(amountLabel, friend) {
  const quote = `I just got ${amountLabel} Salami from ${friend} on Salami Spinner!`;
  const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(location.href)}&quote=${encodeURIComponent(quote)}`;
  shareBtn.href = shareUrl;
}

async function updateConnectionStatus(forceConnected) {
  if (!connectionStatus || !connectFacebook) return;
  if (typeof forceConnected === "boolean") {
    connectionStatus.textContent = forceConnected ? "Facebook: Connected" : "Facebook: Not connected";
    connectFacebook.textContent = forceConnected ? "Reconnect Facebook" : "Connect Facebook";
    return;
  }
  try {
    const response = await fetch("/api/status/");
    if (!response.ok) throw new Error("Status failed");
    const data = await response.json();
    const connected = Boolean(data.connected);
    connectionStatus.textContent = connected ? "Facebook: Connected" : "Facebook: Not connected";
    connectFacebook.textContent = connected ? "Reconnect Facebook" : "Connect Facebook";
  } catch (err) {
    connectionStatus.textContent = "Facebook: Not connected";
    connectFacebook.textContent = "Connect Facebook";
  }
}

async function fetchSpinFriend(amountLabel) {
  try {
    const response = await fetch(`/api/spin/?amount=${encodeURIComponent(amountLabel)}`);
    if (!response.ok) throw new Error("Spin API failed");
    return await response.json();
  } catch (err) {
    return {
      connected: false,
      friend: { name: randomFallbackName(), source: "demo" }
    };
  }
}

function buildLabels() {
  wheelLabels.innerHTML = "";
  const radius = wheel.offsetWidth / 2;
  const labelRadius = radius * 0.62;

  segments.forEach((segment, index) => {
    const label = document.createElement("div");
    label.className = "wheel-label";
    if (segment.label.toLowerCase().includes("try")) {
      label.classList.add("try-again");
    }
    label.textContent = segment.label;

    const angle = index * segmentAngle + segmentAngle / 2;
    label.style.transform = `rotate(${angle}deg) translateY(-${labelRadius}px) rotate(-${angle}deg)`;

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
  const targetAngle = pendingIndex * segmentAngle + segmentAngle / 2;
  const desiredEnd = (360 - targetAngle) % 360;
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

  const result = segments[pendingIndex];
  resultAmount.textContent = result.label;
  const fallbackFriend = randomFallbackName();
  setFriendDisplay(fallbackFriend, "demo");

  if (result.label === "Try Again") {
    resultMessage.textContent = "Better luck next time! Spin again for a new result.";
  } else {
    resultMessage.textContent = "Go remind them. Don't forget to send bKash request!";
  }

  setShareLink(result.label, fallbackFriend);

  if (confettiOn && result.label !== "Try Again") {
    launchConfetti();
  }

  playBeep(0.15, 660);
  openModal();

  fetchSpinFriend(result.label).then((data) => {
    if (data && data.friend && data.friend.name) {
      setFriendDisplay(data.friend.name, data.friend.source);
      setShareLink(result.label, data.friend.name);
    }
    if (typeof data.connected === "boolean") {
      updateConnectionStatus(data.connected);
    }
  });
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
  const text = `${resultAmount.textContent} Salami from ${friendName.textContent.replace("From: ", "")}.`;
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
updateConnectionStatus();
