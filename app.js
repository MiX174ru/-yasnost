// "Я Ясность v2" - Full implementation
let state = {
  checkins: JSON.parse(localStorage.getItem('fv_checkins') || '[]'),
  voiceRecordings: JSON.parse(localStorage.getItem('fv_voices') || '[]'),
  dayScore: 62,
  silentMode: false
};

function saveState() {
  localStorage.setItem('fv_checkins', JSON.stringify(state.checkins));
  localStorage.setItem('fv_voices', JSON.stringify(state.voiceRecordings));
}

// Update UI from state
function updateTodayScreen() {
  const avg = state.checkins.length 
    ? Math.round(state.checkins.reduce((a,b) => a + (b.type === 'good' ? 3 : b.type === 'mid' ? 2 : 1), 0) / state.checkins.length * 20)
    : 62;
  
  document.getElementById('state-value').innerHTML = avg + '<small>%</small>';
  document.getElementById('state-bar').style.width = avg + '%';
  document.getElementById('day-pct').textContent = avg + '%';
}

// Check-in system
function openCheckin() {
  document.getElementById('checkin').classList.add('active');
}

function closeCheckin() {
  document.getElementById('checkin').classList.remove('active');
}

function submitCheckin(type) {
  state.checkins.push({ type, date: new Date().toISOString() });
  saveState();
  closeCheckin();
  updateTodayScreen();
  
  // Simulate notification
  if (!state.silentMode) {
    setTimeout(() => alert('Чек-ин сохранён. Спасибо!'), 300);
  }
}

// Voice recording (real feature!)
let mediaRecorder;
let audioChunks = [];

function startVoiceRecording() {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      
      mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        
        state.voiceRecordings.push({ url, date: new Date().toISOString() });
        saveState();
        alert('Голосовое письмо сохранено! (в реальном приложении — отправлено в будущее)');
      };
      
      mediaRecorder.start();
      alert('Запись началась... Нажми OK, чтобы остановить');
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') mediaRecorder.stop();
      }, 8000);
    })
    .catch(() => alert('Микрофон недоступен в этом браузере'));
}

// Simple audio player for voice screen
let isPlaying = false;
let progressInterval;

function toggleVoicePlayer() {
  const btn = document.getElementById('playBtn');
  const fill = document.getElementById('progress-fill');
  const timeEl = document.getElementById('current-time');
  
  isPlaying = !isPlaying;
  
  if (isPlaying) {
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>';
    progressInterval = setInterval(() => {
      let w = parseFloat(fill.style.width) || 0;
      w = Math.min(w + 2, 100);
      fill.style.width = w + '%';
      timeEl.textContent = (w / 100 * 8).toFixed(1).replace('.', ':');
      if (w >= 100) {
        clearInterval(progressInterval);
        isPlaying = false;
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
        fill.style.width = '0%';
      }
    }, 200);
  } else {
    clearInterval(progressInterval);
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  }
}

function skipVoice(seconds) {
  const fill = document.getElementById('progress-fill');
  let w = parseFloat(fill.style.width) || 0;
  w = Math.max(0, Math.min(100, w + (seconds / 8)));
  fill.style.width = w + '%';
}

// Crisis & silent mode
function crisisProtocol() {
  alert('Кризисный протокол активирован.\nДыхание 4-7-8 начато.');
}

function toggleSilentMode() {
  state.silentMode = !state.silentMode;
  alert(state.silentMode ? 'Тихий режим включён' : 'Тихий режим выключён');
}

// Tab navigation
function show(screenId, tabEl) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  
  if (tabEl) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tabEl.classList.add('active');
  }
  
  if (screenId === 'screen-today') updateTodayScreen();
}

// Initialize
function init() {
  // Update time
  const timeEl = document.getElementById('time');
  if (timeEl) timeEl.textContent = new Date().toLocaleTimeString('ru', {hour:'2-digit', minute:'2-digit'});
  
  // Populate actions
  const actions = document.getElementById('actions-list');
  if (actions) {
    actions.innerHTML = `
      <button class="action-card" onclick="show('screen-voice')">
        <div class="action-icon morning">🌅</div>
        <div class="action-text"><div class="action-title">Утренняя настройка</div></div>
      </button>
      <button class="action-card" onclick="openCheckin()">
        <div class="action-icon day">☀️</div>
        <div class="action-text"><div class="action-title">Дневной чек-ин</div></div>
      </button>
    `;
  }
  
  // Voice player
  const playBtn = document.getElementById('playBtn');
  if (playBtn) playBtn.onclick = toggleVoicePlayer;
  
  updateTodayScreen();
  
  // PWA install prompt (optional)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

window.onload = init;