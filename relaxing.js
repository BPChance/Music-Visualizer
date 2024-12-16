const songs = [
    {
        title: "Alternative Outro",
        artist: "Lucki",
        file: "songs/Alternative Outro.wav"
    },
    {
        title: "Sleep Patterns",
        artist: "Merchant Ships",
        file: "songs/Sleep Patterns.wav"
    },
    {
        title: "My Kind Of Woman",
        artist: "Mac DeMarco",
        file: "songs/My Kind Of Woman.wav"
    },
    {
        title: "Heart To Heart",
        artist: "Mac DeMarco",
        file: "songs/Heart To Heart.wav"
    },
    {
        title: "No Surprises",
        artist: "Radiohead",
        file: "songs/No Surprises.wav"
    }
];

// Canvas setup
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
let audioContext, analyzer, dataArray, audioSource;
let isPlaying = false;
const audio = new Audio();

// Add smooth transition values
const smoothingFactor = 0.8;
let previousData = [];

// Initialize song select dropdown
function initializeSongSelect() {
    const songSelect = document.getElementById('song-select');
    
    songs.forEach((song, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${song.title} - ${song.artist}`;
        songSelect.appendChild(option);
    });
}

// Initialize audio analyzer
async function initializeAnalyzer() {
    try {
        audioContext = new AudioContext();
        analyzer = audioContext.createAnalyser();
        analyzer.fftSize = 64;
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
    
    // Apply smoothing
    if (previousData.length === 0) {
        previousData = [...dataArray];
    }
    
    for (let i = 0; i < dataArray.length; i++) {
        dataArray[i] = dataArray[i] * (1 - smoothingFactor) + previousData[i] * smoothingFactor;
        previousData[i] = dataArray[i];
    }
    
    // Clear canvas with solid black
    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const barWidth = Math.ceil(canvas.width / dataArray.length);
    const maxHeight = canvas.height * 1;
    
    // Draw bars
    dataArray.forEach((value, i) => {
        const height = (value * maxHeight / 256);
        const x = i * barWidth;
        const y = canvas.height - height;
        
        // Create gradient that goes from pink to purple
        const gradient = ctx.createLinearGradient(x, y, x, canvas.height);
        gradient.addColorStop(0, '#ec4899'); // Pink at top
        gradient.addColorStop(1, '#a855f7'); // Purple at bottom
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth - 1, height);
    });
}

// Set canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Handle audio setup
function setupAudioHandlers() {
    const songSelect = document.getElementById('song-select');
    const playButton = document.getElementById('play-button');
    const volumeControl = document.getElementById('volume');
    
    songSelect.addEventListener('change', async function(e) {
        const selectedSong = songs[this.value];
        if (selectedSong) {
            audio.src = selectedSong.file;
            
            if (!audioContext) {
                await initializeAnalyzer();
            }
            
            playButton.disabled = false;
            document.getElementById('file-name').textContent = `${selectedSong.title} - ${selectedSong.artist}`;
        } else {
            playButton.disabled = true;
            document.getElementById('file-name').textContent = '';
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
initializeSongSelect();
setupAudioHandlers();