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
    node.vel.add(
      new THREE.Vector3(
        u / Math.sqrt(node.mass),
        0,
        v / Math.sqrt(node.mass)
      ).multiplyScalar(dt)
    );

    // Ajouter la gravite
    node.vel.add(new THREE.Vector3(0, -node.mass, 0).multiplyScalar(dt));
    // node.vel.add(new THREE.Vector3(0, 0, 0).multiplyScalar(dt));

    // TODO: Projection du mouvement, force de restitution et amortissement de la velocite

    // Propagation du mouvement du parent.
    let originalP0 = node.p0Initial.clone();
    let originalP1 = node.p1Initial.clone();

    if (node.parentNode != null) {
      // Si le noeud à un parent, alors sa position p0 initial sera la position final du parent.
      originalP0 = node.parentNode.p1.clone();
      // originalP1.multiply(node.parentNode.transformationParenthood);
      // originalP0.add(node.parentNode.transformationParenthood);
      originalP1.add(node.parentNode.transformationParenthood);
    }

    // appliquer les transformations passées
    let moveP1 = originalP1.clone();
    // moveP1.multiply(node.transformation);

    //Préparer les variables pour le cacule de movement
    let movement = node.vel.clone();

    //appliquer le mouvement sans conserver la longueur de la branche
    let nonConservedP1 = new THREE.Vector3().subVectors(moveP1, movement);
    // let nonConservedP1 = new THREE.Vector3().multiply(moveP1, movement);

    //Comme le mouvement varie dans le temps, on aplique la variable dt
    // nonConservedP1.multiplyScalar(dt);
    // La force de rappel est comme une force de springs f = -k(distance)
    // frequence = (1/2 pi)*sqrt(k/m)
    var k = (node.a0 * 1000) * -1;
    var distance = new THREE.Vector3()
      .addVectors(nonConservedP1, moveP1)
      .normalize();
    distance.multiplyScalar(dt);
    // let rx = k * distance.x;
    // let ry = -1 * node.vel.y;
    // let rz = k * distance.z;
    let restitution = new THREE.Vector3();
    restitution.set(1, 1, 1);
    restitution.multiply(distance.multiplyScalar(k));
    node.vel.add(restitution);

    // calculer l'angle causé par le mouvement
    let initialDirection = new THREE.Vector3()
      .subVectors(originalP1, originalP0);
    let nonConservedDirection = new THREE.Vector3()
      .subVectors(nonConservedP1, originalP0);

    // InitialCrossNonConserved correspond au deplacement entre le vecteur InitialDirection et nonConservedDirection.
    //  Afin de trouver le vecteur qui part de l'extrémiter du vecteur int.. ver nonCons... on utilise les propriétés
    // de l'addition de vecteur (Vec A + Vect B =  A vers B-> incorrect ici car un ne pointe pas ver l'autre
    //  -A + B = vecteur entre init. et nonC. )
    // let intialCrossNonConserved = new THREE.Vector3().addVectors(initialDirection.multiplyScalar(-1), nonConservedDirection).normalize();
    let intialCrossNonConserved = new THREE.Vector3()
      .addVectors(initialDirection, nonConservedDirection)
      .normalize();
    // let intialCrossNonConserved = initialDirection.clone().cross(nonConservedP1).normalize();
    let angleIntialNonConserved = intialCrossNonConserved.angleTo(
      nonConservedDirection
    );

    // Appliquer l'angle de rotation sur la branche initial pour garder la taille de celle-ci
    // le quaternion
    let quaternionRotation = new THREE.Quaternion().setFromAxisAngle(
      intialCrossNonConserved,
      angleIntialNonConserved
    );

    // la matrice de rotation
    let matrixRotation = new THREE.Matrix4().makeRotationFromQuaternion(
      quaternionRotation
    );

    vectorBranch = new THREE.Vector3().subVectors(originalP1, originalP0);
    
    let trueNewP1 = vectorBranch.clone().applyMatrix4(matrixRotation);
    // trueNewP1.add(originalP0);

    // Ici vous overwritez la velocité?
    // Calculer la vrai vélocité causé par l'Angle
    // node.vel = new THREE.Vector3().subVectors(trueNewP1, moveP1);
    // On veut ajouter a la velocité
    // node.vel.subVectors(trueNewP1, moveP1).multiplyScalar(dt);
    // let newVel = new THREE.Vector3().subVectors(moveP1, trueNewP1);
    //  let newVel = new THREE.Vector3().subVectors(trueNewP1, moveP1).normalize();
    // let current_velocity = node.vel.clone();
    // // console.log(current_velocity);

    // //let restitution = current_velocity.clone();
    // let resx = -current_velocity.x;
    // let resy = current_velocity.y;
    // let resz = -current_velocity.z;

    // let restitution = new THREE.Vector3();
    // restitution.set(Math.pow(resx, 2), Math.pow(resy, 2), Math.pow(resz, 2));
    // restitution.multiplyScalar(dt);
    // let ammort = node.a0 * 1000;
    // restitution.multiplyScalar(ammort);

    // // La force de rappel est comme une force de springs f = -k(distance)
    // // frequence = (1/2 pi)*sqrt(k/m)
    // var k = (node.a0 * 1000)* -1;
    // var distance = new THREE.Vector3().subVectors(trueNewP1, originalP1);
    // distance.multiplyScalar(dt);
    // let restitution = new THREE.Vector3();
    // restitution.multiply(distance.multiplyScalar(k));
    // node.vel.add(restitution);

    // let newVel = new THREE.Vector3().addVectors(node.vel,restitution);

    // node.vel.add(newVel.multiplyScalar(dt));
  
    // let currentDirection = new THREE.Vector3().subVectors(dirDuRetour, originalP0).normalize();
    // // let currentDirection = trueNewP1.clone();
    // let currentCrossInitial = new THREE.Vector3().subVectors(currentDirection, initialDirection).normalize();

    // let angleCurrentInitial = currentCrossInitial.angleTo(initialDirection);
    // let angleSquared = Math.pow(angleCurrentInitial, 2);

    // // peut besoin de prendre l'angle en %, sinon problème quand l'angle > 1

    // // let q2 = new THREE.Quaternion().setFromAxisAngle(currentCrossInitial, angleSquared);
    // let q2 = new THREE.Quaternion().setFromAxisAngle(
    //   currentDirection,
    //   angleSquared
    // );
    // let r2 = new THREE.Matrix4().makeRotationFromQuaternion(q2);
    // let pT = trueNewP1.clone().applyMatrix4(r2);
    // pT.add(originalP0);

    // let restitution = new THREE.Vector3().subVectors(pT, trueNewP1);
    // let scalar = node.a0 * 1000;
    // restitution.multiplyScalar(scalar);

    // node.vel.add(restitution);
    // node.vel = newVel.clone();

    // facteur d'amortissement
    node.vel.multiplyScalar(0.7);

    node.transformation = node.vel.clone().multiplyScalar(dt);
    node.transformationParenthood = node.transformation.clone();

    node.p1 = node.p1Initial.clone().add(node.transformation);
    node.p0 = originalP0;
    

    
    // Appel recursif sur les enfants
    node.childNode.forEach((childNode) => {
      this.applyForces(childNode, dt, time);
    });
  },
}
