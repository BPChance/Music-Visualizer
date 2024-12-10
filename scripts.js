// Canvas setup
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');

// Create simulated frequency data
const dataArrayLength = 128;
let frequencies = new Array(dataArrayLength).fill(0);
let time = 0;

// Set canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Update frequencies
function updateFrequencies() {
    time += 0.02;
    frequencies = frequencies.map((_, i) => {
        // Create a wave pattern that varies over time
        const value = Math.sin(time + i * 0.1) * 50 + 
                     Math.sin(time * 0.5 + i * 0.05) * 30 +
                     Math.sin(time * 0.2 + i * 0.15) * 20;
        
        // Keep values between 0 and 255 (like real frequency data)
        return Math.abs(value) + 50;
    });
}

// Draw visualization
function draw() {
    requestAnimationFrame(draw);
    
    // Update simulated frequencies
    updateFrequencies();
    
    // Clear the canvas with a fade effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate bar width to fill the entire screen
    const spacing = 2;
    const barWidth = (canvas.width / frequencies.length) - spacing;
    
    // Center the visualization
    const totalWidth = (barWidth + spacing) * frequencies.length;
    const startX = (canvas.width - totalWidth) / 2;
    
    frequencies.forEach((frequency, index) => {
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

// Add click event listeners to buttons
document.querySelectorAll('.mood-button').forEach(button => {
    button.addEventListener('click', () => {
        const mood = button.textContent.toLowerCase();
        window.location.href = `${mood}.html`;
    });
});

// Initialize visualization
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
draw();