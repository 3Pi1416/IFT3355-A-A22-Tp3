
class Node {
	constructor(parentNode) {
		this.parentNode = parentNode; //Noeud parent
		this.childNode = []; //Noeud enfants

		this.p0Initial = null; //Position de depart de la branche
		this.p1Initial = null; //Position finale de la branche

		this.p0 = null; //Position de depart de la branche
		this.oldP0 = null;
		this.p1 = null; //Position finale de la branche

		this.a0 = null; //Rayon de la branche a p0
		this.a1 = null; //Rayon de la branche a p1

		this.v0 = null; //la tangente  point p0
		this.v1 = null; //la tangente  point p1

		this.matrixTransformation = [new THREE.Vector3(0, 0, 0), 0]; //Matrice de transformation
		this.matrixTransformationUpdate = [new THREE.Vector3(0, 0, 0), 0];; // vector to move P1 to P1'


		this.sections = null; //Liste contenant une liste de points representant les segments circulaires du cylindre generalise
		this.points = null;

		this.vel = new THREE.Vector3(0, 0, 0); // initialisation de la  vitesse 

		//information sur les points utiliser pour faire les objets 
		this.beginningArrayBranches = -1;
		this.endArrayBranches = -1

		this.beginningArrayApples = -1;
		this.endArrayApples = -1

		this.beginningArrayleaves = -1;
		this.endArrayleaves = -1

		this.appleIndices = null; // s'il y a une pomme sur la branche 
	}
}

