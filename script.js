// Setup
const scale  = 1;
let   size   = {width: 250, height: 250};
const pallet = [[0,0,0], [0,0,255], [255,0,0], [255,255,0]];
let brushMap = [3, 1, 0, 2];
let textMap  = [" ", "@", "~", "#"];

const canvas  = document.getElementById('wireworld');
const context = canvas.getContext('2d');

const inputArea  = document.getElementById('input');
const saveButton = document.getElementById('save');
const loadButton = document.getElementById('load');

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

let running  = false;

let drawing  = false;
let brush    = 0;

let mousePos = {x:0, y:0};
let lastPos  = mousePos;

document.addEventListener("keypress", function (e) {
	if(e.keyCode == 32) { // Space
		running = !running;
		console.log(running ? "Running" : "Stopped");
	}
});

canvas.addEventListener("mousedown", function (e) {
	if(e.target == canvas) e.preventDefault();
	lastPos = mousePos = getMousePos(canvas, e);
	brush   = e.button;
	drawing = true;
}, false);
canvas.addEventListener("mouseup", function (e) {
	drawing = false;
}, false);
canvas.addEventListener("mousemove", function (e) {
	mousePos = getMousePos(canvas, e);
}, false);

canvas.addEventListener('contextmenu', function(e) {
	e.preventDefault();
	return false;
}, false);

canvas.addEventListener("touchstart", function (e) {
	if(e.target == canvas) e.preventDefault();
	mousePos = getTouchPos(canvas, e);
	canvas.dispatchEvent(new MouseEvent("mousedown", {
		clientX: e.touches[0].clientX,
		clientY: e.touches[0].clientY
	}));
}, false);
canvas.addEventListener("touchend", function (e) {
	if(e.target == canvas) e.preventDefault();
	canvas.dispatchEvent(new MouseEvent("mouseup", {}));
}, false);
canvas.addEventListener("touchmove", function (e) {
	if(e.target == canvas) e.preventDefault();
	var touch = e.touches[0];
	canvas.dispatchEvent(new MouseEvent("mousemove", {
		clientX: touch.clientX,
		clientY: touch.clientY
	}));
}, false);


// Get the position of the mouse relative to the canvas
function getMousePos(canvasDom, mouseEvent) {
	const rect = canvasDom.getBoundingClientRect();
	return {
		x: Math.floor((mouseEvent.clientX - rect.left)/scale),
		y: Math.floor((mouseEvent.clientY - rect.top)/scale)
	};
}

// Get the position of a touch relative to the canvas
function getTouchPos(canvasDom, touchEvent) {
	var rect = canvasDom.getBoundingClientRect();
	return {
		x: touchEvent.touches[0].clientX - rect.left,
		y: touchEvent.touches[0].clientY - rect.top
	};
}


loadButton.onclick = function() {
	if(running) {
		running = false;
		setTimeout(loadButton.onclick, 1000);
		return;
	}

	// let input = inputArea.value;
	let input = LZString.decompressFromBase64(inputArea.value);

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
	console.log(world);
}

saveButton.onclick = function() {
	if(running) {
		running = false;
		setTimeout(saveButton.onclick, 1000);
		return;
	}

	let output = "";

	output += size.width + " " + size.height + '\n';

	for(let y = 0; y < size.height; y++) {
		for(let x = 0; x < size.width; x++) {
			output += textMap[world[y][x]];
		}
	}

	// inputArea.value = output;
	inputArea.value = LZString.compressToBase64(output);
}

// Game Loop

// Adapted from https://cs.colorado.edu/~mcbryan/5229.03/mail/24.htm
function drawLine(x0, y0, x1, y1, call) {
	let xyswapped = false;
	let ynegated  = false;

	// Slope to large, switch x and y
	if(Math.abs(y1-y0) > Math.abs(x1-x0)) {
		t0 = y0; y0 = x0; x0 = t0;
		t1 = y1; y1 = x1; x1 = t1;
		xyswapped = true;
	}

	// Ensure x1 ≥ x0
	if(x0 > x1) {
		xt = x1; x1 = x0; x0 = xt;
		yt = y1; y1 = y0; y0 = yt;
	}

	// Deal with negative slope
	if(y1 < y0) {
		y0 = -y0;
		y1 = -y1;
		ynegated = true;
	}

	// Bresenham
	let dx = x1 - x0;
	let dy = y1 - y0;
	let d  = 2*dy - dx;

	let y = y0;
	for(let x = x0; x <= x1; x += 1) {
		call(xyswapped ? (ynegated ? -y : y) : x, xyswapped ? x : (ynegated ? -y : y));

		if(d > 0) {
			y += 1;
			call(xyswapped ? (ynegated ? -y : y) : x, xyswapped ? x : (ynegated ? -y : y));
			d -= dx;
		}
		d += dy;
	}
}

function events() {
	if (drawing) {
		console.log("Drawing");

		const start = mousePos;
		const end   = lastPos;

		// Draw with the brush
		drawLine(start.x, start.y, end.x, end.y, function(x, y) {
			world[y][x] = brush >= 0 && brush < brushMap.length ? brushMap[brush] : 0;
		});

		lastPos = mousePos;
	}
}

let calculating = false; // Not good but might work

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
	for(let i = 0; i < render_data.length; i += 4) {
		// ~~ instead of Math.floor for 20% speed boost
		let value = pallet[world[~~(i/4/size.width)][(i/4)%size.width]];
		render_data[i+0] = value[0];
		render_data[i+1] = value[1];
		render_data[i+2] = value[2];
		render_data[i+3] = 255;
	}
	context.putImageData(render_image, 0, 0);
}

function loop() {
	// Drawing code goes here
	events();
	if (running) logic();
	render();

	requestAnimationFrame(loop);
}

loop();