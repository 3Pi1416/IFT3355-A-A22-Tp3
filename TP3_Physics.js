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

    // TODO: Projection du mouvement, force de restitution et amortissement de la velocite

    // Set the propagation rule
    if (node.parentNode !== null) {
      node.p0.applyMatrix4(node.transformation);
      node.p1.applyMatrix4(node.transformation);
    }

    let originalP0 = node.p0.clone();
    let originalP1 = node.p1.clone();
    let vDt = node.vel.clone();
    vDt.multiplyScalar(dt);
    let nonConservedP1 = new THREE.Vector3();
    nonConservedP1.addVectors(originalP1, vDt);

    // console.log(originalP0);
    // console.log(originalP1);
    // console.log(node.vel);
    // console.log(vDt);
    // console.log(nonConservedP1);

    let a = new THREE.Vector3();
    a.subVectors(originalP1, originalP0).normalize();
    let b = new THREE.Vector3();
    b.subVectors(nonConservedP1, originalP0).normalize();
    let aCrossB = a.clone();
    aCrossB.cross(b).normalize();
    let angleAB = a.angleTo(b);

    // console.log(a);
    // console.log(b);
    // console.log(angleAB);

    // le quaternion
    let q = new THREE.Quaternion();
    q.setFromAxisAngle(aCrossB, angleAB);

    // la matrice de rotation
    let r = new THREE.Matrix4();
    r.makeRotationFromQuaternion(q);

    // console.log(q);
    // console.log(r);

    let trueNewP1 = originalP1.clone();
    trueNewP1.applyMatrix4(r);

    // console.log(nonConservedP1);
    // console.log(trueNewP1);

    let projectedVelocity = new THREE.Vector3();
    projectedVelocity.subVectors(trueNewP1, originalP1);
    projectedVelocity.divideScalar(dt);

    // console.log(node.vel);
    // console.log(projectedVelocity);

    node.vel = projectedVelocity;

    let initialDirection = new THREE.Vector3();
    initialDirection.subVectors(originalP1, originalP0)
    let currentDirection = new THREE.Vector3();
    currentDirection.subVectors(trueNewP1, originalP0)
    let currentCrossInitial = new THREE.Vector3().normalize();
    currentCrossInitial.crossVectors(currentDirection, initialDirection);
    let angleCurrentInitial = initialDirection.angleTo(currentDirection);
    let angleSquared = Math.pow(angleCurrentInitial, 2);

    // console.log(initialDirection);
    // console.log(currentDirection);
    // console.log(angleCurrentInitial);
    // console.log(angleSquared)

    let q2 = new THREE.Quaternion();
    q2.setFromAxisAngle(currentCrossInitial, angleSquared);

    let r2 = new THREE.Matrix4();
    r2.makeRotationFromQuaternion(q2);

    // console.log(q2);
    // console.log(r2);

    let pT = trueNewP1.clone();
    pT.applyMatrix4(r2);

    // console.log(pT);

    let restitution = new THREE.Vector3();
    restitution.subVectors(pT, originalP0);
    let scalar = node.a0 * 1000;
    restitution.multiplyScalar(scalar);

    // console.log(node.a0);
    // console.log(restitution);
    // console.log(node.vel);

    node.vel.add(restitution);

    // facteur d'amortissement
    node.vel.multiplyScalar(0.7);

    // console.log(node.vel);

    node.p1 = trueNewP1;

    // Calculez transformation
    let delta = new THREE.Vector3();
    delta.subVectors(trueNewP1, originalP1);

    let transformation = new THREE.Matrix4();
    transformation.makeTranslation(
      delta.getComponent(0),
      delta.getComponent(1),
      delta.getComponent(2)
    );

    let originalLength = initialDirection.length();
    let newLength = currentDirection.length();
    console.log(originalLength);
    console.log(newLength);

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // // Set the propagation rule
    // if (node.parentNode !== null) {
    //   let newP0 = new THREE.Vector3();
    //   newP0 = node.parentNode.p1;
    //   //   newP0.applyMatrix4(node.transformation);
    //
    //   // Calculate the movement from node.p0 to parent.p0 to move p1 the same
    //   // oldP0 = node.p0.clone();
    //   // let movementVector = new THREE.Vector3();
    //   // movementVector = newP0.sub(oldP0);
    //   // console.log(oldP0);
    //   // console.log(newP0);
    //   // console.log(movementVector);
    //   let newP1 = new THREE.Vector3();
    //   // newP1.addVectors(node.p1.clone(), movementVector);
    //   newP1 = node.p1.clone();
    //
    //   newP1.applyMatrix4(node.transformation);
    //
    //   node.p0 = newP0.clone();
    //   node.p1 = newP1.clone();
    //   // node.p0.copy(newP0);
    //   // node.p1.copy(newP1);
    // }
    //
    // // get quaternion
    // let original_p1 = node.p1.clone();
    // let original_p0 = node.p0.clone();
    // let newPosition = new THREE.Vector3();
    // let pt = node.vel.clone();
    // pt.multiplyScalar(dt);
    // newPosition.addVectors(original_p1, pt);
    //
    //
    // // trouver les valeurs nécessaires pour calculer le quaternion et ensuite la rotation
    // let a = new THREE.Vector3();
    // a.subVectors(newPosition, original_p0).normalize();
    // let b = new THREE.Vector3();
    // b.subVectors(original_p1, original_p0).normalize();
    // let aCrossB = a.clone();
    // aCrossB.cross(b);
    // let n = aCrossB.clone();
    // n.normalize();
    // let aDotB = a.dot(b);
    // // let angleAB = Math.atan(aCrossB.length() / aDotB);
    // let angleAB = a.angleTo(b);
    //
    // // console.log(aCrossB);
    // // console.log(n);
    // // console.log(aDotB);
    // // console.log(angleAB);
    //
    // let q = new THREE.Quaternion();
    // q.setFromAxisAngle(n, angleAB);
    //
    // // la matrice de rotation
    // let r = new THREE.Matrix4();
    // r.makeRotationFromQuaternion(q);
    //
    // // console.log(q);
    // // console.log(r);
    //
    // let rotatedP1 = original_p1.clone();
    // rotatedP1.applyMatrix4(r);
    //
    // let projectedVelocity = new THREE.Vector3();
    // projectedVelocity.subVectors(rotatedP1, original_p1);
    // projectedVelocity.divideScalar(dt);
    // let current_velocity = node.vel.clone();
    // // // node.vel = current_velocity.applyMatrix4(r).multiplyScalar(dt);
    // // current_velocity.applyMatrix4(r).multiplyScalar(dt);
    //
    // let resx = -current_velocity.x;
    // let resy = -current_velocity.y;
    // let resz = -current_velocity.z;
    // node.vel = projectedVelocity;
    // // let vectGuideVelocity = new THREE.Vector3();
    // // vectGuideVelocity.set(-1, 0, 1);
    // // node.vel.multiply(vectGuideVelocity);
    //
    // // trouver la nouvelle position en fonction du temps
    // let rotatedNewPosition = new THREE.Vector3();
    // let pt2 = node.vel.clone();
    // pt2.multiplyScalar(dt);
    // rotatedNewPosition.addVectors(rotatedP1, pt2);
    // // rotatedNewPosition.multiplyVectors(rotatedP1, pt2);
    //
    // // trouver l'angle
    // let init_dir = new THREE.Vector3();
    // init_dir.subVectors(original_p1, original_p0).normalize();
    //
    // let current_dir = new THREE.Vector3();
    // current_dir.subVectors(rotatedNewPosition, original_p0).normalize();
    //
    // let currentCrossInit = new THREE.Vector3();
    // currentCrossInit.crossVectors(current_dir, init_dir).normalize();
    //
    // let currentDotInit = current_dir.dot(init_dir);
    // // let currentDotInit = current_dir.angleTo(init_dir);
    // // let currentDotInit = init_dir.angleTo(current_dir);
    //
    // let n2 = currentCrossInit.clone();
    // n2.normalize();
    //
    // //   let vectC = new THREE.Vector3();
    // // vectC.addVectors(init_dir, current_dir);
    //
    // // let angle = Math.atan(currentCrossInit.length() / currentDotInit);
    // let angle = current_dir.angleTo(init_dir);
    // // let angle = init_dir.angleTo(current_dir);
    // let q1 = new THREE.Quaternion();
    // q1.setFromAxisAngle(n2, angle);
    //
    // // console.log(q);
    // // console.log(q1);
    //
    // let restMatrix = new THREE.Matrix4();
    // restMatrix.makeRotationFromQuaternion(q1);
    //
    //
    // let restitution = new THREE.Vector3();
    // // restitution.set(Math.pow(resx, 2), 0, Math.pow(resz, 2));
    // restitution.set(Math.pow(resx, 2), Math.pow(resy, 2), Math.pow(resz, 2));
    //
    // let ammort = node.a0 * 1000;
    // restitution.multiplyScalar(ammort);
    // // restitution.applyMatrix4(restMatrix);
    // restitution.multiplyScalar(dt);
    // // console.log(restitution);
    //
    // node.vel.add(restitution);
    //
    // // facteur d'amortissement
    // node.vel.multiplyScalar(0.7);
    //
    // node.p1 = rotatedNewPosition.clone();
    //
    // let delta = new THREE.Vector3();
    // // delta.subVectors(rotatedNewPosition, original_p1);
    // delta.subVectors(rotatedP1, rotatedNewPosition);
    //
    // let transformation = new THREE.Matrix4();
    // transformation.makeTranslation(
    //     delta.getComponent(0),
    //     delta.getComponent(1),
    //     delta.getComponent(2)
    // );


    // Appel recursif sur les enfants
    for (var i = 0; i < node.childNode.length; i++) {
      node.childNode[i].transformation = transformation.clone();
      this.applyForces(node.childNode[i], dt, time);
    }
  },
}
