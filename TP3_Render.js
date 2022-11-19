TP3.Render = {
	drawTreeRough: function (rootNode, scene, alpha, radialDivisions = 8, leavesCutoff = 0.1, leavesDensity = 10, applesProbability = 0.05, matrix = new THREE.Matrix4()) {



		// il y des branche enfants

		let distanceBranch = rootNode.p1.distanceTo(rootNode.p0);
		let cylinder = new THREE.CylinderBufferGeometry(rootNode.a1, rootNode.a0, distanceBranch, 32);
		let branch = new THREE.Mesh(cylinder, new THREE.MeshLambertMaterial({ color: 0x8B5A2B }));
		let matrixRotationAxis = new THREE.Matrix4()


		let vectorBranch = new THREE.Vector3()
		vectorBranch.subVectors(rootNode.p1, rootNode.p0);
		matrixRotationAxis.makeTranslation(vectorBranch.x / 2, vectorBranch.y / 2, vectorBranch.z / 2)
		let matriceRotation = new THREE.Matrix4();

		let rho = Math.PI / 2 - Math.asin(vectorBranch.y / distanceBranch);
		let teta = Math.atan2(vectorBranch.x, vectorBranch.z);


		//Lorsqu'On fait un demi tour, on regarde de l'autre côté parce que la fonciton tan ne fais pas de différence avec ou est le négatif 
		if (vectorBranch.z < 0) {
			rho = rho - 2 * Math.PI;
		}
		if (vectorBranch.x < 0) {
			teta = teta - 2 * Math.PI;
		}

		matriceRotation.makeRotationY(teta)
		matrixRotationAxis.multiply(matriceRotation)
		matriceRotation.makeRotationX(rho)
		matrixRotationAxis.multiply(matriceRotation)


		let matrixTranslationP0 = new THREE.Matrix4().makeTranslation(rootNode.p0.x, rootNode.p0.y, rootNode.p0.z)
		let matrixTransformation = new THREE.Matrix4().copy(matrixTranslationP0)
		matrixTransformation.multiply(matrixRotationAxis)
		branch.applyMatrix4(matrixTransformation)
		scene.add(branch);


		if (rootNode.childNode.length != 0) {
			rootNode.childNode.forEach(child => {
				this.drawTreeRough(child, scene, alpha, radialDivisions, leavesCutoff, leavesDensity, applesProbability, matrix);
			});
		}


		if (rootNode.a0 < alpha * leavesCutoff) {
			if (rootNode.childNode.length == 0) {
				// si branche terminale

			} else {
				//  TODO
				// THREE.BufferGeometryUtils.mergeBufferGeometries() 
				for (let i = 0; i < leavesDensity; i++) {
					let square = new THREE.PlaneBufferGeometry(alpha, alpha);
					let leaf = new THREE.Mesh(square, new THREE.MeshPhongMaterial({ color: 0x3A5F0B }));
					let randomForAngle = Math.random() * 2 * Math.PI;
					let randomForAngle2 = Math.random();
					let randomForPosition = Math.random() * distanceBranch;
					let randomForDistanceFromBranch = (Math.random() - 0.5) * alpha;
					let matrixTransformationLeaf = new THREE.Matrix4()

					matrixTransformationLeaf.makeTranslation(randomForDistanceFromBranch, randomForPosition + alpha / 2, 0);
					let matrixRotationLeaf = new THREE.Matrix4();
					matrixRotationLeaf.makeRotationX(randomForAngle2);
					matrixTransformationLeaf.multiply(matrixRotationLeaf);
					matrixRotationLeaf.makeRotationY(randomForAngle);
					matrixTransformationLeaf.multiply(matrixRotationLeaf);
					// appliquer la transformation de la branche 
					matrixTransformationLeaf.multiply(matrixTransformation);
					leaf.applyMatrix4(matrixTransformationLeaf);

					scene.add(leaf); // j'utilise clairement pas correctement le plane buffer 

				}

			}
		}

		return
	},

	drawTreeHermite: function (rootNode, scene, alpha, leavesCutoff = 0.1, leavesDensity = 10, applesProbability = 0.05, matrix = new THREE.Matrix4()) {
		//TODO
	},

	updateTreeHermite: function (trunkGeometryBuffer, leavesGeometryBuffer, rootNode) {
		//TODO
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