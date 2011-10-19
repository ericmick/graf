//graph.js
//Follows the MVVM pattern where Graph is the model, GraphViewModel is the viewmodel and CanvasGraphView is the view
//1. Graph models a mathematical graph: http://en.wikipedia.org/wiki/Graph_(mathematics)
//2. GraphViewModel models a view of a graph, especially how its vertices and edges are positioned
//3. CanvasGraphView renders and manipulates the model and a view-model of a graph on an HTML canvas

//Graph
//Represents a directed or undirected graph.
function Graph(v, e) { //Constructor
	function isArray(o) { return Object.prototype.toString.call(o) === '[object Array]'; };
	if (!isArray(v))
		throw new TypeError("Graph(v, e): Graph vertices must be an array.  v: " + v.toString());
	if (!isArray(e))
		throw new TypeError("Graph(v, e): Graph edges must be in array.  e: " + e.toString());
	this.v = v;
	this.e = e;
	this.vertexAdded = new Array();
	this.edgeAdded = new Array();
	this.vertexRemoved = new Array();
	this.edgeRemoved = new Array();
}
Graph.prototype = { //Prototype
	isConnected: function() {
		if (this.v.length <= 1) return true;
		else return this.getConnected([0]).length == this.v.length;
	},
	getAdjacent: function(a) {
		var b = [];
		for (var i = 0; i < a.length; i++) {
			for (var j = 0; j < this.e.length; j++) {
				var v = a[i], e = this.e[j];
				if (e[0] == v && b.indexOf(e[1]) == -1)
					b.push(e[1]);
				if (e[1] == v && b.indexOf(e[0]) == -1)
					b.push(e[0]);
			}
		}
		return b;
	},
	getConnected: function(a) {
		b = this.getAdjacent(a);
		for (var i = 0; i < a.length; i++)
			if (b.indexOf(a[i]) == -1)
				b.push(a[i]);
		if (b.length != a.length)
			return this.getConnected(b);
		else
			return a;
	},
	addVertex: function(v) {
		this.v.push(v);
		this.notify(this.vertexAdded, this.v.length - 1);
	},
	addEdge: function(e) {
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
		var e = this.e[i];
		this.e.splice(i, 1);
		this.notify(this.edgeRemoved, i);
	},
	notify: function(eventHandlers, eventArgs) {
		for (var j = 0; j < eventHandlers.length; j++) {
			eventHandlers[j](eventArgs);
		}
	}
};

