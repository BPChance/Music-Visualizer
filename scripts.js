// Audio setup
const audio = new Audio();
audio.src = './test.mp3';
audio.loop = true;
audio.volume = 1.0;

// Visualizer setup
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
let audioContext, analyzer, dataArray;

// Initialize audio context and analyzer
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyzer = audioContext.createAnalyser();
        const source = audioContext.createMediaElementSource(audio);
        source.connect(analyzer);
        analyzer.connect(audioContext.destination);
        analyzer.fftSize = 256;
        dataArray = new Uint8Array(analyzer.frequencyBinCount);
        
        // Add volume control
        const volumeControl = document.createElement('input');
        volumeControl.type = 'range';
        volumeControl.min = 0;
        volumeControl.max = 1;
        volumeControl.step = 0.1;
        volumeControl.value = audio.volume;
        volumeControl.className = 'fixed top-20 right-4 z-20';
        document.body.appendChild(volumeControl);
        
        volumeControl.addEventListener('input', (e) => {
            audio.volume = e.target.value;
        });
        
        // Start visualization
        draw();
    } catch (error) {
        console.error('Audio initialization error:', error);
    }
}

// Draw visualization
function draw() {
    requestAnimationFrame(draw);
    analyzer.getByteFrequencyData(dataArray);
    
    // Clear the canvas with a fade effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate bar width to fill the entire screen
    const spacing = 2;
    const barWidth = (canvas.width / dataArray.length) - spacing;
    
    // Center the visualization
    const totalWidth = (barWidth + spacing) * dataArray.length;
    const startX = (canvas.width - totalWidth) / 2;
    
    dataArray.forEach((frequency, index) => {
        // Make the visualization more dramatic
        const barHeight = (frequency * canvas.height / 256) * 0.8;
        
        // Calculate x position with spacing
        const x = startX + (barWidth + spacing) * index;
        const y = canvas.height - barHeight;
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, '#a855f7');
        gradient.addColorStop(1, '#ec4899');
        
        ctx.fillStyle = gradient;
        
        // Add glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#a855f7';
        
        ctx.fillRect(x, y, barWidth, barHeight);
    });
    
    // Reset shadow effect
    ctx.shadowBlur = 0;
}

// Set canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Create play button
const playButton = document.createElement('button');
playButton.textContent = 'Start Music';
playButton.className = 'fixed top-4 right-4 px-4 py-2 bg-purple-500 text-white rounded-lg z-20 hover:bg-purple-600';
document.body.appendChild(playButton);

// Handle play button click
playButton.addEventListener('click', async () => {
    try {
        if (!audioContext) {
            initAudio();
        }
        
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        
        if (audio.paused) {
            await audio.play();
            playButton.textContent = 'Pause';
        } else {
            audio.pause();
            playButton.textContent = 'Play';
        }
        
    } catch (error) {
        console.error('Playback error:', error);
        playButton.textContent = 'Error - Try Again';
    }
});

// Add click event listeners to buttons
document.querySelectorAll('.mood-button').forEach(button => {
    button.addEventListener('click', () => {
        const mood = button.textContent.toLowerCase();
        window.location.href = `${mood}.html`;
    });
});