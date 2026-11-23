const photoInterval = 20_000;

const calendarDate = document.querySelector("#calendar-date");
const clockTime = document.querySelector("#clock-time");
const hourMinute = document.querySelector("#hour-minute");
const second = document.querySelector("#second");
const dateFormat = new Intl.DateTimeFormat("ko-KR", { dateStyle: "full" });
let clockTimer;

function twoDigits(number) {
  return String(number).padStart(2, "0");
}

function updateClock() {
  window.clearTimeout(clockTimer);
  const now = new Date();
  const today = `${now.getFullYear()}-${twoDigits(now.getMonth() + 1)}-${twoDigits(now.getDate())}`;
  const hoursAndMinutes = `${twoDigits(now.getHours())}:${twoDigits(now.getMinutes())}`;
  const seconds = twoDigits(now.getSeconds());

  if (calendarDate.dateTime !== today) {
    calendarDate.dateTime = today;
    calendarDate.textContent = dateFormat.format(now);
  }
  if (hourMinute.textContent !== hoursAndMinutes) {
    hourMinute.textContent = hoursAndMinutes;
  }
  second.textContent = seconds;
  clockTime.dateTime = `${hoursAndMinutes}:${seconds}`;

  if (!document.hidden) {
    clockTimer = window.setTimeout(updateClock, 1000 - now.getMilliseconds());
  }
}

const photos = Array.from(document.querySelectorAll(".landscape"));
const photoName = document.querySelector("#photo-name");
const photoRegion = document.querySelector("#photo-region");
const photoControls = document.querySelector("#photo-controls");
const photoSteps = document.querySelector("#photo-steps");
const playback = document.querySelector("#playback");
let currentPhoto = 0;
let playing = true;
let photoTimer;

const steps = photos.map((photo, index) => {
  const step = document.createElement("button");
  step.type = "button";
  step.className = "photo-step";
  step.title = `${photo.dataset.name} 사진 보기`;
  step.setAttribute("aria-label", step.title);
  step.addEventListener("click", () => showPhoto(index));
  photoSteps.append(step);
  return step;
});

function schedulePhoto() {
  window.clearTimeout(photoTimer);
  if (playing && photos.length > 1 && !document.hidden) {
    photoTimer = window.setTimeout(() => showPhoto((currentPhoto + 1) % photos.length), photoInterval);
  }
}

function showPhoto(index) {
  photos[currentPhoto].classList.remove("is-current");
  steps[currentPhoto].removeAttribute("aria-current");
  currentPhoto = index;

  const photo = photos[currentPhoto];
  photo.classList.add("is-current");
  steps[currentPhoto].setAttribute("aria-current", "true");
  photoName.textContent = photo.dataset.name;
  photoRegion.textContent = photo.dataset.region;
  schedulePhoto();
}

playback.addEventListener("click", () => {
  playing = !playing;
  playback.classList.toggle("is-paused", !playing);
  playback.title = playing ? "사진 일시 정지" : "사진 자동 재생";
  playback.setAttribute("aria-label", playback.title);
  schedulePhoto();
});

const fullscreen = document.querySelector("#fullscreen");
const fullscreenLabel = document.querySelector("#fullscreen-label");
const fullscreenStatus = document.querySelector("#fullscreen-status");
const kioskMode = new URLSearchParams(window.location.search).get("kiosk") === "1";

if (!kioskMode && document.fullscreenEnabled) {
  fullscreen.hidden = false;
  fullscreen.addEventListener("click", async () => {
    fullscreenStatus.textContent = "";
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      fullscreenStatus.textContent = "브라우저에서 전체 화면을 전환할 수 없습니다.";
    }
  });

  document.addEventListener("fullscreenchange", () => {
    fullscreenLabel.textContent = document.fullscreenElement ? "전체 화면 닫기" : "전체 화면";
  });
}

document.addEventListener("visibilitychange", () => {
  updateClock();
  schedulePhoto();
});

updateClock();
if (photos.length > 0) {
  showPhoto(0);
  photoControls.hidden = photos.length < 2;
}
