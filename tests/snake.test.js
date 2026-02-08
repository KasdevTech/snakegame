import assert from "node:assert/strict";
import {
  DIRECTIONS,
  createInitialState,
  queueDirection,
  restartGame,
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

test("game over on wall collision", () => {
  const state = createInitialState({
    width: 4,
    height: 4,
    snake: [{ x: 3, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 1 }],
    direction: DIRECTIONS.right,
    food: { x: 0, y: 0 },
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
});
