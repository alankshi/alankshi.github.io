const storageKey = "face-background-exponential-white-at";
const decayTimeMs = 10_000;
const linearThreshold = 0.1;
const revealStep = 0.05;
const clickTimes = [];
// A deadline lets the fade continue across navigation and while the tab is hidden.
let whiteAt = 0;
let fadeTimer;

// The final 10 points fade linearly over 10 seconds; above that, the rate is proportional.
function fadeDuration(opacity) {
  const ratio = opacity / linearThreshold;
  return decayTimeMs * (ratio <= 1 ? ratio : 1 + Math.log(ratio));
}

function opacityAt(now) {
  const timeRatio = Math.max(0, whiteAt - now) / decayTimeMs;
  const opacity = linearThreshold * (timeRatio <= 1 ? timeRatio : Math.exp(timeRatio - 1));
  return Math.min(1, opacity);
}

function renderFade() {
  clearTimeout(fadeTimer);
  const photoOpacity = opacityAt(Date.now());
  document.body.classList.toggle("face-background-visible", photoOpacity > 0);
  if (photoOpacity === 0) return;

  document.body.style.setProperty("--face-opacity", photoOpacity);
  if (!document.hidden) fadeTimer = setTimeout(renderFade, 100);
}

function restoreFade() {
  try {
    const storedTime = Number(sessionStorage.getItem(storageKey));
    if (Number.isFinite(storedTime)) whiteAt = storedTime;
  } catch {
    // The reveal still works on the current page if storage is blocked.
  }
  renderFade();
}

restoreFade();
document.addEventListener("visibilitychange", renderFade);
window.addEventListener("pageshow", ({ persisted }) => {
  if (!persisted) return;
  clickTimes.length = 0;
  restoreFade();
});

const portrait = document.querySelector(".home-intro__photo-button");
portrait?.addEventListener("click", ({ timeStamp }) => {
  while (clickTimes.length && timeStamp - clickTimes[0] > 2000) {
    clickTimes.shift();
  }
  clickTimes.push(timeStamp);
  if (clickTimes.length < 5) return;

  clickTimes.length = 0;
  const now = Date.now();
  whiteAt = now + fadeDuration(Math.min(1, opacityAt(now) + revealStep));
  try {
    sessionStorage.setItem(storageKey, String(whiteAt));
  } catch {
    // Keep the new deadline in memory if storage is blocked.
  }
  renderFade();
});
