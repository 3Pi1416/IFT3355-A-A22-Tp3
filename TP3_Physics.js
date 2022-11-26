const appleMass = 0.075;

TP3.Physics = {
	initTree: function (rootNode) {

		this.computeTreeMass(rootNode);

		var stack = [];
		stack.push(rootNode);

		while (stack.length > 0) {
			var currentNode = stack.pop();
			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}

			currentNode.bp0 = currentNode.p0.clone();
			currentNode.bp1 = currentNode.p1.clone();
			currentNode.rp0 = currentNode.p0.clone();
			currentNode.rp1 = currentNode.p1.clone();
			currentNode.vel = new THREE.Vector3();
			currentNode.strength = currentNode.a0;
		}
	},

	computeTreeMass: function (node) {
		var mass = 0;

		for (var i = 0; i < node.childNode.length; i++) {
			mass += this.computeTreeMass(node.childNode[i]);
		}
		mass += node.a1;
		if (node.appleIndices !== null) {
			mass += appleMass;
		}
		node.mass = mass;

		return mass;
	},

	applyForces: function (node, dt, time) {

		var u = Math.sin(1 * time) * 4;
		u += Math.sin(2.5 * time) * 2;
		u += Math.sin(5 * time) * 0.4;

		var v = Math.cos(1 * time + 56485) * 4;
		v += Math.cos(2.5 * time + 56485) * 2;
		v += Math.cos(5 * time + 56485) * 0.4;

		// Ajouter le vent
		node.vel.add(new THREE.Vector3(u / Math.sqrt(node.mass), 0, v / Math.sqrt(node.mass)).multiplyScalar(dt));
		// Ajouter la gravite
		node.vel.add(new THREE.Vector3(0, -node.mass, 0).multiplyScalar(dt));

		// TODO: Projection du mouvement, force de restitution et amortissement de la velocite
		// p0 depend de la position precedante
		// p1 change en fonction de la somme des forces qui si applique plus celle dans noeuds parents.
		// Mouvenemtn des branches selon le vent est comme un ressort (F = -k(stretchLenght - equilibrium)directionAvecVitess)
		
		let angleZ = Math.atan2(node.p1.z, node.vel.z);
		let angleX = Math.atan2(node.p1.x, node.vel.x);
		let matriceMouv = new THREE.Matrix4();
		let maxRotationX = new THREE.Matrix4();
		// let maxRotationY = new THREE.Matrix4();
		let maxRotationZ = new THREE.Matrix4();
		maxRotationZ.makeRotationZ(angleZ);
		// maxRotationY.makeRotationY(teta);
		maxRotationX.makeRotationX(angleX);
		matriceMouv.multiplyMatrices(maxRotationZ, maxRotationX);
		maxMouvementY = new THREE.Matrix4();
		
		maxMouvementY.makeTranslation(node.p1.y + node.vel.y);

		matriceMovForces = new THREE.Matrix4().multiplyMatrices(matriceMouv, maxMouvementY)

			// matrixTransformation.multiply(matrixBasicMovement)
		
		updateTreeSkeleton(geometryBuffer, node)


		



		// Appel recursif sur les enfants
		for (var i = 0; i < node.childNode.length; i++) {
			this.applyForces(node.childNode[i], dt, time);
		}
	}
}