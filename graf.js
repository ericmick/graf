//graph.js
//Follows the MVVM pattern where Graph is the model, GraphViewModel is the viewmodel and CanvasGraphView is the view
//1. Graph models a mathematical graph: http://en.wikipedia.org/wiki/Graph_(mathematics)
//2. GraphViewModel models a view of a graph, especially how its vertices and edges are positioned
//3. CanvasGraphView renders and manipulates the model and a view-model of a graph on an HTML canvas

//Graph
//Represents a directed or undirected graph.
function Graph(v, e) { //Constructor
	function isArray(o) { return Object.prototype.toString.call(o) === '[object Array]'; }
	if (!isArray(v))
		throw new TypeError("Graph(v, e): Graph vertices must be an array.  v: " + v.toString());
	if (!isArray(e))
		throw new TypeError("Graph(v, e): Graph edges must be in array.  e: " + e.toString());
	this.v = v;
	this.e = e;
	this.vertexAdded = [];
	this.edgeAdded = [];
	this.vertexRemoved = [];
	this.edgeRemoved = [];
	this.vertexEdited = [];
}
Graph.prototype = { //Prototype
	isAdjacent: function(a, b) {
		for (var i = 0; i < this.e.length; i++) {
			if((this.e[i][0] == a && this.e[i][1] == b)
					|| (this.e[i][0] == b && this.e[i][1] == a)) {
				return true;
			}
		}
		return false;
	},
	isConnected: function() {
		if (this.v.length <= 1) return true;
		else return this.getConnected([0]).length == this.v.length;
	},
	getAdjacent: function(a) {
		var b = [];
		for (var i = 0; i < a.length; i++) {
			for (var j = 0; j < this.e.length; j++) {
				var v = a[i], e = this.e[j];
				if (e[0] == v && b.indexOf(e[1]) == -1) {
					b.push(e[1]);
				}
				if (e[1] == v && b.indexOf(e[0]) == -1) {
					b.push(e[0]);
				}
			}
		}
		return b;
	},
	getConnected: function(a) {
		var b = this.getAdjacent(a);
		for (var i = 0; i < a.length; i++)
			if (b.indexOf(a[i]) == -1)
				b.push(a[i]);
		if (b.length != a.length)
			return this.getConnected(b);
		else
			return a;
	},
	addVertex: function(v) {
		var i = this.v.push(v) - 1;
		this.notify(this.vertexAdded, i);
		return i;
	},
	addEdge: function(e) {
		if (this.isAdjacent(e[0], e[1])) {
			return false;
		}
		this.e.push(e);
		this.notify(this.edgeAdded, this.e.length - 1);
	},
	removeVertex: function(i) {
		for (var j = 0; j < this.e.length; j++) {
			while (this.e[j][0] == i || this.e[j][1] == i) {
				this.removeEdge(j);
			}
			if (this.e[j][0] > i) this.e[j][0]--;
			if (this.e[j][1] > i) this.e[j][1]--;
		}
		this.v.splice(i, 1);
		this.notify(this.vertexRemoved, i);
	},
	removeEdge: function(i) {
		this.e.splice(i, 1);
		this.notify(this.edgeRemoved, i);
	},
	editVertex: function(i, v) {
		this.v[i] = v;
		this.notify(this.vertexEdited, i);
	},
	notify: function(eventHandlers, eventArgs) {
		for (var j = 0; j < eventHandlers.length; j++) {
			eventHandlers[j](eventArgs);
		}
	},
	clone: function() {
		return new Graph(this.v.slice(0), this.e.slice(0));
	}
};

