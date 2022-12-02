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
    // node.vel.add(new THREE.Vector3(u / Math.sqrt(node.mass), 0, v / Math.sqrt(node.mass)).multiplyScalar(dt));

    // Ajouter la gravite
    node.vel.add(new THREE.Vector3(0, -node.mass, 0).multiplyScalar(dt));


    // TODO: Projection du mouvement, force de restitution et amortissement de la velocite

    // Propagation du mouvement du parent.
    let originalP0 = node.p0Initial.clone();
    let originalP1 = node.p1Initial.clone();
    if (node.parentNode != null) {
      originalP0.add(node.parentNode.transformationParenthood);
      originalP1.add(node.parentNode.transformationParenthood);
    }

    // appliquer les transformations passées 
    let moveP1 = originalP1.clone();
    moveP1.add(node.transformation);


    //Préparer les variables pour le cacule de movement

    let movement = node.vel.clone().multiplyScalar(dt);
    //appliquer le mouvement sans conserver la longueur de la branche
    let nonConservedP1 = new THREE.Vector3().addVectors(moveP1, movement);

    // calculer l'angle causé par le mouvement
    let initialDirection = new THREE.Vector3().subVectors(originalP1, originalP0).normalize();
    let nonConservedDirection = new THREE.Vector3().subVectors(nonConservedP1, originalP0).normalize();
    let intialCrossNonConserved = initialDirection.clone().cross(nonConservedDirection).normalize();
    let angleIntialNonConserved = initialDirection.angleTo(nonConservedDirection);

    if( angleCurrentInitial == 0 ){
      console.log(angleCurrentInitial)
    }


    // Appliquer l'angle de rotation sur la branche initial pour garder la taille de celle-ci
    // le quaternion
    let quaternionRotation = new THREE.Quaternion().setFromAxisAngle(intialCrossNonConserved, angleIntialNonConserved);

    // la matrice de rotation
    let matrixRotation = new THREE.Matrix4().makeRotationFromQuaternion(quaternionRotation);

    let vectorBranch = new THREE.Vector3().subVectors(originalP1, originalP0)
    let trueNewP1 = vectorBranch.clone().applyMatrix4(matrixRotation);
    trueNewP1.add(originalP0);

    // Calculer la vrai vélocité causé par l'Angle
    node.vel = new THREE.Vector3().subVectors(trueNewP1, moveP1).add(node.vel);

    let currentDirection = new THREE.Vector3().subVectors(trueNewP1, originalP0).normalize();
    let currentCrossInitial = new THREE.Vector3().crossVectors(currentDirection, initialDirection);
    let angleCurrentInitial = initialDirection.angleTo(currentDirection);
    //Met en % car un angle plus grand que 1 au carré pourrait causé problème
    if (Math.abs(angleCurrentInitial) > 1) {
      console.log(angleCurrentInitial)
    }
    let angleSquared = Math.pow(angleCurrentInitial, 2);


    // peut besoin de prendre l'angle en %, sinon problème quand l'angle > 1 


    let q2 = new THREE.Quaternion().setFromAxisAngle(currentCrossInitial, angleSquared);
    let r2 = new THREE.Matrix4().makeRotationFromQuaternion(q2);
    let pT = vectorBranch.clone().applyMatrix4(r2);
    pT.add(originalP0);


    let restitution = new THREE.Vector3().subVectors(pT, trueNewP1);
    let scalar = node.a0 * 1000;
    restitution.multiplyScalar(scalar);

    node.vel.add(restitution);

    // facteur d'amortissement
    node.vel.multiplyScalar(0.7);

    node.transformation = node.transformation.add(node.vel.clone().multiplyScalar(dt));
    node.transformationParenthood = node.transformation.clone();

    node.p1 = originalP1.clone().add(node.transformation);
    node.p0 = originalP0;
    if (node.parentNode != null) {
      node.transformationParenthood.add(node.parentNode.transformationParenthood)
      node.p1.add(node.parentNode.transformationParenthood);
      node.p0.add(node.parentNode.transformationParenthood);
    }


    // Appel recursif sur les enfants
    node.childNode.forEach(childNode => {
      this.applyForces(childNode, dt, time);
    });
  },
}
