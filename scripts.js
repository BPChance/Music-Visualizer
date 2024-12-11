const ctx = document.querySelector("canvas").getContext("2d");

ctx.fillText("click to start", 120, 75);
ctx.canvas.addEventListener('click', start);

//initialize audio visualizer
function start() {
    ctx.canvas.removeEventListener('click', start);

    //make a web audio context
    const context = new AudioContext();
    const analyser = context.createAnalyser();

    //buffer to recieve the audio data
    const numPoints = analyser.frequencyBinCount;
    const audioDataArray = new Uint8Array(numPoints);

    function render() {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        //get current audio data
        analyser.getByteFrequencyData(audioDataArray);

        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        const size = 5;

        for (let x = 0; x < width; x += size) {
            const ndx = x * numPoints / width | 0;
            const audioValue = audioDataArray[ndx] / 255;
            const y = audioValue * height;
            ctx.fillRect(x, y, size, size);
        }
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    // make a audio node
    const audio = new Audio();
    audio.loop = true;
    audio.autoplay = true;

    //allows cross-origin requests to access the audio file
    audio.crossOrigin = "anonymous";

    //call handleCanPlay when audio can be played
    audio.addEventListener('canplay', handleCanPlay);
    audio.src = "audios/A tadpole growing up.wav";
    audio.load;

    function handleCanPlay() {
        const source = context.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(context.destination);
    }
}
