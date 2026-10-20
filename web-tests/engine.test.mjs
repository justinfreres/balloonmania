import test from "node:test";
import assert from "node:assert/strict";
import { LEVEL_NAMES, BALLOON_COUNTS, generateQuestion, makeRound, nextLevel, isFinished } from "../web/engine.mjs";

test("three playable difficulties", () => {
  assert.deepEqual(LEVEL_NAMES, ["Easy", "Medium", "Hard"]);
  assert.deepEqual(BALLOON_COUNTS, [9,12,18]);
});
test("every round has exactly one answer and unique balloons", () => {
  for (let level = 0; level < 3; level++) {
    for (let n = 0; n < 250; n++) {
      const round = makeRound(level);
      assert.equal(round.balloons.length, BALLOON_COUNTS[level]);
      assert.equal(new Set(round.balloons).size, round.balloons.length);
      assert.equal(round.balloons.filter(a => a === round.answer).length, 1);
    }
  }
});
test("generated equations are correct and have no negative subtraction", () => {
  for (let level = 0; level < 3; level++) {
    for (let i = 0; i < 250; i++) {
      const q = generateQuestion(level);
      const parts = q.text.split(" ");
      const left = Number(parts[0]), right = Number(parts[2]);
      const expected = parts[1] === "+" ? left + right : parts[1] === "−" ? left - right : left * right;
      assert.equal(q.answer, expected);
      assert.ok(q.answer >= 0);
    }
  }
});
test("levels and time match the original challenge", () => {
  assert.equal(nextLevel(0,10,31),0);
  assert.equal(nextLevel(0,10,30),1);
  assert.equal(nextLevel(1,15,45),2);
  assert.equal(nextLevel(1,14,30),1);
  assert.equal(isFinished(2,30,15),true);
  assert.equal(isFinished(0,0,0),true);
  assert.equal(isFinished(0,0,25),false);
});
test("invalid difficulties are rejected", () => {
  assert.throws(() => generateQuestion(-1), RangeError);
  assert.throws(() => makeRound(3), RangeError);
});


