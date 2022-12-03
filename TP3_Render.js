TP3.Render = {
	drawTreeRough: function (rootNode, scene, alpha, radialDivisions = 8, leavesCutoff = 0.1, leavesDensity = 10, applesProbability = 0.05, matrix = new THREE.Matrix4()) {



		//créer une branche 
		let distanceBranch = rootNode.p1.distanceTo(rootNode.p0);
		let cylinder = new THREE.CylinderBufferGeometry(rootNode.a1, rootNode.a0, distanceBranch, 32);
		let branch = new THREE.Mesh(cylinder, new THREE.MeshLambertMaterial({ color: 0x8B5A2B }));


		// 
		let vectorBranch = new THREE.Vector3();
		vectorBranch.subVectors(rootNode.p1, rootNode.p0);


		//calculer les angles pour la rotation des branche 
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
		branch.applyMatrix4(test)
		scene.add(branch);


		if (rootNode.childNode.length != 0) {
			rootNode.childNode.forEach(child => {
				this.drawTreeRough(child, scene, alpha, radialDivisions, leavesCutoff, leavesDensity, applesProbability, matrix);
			});
			// this.drawTreeRough(rootNode.childNode[0], scene, alpha, radialDivisions, leavesCutoff, leavesDensity, applesProbability, matrix);
		}


		if (rootNode.a0 < alpha * leavesCutoff) {
			if (rootNode.childNode.length == 0) {
				for (let i = 0; i < leavesDensity; i++) {
					let square = new THREE.PlaneBufferGeometry(alpha, alpha);
					let leaf = new THREE.Mesh(square, new THREE.MeshPhongMaterial({ color: 0x3A5F0B }));
					let randomForAngle = Math.random() * 2 * Math.PI;
					let randomForAngle2 = Math.random() * 2 * Math.PI;
					let randomForPosition = Math.random() * (distanceBranch + alpha);
					let randomForDistanceFromBranch = (Math.random() - 0.5) * alpha;
					let matrixTemp = new THREE.Matrix4();
					matrixTemp.makeRotationX(randomForAngle2);
					let matrixTransformationLeaf = new THREE.Matrix4().multiplyMatrices(matrixTranslationP0, matrixTemp);
					matrixTemp.makeRotationY(randomForAngle);
					matrixTransformationLeaf.multiply(matrixTemp);
					matrixTemp.makeTranslation(randomForDistanceFromBranch, randomForPosition + alpha / 2, 0);
					matrixTransformationLeaf.multiply(matrixTemp);
					//appliquer la transformation de la branche
					leaf.applyMatrix4(matrixTransformationLeaf);
					scene.add(leaf); // j'utilise clairement pas correctement le plane buffer 
				}

			} else {
				//  TODO
				// THREE.BufferGeometryUtils.mergeBufferGeometries() 
				for (let i = 0; i < leavesDensity; i++) {
					let square = new THREE.PlaneBufferGeometry(alpha, alpha);
					let leaf = new THREE.Mesh(square, new THREE.MeshPhongMaterial({ color: 0x3A5F0B }));
					let randomForAngle = Math.random() * 2 * Math.PI;
					let randomForAngle2 = Math.random() * 2 * Math.PI;
					let randomForPosition = Math.random() * distanceBranch;
					let randomForDistanceFromBranch = (Math.random() - 0.5) * alpha;
					let matrixTemp = new THREE.Matrix4();
					matrixTemp.makeRotationX(randomForAngle2);
					let matrixTransformationLeaf = new THREE.Matrix4().multiplyMatrices(matrixTranslationP0, matrixTemp);
					matrixTemp.makeRotationY(randomForAngle);
					matrixTransformationLeaf.multiply(matrixTemp);
					matrixTemp.makeTranslation(randomForDistanceFromBranch, randomForPosition + alpha / 2, 0);
					matrixTransformationLeaf.multiply(matrixTemp);
					//appliquer la transformation de la branche
					leaf.applyMatrix4(matrixTransformationLeaf);

					scene.add(leaf); // j'utilise clairement pas correctement le plane buffer 

				}

			}

			let haveApple = Math.random() <= applesProbability;
			if (haveApple) {

				let geometryApple = new THREE.BoxGeometry(alpha, alpha, alpha);
				let apple = new THREE.Mesh(geometryApple, new THREE.MeshPhongMaterial({ color: 0x5F0B0B }));
				let matrixTranslationP1 = new THREE.Matrix4().makeTranslation(rootNode.p1.x, rootNode.p1.y, rootNode.p1.z);
				apple.applyMatrix4(matrixTranslationP1);
				scene.add(apple);
			}
		}

		return
	},

	drawTreeHermite: function (rootNode, scene, alpha, leavesCutoff = 0.1, leavesDensity = 10, applesProbability = 0.05, matrix = new THREE.Matrix4()) {

		let vertices = [];
		let facesIdx = [];

		let number = 0;

		let branches = new THREE.BufferGeometry();
		let leaves = new THREE.BufferGeometry();
		let apples = new THREE.BufferGeometry();

		let hasLeaves = false;

		for (let i = 0; i < rootNode.sections.length - 1; i++) {
			let j;
			for (j = 0; j < rootNode.sections[i].length - 1; j++) {
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

		let f32vertices = new Float32Array(vertices);
		branches.setAttribute("position", new THREE.BufferAttribute(f32vertices, 3));
		branches.setIndex(facesIdx);
		branches.computeVertexNormals();
		let branchMesh = new THREE.Mesh(branches, new THREE.MeshLambertMaterial({ color: 0x8B5A2B }));
		scene.add(branchMesh);

		vertices = [];
		facesIdx = [];
		let angle = Math.cos(Math.PI / 4)
		let distanceBranch
		if (rootNode.a0 < alpha * leavesCutoff) {
			hasLeaves = true;
			if (rootNode.childNode.length == 0) {
				for (let i = 0; i < leavesDensity; i++) {

					let randomPart = Math.floor(Math.random() * (rootNode.points.length - 1))
					facesIdx.push((i * 3), (i * 3) + 1, (i * 3) + 2)

					let pointSegment0 = rootNode.points[randomPart];
					let pointSegment1 = rootNode.points[randomPart + 1];
					distanceBranch = pointSegment1.distanceTo(pointSegment0);
					let matrixTranslation = new THREE.Matrix4().makeTranslation(pointSegment0.x, pointSegment0.y, pointSegment0.z)
					let randomForAngle = Math.random() * 2 * Math.PI;
					let randomForAngle2 = Math.random() * 2 * Math.PI;
					let randomForPosition = Math.random() * (distanceBranch + alpha);
					let randomForDistanceFromBranch = (Math.random() - 0.5) * alpha;
					let matrixTemp = new THREE.Matrix4();
					matrixTemp.makeRotationX(randomForAngle2);
					let matrixTransformationLeaf = new THREE.Matrix4().multiplyMatrices(matrixTranslation, matrixTemp);
					matrixTemp.makeRotationY(randomForAngle);
					matrixTransformationLeaf.multiply(matrixTemp);
					matrixTemp.makeTranslation(randomForDistanceFromBranch, randomForPosition + alpha / 2, 0);
					matrixTransformationLeaf.multiply(matrixTemp);
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
					facesIdx.push((i * 3), (i * 3) + 1, (i * 3) + 2)
					let randomPart = Math.floor(Math.random() * (rootNode.points.length - 1))

					let pointSegment0 = rootNode.points[randomPart];
					let pointSegment1 = rootNode.points[randomPart + 1];
					distanceBranch = pointSegment1.distanceTo(pointSegment0);
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
					let pointLeaf1 = new THREE.Vector3(0, 0, 0)
					let pointLeaf2 = new THREE.Vector3(alpha, 0, 0);
					let pointLeaf3 = new THREE.Vector3(alpha / 2, angle * alpha, 0);
					pointLeaf1.applyMatrix4(matrixTransformationLeaf)
					pointLeaf2.applyMatrix4(matrixTransformationLeaf)
					pointLeaf3.applyMatrix4(matrixTransformationLeaf)
					vertices.push(pointLeaf1.x, pointLeaf1.y, pointLeaf1.z)
					vertices.push(pointLeaf2.x, pointLeaf2.y, pointLeaf2.z)
					vertices.push(pointLeaf3.x, pointLeaf3.y, pointLeaf3.z)
				}


			}
			f32vertices = new Float32Array(vertices);
			leaves.setAttribute("position", new THREE.BufferAttribute(f32vertices, 3));
			leaves.setIndex(facesIdx);
			leaves.computeVertexNormals();

			let leafsMesh = new THREE.Mesh(leaves, new THREE.MeshLambertMaterial({ color: 0x3A5F0B, side: THREE.DoubleSide }));
			scene.add(leafsMesh);


			rootNode.hasApple = Math.random() <= applesProbability;
			if (rootNode.hasApple) {

				let geometryApple = new THREE.SphereBufferGeometry(alpha / 2, 32, 32);
				let apple = new THREE.Mesh(geometryApple, new THREE.MeshPhongMaterial({ color: 0x5F0B0B }));
				let matrixTranslationP1 = new THREE.Matrix4().makeTranslation(rootNode.p1.x, rootNode.p1.y - alpha / 2, rootNode.p1.z);
				apple.applyMatrix4(matrixTranslationP1);
				scene.add(apple);
				apples = apple.geometry;
			}


		}
		if (rootNode.childNode.length != 0) {
			rootNode.childNode.forEach(child => {
				let output = this.drawTreeHermite(child, scene, alpha, leavesCutoff, leavesDensity, applesProbability, matrix);

				branches = THREE.BufferGeometryUtils.mergeBufferGeometries([branches, output[0]], true);

				if (hasLeaves) {
					leaves = THREE.BufferGeometryUtils.mergeBufferGeometries([leaves, output[1]], true);

				} else {
					leaves = output[1];
					hasLeaves = true;
				}


				if (rootNode.hasApple && child.hasApple) {
					apples = THREE.BufferGeometryUtils.mergeBufferGeometries([apples, output[2]], true);

				} else if (child.hasApple) {
					apples = output[2];
					rootNode.hasApple = true;
				}

			});

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
				tempVector.sub(node.p0Initial).applyMatrix4(node.matrixTransformation).add(node.p0Initial);
				if (rootNode.ParentNode != null) {
					tempVector.applyMatrix4(node.parentNode.vectorTransformationParenthood);
				}

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
				tempVector.sub(node.p0Initial).applyMatrix4(node.matrixTransformation).add(node.p0Initial);
				if (rootNode.ParentNode != null) {
					tempVector.applyMatrix4(node.parentNode.vectorTransformationParenthood);
				}

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
				tempVector.sub(node.p0Initial).applyMatrix4(node.matrixTransformation).add(node.p0Initial);
				if (rootNode.ParentNode != null) {
					tempVector.applyMatrix4(node.parentNode.vectorTransformationParenthood);
				}

				applesGeometryBuffer[point * 3] = tempVector.x;
				applesGeometryBuffer[point * 3 + 1] = tempVector.y;
				applesGeometryBuffer[point * 3 + 2] = tempVector.z;
			}
		}

		rootNode.childNode.forEach(child => {
			this.drawTreeHermite(trunkGeometryBuffer, leavesGeometryBuffer, applesGeometryBuffer, child)
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