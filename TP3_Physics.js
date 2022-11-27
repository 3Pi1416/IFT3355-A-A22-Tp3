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

		// get quaternion
		let c_velocity = node.vel.clone();
		let original_p1 = node.p1.clone();
		let original_p0 = node.p0.clone();
		let newPosition = new THREE.Vector3();
		let pt = node.vel.clone();
		pt.multiplyScalar(dt);
		newPosition.addVectors(original_p1, c_velocity.multiplyScalar(dt));

		console.log(dt);
		console.log(original_p1);
		console.log(original_p0);
		console.log(newPosition);
		console.log(c_velocity);
		console.log(pt);


		// let a = newPosition.sub(original_p0).normalize();
		// let b = original_p1.sub(original_p0).normalize();
		// let aCrossB = a.cross(b).normalize();
		// let q = new THREE.Quaternion(1, 1, 1, 1);
		//
		// // console.log(a);
		// // console.log(b);
		//
		// // cas où les vecteurs sont dans direction opposé
		// if (a.equals(-b)) {
		// 	q.setFromAxisAngle(aCrossB, 0);
		// }
		//
		// let half = a.add(b).normalize();
		// let aCrossHalf = a.cross(half);
		// let s = a.dot(half);
		// q.setFromAxisAngle(aCrossHalf, s);
		//
		// let r = new THREE.Matrix4();
		// r.makeRotationFromQuaternion(q);
		//
		// //console.log(r);
		//
		// node.rotation= r.clone();
		//
		// let rotatedP1 = r.scale(original_p1);
		// let current_velocity = node.vel.clone();
		// node.vel = current_velocity.applyMatrix4(r);
		//
		// // calculer angle entre direction initiale et direction courrante
		// let init_dir = new THREE.Vector3();
		// init_dir.subVectors(original_p1, original_p0);
		//
		// let current_dir = new THREE.Vector3();
		// current_dir.subVectors(rotatedP1, original_p0);
		// let cross = init_dir.cross(current_dir);
		// let angle = Math.asin(cross.length() / (init_dir.length() * current_dir.length()));
		//
		// current_velocity = node.vel.clone();
		// let restitution = current_velocity.multiply(current_velocity).multiplyScalar(-1);



		//node.p1 = rotatedP1.clone();
		// Appel recursif sur les enfants
		for (var i = 0; i < node.childNode.length; i++) {
			//node.childNode[i].p0 = rotatedP1.clone();
			this.applyForces(node.childNode[i], dt, time);
		}
	}
}