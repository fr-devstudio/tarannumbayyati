// Tarannum Bayyati Learning Hub — shared interactions
(function () {
  "use strict";

  /* ---------------- Audio players ----------------
     Markup: <div class="player" data-src="audio/file.mp3" data-label="Optional label"></div>
  ------------------------------------------------- */
  const ICONS = {
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/></svg>',
    vol: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
    mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6"/></svg>',
    replay: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4v6h6"/><path d="M3.5 14a9 9 0 1 0 2.1-9.1L3 10"/></svg>',
  };

  const fmt = (s) => {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m + ":" + String(sec).padStart(2, "0");
  };

  const allAudio = [];

  document.querySelectorAll(".player").forEach((el) => {
    const src = el.dataset.src;
    const label = el.dataset.label;
    const audio = new Audio();
    audio.preload = "metadata";
    allAudio.push(audio);

    el.innerHTML =
      '<button type="button" class="player__play" aria-label="Main audio">' + ICONS.play + "</button>" +
      (label ? '<span class="player__label"></span>' : "") +
      '<span class="player__time">0:00 / 0:00</span>' +
      '<input class="player__bar" type="range" min="0" max="100" step="0.1" value="0" aria-label="Kedudukan audio" />' +
      '<button type="button" class="player__icon player__mute" aria-label="Senyap">' + ICONS.vol + "</button>" +
      '<button type="button" class="player__icon player__replay" aria-label="Main semula">' + ICONS.replay + "</button>";

    if (label) el.querySelector(".player__label").textContent = label;
    const playBtn = el.querySelector(".player__play");
    const time = el.querySelector(".player__time");
    const bar = el.querySelector(".player__bar");
    const muteBtn = el.querySelector(".player__mute");
    const replayBtn = el.querySelector(".player__replay");

    const update = () => {
      time.textContent = fmt(audio.currentTime) + " / " + fmt(audio.duration);
      if (audio.duration) bar.value = (audio.currentTime / audio.duration) * 100;
    };

    audio.addEventListener("loadedmetadata", update);
    audio.addEventListener("timeupdate", update);
    audio.addEventListener("play", () => { playBtn.innerHTML = ICONS.pause; playBtn.setAttribute("aria-label", "Jeda audio"); });
    audio.addEventListener("pause", () => { playBtn.innerHTML = ICONS.play; playBtn.setAttribute("aria-label", "Main audio"); });
    audio.addEventListener("ended", () => { bar.value = 0; });
    audio.addEventListener("error", () => {
      el.classList.add("is-missing");
      time.textContent = "Tiada audio";
      time.classList.add("player__missing");
    });

    audio.src = src || "";

    playBtn.addEventListener("click", () => {
      if (el.classList.contains("is-missing")) return;
      if (audio.paused) {
        allAudio.forEach((a) => { if (a !== audio) a.pause(); }); // only one plays at a time
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
    });

    bar.addEventListener("input", () => {
      if (audio.duration) audio.currentTime = (bar.value / 100) * audio.duration;
    });

    muteBtn.addEventListener("click", () => {
      audio.muted = !audio.muted;
      muteBtn.innerHTML = audio.muted ? ICONS.mute : ICONS.vol;
      muteBtn.setAttribute("aria-label", audio.muted ? "Bunyikan" : "Senyap");
    });

    replayBtn.addEventListener("click", () => {
      if (el.classList.contains("is-missing")) return;
      audio.currentTime = 0;
      allAudio.forEach((a) => { if (a !== audio) a.pause(); });
      audio.play().catch(() => {});
    });
  });

  /* ---------------- Falling petals ---------------- */
  const stage = document.querySelector(".stage");
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (stage && !calm) {
    for (let i = 0; i < 9; i++) {
      const p = document.createElement("span");
      p.className = "petal";
      p.setAttribute("aria-hidden", "true");
      p.style.left = Math.round(Math.random() * 96) + "%";
      p.style.animationDuration = (11 + Math.random() * 9).toFixed(1) + "s";
      p.style.animationDelay = (-Math.random() * 18).toFixed(1) + "s";
      const s = 0.7 + Math.random() * 0.6;
      p.style.width = (12 * s).toFixed(1) + "px";
      p.style.height = (10 * s).toFixed(1) + "px";
      stage.appendChild(p);
    }
  }

  /* ---------------- Quiz helpers ---------------- */
  const showFeedback = (box, correct) => {
    box.textContent = correct
      ? "Tahniah! Jawapan anda betul. 🌸"
      : "Cuba lagi. Dengar semula audio dengan teliti.";
    box.className = "feedback " + (correct ? "is-correct" : "is-wrong");
  };

  // Aktiviti: radio + "Semak Jawapan" button
  document.querySelectorAll("form.quiz-check").forEach((form) => {
    const box = form.querySelector(".feedback");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const picked = form.querySelector('input[type="radio"]:checked');
      if (!picked) {
        box.textContent = "Sila pilih satu jawapan dahulu.";
        box.className = "feedback is-wrong";
        return;
      }
      showFeedback(box, picked.value === form.dataset.answer);
    });
  });

  // Latihan: instant feedback on radio change
  document.querySelectorAll(".quiz-instant").forEach((q) => {
    const box = q.querySelector(".feedback");
    q.querySelectorAll('input[type="radio"]').forEach((r) =>
      r.addEventListener("change", () => showFeedback(box, r.value === q.dataset.answer))
    );
  });

  // Latihan: choice buttons
  document.querySelectorAll(".quiz-buttons").forEach((q) => {
    const box = q.querySelector(".feedback");
    const btns = q.querySelectorAll(".choice-btn");
    btns.forEach((b) =>
      b.addEventListener("click", () => {
        btns.forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
        showFeedback(box, b.dataset.value === q.dataset.answer);
      })
    );
  });
})();
