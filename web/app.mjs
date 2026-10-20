import { LEVEL_NAMES, makeRound, nextLevel, isFinished } from "./engine.mjs";

const $ = (selector) => document.querySelector(selector);
const menu = $("#menu");
const play = $("#play");
const results = $("#results");
const choices = $("#balloons");
const scoreLabel = $("#score");
const levelLabel = $("#level");
const timeLabel = $("#time");
const equation = $("#equation");
const feedback = $("#feedback");
const timerBar = $("#timer-bar");
const highScoreLabel = $("#high-score");
const resultCopy = $("#result-copy");
const soundToggle = $("#sound-toggle");
const state = { active: false, level: 0, score: 0, seconds: 60, endAt: 0, round: null, tick: null, sound: true };
const HIGH_SCORE_KEY = "balloonmainia_high_scores_v1";
let audio;

function storedScores() {
  try {
    const scores = JSON.parse(localStorage.getItem(HIGH_SCORE_KEY) || "[0,0,0]");
    return Array.isArray(scores) && scores.length === 3 ? scores.map(v => Number(v) || 0) : [0,0,0];
  } catch { return [0,0,0]; }
}
function show(section) {
  for (const el of [menu, play, results]) el.hidden = el !== section;
  document.body.classList.toggle("playing", section === play);
}
function beep(correct) {
  if (!state.sound) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume();
    const oscillator = audio.createOscillator();
    const volume = audio.createGain();
    oscillator.type = correct ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(correct ? 660 : 250, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(correct ? 980 : 160, audio.currentTime + 0.14);
    volume.gain.setValueAtTime(0.06, audio.currentTime);
    volume.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.17);
    oscillator.connect(volume).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.18);
  } catch { /* Audio is optional on restricted devices. */ }
}
function updateHud() {
  scoreLabel.textContent = String(state.score);
  levelLabel.textContent = LEVEL_NAMES[state.level];
  timeLabel.textContent = String(state.seconds);
  timerBar.style.width = (state.seconds / 60 * 100) + "%";
  timerBar.parentElement.setAttribute("aria-valuenow", String(state.seconds));
}
function renderRound() {
  state.round = makeRound(state.level);
  equation.textContent = state.round.question + " = ?";
  feedback.textContent = "Pop the balloon with the right answer!";
  choices.replaceChildren();
  state.round.balloons.forEach((number, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "balloon balloon-" + (index % 6);
    button.setAttribute("aria-label", "Answer " + number);
    const value = document.createElement("span");
    value.className = "balloon-number";
    value.textContent = String(number);
    button.append(value);
    button.addEventListener("click", () => selectBalloon(button, number));
    choices.append(button);
  });
  fitBalloons();
}
function fitBalloons() {
  const count = choices.children.length;
  if (play.hidden || !count) return;
  const width = Math.max(1, choices.clientWidth - 8);
  const height = Math.max(1, choices.clientHeight - 20);
  let best = { size: 0, columns: 1, rows: count };
  for (let columns = 1; columns <= count; columns++) {
    const rows = Math.ceil(count / columns);
    const size = Math.min(105, (width - (columns - 1) * 8) / columns,
      ((height - (rows - 1) * 10) / rows - 10) * 0.8);
    if (size > best.size) best = { size, columns, rows };
  }
  choices.style.setProperty("--columns", best.columns);
  choices.style.setProperty("--rows", best.rows);
  choices.style.setProperty("--balloon-width", Math.max(1, Math.floor(best.size)) + "px");
}
new ResizeObserver(fitBalloons).observe(choices);
function selectBalloon(button, value) {
  if (!state.active || button.disabled) return;
  tick();
  if (!state.active || !button.isConnected) return;
  if (value !== state.round.answer) {
    button.disabled = true;
    button.classList.add("popped");
    feedback.textContent = "Pop! Try another balloon.";
    beep(false);
    return;
  }
  state.score++;
  button.classList.add("correct");
  feedback.textContent = "You got it!";
  beep(true);
  updateHud();
  if (isFinished(state.level, state.score, state.seconds)) {
    finish();
  } else {
    renderRound();
  }
}
function tick() {
  if (!state.active) return;
  state.seconds = Math.max(0, Math.ceil((state.endAt - Date.now()) / 1000));
  const level = nextLevel(state.level, state.score, state.seconds);
  if (level !== state.level) {
    state.level = level;
    renderRound();
  }
  updateHud();
  if (isFinished(state.level, state.score, state.seconds)) finish();
}
function start(level) {
  clearInterval(state.tick);
  state.active = true;
  state.level = level;
  state.score = 0;
  state.seconds = 60;
  state.endAt = Date.now() + 60000;
  show(play);
  renderRound();
  updateHud();
  state.tick = setInterval(tick, 200);
}
function finish() {
  if (!state.active) return;
  tickCleanup();
  const scores = storedScores();
  const oldBest = scores[state.level];
  scores[state.level] = Math.max(oldBest, state.score);
  try { localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(scores)); } catch { /* private mode */ }
  resultCopy.textContent = "You scored " + state.score + " point" + (state.score === 1 ? "" : "s") +
    " and reached " + LEVEL_NAMES[state.level] + ".";
  highScoreLabel.textContent = "Best for " + LEVEL_NAMES[state.level] + ": " + scores[state.level];
  show(results);
}
function tickCleanup() {
  state.active = false;
  clearInterval(state.tick);
  state.tick = null;
}
function goHome() {
  tickCleanup();
  show(menu);
}

document.querySelectorAll("[data-level]").forEach(button => {
  button.addEventListener("click", () => start(Number(button.dataset.level)));
});
$("#home-button").addEventListener("click", goHome);
$("#results-home").addEventListener("click", goHome);
$("#play-again").addEventListener("click", () => start(state.level));
soundToggle.addEventListener("click", () => {
  state.sound = !state.sound;
  soundToggle.textContent = state.sound ? "Sound: On" : "Sound: Off";
  soundToggle.setAttribute("aria-pressed", String(state.sound));
});
document.addEventListener("visibilitychange", () => { if (!document.hidden) tick(); });
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(() => {}));
}
show(menu);



