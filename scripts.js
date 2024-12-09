// Canvas setup
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
let analyzer;
let audioContext;

// Spotify setup
let token = '';
const TRACK_ID = '7FYOAvb72KIVFO7l993ADO';
let player;
let isPlaying = false;

// Get token from URL and clean up URL
function getTokenFromUrl() {
    const hash = window.location.hash
        .substring(1)
        .split('&')
        .reduce((initial, item) => {
            if (item) {
                const parts = item.split('=');
                initial[parts[0]] = decodeURIComponent(parts[1]);
            }
            return initial;
        }, {});
    
    window.location.hash = '';
    return hash.access_token;
}

// Check if we're already authenticated
function checkAuth() {
    const storedToken = sessionStorage.getItem('spotify_token');
    if (storedToken) {
        return storedToken;
    }
    
    const urlToken = getTokenFromUrl();
    if (urlToken) {
        sessionStorage.setItem('spotify_token', urlToken);
        return urlToken;
    }
    
    return null;
}

// Initialize audio analyzer after user interaction
async function initializeAnalyzer() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        await audioContext.resume();
        
        analyzer = audioContext.createAnalyser();
        analyzer.fftSize = 256;
        
        // Create a dummy source for now (we'll update this with actual audio)
        const oscillator = audioContext.createOscillator();
        oscillator.connect(analyzer);
        analyzer.connect(audioContext.destination);
        
        // Start the visualization
        draw();
    }
}

// Initialize Spotify player
function initializeSpotifyPlayer(accessToken) {
    player = new Spotify.Player({
        name: 'Music Visualizer',
        getOAuthToken: cb => { cb(accessToken); },
        volume: 0.5
    });

    // Error handling
    player.addListener('initialization_error', ({ message }) => {
        console.error('Initialization Error:', message);
    });
    player.addListener('authentication_error', ({ message }) => {
        console.error('Authentication Error:', message);
        sessionStorage.removeItem('spotify_token');
        window.location.href = '/login';
    });
    player.addListener('account_error', ({ message }) => {
        console.error('Account Error:', message);
    });
    player.addListener('playback_error', ({ message }) => {
        console.error('Playback Error:', message);
    });

    // Playback status updates
    player.addListener('player_state_changed', state => {
        if (state) {
            isPlaying = !state.paused;
            updatePlayButton();
        }
    });

    // Ready
    player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        startPlayback(device_id);
    });

    // Connect to the player
    player.connect();
}

// Start playback
async function startPlayback(deviceId) {
    try {
        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                uris: [`spotify:track:${TRACK_ID}`]
            })
        });
        
        // Initialize analyzer after playback starts
        await initializeAnalyzer();
    } catch (error) {
        console.error('Error starting playback:', error);
    }
}

// Update play button state
function updatePlayButton() {
    const playButton = document.getElementById('play-button');
    playButton.textContent = isPlaying ? 'Pause' : 'Play';
}

// Set canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Draw visualization
function draw() {
    requestAnimationFrame(draw);
    
    if (!analyzer) return;
    
    // Clear the canvas with a fade effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const dataArray = new Uint8Array(analyzer.frequencyBinCount);
    analyzer.getByteFrequencyData(dataArray);
    
    const centerX = canvas.width / 2;
    const spacing = 2;
    const barWidth = 4;
    
    // Split the frequency data into two halves
    const halfLength = Math.floor(dataArray.length / 2);
    
    // Draw both sides
    for(let i = 0; i < halfLength; i++) {
        // Draw right side
        const rightBarHeight = (dataArray[i + halfLength] * canvas.height / 256) * 0.8;
        drawBar(centerX + (i * (barWidth + spacing)), rightBarHeight);
        
        // Draw left side
        const leftBarHeight = (dataArray[i] * canvas.height / 256) * 0.8;
        drawBar(centerX - ((i + 1) * (barWidth + spacing)), leftBarHeight);
    }
}

// Draw individual bar
function drawBar(x, height) {
    const y = canvas.height - height;
    
    const gradient = ctx.createLinearGradient(0, y, 0, canvas.height);
    gradient.addColorStop(0, '#a855f7');
    gradient.addColorStop(1, '#ec4899');
    
    ctx.fillStyle = gradient;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#a855f7';
    
    ctx.fillRect(x, y, 4, height);
    ctx.shadowBlur = 0;
}

// Event Listeners
window.addEventListener('resize', resizeCanvas);

// Play button event listener with user interaction handling
document.getElementById('play-button').addEventListener('click', async () => {
    if (audioContext && audioContext.state === 'suspended') {
        await audioContext.resume();
    }
    if (player) {
        player.togglePlay();
    }
});

document.querySelectorAll('.mood-button').forEach(button => {
    button.addEventListener('click', () => {
        const mood = button.textContent.toLowerCase();
        window.location.href = `${mood}.html`;
    });
});

resizeCanvas();

// Initialize when Spotify SDK is ready
window.onSpotifyWebPlaybackSDKReady = () => {
    token = checkAuth();
    if (token) {
        initializeSpotifyPlayer(token);
    } else {
        window.location.href = '/login';
    }
};