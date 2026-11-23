const photoInterval = 20_000;

const calendarDate = document.querySelector("#calendar-date");
const clockPlace = document.querySelector("#clock-place");
const clockTime = document.querySelector("#clock-time");
const hourMinute = document.querySelector("#hour-minute");
const second = document.querySelector("#second");
const weekdayFormat = new Intl.DateTimeFormat("ko-KR", { weekday: "long" });
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
    calendarDate.textContent = `${today.replaceAll("-", ".")} · ${weekdayFormat.format(now)}`;
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
const clockScreen = document.querySelector(".screen");
const reviewPanels = document.querySelectorAll(".review-panel");
const photoLocation = document.querySelector("#photo-location");
const photoName = document.querySelector("#photo-name");
const photoRegion = document.querySelector("#photo-region");
const photoControls = document.querySelector("#photo-controls");
const photoSteps = document.querySelector("#photo-steps");
const playback = document.querySelector("#playback");
let currentPhoto = 0;
let playing = true;
let photoTimer;
let reviewReady = false;
let loadingReview = false;

const steps = photos.map((photo, index) => {
  const step = document.createElement("button");
  step.type = "button";
  step.className = "photo-step";
  step.title = `${photo.dataset.name} 보기`;
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

function updatePhotoLayout() {
  const photo = photos[currentPhoto];
  const selectedReview = reviewReady ? photo.dataset.review : undefined;
  clockScreen.classList.toggle("is-review", Boolean(selectedReview));
  clockScreen.dataset.tone = photo.dataset.tone ?? "";
  clockPlace.textContent = photo.dataset.place ?? "";
  clockPlace.hidden = !photo.dataset.place;
  photoLocation.hidden = Boolean(photo.dataset.review);
  for (const panel of reviewPanels) {
    panel.hidden = panel.id !== selectedReview;
  }
}

async function refreshReview() {
  if (loadingReview) return;
  loadingReview = true;
  try {
    const response = await fetch("review.json", { cache: "no-store" });
    if (!response.ok) return;
    const { project, publication } = await response.json();

    const checklist = project.checklist.map((item) => {
      const entry = document.createElement("li");
      entry.textContent = item;
      return entry;
    });
    const rules = publication.rules.map(({ label, value }) => {
      const row = document.createElement("div");
      const term = document.createElement("dt");
      const detail = document.createElement("dd");
      term.textContent = label;
      detail.textContent = value;
      row.append(term, detail);
      return row;
    });

    document.getElementById("project-review-heading").textContent = project.heading;
    document.getElementById("project-review-intro").textContent = project.intro;
    document.getElementById("project-review-checklist").replaceChildren(...checklist);
    document.getElementById("blog-review-heading").textContent = publication.heading;
    document.getElementById("review-title-label").textContent = publication.titleLabel;
    document.getElementById("review-title-note").textContent = publication.titleNote;
    document.getElementById("review-publish-rules").replaceChildren(...rules);

    const example = document.getElementById("review-title-example");
    example.textContent = publication.title ?? "";
    example.hidden = !example.textContent.trim();
    reviewReady = true;
    updatePhotoLayout();
  } catch {
    // Keep the last rendered announcement while its data source is unavailable.
  } finally {
    loadingReview = false;
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
  photoRegion.textContent = photo.dataset.region ?? "";
  updatePhotoLayout();
  if (photo.dataset.review) refreshReview();
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
const toolbarStatus = document.querySelector("#toolbar-status");
const kioskMode = new URLSearchParams(window.location.search).get("kiosk") === "1";

if (kioskMode) {
  const exitButton = document.querySelector("#exit-kiosk");
  exitButton.hidden = false;

  async function exitKiosk() {
    if (exitButton.disabled) return;
    exitButton.disabled = true;
    toolbarStatus.textContent = "";

    try {
      const response = await fetch("/exit", { method: "POST", mode: "same-origin" });
      if (response.ok) return;
    } catch {
      // Keep the exit button available if the request could not reach the server.
    }
    exitButton.disabled = false;
    toolbarStatus.textContent = "시계를 종료할 수 없습니다.";
  }

  exitButton.addEventListener("click", exitKiosk);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      exitKiosk();
    }
  });
} else if (document.fullscreenEnabled) {
  fullscreen.hidden = false;
  fullscreen.addEventListener("click", async () => {
    toolbarStatus.textContent = "";
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      toolbarStatus.textContent = "브라우저에서 전체 화면을 전환할 수 없습니다.";
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
  refreshReview();
}
