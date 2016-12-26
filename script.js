// Setup
const scale  = 1;
let   size   = {width: 250, height: 250};
const pallet = [[0,0,0], [0,0,255], [255,0,0], [255,255,0]];
let brushMap = [3, 1, 0, 2];
let textMap  = [" ", "@", "~", "#"];

const canvas  = document.getElementById('wireworld');
const context = canvas.getContext('2d');

canvas.width  = size.width;
canvas.height = size.height;

let logic_state = new Array(size.height);
let world = new Array(size.height);
for(let y = 0; y < size.height; y++) {
	world[y] = new Array(size.width);
	logic_state[y] = new Array(size.width);
	for(let x = 0; x < size.width; x++) {
		logic_state[y][x] = 0;
		world[y][x] = 0;
	}
}

let render_image = context.createImageData(size.width, size.height);
let render_data  = render_image.data;

// Event Listeners

let running     = false;
let drawing     = false;
let calculating = false;

let brush    = 0;
let mousePos = lastPos = {x: 0, y: 0};

document.addEventListener("keypress", function (e) {if(e.keyCode == 32) console.log((running = !running) ? "Running" : "Stopped");});

canvas.addEventListener("mousedown",   function(e) {e.preventDefault(); lastPos = mousePos = getMousePos(canvas, e); brush = e.button; drawing = true;});
canvas.addEventListener("mouseup",     function(e) {e.preventDefault(); drawing = false;});
canvas.addEventListener("mousemove",   function(e) {e.preventDefault(); mousePos = getMousePos(canvas, e);});
canvas.addEventListener('contextmenu', function(e) {e.preventDefault(); return false;});

canvas.addEventListener("touchstart",  function(e) {e.preventDefault(); canvas.dispatchEvent(new MouseEvent("mousedown", e.touches[0]));});
canvas.addEventListener("touchend",    function(e) {e.preventDefault(); canvas.dispatchEvent(new MouseEvent("mouseup", {}));});
canvas.addEventListener("touchmove",   function(e) {e.preventDefault(); canvas.dispatchEvent(new MouseEvent("mousemove", e.touches[0]));});

// Get the position of the mouse relative to the canvas
function getMousePos(canvasDom, mouseEvent) {
	const rect = canvasDom.getBoundingClientRect();
	return {
		x: Math.floor((mouseEvent.clientX - rect.left)/scale),
		y: Math.floor((mouseEvent.clientY - rect.top)/scale)
	};
}

document.getElementById('load').onclick = function self() {
	if(running) {running = false; setTimeout(self, 1000); return;}

	console.log("Loading");

	// let input = inputArea.value;
	let input = LZString.decompressFromBase64(document.getElementById('input').value);

	let buffer = input.split('\n', 1)[0].split(" ");
	size = {width: buffer[0], height: buffer[1]};
	canvas.width  = size.width;
	canvas.height = size.height;

	render_image = context.createImageData(size.width, size.height);
	render_data  = render_image.data;	
	console.log(size);

	world = new Array(size.height);
	logic_state = new Array(size.height);
	for(let y = 0; y < size.height; y++) {
		world[y] = new Array(size.width);
		logic_state[y] = new Array(size.width);
	}

	let offset = input.indexOf("\n") + 1;
	for(let i = 0; i < input.length - offset && i < size.width*size.height; i++) {
		switch(input[offset+i]) {
			default: 
			case " ": world[Math.floor(i/size.width)][i%size.width] = 0; break;
			case "@": world[Math.floor(i/size.width)][i%size.width] = 1; break;
			case "~": world[Math.floor(i/size.width)][i%size.width] = 2; break;
			case "#": world[Math.floor(i/size.width)][i%size.width] = 3; break;
		}
	}
}

document.getElementById('save').onclick = function self() {
	if(running) {running = false; setTimeout(self, 1000); return;}

	console.log("Saving");

	let output = size.width + " " + size.height + "\n";

	for(let y = 0; y < size.height; y++) {
		for(let x = 0; x < size.width; x++) {
			output += textMap[world[y][x]];
		}
	}

	// inputArea.value = output;
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
			if(y >= 0 && y < world.length && x >= 0 && x < world[y].length)
				world[y][x] = brush >= 0 && brush < brushMap.length ? brushMap[brush] : 0;
		});

		lastPos = mousePos;
	}
}

function logic() {
	if(!calculating) {
		calculating = true;

		for(let y = 0; y < size.height; y++) {
			logic_state[y] = new Array(size.width);
			for(let x = 0; x < size.width; x++) {
				switch(world[y][x]) {
					case 0: logic_state[y][x] = 0; break;
					case 1: logic_state[y][x] = 2; break;
					case 2: logic_state[y][x] = 3; break;
					case 3: {
						let count = 0;

						for(let j = -1; j <= 1 && y+j >= 0 && y+j < size.height; j++) {
							for(let i = -1; i <= 1 && x+i >= 0 && x+i < size.width; i++) {
								if(j == 0 && i == 0) continue;
								if(world[y+j][x+i] == 1) count++;
							}
						}
						if(count == 1 || count == 2) {
							logic_state[y][x] = 1;
						} else {
							logic_state[y][x] = 3;
						}
					} break;
				}
			}
		}

		for(let y = 0; y < size.height; y++) {
			world[y] = logic_state[y];
		}
		calculating = false;
	}
}

function render() {
	for(let i = j = 0; i < render_data.length/4; i++, j = i * 4) {
		// ~~ instead of Math.floor for 20% speed boost
		const value = pallet[world[~~(i/size.width)][i%size.width]];
		render_data[j+0] = value[0];
		render_data[j+1] = value[1];
		render_data[j+2] = value[2];
		render_data[j+3] = 255;
	}
	context.putImageData(render_image, 0, 0);
}

function loop() {
	events();
	if (running) logic();
	render();

	requestAnimationFrame(loop);
}

loop();