TP3.Geometry = {

	simplifySkeleton: function (rootNode, rotationThreshold = 0.0001) {
		let numberOfChild = rootNode.childNode.length;

		//cas ou seulement un enfant existe
		if (numberOfChild == 1 && rootNode.childNode[0] != null) {
			let child = rootNode.childNode[0];
			//trouverl'angle du parent et de 
			let vectorChild = new THREE.Vector3().subVectors(child.p1, child.p0);
			let vectorParent = new THREE.Vector3().subVectors(rootNode.p1, rootNode.p0);

			// calculer l'angle entre les deux vecteurs et s'assurer qu'il ne dépense pas le threshold
			if (Math.abs(vectorChild.angleTo(vectorParent) < rotationThreshold)) {
				//detuire l'enfant 
				rootNode.p1 = child.p1;
				rootNode.a1 = child.a1;
				rootNode.childNode = child.childNode;
				rootNode.childNode.forEach(node => {
					node.parentNode = rootNode;
				});
				//continuerle processus sur la même branche 
				this.simplifySkeleton(rootNode, rotationThreshold);
				rootNode.p1Initial = rootNode.p1;
				rootNode.p0Initial = rootNode.p0;
				return rootNode
			}

		}
		//répéter pour chacun des enfants de la branches  
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
			//cas special au tronc, on suppose une ligne droite 
			rootNode.v0 = new THREE.Vector3(0, 1, 0);
		} else {
			rootNode.v0 = rootNode.parentNode.v1;
		}
		rootNode.v1 = new THREE.Vector3().subVectors(rootNode.p1, rootNode.p0);

		//information de base 
		let numberOfChild = rootNode.childNode.length;
		rootNode.sections = []
		rootNode.points = []
		let degree = 2 * Math.PI / (radialDivisions + 1);


		for (let i = 0; i < lengthDivisions; i++) {
			let t = i / (lengthDivisions - 1);
			//information à t 
			let radius = rootNode.a0 * (1 - t) + rootNode.a1 * t;
			let hermitePoint = this.hermite(rootNode.p0, rootNode.p1, rootNode.v0, rootNode.v1, t)
			let centralPoint = hermitePoint[0];
			let vectorTangente = hermitePoint[1].normalize();


			//axe y et  

			rootNode.points.push(centralPoint.clone())
			let arrayPoint = []
			// calculer les 2 vecteur orthogonaux à la normal, mais de facon contrôler ( direction de base en x  > 0)

			let point1 = new THREE.Vector3(vectorTangente.y, -vectorTangente.x, 0);
			point1.normalize();
			let point2 = new THREE.Vector3().crossVectors(point1, vectorTangente);
			point2.normalize();
			//s'assurer de la taille 
			point1.multiplyScalar(radius);
			point2.multiplyScalar(radius);

			//forcer l'orientation du  x 
			let theta = 0;
			if (point1.x < 0) {
				point1 = new THREE.Vector3(-point1.x, -point1.y, -point1.z);
			}
			if (vectorTangente.y < 0) {
				theta = Math.PI;
			}

			// cas special avec étant sur l'Axe 
			if (Math.abs(vectorTangente.x) > 0.999) {
				point1 = new THREE.Vector3(0, -radius, 0);
				point2 = new THREE.Vector3(0, 0, radius);

			}
			if (Math.abs(vectorTangente.z) > 0.999) {
				point1 = new THREE.Vector3(radius, 0, 0);
				point2 = new THREE.Vector3(0, -radius, 0);

			}
			if (Math.abs(vectorTangente.y) > 0.999) {
				point1 = new THREE.Vector3(radius, 0, 0);
				point2 = new THREE.Vector3(0, 0, radius);

			}
			for (let j = 0; j < radialDivisions + 2; j++) {
				//calculer la proportion des vecteur orthogonaux 
				let a = Math.cos(theta + j * degree);
				let b = Math.sin(theta + j * degree);

				//L'Appliquer 
				let point = new THREE.Vector3(point1.x * a + point2.x * b, point1.y * a + point2.y * b, point1.z * a + point2.z * b);
				let newPoint = new THREE.Vector3().addVectors(point, centralPoint);
				arrayPoint.push(newPoint)

			}
			rootNode.sections.push(arrayPoint)
		}


		if (numberOfChild > 0) {
			{
				rootNode.childNode.forEach(node => {
					this.generateSegmentsHermite(node, lengthDivisions, radialDivisions);
				});
			}
		}


		return rootNode;
	},

	hermite: function (h0, h1, v0, v1, t) {

		//matrice de base 
		let m = new THREE.Matrix4().set(
			h0.x, h0.y, h0.z, 1,
			h1.x, h1.y, h1.z, 1,
			v0.x, v0.y, v0.z, 1,
			v1.x, v1.y, v1.z, 1
		);

		// Conversion d’une courbe de Hermite en courbe de Bezier (ps : facteur 1/3 à l'intérieur )
		let matrixDeCasteljau = new THREE.Matrix4().set(
			1, 0, 0, 0,
			1, 0, 1 / 3, 0,
			0, 1, 0, -1 / 3,
			0, 1, 0, 0
		);

		//prépartion de la matrice
		let matriceP = new THREE.Matrix4().multiplyMatrices(matrixDeCasteljau, m);
		let arrayPoint = [
			new THREE.Vector3(matriceP.elements[0], matriceP.elements[4], matriceP.elements[8]),
			new THREE.Vector3(matriceP.elements[1], matriceP.elements[5], matriceP.elements[9]),
			new THREE.Vector3(matriceP.elements[2], matriceP.elements[6], matriceP.elements[10]),
			new THREE.Vector3(matriceP.elements[3], matriceP.elements[7], matriceP.elements[11])]

		//caculer bezier avec la matrice	
		let result = this.bezier(arrayPoint, t);


		return result;

	},

	bezier: function (listPoint, t) {
		// si dernier segment on interpole et on termine
		if (listPoint.length == 2) {
			let newPoint = new THREE.Vector3().addVectors(new THREE.Vector3().addScaledVector(listPoint[0], (1 - t)), new THREE.Vector3().addScaledVector(listPoint[1], t));
			let newPointTangente = new THREE.Vector3().subVectors(listPoint[0], listPoint[1]);
			return [newPoint, newPointTangente];
		}

		// si on a pas le de dernier segment, on interpole les nouveaux point et on renvoie dans bezier avec un réduction d,un point aka un segment 
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
		var c = a.dot(b) / (a.length() * b.length() || 1);

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