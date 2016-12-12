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

function randomIntFromInterval(min,max) {
	return Math.floor(Math.random()*(max-min+1)+min);
}

function copyArray(array) {
    var result = []; // creates an result array inside your function scope

    if (array.length == 0)
        return result; // return this empty array in case the input array is also empty

    for (var i = 0; i != array.length; i++) {
        if (array[i] instanceof Array) {
            result.push(copyArray(array[i].slice(0))); // call the function recursively if the element is an array
        } else {
            result.push(array[i]); // copy the element if it is not an array (going to use reference if it's an object)
        }
    }

    return result; // returns the resulting array
}

let world = new Array(size.height);
for(let y = 0; y < size.height; y++) {
	world[y] = new Array(size.width);
	for(let x = 0; x < size.width; x++) {
		world[y][x] = 0;
	}
}

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
	console.log(size);

	world = new Array(size.height);
	for(let y = 0; y < size.height; y++) {
		world[y] = new Array(size.width);
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
		const start = mousePos;
		const end   = lastPos;

		// Draw with the brush
		drawLine(start.x, start.y, end.x, end.y, function(x, y) {
			world[y][x] = brush >= 0 && brush < brushMap.length ? brushMap[brush] : 0;
		});

		lastPos = mousePos;
	}
}

let lastTime = new Date(0);
let calculating = false; // Not good but might work

function logic() {
	let currentTime = new Date();
	if(!calculating && Math.floor(currentTime - lastTime) > 50) {
		calculating = true;
		const state = copyArray(world);

		for(let y = 0; y < size.height; y++) {
			for(let x = 0; x < size.width; x++) {
				switch(world[y][x]) {
					case 0: break;
					case 1: state[y][x] = 2; break;
					case 2: state[y][x] = 3; break;
					case 3: {
						let count = 0;

						for(let j = -1; j <= 1 && y+j >= 0 && y+j < size.height; j++) {
							for(let i = -1; i <= 1 && x+i >= 0 && x+i < size.width; i++) {
								if(j == 0 && i == 0) continue;
								if(world[y+j][x+i] == 1) count++;
							}
						}
						if(count == 1 || count == 2) {
							state[y][x] = 1;
						}
					} break;
				}
			}
		}
		world = state;
		lastTime = currentTime;
		calculating = false;
	}
}

function render() {
	var image = context.createImageData(size.width, size.height);
	var data  = image.data;
	for(let i = 0; i < data.length && i < size.width*size.height*4; i += 4) {
		let value = world[Math.floor((i/4)/size.width)][Math.floor((i/4)%size.width)];
		data[i+0] = pallet[value][0];
		data[i+1] = pallet[value][1];
		data[i+2] = pallet[value][2];
		data[i+3] = 255;
	}
	context.putImageData(image, 0, 0);
}

function loop() {
	requestAnimationFrame(loop);
	// Drawing code goes here
	events();
	if(running) logic();
	render();
}

loop();