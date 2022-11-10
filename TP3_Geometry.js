class Node {
  constructor(parentNode) {
    this.parentNode = parentNode; //Noeud parent
    this.childNode = []; //Noeud enfants

    this.p0 = null; //Position de depart de la branche
    this.p1 = null; //Position finale de la branche

    this.a0 = null; //Rayon de la branche a p0
    this.a1 = null; //Rayon de la branche a p1

    this.sections = null; //Liste contenant une liste de points representant les segments circulaires du cylindre generalise
  }
}

TP3.Geometry = {
  simplifySkeleton: function (rootNode, rotationThreshold = 0.0001) {
    var arbrePartiel = [];
    arbrePartiel.push(rootNode);

    for (var n in arbrePartiel.length) {
      var currentNode = arbrePartiel[n];
      for (var i = 0; i < currentNode.childNode.length; i++) {
        if (currentNode.childNode.length == 1) {
          let vectP = new THREE.Vector3();
          vectP.set(
            currentNode.p1.x - currentNode.p0.x,
            currentNode.p1.y - currentNode.p0.y,
            currentNode.p1.z - currentNode.p0.z
          );
          let vectC = new THREE.Vector3();
          vectC.set(
            currentNode.childNode[0].p1.x - currentNode.childNode[0].p0.x,
            currentNode.childNode[0].p1.y - currentNode.childNode[0].p0.y,
            currentNode.childNode[0].p1.z - currentNode.childNode[0].p0.z
          );
          var findAngle = Math.deg2rad(
            math.acos(vectP.dot(vectC) / (normalize(vectP) * normalize(vectC)))
          );
          var angleCN = Math.deg2rad(
            math.acos(
              currentNode.p1.dot(currentNode.p0) /
                (normalize(currentNode.p1) * normalize(currentNode.p0))
            )
          );
          //var findAngle = math.acos(vectP.dot(vectC) / (normalize(vectP) * normalize(vectC)));
          // var findAngle = findRotation(vectP, vectC);
          if (findAngle - angleCN <= rotationThreshold) {
            currentNode.p1 = currentNode.childNode.p1;
            currentNode.a1 = currentNode.childNode.a1;
            var cc = currentNode.childNode;
            currentNode.childNode = currentNode.childNode.childNode;
            arbrePartiel.pop(cc);
          }
        }
      }
      return arbrePartiel;
    }
    // 		var arbre = [];
    // 		arbre.push(rootNode);
    // 		if (rootNode.length < 1) {
    // 			return arbre;
    // 		}
    // 		else {

    // 		// 	if (rootNode.childNode.length == 1) {
    // 		// 		let vecteurRoot = new THREE.Vector3();
    // 		// 		let vecteurChild = new THREE.Vector3();
    // 		// 		vecteurRoot.set(
    // 		// 		rootNode.p1.x - rootNode.p0.x,
    // 		// 		rootNode.p1.y - rootNode.p0.y,
    // 		// 		rootNode.p1.z - rootNode.p0.z);
    // 		// 		vecteurChild.set(rootNode.childNode.p1.x - rootNode.childNode.p0.x,
    // 		// 			rootNode.childNode.p1.y - rootNode.childNode.p0.y,
    // 		// 			rootNode.childNode.p1.z - rootNode.childNode.p0.z);
    // 				// return rootNode;
    // 		// // 		if (
    //         //   Math.deg2rad(
    //         //     math.acos(
    //         //       vecteurRoot.dot(vecteurChild) /
    //         //         (normalize(vecteurRoot) * normalize(vecteurChild))
    //         //     )
    //         //   ) <= rotationThreshold
    //         // ) {
    //         //   rootNode.childNode = (rootNode.childNode).childNode;
    // 		// 	rootNode.p1 = rootNode.childNode.p1;
    // 		// 			rootNode.a1 = rootNode.childNode.a1;
    // 		// 			return rootNode
    //         // }

    // 		if (rootNode.childNode.length == 1)  {
    // 			if (findRotation(rootNode, rootNode.childNode[0])[1] <= rotationThreshold) {
    // 				arbre[0].p1 = rootNode.childNode.p1;
    // 				arbre[0].a1 = rootNode.childNode.a1;

    // 					}
    // 				}

    // 			}
    // 		for (var i = 0; i < rootNode.childNode.length; i++){

    // }

    //}

    // var children = currentNode.childNode;
    // if (children.length == 0) {
    // 	return rootNode;
    // }

    // if (children.length == 1) {
    // 	var child = children[0];
    // 	// let angleParent = Math.atan2(rootNode.p1.x - rootNode.p0.x, rootNode.p1.y - rootNode.p0.y)
    // 	// let angleChild = Math.atan2(child.p1.x - child.p0.x, child.p1.y - child.p0.y);
    // 	// let angle = angleChild + angleParent;
    // 	// let rootX = (rootNode.p1.x - rootNode.p0.x);
    // 	// let rootY = (rootNode.p1.y - rootNode.p0.y)
    // 	// let rootZ = ()
    // 	// let angleParent = Math.atan2(rootX, rootY);
    // 	// let childX = (rootNode.p1.x - child.p0.x);
    // 	// let childY = (rootNode.p1.y - child.p0.y);
    // 	// let angleChild = Math.atan2(childX, childY);
    // 	// let angle = angleParent - angleChild;
    // 	// var angle = Math.deg(Math.acos(rootNode.p1.dot(child.p1) / (normalized(rootNode.p1)* normalize( child.p1))))
    // 	var rota = findRotation(currentNode.p1,child.p1)
    // 	if (rota[1] <= rotationThreshold) {
    // 		rootNode.childNode = child.childNode;
    // 		rootNode.p1 = child.p1;
    // 		rootNode.a1 = child.a1;
    // 		rootNode.removeChild(child);
    // 		simplifySkeleton(rootNode, rotationThreshold);
    // 		// return rootNode;
    // 	}
    // 	else {
    // 		simplifySkeleton(child, rotationThreshold);
    // 		return child
    // 	}
    // }
    // else {
    // 	for (i in children.length) {
    // 		simplifySkeleton(children[i], rotationThreshold);
    // 	}

    // }
  },

  generateSegmentsHermite: function (
    rootNode,
    lengthDivisions = 4,
    radialDivisions = 8
  ) {
    //TODO
  },

  hermite: function (h0, h1, v0, v1, t) {
    //TODO
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
    return b.clone().multiplyScalar(a.dot(b) / b.lengthSq());
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
