// Canvas setup
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
let audioContext, analyzer, dataArray, audioSource;
let isPlaying = false;
const audio = new Audio();

// Initialize audio analyzer
async function initializeAnalyzer() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyzer = audioContext.createAnalyser();
        analyzer.fftSize = 128;
        dataArray = new Uint8Array(analyzer.frequencyBinCount);
        
        audioSource = audioContext.createMediaElementSource(audio);
        audioSource.connect(analyzer);
        analyzer.connect(audioContext.destination);
        
        console.log('Audio context initialized successfully');
        draw();
    } catch (error) {
        console.error('Error initializing audio context:', error);
    }
}

// Draw visualization
function draw() {
    requestAnimationFrame(draw);
    
    if (!analyzer) return;
    
    analyzer.getByteFrequencyData(dataArray);
    
    // Clear canvas with fade effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const spacing = 2;
    const barWidth = (canvas.width / dataArray.length) - spacing;
    
    // Draw bars from left to right
    for(let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] * canvas.height / 256) * 0.8;
        const x = i * (barWidth + spacing);
        drawBar(x, barHeight, barWidth);
    }
}

// Draw individual bar
function drawBar(x, height, width) {
    const y = canvas.height - height;
    
    const gradient = ctx.createLinearGradient(0, y, 0, canvas.height);
    gradient.addColorStop(0, '#a855f7');
    gradient.addColorStop(1, '#ec4899');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);
}

// Set canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Handle file input
function setupAudioHandlers() {
    const fileInput = document.getElementById('audio-file');
    const playButton = document.getElementById('play-button');
    const volumeControl = document.getElementById('volume');
    
    fileInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (file && file.type === 'audio/wav') {
            const fileURL = URL.createObjectURL(file);
            audio.src = fileURL;
            
            if (!audioContext) {
                await initializeAnalyzer();
            }
            
            playButton.disabled = false;
            document.getElementById('file-name').textContent = file.name;
        } else {
            alert('Please select a WAV file');
            fileInput.value = '';
            document.getElementById('file-name').textContent = '';
            playButton.disabled = true;
        }
    });
    
    playButton.addEventListener('click', async () => {
        if (isPlaying) {
            audio.pause();
            playButton.textContent = 'Play';
        } else {
            try {
                if (audioContext && audioContext.state === 'suspended') {
                    await audioContext.resume();
                }
                await audio.play();
                playButton.textContent = 'Pause';
            } catch (error) {
                console.error('Error playing audio:', error);
            }
        }
        isPlaying = !isPlaying;
    });
    
    volumeControl.addEventListener('input', (e) => {
        audio.volume = e.target.value / 100;
    });

    audio.addEventListener('ended', () => {
        isPlaying = false;
        playButton.textContent = 'Play';
    });
}

// Initialize
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
setupAudioHandlers();