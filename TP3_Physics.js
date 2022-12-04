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

    // node.vel.add(new THREE.Vector3(isPositive * 20 / dt, 0, 0).multiplyScalar(dt));

    node.isPositive = node.isPositive - 1;
    if (node.isPositive <= 0) {
      node.isPositive = node.beginn
    }
    // TODO: Projection du mouvement, force de restitution et amortissement de la velocite


    let parentNode = node.parentNode;
    let originalP0 = node.p0Initial.clone();
    let originalP1 = node.p1Initial.clone();
    //propagation 
    while (parentNode != null) {
      originalP0.sub(parentNode.p0Initial).applyAxisAngle(parentNode.matrixTransformation[0], parentNode.matrixTransformation[1]).add(parentNode.p0Initial);
      originalP1.sub(parentNode.p0Initial).applyAxisAngle(parentNode.matrixTransformation[0], parentNode.matrixTransformation[1]).add(parentNode.p0Initial);
      parentNode = parentNode.parentNode;
    }


    let moveP1 = originalP1.clone().sub(node.p0Initial).applyAxisAngle(node.matrixTransformation[0], node.matrixTransformation[1]).add(node.p0Initial);

    //Préparer les variables pour le cacule de movement
    let movement = node.vel.clone().multiplyScalar(dt);

    //appliquer le mouvement sans conserver la longueur de la branche
    let nonConservedP1 = new THREE.Vector3().addVectors(moveP1, movement);

    // calculer l'angle causé par le mouvement
    let initialDirection = new THREE.Vector3().subVectors(originalP1, originalP0).normalize();
    let nonConservedDirection = new THREE.Vector3().subVectors(nonConservedP1, originalP0).normalize();

    //calculer l'effet de la branche 
    let angle;
    let axis;
    [axis, angle] = TP3.Geometry.findRotation(initialDirection, nonConservedDirection);

    node.p1 = originalP1.clone().sub(originalP0).applyAxisAngle(axis, angle).add(originalP0);

    // Calculer la vrai vélocité causé par l'Angle
    node.vel = new THREE.Vector3().subVectors(node.p1, moveP1).divideScalar(dt);

    let temps = node.p1.clone().sub(originalP0);
    [axis, angle] = TP3.Geometry.findRotation(new THREE.Vector3().subVectors(originalP1, originalP0), temps);
    node.matrixTransformation = [axis, angle];

    //appliquer la restition
    //trouve le vecteur temporaire 
    temps.applyAxisAngle(axis, Math.pow(angle, 2));

    let restitution = new THREE.Vector3().subVectors(new THREE.Vector3().subVectors(node.p1, originalP0), temps).divideScalar(dt);
    let scalar = node.a0 * 1000;
    restitution.multiplyScalar(scalar);

    node.vel.add(restitution);

    // facteur d'amortissement
    node.vel.multiplyScalar(0.7);

    //mettre à jours p0 avec les information qu'on avait calculer selon les nodes parent
    node.p0 = originalP0.clone();

    // Appel recursif sur les enfants
    node.childNode.forEach(childNode => {
      this.applyForces(childNode, dt, time);
    });


  },
}
