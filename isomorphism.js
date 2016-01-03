
function getAdjacency(g) {
	var a = []; //adjacency matrix of g
	//initialize matrix to zeros
	for (var i = 0; i < g.v.length; i++) {
		var b = [];
		for (var j = 0; j < g.v.length; j++) {
			b.push(0);
		}
		a.push(b);
	}
	for (var k = 0; k < g.e.length; k++) {
		var e = g.e[k];
		a[e[0]][e[1]] = 1;
		a[e[1]][e[0]] = 1;
	}
	return a;
}

function isEqual(a, a2) {
	if (a.length != a2.length) {
		return false;
	}
	for (var i = 0; i < a.length; i++) {
		for (var j = 0; j < a.length; j++) {
			if (a[i][j] != a2[i][j]) {
				return false;
			}
		}
	}
	return true;
}

function swap(a, i, j) {
	var temp;
	for (var k = 0; k < a.length; k++) {
		temp = a[k][i];
		a[k][i] = a[k][j];
		a[k][j] = temp;
	}
	temp = a[i];
	a[i] = a[j];
	a[j] = temp;
}

//Heap's algorithm
function permute(n, a, callback) {
	if (n == 1) {
		return callback(a);
	} else {
		for (var i = 0; i < n - 1; i++) {
			var result = permute(n - 1, a, callback);
			if (result) {
				return result;
			};
			if ((n % 2) == 0) {
				swap(a, i, n-1);
			} else {
				swap(a, 0, n-1);
			}
		}
		return permute(n - 1, a, callback);
	}
}

function isIsomorphic(g, g2) {
	var a = getAdjacency(g), a2 = getAdjacency(g2);
	if (a.length != a2.length) {
		return false;
	}
	if (isEqual(a, a2)) {
		return true;
	}
	var result = false;
	permute(a.length, a, function(a) {
		if (isEqual(a, a2)) {
			result = true;
			return true;
		}
	});
	return result || false;
}

onmessage = function(e) {
	postMessage(isIsomorphic(e.data[0], e.data[1]));
};