//GraphViewModel
//The prototype for models of views of graphs.
function GraphViewModel(graph) {
	this.g = graph;
	this.v = new Array();
	var spiral = this.stepSpiral(this.g.v.length);
	for (var i = 0; i < this.g.v.length; i++) {
		this.v.push(new this.Vertex(this.g.v[i], spiral[i]));
	}
	this.e = new Array();
	for (var i = 0; i < this.g.e.length; i++) {
		this.e.push(new this.Edge(this.g.e[i]));
	}
	var vm = this;
	this.graphChanged = new Array();//event
	graph.vertexAdded.push(function (i) {
		vm.v.push(new vm.Vertex(vm.g.v[i], spiral[i]));
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
}
GraphViewModel.prototype = {
	Vertex: function(v, p) {
		this.text = v;
		this.p = [p[0], p[1]];
		this.width = .375 + v.length * .125;
		this.height = .5;
	},
	Edge: function(e) {
		this.e = e;
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
			for(var i = 0; i < x; i++) {
				p[1]++;
				r.push([p[0],p[1]]);
			}
			x++;
			for(var i = 0; i < x; i++) {
				p[0]--;
				r.push([p[0],p[1]]);
			}
			for(var i = 0; i < x; i++) {
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
}

Vector = {
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
}

function Ease(x0, x1, v0, t0, t1) {
	var dx = x1 - x0;
	var dt = t1 - t0;
	var tmid = (t1-t0)/2 + t0;
	var vmid = 2*dx/dt - v0/2;
	var a0 = (vmid-v0)/(dt/2);
	var a1 = -vmid/(dt/2);
	var d = function(v, a, t) {
		return v*t + a*t*t/2;
	}
	this.x = function(t) {
		if (t >= t1)
			return x1;
		else if (t <= tmid)
			return x0 + d(v0, a0, t-t0);
		else if (t > tmid)
			return x0 + d(v0, a0, tmid-t0) + d(vmid, a1, t-tmid);
	}
	this.v = function(t) {
		if (t >= t1)
			return 0;
		else if (t <= tmid)
			return v0 + a0*(t-t0);
		else if (t > tmid)
			return vmid + a1*(t-tmid);
	}
	this.end = t1;
}

function Decelerate(x0, v0, t0, t1) {
	var dt = t1 - t0;
	var a = -v0/dt;
	var d = function(v, a, t) {
		return v*t + a*t*t/2;
	}
	this.x = function(t) {
		if (t >= t1)
			return x0 + d(v0, a, t1-t0);
		else
			return x0 + d(v0, a, t-t0);
	}
	this.v = function(t) {
		if (t >= t1)
			return 0;
		else
			return v0 + a*(t-t0);
	}
	this.end = t1;
}

//CanvasGraphView
//A graph display on a canvas
function CanvasGraphView(graphViewModel, canvas) {
	this.gvm = graphViewModel;
	this.c = canvas;
	this.ctx = canvas.getContext("2d");
	var view = this;
	var easeTime = 150;
	var coastTime = 600;
	canvas.onmousedown = function(event) {
		if (view.motion != null) {//arrest an ongoing motion
			var now = new Date().getTime();
			var v = [view.motion[0].v(now), view.motion[1].v(now)];
			var x = [view.motion[0].x(now), view.motion[1].x(now)];
			view.motion = [new Ease(x[0], x[0], v[0], now, now + easeTime),
				new Ease(x[1], x[1], v[1], now, now + easeTime)];
		}
		var m0 = [event.clientX, event.clientY];
		var v0 = view.pickVertex(m0);
		if (v0 == null) {//pan
			var pan0 = [view.pan[0], view.pan[1]];
			view.c.onmousemove = function(event) {
				var now = new Date().getTime();
				var m1 = [event.clientX, event.clientY];
				var d = [(m1[0]-m0[0]), (m1[1]-m0[1])];
				if (view.motion != null) {
					var v = [view.motion[0].v(now), view.motion[1].v(now)];
					var x = [view.motion[0].x(now), view.motion[1].x(now)];
					view.motion = [new Ease(x[0], pan0[0]-d[0], v[0], now, now + easeTime),
						new Ease(x[1], pan0[1]-d[1], v[1], now, now + easeTime)];
				}
				else {
					view.motion = [new Ease(view.pan[0], pan0[0]-d[0], 0, now, now + easeTime),
						new Ease(view.pan[1], pan0[1]-d[1], 0, now, now + easeTime)];
					view.animate();
				}
			}
			view.c.onmouseup = function(event) {
				view.c.onmousemove = null;
				if (view.motion != null) {
					var now = new Date().getTime();
					var v = [view.motion[0].v(now), view.motion[1].v(now)];
					var x = [view.motion[0].x(now), view.motion[1].x(now)];
					view.motion = [new Decelerate(x[0], v[0], now, now + coastTime),
						new Decelerate(x[1], v[1], now, now + coastTime)];
				}
			}
		}
		else {//drag vertex
			view.c.onmouseup = function(event) {
				var m1 = [event.clientX, event.clientY];
				var v1 = view.pickVertex(m1);
				if (v1 != null && v0 != v1)//draw edge
					view.gvm.g.addEdge([v0, v1]);
				else {//move vertex
					var a = view.untransform(m0);
					var b = view.untransform(m1);
					view.gvm.v[v0].p[0] += b[0] - a[0];
					view.gvm.v[v0].p[1] += b[1] - a[1];
					if (view.motion == null)
						view.render();
				}
			}
		}
		return false;
	}
	canvas.onclick = function(event) {
		
	}
	canvas.onmouseout = function(event) {
		view.c.onmousemove = null;
	}
	canvas.onmousewheel = function(event) {
		view.zoom(event.wheelDelta/1000);
		view.render();
		if (event.preventDefault)
			event.preventDefault();
		event.returnValue = false;
	}
	gvm.graphChanged.push(function () {
		view.render();
	});
	this.render();
}
CanvasGraphView.prototype = {
	scale: 100,
	pan: [0, 0],
	motion: null,
	maxFPS: 40,
	maxScale: 1450,
	minScale: 45,
    animate: function() {
		var t = new Date().getTime();
		if (this.motion != null) {
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
			setTimeout(function(){view.animate()}, frameDuration < 1000/this.maxFPS ? 1000/this.maxFPS - frameDuration : 1);
		}
    },
	zoom: function(f) {
		var oldScale = this.scale;
		this.scale += f * oldScale;
		if (this.scale < this.minScale) this.scale = this.minScale;
		if (this.scale > this.maxScale) this.scale = this.maxScale;
		this.pan[0] += (this.scale - oldScale) / oldScale * this.pan[0];
		this.pan[1] += (this.scale - oldScale) / oldScale * this.pan[1];
	},
	transform: function (v) {
		return [v[0] * this.scale - this.pan[0] + this.c.width/2, v[1] * this.scale - this.pan[1] + this.c.height/2];
	},
	untransform: function (v) {
		return [(v[0] + this.pan[0] - this.c.width/2) / this.scale, (v[1] + this.pan[1] - this.c.height/2) / this.scale];
	},
	pickVertex: function (p) {
		p = this.untransform(p);
		for (var i = 0; i < this.gvm.v.length; i++) {
			var v = this.gvm.v[i];
			var d = [Math.abs(p[0] - v.p[0]), Math.abs(p[1] - v.p[1])];//vector from center of vertex to point flipped to the positive quadrant
			if (d[0] < v.width / 2 && d[1] <= v.height / 2) {//bounding box
				var sqrOfDistance = d[0] * d[0] + d[1] * d[1];//from center
				var angle = Math.atan2(d[0] / v.width, d[1] / v.height);
				if (sqrOfDistance < Math.pow(Math.sin(angle) * v.width / 2, 2) + Math.pow(Math.cos(angle) * v.height / 2, 2))
					return i;
			}
		}
	},
	render: function() {
		this.ctx.clearRect(0, 0, this.c.width, this.c.height);
		this.ctx.save();
		var fontSize = (this.scale * .2) | 0;
		this.ctx.font = fontSize + "px sans-serif";
		this.ctx.textAlign = "center";
		this.ctx.lineWidth = this.scale * .02;
		for (var i = 0; i < this.gvm.v.length; i++) {
			var v = this.gvm.v[i];
			var p = this.transform(this.gvm.v[i].p);
			if (fontSize >= 5)
				this.ctx.fillText(v.text, p[0], p[1] + fontSize * 7 / 20);
			if (v.width == v.height)
				this.circle(p[0], p[1], this.scale * v.height / 2);
			else
				this.ellipse(p[0], p[1], this.scale * v.width, this.scale * v.height);
		}
		for (var i = 0; i < this.gvm.e.length; i++) {
			this.ctx.beginPath();
			var a = this.gvm.v[this.gvm.e[i].e[0]];
			var b = this.gvm.v[this.gvm.e[i].e[1]];
			var c = [(a.p[0] + b.p[0]) / 2 + (b.p[1] - a.p[1]) / 4, (a.p[1] + b.p[1]) / 2 + (b.p[0] - a.p[0]) / 4];
			var angle = Math.atan2((c[0] - a.p[0]) / a.width, (c[1] - a.p[1]) / a.height);
			var la = Math.sqrt(Math.pow(Math.sin(angle) * a.width / 2, 2) + Math.pow(Math.cos(angle) * a.height / 2, 2));
			angle = Math.atan2((c[0] - b.p[0]) / b.width, (c[1] - b.p[1]) / b.height);
			var lb = Math.sqrt(Math.pow(Math.sin(angle) * b.width / 2, 2) + Math.pow(Math.cos(angle) * b.height / 2, 2));
			a = this.transform(Vector.add(Vector.multiply(Vector.normalize(Vector.subtract(c, a.p)), la), a.p));
			b = this.transform(Vector.add(Vector.multiply(Vector.normalize(Vector.subtract(c, b.p)), lb), b.p));
			c = this.transform(c);
			this.ctx.moveTo(a[0], a[1]);
			this.ctx.quadraticCurveTo(c[0], c[1], b[0], b[1]);
			this.ctx.stroke();
		}
		this.ctx.restore();
	},
	circle: function(x, y, r) {
		this.ctx.beginPath();
		this.ctx.moveTo(x + r, y);
		this.ctx.arc(x, y, r, 0, 2 * Math.PI, false);
		this.ctx.stroke();
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
		this.ctx.stroke();
	}
}