//GraphViewModel
//The prototype for models of views of graphs.
function GraphViewModel(graph) {
	this.g = graph;
	this.v = [];
	var spiral = this.stepSpiral(this.g.v.length);
	for (var i = 0; i < this.g.v.length; i++) {
		this.v.push(new this.Vertex(this.g.v[i], spiral[i]));
	}
	this.e = [];
	for (i = 0; i < this.g.e.length; i++) {
		this.e.push(new this.Edge(this.g.e[i]));
	}
	var vm = this;
	this.graphChanged = [];//events
	graph.vertexAdded.push(function (i) {
		vm.v.push(new vm.Vertex(vm.g.v[i], [0, 0]));
		vm.notify(vm.graphChanged);
	});
	graph.edgeAdded.push(function (i) {
		vm.e.push(new vm.Edge(vm.g.e[i]));
		vm.notify(vm.graphChanged);
	});
	graph.edgeRemoved.push(function (i) {
		vm.e.splice(i, 1);
		vm.notify(vm.graphChanged);
	});
	graph.vertexRemoved.push(function (i) {
		vm.v.splice(i, 1);
		vm.position();
		vm.notify(vm.graphChanged);
	});
	graph.vertexEdited.push(function (i) {
		vm.v[i].setText(graph.v[i]);
		vm.notify(vm.graphChanged);
	});
}
GraphViewModel.prototype = {
	Vertex: function(text, p) {
		var v = this;
		v.text = text;
		v.p = [p[0], p[1]];
		v.setText = function (t) {
			v.text = t;
			v.width = Math.max(0.375 + t.length * 0.125, 0.5);
			v.height = 0.5;
		};
		v.setText(text);
	},
	Edge: function(e) {
		//TODO: label edges, support directed edges
		this.e = e;
	},
	addVertex: function(text, p) {
		//add vertex to underlying graph
		var i = this.g.addVertex(text);
		//track its position
		this.v[i].p = p;
		return i;
	},
	addEdge: function(v0, v1) {
		this.g.addEdge([v0, v1]);
	},
	stepSpiral: function(n) {
		var p = [0,0];
		var r = [[0,0]];
		var x = 1;
		while (r.length < n) {
			for(var i = 0; i < x; i++) {
				p[0]++;
				r.push([p[0],p[1]]);
			}
			for(i = 0; i < x; i++) {
				p[1]++;
				r.push([p[0],p[1]]);
			}
			x++;
			for(i = 0; i < x; i++) {
				p[0]--;
				r.push([p[0],p[1]]);
			}
			for(i = 0; i < x; i++) {
				p[1]--;
				r.push([p[0],p[1]]);
			}
			x++;
			n++;
		}
		return r;
	},
	position: function() {
		var spiral = this.stepSpiral(this.g.v.length);
		for (var i = 0; i < this.g.v.length; i++) {
			this.v[i].p[0] = spiral[i][0];
			this.v[i].p[1] = spiral[i][1];
		}
	},
	notify: function(eventHandlers, eventArgs) {
		for (var j = 0; j < eventHandlers.length; j++) {
			eventHandlers[j](eventArgs);
		}
	}
};

var Vector = {
	length: function(a) {
		return Math.sqrt(a[0]*a[0]+a[1]*a[1]);
	},
	normalize: function(a) {
		var l = this.length(a);
		return [a[0]/l,a[1]/l];
	},
	add: function(a, b) {
		return [a[0]+b[0],a[1]+b[1]];
	},
	subtract: function(a, b) {
		return [a[0]-b[0],a[1]-b[1]];
	},
	multiply: function(a, x) {
		return [a[0]*x,a[1]*x];
	}
};

function Ease(x0, x1, v0, t0, t1) {
	var dx = x1 - x0;
	var dt = t1 - t0;
	var tmid = (t1-t0)/2 + t0;
	var vmid = 2*dx/dt - v0/2;
	var a0 = (vmid-v0)/(dt/2);
	var a1 = -vmid/(dt/2);
	var d = function(v, a, t) {
		return v*t + a*t*t/2;
	};
	this.x = function(t) {
		if (t >= t1)
			return x1;
		else if (t <= tmid)
			return x0 + d(v0, a0, t-t0);
		else if (t > tmid)
			return x0 + d(v0, a0, tmid-t0) + d(vmid, a1, t-tmid);
	};
	this.v = function(t) {
		if (t >= t1)
			return 0;
		else if (t <= tmid)
			return v0 + a0*(t-t0);
		else if (t > tmid)
			return vmid + a1*(t-tmid);
	};
	this.end = t1;
}

function Decelerate(x0, v0, t0, t1) {
	var dt = t1 - t0;
	var a = -v0/dt;
	var d = function(v, a, t) {
		return v*t + a*t*t/2;
	};
	this.x = function(t) {
		if (t >= t1)
			return x0 + d(v0, a, t1-t0);
		else
			return x0 + d(v0, a, t-t0);
	};
	this.v = function(t) {
		if (t >= t1)
			return 0;
		else
			return v0 + a*(t-t0);
	};
	this.end = t1;
}

