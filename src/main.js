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
const statusEl = document.getElementById("status");
const pauseButton = document.getElementById("pause");
const restartButton = document.getElementById("restart");
const touchControls = document.querySelector(".touch-controls");

const CELL_SIZE = 20;
const TICK_MS = 120;

let state = createInitialState({ width: 20, height: 20 });

function drawGrid(width, height) {
  context.strokeStyle = "#d9d9d9";
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
    context.fillStyle = "#c20d0d";
    context.fillRect(
      state.food.x * CELL_SIZE + 2,
      state.food.y * CELL_SIZE + 2,
      CELL_SIZE - 4,
      CELL_SIZE - 4
    );
  }

  context.fillStyle = "#1f1f1f";
  state.snake.forEach((segment, index) => {
    context.fillRect(
      segment.x * CELL_SIZE + (index === 0 ? 1 : 2),
      segment.y * CELL_SIZE + (index === 0 ? 1 : 2),
      CELL_SIZE - (index === 0 ? 2 : 4),
      CELL_SIZE - (index === 0 ? 2 : 4)
    );
  });

  scoreEl.textContent = String(state.score);
  if (state.gameOver) {
    statusEl.textContent = "Game over";
    pauseButton.disabled = true;
    pauseButton.textContent = "Pause";
  } else if (state.paused) {
    statusEl.textContent = "Paused";
    pauseButton.disabled = false;
    pauseButton.textContent = "Resume";
  } else {
    statusEl.textContent = "Running";
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
