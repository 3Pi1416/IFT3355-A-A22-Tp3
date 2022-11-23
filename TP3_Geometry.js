
class Node {
	constructor(parentNode) {
		this.parentNode = parentNode; //Noeud parent
		this.childNode = []; //Noeud enfants

		this.p0 = null; //Position de depart de la branche
		this.p1 = null; //Position finale de la branche

		this.a0 = null; //Rayon de la branche a p0
		this.a1 = null; //Rayon de la branche a p1

		this.v0 = null;
		this.v1 = null;

		this.sections = null; //Liste contenant une liste de points representant les segments circulaires du cylindre generalise
	}
}

TP3.Geometry = {

	simplifySkeleton: function (rootNode, rotationThreshold = 0.0001) {
		let numberOfChild = rootNode.childNode.length;


		if (numberOfChild == 1 && rootNode.childNode[0] != null) {
			let child = rootNode.childNode[0];
			let vectorChild = new THREE.Vector3()
			vectorChild.subVectors(child.p1, child.p0);
			let vectorParent = new THREE.Vector3()
			vectorParent.subVectors(rootNode.p1, rootNode.p0);

			if (Math.abs(vectorChild.angleTo(vectorParent) < rotationThreshold)) {
				rootNode.p1 = child.p1;
				rootNode.a1 = child.a1;
				rootNode.childNode = child.childNode;
				rootNode.childNode.forEach(node => {
					node.parentNode = rootNode;
				});
				this.simplifySkeleton(rootNode, rotationThreshold);
				return rootNode
			}

		}

		// pour précaculer pour la partie d 
		if (rootNode.parentNode == null) {
			rootNode.v0 = new THREE.Vector3(0, 1, 0);
		} else {
			rootNode.v0 = rootNode.parentNode.v1;
		}
		rootNode.v1 = new THREE.Vector3().subVectors(rootNode.p1, rootNode.p0);


		if (numberOfChild >= 1) {
			{
				rootNode.childNode.forEach(node => {
					this.simplifySkeleton(node, rotationThreshold);
				});
			}
		}

		return rootNode
	},

	generateSegmentsHermite: function (rootNode, lengthDivisions = 4, radialDivisions = 8) {

		//TEMPS !!!!!!!!!!!!!!!!!!
		// lengthDivisions = 2;


		let numberOfChild = rootNode.childNode.length;
		let distanceBranch = rootNode.p1.distanceTo(rootNode.p0);

		let lengthOfNode = distanceBranch / (lengthDivisions - 1);
		rootNode.sections = []

		let degree = 2 * Math.PI / radialDivisions;
		for (let i = 0; i < lengthDivisions; i++) {
			let t = i / (lengthDivisions - 1);

			let hermitePoint = this.hermite(rootNode.p0, rootNode.p1, rootNode.v0, rootNode.v1, t)

			let radius = rootNode.a0 * (1 - t) + rootNode.a1 * t;



			// let centralPoint = hermitePoint[0];
			// let vectorNormalTemp = hermitePoint[1];
			// console.log(centralPoint, vectorNormalTemp)

			// //temp
			let centralPoint = new THREE.Vector3().addVectors(new THREE.Vector3().addScaledVector(rootNode.p0, (1 - t)), new THREE.Vector3().addScaledVector(rootNode.p1, t));
			let vectorTangenteTemp = new THREE.Vector3().addVectors(new THREE.Vector3().addScaledVector(rootNode.v0, (1 - t)), new THREE.Vector3().addScaledVector(rootNode.v1, t));
			vectorTangenteTemp.normalize();

			let point = new THREE.Vector3(radius, 0, 0);


			//calculer les angles pour la rotation des branche 
			let rho = Math.PI / 2 - Math.asin(vectorTangenteTemp.y);
			if (centralPoint.z < 0) {
				rho = rho - 2 * Math.PI;
			}

			//appliquer la rotation a des matrice 
			let matrixRotationX = new THREE.Matrix4().makeRotationX(rho)

			point.applyMatrix4(matrixRotationX);

			let arrayPoint = []
			for (let j = 0; j < radialDivisions; j++) {
				let newPoint = new THREE.Vector3(point.x + centralPoint.x, point.y + centralPoint.y, point.z + centralPoint.z)
				arrayPoint.push(newPoint)
				point.applyAxisAngle(vectorTangenteTemp, degree);
			}
			rootNode.sections.push(arrayPoint)
		}


		if (numberOfChild >= 1) {
			{
				rootNode.childNode.forEach(node => {
					this.generateSegmentsHermite(node, lengthDivisions, radialDivisions);
				});
			}
		}


		return rootNode;
	},

	hermite: function (h0, h1, v0, v1, t) {

		let m = new THREE.Matrix4().set(
			h0.x, h0.y, h0.z, 1,
			h1.x, h1.y, h1.z, 1,
			v0.x, v0.y, v0.z, 1,
			v1.x, v1.y, v1.z, 1
		);

		// let matriceTempsInverse = new THREE.Matrix4().set(
		// 	2, -2, 1, 1,
		// 	-3, 3, -2, -1,
		// 	0, 0, 1, 0,
		// 	1, 0, 0, 0
		// );

		// let p = new THREE.Vector4().set(Math.pow(t, 3), Math.pow(t, 2), t, 1);
		// p.applyMatrix4(new THREE.Matrix4().multiplyMatrices(matriceTempsInverse, m));
		// let dp = new THREE.Vector4().set(3 * Math.pow(t, 2), 2 * t, 1, 0);
		// dp.applyMatrix4(new THREE.Matrix4().multiplyMatrices(matriceTempsInverse, m));





		let matrixDeCasteljau = new THREE.Matrix4().set(
			1, 0, 0, 0,
			1, 0, 1 / 3, 0,
			0, 1, 0, -1 / 3,
			0, 1, 0, 0
		);

		let matriceP = new THREE.Matrix4().multiplyMatrices(matrixDeCasteljau, m);
		let arrayPoint = [
			new THREE.Vector3(matriceP.elements[0], matriceP.elements[4], matriceP.elements[8]),
			new THREE.Vector3(matriceP.elements[1], matriceP.elements[5], matriceP.elements[9]),
			new THREE.Vector3(matriceP.elements[2], matriceP.elements[6], matriceP.elements[10]),
			new THREE.Vector3(matriceP.elements[3], matriceP.elements[7], matriceP.elements[11])]

		let result = this.bezier(arrayPoint, t);


		return result;

	},

	bezier: function (listPoint, t) {
		if (listPoint.length == 2) {
			let newPoint = new THREE.Vector3().addVectors(new THREE.Vector3().addScaledVector(listPoint[0], (1 - t)), new THREE.Vector3().addScaledVector(listPoint[1], t));
			return [newPoint, new THREE.Vector3];
		}

		let newArray = []
		for (let i = 0; i < listPoint.length - 1; i++) {
			let newPoint = new THREE.Vector3().addVectors(new THREE.Vector3().addScaledVector(listPoint[i], (1 - t)), new THREE.Vector3().addScaledVector(listPoint[i + 1], t));
			newArray.push(newPoint);
		}
		return this.bezier(newArray, t);
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