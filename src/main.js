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
const statusEl = document.getElementById("status");
const pauseButton = document.getElementById("pause");
const restartButton = document.getElementById("restart");
const touchControls = document.querySelector(".touch-controls");

const CELL_SIZE = 20;
const TICK_MS = 120;

let state = createInitialState({ width: 20, height: 20 });
let bestScore = Number(window.localStorage.getItem("snake-best-score") || 0);

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
  boardGradient.addColorStop(0, "#f8fbff");
  boardGradient.addColorStop(1, "#eef8f2");
  context.fillStyle = boardGradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = "#dfe6ec";
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

function drawState() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid(state.width, state.height);

  if (state.food) {
    const pulse = 0.8 + Math.sin(Date.now() / 180) * 0.2;
    const inset = 3 - pulse;
    context.fillStyle = "#e04242";
    roundedRect(
      state.food.x * CELL_SIZE + inset,
      state.food.y * CELL_SIZE + inset,
      CELL_SIZE - inset * 2,
      CELL_SIZE - inset * 2,
      6
    );
    context.fill();
  }

  state.snake.forEach((segment, index) => {
    const isHead = index === 0;
    const inset = isHead ? 1 : 2;
    const size = isHead ? CELL_SIZE - 2 : CELL_SIZE - 4;
    const gradient = context.createLinearGradient(
      segment.x * CELL_SIZE,
      segment.y * CELL_SIZE,
      segment.x * CELL_SIZE + CELL_SIZE,
      segment.y * CELL_SIZE + CELL_SIZE
    );
    gradient.addColorStop(0, isHead ? "#0f704f" : "#159167");
    gradient.addColorStop(1, isHead ? "#14a573" : "#0f7f59");
    context.fillStyle = gradient;
    roundedRect(segment.x * CELL_SIZE + inset, segment.y * CELL_SIZE + inset, size, size, 5);
    context.fill();
  });

  scoreEl.textContent = String(state.score);
  bestScore = Math.max(bestScore, state.score);
  bestScoreEl.textContent = String(bestScore);
  window.localStorage.setItem("snake-best-score", String(bestScore));
  if (state.gameOver) {
    statusEl.textContent = "Game over";
    statusEl.style.background = "#ffefef";
    statusEl.style.borderColor = "#ffd5d5";
    statusEl.style.color = "#a32f2f";
    pauseButton.disabled = true;
    pauseButton.textContent = "Pause";
  } else if (state.paused) {
    statusEl.textContent = "Paused";
    statusEl.style.background = "#fff8e5";
    statusEl.style.borderColor = "#ffebbc";
    statusEl.style.color = "#8d6700";
    pauseButton.disabled = false;
    pauseButton.textContent = "Resume";
  } else {
    statusEl.textContent = "Running";
    statusEl.style.background = "#ebfaf3";
    statusEl.style.borderColor = "#c8e6da";
    statusEl.style.color = "#0a6d4a";
    pauseButton.disabled = false;
    pauseButton.textContent = "Pause";
  }
}

function step() {
  state = tick(state);
  drawState();
}

const intervalId = window.setInterval(step, TICK_MS);

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
  window.clearInterval(intervalId);
});

drawState();
