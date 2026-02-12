(function () {
    'use strict';

    const FOCUS_SECONDS = 25 * 60;
    const BREAK_SECONDS = 5 * 60;
    const LONG_BREAK_SECONDS = 15 * 60;
    const SESSIONS_BEFORE_LONG_BREAK = 4;
    const XP_PER_SESSION = 10;
    const XP_PER_LEVEL = 100;

    let state = {
        timeRemaining: FOCUS_SECONDS,
        mode: 'focus',
        isRunning: false,
        intervalId: null,
        xp: 0,
        level: 1,
        sessions: 0,
        sessionsInCycle: 0,
        streak: 0,
        lastSessionDate: null,
        theme: 'blue'
    };

    const elements = {
        timerDisplay: document.getElementById('timer-display'),
        toggleBtn: document.getElementById('toggle-btn'),
        modeLabel: document.getElementById('mode-label'),
        character: document.getElementById('character'),
        progressBar: document.getElementById('progress-bar'),
        xpDisplay: document.getElementById('xp-display'),
        levelDisplay: document.getElementById('level-display'),
        sessionsDisplay: document.getElementById('sessions-display'),
        themeBtn: document.getElementById('theme-btn'),
        popupContainer: document.getElementById('popup-container'),
        flashOverlay: document.getElementById('flash-overlay'),
        sparkleContainer: document.getElementById('sparkle-container'),
        streakDisplay: document.getElementById('streak-display'),
        sessionDots: document.getElementById('session-dots'),
        greatWorkPopup: document.getElementById('great-work-popup'),
        content: document.querySelector('.content')
    };

    /* ---------- SOUNDS ---------- */
    let audioContext = null;

    function getAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioContext;
    }

    function playTone(freq, duration, type) {
        try {
            const ctx = getAudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = freq;
            osc.type = type || 'sine';
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + duration);
        } catch (e) {}
    }

    function playClick() {
        playTone(800, 0.05, 'square');
    }

    function playDing() {
        playTone(523, 0.15, 'sine');
        setTimeout(function () {
            playTone(659, 0.2, 'sine');
        }, 100);
    }

    function playCelebration() {
        playTone(523, 0.1, 'sine');
        setTimeout(function () {
            playTone(659, 0.1, 'sine');
        }, 80);
        setTimeout(function () {
            playTone(784, 0.15, 'sine');
        }, 160);
    }

    function playLongBreakCelebration() {
        playTone(523, 0.15, 'sine');
        setTimeout(function () {
            playTone(659, 0.15, 'sine');
        }, 120);
        setTimeout(function () {
            playTone(784, 0.15, 'sine');
        }, 240);
        setTimeout(function () {
            playTone(1047, 0.2, 'sine');
        }, 360);
    }

    /* ---------- DATA ---------- */
    function saveData() {
        const data = {
            xp: state.xp,
            sessions: state.sessions,
            sessionsInCycle: state.sessionsInCycle,
            streak: state.streak,
            lastSessionDate: state.lastSessionDate,
            theme: state.theme
        };
        try {
            localStorage.setItem('pomodoroData', JSON.stringify(data));
        } catch (e) {}
    }

    function loadData() {
        try {
            const raw = localStorage.getItem('pomodoroData');
            if (raw) {
                const data = JSON.parse(raw);
                state.xp = Number(data.xp) || 0;
                state.sessions = Number(data.sessions) || 0;
                state.sessionsInCycle = Number(data.sessionsInCycle) || 0;
                state.streak = Number(data.streak) || 0;
                state.lastSessionDate = data.lastSessionDate || null;
                state.level = Math.floor(state.xp / XP_PER_LEVEL) + 1;
                state.theme = data.theme || 'blue';
            }
        } catch (e) {}
    }

    function saveStreak() {
        try {
            const data = JSON.parse(localStorage.getItem('pomodoroData') || '{}');
            data.streak = state.streak;
            data.lastSessionDate = state.lastSessionDate;
            localStorage.setItem('pomodoroData', JSON.stringify(data));
        } catch (e) {}
    }

    function loadStreak() {
        try {
            const raw = localStorage.getItem('pomodoroData');
            if (raw) {
                const data = JSON.parse(raw);
                state.streak = Number(data.streak) || 0;
                state.lastSessionDate = data.lastSessionDate || null;
                var today = getTodayDateString();
                if (state.lastSessionDate && getDaysDiff(today, state.lastSessionDate) > 1) {
                    state.streak = 0;
                }
            }
        } catch (e) {}
    }

    function getTodayDateString() {
        var d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function getDaysDiff(dateStr1, dateStr2) {
        var d1 = new Date(dateStr1);
        var d2 = new Date(dateStr2);
        return Math.floor((d1 - d2) / (24 * 60 * 60 * 1000));
    }

    function saveTheme() {
        try {
            const data = JSON.parse(localStorage.getItem('pomodoroData') || '{}');
            data.theme = state.theme;
            localStorage.setItem('pomodoroData', JSON.stringify(data));
        } catch (e) {}
    }

    function loadTheme() {
        try {
            const raw = localStorage.getItem('pomodoroData');
            if (raw) {
                const data = JSON.parse(raw);
                state.theme = data.theme || 'blue';
            }
        } catch (e) {}
    }

    /* ---------- XP & LEVELS ---------- */
    function addXP() {
        const wasLevel = state.level;
        state.xp += XP_PER_SESSION;
        state.level = Math.floor(state.xp / XP_PER_LEVEL) + 1;
        saveData();
        showXPPopup();
        if (state.level > wasLevel) {
            showLevelUpPopup();
        }
    }

    function showXPPopup() {
        const popup = document.createElement('div');
        popup.className = 'popup popup-xp';
        popup.textContent = '+10 XP!';
        elements.popupContainer.appendChild(popup);
        setTimeout(function () {
            popup.remove();
        }, 1500);
    }

    function showLevelUpPopup() {
        const popup = document.createElement('div');
        popup.className = 'popup popup-level';
        popup.textContent = 'LEVEL UP!';
        elements.popupContainer.appendChild(popup);
        setTimeout(function () {
            popup.remove();
        }, 2000);
    }

    /* ---------- PROGRESS BAR ---------- */
    function getTotalTime() {
        if (state.mode === 'focus') return FOCUS_SECONDS;
        if (state.mode === 'longBreak') return LONG_BREAK_SECONDS;
        return BREAK_SECONDS;
    }

    function updateProgressBar() {
        const total = getTotalTime();
        const elapsed = total - state.timeRemaining;
        const percent = total > 0 ? Math.min(100, (elapsed / total) * 100) : 0;
        elements.progressBar.style.width = percent + '%';
        elements.progressBar.classList.remove('progress-focus', 'progress-break', 'progress-longbreak');
        if (state.mode === 'focus') {
            elements.progressBar.classList.add('progress-focus');
        } else if (state.mode === 'longBreak') {
            elements.progressBar.classList.add('progress-longbreak');
        } else {
            elements.progressBar.classList.add('progress-break');
        }
    }

    /* ---------- DISPLAY ---------- */
    function formatTime(seconds) {
        const total = Math.max(0, Math.floor(seconds));
        const mins = Math.floor(total / 60);
        const secs = total % 60;
        return mins + ':' + (secs < 10 ? '0' : '') + secs;
    }

    function updateDisplay() {
        elements.timerDisplay.textContent = formatTime(state.timeRemaining);
        if (state.mode === 'focus') {
            elements.modeLabel.textContent = 'Focus';
            elements.character.src = 'focus.png';
        } else if (state.mode === 'longBreak') {
            elements.modeLabel.textContent = 'Long Break';
            elements.character.src = 'break.png';
        } else {
            elements.modeLabel.textContent = 'Break';
            elements.character.src = 'break.png';
        }
        elements.xpDisplay.textContent = 'XP: ' + state.xp;
        elements.levelDisplay.textContent = 'Lv.' + state.level;
        elements.sessionsDisplay.textContent = 'Sessions: ' + state.sessions;
        if (elements.streakDisplay) {
            elements.streakDisplay.textContent = '\uD83D\uDD25 Streak: ' + state.streak + ' day' + (state.streak === 1 ? '' : 's');
        }
        updateProgressBar();
        updateSessionDots();
    }

    /* ---------- ANIMATIONS ---------- */
    function triggerBounce() {
        elements.character.classList.remove('character-breathe', 'character-bounce');
        void elements.character.offsetWidth;
        elements.character.classList.add('character-bounce');
        setTimeout(function () {
            elements.character.classList.remove('character-bounce');
            if (state.isRunning) {
                elements.character.classList.add('character-breathe');
            }
        }, 500);
    }

    function updateIdleAnimation() {
        if (state.isRunning) {
            elements.character.classList.add('character-breathe');
        } else {
            elements.character.classList.remove('character-breathe');
        }
    }

    /* ---------- SESSION COMPLETE EFFECT ---------- */
    function handleSessionComplete() {
        if (!elements.flashOverlay || !elements.sparkleContainer) return;
        elements.flashOverlay.classList.add('flash-active');
        playCelebration();

        var count = 6;
        for (var i = 0; i < count; i++) {
            (function (idx) {
                setTimeout(function () {
                    var s = document.createElement('div');
                    s.className = 'sparkle';
                    var angle = (idx / count) * 360 * Math.PI / 180;
                    var radius = 25;
                    s.style.left = (50 + Math.cos(angle) * radius) + '%';
                    s.style.top = (50 + Math.sin(angle) * radius) + '%';
                    elements.sparkleContainer.appendChild(s);
                    setTimeout(function () { s.remove(); }, 600);
                }, idx * 50);
            })(i);
        }

        setTimeout(function () {
            elements.flashOverlay.classList.remove('flash-active');
        }, 600);
    }

    /* ---------- SESSION DOTS ---------- */
    function updateSessionDots() {
        if (!elements.sessionDots) return;
        var dots = elements.sessionDots.querySelectorAll('.dot');
        var filled = state.sessionsInCycle;
        for (var i = 0; i < dots.length; i++) {
            dots[i].classList.toggle('filled', i < filled);
        }
    }

    /* ---------- STREAK ---------- */
    function updateStreak() {
        var today = getTodayDateString();
        if (state.lastSessionDate === today) return;
        if (!state.lastSessionDate) {
            state.streak = 1;
            state.lastSessionDate = today;
            saveStreak();
            return;
        }
        var diff = getDaysDiff(today, state.lastSessionDate);
        if (diff === 1) {
            state.streak += 1;
        } else {
            state.streak = 1;
        }
        state.lastSessionDate = today;
        saveStreak();
    }

    /* ---------- LONG BREAK ---------- */
    function triggerLongBreak() {
        state.mode = 'longBreak';
        state.timeRemaining = LONG_BREAK_SECONDS;
        state.sessionsInCycle = 0;
    }

    /* ---------- LONG BREAK REWARD ---------- */
    function handleLongBreakReward() {
        if (!elements.character || !elements.content || !elements.greatWorkPopup) return;
        playLongBreakCelebration();
        elements.character.classList.add('character-golden-glow');
        elements.content.classList.add('content-longbreak-reward');
        elements.greatWorkPopup.classList.add('active');

        setTimeout(function () {
            elements.character.classList.remove('character-golden-glow');
            elements.content.classList.remove('content-longbreak-reward');
            elements.greatWorkPopup.classList.remove('active');
            if (state.isRunning) {
                elements.character.classList.add('character-breathe');
            }
        }, 1500);
    }

    /* ---------- TIMER ---------- */
    function clearTimerInterval() {
        if (state.intervalId !== null) {
            clearInterval(state.intervalId);
            state.intervalId = null;
        }
    }

    function switchMode() {
        const wasFocus = state.mode === 'focus';
        const wasBreak = state.mode === 'break' || state.mode === 'longBreak';
        clearTimerInterval();

        if (wasFocus) {
            state.sessions += 1;
            state.sessionsInCycle += 1;
            addXP();
            updateStreak();

            if (state.sessionsInCycle >= SESSIONS_BEFORE_LONG_BREAK) {
                triggerLongBreak();
                handleLongBreakReward();
            } else {
                handleSessionComplete();
                state.mode = 'break';
                state.timeRemaining = BREAK_SECONDS;
            }
        } else if (wasBreak) {
            playDing();
            state.mode = 'focus';
            state.timeRemaining = FOCUS_SECONDS;
        }

        state.timeRemaining = Math.max(0, state.timeRemaining);
        saveData();
        updateDisplay();
        if (state.mode !== 'longBreak') {
            triggerBounce();
        } else {
            updateIdleAnimation();
        }
        state.isRunning = true;
        elements.toggleBtn.textContent = 'Pause';
        state.intervalId = setInterval(tick, 1000);
    }

    function tick() {
        if (state.timeRemaining <= 0) {
            switchMode();
            return;
        }
        state.timeRemaining = Math.max(0, state.timeRemaining - 1);
        updateDisplay();
    }

    function startTimer() {
        if (state.intervalId !== null) return;
        state.isRunning = true;
        elements.toggleBtn.textContent = 'Pause';
        state.intervalId = setInterval(tick, 1000);
        updateIdleAnimation();
    }

    function pauseTimer() {
        clearTimerInterval();
        state.isRunning = false;
        elements.toggleBtn.textContent = 'Start';
        updateIdleAnimation();
    }

    function toggle() {
        playClick();
        if (state.isRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    }

    /* ---------- THEME ---------- */
    function applyTheme(themeName) {
        var theme = themeName || state.theme;
        if (themeName) state.theme = theme;
        document.body.className = 'theme-' + theme;
    }

    function cycleTheme() {
        var themes = ['blue', 'brown', 'pink'];
        var idx = themes.indexOf(state.theme);
        state.theme = themes[(idx + 1) % themes.length];
        saveTheme();
        saveData();
        applyTheme(state.theme);
    }

    /* ---------- INIT ---------- */
    loadData();
    loadTheme();
    loadStreak();
    applyTheme(state.theme);
    updateDisplay();
    elements.toggleBtn.addEventListener('click', toggle);
    elements.themeBtn.addEventListener('click', function () {
        playClick();
        cycleTheme();
    });
})();
