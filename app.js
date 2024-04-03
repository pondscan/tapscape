let tapCount = 0;
let isGameActive = false;
let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let currentAudioSource = null;

// Define the canvas and context
const canvas = document.getElementById('tap-area');
const ctx = canvas.getContext('2d');

// Set canvas dimensions
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

// Define colors and sounds
const glowColors = ['#ff80ed', '#ff4081', '#e040fb', '#7c4dff', '#536dfe'];
const soundFiles = [
  'sfx/quiet-night-lo-fi-piano.wav', 
  'sfx/peachy-lo-fi-piano-chop.wav', 
  'sfx/guitar-chilled-loop-bouncy_out.mp3', 
  'sfx/futuristic-crispy-trap_out.mp3', 
  'sfx/boom-bap-beat_out.mp3'
];
let sounds = [];
let soundIndex = 0;

// Start game and handle taps
document.getElementById('start-button').addEventListener('click', startGame);
canvas.addEventListener('mousedown', handleTapDown);
canvas.addEventListener('mouseup', handleTapUp);
canvas.addEventListener('mouseleave', handleTapUp); // Handle the case when the cursor leaves the canvas

// Immediately start loading sounds on page load
window.onload = () => {
  loadSounds();
};

function startGame() {
    if (isGameActive) return;
  
    // Show an alert to ask for consent to use audio.
    const userConsent = confirm("Do you want to enable sound for the game?");
    if (userConsent) {
      // User consented to use audio.
      // Check if the AudioContext was previously suspended and resume it.
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          console.log('AudioContext successfully resumed!');
          // Proceed to load sounds if not already loaded.
          if (sounds.length === 0) {
            loadSounds();
          }
          // The rest of the game initialization code.
          initializeGame();
        }).catch(error => {
          console.error("Error resuming AudioContext:", error);
        });
      } else {
        // AudioContext is already running, proceed with game initialization.
        initializeGame();
      }
    } else {
      // User denied audio consent, proceed with game initialization without sound.
      initializeGame();
    }
  }
  
  function initializeGame() {
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

  tapCount++;
  document.getElementById('tap-count').innerText = `Taps: ${tapCount}`;

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const color = glowColors[Math.floor(Math.random() * glowColors.length)];
  drawGlow(x, y, color);

  playSound(soundIndex);
  soundIndex = (soundIndex + 1) % sounds.length;

  if ('vibrate' in navigator) navigator.vibrate(50);
}

// Other functions remain unchanged


function loadSounds() {
    let loaded = 0;
    const updateLoadingUI = () => {
      loaded++;
      const widthPercent = (loaded / soundFiles.length) * 100;
      document.getElementById('loading-bar').style.width = `${widthPercent}%`;
      document.getElementById('loading-text').innerText = `Loading... ${loaded}/${soundFiles.length}`;
      if (loaded === soundFiles.length) {
        document.getElementById('loading-container').style.display = 'none'; // Hide loading bar when done
      }
    };
  
    sounds = soundFiles.map(path => fetch(path)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        updateLoadingUI();
        return audioBuffer;
      }));
  
    Promise.all(sounds).then(loadedSounds => {
      sounds = loadedSounds;
    }).catch(error => console.error("Error loading sounds:", error));
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
