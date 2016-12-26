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