//CanvasGraphView
//A graph display on a canvas
function CanvasGraphView(graphViewModel, canvas, behaviors) {
	this.gvm = graphViewModel;
	this.c = canvas;
	this.ctx = canvas.getContext("2d");
	var view = this;
	this.selection = null;
	this.textChanged = [];//event
	this.gvm.graphChanged.push(function () {
		view.render();
	});
	this.render();
	this.behaviors = behaviors || [];
	this.handleEvents();
}
CanvasGraphView.prototype = {
	scale: 100,
	pan: [0, 0],
	motion: null,
	maxFPS: 60,
	maxScale: 1450,
	minScale: 45,
	draggingVertex: null,
	draggingFrom: null,
	events: ['click',
			'mousedown',
			'mousemove',
			'mouseout',
			'mouseup',
			'mousewheel',
			'touchstart', 
			'touchmove',
			'touchcancel',
			'touchend'],
	handleEvents: function() {
		var view = this;
		view.eventListeners = {};
		for (var i = 0; i < view.events.length; i++) {
			(function() {
				var eventName = view.events[i];
				view.eventListeners[eventName] = function(event) {
					for (var j = 0; j < view.behaviors.length; j++) {
						if (typeof view.behaviors[j][eventName] == 'function'
								&& view.behaviors[j][eventName](event, view)) {
							//if a behavior's event handler returns something truthy, consider the event consumed.
							event.preventDefault();
							return true;
						}
					}
					//default cursor is default
					if (eventName == 'mousemove') {
						view.setCursor('default');
					}
				};
				view.c.addEventListener(eventName, view.eventListeners[eventName], false);
			})();
		}
	},
	detach: function() {
		var view = this;
		for (var i = 0; i < view.events.length; i++) {
			var eventName = view.events[i];
			view.c.removeEventListener(eventName, view.eventListeners[eventName]);
		}
	},
	animate: function() {
		var t = new Date().getTime();
		if (this.motion !== null) {
			if (t > this.motion[0].end && t > this.motion[1].end) {
				this.pan = [this.motion[0].x(t), this.motion[1].x(t)];
				this.motion = null;
				this.render();
				return;
			}
			this.pan = [this.motion[0].x(t), this.motion[1].x(t)];
			this.render();
			var frameDuration = new Date().getTime() - t;
			var view = this;
			setTimeout(function(){view.animate();}, frameDuration < 1000/this.maxFPS ? 1000/this.maxFPS - frameDuration : 1);
		}
	},
	zoom: function(s, p) {
		var oldScale = this.scale;
		this.scale += s * oldScale;
		if (this.scale < this.minScale) this.scale = this.minScale;
		if (this.scale > this.maxScale) this.scale = this.maxScale;
		this.pan[0] += (this.scale - oldScale) / oldScale * (this.pan[0] + p[0] - this.c.width / 2);
		this.pan[1] += (this.scale - oldScale) / oldScale * (this.pan[1] + p[1] - this.c.height / 2);
	},
	transform: function(v) {
		return [v[0] * this.scale - this.pan[0] + this.c.width/2, v[1] * this.scale - this.pan[1] + this.c.height/2];
	},
	untransform: function(v) {
		return [(v[0] + this.pan[0] - this.c.width/2) / this.scale, (v[1] + this.pan[1] - this.c.height/2) / this.scale];
	},
	pickVertex: function(p) {
		p = this.untransform(p);
		for (var i = 0; i < this.gvm.v.length; i++) {
			var v = this.gvm.v[i];
			var d = [Math.abs(p[0] - v.p[0]), Math.abs(p[1] - v.p[1])];//vector from center of vertex to point flipped to the positive quadrant
			if (d[0] < v.width / 2 && d[1] <= v.height / 2) {//bounding box
				var sqrOfDistance = d[0] * d[0] + d[1] * d[1];//from center
				var angle = Math.atan2(d[0] / v.width, d[1] / v.height);
				if (sqrOfDistance < Math.pow(Math.sin(angle) * v.width / 2, 2) + Math.pow(Math.cos(angle) * v.height / 2, 2)) {
					return i;
				}
			}
		}
		return null;
	},
	renderEdge: function(edge) {
		if (edge.e[0] == edge.e[1]) {
			var p = this.gvm.v[edge.e[0]].p;
			this.circle(p[0] + p.width / 2, p[1] + p.height / 2, p.height);
		} else {
			this.ctx.beginPath();
			var a = this.gvm.v[edge.e[0]];
			var b = this.gvm.v[edge.e[1]];
			if (this.style == 'curvy') {
				var c = [(a.p[0] + b.p[0]) / 2 + (b.p[1] - a.p[1]) / 8, (a.p[1] + b.p[1]) / 2 + (b.p[0] - a.p[0]) / 8];
			} else {
				var c = [(a.p[0] + b.p[0]) / 2, (a.p[1] + b.p[1]) / 2];
			}
			var angle = Math.atan2((c[0] - a.p[0]) / a.width, (c[1] - a.p[1]) / a.height);
			var la = Math.sqrt(Math.pow(Math.sin(angle) * a.width / 2, 2) + Math.pow(Math.cos(angle) * a.height / 2, 2));
			angle = Math.atan2((c[0] - b.p[0]) / b.width, (c[1] - b.p[1]) / b.height);
			var lb = Math.sqrt(Math.pow(Math.sin(angle) * b.width / 2, 2) + Math.pow(Math.cos(angle) * b.height / 2, 2));
			a = this.transform(Vector.add(Vector.multiply(Vector.normalize(Vector.subtract(c, a.p)), la), a.p));
			b = this.transform(Vector.add(Vector.multiply(Vector.normalize(Vector.subtract(c, b.p)), lb), b.p));
			c = this.transform(c);
			this.ctx.moveTo(a[0], a[1]);
			if (this.style == 'curvy') {
				this.ctx.quadraticCurveTo(c[0], c[1], b[0], b[1]);
			} else {
				this.ctx.lineTo(b[0], b[1]);
			}
		}
		this.ctx.stroke();
	},
	renderVertex: function(v, selected, position) {
		var p = position ? position : this.transform(v.p);
		this.ctx.strokeStyle = selected ? "white" : "black";
		if (v.width == v.height) {
			this.circle(p[0], p[1], this.scale * v.height / 2);
		} else {
			this.ellipse(p[0], p[1], this.scale * v.width, this.scale * v.height);
		}
		this.ctx.stroke();
		if (selected) {
			this.ctx.fillStyle = "black";
			this.ctx.fill();
			this.ctx.fillStyle = "white";
			this.ctx.fillText(v.text, p[0], p[1] + this.fontSize * 7 / 20);
			this.ctx.fillStyle = "black";
		} else {
			this.ctx.fillText(v.text, p[0], p[1] + this.fontSize * 7 / 20);
		}
	},
	render: function() {
		this.ctx.clearRect(0, 0, this.c.width, this.c.height);
		this.ctx.save();
		this.fontSize = (this.scale * 0.2) | 0;
		this.ctx.font = this.fontSize + "px helvetica, sans-serif";
		this.ctx.textAlign = "center";
		this.ctx.lineWidth = this.scale * 0.02;
		this.ctx.strokeStyle = "black";
		for (var i = 0; i < this.gvm.e.length; i++) {
			this.renderEdge(this.gvm.e[i]);
		}
		for (i = 0; i < this.gvm.v.length; i++) {
			if (i === this.draggingVertex) {
				this.renderVertex(this.gvm.v[i],
						true,
						Vector.add(this.transform(this.gvm.v[i].p),
								Vector.subtract(this.draggingTo, this.draggingFrom)));
			}
			this.renderVertex(this.gvm.v[i], i == this.selection);
		}
		this.ctx.restore();
	},
	circle: function(x, y, r) {
		this.ctx.beginPath();
		this.ctx.moveTo(x + r, y);
		this.ctx.arc(x, y, r, 0, 2 * Math.PI, false);
	},
	ellipse: function(x, y, w, h) {//bezier spline approximation: http://en.wikipedia.org/wiki/Bézier_spline#Approximating_circular_arcs
		this.ctx.beginPath();
		this.ctx.moveTo(x + w / 2, y);//right
		var c1 = [x + w / 2, y - h * 2 * (Math.SQRT2 - 1) / 3];//outer control points
		var c2 = [x + w * 2 * (Math.SQRT2 - 1) / 3, y - h / 2];
		this.ctx.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], x, y - h / 2);//top
		c1 = [x - w * 2 * (Math.SQRT2 - 1) / 3, y - h / 2];
		c2 = [x - w / 2, y - h * 2 * (Math.SQRT2 - 1) / 3];
		this.ctx.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], x - w / 2, y);//left
		c1 = [x - w / 2, y + h * 2 * (Math.SQRT2 - 1) / 3];
		c2 = [x - w * 2 * (Math.SQRT2 - 1) / 3, y + h / 2];
		this.ctx.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], x, y + h / 2);//bottom
		c1 = [x + w * 2 * (Math.SQRT2 - 1) / 3, y + h / 2];
		c2 = [x + w / 2, y + h * 2 * (Math.SQRT2 - 1) / 3];
		this.ctx.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], x + w / 2, y);//right
	},
	setText: function(text) {
		if (this.selection !== null) {
			this.gvm.g.editVertex(this.selection, text);
			this.notify(this.textChanged, text);
		}
	},
	getText: function() {
		if (this.selection !== null)
			return this.gvm.v[this.selection].text;
		else return null;
	},
	notify: function(eventHandlers, eventArgs) {
		for (var j = 0; j < eventHandlers.length; j++) {
			eventHandlers[j](eventArgs);
		}
	},
	addBehavior: function(behavior) {
		this.behaviors.push(behavior);
	},
	removeBehavior: function(behavior) {
		for(var i = 0; i < this.behaviors.length; i++) {
			if (this.behaviors[i] == behavior) {
				this.behaviors.splice(i, 1);
				return;
			}
		}
	},
	setCursor: function(cursor) {
		//these cursors rely on a stylesheet with classes :-(
		var cssClassCursors = ['grab', 'grabbing'];
		for (var i = 0; i < cssClassCursors.length; i++) {
			this.c.className = this.c.className.replace(new RegExp('\\b' + cssClassCursors[i] + '\\b', 'g'), '');
		}
		switch (cursor) {
			case 'grab':
			case 'grabbing':
				this.c.className += ' ' + cursor;
				this.c.style.cursor = '';
			default:
				this.c.style.cursor = cursor;
		}
	},
	getMousePosition: function(event) {
		var m = event.touches
				? [event.touches[0].clientX, event.touches[0].clientY]
				: [event.clientX, event.clientY];
		m[0] -= this.c.offsetLeft;
		m[1] -= this.c.offsetTop;
		return m;
	},
	startDrag: function(event) {
		var m0 = this.getMousePosition(event);
		var v0 = this.pickVertex(m0);
		if (v0 !== null) {
			this.draggingVertex = v0;
			this.draggingFrom = m0;
			this.draggingTo = m0;
			return true;
		}
		return false;
	},
	isDraggingVertex: function() {
		return this.draggingFrom !== null;
	},
	moveDrag: function(event) {
		if (!this.isDraggingVertex()) {
			return false;
		}
		var m = this.getMousePosition(event);
		this.draggingTo = m;
		this.render();
		return true;
	},
	endDrag: function() {
		if (!this.isDraggingVertex()) {
			return false;
		}
		this.draggingVertex = null;
		this.draggingFrom = null;
		this.draggingTo = null;
		this.render();
		return true;
	}
};

