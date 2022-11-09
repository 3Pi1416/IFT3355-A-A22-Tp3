
class Node {
	constructor(parentNode) {
		this.parentNode = parentNode; //Noeud parent
		this.childNode = []; //Noeud enfants

		this.p0 = null; //Position de depart de la branche
		this.p1 = null; //Position finale de la branche

		this.a0 = null; //Rayon de la branche a p0
		this.a1 = null; //Rayon de la branche a p1

		this.sections = null; //Liste contenant une liste de points representant les segments circulaires du cylindre generalise
	}
}

TP3.Geometry = {

	simplifySkeleton: function (rootNode, rotationThreshold = 0.0001) {
		let children = rootNode.childNodes;
		if (children.length == 0) {
			return rootNode;
		}
		if (children.length == 1) {
			let child = children[0];
			let angleParent = Math.atan2(rootNode.p1.x - rootNode.p0.x, rootNode.p1.y - rootNode.p0.y)
			let angleChild = Math.atan2(child.p1.x - child.p0.x, child.p1.y - child.p0.y);
			let angle = angleChild + angleParent;
			if (angle < this.rotationThreshold) {
				rootNode.childNode = child.childNode;
				rootNode.p1 = child.p1;
				rootNode.a1 = child.a1;
				rootNode.removeChild(child);
				simplifySkeleton(rootNode, rotationThreshold);
				return rootNode;
			}
			else {
				simplifySkeleton(child, rotationThreshold);
				return child
			}
		}
		else {
			for (i in children.length) {
				simplifySkeleton(children[i], rotationThreshold);
			}
			
		}
		

			
		
	},

	generateSegmentsHermite: function (rootNode, lengthDivisions = 4, radialDivisions = 8) {
		//TODO
	},

	hermite: function (h0, h1, v0, v1, t) {
		//TODO
	},


	// Trouver l'axe et l'angle de rotation entre deux vecteurs
	findRotation: function (a, b) {
		const axis = new THREE.Vector3().crossVectors(a, b).normalize();
		var c = a.dot(b) / (a.length() * b.length());

		if (c < -1) {
			c = -1;
		} else if (c > 1) {
			c = 1;
		}

		const angle = Math.acos(c);

		return [axis, angle];
	},

	// Projeter un vecter a sur b
	project: function (a, b) {
		return b.clone().multiplyScalar(a.dot(b) / (b.lengthSq()));
	},

	// Trouver le vecteur moyen d'une liste de vecteurs
	meanPoint: function (points) {
		var mp = new THREE.Vector3();

		for (var i = 0; i < points.length; i++) {
			mp.add(points[i]);
		}

		return mp.divideScalar(points.length);
	},
};