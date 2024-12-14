const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const particlesArray = [];
const numParticles = 100;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    //ctx.fillStyle = "rgba(0, 0, 0, 1)";
    //ctx.fillRect(0, 0, canvas.width, canvas.height);
    //center text
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "white";
    ctx.fillText("click to start", canvas.width / 2, canvas.height / 2);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);


function generateColor() {
    const hexSet = "0123456789ABCDEF";
    let finalHexString = "#";
    for (let i = 0; i < 6; i++) {
        finalHexString += hexSet[Math.floor(Math.random() * 16)];
    }
    return finalHexString;
}

function Particle(x, y, size, color, speed) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.color = color;
    this.speed = speed;
    this.angle = Math.random() * Math.PI * 2;

    this.update = (audioValue) => {
        this.angle += this.speed;
        // scale audio for radius
        const radius = audioValue * 200;
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

function generateParticles(amount) {
    for (let i = 0; i < amount; i++) {
        particlesArray.push(
            new Particle(
                canvas.width / 2,
                canvas.height / 2,
                4,
                generateColor(),
                Math.random() * 0.05
            )
        );
    }
}

//initialize audio visualizer
function start() {
    canvas.removeEventListener("click", start);

    //make a web audio context
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const audioDataArray = new Uint8Array(analyser.frequencyBinCount);

    //set up audio source
    const audio = new Audio();
    audio.loop = true;
    audio.crossOrigin = "anonymous";
    audio.src = "audios/A tadpole growing up.wav";

    audio.addEventListener("canplay", () => {
        const source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        audio.play();
    });

    generateParticles(numParticles);

    function render() {
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        //get current audio data
        analyser.getByteFrequencyData(audioDataArray);

        const maxAudioValue = Math.max(...audioDataArray) || 1;

        particlesArray.forEach((particle, i) => {
            const audioValue = audioDataArray[i % audioDataArray.length] / 255;
            particle.update(audioValue);
            particle.draw();
        });
        requestAnimationFrame(render);
    }
    render();
}

canvas.addEventListener("click", start);