function Behavior(modifiers, disabled) {
	this.modifiers = modifiers || [];
	this.disabled = disabled || false;
}
Behavior.prototype = {
	applies: function(event) {
		if (this.disabled) {
			return false;
		}
		for(var i = 0; i < this.modifiers.length; i++) {
			if (!event[this.modifiers[i]]) {
				return false;
			}
		}
		return true;
	},
	modify: function(prop, enable) {
		if (enable === false) {
			var i = this.modifiers.indexOf(prop);
			if (i >= 0) {
				this.modifiers.splice(i, 1);
			}
		} else {
			this.modifiers.push(prop);
		}
		return this;
	},
	ctrl: function(enable) {
		return this.modify('ctrlKey', enable);
	},
	shift: function(enable) {
		return this.modify('shiftKey', enable);
	},
	alt: function(enable) {
		return this.modify('altKey', enable);
	},
	meta: function(enable) {
		return this.modify('metaKey', enable);
	}
};

function Panning(modifiers, easeTime, coastTime) {
	this.easeTime = (typeof easeTime != 'undefined') ? easeTime : 50;
	this.coastTime = (typeof coastTime != 'undefined') ? coastTime : 100;
	Behavior.call(this, modifiers);
}
Panning.prototype = Object.create(Behavior.prototype);
Panning.prototype.constructor = Panning;
Panning.prototype.mousedown = Panning.prototype.touchstart = function(event, view) {
	if (this.applies(event)) {
		if (view.motion !== null) {
			//arrest an ongoing motion
			var now = new Date().getTime();
			var v = [view.motion[0].v(now), view.motion[1].v(now)];
			var x = [view.motion[0].x(now), view.motion[1].x(now)];
			view.motion = [new Ease(x[0], x[0], v[0], now, now + this.easeTime),
				new Ease(x[1], x[1], v[1], now, now + this.easeTime)];
		}
		var m0 = view.getMousePosition(event);
		var pan0 = [view.pan[0], view.pan[1]];
		view.setCursor('grabbing');
		this.mousemove = this.touchmove = function(event) {
			var now = new Date().getTime();
			var m1 = view.getMousePosition(event);
			var d = [(m1[0]-m0[0]), (m1[1]-m0[1])];
			if (view.motion !== null) {
				var v = [view.motion[0].v(now), view.motion[1].v(now)];
				var x = [view.motion[0].x(now), view.motion[1].x(now)];
				view.motion = [new Ease(x[0], pan0[0]-d[0], v[0], now, now + this.easeTime),
					new Ease(x[1], pan0[1]-d[1], v[1], now, now + this.easeTime)];
			} else {
				view.motion = [new Ease(view.pan[0], pan0[0]-d[0], 0, now, now + this.easeTime),
					new Ease(view.pan[1], pan0[1]-d[1], 0, now, now + this.easeTime)];
				view.animate();
			}
			view.setCursor('grabbing');
			return true;
		};
		this.mouseup = this.touchend = function() {
			this.mousemove = this.touchmove = Panning.prototype.mousemove;
			if (view.motion !== null) {
				var now = new Date().getTime();
				var v = [view.motion[0].v(now), view.motion[1].v(now)];
				var x = [view.motion[0].x(now), view.motion[1].x(now)];
				view.motion = [new Decelerate(x[0], v[0], now, now + this.coastTime),
					new Decelerate(x[1], v[1], now, now + this.coastTime)];
			}
			view.setCursor('grab');
			return true;
		};
		return true;
	}
};
Panning.prototype.mousemove = Panning.prototype.touchmove = function(event, view) {
	if (this.applies(event)) {
		var m0 = view.getMousePosition(event);
		var v0 = view.pickVertex(m0);
		if (v0 === null && view.draggingVertex === null) {
			view.setCursor('grab');
			return true;
		}
	}
};
Panning.prototype.mouseout = Panning.prototype.touchcancel = function(event, view) {
	if (typeof this.mouseup == 'function') {
		return this.mouseup(event, view);
	}
};

