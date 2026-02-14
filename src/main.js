import {
  createInitialState,
  queueDirection,
  restartGame,
  tick,
  togglePause,
} from "./snake.js";

const canvas = document.getElementById("game");
const context = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("best-score");
const stageEl = document.getElementById("stage");
const speedLayerEl = document.getElementById("speed-layer");
const statusEl = document.getElementById("status");
const pauseButton = document.getElementById("pause");
const restartButton = document.getElementById("restart");
const touchControls = document.querySelector(".touch-controls");

const CELL_SIZE = 20;

let state = createInitialState({ width: 20, height: 20 });
let bestScore = Number(window.localStorage.getItem("snake-best-score") || 0);
let tickTimeoutId = null;

function roundedRect(x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function drawGrid(width, height) {
  const boardGradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  boardGradient.addColorStop(0, "#0b1828");
  boardGradient.addColorStop(1, "#0e1e2c");
  context.fillStyle = boardGradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = "rgba(128, 166, 194, 0.2)";
  context.lineWidth = 1;
  for (let x = 0; x <= width; x += 1) {
    context.beginPath();
    context.moveTo(x * CELL_SIZE, 0);
    context.lineTo(x * CELL_SIZE, height * CELL_SIZE);
    context.stroke();
  }
  for (let y = 0; y <= height; y += 1) {
    context.beginPath();
    context.moveTo(0, y * CELL_SIZE);
    context.lineTo(width * CELL_SIZE, y * CELL_SIZE);
    context.stroke();
  }
}

function drawFood() {
  if (!state.food) {
    return;
  }
  const pulse = 0.8 + Math.sin(Date.now() / 180) * 0.2;
  const inset = 3 - pulse;
  const cx = state.food.x * CELL_SIZE + CELL_SIZE / 2;
  const cy = state.food.y * CELL_SIZE + CELL_SIZE / 2;

  context.fillStyle = "#ff5f6d";
  roundedRect(
    state.food.x * CELL_SIZE + inset,
    state.food.y * CELL_SIZE + inset,
    CELL_SIZE - inset * 2,
    CELL_SIZE - inset * 2,
    6
  );
  context.fill();

  context.fillStyle = "rgba(255, 212, 217, 0.95)";
  context.beginPath();
  context.arc(cx - 3, cy - 3, 2.4, 0, Math.PI * 2);
  context.fill();
}

function drawHeadFeatures(head, direction) {
  const centerX = head.x * CELL_SIZE + CELL_SIZE / 2;
  const centerY = head.y * CELL_SIZE + CELL_SIZE / 2;
  const offset = 4;
  let eye1X = centerX - offset;
  let eye1Y = centerY - offset;
  let eye2X = centerX + offset;
  let eye2Y = centerY - offset;

  if (direction.x === -1) {
    eye1X = centerX - offset;
    eye1Y = centerY - offset;
    eye2X = centerX - offset;
    eye2Y = centerY + offset;
  } else if (direction.x === 1) {
    eye1X = centerX + offset;
    eye1Y = centerY - offset;
    eye2X = centerX + offset;
    eye2Y = centerY + offset;
  } else if (direction.y === 1) {
    eye1X = centerX - offset;
    eye1Y = centerY + offset;
    eye2X = centerX + offset;
    eye2Y = centerY + offset;
  }

  context.fillStyle = "#e9ffef";
  context.beginPath();
  context.arc(eye1X, eye1Y, 1.6, 0, Math.PI * 2);
  context.arc(eye2X, eye2Y, 1.6, 0, Math.PI * 2);
  context.fill();

  const pupilOffsetX = direction.x * 0.8;
  const pupilOffsetY = direction.y * 0.8;
  context.fillStyle = "#07271d";
  context.beginPath();
  context.arc(eye1X + pupilOffsetX, eye1Y + pupilOffsetY, 0.65, 0, Math.PI * 2);
  context.arc(eye2X + pupilOffsetX, eye2Y + pupilOffsetY, 0.65, 0, Math.PI * 2);
  context.fill();

  const noseX = centerX + direction.x * 8;
  const noseY = centerY + direction.y * 8;
  const tongueTipX = centerX + direction.x * 13;
  const tongueTipY = centerY + direction.y * 13;
  context.strokeStyle = "#ff7580";
  context.lineWidth = 1.2;
  context.beginPath();
  context.moveTo(noseX, noseY);
  context.lineTo(tongueTipX, tongueTipY);
  context.stroke();
  context.beginPath();
  context.moveTo(tongueTipX, tongueTipY);
  context.lineTo(tongueTipX + direction.y * 2, tongueTipY + direction.x * 2);
  context.moveTo(tongueTipX, tongueTipY);
  context.lineTo(tongueTipX - direction.y * 2, tongueTipY - direction.x * 2);
  context.stroke();
}

function drawState() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid(state.width, state.height);
  drawFood();

  state.snake.forEach((segment, index) => {
    const isHead = index === 0;
    const inset = isHead ? 1 : 2;
    const size = isHead ? CELL_SIZE - 2 : CELL_SIZE - 4;
    const hue = 150 + Math.min(state.score * 2, 40);
    const gradient = context.createLinearGradient(
      segment.x * CELL_SIZE,
      segment.y * CELL_SIZE,
      segment.x * CELL_SIZE + CELL_SIZE,
      segment.y * CELL_SIZE + CELL_SIZE
    );
    gradient.addColorStop(0, isHead ? `hsl(${hue}, 75%, 38%)` : `hsl(${hue}, 70%, 41%)`);
    gradient.addColorStop(1, isHead ? `hsl(${hue}, 82%, 48%)` : `hsl(${hue}, 77%, 45%)`);
    context.fillStyle = gradient;
    roundedRect(segment.x * CELL_SIZE + inset, segment.y * CELL_SIZE + inset, size, size, 5);
    context.fill();

    if (isHead) {
      drawHeadFeatures(segment, state.direction);
    }
  });

  scoreEl.textContent = String(state.score);
  bestScore = Math.max(bestScore, state.score);
  bestScoreEl.textContent = String(bestScore);
  stageEl.textContent = String(state.stage);
  speedLayerEl.textContent = `${state.speedMultiplier.toFixed(2)}x`;
  window.localStorage.setItem("snake-best-score", String(bestScore));
  if (state.gameOver) {
    statusEl.textContent = "Game over";
    statusEl.style.background = "rgba(255, 95, 109, 0.2)";
    statusEl.style.borderColor = "rgba(255, 95, 109, 0.4)";
    statusEl.style.color = "#ffc8ce";
    pauseButton.disabled = true;
    pauseButton.textContent = "Pause";
  } else if (state.paused) {
    statusEl.textContent = "Paused";
    statusEl.style.background = "rgba(255, 216, 105, 0.2)";
    statusEl.style.borderColor = "rgba(255, 216, 105, 0.38)";
    statusEl.style.color = "#ffe59a";
    pauseButton.disabled = false;
    pauseButton.textContent = "Resume";
  } else {
    statusEl.textContent = "Running";
    statusEl.style.background = "rgba(92, 247, 186, 0.13)";
    statusEl.style.borderColor = "rgba(92, 247, 186, 0.35)";
    statusEl.style.color = "#7affcb";
    pauseButton.disabled = false;
    pauseButton.textContent = "Pause";
  }

  if (state.gameOver) {
    context.fillStyle = "rgba(0, 0, 0, 0.48)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#ffffff";
    context.textAlign = "center";
    context.font = "700 28px Avenir Next, Segoe UI, sans-serif";
    context.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 6);
    context.font = "600 14px Avenir Next, Segoe UI, sans-serif";
    context.fillStyle = "#d6e9ff";
    context.fillText("Press Restart to play again", canvas.width / 2, canvas.height / 2 + 22);
  }
}

function step() {
  state = tick(state);
  drawState();
  scheduleNextTick();
}

function scheduleNextTick() {
  if (tickTimeoutId !== null) {
    window.clearTimeout(tickTimeoutId);
  }
  tickTimeoutId = window.setTimeout(step, state.tickMs);
}

function applyDirectionInput(rawValue) {
  const map = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    W: "up",
    s: "down",
    S: "down",
    a: "left",
    A: "left",
    d: "right",
    D: "right",
    up: "up",
    down: "down",
    left: "left",
    right: "right",
  };

  const direction = map[rawValue];
  if (direction) {
    state = queueDirection(state, direction);
    drawState();
  }
}

document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    state = togglePause(state);
    drawState();
    return;
  }
  applyDirectionInput(event.key);
});

pauseButton.addEventListener("click", () => {
  state = togglePause(state);
  drawState();
});

restartButton.addEventListener("click", () => {
  state = restartGame(state);
  drawState();
});

touchControls.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }
  applyDirectionInput(target.dataset.dir);
});

window.addEventListener("beforeunload", () => {
  if (tickTimeoutId !== null) {
    window.clearTimeout(tickTimeoutId);
  }
});

drawState();
scheduleNextTick();
