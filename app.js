let tapCount = 0;
let isGameActive = false;
const canvas = document.getElementById('tap-area');
const ctx = canvas.getContext('2d');
let audioContext;
let currentAudioSource = null;

canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

const glowColors = ['#ff80ed', '#ff4081', '#e040fb', '#7c4dff', '#536dfe'];
const soundFiles = ['sfx/quiet-night-lo-fi-piano.wav', 'sfx/peachy-lo-fi-piano-chop.wav'];
let sounds = [];
let soundIndex = 0;

document.getElementById('start-button').addEventListener('click', startGame);
canvas.addEventListener('mousedown', handleTapDown);
canvas.addEventListener('mouseup', handleTapUp);
canvas.addEventListener('mouseleave', handleTapUp); // Handle the case when the cursor leaves the canvas

function startGame() {
  if (isGameActive) return;
  isGameActive = true;
  tapCount = 0;
  document.getElementById('tap-count').innerText = 'Taps: 0';
  let timeLeft = 5;
  document.getElementById('timer').innerText = timeLeft;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById('timer').innerText = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      isGameActive = false;
      showEndGameAlert();
    }
  }, 1000);
}

function handleTapDown(event) {
  if (!isGameActive) return;

  // Lazily initialize the AudioContext
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    loadSounds(); // Load sounds after AudioContext is initialized
  }

  tapCount++;
  document.getElementById('tap-count').innerText = `Taps: ${tapCount}`;

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const color = glowColors[Math.floor(Math.random() * glowColors.length)];
  drawGlow(x, y, color);

  playSound(soundIndex);
  soundIndex = (soundIndex + 1) % sounds.length;

  // Vibrate on tap for mobile users
  if ('vibrate' in navigator) navigator.vibrate(50);
}

function handleTapUp() {
  if (currentAudioSource) {
    currentAudioSource.stop();
    currentAudioSource = null;
  }
}

function loadSounds() {
  sounds = soundFiles.map(path => new Promise((resolve, reject) => {
    fetch(path)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        resolve(audioBuffer);
      }).catch(reject);
  }));

  // Wait for all sounds to be loaded
  Promise.all(sounds).then(loadedSounds => {
    sounds = loadedSounds;
  });
}

function drawGlow(x, y, color) {
  const radius = 50;
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.6, color + '55'); // Semi-transparent at 60% of the radius
  gradient.addColorStop(1, 'transparent'); // Fully transparent at the edge

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function showEndGameAlert() {
  const save = confirm(`Time's up! You tapped ${tapCount} times. Would you like to save your masterpiece?`);
  if (save) saveCanvasAsPNG();
}

function saveCanvasAsPNG() {
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  tempCtx.fillStyle = '#2b003b';
  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
  tempCtx.drawImage(canvas, 0, 0);
  const link = document.createElement('a');
  link.download = 'tap-game-canvas.png';
  link.href = tempCanvas.toDataURL('image/png');
  link.click();
}

function playSound(index) {
  if (currentAudioSource) currentAudioSource.stop(); // Stop any currently playing sound
  const source = audioContext.createBufferSource();
  source.buffer = sounds[index];
  source.connect(audioContext.destination);
  source.start(0);
  currentAudioSource = source;
}
