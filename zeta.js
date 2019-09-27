
/* 
  These experiments with randomly placing disks in a square 
  accompany the essay "My God, It's Full of Dots," published 
  at http://bit-player.org/2019/my-god-its-full-of-dots in
  September 2019.
  
  The program was inspired by the work of John Shier, especially 
  his book _Fractalize That: A Visual Essay on Statistical Geometry_
  (World Scientific, 2019).
  
  The aim is a space-filling algorithm that satisfies two rules:
  
    1. There's always room for one more object.
    2. As the number of objects goes to infinity,
       the space is fully covered.
  
  A sequence of disks that satisfy these requirements comes from
  a certain range of zeta functions, based on the idea of summing
  the reciprocals of powers of integers.
  
  Copyright 2019 Brian Hayes. MIT license:
  
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.

*/


// Put the whole shebang inside a block to create a private
// namespace. Within these curly braces (the one immediately\
// below and its mate at the end of this file) anything declared
// with 'let' or 'const' is visible only within the scope of the
// block.

// Declarations with 'var' leak out. So do top-level function
// declarations. (I.e., function f() {...} is globally visible
// whereas const f = function() {...} is not.

{


// Check for browser ability to handle 'canvas' element. 
// See https://modernizr.com/

/*! modernizr 3.6.0 (Custom Build) | MIT *
 * https://modernizr.com/download/?-canvas-setclasses !*/
!function(e,n,t){function s(e,n){return typeof e===n}function a(){var e,n,t,a,o,i,f;for(var c in l)if(l.hasOwnProperty(c)){if(e=[],n=l[c],n.name&&(e.push(n.name.toLowerCase()),n.options&&n.options.aliases&&n.options.aliases.length))for(t=0;t<n.options.aliases.length;t++)e.push(n.options.aliases[t].toLowerCase());for(a=s(n.fn,"function")?n.fn():n.fn,o=0;o<e.length;o++)i=e[o],f=i.split("."),1===f.length?Modernizr[f[0]]=a:(!Modernizr[f[0]]||Modernizr[f[0]]instanceof Boolean||(Modernizr[f[0]]=new Boolean(Modernizr[f[0]])),Modernizr[f[0]][f[1]]=a),r.push((a?"":"no-")+f.join("-"))}}function o(e){var n=c.className,t=Modernizr._config.classPrefix||"";if(u&&(n=n.baseVal),Modernizr._config.enableJSClass){var s=new RegExp("(^|\\s)"+t+"no-js(\\s|$)");n=n.replace(s,"$1"+t+"js$2")}Modernizr._config.enableClasses&&(n+=" "+t+e.join(" "+t),u?c.className.baseVal=n:c.className=n)}function i(){return"function"!=typeof n.createElement?n.createElement(arguments[0]):u?n.createElementNS.call(n,"http://www.w3.org/2000/svg",arguments[0]):n.createElement.apply(n,arguments)}var r=[],l=[],f={_version:"3.6.0",_config:{classPrefix:"",enableClasses:!0,enableJSClass:!0,usePrefixes:!0},_q:[],on:function(e,n){var t=this;setTimeout(function(){n(t[e])},0)},addTest:function(e,n,t){l.push({name:e,fn:n,options:t})},addAsyncTest:function(e){l.push({name:null,fn:e})}},Modernizr=function(){};Modernizr.prototype=f,Modernizr=new Modernizr;var c=n.documentElement,u="svg"===c.nodeName.toLowerCase();Modernizr.addTest("canvas",function(){var e=i("canvas");return!(!e.getContext||!e.getContext("2d"))}),a(),o(r),delete f.addTest,delete f.addAsyncTest;for(var p=0;p<Modernizr._q.length;p++)Modernizr._q[p]();e.Modernizr=Modernizr}(window,document);


// If the browser can do 'canvas', remove the failure messages
// included as innerHTML properties of the divs for all
// the program panels. If the browser can't do 'canvas',
// leave the messages; nothing else is going to work anyway.

// Why the 'Array.from(...)? Why not just iterate over the HTML
// NodeList returned by getElementsByClassName? It turns out -- I
// just now learned this -- that Safari does not consider a
// NodeList to be an iterable. This is not such a crazy decision.
// A NodeList is a live, dynamic, structure where elements can
// come and go while you're looping over them. I do wish they
// gave us a better error message. In any case, we can convert
// the NodeList to a static Array.

if (Modernizr.canvas) {
	const panels = Array.from(document.getElementsByClassName("canvas-container"));
	for (let p of panels) {
		p.classList.remove("canvas-failure");
		p.innerHTML = "";
	}
}



// Global constants and mathematical utilities

const twoPi = Math.PI * 2;

const defaultCanvasSize = 640; // width in pixels; also height for 2D panels

const default1dStripHeight = 50; // height for 1D panels

function log2(n) {                     // log to base 2
	return Math.log(n) * Math.LOG2E;
}

function square(n) {
	return n * n;
}



// We need to evaluate the Riemann zeta function \zeta(s)
// for real values of s > 1. The following three functions
// implement algoithm 2 in: Borwein, Peter. 1995. An Efficient
// Algorithm for the Riemann Zeta Function, 
// http://www.cecm.sfu.ca/personal/pborwein/PAPERS/P155.pdf


// cheap recursive factorial, exact through n = 21
// We need nothing beyond 15!

function factorial(n) {
	return (n < 2) ? 1 : n * factorial(n - 1);
}

// evaluate a Chebyshev polynomial

function cheb(k, n) {
	let accum = 0.0;
	for (let i = 0 ; i <= k ; i++) {
		let num = factorial(n + i - 1) * Math.pow(4, i);
		let den = factorial(n - i) * factorial(2 * i);
		accum += num / den;
	}
	return n * accum;
}

function zetaBorwein(s) {
	const n = 15;
	let chebnn = cheb(n, n);
	let coef = -1 / (chebnn * (1 - Math.pow(2, 1 - s)));
	let accum = 0.0;
	for (let k = 0 ; k < n ; k++) {
    accum += Math.pow(-1, k) * (cheb(k, n) - chebnn) / Math.pow(k + 1, s);
  }
  return coef * accum;
}




// The Hurwitz zeta function is a generalization of the
// Reimann zeta function. This numerical approximation is 
// translated directly from the C code in chapter 10 of
// Shier's _Fractalize That_.

function hurwitzZeta(s, a) {
	let aInt = Math.floor(a),
			aFrac = a - aInt,
			sum = 0.0,
			j = aInt,
			nv, q, u, v;
	do {
		nv = aFrac + j;
		q = Math.pow(nv, -s);
		sum += q;
		j++;
	} while (q > 0.000001);										// a precision criterion
  u = j + aFrac + 0.5;											// getting within 10^-6 is okay
  v = (1 / (s - 1)) * Math.pow(u, (1 - s));
  return (sum + v)	
}



// Create and attach stylesheet links in the head.
// Why not just write a link into the HTML? Because
// this software was originally written to run within
// a WordPress blog, which offers no easy way to alter
// the head for just one post.

// We need to load a main style sheet and one for the
// noUISlider utility.

function injectStyles() {
	const head = document.getElementsByTagName("head")[0];
	const zetaStyleLink = document.createElement("link");
	zetaStyleLink.setAttribute("rel", "stylesheet");
  zetaStyleLink.setAttribute("type", "text/css");
  zetaStyleLink.setAttribute("href", "wp-zeta-styles.css");		// replace with local URL
	head.appendChild(zetaStyleLink);
	const sliderStyleLink = document.createElement("link");
	sliderStyleLink.setAttribute("rel", "stylesheet");
  sliderStyleLink.setAttribute("type", "text/css");
  sliderStyleLink.setAttribute("href", "nouislider.css");	// replace with local URL
	head.appendChild(sliderStyleLink);
}

injectStyles();






// constructor for disks

const Disk = function(x, y, r) {
	this.x = x;
	this.y = y;
	this.r = r;
}


// A place to stash a pointer to the program (if any) that's
// currently running, so that we can pause it when we want to
// start another. For more on this, see below under startTimer.

let currentlyRunningProgram = false;



// Each of the programs defined below is based on an object with the
// prototype Dotster. The following function is the constructor
// for those objects.

// The options argument should be an object literal on the
// following model:
// 
// {plotsize: 640,
//	dimension: 2,
//	runButton: "goStop",
//  initial_k: 1,
//	bumpers: "no"}
//
// Any missing keys will be ignored, and indeed the entire 
// options object can be omitted if not needed.

const Dotster = function(options) {
	
	// capture args as object properties
	
	this.plotsize  = options.plotsize || defaultCanvasSize;
  this.dimension = options.dimension || 2;
  this.runButton = options.runButton || "goStop";
  this.initial_k = (options.initial_k === 0) ? 0 : 1;
  this.bumpers   = options.bumpers || "no";
  
  // state-machine; other possible values are: Running, Stopped, Jammed, Exhausted
  
  this.state = "Idle";
  
	// flat list of all disks placed so far
	
  this.diskList = [];
  
  // number of disks placed so far (should equal this.diskList.length()
  
  this.diskCount = 0;
  
  // index of the next disk to be placed
  
  this.k = this.initial_k;
  
  // side length of the containing square; default value usually overridden
  
  this.boxSide = 2.0;          // default is 2x2 box
  
  // default values of disk parameters; always overridden
  
  this.diskArea = 0.0;
  this.diskRadius = 0.0;
  this.diskColor = "#000";
  
  // the gasket is the background area of the box; light gray
  
  this.gasketColor = "#eee";
  
  // sum of disk areas, and sum/boxArea
  
  this.areaCovered = 0.0;
  this.percentCovered = 0.0;
  
  // We're going to partition the box into cells to improve the
  // efficiency of testing for overlaps. This constant defines the
  // size of the grid. (32 rows x 32 cols = 1024 cells)
  
  this.cellRowsCols = 32;
  
  // Some execution limits.
  // Stop the program is diskCount reaches 100,000.
  
  this.maxDisks = 100000;
  
  // Regardless of diskCount, stop if the disk area is less than 10^-7.
  
  this.minDiskArea = 1e-7;
  
  // When trying to find a place for a disk, stop after 10^7 attempts.
  // This default is overridden below with a value based on the size
  // of a pixel.
  
  this.maxAttempts = 1e7;
  
  // Produce a random x or y as a possible center point for the next
  // disk. Math.random() returns a 64-bit float in [0, 1).
  
  this.randomCoord = function() {
		return Math.random() * this.boxSide;
	}
	
	// The central issue in the space-filling algorithm is how we calculate
	// the area of a disk as a function of its index, k, in the sequence
	// of disks. This one is just a placeholder. (It corresponds to the
	// harmonic sequence.)
	
	this.areaFromK = function(k) {			// placeholder
	return 1 / k;
	}



	
	// When I started this project, I thought all the programs would be
	// running in a two-dimensional space -- fitting disks into a square.
	// Then I realized I wanted to look at one-dimensional cases too, where
	// both the disks and the container are reduced to line segments. A
	// number of properties and functions need to be treated separately
	// in these two cases. It's tidier (and more efficient) to create
	// the appropriate version in each object rather than make the choice
	// at runtime.
  
  // TWO DIMENSIONS
  
  if (this.dimension === 2) {
	  
	  this.boxArea = square(this.boxSide);
	  
	  // for circular disks: calc radius from area and vice versa
	  
  	this.radiusFromArea = function(a) {
	  	return Math.sqrt(a / Math.PI);
 		}
 		
 		this.areaFromRadius = function(r) {
	 		return Math.PI * square(r);
 		}
 		
 		// The database has three components. The disklist
 		// is just a flat sequential array of disk objects.
 		// bigDisks is an array of disks larger than bigLimit.
 		// All disks are checked for overlaps with the elements
 		// of bigDisks. Finally there's a two-dimensional array
 		// where each disk is stored in a cell that includes the
 		// coordinates of the disk center. Here we're just building
 		// the empty structure.
 		
 		this.buildDiskDatabase = function() {
	 		this.diskList = [];
			this.bigLimit = 1 / this.cellRowsCols;
			this.bigDisks = [];
			this.diskData = new Array(this.cellRowsCols);
			for (let i = 0 ; i < this.cellRowsCols ; i++) {
				this.diskData[i] = new Array(this.cellRowsCols);
				for (let j = 0 ; j < this.cellRowsCols ; j++) {
					this.diskData[i][j] = [];
				}
			}
		}	
		
		
		// The inner-loop routine for producing a new disk. Create
		// the new Disk object and assign the current radius, then
		// repeatedly try to find an xy location where you can put it,
		// for each trial checking for overlaps with the box boundaries
		// and all the previous disks. On success, return the Disk; after
		// maxAttempts, give up and return false.
		
		this.newDisk = function() {
			let d = new Disk();
			d.r = this.diskRadius;
			let attempt = 1;
			while (attempt <= this.maxAttempts) {
				d.x = this.randomCoord();
				d.y = this.randomCoord();
				if (this.isInBounds(d) && this.isNotOverlapping(d)) {
					return d;
				}
			attempt++;
			}
			return false;
		}

  
		// Every disk gets appended to diskList; the big ones
		// also go onto bigDisks; smaller disks are entered into
		// the appropriate cell of the geographic database.
		
	  this.recordDisk = function(d) {
			this.diskList.push(d);
			if (d.r >= this.bigLimit) {
				this.bigDisks.push(d);
			}
			else {
				cellX = this.coordToIndex(d.x);
				cellY = this.coordToIndex(d.y);
				this.diskData[cellX][cellY].push(d);
			}
		}
		
		// Check a disk for overlap with the boundary of the surrounding
		// square.
		
		this.isInBounds = function(d) {
			return d.x - d.r >= 0 &&
						 d.x + d.r <= this.boxSide &&
						 d.y - d.r >= 0 &&
						 d.y + d.r <= this.boxSide;
		}
		
		// Given two disks, return true if they overlap. 
		
		this.disksOverlap = function(d, e) {
			let deltaX = d.x - e.x;
			let deltaY = d.y - e.y;
			let s = d.r + e.r;
			return square(deltaX) + square(deltaY) < square(s);
		}

		// Given a disk, check for overlap with all the disks
		// already placed. This starts with a check against the
		// elements of bigDisks, then against the members of
		// all cells that could conceivably overlap. These are
		// the central cell and the eight neighboring cells.
		
		this.isNotOverlapping = function(disk) {
			for (const d of this.bigDisks) {
				if (this.disksOverlap(disk, d)) {
					return false;		// intersects at least one big disk
				}
			}
			const cellX = this.coordToIndex(disk.x);
			const cellY = this.coordToIndex(disk.y);
			for (let xOffset = -1 ; xOffset <= 1 ; xOffset++) {
					let x = cellX + xOffset;
					if (x < 0 || x >= this.cellRowsCols) {
						continue;
					}
				for (let yOffset = -1 ; yOffset <= 1 ; yOffset++) {
					let y = cellY + yOffset;
					if (y < 0 || y >= this.cellRowsCols) {
						continue;
					}
					let cell = this.diskData[x][y];
					for (const d of cell) {
						if (this.disksOverlap(disk, d)) {
							return false;
						}
					}
				}
			}
			return true;			// no overlaps with any of the tested disks
		}
		
		// Here, finally, we actually draw the disk to the screen -- specifically
		// to the 2d context of a canvas element.
		
		this.drawDisk = function(disk) {
			this.ctx.fillStyle = this.diskColor;
			this.ctx.beginPath();
			this.ctx.moveTo(disk.x, disk.y);
			this.ctx.arc(disk.x, disk.y, disk.r, 0, twoPi, true);
			this.ctx.fill();
		}
	}


  // ONE DIMENSION   All the same procedures with the same
  // names, but now set up for a 1D model.
  
  if (this.dimension === 1) {						// redundant test, but maybe someday
	  																		// we'll add 3D as well
	  
	  // Area = length for one-dimensional objects.
	  
	  this.boxArea = this.boxSide;

		// radius is just half of area
		
	  this.radiusFromArea = function(a) {
	  	return a / 2;
  	}
  	
  	// and therefor area is 2x radius
  	
 		this.areaFromRadius = function(r) {
	 		return 2 * r;
 		}
 		
 		// In one dimension we're not going to place nearly
 		// as many disks. It's not worth the effort of carving
 		// the space into a thousand cells. We'll just use
 		// the simple linear list.
 		
  	this.buildDiskDatabase = function() {
  		this.diskList = [];
  	}
  	
  	this.recordDisk = function(d) {
  		this.diskList.push(d);
  	}
  	
		this.isInBounds = function(d) {
			return d.x - d.r >= 0 &&
						 d.x + d.r <= this.boxSide;
		}
		
  	this.disksOverlap = function(d, e) {
			let deltaX = Math.abs(d.x - e.x);
			let s = d.r + e.r;
			return deltaX < s;
		}

  	this.isNotOverlapping = function(disk) {
			for (const d of this.diskList) {
				if (this.disksOverlap(disk, d)) {
					return false;		// intersects at least one disk
				}
			}
			return true;
		}
		
		// The 1d version sets the y coordinate to zero.
		
		this.newDisk = function() {
			let d = new Disk();
			d.r = this.diskRadius;
			d.y = 0;
			let attempt = 1;
			while (attempt <= this.maxAttempts) {
				d.x = this.randomCoord();
				if (this.isInBounds(d) && this.isNotOverlapping(d)) {
					return d;
				}
			attempt++;
		}
		return false;
	}
	
		this.drawDisk = function(disk) {
			this.ctx.fillStyle = this.diskColor;
  		this.ctx.fillRect(disk.x - disk.r, 0, 2 * disk.r, this.boxSide);
  	}
	}
}
	
// END OF CONSTRUCTOR FOR MAKER OBJECTS

// Now add some more functionality:


// Given an x or y position in the interval [0, boxSide], return
// the database cell in which it is located. 

Dotster.prototype.coordToIndex = function(c) {
	return Math.floor(c / this.boxSide * this.cellRowsCols);
}

// The strategy for fitting an infinite set of disks into a square
// of finite area is to scale the square to match the aggregate area
// of the disks. In turn we have to fit the scaled square into the
// allotted area of the screen. That happens here, using the setTransform
// method of the canvas API. Note: This might appear simpler if we
// just used the 'scale' method of the API. But transforms using those
// methods are cumulative: If you double the size and then triple it,
// you have a 6x enlargement. The setTransform method simply replaces 
// the transform matrix and is therefore independent of the history
// of earlier transforms.

Dotster.prototype.transformCoords = function() {
	let scale = this.plotsize / this.boxSide;
	this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
}

// The default coloring algorithm interpolates between pure blue
// and pure red, according to the logarithm of the disk size q.

//	Note A: the function has this approximate behavior:
// 	t						logt
//	1							1
//	0.1						0.79
//	0.01					0.58
//	0.001					0.38
//	0.0001				0.17
//	0.00001				0			(clamped to 0 by Math.max)
//	Thus we get a roughly linear color map as q diminishes
//	exponentially.

//	Note B: This algorithm is known as 'lerping,' which seems to be
//	a mashup of 'linear interpolation.' I think it comes out of the gaming
//	community. We start with two colors 'a' and 'b' and a parameter
//	't' that varies between 0 and 1. For each color component (red,
//	green, and blue in this case) we calculate a + ((b - a) * t). 
//	(Except we're using logt.)

Dotster.prototype.colorFn = function(t) {
	const a = [255, 0, 0];								// red
	const b = [0, 0, 255];								// blue
	let logt = 1 - (Math.abs(log2(t)) / 16);    // Note A
	logt = Math.max(0, Math.min(1, logt));
	let mix = [];
	for (let i=0 ; i < 3 ; i++) {
		mix[i] = Math.floor(a[i] + ((b[i] - a[i]) * logt));    // Note B
	}
	return `rgb(${mix[0].toString()}, ${mix[1].toString()}, ${mix[2].toString()})`;
}


// Gathered together here is all the code that creates the canvas
// and the control panel for each program.

Dotster.prototype.setUpDOM = function(containerID) {
  
  // build everything within a div that's been written into the HTML
  this.ID = containerID;
  this.container = document.getElementById(containerID);
  this.container.classList.add("zf");
  
  // create the canvas element, and its 2d drawing context.
  // note that this 2d has nothing to do with 1d vs 2d disks;
  // it's just a property of the canvas element
  this.canvas = document.createElement("canvas");
  this.ctx = this.canvas.getContext("2d");
  
  // a square when dimension = 2, otherwise a narrow horizontal strip
  this.canvas.width = this.plotsize;
  this.canvas.height = (this.dimension === 2) ? this.plotsize : default1dStripHeight;
  
  // See definition above. We are scaling the coordinates to
  // plotsize / boxSide. One benefit of this transformation is that
  // we can treat both the 1D and the 2D boxes as squares. That is,
  // the coordinate system runs from 0 to boxSide along both
  // x and y axes; it's just scaled differently in the 1D canvas.
	this.transformCoords();
	
	// The smallest disk we'll bother drawing to the screen. Using
	// the default plotsize of 640, this comes out to 2.44 x 10^7,
	// which is a tenth of the area of a single pixel.
	this.minDiskArea = 1 / (square(this.plotsize) * 10);
	
	// Add the canvas as a child of the containing div.
  this.container.appendChild(this.canvas);
  
  // See below; fills the canvas with a background color.
  this.drawGasket();
  
	// The canvas where all the disks will be drawn is now ready.
  // We move on to creating another element, a div, for the controls.
  this.controls = document.createElement("div");
  this.controls.classList.add("controls");
  this.container.appendChild(this.controls);

	// a place to display the formula for A_k, the area of a disk
	this.A_kFormula = document.createElement("div");
  this.controls.appendChild(this.A_kFormula);
  this.A_kFormula.classList.add("akformula");

  // and another for the area of the containing square, which in most
  // cases is equal to the sum of the infinite series of disk areas
	this.A_boxFormula = document.createElement("div");
	this.controls.appendChild(this.A_boxFormula);
	this.A_boxFormula.classList.add("aboxformula");

  // a div to hold sliders (room for two)
  this.sliderBox = document.createElement("div");
  this.controls.appendChild(this.sliderBox);
  this.sliderBox.classList.add("sliderbox");
  this.sliderList = [];

  // the Go/Stop button. Comes in two varieties. For programs that
  // place disks continuously, one after another, the button is
  // initially labeled 'Start'. Programs that do one disk for each
  // press of the button label is 'Next'.
  this.goStopButton = document.createElement("button");
  this.goStopButton.classList.add("go-stop-button");
  this.controls.appendChild(this.goStopButton);
  
  // test the variable (set by options to Dotster) that determines which
  // kind of button. (See note above on Dotster.prototype.startTimer
  // about the need for 'bind(this)'.
  if (this.runButton === "goStop") {
  	this.goStopButton.innerHTML = "Start";
	  this.goStopHandler = this.goStopClick.bind(this);
	  this.goStopButton.addEventListener("click", this.goStopHandler);
	}
	else if (this.runButton === "next") {
  	this.goStopButton.innerHTML = "Next";
	  this.goStopHandler = this.nextClick.bind(this);
	  this.goStopButton.addEventListener("click", this.goStopHandler);
	}

  // Let's make the canvas itself act as a Go/Stop trigger
  this.canvas.addEventListener("click", this.goStopHandler);

  // Reset button wipes the canvas clean
  this.resetButton = document.createElement("button");
  this.resetButton.innerHTML = "Reset";
  this.resetButton.classList.add("reset-button");
  this.controls.appendChild(this.resetButton);
  this.resetHandler = this.resetClick.bind(this);
  this.resetButton.addEventListener("click", this.resetHandler);
  
  // Status line reflects value of 'this.state'
  this.statusFlag = document.createElement("div");
  this.statusFlag.id = "status-div";
  this.controls.appendChild(this.statusFlag);
  this.statusFlag.innerHTML = this.state;
  
  // Output div for count of objects placed and the percentage
  // of the area they cover.
  this.counter = document.createElement("div");
  this.counter.classList.add("counter-div");
  this.controls.appendChild(this.counter);
  this.countLabel = document.createElement("span");
  this.countLabel.classList.add("counter-label");
  this.countLabel.innerHTML = "count: ";
  this.counter.appendChild(this.countLabel);
  this.countNumber = document.createElement("span");
  this.countNumber.classList.add("counter-number");
  this.countNumber.innerHTML = this.diskCount;
  this.counter.appendChild(this.countNumber);
  this.areaLabel = document.createElement("span");
  this.areaLabel.classList.add("counter-label");
  this.areaLabel.innerHTML = "  filled:  ";
  this.counter.appendChild(this.areaLabel);
  this.areaNumber = document.createElement("span");
  this.areaNumber.classList.add("counter-number");
  this.areaNumber.innerHTML = "0.00";
  this.counter.appendChild(this.areaNumber);

	// In a few of the programs we want to surround each disk
	// with 'bumpers' or 'buffers' that show the excluded
	// area -- the region where the center of the next disk
	// cannot be placed because it would cause an overlap with
	// the existing disk. For those programs we append some
	// more elements to the controls div, for tallying the
	// blue, orange, and black areas, corresponding to disks,
	// buffers, and open zones.
	if (this.bumpers === "yes") {
		
		// div to encompass all three counters; will carry
		// flexbox formatting
	  this.bumperCounter = document.createElement("div");
	  this.bumperCounter.classList.add("bumper-counter-div");
	  this.controls.appendChild(this.bumperCounter);
	  
	  // area of disks
	  this.blueCounter = document.createElement("div");
	  this.blueCounter.id = "bumper-counter-blue";
	  this.blueCounter.classList.add("bumper-counter");
		this.bumperCounter.appendChild(this.blueCounter);
	  this.blueCounterText = document.createElement("span");
	  this.blueCounterText.classList.add("bumper-counter-label");
	  this.blueCounterText.innerHTML = "Disk area: 0.00%";
	  this.blueCounter.appendChild(this.blueCounterText);
	  
	  // area of buffers
	  this.orangeCounter = document.createElement("div");
	  this.orangeCounter.id = "bumper-counter-orange";
	  this.orangeCounter.classList.add("bumper-counter");
		this.bumperCounter.appendChild(this.orangeCounter);
	  this.orangeCounterText = document.createElement("span");
	  this.orangeCounterText.classList.add("bumper-counter-label");
	  this.orangeCounterText.innerHTML = "Buffer area: 0.00%";
	  this.orangeCounter.appendChild(this.orangeCounterText);
	  
	  // area of zones open to placement of next disk center
	  this.blackCounter = document.createElement("div");
	  this.blackCounter.id = "bumper-counter-black";
	  this.blackCounter.classList.add("bumper-counter");
		this.bumperCounter.appendChild(this.blackCounter);
	  this.blackCounterText = document.createElement("span");
	  this.blackCounterText.classList.add("bumper-counter-label");
	  this.blackCounterText.innerHTML = "Open area: 0.00%";
	  this.blackCounter.appendChild(this.blackCounterText);
	}  
}			// END OF setUpDOM


// Fill the box with background color. Serves for both 1d and 2d.
// Will be specialized for programs that show bumpers.

Dotster.prototype.drawGasket = function() {
	this.ctx.fillStyle = this.gasketColor;
	this.ctx.fillRect(0, 0, this.boxSide, this.boxSide);
}


// This is the routine called repeatedly by the timer function
// to place another disk.

// First task to to create and find a place for a new disk. If this
// process fails, the configuration is jammed, so we bail out (ie,
// stop the timer and return false). Another possibility is that we've reached
// the count of maxDisks; again, we stop. Otherwise we record and draw
// the disk and update various state variables.

Dotster.prototype.doOneDisk = function() {
	const d = this.newDisk();
	if (!d) {																							// no room at the inn
		this.state = "Jammed";
		if (this.runButton === "goStop") {
			this.stopTimer();
		}
		this.UIstateUpdate();
		return false;
	}
	
	if (this.diskCount >= this.maxDisks || this.diskArea < this.minDiskArea) {		// patience exhausted
		this.state = "Exhausted";
		if (this.runButton === "goStop") {
			this.stopTimer();
		}
		this.UIstateUpdate();
		return false;
	}
	
	// If we've gotten this far, we have a disk and the disk has a home.
	// So we record it in the database and draw it on the screen. Then
	// update variables that keep track of the count of disks, and their
	// total area, and display these results in the control panel.
	
	this.recordDisk(d);
	this.drawDisk(d);
	this.diskCount++;
	this.diskArea = this.areaFromRadius(d.r);
	this.areaCovered += this.diskArea;
	this.percentCovered = this.areaCovered / this.boxArea * 100;
	this.countNumber.innerHTML = this.diskCount;
	this.areaNumber.innerHTML = this.percentCovered.toFixed(2) + "%";
	
	// This is the point in the program where we are officially finished
	// with one disk and ready to turn our attention to the next. We 
	// increment the index k, then calculate the area, radius, and color
	// of the next disk to be placed. 
	
	this.k++;
	this.diskArea = this.areaFromK(this.k);
	this.diskRadius = this.radiusFromArea(this.diskArea);
	this.diskColor = this.colorFn(this.diskArea);
	return true;
}




// The timer routines are where we start and stop the animated 
// disk-placement loop. In the "Idle" state, the handler
// for the goStopButton calls startTimer; from the "Running"
// state it calls stopTimer. In addition, stopTimer is called
// when doOneDisk detects a "Jammed" or "Exhausted "
// condition.

// Note A: Performance sucks, and the UI bogs down, if we
// try to run multiple programs at the same time. It's easy
// to start one, then scroll away leaving it running, and
// start another. The code here is meant to ensure that only
// one program at a time can be running.

// Note B: "this" points back to the object that brought us
// here. Store it in the currentlyRunningProgram global so
// that another program can pause us.

// Note C: What's that funky business with '.bind(this)'?
// setInterval (and also setTimeout) clobber 'this', setting
// it to the window object. '.bind(this)' foils that evil
// plot. See https://javascript.info/bind. You can achieve
// the same thing with an arrow function, which is less
// baroque-looking: setInterval(() => this.doOneDisk(), 0).
// I prefer the bind method precisely because it calls
// attention to itself. There's nothing in the syntax of the
// arrow function that hints at its different treatment of
// 'this'. You just have to know about it.

// Note D: The zero as a second argument to setInterval
// calls for repeating as fast as possible.

Dotster.prototype.startTimer = function() {
	if (currentlyRunningProgram) {
		if (currentlyRunningProgram.state === "Running") {						// Note A
			currentlyRunningProgram.goStopClick();
		}
	}
	currentlyRunningProgram = this;																// Note B
	this.timer = setInterval(this.doOneDisk.bind(this), 0);				// Note C, D
}

Dotster.prototype.stopTimer = function() {
	clearInterval(this.timer);
	currentlyRunningProgram = false;
}


// The sliders used for numeric input are based on 
// noUiSlider (https://refreshless.com/nouislider/) (MIT license).
// A complication is the need to provide multiple sliders
// within a single program, not knowing at the outset how many
// I would need or what inputs they would control. (As it
// turned out, I never needed more than two.)

// Args to makeSlider: 'start' is the initial position of the thumb,
// 'lo' and 'hi' are the extremes of the range, 'label' is text displayed
// under the slider to identify the variable being input, and 'namestr'
// is a string that will become the name of the variable identifying
// the div in which noUiSlider will build the actual control.

// Note A: Using Array.from()... Again, we want to iterate over
// this list in a for...of loop, which Safari won't do unless we
// convert the active NodeList to a static Array.

Dotster.prototype.makeSlider = function(start, lo, hi, label, namestr) {
	this.sliderWrapper = document.createElement("div");
	this.sliderWrapper.classList.add("slider-wrapper");
	this.sliderBox.appendChild(this.sliderWrapper);
	this[namestr] = document.createElement("div");
	noUiSlider.create(this[namestr], {
    start: [start],
    range: {
        'min': lo,
        'max': hi
    },
    tooltips: true
	});
	this[namestr].classList.add("slider");
	this.sliderWrapper.appendChild(this[namestr]);
	const theLabel = document.createElement("div");
	theLabel.classList.add("slider-label");
	theLabel.innerHTML = label;
	this.sliderWrapper.appendChild(theLabel);
	this.sliderList = Array.from(this.controls.getElementsByClassName("slider"));  // Note A
}


// After every change in program state -- a button push,
// a changed slider setting, a program shutdown because of
// jamming or exhaustion, we come here to update the visible
// aspects of the user interface.

Dotster.prototype.UIstateUpdate = function() {

	this.statusFlag.innerHTML = this.state;			// display Idle, Running, Paused, Jammed, Exhausted
	this.statusFlag.className = this.state;			// used to trigger CSS that will change bkgd color
	
	// Tasks for timer-driven programs. The switch...break
	// protocol makes sure only one block is executed.
	// Sliders and the Reset button get disabled while a 
	// program is running, then re-enabled in any
	// other state.

	if (this.runButton === "goStop") {
		switch (this.state) {
			case "Running":
				for (const s of this.sliderList) {
					s.setAttribute("disabled", "disabled");
				}
				this.resetButton.setAttribute("disabled", "disabled");
				this.goStopButton.innerHTML = "Pause";
				break;
			case "Paused":
				for (const s of this.sliderList) {
					s.removeAttribute("disabled");
				}
				this.resetButton.removeAttribute("disabled");
				this.goStopButton.innerHTML = "Continue";
				break;
			case "Idle":
				for (const s of this.sliderList) {
					s.removeAttribute("disabled");
				}
				this.resetButton.setAttribute("disabled", "disabled");
				this.goStopButton.innerHTML = "Start";
				break;
			case "Jammed":
				for (const s of this.sliderList) {
					s.removeAttribute("disabled");
				}
				this.resetButton.removeAttribute("disabled");
				this.goStopButton.innerHTML = "Restart";
				this.statusFlag.classList.add("jammed");
				break;
			case "Exhausted":
				for (const s of this.sliderList) {
					s.removeAttribute("disabled");
				}
				this.resetButton.removeAttribute("disabled");
				this.goStopButton.innerHTML = "Restart";
				break;
		}
	}
	
	// In the case of non-timer, disk-by-disk programs, the
	// only condition that requires any action is a jam. And
	// even in that state, we let the user keep pushing the
	// button to try again.
	
	else if (this.runButton === "next") {
		if (this.state === "Jammed") {
			this.statusFlag.classList.add("jammed");
		}
	}
}


// The event handler for the Start/Pause/Continue button.

Dotster.prototype.goStopClick = function(evt) {
	switch (this.state) {
		case "Running": 
			this.state = "Paused";		// pause running program, stop the timer
			this.stopTimer();
			break;
		case "Paused":
			this.state = "Running";		// resume from paused state, start timer
			this.startTimer();
			break;
		case "Idle":
			this.state = "Running";		// start up from idle, start timer
			this.startTimer();
			break;
		case "Jammed":
			this.resetClick();
			this.state = "Running";		// from jammed state, do reset and then start timer
			this.startTimer();
			break;
		case "Exhausted":
			this.resetClick();
			this.state = "Running";		// likewise from exhausted, start over
			this.startTimer();
			break;
	}
	this.UIstateUpdate();					// update UI to reflect the new state
}

// For non-timer-driven programs, just do one disk.

Dotster.prototype.nextClick = function(evt) {
	this.doOneDisk();
}
	
// Event handler for the Reset button. Clear the canvas, redraw
// the gasket, rebuild an empty database, reset some vars to the
// startup state, then call UIstateUpdate and also this.init().
// Two notes: We do NOT reset the sliders. The user may well want
// to run again with the same inputs. And the call to this.init()
// means that every program must have an .init() method.

Dotster.prototype.resetClick = function(evt) {
	this.state = "Idle";
	this.ctx.clearRect(0, 0, this.boxSide, this.boxSide);
	this.drawGasket();
	this.buildDiskDatabase();
	this.k = this.initial_k;
	this.diskCount = 0;
	this.areaCovered = 0;
	this.countNumber.innerHTML = this.diskCount;
	this.areaNumber.innerHTML = "0.00%";
	this.UIstateUpdate();
	this.init();
}


// END OF GENERIC OBJECTS AND METHODS
// Below this line, we're dealing with specific programs,
// which rely on the variables and methods above.


// Minimal steps for creating a program:

// Step 1: Create the program object via: const <name> = new Dotster(<coptions>);

// The options argument is an object with any subset (including
// the empty set) of the following five keys:
// {plotsize: 640,
//	dimension: 2,
//	runButton: "goStop",
//  initial_k: 1,
//	bumpers: "no"}
// Options can be omitted if you want to accept the defaults.

// Step 2: Attach the program to an apprpriate div in an HTML file, by giving
// setUpDOM the id of that div.

// Step 3: Provide a suitable 'areaFromK' function. Given a value
// of the index k, it must return the area of disk k.

// Step 4: Provide an .init() method, which should set variables
// to suitable initial values.

// Step 5: Invoke the .init() method.

// The numbering of the programs matches the labels in
// the bit-player.org essay.


// A NOTE ON TEX FOR MATH NOTATION

// Most of these programs have mathematical formulas encoded in
// TeX, to be typeset by MathJAX (https://www.mathjax.org/). A
// couple of gotchas to keep in mind. The character that introduces
// TeX commands is a backslash, which is also the escape character
// for JavaScript strings. All backslashes need to be doubled.
// Second, MathJAX does its work on page load, then goes to sleep.
// Many of these math elements are changed after load, so we have
// to wake up MathJAX for another pass over sections of the text.

// TODO: Update to version 3.0 of MathJAX, which was just released.



// PROGRAM 0: A DEMO

// This program is a stripped-down version of Program 5 (the scaled
// zeta function), but without a control panel for user interface. 
// (Actually, the control div exists, but the CSS sets it to
// display: none.)

const dm = new Dotster({plotsize: 640, dimension: 2, initial_k: 1});

dm.setUpDOM("demo");			// "demo" is the #id of an empty div

dm.areaFromK = function(k) {					// power law/Riemann zeta function
	return 1 / Math.pow(dm.k, dm.s);
}

dm.s = 1.29;							// The demo has no slider letting the user set this

dm.maxDisks = 5000;				// reset from the default 10^7; don't want to demo running on and on

dm.init = function() {
	dm.k = dm.initial_k;
	dm.diskCount = 0;
	dm.diskArea = dm.areaFromK(dm.k);
	dm.diskRadius = dm.radiusFromArea(dm.diskArea);
	dm.diskColor = dm.colorFn(dm.diskArea);
	dm.buildDiskDatabase();
}

dm.init()



// PROGRAM 1: FIXED-SIZE DISKS

const fs = new Dotster({plotsize: 640, dimension: 2, initial_k: 1});

fs.setUpDOM("fixed-size");

// do-nothing function, since the disk area never changes
fs.areaFromK = function(k) {
	return fs.diskArea;
}

// This program has a slider, and it needs some heavy-duty customizing
// to display a disk area varying across the range from 0.0001 to 1.0
// on a logarithmic scale. Thus we need to override the prototype.makeSlider.
// Note that the min and max values are the base-10 logs of the actual 
// values. The 'to' formatting function takes a logarithmic value, calculates
// 10^value, and converts the result into a four-decimal place string 
// representation of the number. The 'from' function takes a number
// (or a string that can be parsed into a number) and returns the base-10
// log. It took me a while to figure this out!

fs.makeSlider = function(label, namestr) {
	this.sliderWrapper = document.createElement("div");
	this.sliderWrapper.classList.add("slider-wrapper");
	this.sliderBox.appendChild(this.sliderWrapper);
	this[namestr] = document.createElement("div");
	noUiSlider.create(this[namestr], {
	  start: [0.005],
    step: 0.001,
    range: {
        'min': [-4],
        'max': [0]
    },
    decimals: 3,
    tooltips: true,
    format: {
        to: function (value) {
            return Math.pow(10, value).toFixed(4);
        },
        from: function (value) {
            return (Math.log(value) * Math.LOG10E);
        }
    }
	});
	this[namestr].classList.add("slider");
	this.sliderWrapper.appendChild(this[namestr]);
	const theLabel = document.createElement("div");
	theLabel.classList.add("slider-label");
	theLabel.innerHTML = label;
	this.sliderWrapper.appendChild(theLabel);
}

// invoke the function above
fs.makeSlider("disk area", "areaSlider");

// The box area is a fixed integer, so we can set this
// once and for all.
fs.A_boxFormula.innerHTML = "\\[A_{\\square} = 4\\]";

// event handler
fs.areaSlider.noUiSlider.on("change", function() {
	fs.resetClick();
});

fs.init = function() {
	fs.diskCount = 0;
	fs.k = fs.initial_k;
	fs.countNumber.innerHTML = fs.diskCount;
	fs.areaNumber.innerHTML = "0.00%";
	fs.A_kFormula.innerHTML = `\\[A_k = ${fs.areaSlider.noUiSlider.get()}\\]`;
	MathJax.Hub.Queue(["Typeset", MathJax.Hub, fs.A_kFormula]);									// wake up MathJAX
	fs.diskArea = Number(fs.areaSlider.noUiSlider.get());
	fs.diskRadius = fs.radiusFromArea(fs.diskArea);
	fs.diskColor = fs.colorFn(fs.diskArea);
	fs.buildDiskDatabase();
}

fs.init();



// PROGRAM 2: HARMONIC SERIES

const hm = new Dotster({plotsize: 640, dimension: 2, initial_k: 0});

hm.setUpDOM("harmonic");

hm.A_boxFormula.innerHTML = "\\[A_{\\square} = 4\\]";

// Again we need to specialize the slider, in order to display
// the value as a fraction, or ration, rather than an integer
// or float. We're dealing with Egyptian fractions here: The
// numerator is always 1. So we can let the slider, behind the
// curtains, simply select a denominator, then reformulate it
// for display as a fraction. This is what the 'to' function does.
// The 'from' function extracts the denominator (by dropping
// the first two characters of a string representing an
// Egyptian fraction) and then parses it as a number.

hm.makeSlider = function(start, lo, hi, label, namestr) {
	this.sliderWrapper = document.createElement("div");
	this.sliderWrapper.classList.add("slider-wrapper");
	this.sliderBox.appendChild(this.sliderWrapper);
	this[namestr] = document.createElement("div");
	noUiSlider.create(this[namestr], {
	  start: "1/5",
    step: 1,
    range: {
        'min': lo,
        'max': hi
    },
		direction: 'rtl',
    tooltips: true,
	  format: {
	    to: function (value) {
	        return "1/" + Math.round(value).toString();
	    },
	    from: function (value) {
	        return Math.round(Number(value.substring(2, value.length)));
	    }
	  }
	});
	this[namestr].classList.add("slider");
	this.sliderWrapper.appendChild(this[namestr]);
	const theLabel = document.createElement("div");
	theLabel.classList.add("slider-label");
	theLabel.innerHTML = label;
	this.sliderWrapper.appendChild(theLabel);
}

hm.makeSlider(5, 1, 50, "starting disk size", "harmonicSlider");

hm.harmonicSlider.noUiSlider.on("change", function() {
	hm.resetClick();
});

hm.areaFromK = function(k) {
	return 1 / (hm.initialDenominator + hm.k);
}

hm.init = function() {
	let fracString = hm.harmonicSlider.noUiSlider.get();
	hm.initialDenominator = Math.round(Number(fracString.substring(2, fracString.length)));
	hm.diskCount = 0;
	hm.k = hm.initial_k;
	hm.countNumber.innerHTML = hm.diskCount;
	hm.areaNumber.innerHTML = "0.00%";
	hm.A_kFormula.innerHTML = `\\[A_k = \\frac{1}{${hm.initialDenominator} + k}\\]`;
	MathJax.Hub.Queue(["Typeset", MathJax.Hub, hm.controls]);
	hm.diskArea = hm.areaFromK(hm.k);
	hm.diskRadius = hm.radiusFromArea(hm.diskArea);
	hm.diskColor = hm.colorFn(hm.diskArea);
	hm.buildDiskDatabase();
}

hm.init();



//PROGRAM 3: ZETA(2)

const z2 = new Dotster({initial_k: 1});

z2.setUpDOM("zeta2");

z2.areaFromK = function(k) {
	return 1 / Math.pow(k, 2);
}

z2.A_kFormula.innerHTML = "\\[A_k = \\frac{1}{k^2}\\]"
z2.A_boxFormula.innerHTML = "\\[A_{\\square} = 4\\]";

z2.init = function() {
	z2.diskCount = 0;
	z2.k = z2.initial_k;
	z2.diskArea = z2.areaFromK(z2.k);
	z2.diskRadius = z2.radiusFromArea(z2.diskArea);
	z2.diskColor = z2.colorFn(z2.diskArea);
	z2.countNumber.innerHTML = z2.diskCount;
	z2.buildDiskDatabase();
}

z2.init();



// PROGRAM 4: ZETA(S) WHERE S IS AN ADJUSTABLE PARAMETER

const za = new Dotster({initial_k: 1});

za.setUpDOM("zeta-adjust");

za.makeSlider(1.50, 1.01, 2.00, "s (exponent)", "sSlider");

za.sSlider.noUiSlider.on("change", function() {
	za.resetClick();
});

za.areaFromK = function(k) {
	return 1 / Math.pow(k, za.s);
}

za.init = function() {
	za.diskCount = 0;
	za.k = za.initial_k;
	za.s = Number(za.sSlider.noUiSlider.get());
	za.diskArea = za.areaFromK(za.k);
	za.diskRadius = za.radiusFromArea(za.diskArea);
	za.diskColor = za.colorFn(za.diskArea);
	za.countNumber.innerHTML = za.diskCount;
	za.areaNumber.innerHTML = "0.00%";
	za.A_kFormula.innerHTML = `\\[A_k = \\frac{1}{k^{${za.s.toFixed(2)}}}\\]`;
	za.A_boxFormula.innerHTML = "\\[A_{\\square} = 4\\]";
	MathJax.Hub.Queue(["Typeset", MathJax.Hub, za.controls]);
	za.buildDiskDatabase();
}

za.init();


// PROGRAM 5: ZETA(S) SCALED TO FILL THE BOX

const zs = new Dotster({initial_k: 1});

zs.areaFromK = function(k) {
	return 1 / Math.pow(k, zs.s);
}

zs.setUpDOM("zeta-scaled");

zs.makeSlider(1.30, 1.01, 2.00, "s (exponent)", "sSlider");

zs.sSlider.noUiSlider.on("change", function() {
	zs.resetClick();
});

zs.init = function() {
	zs.diskCount = 0;
	zs.k = zs.initial_k;
	zs.countNumber.innerHTML = zs.diskCount;
	zs.s = Number(zs.sSlider.noUiSlider.get());
	
	// where the scaing happens
	zs.zeta = zetaBorwein(zs.s);					// evaluate the zeta function at s
	zs.boxArea = zs.zeta;									// set the box area to zeta(s)
	zs.boxSide = Math.sqrt(zs.boxArea);   // and the side length accordingly
	zs.transformCoords();                 // make zeta(s) the extent of coords
	
	zs.A_kFormula.innerHTML = `\\[A_k = \\frac{1}{k^{${zs.s.toFixed(2)}}}\\]`;
	zs.A_boxFormula.innerHTML = `\\[A_{\\square} = \\zeta(${zs.s.toFixed(2)}) = ${zs.zeta.toFixed(2)}\\]`;
	MathJax.Hub.Queue(["Typeset", MathJax.Hub, zs.controls]);
	zs.diskArea = zs.areaFromK(zs.k);
	zs.diskRadius = zs.radiusFromArea(zs.diskArea);
	zs.diskColor = zs.colorFn(zs.diskArea);
	zs.buildDiskDatabase();
}

zs.init();

// The three procedures below have no web interface; they must
// be run from the javascript console. I wrote these when I noticed
// some program runs that jammed after an anomalously long run.
// Wanting to see if they were really stymied or would continue if
// I raised the maxDisks limit, I came up with this way of saving
// the list of disks placed, and then replaying the sequence. 

// Usage: 	zzz = zs_export_disklist();
//					zs_replay(zzz);

// the zs_desaturate procedure dims the image to make later additions
// more conspicuous.

var zs_export_disklist = function() {
	return zs.diskList;
}

var zs_replay = function(xyrArray) {
	zs.resetClick();
	for (const d of xyrArray) {
			zs.recordDisk(d);
			zs.drawDisk(d);
			zs.diskCount++;
			zs.diskArea = zs.areaFromRadius(d.r);
			zs.areaCovered += zs.diskArea;
			zs.percentCovered = zs.areaCovered / zs.boxArea * 100;
			zs.countNumber.innerHTML = zs.diskCount;
			zs.areaNumber.innerHTML = zs.percentCovered.toFixed(2) + "%";
			zs.k++;
			zs.diskArea = zs.areaFromK(zs.k);
			zs.diskRadius = zs.radiusFromArea(zs.diskArea);
			zs.diskColor = zs.colorFn(zs.diskArea);
	}
	zs.state = "Paused";
	zs.UIstateUpdate();
}

var zs_desaturate = function() {
	let imageData = zs.ctx.getImageData(0, 0, zs.plotsize, zs.plotsize);
	const pixelcount = square(zs.plotsize);
	for (let i = 0; i < (pixelcount * 4); i += 4) {		// each pixel is 4-byte RGBA value
		imageData.data[i+3] = 96;
	}
	zs.ctx.putImageData(imageData, 0, 0);
}



// PROGRAM 6: HURWITZ ZETA FUNCTION

const hw = new Dotster({initial_k: 0});    // note that we start with k=0

hw.areaFromK = function(k) {
	return 1 / Math.pow(hw.a + k, hw.s);
}

hw.setUpDOM("hurwitz");

hw.makeSlider(1.30, 1.01, 2.00, "s (exponent)", "sSlider");

hw.makeSlider(1.0, 1.0, 10.0, "a (offset)", "aSlider");

hw.sSlider.noUiSlider.on("change", function() {
	hw.resetClick();
});

hw.aSlider.noUiSlider.on("change", function() {
	hw.resetClick();
});

hw.init = function() {
	hw.diskCount = 0;
	hw.k = hw.initial_k;
	hw.s = Number(hw.sSlider.noUiSlider.get());
	hw.a = Number(hw.aSlider.noUiSlider.get());
	hw.zeta = hurwitzZeta(hw.s, hw.a);
	hw.boxArea = hw.zeta;
	hw.boxSide = Math.sqrt(hw.boxArea);
	hw.transformCoords();
	hw.A_kFormula.innerHTML = `\\[A_k = \\frac{1}{(${hw.a.toFixed(2)}+k)^{${hw.s.toFixed(2)}}}\\]`;
	hw.A_boxFormula.innerHTML = `\\[A_{\\square} = \\zeta(${hw.s.toFixed(2)}, ${hw.a.toFixed(2)}) = ${hw.zeta.toFixed(2)}\\]`;
	MathJax.Hub.Queue(["Typeset", MathJax.Hub, hw.controls]);
	hw.diskArea = hw.areaFromK(hw.initial_k);
	hw.diskRadius = hw.radiusFromArea(hw.diskArea);
	hw.diskColor = hw.colorFn(hw.diskArea);
	hw.buildDiskDatabase();
}

hw.init();


// PROGRAM 7: ONE-DIMENSIONAL DISKS

const d1 = new Dotster({dimension: 1, runButton: "goStop", bumpers: "no", initial_k: 1});

d1.setUpDOM("one-dim");

d1.areaFromK = function(k) {
	return  1 / Math.pow(k, d1.s);
}

d1.maxDisks = 1e4;

d1.makeSlider(1.30, 1.01, 2.00, "s (exponent)", "sSlider");

d1.sSlider.noUiSlider.on("change", function() {
	d1.resetClick();
});

d1.init = function() {
	d1.diskCount = 0;
	d1.k = d1.initial_k;
	d1.s = Number(d1.sSlider.noUiSlider.get());
	d1.zeta = zetaBorwein(d1.s);
	d1.boxSide = d1.zeta;
	d1.boxArea = d1.boxSide;			// area = length
	d1.transformCoords();
	d1.A_kFormula.innerHTML = `\\[A_k = \\frac{1}{k^{${d1.s.toFixed(2)}}}\\]`
	d1.A_boxFormula.innerHTML = `\\[A_{\\square} = \\zeta(${d1.s.toFixed(2)}) = ${d1.zeta.toFixed(2)}\\]`;
	MathJax.Hub.Queue(["Typeset", MathJax.Hub, d1.controls]);
	d1.diskArea = d1.areaFromK(d1.initial_k);
	d1.diskRadius = d1.radiusFromArea(d1.diskArea);
	d1.diskColor = d1.colorFn(d1.diskArea);
	d1.buildDiskDatabase();
}

d1.init();


// PROGRAM 8: ONE-DIMENSIONAL DISKS WITH BUMPERS AND A NEXT BUTTON

// A significant departure. This one places one disk at a time, in
// response to a Next button. And it shows the buffer zones surrounding
// each disk --  the areas where the center of the next disk cannot
// be placed. Furthermore, we take considerably trouble to calculate
// the areas of the buffers and the remaining uncovered free zones.

const b1 = new Dotster({dimension: 1, runButton: "next", bumpers: "yes", initial_k: 1});

b1.setUpDOM("one-dim-bumpers");

b1.areaFromK = function(k) {
	return 1 / Math.pow(k, b1.s);
}

b1.diskColor = "#0800ff";		// all disks are blue
b1.gasketColor = "#333";		// dark gray
b1.bufferColor = "rgba(255, 85, 17, 0.7)";		// semitransparent orange

b1.makeSlider(1.30, 1.01, 2.00, "s (exponent)", "sSlider");

b1.sSlider.noUiSlider.on("change", function() {
	b1.resetClick();
});

// Basic strategy: We know the blue area -- the aggregate area
// of the placed disks, because we add it up as we go. We can 
// calculate the buffered area of each disk by adding the radius
// of the existing disk and that of the next disk. In 1D area
// is equal to diameter, so we just need to take twice the total
// radius. The tricky part is that buffer zones can overlap. I
// deal with this by doing a left-t0-right sort, and consolidating
// any disks whose buffers overlap. Then we get a measure of the
// total blue+orange area. Subtract the known blue area and we get
// the orange area. Subtract blue+orange from the total area of the
// container and we get the remainder -- the black region that remains
// available for placing new disks. (Getting all this right was 
// a bear.)

b1.calculateAreas = function() {
	
	function diskToBufferedInterval(d) {
		const R = d.r + b1.nextRadius;
		const left = Math.max(d.x - R, 0);
		const right = Math.min(d.x + R, b1.boxSide);
		return [left, right];
	}
	
	function compare(left, right) {
		if (left[0] === right[0]) {
			return (left[1] - right[1]);
		}
		else {
			return (left[0] - right[0]);
		}
	}
	
	let segments = Array.from(b1.diskList);
	segments = segments.map(diskToBufferedInterval)
	segments.push([0, b1.nextRadius]);
	segments.push([b1.boxSide - b1.nextRadius, b1.boxSide]);
	segments.sort(compare);
	return segments;
}

b1.consolidateSegments = function(segs) {
	let stripes = []
	const	len = segs.length;
	let i = 0;
	let left = segs[i][0];
	let right = segs[i][1];
	while (i < len - 1) {
		i++
		if (segs[i][0] > right) {
			stripes.push([left, right]);
			left = segs[i][0];
			right = segs[i][1];
		}
		else {
			right = segs[i][1];
		}
	}
	stripes.push([left, right]);
	return stripes;
}

b1.sumAreas = function() {
	const stripes = b1.consolidateSegments(b1.calculateAreas());
	const copyStripes = stripes.slice();
	const segLengths = stripes.map(function(pair) {return pair[1] - pair[0]});
	const bluArea = b1.areaCovered;
	const bluPlusOrgArea = segLengths.reduce(function(x,y) {return x + y}, 0);
	const orgArea = bluPlusOrgArea - bluArea;
	const blkArea = b1.boxSide - bluPlusOrgArea;
	b1.blueCounterText.innerHTML = `Disks: ${(bluArea / b1.boxArea * 100).toFixed(2)}%`;
	b1.orangeCounterText.innerHTML = `Buffers: ${(orgArea / b1.boxArea * 100).toFixed(2)}%`;
	b1.blackCounterText.innerHTML = `Open: ${(blkArea / b1.boxArea * 100).toFixed(2)}%`;
}

// The incremental drawing algorithm used elsewhere -- just add each
// disk to the canvas as it comes along -- won't work here. We need
// to layer things properly: first the bakground gasket, then the orange
// buffers, then the blue disks.

b1.drawGasket = function(gasketWidth) {
	b1.ctx.fillStyle = b1.gasketColor;
	b1.ctx.fillRect(0, 0, b1.boxSide, b1.boxSide);
	b1.ctx.fillStyle = b1.bufferColor;
	b1.ctx.fillRect(0, 0, gasketWidth, b1.boxSide);
	b1.ctx.fillRect(b1.boxSide - gasketWidth, 0, b1.boxSide, b1.boxSide);
}

b1.drawBuffer = function(disk) {
	const bufferRadius = disk.r + b1.nextRadius;
	b1.ctx.fillStyle = b1.bufferColor;
	b1.ctx.fillRect((disk.x - bufferRadius), 0, (2 * bufferRadius), b1.boxSide);
}

b1.redraw = function() {
	b1.nextArea = b1.areaFromK(b1.k + 1);
	b1.nextRadius = b1.radiusFromArea(b1.nextArea);
	b1.drawGasket(b1.nextRadius);
	for (const d of b1.diskList) {
		b1.drawBuffer(d);
	}
	for (const d of b1.diskList) {
		b1.drawDisk(d);
	}
}

// We need to reimplement doOneDisk in this case in order to include
// the buffer zones. 

b1.doOneDisk = function() {
	const d = b1.newDisk();
	if (!d) {
		b1.state = "Jammed";
		b1.UIstateUpdate();
		return false;
	}
	b1.recordDisk(d);
	b1.redraw();
	b1.areaCovered += b1.diskArea;
	b1.percentCovered = (b1.areaCovered / b1.boxArea) * 100;
	b1.sumAreas();
	b1.diskCount++;
	b1.countNumber.innerHTML = b1.diskCount;
	b1.areaNumber.innerHTML = b1.percentCovered.toFixed(2) + "%";

	b1.k++
	b1.diskArea = b1.areaFromK(b1.k);
	b1.diskRadius = b1.radiusFromArea(b1.diskArea);
	b1.nextArea = b1.areaFromK(b1.k + 1);
	b1.nextRadius = b1.radiusFromArea(b1.nextArea);
	return true;
}

b1.resetClick = function(evt) {
	b1.state = "Idle";
	b1.ctx.clearRect(0, 0, b1.boxSide, b1.boxSide);
	b1.buildDiskDatabase();
	b1.areaCovered = 0;
	b1.countNumber.innerHTML = b1.diskCount;
	b1.areaNumber.innerHTML = "0.00%";
	b1.UIstateUpdate();
	b1.init();
}

b1.init = function() {
	b1.k = b1.initial_k;
	b1.diskCount = 0;
	b1.s = Number(b1.sSlider.noUiSlider.get());
	b1.zeta = zetaBorwein(b1.s);
	b1.boxSide = b1.zeta;
	b1.boxArea = b1.boxSide;
	b1.transformCoords();
	b1.A_kFormula.innerHTML = `\\[A_k = \\frac{1}{k^{${b1.s.toFixed(2)}}}\\]`
	b1.A_boxFormula.innerHTML = `\\[A_{\\square} = \\zeta(${b1.s.toFixed(2)}) = ${b1.zeta.toFixed(2)}\\]`;
	MathJax.Hub.Queue(["Typeset", MathJax.Hub, b1.controls]);	
	b1.diskArea = b1.areaFromK(b1.k);
	b1.diskRadius = b1.radiusFromArea(b1.diskArea);
	b1.nextArea = b1.areaFromK(b1.k);
	b1.nextRadius = b1.radiusFromArea(b1.nextArea);
	b1.drawGasket(b1.diskRadius);
	b1.sumAreas();
	b1.buildDiskDatabase();
}

b1.init();


// PROGRAM 9: TWO-DIMENSIONAL DISKS WITH ORANGE BUFFERS

const bm = new Dotster({dimension: 2, runButton: "next", bumpers: "yes", initial_k: 1});

bm.setUpDOM("bumpers2d");

bm.areaFromK = function(k) {
	return 1 / Math.pow(k, bm.s);
}

bm.diskColor = "#0800ff";				// blue
bm.gasketColor = "#333";				// dark gray
bm.bufferColor = "rgba(255, 85, 17, 0.7)";			// semitransparent orange

bm.makeSlider(1.30, 1.00, 3.00, "s (exponent)", "sSlider");

bm.sSlider.noUiSlider.on("change", function() {
	bm.resetClick();
});

// The geometric analysis of buffer area would be much harder in 2d.
// So we punt: Just look at the on-screen representation and count
// pixels. This is less than ideal. Resolution is limited to the pixel
// spacing. And further blurring comes from the browser anti-aliasing
// algorithm, which I have not figured out how to defeat.

bm.countPixels = function() {
	const imageData = bm.ctx.getImageData(0, 0, bm.plotsize, bm.plotsize);		// capture the pixel array
	const pixelcount = square(bm.plotsize);

// 	color blu = [  8,   0, 255];
// 	color org = [255,  85,  17];
// 	color blk = [ 34,  34,  34];

	let bluCt = 0,
			orgCt = 0,
			blkCt = 0;

	for (let i = 0; i < (pixelcount * 4); i += 4) {		// each pixel is 4-byte RGBA value
		
		let r = imageData.data[i], b = imageData.data[i + 2];
		if 			(b > 127) { bluCt++; }
		else if (r > 127) { orgCt++; }
		else 							{ blkCt++; }

	}
	bm.blueCounterText.innerHTML = `Disks: ${(100 * bluCt / pixelcount).toFixed(2)}%`;
	bm.orangeCounterText.innerHTML = `Buffers: ${(100 * orgCt / pixelcount).toFixed(2)}%`;
	bm.blackCounterText.innerHTML = `Open: ${(100 * blkCt / pixelcount).toFixed(2)}%`;
}

bm.drawGasket = function() {
	const innerSquareSideLength = Math.max(bm.boxSide - (2 * bm.nextRadius), 0);
// 	console.log(`bm.boxSide: ${bm.boxSide},  bm.nextRadius: ${bm.nextRadius},  innerSquareSideLength: ${innerSquareSideLength}`);
	bm.ctx.fillStyle = bm.gasketColor;
	bm.ctx.fillRect(0, 0, bm.boxSide, bm.boxSide);
	bm.ctx.fillStyle = bm.bufferColor;
	bm.ctx.fillRect(0, 0, bm.boxSide, bm.boxSide);
	bm.ctx.fillStyle = bm.gasketColor;
	bm.ctx.fillRect(bm.nextRadius,
								  bm.nextRadius, 
								  innerSquareSideLength, 
								  innerSquareSideLength);
}

bm.drawBuffer = function(disk) {
	const bufferRadius = disk.r + bm.nextRadius;
	bm.ctx.beginPath();
	bm.ctx.moveTo(disk.x, disk.y);
	bm.ctx.arc(disk.x, disk.y, bufferRadius, 0, twoPi, true);
	bm.ctx.fillStyle = bm.bufferColor;
	bm.ctx.fill();
}

bm.redraw = function() {
	bm.drawGasket();
	for (const d of bm.diskList) {
		bm.drawBuffer(d);
	}
	for (const d of bm.diskList) {
		bm.drawDisk(d);
	}
}

// Again we need to replace the prototype version of doOneDisk. 
// Partly to get in the countPixels() routine. But also because
// I wanted to allow s = 1 in this program, where the zeta series
// is nonconvergent. We need to handle the case of zeta(s) -> infinity.
// This also comes up in init().

bm.doOneDisk = function() {
	if (!isFinite(bm.zeta)) {
		bm.state = "Exhausted";
		bm.UIstateUpdate();
		return false;		
	}
	const d = bm.newDisk();
	if (!d) {
		bm.state = "Jammed";
		bm.UIstateUpdate();
		return false;
	}
	bm.recordDisk(d);
	bm.redraw();
	bm.areaCovered += bm.diskArea
	bm.percentCovered = (bm.areaCovered / bm.boxArea) * 100;
	bm.countPixels();
	bm.diskCount++;
	bm.countNumber.innerHTML = bm.diskCount;
	bm.areaNumber.innerHTML = bm.percentCovered.toFixed(2) + "%";

	bm.k++;
	bm.diskArea = bm.areaFromK(bm.k);
	bm.diskRadius = bm.radiusFromArea(bm.diskArea);
	bm.nextArea = bm.areaFromK(bm.k + 1);
	bm.nextRadius = bm.radiusFromArea(bm.nextArea);
	return true;
}

bm.init = function() {
	bm.diskCount = 0;
	bm.k = bm.initial_k;
	bm.s = Number(bm.sSlider.noUiSlider.get());
	bm.zeta = zetaBorwein(bm.s);
	bm.boxArea = bm.zeta;
	bm.boxSide = Math.sqrt(bm.boxArea);
	bm.transformCoords();
	bm.diskArea = bm.areaFromK(bm.initial_k);
	bm.diskRadius = bm.radiusFromArea(bm.diskArea);
	bm.A_kFormula.innerHTML = `\\[A_k = \\frac{1}{k^{${bm.s.toFixed(2)}}}\\]`
	bm.A_boxFormula.innerHTML = `\\[A_{\\square} = \\zeta(${bm.s.toFixed(2)}) = ${isFinite(bm.zeta) ? bm.zeta.toFixed(2) : '\\infty'} \\]`;
	MathJax.Hub.Queue(["Typeset", MathJax.Hub, bm.controls]);
	bm.buildDiskDatabase();

	if (isFinite(bm.zeta)) {
		bm.nextArea = bm.diskArea;
		bm.nextRadius = bm.diskRadius;
		bm.drawGasket();
		bm.countPixels();
		bm.nextArea = bm.areaFromK(bm.k + 1);
		bm.nextRadius = bm.radiusFromArea(bm.nextArea);
	}
	else {
		bm.boxSide = 1;
		bm.transformCoords();
		bm.nextRadius = 0;
		bm.drawGasket();
		bm.countPixels();
	}
}

bm.init();


// No screen interface to these functions;
// they have to be called from the console.

var bm_centerDisk = function() {
	bm.init();
	const xy = bm.boxSide / 2;
	const r = bm.radiusFromArea(1);
	const d = new Disk(xy, xy, r);
	bm.recordDisk(d);
	bm.redraw();
	bm.areaCovered += bm.diskArea
	bm.percentCovered = (bm.areaCovered / bm.boxArea) * 100;
	bm.countPixels();	
}

var bm_cornerDisk = function() {
	bm.init();
	const xy = bm.nextRadius;
	const r = bm.radiusFromArea(1);
	const d = new Disk(r, r, r);
	bm.recordDisk(d);
	bm.redraw();
	bm.areaCovered += bm.diskArea
	bm.percentCovered = (bm.areaCovered / bm.boxArea) * 100;
	bm.countPixels();	
}


// PROGRAM 10: THE GASKET

const gk = new Dotster({initial_k: 1});

gk.areaFromK = function(k) {
	return 1 / Math.pow(k, gk.s);
}

gk.diskColor = "#fff";
gk.gasketColor = "#333";

gk.setUpDOM("gasket");

gk.colorFn = function(q) {
	return gk.diskColor;
}

gk.makeSlider(1.30, 1.01, 2.00, "s (exponent)", "sSlider");

gk.sSlider.noUiSlider.on("change", function() {
	gk.resetClick();
});

// UI elements to display the area of the gasket. the
// perimeter of the gasket, the average width of the
// gasket, and the dimensionless average width of the
// gasket.

gk.setUpCounters = function() {
  gk.gasketCounter = document.createElement("div");
  gk.gasketCounter.classList.add("gasket-counter-div");
  gk.controls.appendChild(gk.gasketCounter);
  
  gk.AgCounter = document.createElement("div");
  gk.AgCounter.id = "gasket-counter-Ag";
  gk.AgCounter.classList.add("gasket-counter");
	gk.gasketCounter.appendChild(gk.AgCounter);
  gk.AgCounterText = document.createElement("span");
  gk.AgCounterText.classList.add("gasket-counter-label");
  gk.AgCounter.appendChild(gk.AgCounterText);
  
  gk.PgCounter = document.createElement("div");
  gk.PgCounter.id = "gasket-counter-Pg";
  gk.PgCounter.classList.add("gasket-counter");
	gk.gasketCounter.appendChild(gk.PgCounter);
  gk.PgCounterText = document.createElement("span");
  gk.PgCounterText.classList.add("gasket-counter-label");
  gk.PgCounter.appendChild(gk.PgCounterText);
  
  gk.WgCounter = document.createElement("div");
  gk.WgCounter.id = "gasket-counter-Wg";
  gk.WgCounter.classList.add("gasket-counter");
	gk.gasketCounter.appendChild(gk.WgCounter);
  gk.WgCounterText = document.createElement("span");
  gk.WgCounterText.classList.add("gasket-counter-label");
  gk.WgCounter.appendChild(gk.WgCounterText);
	
  gk.DwCounter = document.createElement("div");
  gk.DwCounter.id = "gasket-counter-Dw";
  gk.DwCounter.classList.add("gasket-counter");
	gk.gasketCounter.appendChild(gk.DwCounter);
  gk.DwCounterText = document.createElement("span");
  gk.DwCounterText.classList.add("gasket-counter-label");
  gk.DwCounter.appendChild(gk.DwCounterText);
	
}

gk.init = function() {
	gk.diskCount = 0;
	gk.k = gk.initial_k;
	gk.countNumber.innerHTML = gk.diskCount;
	gk.s = Number(gk.sSlider.noUiSlider.get());
	gk.zeta = zetaBorwein(gk.s);
	gk.boxArea = gk.zeta;
	gk.boxSide = Math.sqrt(gk.boxArea);
	gk.transformCoords();
	gk.gasketArea = gk.boxArea;
	gk.gasketPerimeter = 4 * gk.boxSide;
	gk.gasketWidth = gk.gasketArea / gk.gasketPerimeter;
	gk.AgCounterText.innerHTML = `gasket area: ${gk.gasketArea.toFixed(2)}`;
	gk.PgCounterText.innerHTML = `perimeter: ${gk.gasketPerimeter.toFixed(2)}`;
	gk.WgCounterText.innerHTML = `width: ${gk.gasketWidth.toFixed(6)}`;
	gk.DwCounterText.innerHTML = `dimensionless width: ${gk.gasketWidth.toFixed(3)}`
	gk.A_kFormula.innerHTML = `\\[A_k = \\frac{1}{k^{${gk.s.toFixed(2)}}}\\]`;
	gk.A_boxFormula.innerHTML = `\\[A_{\\square} = \\zeta(${gk.s.toFixed(2)}) = ${gk.zeta.toFixed(2)}\\]`;
	MathJax.Hub.Typeset(gk.controls);
	gk.diskArea = gk.areaFromK(gk.k);
	gk.diskRadius = gk.radiusFromArea(gk.diskArea);
	gk.buildDiskDatabase();
}

gk.setUpCounters();
gk.init();

gk.doOneDisk = function() {
	const d = gk.newDisk();
	if (!d) {																							// no room at the inn
		gk.state = "Jammed";
		if (gk.runButton === "goStop") {
			gk.stopTimer();
		}
		gk.UIstateUpdate();
		return false;
	}
	
	if (gk.diskCount >= gk.maxDisks || gk.diskArea < gk.minDiskArea) {		// patience exhausted
		gk.state = "Exhausted";
		if (gk.runButton === "goStop") {
			gk.stopTimer();
		}
		gk.UIstateUpdate();
		return false;
	}
	
	gk.recordDisk(d);										// success...
	gk.drawDisk(d);
	gk.diskCount++;
	gk.diskArea = gk.areaFromRadius(d.r);
	gk.areaCovered += gk.diskArea;
	gk.percentCovered = gk.areaCovered / gk.boxArea * 100;
	gk.countNumber.innerHTML = gk.diskCount;
	gk.areaNumber.innerHTML = gk.percentCovered.toFixed(2) + "%";
	
	gk.gasketArea -= gk.diskArea;
	gk.gasketPerimeter += (gk.diskRadius * Math.PI * 2);
	gk.gasketWidth = gk.gasketArea / gk.gasketPerimeter;
	
	gk.k++;
	gk.diskArea = gk.areaFromK(gk.k);
	gk.diskRadius = gk.radiusFromArea(gk.diskArea);
	gk.diskColor = gk.colorFn(gk.diskArea);

	gk.dimensionlessWidth = gk.gasketWidth / (gk.diskRadius * 2);
	gk.AgCounterText.innerHTML = `gasket area: ${gk.gasketArea.toFixed(2)}`;
	gk.PgCounterText.innerHTML = `perimeter: ${gk.gasketPerimeter.toFixed(2)}`;
	gk.WgCounterText.innerHTML = `width: ${gk.gasketWidth.toFixed(6)}`;
	gk.DwCounterText.innerHTML = `dimensionless width: ${gk.dimensionlessWidth.toFixed(3)}`

	return true;
}


// PROGRAM 11: DISK AREAS BASED ON THE GEOMETRIC SERIES

// the analogue of zeta(s) for geometric series. Needed
// for both gm and g1.

let evalGeom = function(s) {
	return 1 / (1 - (1 / s));
}

const gm = new Dotster({dimension: 2, runButton: "goStop", bumpers: "no", initial_k: 0});

gm.setUpDOM("geometric");

gm.areaFromK = function(k) {
	return 1 / Math.pow(gm.s, k);
}

// Another slider with a logarithmic scale

gm.makeSlider = function(label, namestr) {
	this.sliderWrapper = document.createElement("div");
	this.sliderWrapper.classList.add("slider-wrapper");
	this.sliderBox.appendChild(this.sliderWrapper);
	this[namestr] = document.createElement("div");
	noUiSlider.create(this[namestr], {
	  start: [1.0010],
	  step: 0.0001,
    range: {
        'min': [-4],
        'max': [0]
    },
    decimals: 4,
    tooltips: true,
    format: {
        to: function (value) {
            return (1 + Number(Math.pow(10, value))).toFixed(4);
        },
        from: function (value) {
            return (Math.log(Number(value) - 1) * Math.LOG10E);
        }
    }
	});
	this[namestr].classList.add("slider");
	this.sliderWrapper.appendChild(this[namestr]);
	const theLabel = document.createElement("div");
	theLabel.classList.add("slider-label");
	theLabel.innerHTML = label;
	this.sliderWrapper.appendChild(theLabel);
}

gm.makeSlider("s (base)", "sSlider");

gm.sSlider.noUiSlider.on("change", function() {
	gm.resetClick();
});

gm.init = function() {
	gm.diskCount = 0;
	gm.k = gm.initial_k;
	gm.s = Number(gm.sSlider.noUiSlider.get());
	gm.geom = evalGeom(gm.s);
	gm.boxArea = gm.geom;
	gm.boxSide = Math.sqrt(gm.boxArea);
	gm.transformCoords();
	gm.A_kFormula.innerHTML = `\\[A_k = \\frac{1}{${gm.s.toFixed(4)}^k}\\]`
	gm.A_boxFormula.innerHTML = `\\[A_{\\square} = \\frac{s}{s-1} = ${gm.geom.toFixed(2)}\\]`;
	MathJax.Hub.Queue(["Typeset", MathJax.Hub, gm.controls]);
	gm.diskArea = gm.areaFromK(gm.k);
	gm.diskRadius = gm.radiusFromArea(gm.diskArea);
	gm.diskColor = gm.colorFn(gm.diskArea);
	gm.buildDiskDatabase();
}

gm.init();


// PROGRAM 12: ONE-DIMENSIONAL GEOMETRIC SERIES

const g1 = new Dotster({dimension: 1, runButton: "goStop", bumpers: "no", initial_k: 0});

g1.setUpDOM("geometric-1d");

g1.areaFromK = function(k) {
	return 1 / Math.pow(g1.s, k);
}

g1.makeSlider(1.5, 1.01, 4.00, "s (base)", "sSlider");

g1.sSlider.noUiSlider.on("change", function() {
	g1.resetClick();
});

g1.init = function() {
	g1.k = g1.initial_k;
	g1.diskCount = 0;
	g1.s = Number(g1.sSlider.noUiSlider.get());
	g1.geom = evalGeom(g1.s);
	g1.boxSide = g1.geom;
	g1.boxArea = g1.geom;
	g1.transformCoords();
	g1.A_kFormula.innerHTML = `\\[A_k = \\frac{1}{${g1.s.toFixed(2)}^k}\\]`
	g1.A_boxFormula.innerHTML = `\\[A_{\\square} = G(${g1.s.toFixed(2)}) = ${g1.geom.toFixed(2)}\\]`;
	MathJax.Hub.Queue(["Typeset", MathJax.Hub, g1.controls]);
	g1.diskArea = g1.areaFromK(g1.initial_k);
	g1.diskRadius = g1.radiusFromArea(g1.diskArea);
	g1.diskColor = g1.colorFn(g1.diskArea);
	g1.buildDiskDatabase();
}

g1.init();


// PROGRAM 13: DETERMINISTIC PLACEMENT OF GEOMETRIC SERIES DISKS
// (largest to smallest go left to right)

const gd = new Dotster({dimension: 1, runButton: "goStop", bumpers: "no", initial_k: 0});

gd.setUpDOM("deterministic-geom-1d");

gd.areaFromK = function(k) {
	return 1 / Math.pow(gd.s, k);
}

gd.maxDisks = 1e4;
gd.minDiskArea = 1e-10;

gd.makeSlider(1.5, 1.01, 4.00, "s (base)", "sSlider");

gd.sSlider.noUiSlider.on("change", function() {
	gd.resetClick();
});

gd.newDisk = function() {
	let d = new Disk();
	d.r = this.diskRadius;
	d.x = gd.leftX;
	d.y = 0;
	gd.leftX += (d.r * 2);
	if (gd.leftX > gd.boxSide) {
		return false;
	}
	return d;
}

gd.drawDisk = function(disk) {
	gd.ctx.fillStyle = this.diskColor;
  gd.ctx.fillRect(disk.x, 0, 2 * disk.r, this.boxSide);
}

gd.init = function() {
	gd.k = gd.initial_k;
	gd.diskCount = 0;
	gd.s = Number(gd.sSlider.noUiSlider.get());
	gd.geom = evalGeom(gd.s);
	gd.boxSide = gd.geom;
	gd.boxArea = gd.geom;
	gd.transformCoords();
	gd.A_kFormula.innerHTML = `\\[A_k = \\frac{1}{${gd.s.toFixed(2)}^k}\\]`
	gd.A_boxFormula.innerHTML = `\\[A_{\\square} = G(${gd.s.toFixed(2)}) = ${gd.geom.toFixed(2)}\\]`;
	MathJax.Hub.Queue(["Typeset", MathJax.Hub, gd.controls]);
	gd.diskArea = gd.areaFromK(gd.initial_k);
	gd.diskRadius = gd.radiusFromArea(gd.diskArea);
	gd.diskColor = gd.colorFn(gd.diskArea);
	gd.leftX = 0;
	gd.buildDiskDatabase();


}

gd.init();



// FIBONACCI SERIES

// This is all commented out because it's not very interesting.
// A set of disks based on the Fibonacci series cannot be fulfilling.
// The series has a finite sum, equal to about 3.59885. The Fibonacci
// series begins 1, 1, 2, 3, 5, 8, 13... The first two disks, each 
// of area = 1, have a radius of 0.564. The largest radius one
// can accommodate for two equal-size disks packed in
// a square of area 3.59885 is 0.537.

// You might try a trimmed fibonacci series, beginning 1, 2, 3, 5, 8...
// But then we have to reduce the box area by 1.0, and again
// it busts after the first disk.

/*
	
function fibonacci(n) {
	let a = 1, b = 1, i = 1;
	while (i < n) {
		[a, b] = [b, a + b];
		i++;
	}
	return a;
}

const fibConst = 3.359885666243;

const fb = new Dotster({dimension: 2, runButton: "goStop", bumpers: "no", initial_k: 2});

fb.areaFromK = function(k) {
	return 1 / fibonacci(k);
}

fb.setUpDOM("fibonacci");
fb.buildDiskDatabase();


fb.init = function() {
	
	fb.diskCount = 0;
	fb.k = fb.initial_k;
	fb.boxArea = fibConst - 1;
	fb.boxSide = Math.sqrt(fb.boxArea);
	fb.transformCoords();
	fb.A_kFormula.innerHTML = `\\[A_k = \\frac{1}{\\mathrm{fib}(k)}\\]`
	fb.A_boxFormula.innerHTML = "\\[A_{\\square} = \\psi = 2.59885\\]";
	MathJax.Hub.Queue(["Typeset", MathJax.Hub, fb.controls]);
	fb.diskArea = fb.areaFromK(fb.k);
	fb.diskRadius = fb.radiusFromArea(fb.diskArea);
	fb.diskColor = fb.colorFn(fb.diskArea);
}

fb.init();
*/


// JAMSTATS: GATHER STATISTICS OF THE FRACTION OF TRIALS THAT JAM

// This entuire progam has no graphic interface; it runs from the
// console and produces its output there. 

var jamstats = new Dotster({dimension: 2, runButton: "goStop", bumpers: "no", initial_k: 1});

jamstats.areaFromK = function(k) {
	return 1 / Math.pow(k, jamstats.s);
}

jamstats.init = function() {
	jamstats.diskCount = 0;
	jamstats.k = jamstats.initial_k;
	jamstats.zeta = zetaBorwein(jamstats.s);
	jamstats.boxArea = jamstats.zeta;
	jamstats.boxSide = Math.sqrt(jamstats.boxArea);
	jamstats.diskArea = jamstats.areaFromK(jamstats.k);
	jamstats.diskRadius = jamstats.radiusFromArea(jamstats.diskArea);
}

jamstats.placeDisks = function() {
	while (jamstats.diskCount < jamstats.maxDisks) {
		const d = jamstats.newDisk();
		if (!d) {
			break;
		}
		jamstats.recordDisk(d);
		jamstats.diskCount++;
		jamstats.k++;
		jamstats.diskArea = jamstats.areaFromK(jamstats.k);
		jamstats.diskRadius = jamstats.radiusFromArea(jamstats.diskArea);
	}
	return jamstats.diskCount;
}

jamstats.run = function(s, trials) {
	jamstats.maxDisks = 200;
	jamstats.s = s;
	jamstats.init();
	let counts = new Array(jamstats.maxDisks + 1);
	for (let i = 0; i <= (jamstats.maxDisks); i++) {
		counts[i] = 0;
	}
	for (let n = 1; n <= trials; n++) {
		jamstats.diskCount = 0;
		jamstats.k = jamstats.initial_k;
		jamstats.diskArea = jamstats.areaFromK(jamstats.k);
		jamstats.diskRadius = jamstats.radiusFromArea(jamstats.diskArea);
		jamstats.buildDiskDatabase();
		let jamstatsmieCount = jamstats.placeDisks();
		counts[jamstatsmieCount] += 1;
	}
	console.log(`s: ${s},  trials: ${trials},  counts: ${counts}`);
}

} // DO NOT REMOVE THIS CURLY BRACE ; IT TERMINATES THE BLOCK THAT ENCLOSES THE PROGRAM

