const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

// set canvas size
const particlesArray = [];
const numParticles = 50;

// song selector
const songSelect = document.getElementById('song-select');
const audio = new Audio();
let currentSong = songSelect.value;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  //center text
  ctx.font = '20px Arial';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'white';
  ctx.fillText('click to start', canvas.width / 2, canvas.height / 2);
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// generate random color
function generateColor() {
  const hexSet = '0123456789ABCDEF';
  let finalHexString = '#';
  for (let i = 0; i < 6; i++) {
    finalHexString += hexSet[Math.floor(Math.random() * 16)];
  }
  return finalHexString;
}

// particle constructor
function Particle(x, y, size, color, speed) {
  this.x = x;
  this.y = y;
  this.size = size;
  this.color = color;
  this.speed = speed;
  this.angle = Math.random() * Math.PI * 2;

  this.update = (audioValue, frequencyType) => {
    this.angle += this.speed;
    // scale audio for radius
    const radius = audioValue * 200;

    if (frequencyType === 'low') {
      // larger size for low freq hits
      this.size = audioValue * 10;
    }
    this.x = canvas.width / 2 + Math.cos(this.angle) * radius;
    this.y = canvas.height / 2 + Math.sin(this.angle) * radius;
  };

  this.draw = () => {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  };
}

// draw high frequency particles
function drawHighFreqParticles(highFreqArray) {
  for (let i = 0; i < highFreqArray.length; i++) {
    if (Math.random() > 0.5) {
      ctx.beginPath();
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = (highFreqArray[i] / 255) * 10;
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = generateColor();
      ctx.fill();
    }
  }
}

// generate particles
function generateParticles(amount) {
  for (let i = 0; i < amount; i++) {
    particlesArray.push(
      new Particle(
        canvas.width / 2,
        canvas.height / 2,
        4,
        generateColor(),
        Math.random() * 0.02
      )
    );
  }
}

songSelect.addEventListener('change', (e) => {
  currentSong = e.target.value;
  audio.src = currentSong;
});

//initialize audio visualizer
function start() {
  canvas.removeEventListener('click', start);

  //make a web audio context
  const audioContext = new AudioContext();
  const analyser = audioContext.createAnalyser();
  const audioDataArray = new Uint8Array(analyser.frequencyBinCount);

  //set up audio source
  const audio = new Audio();
  audio.loop = true;
  audio.crossOrigin = 'anonymous';
  audio.src = currentSong;

  audio.addEventListener('canplay', () => {
    const source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    audio.play();
  });

  generateParticles(numParticles);

  function render() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    //get current audio data
    analyser.getByteFrequencyData(audioDataArray);

    //low frequencies
    const low = audioDataArray.slice(0, audioDataArray.length / 3);
    //mid frequencies
    const mid = audioDataArray.slice(
      audioDataArray.length / 3,
      (2 * audioDataArray.length) / 3
    );
    //high frequencies
    const high = audioDataArray.slice((2 * audioDataArray.length) / 3);

    particlesArray.forEach((particle, i) => {
      const audioValue = low[i % low.length] / 255;
      particle.update(audioValue, 'low');
      particle.draw();
    });

    drawHighFreqParticles(mid);

    requestAnimationFrame(render);
  }
  render();
}

canvas.addEventListener('click', start);
