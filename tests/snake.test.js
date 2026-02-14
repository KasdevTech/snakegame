import assert from "node:assert/strict";
import {
  BASE_TICK_MS,
  DIRECTIONS,
  FOOD_PER_STAGE,
  MIN_TICK_MS,
  createInitialState,
  queueDirection,
  restartGame,
  setSpeedLayer,
  tick,
  togglePause,
} from "../src/snake.js";

function fakeRng(values) {
  let i = 0;
  return () => {
    const value = values[i] ?? values[values.length - 1] ?? 0;
    i += 1;
    return value;
  };
}

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

test("moves one cell in current direction", () => {
  const state = createInitialState({
    width: 6,
    height: 6,
    snake: [{ x: 2, y: 2 }, { x: 1, y: 2 }, { x: 0, y: 2 }],
    direction: DIRECTIONS.right,
    food: { x: 5, y: 5 },
  });
  const next = tick(state);
  assert.deepEqual(next.snake, [{ x: 3, y: 2 }, { x: 2, y: 2 }, { x: 1, y: 2 }]);
  assert.equal(next.score, 0);
  assert.equal(next.stage, 1);
  assert.equal(next.tickMs, BASE_TICK_MS);
});

test("grows and increments score when food is eaten", () => {
  const state = createInitialState({
    width: 6,
    height: 6,
    snake: [{ x: 2, y: 2 }, { x: 1, y: 2 }, { x: 0, y: 2 }],
    direction: DIRECTIONS.right,
    food: { x: 3, y: 2 },
  });
  const next = tick(state, fakeRng([0]));
  assert.equal(next.snake.length, 4);
  assert.equal(next.score, 1);
  assert.notDeepEqual(next.food, { x: 3, y: 2 });
});

test("stage 1 wraps through walls", () => {
  const state = createInitialState({
    width: 4,
    height: 4,
    snake: [{ x: 3, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 1 }],
    direction: DIRECTIONS.right,
    food: { x: 0, y: 0 },
  });
  const next = tick(state);
  assert.equal(next.gameOver, false);
  assert.deepEqual(next.snake[0], { x: 0, y: 1 });
});

test("stage 2 collides with walls", () => {
  const state = createInitialState({
    width: 4,
    height: 4,
    snake: [{ x: 3, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 1 }],
    direction: DIRECTIONS.right,
    food: { x: 0, y: 0 },
    score: FOOD_PER_STAGE,
  });
  const next = tick(state);
  assert.equal(next.gameOver, true);
});

test("game over on self collision", () => {
  const state = createInitialState({
    width: 5,
    height: 5,
    snake: [
      { x: 2, y: 2 },
      { x: 2, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
    direction: DIRECTIONS.up,
    food: { x: 4, y: 4 },
  });
  const next = tick(state);
  assert.equal(next.gameOver, true);
});

test("prevents reversing direction", () => {
  const state = createInitialState({
    width: 6,
    height: 6,
    snake: [{ x: 2, y: 2 }, { x: 1, y: 2 }],
    direction: DIRECTIONS.right,
    food: { x: 5, y: 5 },
  });
  const queued = queueDirection(state, "left");
  const next = tick(queued);
  assert.deepEqual(next.snake[0], { x: 3, y: 2 });
});

test("pause blocks ticking and togglePause flips state", () => {
  const state = createInitialState({
    width: 6,
    height: 6,
    snake: [{ x: 2, y: 2 }, { x: 1, y: 2 }],
    direction: DIRECTIONS.right,
    food: { x: 5, y: 5 },
  });
  const paused = togglePause(state);
  assert.equal(paused.paused, true);
  const stillPaused = tick(paused);
  assert.deepEqual(stillPaused.snake, paused.snake);
});

test("restart resets score and game state", () => {
  const state = {
    ...createInitialState({ width: 6, height: 6 }),
    score: 5,
    gameOver: true,
    paused: true,
  };
  const restarted = restartGame(state, fakeRng([0]));
  assert.equal(restarted.score, 0);
  assert.equal(restarted.gameOver, false);
  assert.equal(restarted.paused, false);
  assert.deepEqual(restarted.direction, DIRECTIONS.right);
  assert.equal(restarted.stage, 1);
  assert.equal(restarted.tickMs, BASE_TICK_MS);
});

test("advances stage and increases speed every score threshold", () => {
  const scoreAtNextStage = FOOD_PER_STAGE - 1;
  const state = createInitialState({
    width: 8,
    height: 8,
    snake: [{ x: 2, y: 2 }, { x: 1, y: 2 }, { x: 0, y: 2 }],
    direction: DIRECTIONS.right,
    food: { x: 3, y: 2 },
    score: scoreAtNextStage,
  });
  const next = tick(state, fakeRng([0]));
  assert.equal(next.score, FOOD_PER_STAGE);
  assert.equal(next.stage, 2);
  assert.ok(next.tickMs < state.tickMs);
  assert.ok(next.speedMultiplier > state.speedMultiplier);
});

test("caps speed at minimum tick interval", () => {
  const state = createInitialState({
    width: 8,
    height: 8,
    score: FOOD_PER_STAGE * 20,
  });
  assert.equal(state.tickMs, MIN_TICK_MS);
});

test("speed layer selection changes tick speed", () => {
  const state = createInitialState({ width: 8, height: 8 });
  const faster = setSpeedLayer(state, 2);
  assert.equal(faster.speedLayer, 2);
  assert.ok(faster.tickMs < state.tickMs);
});
