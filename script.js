// Setup
const palletMap = [[0,0,0], [0,0,255], [255,0,0], [255,255,0]];
const brushMap  = [3, 1, 0, 2];
const textMap   = [" ", "@", "~", "#"];

const canvas    = document.getElementById('canvas');
const context   = canvas.getContext('2d');

let size        = {scale: 2, width: 250, height: 250, total: 250 * 250};
let world       = new Array(size.total).fill(0);

canvas.width    = size.width;
canvas.height   = size.height;
canvas.style.height = (size.scale * size.height) + "px";
canvas.style.width  = (size.scale * size.width) + "px";

if(window.innerHeight > size.height*size.scale - 150) {
	canvas.classList.add('center-vertical');
} else {
	canvas.classList.remove('center-vertical');
}

// Caches
let worldCache  = new Array(size.total);
let imageCache  = context.createImageData(size.width, size.height);
let dataCache   = imageCache.data;
for(let i = 0; i < size.total; i++) dataCache[i*4+3] = 255;

// Event Listeners
let running = drawing = calculating = false;
let brush    = 0;
let mousePos = lastPos = {x: 0, y: 0};

window.addEventListener("resize", function() {
	if(window.innerHeight > size.height*size.scale - 150) {
		canvas.classList.add('center-vertical');
	} else {
		canvas.classList.remove('center-vertical');
	}
});

canvas.addEventListener("mousedown",   function(e) {e.preventDefault(); lastPos = mousePos = getMousePos(canvas, e); brush = e.button; drawing = true;});
canvas.addEventListener("mouseup",     function(e) {e.preventDefault(); drawing = false;});
canvas.addEventListener("mousemove",   function(e) {e.preventDefault(); mousePos = getMousePos(canvas, e);});
canvas.addEventListener('contextmenu', function(e) {e.preventDefault();});

canvas.addEventListener("touchstart",  function(e) {e.preventDefault(); canvas.dispatchEvent(new MouseEvent("mousedown", e.touches[0]));});
canvas.addEventListener("touchend",    function(e) {e.preventDefault(); canvas.dispatchEvent(new MouseEvent("mouseup", {}));});
canvas.addEventListener("touchmove",   function(e) {e.preventDefault(); canvas.dispatchEvent(new MouseEvent("mousemove", e.touches[0]));});

// Get the position of the mouse relative to the canvas
function getMousePos(canvasDom, mouseEvent) {
	const rect = canvasDom.getBoundingClientRect();
	return {
		x: Math.floor((mouseEvent.clientX - rect.left)/size.scale),
		y: Math.floor((mouseEvent.clientY - rect.top)/size.scale)
	};
}

document.getElementById('play-button').onclick = function() {
	running = !running;
	console.log(running ? "Running" : "Stopped");
	document.getElementById('play-button').childNodes[0].innerHTML = running ? "pause" : "play_arrow";
	document.getElementById('play-button').childNodes[0].title     = running ? "Stop Simulation" : "Start Simulation";
}

document.getElementById('zoomin-button').onclick = function() {
	size.scale = Math.min(10, size.scale + 1);

	canvas.style.height = (size.scale * size.height) + "px";
	canvas.style.width  = (size.scale * size.width) + "px";

	document.getElementById('zoomin-button').setAttribute("disabled", size.scale >= 10);
	document.getElementById('zoomout-button').setAttribute("disabled", size.scale <= 1);

	if(window.innerHeight > size.height*size.scale - 150) {
		canvas.classList.add('center-vertical');
	} else {
		canvas.classList.remove('center-vertical');
	}
}

document.getElementById('zoomout-button').onclick = function() {
	size.scale = Math.max(1, size.scale - 1);

	canvas.style.height = (size.scale * size.height) + "px";
	canvas.style.width  = (size.scale * size.width) + "px";

	document.getElementById('zoomin-button').setAttribute("disabled", size.scale >= 10);
	document.getElementById('zoomout-button').setAttribute("disabled", size.scale <= 1);

	if(window.innerHeight > size.height*size.scale - 150) {
		canvas.classList.add('center-vertical');
	} else {
		canvas.classList.remove('center-vertical');
	}
}

