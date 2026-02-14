export const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export const BASE_TICK_MS = 140;
export const MIN_TICK_MS = 70;
export const SPEED_STEP_MS = 10;
export const FOOD_PER_STAGE = 5;
export const SPEED_LAYERS = [1, 1.25, 1.5, 1.75, 2];

function samePoint(a, b) {
  return a.x === b.x && a.y === b.y;
}

function isOutOfBounds(point, width, height) {
  return point.x < 0 || point.y < 0 || point.x >= width || point.y >= height;
}

function isOppositeDirection(next, current) {
  return next.x === -current.x && next.y === -current.y;
}

function randomFreeCell(width, height, occupied, rng) {
  const freeCells = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const key = `${x},${y}`;
      if (!occupied.has(key)) {
        freeCells.push({ x, y });
      }
    }
  }

  if (freeCells.length === 0) {
    return null;
  }

  const index = Math.floor(rng() * freeCells.length);
  return freeCells[index];
}

function normalizeSpeedLayer(value) {
  const numeric = Number(value);
  return SPEED_LAYERS.includes(numeric) ? numeric : SPEED_LAYERS[0];
}

function calculateProgress(score, speedLayer) {
  const stage = Math.floor(score / FOOD_PER_STAGE) + 1;
  const stageTickMs = Math.max(MIN_TICK_MS, BASE_TICK_MS - (stage - 1) * SPEED_STEP_MS);
  const tickMs = Math.max(MIN_TICK_MS, Math.round(stageTickMs / speedLayer));
  const speedMultiplier = Number((BASE_TICK_MS / tickMs).toFixed(2));
  return { stage, tickMs, speedMultiplier };
}

export function createInitialState(config = {}, rng = Math.random) {
  const width = config.width ?? 20;
  const height = config.height ?? 20;
  const snake = config.snake ?? [
    { x: 3, y: 10 },
    { x: 2, y: 10 },
    { x: 1, y: 10 },
  ];
  const direction = config.direction ?? DIRECTIONS.right;
  const speedLayer = normalizeSpeedLayer(config.speedLayer);
  const occupied = new Set(snake.map((segment) => `${segment.x},${segment.y}`));
  const food = config.food ?? randomFreeCell(width, height, occupied, rng);
  const score = config.score ?? 0;
  const progress = calculateProgress(score, speedLayer);

  return {
    width,
    height,
    snake,
    direction,
    queuedDirection: direction,
    food,
    score,
    speedLayer,
    stage: progress.stage,
    tickMs: progress.tickMs,
    speedMultiplier: progress.speedMultiplier,
    gameOver: false,
    paused: false,
  };
}

export function queueDirection(state, directionName) {
  const next = DIRECTIONS[directionName];
  if (!next || state.gameOver) {
    return state;
  }

  if (isOppositeDirection(next, state.direction)) {
    return state;
  }

  return {
    ...state,
    queuedDirection: next,
  };
}

export function togglePause(state) {
  if (state.gameOver) {
    return state;
  }

  return {
    ...state,
    paused: !state.paused,
  };
}

export function setSpeedLayer(state, speedLayer) {
  const normalized = normalizeSpeedLayer(speedLayer);
  const progress = calculateProgress(state.score, normalized);
  return {
    ...state,
    speedLayer: normalized,
    stage: progress.stage,
    tickMs: progress.tickMs,
    speedMultiplier: progress.speedMultiplier,
  };
}

export function restartGame(state, rng = Math.random) {
  return createInitialState(
    { width: state.width, height: state.height, speedLayer: state.speedLayer },
    rng
  );
}

export function tick(state, rng = Math.random) {
  if (state.gameOver || state.paused) {
    return state;
  }

  const direction = isOppositeDirection(state.queuedDirection, state.direction)
    ? state.direction
    : state.queuedDirection;

  const currentHead = state.snake[0];
  let nextHead = {
    x: currentHead.x + direction.x,
    y: currentHead.y + direction.y,
  };

  if (state.stage === 1 && isOutOfBounds(nextHead, state.width, state.height)) {
    nextHead = {
      x: (nextHead.x + state.width) % state.width,
      y: (nextHead.y + state.height) % state.height,
    };
  } else if (isOutOfBounds(nextHead, state.width, state.height)) {
    return {
      ...state,
      direction,
      gameOver: true,
    };
  }

  const willGrow = state.food && samePoint(nextHead, state.food);
  const nextBody = willGrow ? state.snake : state.snake.slice(0, -1);

  if (nextBody.some((segment) => samePoint(segment, nextHead))) {
    return {
      ...state,
      direction,
      gameOver: true,
    };
  }

  const snake = [nextHead, ...nextBody];
  const occupied = new Set(snake.map((segment) => `${segment.x},${segment.y}`));
  const food = willGrow
    ? randomFreeCell(state.width, state.height, occupied, rng)
    : state.food;
  const nextScore = willGrow ? state.score + 1 : state.score;
  const progress = calculateProgress(nextScore, state.speedLayer);

  return {
    ...state,
    snake,
    direction,
    queuedDirection: direction,
    food,
    score: nextScore,
    stage: progress.stage,
    tickMs: progress.tickMs,
    speedMultiplier: progress.speedMultiplier,
  };
}
