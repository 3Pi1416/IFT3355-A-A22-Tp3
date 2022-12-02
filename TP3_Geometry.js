
class Node {
	constructor(parentNode) {
		this.parentNode = parentNode; //Noeud parent
		this.childNode = []; //Noeud enfants

		this.p0Initial = null; //Position de depart de la branche
		this.p1Initial = null; //Position finale de la branche

		this.p0 = null; //Position de depart de la branche
		this.p1 = null; //Position finale de la branche

		this.a0 = null; //Rayon de la branche a p0
		this.a1 = null; //Rayon de la branche a p1

		this.v0 = null;
		this.v1 = null;

		this.hasApple = false;

		this.transformation = new THREE.Vector3(0, 0, 0); //Matrice de transformation
		this.transformationParenthood = new THREE.Vector3(0, 0, 0);

		this.sections = null; //Liste contenant une liste de points representant les segments circulaires du cylindre generalise
		this.points = null;


		this.beginningArrayBranches = -1;
		this.endArrayBranches = -1

		this.beginningArrayApples = -1;
		this.endArrayApples = -1

		this.beginningArrayleaves = -1;
		this.endArrayleaves = -1
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
				rootNode.p1Initial = rootNode.p1;
				rootNode.p0Initial = rootNode.p0;
				return rootNode
			}

		}

		if (numberOfChild >= 1) {
			{
				rootNode.childNode.forEach(node => {
					this.simplifySkeleton(node, rotationThreshold);
				});
			}
		}
		rootNode.p1Initial = rootNode.p1;
		rootNode.p0Initial = rootNode.p0;
		return rootNode
	},

	generateSegmentsHermite: function (rootNode, lengthDivisions = 4, radialDivisions = 8) {


		if (rootNode.parentNode == null) {
			rootNode.v0 = new THREE.Vector3(0, 1, 0);
		} else {
			rootNode.v0 = rootNode.parentNode.v1;
		}
		rootNode.v1 = new THREE.Vector3().subVectors(rootNode.p1, rootNode.p0);


		let numberOfChild = rootNode.childNode.length;
		rootNode.sections = []
		rootNode.points = []


		let degree = 2 * Math.PI / (radialDivisions);
		for (let i = 0; i < lengthDivisions; i++) {
			let t = i / (lengthDivisions - 1);

			let hermitePoint = this.hermite(rootNode.p0, rootNode.p1, rootNode.v0, rootNode.v1, t)

			let radius = rootNode.a0 * (1 - t) + rootNode.a1 * t;

			let centralPoint = hermitePoint[0];
			let vectorTangente = hermitePoint[1].normalize();

			rootNode.points.push(centralPoint.clone())
			// let centralPoint = new THREE.Vector3().addVectors(new THREE.Vector3().addScaledVector(rootNode.p0, (1 - t)), new THREE.Vector3().addScaledVector(rootNode.p1, t));
			// let vectorTangente = new THREE.Vector3().addVectors(new THREE.Vector3().addScaledVector(rootNode.v0, (1 - t)), new THREE.Vector3().addScaledVector(rootNode.v1, t));
			// vectorTangente.normalize();


			// change le direction de la normal afin de garder un sens au branche
			// if (vectorTangente.x > 0) {
			// 	vectorTangente.x = - vectorTangente.x;
			// 	vectorTangente.y = - vectorTangente.y;
			// 	vectorTangente.z = - vectorTangente.z;
			// }



			//calculer les angles pour la rotation des branche





			let arrayPoint = []
			// calculer les 2 vecteur orthogonaux à la normal, mais de facon contrôler ( direction de base en x)
			let point1 = new THREE.Vector3(vectorTangente.y, -  vectorTangente.x, 0);
			point1.normalize();
			point1.multiplyScalar(radius);
			let point2 = new THREE.Vector3().crossVectors(point1, vectorTangente);
			point2.normalize();
			point2.multiplyScalar(radius);

			// let rho = Math.asin(vectorTangente.y);
			// if ((vectorTangente.x < 0 && vectorTangente.y > 0)) {
			// 	rho = rho - 2 * Math.PI;
			// }
			// let hypothenuseX =  Math.cos(rho)
			let theta = 0;


			if (point1.x < 0) {
				point1 = new THREE.Vector3(-point1.x, -point1.y, -point1.z);
			}

			if (vectorTangente.y < 0) {
				theta = Math.PI;
			}
			// if (point1.x < 0 || (point2.z < 0 && point2.z > 0.5) || (point2.y && point2.y > 0.5)) {
			// 	point2 = new THREE.Vector3(-point2.x, -point2.y, -point2.z);
			// }

			if (Math.abs(vectorTangente.x) > 0.999) {
				point1 = new THREE.Vector3(0, -radius, 0);
				point2 = new THREE.Vector3(0, 0, radius);

			}
			if (Math.abs(vectorTangente.z > 0.999)) {
				point1 = new THREE.Vector3(radius, 0, 0);
				point2 = new THREE.Vector3(0, -radius, 0);

			}
			if (Math.abs(vectorTangente.y > 0.999)) {
				point1 = new THREE.Vector3(radius, 0, 0);
				point2 = new THREE.Vector3(0, 0, radius);

			}
			for (let j = 0; j < radialDivisions + 1; j++) {
				// créer le point de base en utilisant en utilisant l'opposé en x, z de la tangente
				// let point = new THREE.Vector3(radius, 0, 0);
				let a = Math.cos(theta + j * degree);
				let b = Math.sin(theta + j * degree);
				let point = new THREE.Vector3(point1.x * a + point2.x * b, point1.y * a + point2.y * b, point1.z * a + point2.z * b);
				// let point = new THREE.Vector3(hypothenuseXZ * Math.cos(rotation), radius * Math.sin(rho) * Math.cos(rotation + theta), hypothenuseXZ * Math.sin(rotation));

				// let matrixRotation = new THREE.Matrix4().makeRotationY(degree * j)
				// let rotationAxisXinZ = new THREE.Matrix4().makeRotationZ(rho)
				// let rotationAxisXinY = new THREE.Matrix4().makeRotationY(theta)

				// point.applyMatrix4(rotationAxisXinY)
				// point.applyMatrix4(rotationAxisXinZ)
				// point.applyMatrix4(matrixRotation)

				let newPoint = new THREE.Vector3(point.x + centralPoint.x, point.y + centralPoint.y, point.z + centralPoint.z)
				arrayPoint.push(newPoint)

			}
			rootNode.sections.push(arrayPoint)
		}


		if (numberOfChild >= 1) {
			{


				rootNode.childNode.forEach(node => {

					if (node.a1 / node.parentNode.a1 > 1.001) {
						console.log(node.a1 / node.parentNode.a1)
					}
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
			let newPointTangente = new THREE.Vector3().subVectors(listPoint[0], listPoint[1]);
			return [newPoint, newPointTangente];
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