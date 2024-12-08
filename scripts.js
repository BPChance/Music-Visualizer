const audioFile = document.getElementById('audioFile');
const startButton = document.getElementById('startBtn');
const stopButton = document.getElementById('stopBtn');
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');

//canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let audioContext, analyser, source, bufferLength, dataArray;
let particles = [];

audioFile.addEventListener('change', handleAudioFile);
startButton.addEventListener('click', playAudio);
stopButton.addEventListener('click', pauseAudio);

function handleAudioFile(event) {
  const file = event.target.files[0];
  if (file) {
    const fileReader = new FileReader();
    fileReader.onload = function () {
      const audioData = fileReader.result;
      initAudioContext(audioData);
    };
    fileReader.readAsArrayBuffer(file);
  }
}

//initialize AudioContexr
function initAudioContext(audioData) {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  audioContext.decodeAudioData(audioData, (buffer) => {
    source = audioContext.createBufferSource();
    source.buffer = buffer;

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);
    analyser.connect(audioContext.destination);
  });
}

function playAudio() {
  if (source) source.start(0);
  animate();
}

//pause audio
function pauseAudio() {
  if (audioContext) {
    audioContext.suspend();
    console.log('Audio paused');
  }
}

function createParticle() {
  const x = Math.random() * canvas.width;
  const y = Math.random() * canvas.height;
  const size = Math.random() * 3 + 1;
  const speed = Math.random() * 1 + 0.5;
  const opacity = Math.random() * 0.7 + 0.3;

  particles.push({ x, y, size, speed, opacity });
}

function updateParticles() {
  particles.forEach((p, i) => {
    p.y -= p.speed;
    if (p.y < 0) particles.splice(i, 1);

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
    ctx.fill();
  });
}

setInterval(createParticle, 50);

//combined animation logic
function animate() {
  requestAnimationFrame(animate);

  analyser.getByteFrequencyData(dataArray);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  //draw central ambient effect
  const bass = dataArray.slice(0, 10).reduce((a, b) => a + b) / 10;
  const radius = Math.min(canvas.width, canvas.height) / 4 + bass * 2;

  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(173, 216, 230, 0.5)`;
  ctx.fill();

  updateParticles();
}
