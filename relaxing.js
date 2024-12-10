// Canvas setup
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
let audioContext, analyzer, dataArray;

// Parse hash from URL
function getHashParams() {
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
    return hash;
}

// Extract track ID from Spotify URL
function getTrackId(url) {
    const matches = url.match(/track\/([a-zA-Z0-9]+)/);
    return matches ? matches[1] : null;
}

// Get tokens from URL
const params = getHashParams();
const access_token = params.access_token;
const refresh_token = params.refresh_token;

let player = null;
let isPlaying = false;

// Initialize audio analyzer
function initializeAnalyzer() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyzer = audioContext.createAnalyser();
        analyzer.fftSize = 256;
        dataArray = new Uint8Array(analyzer.frequencyBinCount);
    }
    draw();
}

// Draw visualization
function draw() {
    requestAnimationFrame(draw);
    
    if (!analyzer) return;
    
    analyzer.getByteFrequencyData(dataArray);
    
    // Clear canvas with fade effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
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
    ctx.fillRect(x, y, 4, height);
}

// Set canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Initialize Spotify
window.onSpotifyWebPlaybackSDKReady = () => {
    if (!access_token) {
        const connectButton = document.getElementById('connect-spotify');
        connectButton.addEventListener('click', () => {
            window.location.href = '/login';
        });
        return;
    }

    // Switch from connect button to song input
    document.getElementById('connect-container').style.display = 'none';
    document.getElementById('song-input').style.display = 'block';

    // Initialize player
    player = new Spotify.Player({
        name: 'Relaxing Visualizer',
        getOAuthToken: cb => { cb(access_token); },
        volume: 0.5
    });

    // Error handling
    player.addListener('initialization_error', ({ message }) => {
        console.error('Failed to initialize:', message);
    });

    player.addListener('authentication_error', ({ message }) => {
        console.error('Failed to authenticate:', message);
        refreshAccessToken();
    });

    player.addListener('account_error', ({ message }) => {
        console.error('Failed to validate Spotify account:', message);
    });

    player.addListener('playback_error', ({ message }) => {
        console.error('Failed to perform playback:', message);
    });

    // Playback status updates
    player.addListener('player_state_changed', state => {
        if (!state) return;

        isPlaying = !state.paused;
        updatePlayButton();

        // Update track info
        const trackName = state.track_window.current_track.name;
        const artistName = state.track_window.current_track.artists[0].name;
        
        document.getElementById('track-name').textContent = trackName;
        document.getElementById('artist-name').textContent = artistName;

        // Initialize analyzer if not already done
        if (!analyzer) {
            initializeAnalyzer();
        }
    });

    // Ready
    player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        
        // Play button handler
        const playButton = document.getElementById('play-song');
        playButton.addEventListener('click', async () => {
            if (isPlaying) {
                player.pause();
                playButton.textContent = 'Play';
            } else {
                const url = document.getElementById('song-url').value;
                if (url) {
                    const trackId = getTrackId(url);
                    if (!trackId) {
                        alert('Please enter a valid Spotify track URL');
                        return;
                    }

                    try {
                        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${device_id}`, {
                            method: 'PUT',
                            headers: {
                                'Authorization': `Bearer ${access_token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                uris: [`spotify:track:${trackId}`]
                            })
                        });
                        playButton.textContent = 'Pause';
                    } catch (error) {
                        console.error('Error playing track:', error);
                    }
                } else {
                    player.resume();
                    playButton.textContent = 'Pause';
                }
            }
            isPlaying = !isPlaying;
        });
    });

    // Volume control
    document.getElementById('volume').addEventListener('input', (e) => {
        player.setVolume(e.target.value / 100);
    });

    // Connect to the player
    player.connect();
};

// Refresh access token
async function refreshAccessToken() {
    try {
        const response = await fetch(`/refresh_token?refresh_token=${refresh_token}`);
        const data = await response.json();
        
        if (data.access_token) {
            access_token = data.access_token;
            // Reconnect player with new token
            player.disconnect();
            player.connect();
        } else {
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Error refreshing token:', error);
        window.location.href = '/login';
    }
}

// Update play button text
function updatePlayButton() {
    const playButton = document.getElementById('play-song');
    playButton.textContent = isPlaying ? 'Pause' : 'Play';
}

// Initialize canvas
resizeCanvas();
window.addEventListener('resize', resizeCanvas);