function Selecting(modifiers) {
	Behavior.call(this, modifiers);
}

Selecting.prototype = Object.create(Behavior.prototype);
Selecting.prototype.constructor = Selecting;
Selecting.prototype.click = function(event, view) {
	if (this.applies(event)) {
		var m = view.getMousePosition(event);
		var v = view.pickVertex(m);
		view.selection = v;
		view.notify(view.textChanged, view.getText());
		view.render();
		return true;
	}
};

function Zooming(modifiers) {
	Behavior.call(this, modifiers);
}
Zooming.prototype = Object.create(Behavior.prototype);
Zooming.prototype.constructor = Zooming;
Zooming.prototype.mousewheel = function(event, view) {
	if (this.applies(event)) {
		view.zoom(event.wheelDelta/1000, view.getMousePosition(event));
		if (view.motion === null)
			view.render();
		if (event.preventDefault)
			event.preventDefault();
		event.returnValue = false;
		return true;
	}
};

function Moving(modifiers) {
	Behavior.call(this, modifiers);
}
Moving.prototype = Object.create(Behavior.prototype);
Moving.prototype.constructor = Moving;
Moving.prototype.mousedown = function(event, view) {
	if (this.applies(event)) {
		return view.startDrag(event);
	}
};
Moving.prototype.mousemove = function(event, view) {
	if (this.applies(event)) {
		var m = view.getMousePosition(event);
		var v = view.pickVertex(m);
		if (view.draggingVertex !== null) {
			var a, b;
			view.moveDrag(event);
			if (v === null || view.draggingVertex === v) {
				view.setCursor('move');
				//consider this event consumed
				return true;
			}
		} else if (v !== null) {
			view.setCursor('move');
			//consider this event consumed
			return true;
		}
	}
};
Moving.prototype.mouseup = function(event, view) {
	if (this.applies(event) && view.isDraggingVertex()) {
		var v0 = view.draggingVertex;
		var m1 = view.getMousePosition(event);
		var v1 = view.pickVertex(m1);
		var p0 = view.untransform(view.draggingFrom);
		var p1 = view.untransform(m1);
		view.endDrag();
		if (v1 === null || v0 === v1) {
			//move vertex
			view.gvm.v[v0].p = Vector.add(view.gvm.v[v0].p, Vector.subtract(p1, p0));
			view.render();
			return true;
		}
	}
};
Moving.prototype.mouseout = function(event, view) {
	if (typeof this.mouseup == 'function') {
		return this.mouseup(event, view);
	}
};

