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

    // Propagation du mouvement du parent.

    let originalP0 = node.p0Initial.clone();
    let originalP1 = node.p1Initial.clone();
    let moveP1 = originalP1.clone().sub(originalP0).applyMatrix4(node.matrixTransformation).add(originalP0);
    node.vectorTransformationParenthood = new THREE.Matrix4();
    if (node.parentNode != null) {
      // appliquer les transformations passées 
      moveP1.applyMatrix4(node.parentNode.vectorTransformationParenthood);
      originalP0.applyMatrix4(node.parentNode.vectorTransformationParenthood);
      originalP1.applyMatrix4(node.parentNode.vectorTransformationParenthood);
    }

    //Préparer les variables pour le cacule de movement

    let movement = node.vel.clone().multiplyScalar(dt);
    //appliquer le mouvement sans conserver la longueur de la branche
    let nonConservedP1 = new THREE.Vector3().addVectors(moveP1, movement);

    // calculer l'angle causé par le mouvement
    let initialDirection = new THREE.Vector3().subVectors(moveP1, originalP0).normalize();
    let nonConservedDirection = new THREE.Vector3().subVectors(nonConservedP1, originalP0).normalize();
    let intialCrossNonConserved = initialDirection.clone().cross(nonConservedDirection).normalize();
    let angleIntialNonConserved = initialDirection.angleTo(nonConservedDirection);

    // Appliquer l'angle de rotation sur la branche initial pour garder la taille de celle-ci
    // le quaternion
    let quaternionRotation = new THREE.Quaternion().setFromAxisAngle(intialCrossNonConserved, angleIntialNonConserved);

    // la matrice de rotation
    // let matrixRotationTransformation = new THREE.Matrix4().makeRotationFromQuaternion(quaternionRotation);
    let matrixRotationTransformation = new THREE.Matrix4().makeRotationAxis(intialCrossNonConserved, angleIntialNonConserved)

    let vectorBranch = new THREE.Vector3().subVectors(originalP0, moveP1);
    let trueNewP1 = vectorBranch.clone().applyMatrix4(matrixRotationTransformation);

    trueNewP1.add(originalP0);

    // Calculer la vrai vélocité causé par l'Angle
    node.vel = new THREE.Vector3().subVectors(trueNewP1, moveP1).divideScalar(dt).add(node.vel);

    let currentDirection = new THREE.Vector3().subVectors(trueNewP1, originalP0).normalize();
    let currentCrossInitial = new THREE.Vector3().crossVectors(currentDirection, initialDirection).normalize();

    let angleCurrentInitial = initialDirection.angleTo(currentDirection);
    let angleSquared = Math.pow(angleCurrentInitial, 2) ;



    quaternionRotation = new THREE.Quaternion().setFromAxisAngle(currentCrossInitial, -angleSquared);
    // let matrixRotation = new THREE.Matrix4().makeRotationFromQuaternion(quaternionRotation);
    let matrixRotation = new THREE.Matrix4().makeRotationAxis(currentCrossInitial, -angleSquared);


    let restitutionVectorBranch = new THREE.Vector3().subVectors(originalP0, trueNewP1);
    let restitutionPoint = restitutionVectorBranch.clone().applyMatrix4(matrixRotation);
    restitutionPoint.add(originalP0);


    let restitution = new THREE.Vector3().subVectors(restitutionPoint, originalP1);
    let scalar = node.a0 * 1000;
    restitution.multiplyScalar(scalar).divideScalar(dt)

    node.vel.add(restitution);

    // facteur d'amortissement
    node.vel.multiplyScalar(0.7);

    node.matrixTransformation = matrixRotationTransformation.clone();
    let TotalMovement = new THREE.Vector3().subVectors(trueNewP1, node.p1Initial);
    node.vectorTransformationParenthood = new THREE.Matrix4().makeTranslation(TotalMovement.x, TotalMovement.y, TotalMovement.z);


    node.p0 = originalP0.clone();
    node.p1 = trueNewP1.clone();


    // Appel recursif sur les enfants
    node.childNode.forEach(childNode => {
      this.applyForces(childNode, dt, time);
    });
  },
}