document.getElementById('new-button').onclick = function self() {
	if(document.getElementById('new-width').value <= 0 || document.getElementById('new-height').value <= 0) return;

	size = {
		scale: size.scale,
		width: document.getElementById('new-width').value,
		height: document.getElementById('new-height').value,
		total: document.getElementById('new-width').value*document.getElementById('new-height').value
	};

	console.log(size);

	canvas.width  = size.width;
	canvas.height = size.height;
	canvas.style.height = (size.scale * size.height) + "px";
	canvas.style.width  = (size.scale * size.width) + "px";

	if(window.innerHeight > size.height*size.scale - 150) {
		canvas.classList.add('center-vertical');
	} else {
		canvas.classList.remove('center-vertical');
	}

	world = new Array(size.total).fill(0);

	// Caches
	worldCache = new Array(size.total);
	imageCache = context.createImageData(size.width, size.height);
	dataCache  = imageCache.data;	
	for(let i = 0; i < size.total; i++) dataCache[i*4+3] = 255;
}

document.getElementById('load-button').onclick = function self() {
	if(running) {running = false; setTimeout(self, 1000); return;}
	console.log("Loading");

	let input = LZString.decompressFromBase64(document.getElementById('input').value);
	let buffer = input.split('\n', 1)[0].split(" ");

	// Setup
	size = {scale: size.scale, width: buffer[0], height: buffer[1], total: buffer[0]*buffer[1]};
	console.log(size);

	canvas.width  = size.width;
	canvas.height = size.height;
	canvas.style.height = (size.scale * size.height) + "px";
	canvas.style.width  = (size.scale * size.width) + "px";

	if(window.innerHeight > size.height*size.scale - 150) {
		canvas.classList.add('center-vertical');
	} else {
		canvas.classList.remove('center-vertical');
	}

	world = new Array(size.total);

	// Caches
	worldCache = new Array(size.total);
	imageCache = context.createImageData(size.width, size.height);
	dataCache  = imageCache.data;	
	for(let i = 0; i < size.total; i++) dataCache[i*4+3] = 255;

	let offset = input.indexOf("\n") + 1;
	for(let i = 0; i < input.length - offset && i < size.total; i++) {
		switch(input[offset+i]) {
			default: 
			case textMap[0]: world[i] = 0; break;
			case textMap[1]: world[i] = 1; break;
			case textMap[2]: world[i] = 2; break;
			case textMap[3]: world[i] = 3; break;
		}
	}
}

document.getElementById('save-button').onclick = function self() {
	if(running) {running = false; setTimeout(self, 1000); return;}
	console.log("Saving");

	let output = size.width + " " + size.height + "\n";
	for(let i = 0; i < size.total; i++) output += textMap[world[i]];

	document.getElementById('input').value = LZString.compressToBase64(output);
}

// Game Loop
function events() {
	if (drawing) {
		console.log("Drawing");

		const start = mousePos;
		const end   = lastPos;

		// Draw with the brush
		drawLine(start.x, start.y, end.x, end.y, function(x, y) {
			if(y >= 0 && y < size.height && x >= 0 && x < size.width)
				world[y*size.width+x] = brush >= 0 && brush < brushMap.length ? brushMap[brush] : 0;
		});

		lastPos = mousePos;
	}
}

function logic() {
	if(!calculating) {
		calculating = true;

		for(let i = 0; i < size.total; i++) {
			switch(world[i]) {
				default:
				case 0: worldCache[i] = 0; break; // Nothing -> Nothing
				case 1: worldCache[i] = 2; break; // Head -> Tail
				case 2: worldCache[i] = 3; break; // Tail -> Conductor
				case 3: { // Conductor -> ???
					// Count all neighbours
					let count = 0;
					for(let dy = -1; dy <= 1; dy++) {
						for(let dx = -1; dx <= 1; dx++) {
							if(world[i + dx + dy*size.width] == 1) count++;
						}
					}

					worldCache[i] = (count == 1 || count == 2) ? 1 : 3;
				} break;
			}
		}

		// Manually copy across to let the GC rest.
		for(let i = 0; i < world.length; i++) world[i] = worldCache[i];

		calculating = false;
	}
}

function render() {
	for(let i = j = 0; i < size.total; i++, j = i * 4) {
		const value = palletMap[world[i]];
		dataCache[j+0] = value[0];
		dataCache[j+1] = value[1];
		dataCache[j+2] = value[2];
	}
	context.putImageData(imageCache, 0, 0);
}

function loop() {
	events();
	if (running) logic();
	render();

	requestAnimationFrame(loop);
}

loop();