function CreatingEdges(modifiers) {
	Behavior.call(this, modifiers);
}
CreatingEdges.prototype = Object.create(Behavior.prototype);
CreatingEdges.prototype.constructor = CreatingEdges;
CreatingEdges.prototype.mousedown = function(event, view) {
	if (this.applies(event)) {
		return view.startDrag(event);
	}
};
CreatingEdges.prototype.mousemove = function(event, view) {
	if (this.applies(event) && view.isDraggingVertex()) {
		var m1 = view.getMousePosition(event);
		var v1 = view.pickVertex(m1);
		view.moveDrag(event);
		if (v1 !== null) {
			view.setCursor('alias');
			//consider this event consumed
			return true;
		}
	}
};
CreatingEdges.prototype.mouseup = function(event, view) {
	if (this.applies(event) && view.isDraggingVertex()) {
		var v0 = view.draggingVertex;
		var m1 = view.getMousePosition(event);
		var v1 = view.pickVertex(m1);
		if (v1 !== null) {
			//draw edge
			view.gvm.g.addEdge([v0, v1]);
			view.endDrag(event);
			return true;
		}
	}
};
CreatingEdges.prototype.mouseout = function(event, view) {
	if (typeof this.mouseup == 'function') {
		return this.mouseup(event, view);
	}
};

