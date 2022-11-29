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


		// Root: p0 stays the same; calculate new p1 according to all the forces. Calculate a final transformation
		//matrix for the movement from previous p1 to new p1. Update p1 position.
		// Set children's transformation matrix to this matrix.

		// Non-root: apply transformation matrix to p0 and p1. Calculate new p1 according to all the forces. Calculate
		// transformation matrix for the movement from previous p1 to new p1. Update p1 position.
		// Set children's transformation matrix to this matrix (if they exist).

		// Set the propagation rule
		if (node.parentNode !== null) {
			let newP0 = node.p0.clone();
			newP0.applyMatrix4(node.transformation);

			let newP1 = node.p1.clone();
			newP1.applyMatrix4(node.transformation);

			node.p0 = newP0.clone();
			node.p1 = newP1.clone();
		}

		// get quaternion
		let original_p1 = node.p1.clone();
		let original_p0 = node.p0.clone();
		let newPosition = new THREE.Vector3();
		let pt = node.vel.clone();
		pt.multiplyScalar(dt);
		newPosition.addVectors(original_p1, pt);

		// console.log(dt);
		// console.log(original_p1);
		// console.log(original_p0);
		// console.log(newPosition);
		// console.log(c_velocity);
		// console.log(pt);

		// trouver les valeurs nécessaires pour calculer le quaternion et ensuite la rotation
		let a = new THREE.Vector3();
		a.subVectors(newPosition, original_p0).normalize();
		let b = new THREE.Vector3();
		b.subVectors(original_p1, original_p0).normalize();
		let aCrossB = a.clone();
		aCrossB.cross(b);
		let n = aCrossB.clone();
		n.normalize();
		let aDotB = a.dot(b);
		let angleAB = Math.atan(aCrossB.length() / aDotB);

		// console.log(aCrossB);
		// console.log(n);
		// console.log(aDotB);
		// console.log(angleAB);

		let q = new THREE.Quaternion();
		q.setFromAxisAngle(n, angleAB);

		// la matrice de rotation
		let r = new THREE.Matrix4();
		r.makeRotationFromQuaternion(q);

		// console.log(q);
		// console.log(r);


		let rotatedP1 = original_p1.clone();
		rotatedP1.applyMatrix4(r);
		let current_velocity = node.vel.clone();
		node.vel = current_velocity.applyMatrix4(r);
		

		// trouver la nouvelle position en fonction du temps
		let rotatedNewPosition = new THREE.Vector3();
		let pt2 = node.vel.clone();
		pt2.multiplyScalar(dt);
		rotatedNewPosition.addVectors(rotatedP1, pt2);

		// trouver l'angle
		let init_dir = new THREE.Vector3();
		init_dir.subVectors(original_p1, original_p0).normalize();
		
		let current_dir = new THREE.Vector3();
		current_dir.subVectors(rotatedNewPosition, original_p0).normalize();
		
		let currentCrossInit = new THREE.Vector3();
		currentCrossInit.crossVectors(current_dir, init_dir);

		let currentDotInit = current_dir.dot(init_dir);

		let n2 = currentCrossInit.clone();
		n2.normalize();
		
		let angle = Math.atan(currentCrossInit.length() / currentDotInit);
		let q1 = new THREE.Quaternion();
		q1.setFromAxisAngle(n2, angle)

		// console.log(q);
		// console.log(q1);

		let restMatrix = new THREE.Matrix4();
		restMatrix.makeRotationFromQuaternion(q1);

		//console.log(restMatrix);

		// ajouter la force de restitution
		current_velocity = node.vel.clone();
		// console.log(current_velocity);

		let restitution = current_velocity.clone();

		// console.log(restitution);
		// console.log(node.a0);
		restitution.multiply(current_velocity);
		restitution.multiplyScalar(node.a0 * 1000);
		restitution.applyMatrix4(restMatrix);

		// console.log(restitution);

		node.vel.add(restitution);

		// facteur d'amortissement
		node.vel.multiplyScalar(0.7);

		node.p1 = rotatedNewPosition.clone();

		let delta = new THREE.Vector3();
		delta.subVectors(rotatedNewPosition, original_p1);

		let transformation = new THREE.Matrix4();
		transformation.makeTranslation(delta.getComponent(0), delta.getComponent(1), delta.getComponent(2));

		console.log(node.p1);

		// Appel recursif sur les enfants
		for (var i = 0; i < node.childNode.length; i++) {
			node.childNode[i].transformation = transformation.clone();
			this.applyForces(node.childNode[i], dt, time);
		}
	}
}