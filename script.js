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

    // Optional clip range in seconds: data-start / data-end
    const clipStart = parseFloat(el.dataset.start) || 0;
    const clipEndAttr = parseFloat(el.dataset.end);
    const clipEnd = () => {
      const d = audio.duration;
      if (!isFinite(d)) return isFinite(clipEndAttr) ? clipEndAttr : 0;
      return isFinite(clipEndAttr) ? Math.min(clipEndAttr, d) : d;
    };
    const clipLen = () => Math.max(clipEnd() - clipStart, 0);

    const update = () => {
      const pos = Math.max(audio.currentTime - clipStart, 0);
      time.textContent = fmt(pos) + " / " + fmt(clipLen());
      if (clipLen()) bar.value = Math.min((pos / clipLen()) * 100, 100);
    };
    const toStart = () => { audio.currentTime = clipStart; update(); };

    audio.addEventListener("loadedmetadata", () => { if (clipStart) audio.currentTime = clipStart; update(); });
    audio.addEventListener("timeupdate", () => {
      if (isFinite(clipEndAttr) && audio.currentTime >= clipEndAttr) { audio.pause(); toStart(); return; }
      update();
    });
    audio.addEventListener("play", () => { playBtn.innerHTML = ICONS.pause; playBtn.setAttribute("aria-label", "Jeda audio"); });
    audio.addEventListener("pause", () => { playBtn.innerHTML = ICONS.play; playBtn.setAttribute("aria-label", "Main audio"); });
    audio.addEventListener("ended", toStart);
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
        if (audio.currentTime < clipStart || audio.currentTime >= clipEnd()) audio.currentTime = clipStart;
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
    });

    bar.addEventListener("input", () => {
      if (clipLen()) audio.currentTime = clipStart + (bar.value / 100) * clipLen();
    });

    muteBtn.addEventListener("click", () => {
      audio.muted = !audio.muted;
      muteBtn.innerHTML = audio.muted ? ICONS.mute : ICONS.vol;
      muteBtn.setAttribute("aria-label", audio.muted ? "Bunyikan" : "Senyap");
    });

    replayBtn.addEventListener("click", () => {
      if (el.classList.contains("is-missing")) return;
      audio.currentTime = clipStart;
      allAudio.forEach((a) => { if (a !== audio) a.pause(); });
      audio.play().catch(() => {});
    });
  });

  /* ---------------- Background music ----------------
     - Loops forever
     - Pauses while any lesson audio plays, resumes when it stops
     - Browsers block sound until the visitor interacts, so it starts on the first tap/click
     - On/off button remembers the choice; position carries over between pages
  ----------------------------------------------------- */
  const BG_SRC = "audio/Maher%20Zain%20-%20Huwa%20AlQuran%20Vocal%20Nasheed%20%5BSlowed%2BReverb%5D.mp3";
  const BG_VOLUME = 0.35;

  const store = {
    get(k, s) { try { return (s ? sessionStorage : localStorage).getItem(k); } catch (e) { return null; } },
    set(k, v, s) { try { (s ? sessionStorage : localStorage).setItem(k, v); } catch (e) {} },
  };

  const bg = new Audio();
  bg.loop = true;
  bg.volume = BG_VOLUME;
  bg.preload = "auto";

  let musicOn = store.get("tb-music") !== "off";
  const lessonPlaying = () => allAudio.some((a) => !a.paused);

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "music-toggle";
  toggle.innerHTML =
    '<svg class="music-toggle__on" viewBox="0 0 24 24" fill="currentColor"><path d="M9 17.5a3 3 0 1 1-2-2.83V5.5l12-2.5v11.5a3 3 0 1 1-2-2.83V7.1l-8 1.66z"/></svg>' +
    '<svg class="music-toggle__off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 17.5a3 3 0 1 1-2-2.83V5.5l12-2.5v11.5a3 3 0 1 1-2-2.83V7.1l-8 1.66z" fill="currentColor" stroke="none" opacity=".45"/><path d="M3 3l18 18"/></svg>';
  document.body.appendChild(toggle);

  const renderToggle = () => {
    toggle.classList.toggle("is-on", musicOn);
    toggle.classList.toggle("is-playing", !bg.paused);
    toggle.setAttribute("aria-pressed", String(musicOn));
    const label = musicOn ? "Matikan muzik latar" : "Hidupkan muzik latar";
    toggle.setAttribute("aria-label", label);
    toggle.title = label;
  };

  const tryPlay = () => {
    if (!musicOn || lessonPlaying()) return;
    bg.play().then(renderToggle).catch(() => {});
  };

  bg.addEventListener("play", renderToggle);
  bg.addEventListener("pause", renderToggle);
  bg.addEventListener("error", () => toggle.remove());

  // Continue from the same spot when moving to another page
  bg.addEventListener("loadedmetadata", () => {
    const t = parseFloat(store.get("tb-music-time", true));
    if (t && t < bg.duration) bg.currentTime = t;
  });
  const savePos = () => store.set("tb-music-time", String(bg.currentTime || 0), true);
  window.addEventListener("pagehide", savePos);
  setInterval(() => { if (!bg.paused) savePos(); }, 2000);

  bg.src = BG_SRC;

  // Lesson audio pauses / resumes the background music
  allAudio.forEach((a) => {
    a.addEventListener("play", () => bg.pause());
    const resume = () => setTimeout(tryPlay, 300); // small delay so switching between clips doesn't blip
    a.addEventListener("pause", resume);
    a.addEventListener("ended", resume);
  });

  toggle.addEventListener("click", () => {
    musicOn = !musicOn;
    store.set("tb-music", musicOn ? "on" : "off");
    if (musicOn) tryPlay(); else bg.pause();
    renderToggle();
  });

  // Try straight away (works if the browser allows it), otherwise start on the first interaction
  renderToggle();
  tryPlay();
  const firstGesture = (e) => {
    if (e.target.closest && e.target.closest(".player, .music-toggle")) return; // those handle sound themselves
    tryPlay();
    if (!bg.paused || !musicOn) {
      document.removeEventListener("pointerdown", firstGesture);
      document.removeEventListener("keydown", firstGesture);
    }
  };
  document.addEventListener("pointerdown", firstGesture);
  document.addEventListener("keydown", firstGesture);

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

  // Latihan: choice buttons (+ explanation and running score)
  const quizzes = document.querySelectorAll(".quiz-buttons");
  const scoreEl = document.getElementById("score");
  const scoreMsg = document.getElementById("score-msg");

  const updateScore = () => {
    if (!scoreEl) return;
    let answered = 0, correct = 0;
    quizzes.forEach((q) => {
      const picked = q.querySelector('.choice-btn[aria-pressed="true"]');
      if (picked) { answered++; if (picked.dataset.value === q.dataset.answer) correct++; }
    });
    scoreEl.textContent = correct;
    if (answered < quizzes.length) {
      scoreMsg.textContent = "Jawab semua soalan untuk melihat keputusan.";
    } else if (correct === quizzes.length) {
      scoreMsg.textContent = "Cemerlang! Anda berjaya mengenal pasti semua melodi Bayyati. 🌸";
    } else {
      scoreMsg.textContent = "Bagus! Dengar semula audio dan cuba betulkan jawapan yang salah.";
    }
  };

  quizzes.forEach((q) => {
    const box = q.querySelector(".feedback");
    const btns = q.querySelectorAll(".choice-btn");
    btns.forEach((b) =>
      b.addEventListener("click", () => {
        btns.forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
        const correct = b.dataset.value === q.dataset.answer;
        showFeedback(box, correct);
        if (correct && q.dataset.explain) box.textContent += " " + q.dataset.explain;
        updateScore();
      })
    );
  });
})();