function CreatingVertices(modifiers) {
	Behavior.call(this, modifiers);
}
CreatingVertices.prototype = Object.create(Behavior.prototype);
CreatingVertices.prototype.constructor = CreatingVertices;
CreatingVertices.prototype.mousedown = function(event, view) {
	return view.startDrag(event);
};
CreatingVertices.prototype.mousemove = function(event, view) {
	if (this.applies(event) && view.isDraggingVertex()) {
		var m1 = view.getMousePosition(event);
		var v1 = view.pickVertex(m1);
		view.moveDrag(event);
		if (v1 == null) {
			//draw edge
			view.setCursor('copy');
			//consider this event consumed
			return true;
		}
	}
};
CreatingVertices.prototype.mouseup = function(event, view) {
	if (this.applies(event) && view.isDraggingVertex()) {
		var v0 = view.draggingVertex;
		var m1 = view.getMousePosition(event);
		var v1 = view.pickVertex(m1);
		if (v1 === null) {
			//draw edge and new vertex
			var v = view.gvm.addVertex('', view.untransform(m1));
			view.gvm.addEdge(v0, v);
			view.endDrag(event);
			return true;
		}
	}
};
CreatingVertices.prototype.mouseout = function(event, view) {
	if (typeof this.mouseup == 'function') {
		return this.mouseup(event, view);
	}
};