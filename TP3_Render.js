TP3.Render = {
	drawTreeRough: function (rootNode, scene, alpha, radialDivisions = 8, leavesCutoff = 0.1, leavesDensity = 10, applesProbability = 0.05, matrix = new THREE.Matrix4()) {

		//créer une branche 
		let distanceBranch = rootNode.p1.distanceTo(rootNode.p0);
		let cylinders = new THREE.CylinderBufferGeometry(rootNode.a1, rootNode.a0, distanceBranch, 32);


		//calculer les angles pour la rotation des branche 
		let vectorBranch = new THREE.Vector3();
		vectorBranch.subVectors(rootNode.p1, rootNode.p0);
		let rho = Math.PI / 2 - Math.asin(vectorBranch.y / distanceBranch);
		let teta = Math.atan2(vectorBranch.x, vectorBranch.z);

		//Lorsqu'On fait un demi tour, on regarde de l'autre côté parce que la fonciton tan ne fais pas de différence avec ou est le négatif 
		if (vectorBranch.z < 0) {
			rho = rho - 2 * Math.PI;
		}
		if (vectorBranch.x < 0) {
			teta = teta - 2 * Math.PI;
		}

		//appliquer la rotation a des matrice 
		let matrixRotationX = new THREE.Matrix4().makeRotationX(rho);
		let matrixRotationY = new THREE.Matrix4().makeRotationY(teta);
		let matrixRotationBase = new THREE.Matrix4().multiplyMatrices(matrixRotationY, matrixRotationX);

		// movement pour centrer le cylindre 
		let matrixTranslation = new THREE.Matrix4().makeTranslation(0, distanceBranch / 2, 0);
		let matrixBasicMovement = new THREE.Matrix4().multiplyMatrices(matrixRotationBase, matrixTranslation);
		// movement par rapport à l'arbre
		let matrixTranslationP0 = new THREE.Matrix4().makeTranslation(rootNode.p0.x, rootNode.p0.y, rootNode.p0.z)
		let test = new THREE.Matrix4().multiplyMatrices(matrixTranslationP0, matrixBasicMovement);

		// matrixTransformation.multiply(matrixBasicMovement)
		cylinders.applyMatrix4(test);

		//initaliser les buffer 
		let geometryApple = null;
		let squares = null;
		if (rootNode.childNode.length != 0) {
			let isfirstChild = true
			rootNode.childNode.forEach(child => {

				let output = this.drawTreeRough(child, scene, alpha, radialDivisions, leavesCutoff, leavesDensity, applesProbability, matrix);
				//joindre les geometry
				cylinders = THREE.BufferGeometryUtils.mergeBufferGeometries([cylinders, output[0]], true);

				if (isfirstChild) {
					isfirstChild = false;
					squares = output[1];
				} else {
					squares = THREE.BufferGeometryUtils.mergeBufferGeometries([squares, output[1]], true);
				}

			});
		}

		let hasLeaves = rootNode.a0 < alpha * leavesCutoff;
		if (hasLeaves) {

			if (rootNode.childNode.length == 0) {

				for (let i = 0; i < leavesDensity; i++) {
					//créer un carré pour la feuille  feuille
					let square = new THREE.PlaneBufferGeometry(alpha, alpha);

					// préparer un mouvement et rotation aléatoire a celle-ci
					let randomForAngle = Math.random() * 2 * Math.PI;
					let randomForAngle2 = Math.random() * 2 * Math.PI;
					let randomForPosition = Math.random() * (distanceBranch + alpha);
					let randomForDistanceFromBranch = (Math.random() - 0.5) * alpha;
					//appliquer les rotations et la translation
					let matrixRotationLeaf = new THREE.Matrix4().makeRotationX(randomForAngle2);
					let matrixTransformationLeaf = new THREE.Matrix4().multiplyMatrices(matrixTranslationP0, matrixRotationLeaf);
					matrixRotationLeaf.makeRotationY(randomForAngle);
					matrixTransformationLeaf.multiply(matrixRotationLeaf);
					matrixRotationLeaf.makeTranslation(randomForDistanceFromBranch, randomForPosition + alpha / 2, 0);
					matrixTransformationLeaf.multiply(matrixRotationLeaf);

					//appliquer la transformation complète de la feuille
					square.applyMatrix4(matrixTransformationLeaf);

					//joindre les mesh
					if (squares == null) {
						squares = square;
					} else {
						squares = THREE.BufferGeometryUtils.mergeBufferGeometries([squares, square], true);
					}

				}

			} else {

				for (let i = 0; i < leavesDensity; i++) {
					let square = new THREE.PlaneBufferGeometry(alpha, alpha);
					// préparer un mouvement et rotation aléatoire a celle-ci
					let randomForAngle = Math.random() * 2 * Math.PI;
					let randomForAngle2 = Math.random() * 2 * Math.PI;
					let randomForPosition = Math.random() * distanceBranch;
					let randomForDistanceFromBranch = (Math.random() - 0.5) * alpha;
					//appliquer les rotations et la translation
					let matrixRotationLeaf = new THREE.Matrix4().makeRotationX(randomForAngle2);
					let matrixTransformationLeaf = new THREE.Matrix4().multiplyMatrices(matrixTranslationP0, matrixRotationLeaf);
					matrixRotationLeaf.makeRotationY(randomForAngle);
					matrixTransformationLeaf.multiply(matrixRotationLeaf);
					matrixRotationLeaf.makeTranslation(randomForDistanceFromBranch, randomForPosition + alpha / 2, 0);
					matrixTransformationLeaf.multiply(matrixRotationLeaf);
					//appliquer la transformation de la branche
					square.applyMatrix4(matrixTransformationLeaf);
					//joindre les mesh
					if (i == null) {
						squares = square;
					} else {
						squares = THREE.BufferGeometryUtils.mergeBufferGeometries([squares, square], true);
					}
				}

			}


			// simuler la probabilité d'une pomme  et la créer si besoin
			let haveApple = Math.random() <= applesProbability;
			if (haveApple) {
				geometryApple = new THREE.BoxGeometry(alpha, alpha, alpha);
				let matrixTranslationP1 = new THREE.Matrix4().makeTranslation(rootNode.p1.x, rootNode.p1.y, rootNode.p1.z);
				geometryApple.applyMatrix4(matrixTranslationP1);
				let apple = new THREE.Mesh(geometryApple, new THREE.MeshPhongMaterial({ color: 0x5F0B0B }));
				scene.add(apple);


			}
		}

		//le tronc d'arbre termine en ajoutant sur la  scene 
		if (rootNode.parentNode == null) {
			let branches = new THREE.Mesh(cylinders, new THREE.MeshLambertMaterial({ color: 0x8B5A2B }));
			branches.castShadow = true;
			scene.add(branches);

			let leaves = new THREE.Mesh(squares, new THREE.MeshPhongMaterial({ color: 0x3A5F0B }));
			leaves.castShadow = true;
			scene.add(leaves);
		}

		return [cylinders, squares, geometryApple]
	},

	drawTreeHermite: function (rootNode, scene, alpha, leavesCutoff = 0.1, leavesDensity = 10, applesProbability = 0.05, matrix = new THREE.Matrix4()) {

		let vertices = [];
		let facesIdx = [];

		let number = 0;

		//créer les branches enfant 
		let apples = null;
		let leaves = null;
		let branches = null;
		if (rootNode.childNode.length != 0) {
			let isfirstChild = true
			rootNode.childNode.forEach(child => {

				child.endArrayBranches = rootNode.endArrayBranches;
				child.endArrayleaves = rootNode.endArrayleaves;
				child.endArrayApples = rootNode.endArrayApples;

				let output = this.drawTreeHermite(child, scene, alpha, leavesCutoff, leavesDensity, applesProbability, matrix);
				rootNode.endArrayBranches = child.endArrayBranches;
				rootNode.endArrayleaves = child.endArrayleaves;
				rootNode.endArrayApples = child.endArrayApples;
				//joindre les geometry
				if (isfirstChild) {
					isfirstChild = false;
					branches = output[0]
					leaves = output[1];
					apples = output[2];
				} else {
					branches = THREE.BufferGeometryUtils.mergeBufferGeometries([branches, output[0]], true);
					leaves = THREE.BufferGeometryUtils.mergeBufferGeometries([leaves, output[1]], true);

					if (apples != null && output[2] != null) {
						apples = THREE.BufferGeometryUtils.mergeBufferGeometries([apples, output[2]], true);
					} else if (output[2] != null) {
						apples = output[2];
					}
				}
			});
		}

		if (rootNode.endArrayBranches == -1) {
			//cas ou bout d'une branche
			rootNode.beginningArrayBranches = rootNode.parentNode.endArrayBranches + 1;
			rootNode.endArrayBranches = rootNode.parentNode.endArrayBranches;
		} else {
			// branche parrent avec enfant visités
			rootNode.beginningArrayBranches = rootNode.endArrayBranches + 1;
		}

		//creer les branche avec des mesh
		for (let i = 0; i < rootNode.sections.length - 1; i++) {
			let j;
			for (j = 0; j < rootNode.sections[i].length - 1; j++) {
				rootNode.endArrayBranches = rootNode.endArrayBranches + 6;
				facesIdx.push(number, number + 1, number + 2, number + 3, number + 4, number + 5);

				// 2 triangle a partir de 4 vertex 
				vertices.push(rootNode.sections[i][j].x, rootNode.sections[i][j].y, rootNode.sections[i][j].z);
				vertices.push(rootNode.sections[i + 1][j].x, rootNode.sections[i + 1][j].y, rootNode.sections[i + 1][j].z);
				vertices.push(rootNode.sections[i][j + 1].x, rootNode.sections[i][j + 1].y, rootNode.sections[i][j + 1].z);

				vertices.push(rootNode.sections[i][j + 1].x, rootNode.sections[i][j + 1].y, rootNode.sections[i][j + 1].z);
				vertices.push(rootNode.sections[i + 1][j].x, rootNode.sections[i + 1][j].y, rootNode.sections[i + 1][j].z);
				vertices.push(rootNode.sections[i + 1][j + 1].x, rootNode.sections[i + 1][j + 1].y, rootNode.sections[i + 1][j + 1].z);
				number = number + 6;
			}

		}

		let newbranches = new THREE.BufferGeometry();
		let f32vertices = new Float32Array(vertices);
		newbranches.setAttribute("position", new THREE.BufferAttribute(f32vertices, 3));
		newbranches.setIndex(facesIdx);
		newbranches.computeVertexNormals();
		if (branches == null) {
			branches = newbranches;
		} else {
			branches = THREE.BufferGeometryUtils.mergeBufferGeometries([branches, newbranches], true);
		}

		vertices = [];
		facesIdx = [];
		let angle = Math.cos(Math.PI / 4)
		let distanceBranch
		let hasLeaves = rootNode.a0 < alpha * leavesCutoff;

		if (rootNode.endArrayleaves == -1) {
			//cas ou bout d'une branche
			rootNode.beginningArrayleaves = rootNode.parentNode.endArrayleaves + 1;
			rootNode.endArrayleaves = rootNode.parentNode.endArrayleaves;
		} else {
			// branche parrent avec enfant visités
			rootNode.beginningArrayleaves = rootNode.endArrayleaves + 1;
		}

		if (rootNode.endArrayApples == -1) {
			//cas ou bout d'une branche
			rootNode.beginningArrayApples = rootNode.parentNode.endArrayApples + 1;
			rootNode.endArrayApples = rootNode.parentNode.endArrayApples;
		} else {
			// branche parrent avec enfant visités
			rootNode.beginningArrayApples = rootNode.endArrayApples + 1;
		}

		if (hasLeaves) {
			//creer les feuilles 
			if (rootNode.childNode.length == 0) {

				for (let i = 0; i < leavesDensity; i++) {
					rootNode.endArrayleaves = rootNode.endArrayleaves + 3;

					facesIdx.push((i * 3), (i * 3) + 1, (i * 3) + 2)
					// préparer un mouvement et rotation aléatoire a celle-ci
					let randomPart = Math.floor(Math.random() * (rootNode.points.length - 1))
					let pointSegment0 = rootNode.points[randomPart];
					let pointSegment1 = rootNode.points[randomPart + 1];
					distanceBranch = pointSegment1.distanceTo(pointSegment0);
					let randomForAngle = Math.random() * 2 * Math.PI;
					let randomForAngle2 = Math.random() * 2 * Math.PI;
					let randomForPosition = Math.random() * (distanceBranch + alpha);
					let randomForDistanceFromBranch = (Math.random() - 0.5) * alpha;
					//appliquer les rotations et la translation
					let matrixTranslation = new THREE.Matrix4().makeTranslation(pointSegment0.x, pointSegment0.y, pointSegment0.z)
					let matrixRotation = new THREE.Matrix4().makeRotationX(randomForAngle2);
					let matrixTransformationLeaf = new THREE.Matrix4().multiplyMatrices(matrixTranslation, matrixRotation);
					matrixRotation.makeRotationY(randomForAngle);
					matrixTransformationLeaf.multiply(matrixRotation);
					matrixRotation.makeTranslation(randomForDistanceFromBranch, randomForPosition + alpha / 2, 0);
					matrixTransformationLeaf.multiply(matrixRotation);
					//appliquer la transformation de la branche
					let point1 = new THREE.Vector3(0, 0, 0)
					let point2 = new THREE.Vector3(alpha, 0, 0);
					let point3 = new THREE.Vector3(alpha / 2, angle * alpha, 0);

					point1.applyMatrix4(matrixTransformationLeaf)
					point2.applyMatrix4(matrixTransformationLeaf)
					point3.applyMatrix4(matrixTransformationLeaf)
					vertices.push(point1.x, point1.y, point1.z)
					vertices.push(point2.x, point2.y, point2.z)
					vertices.push(point3.x, point3.y, point3.z)

				}

			} else {

				for (let i = 0; i < leavesDensity; i++) {
					rootNode.endArrayleaves = rootNode.endArrayleaves + 3;
					facesIdx.push((i * 3), (i * 3) + 1, (i * 3) + 2)
					// préparer un mouvement et rotation aléatoire a celle-ci
					let randomPart = Math.floor(Math.random() * (rootNode.points.length - 1))
					let pointSegment0 = rootNode.points[randomPart];
					let pointSegment1 = rootNode.points[randomPart + 1];
					distanceBranch = pointSegment1.distanceTo(pointSegment0);
					//appliquer les rotations et la translation
					let matrixTranslation = new THREE.Matrix4().makeTranslation(pointSegment0.x, pointSegment0.y, pointSegment0.z)
					let randomForAngle = Math.random() * 2 * Math.PI;
					let randomForAngle2 = Math.random() * 2 * Math.PI;
					let randomForPosition = Math.random() * distanceBranch;
					let randomForDistanceFromBranch = (Math.random() - 0.5) * alpha;
					let matrixTemp = new THREE.Matrix4();
					matrixTemp.makeRotationX(randomForAngle2);
					let matrixTransformationLeaf = new THREE.Matrix4().multiplyMatrices(matrixTranslation, matrixTemp);
					matrixTemp.makeRotationY(randomForAngle);
					matrixTransformationLeaf.multiply(matrixTemp);
					matrixTemp.makeTranslation(randomForDistanceFromBranch, randomForPosition + alpha / 2, 0);
					matrixTransformationLeaf.multiply(matrixTemp);
					//appliquer la transformation de la branche
					//feuille hauteur alpha et base alpha 
					let pointLeaf1 = new THREE.Vector3(0, 0, 0)
					let pointLeaf2 = new THREE.Vector3(alpha, 0, 0);
					let pointLeaf3 = new THREE.Vector3(alpha / 2, alpha * Math.sqrt(3) / 2, 0);
					pointLeaf1.applyMatrix4(matrixTransformationLeaf)
					pointLeaf2.applyMatrix4(matrixTransformationLeaf)
					pointLeaf3.applyMatrix4(matrixTransformationLeaf)
					vertices.push(pointLeaf1.x, pointLeaf1.y, pointLeaf1.z)
					vertices.push(pointLeaf2.x, pointLeaf2.y, pointLeaf2.z)
					vertices.push(pointLeaf3.x, pointLeaf3.y, pointLeaf3.z)
				}


			}
			f32vertices = new Float32Array(vertices);
			let newLeaves = new THREE.BufferGeometry();
			newLeaves.setAttribute("position", new THREE.BufferAttribute(f32vertices, 3));
			newLeaves.setIndex(facesIdx);
			newLeaves.computeVertexNormals();

			if (leaves == null) {
				leaves = newLeaves;
			} else {
				leaves = THREE.BufferGeometryUtils.mergeBufferGeometries([leaves, newLeaves], true);
			}

			// simuler la probabilité d'une pomme  et la créer si besoin
			let hasApple = Math.random() <= applesProbability;
			if (hasApple) {
				;
				rootNode.appleIndices = true;
				let apple = new THREE.SphereBufferGeometry(alpha / 2, 32, 32);
				let matrixTranslationP1 = new THREE.Matrix4().makeTranslation(rootNode.p1.x, rootNode.p1.y - alpha / 2, rootNode.p1.z);
				apple.applyMatrix4(matrixTranslationP1);

				if (apples == null) {
					apples = apple;
				} else {
					apples = THREE.BufferGeometryUtils.mergeBufferGeometries([apples, apple], true);
				}

				//uv count pour avoir le nombre de vertex 
				rootNode.endArrayApples = rootNode.endArrayApples + apple.getAttribute("uv").count;
			}
		}

		//le tronc d'arbre termine en ajoutant sur la  scene 
		if (rootNode.parentNode == null) {

			let branchesMesh = new THREE.Mesh(branches, new THREE.MeshLambertMaterial({ color: 0x8B5A2B }));
			branchesMesh.castShadow = true;
			scene.add(branchesMesh);

			let leavesMesh = new THREE.Mesh(leaves, new THREE.MeshPhongMaterial({ color: 0x3A5F0B }));
			leavesMesh.castShadow = true;
			scene.add(leavesMesh);

			let applesMesh = new THREE.Mesh(apples, new THREE.MeshPhongMaterial({ color: 0x5F0B0B }));
			branchesMesh.castShadow = true;
			scene.add(applesMesh);
		}

		return [branches, leaves, apples]
	},

	updateTreeHermite: function (trunkGeometryBuffer, leavesGeometryBuffer, applesGeometryBuffer, rootNode) {

		if (rootNode.endArrayBranches > -1) {
			for (let point = rootNode.beginningArrayBranches; point <= rootNode.endArrayBranches; point++) {

				let tempVector = new THREE.Vector3(
					trunkGeometryBuffer[point * 3],
					trunkGeometryBuffer[point * 3 + 1],
					trunkGeometryBuffer[point * 3 + 2]);

				let parentNode = rootNode.parentNode;
				// while (parentNode != null) {
				// 	tempVector.sub(parentNode.oldP0).applyAxisAngle(parentNode.matrixTransformationUpdate[0], parentNode.matrixTransformationUpdate[1]).add(parentNode.p0);
				// 	parentNode = parentNode.parentNode;
				// }
				tempVector.sub(rootNode.oldP0).applyAxisAngle(rootNode.matrixTransformationUpdate[0], rootNode.matrixTransformationUpdate[1]).add(rootNode.p0);
				trunkGeometryBuffer[point * 3] = tempVector.x;
				trunkGeometryBuffer[point * 3 + 1] = tempVector.y;
				trunkGeometryBuffer[point * 3 + 2] = tempVector.z;
			}
		}

		if (rootNode.endArrayleaves > -1) {
			for (let point = rootNode.beginningArrayleaves; point <= rootNode.endArrayleaves; point++) {
				let tempVector = new THREE.Vector3(
					leavesGeometryBuffer[point * 3],
					leavesGeometryBuffer[point * 3 + 1],
					leavesGeometryBuffer[point * 3 + 2]);

				tempVector.sub(rootNode.oldP0).applyAxisAngle(rootNode.matrixTransformationUpdate[0], rootNode.matrixTransformationUpdate[1]).add(rootNode.p0);
				leavesGeometryBuffer[point * 3] = tempVector.x;
				leavesGeometryBuffer[point * 3 + 1] = tempVector.y;
				leavesGeometryBuffer[point * 3 + 2] = tempVector.z;
			}

		}

		if (rootNode.endArrayApples > -1) {
			for (let point = rootNode.beginningArrayApples; point <= rootNode.endArrayApples; point++) {
				let tempVector = new THREE.Vector3(
					applesGeometryBuffer[point * 3],
					applesGeometryBuffer[point * 3 + 1],
					applesGeometryBuffer[point * 3 + 2]);

				tempVector.sub(rootNode.oldP0).applyAxisAngle(rootNode.matrixTransformationUpdate[0], rootNode.matrixTransformationUpdate[1]).add(rootNode.p0);

				applesGeometryBuffer[point * 3] = tempVector.x;
				applesGeometryBuffer[point * 3 + 1] = tempVector.y;
				applesGeometryBuffer[point * 3 + 2] = tempVector.z;
			}
		}

		rootNode.childNode.forEach(child => {
			this.updateTreeHermite(trunkGeometryBuffer, leavesGeometryBuffer, applesGeometryBuffer, child)
		});

	},

	drawTreeSkeleton: function (rootNode, scene, color = 0xffffff, matrix = new THREE.Matrix4()) {

		var stack = [];
		stack.push(rootNode);

		var points = [];

		while (stack.length > 0) {
			var currentNode = stack.pop();

			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}

			points.push(currentNode.p0);
			points.push(currentNode.p1);

		}

		var geometry = new THREE.BufferGeometry().setFromPoints(points);
		var material = new THREE.LineBasicMaterial({ color: color });
		var line = new THREE.LineSegments(geometry, material);
		line.applyMatrix4(matrix);
		scene.add(line);

		return line.geometry;
	},

	updateTreeSkeleton: function (geometryBuffer, rootNode) {

		var stack = [];
		stack.push(rootNode);

		var idx = 0;
		while (stack.length > 0) {
			var currentNode = stack.pop();

			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}
			geometryBuffer[idx * 6] = currentNode.p0.x;
			geometryBuffer[idx * 6 + 1] = currentNode.p0.y;
			geometryBuffer[idx * 6 + 2] = currentNode.p0.z;
			geometryBuffer[idx * 6 + 3] = currentNode.p1.x;
			geometryBuffer[idx * 6 + 4] = currentNode.p1.y;
			geometryBuffer[idx * 6 + 5] = currentNode.p1.z;

			idx++;
		}
	},


	drawTreeNodes: function (rootNode, scene, color = 0x00ff00, size = 0.05, matrix = new THREE.Matrix4()) {

		var stack = [];
		stack.push(rootNode);

		var points = [];

		while (stack.length > 0) {
			var currentNode = stack.pop();

			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}

			points.push(currentNode.p0);
			points.push(currentNode.p1);

		}

		var geometry = new THREE.BufferGeometry().setFromPoints(points);
		var material = new THREE.PointsMaterial({ color: color, size: size });
		var points = new THREE.Points(geometry, material);
		points.applyMatrix4(matrix);
		scene.add(points);

	},


	drawTreeSegments: function (rootNode, scene, lineColor = 0xff0000, segmentColor = 0xffffff, orientationColor = 0x00ff00, matrix = new THREE.Matrix4()) {

		var stack = [];
		stack.push(rootNode);

		var points = [];
		var pointsS = [];
		var pointsT = [];

		while (stack.length > 0) {
			var currentNode = stack.pop();

			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}

			const segments = currentNode.sections;
			for (var i = 0; i < segments.length - 1; i++) {
				points.push(TP3.Geometry.meanPoint(segments[i]));
				points.push(TP3.Geometry.meanPoint(segments[i + 1]));
			}
			for (var i = 0; i < segments.length; i++) {
				pointsT.push(TP3.Geometry.meanPoint(segments[i]));
				pointsT.push(segments[i][0]);
			}

			for (var i = 0; i < segments.length; i++) {

				for (var j = 0; j < segments[i].length - 1; j++) {
					pointsS.push(segments[i][j]);
					pointsS.push(segments[i][j + 1]);
				}
				pointsS.push(segments[i][0]);
				pointsS.push(segments[i][segments[i].length - 1]);
			}
		}

		var geometry = new THREE.BufferGeometry().setFromPoints(points);
		var geometryS = new THREE.BufferGeometry().setFromPoints(pointsS);
		var geometryT = new THREE.BufferGeometry().setFromPoints(pointsT);

		var material = new THREE.LineBasicMaterial({ color: lineColor });
		var materialS = new THREE.LineBasicMaterial({ color: segmentColor });
		var materialT = new THREE.LineBasicMaterial({ color: orientationColor });

		var line = new THREE.LineSegments(geometry, material);
		var lineS = new THREE.LineSegments(geometryS, materialS);
		var lineT = new THREE.LineSegments(geometryT, materialT);

		line.applyMatrix4(matrix);
		lineS.applyMatrix4(matrix);
		lineT.applyMatrix4(matrix);

		scene.add(line);
		scene.add(lineS);
		scene.add(lineT);

	}
}