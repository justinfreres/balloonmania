// Portable gameplay rules based on the original Balloon Math Mania (2018).
// This module has no browser dependencies so it can be tested with Node.js.
export const LEVEL_NAMES = Object.freeze(["Easy", "Medium", "Hard"]);
export const BALLOON_COUNTS = Object.freeze([9, 12, 18]);
const MIN = [[1, 11, 21], [1, 5, 10], [2, 5, 10]];
const MAX = [[10, 25, 50], [10, 20, 30], [5, 10, 15]];
const SIGNS = ["+", "−", "×"];

function integer(min, max, rng) {
  return min + Math.floor(Math.min(0.999999999, Math.max(0, rng())) * (max - min + 1));
}

export function generateQuestion(level, rng = Math.random) {
  if (!Number.isInteger(level) || level < 0 || level > 2) {
    throw new RangeError("Level must be 0 (Easy), 1 (Medium), or 2 (Hard).");
  }
  const operation = integer(0, 2, rng);
  let left = integer(MIN[operation][level], MAX[operation][level], rng);
  let right = integer(MIN[operation][level], MAX[operation][level], rng);
  if (operation === 1 && right > left) [left, right] = [right, left];
  const answer = operation === 0 ? left + right : operation === 1 ? left - right : left * right;
  return { text: left + " " + SIGNS[operation] + " " + right, answer };
}

// Unlike the old SQLite query, answer choices are guaranteed distinct.
// Every round always contains precisely one correct balloon.
export function makeRound(level, rng = Math.random) {
  const question = generateQuestion(level, rng);
  const count = BALLOON_COUNTS[level];
  const answers = new Set([question.answer]);
  for (let attempts = 0; answers.size < count && attempts < 1200; attempts++) {
    answers.add(generateQuestion(level, rng).answer);
  }
  let offset = 1;
  while (answers.size < count) {
    answers.add(question.answer + offset);
    if (question.answer - offset >= 0) answers.add(question.answer - offset);
    offset++;
  }
  const balloons = Array.from(answers).slice(0, count);
  for (let i = balloons.length - 1; i > 0; i--) {
    const j = integer(0, i, rng);
    [balloons[i], balloons[j]] = [balloons[j], balloons[i]];
  }
  return { question: question.text, answer: question.answer, balloons };
}

export function nextLevel(level, score, secondsLeft) {
  if (level === 0 && score >= 10 && secondsLeft <= 30) return 1;
  if (level === 1 && score >= 15 && secondsLeft <= 45) return 2;
  return level;
}
export function isFinished(level, score, secondsLeft) {
  return secondsLeft <= 0 || (level === 2 && score >= 30);
}

