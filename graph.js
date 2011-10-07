 //Graph
//Represents a directed or undirected multigraph.
function Graph(v, e) { //Constructor
	function isArray(o) { return Object.prototype.toString.call(o) === '[object Array]'; };
	if (!isArray(v))
		throw new TypeError("Graph(v, e): Graph vertices must be in an array.  v: " + v.toString());
	if (!isArray(e))
		throw new TypeError("Graph(v, e): Graph edges must be in an array.  e: " + e.toString());
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
		this.v = v;
		this[0] = p[0];
		this[1] = p[1];
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
			this.v[i][0] = spiral[i][0];
			this.v[i][1] = spiral[i][1];
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

function Ease(x0, x1, v0, t0, t1)
{
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

function Decelerate(x0, v0, t0, t1)
{
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
		if (event.button === 0) {
			if (view.motion != null) {
				var now = new Date().getTime();
				var v = [view.motion[0].v(now), view.motion[1].v(now)];
				var x = [view.motion[0].x(now), view.motion[1].x(now)];
				view.motion = [new Ease(x[0], x[0], v[0], now, now + easeTime),
					new Ease(x[1], x[1], v[1], now, now + easeTime)];
			}
			var m0 = [event.clientX, event.clientY];
			var v0 = view.vectorPick(m0);
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
			else {//draw edge
				view.c.onmouseup = function(event) {
					var m1 = [event.clientX, event.clientY];
					var v1 = view.vectorPick(m1);
					if (v1 != null)
						view.gvm.g.addEdge([v0, v1]);
				}
			}
		}
	}
	
	canvas.onclick = function(event) {
		if (event.altKey) {
			var x = view.untransform([event.clientX, event.clientY]);
			view.gvm.v[0][0] = x[0];
			view.gvm.v[0][1] = x[1];
			if (view.motion == null)
				view.render();
		}
		if (event.ctrlKey) {
			var v = view.vectorPick([event.clientX, event.clientY]);
			if (v != null)
				console.log(view.gvm.v.v);
		}
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
	vectorRadius: .25,
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
			this.ctx.fillText("render time: " + frameDuration + "ms", 200, 200);
		}
    },
	zoom: function(f) {
		this.scale += f * this.scale;
		this.pan[0] += f * this.pan[0];
		this.pan[1] += f * this.pan[1];
	},
	transform: function (v) {
		return [v[0] * this.scale - this.pan[0] + this.c.width/2, v[1] * this.scale - this.pan[1] + this.c.height/2];
	},
	untransform: function (v) {
		return [(v[0] + this.pan[0] - this.c.width/2) / this.scale, (v[1] + this.pan[1] - this.c.height/2) / this.scale];
	},
	vectorPick: function (x) {
		var r = this.vectorRadius;
		var y = this.untransform(x);
		for (var i = 0; i < this.gvm.v.length; i++) {
			var v = this.gvm.v[i];
			if (v[0]-y[0] <= r && v[1]-y[1] <= r) {
				var d = Vector.subtract(v, y);
				if (d[0]*d[0] + d[1]*d[1] <= r*r)
					return i;
			}
		}
		return null;
	},
	render: function() {
		var radius = this.vectorRadius;
		this.ctx.clearRect(0, 0, this.c.width, this.c.height);
		this.ctx.save();
		var fontSize = (this.scale * .2) | 0;
		if (fontSize > 16) fontSize = 16;
		this.ctx.font = fontSize + "px Arial";
		this.ctx.textAlign = "center";
		this.ctx.lineWidth = this.scale * .02;
		if (this.ctx.lineWidth < .5) this.ctx.lineWidth = .5;
		for (var i = 0; i < this.gvm.v.length; i++) {
			var v = this.gvm.v[i];
			var p = this.transform(this.gvm.v[i]);
			if (fontSize >= 5)
				this.ctx.fillText(v.v, p[0], p[1] + fontSize * 7 / 20);
			this.ctx.beginPath();
			this.ctx.moveTo(p[0] + this.scale * radius, p[1]);
			this.ctx.arc(p[0], p[1], this.scale * radius, 0, 2*Math.PI, false);
			this.ctx.stroke();
		}
		for (var i = 0; i < this.gvm.e.length; i++) {
			this.ctx.beginPath();
			var a = this.gvm.v[this.gvm.e[i].e[0]];
			var b = this.gvm.v[this.gvm.e[i].e[1]];
			var c = [(a[0] + b[0]) / 2 - Math.abs(a[1] - b[1]) / 2, 
				(a[1] + b[1]) / 2 - Math.abs(a[0] - b[0]) / 2];
			a = this.transform(Vector.add(Vector.multiply(Vector.normalize(Vector.subtract(c, a)), radius), a));
			b = this.transform(Vector.add(Vector.multiply(Vector.normalize(Vector.subtract(c, b)), radius), b));
			c = this.transform(c);
			this.ctx.moveTo(a[0], a[1]);
			this.ctx.quadraticCurveTo(c[0], c[1], b[0], b[1]);
			this.ctx.stroke();
		}
		this.ctx.restore();
	}
}
