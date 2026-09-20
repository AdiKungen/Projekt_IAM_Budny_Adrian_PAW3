import * as THREE from 'three';

let scene, camera, renderer, grid, blocks, currentBlock, score;
const gridWidth = 5, gridHeight = 12, gridDepth = 5;
const blockSize = 1;
let fallSpeed = 0.005;

init();
animate();

function init() {
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(gridWidth / 2, gridHeight + 4, gridDepth / 2);
    camera.lookAt(gridWidth / 2, 0, gridDepth / 2);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    grid = new Array(gridHeight);
    for (let y = 0; y < gridHeight; y++) {
        grid[y] = new Array(gridWidth).fill(null).map(() => new Array(gridDepth).fill(null));
    }

    blocks = [];
    score = 0;

    const light = new THREE.AmbientLight(0x404040);
    scene.add(light);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    scene.add(directionalLight);

    addGridWalls();

    generateNewBlock();

    document.addEventListener('keydown', onDocumentKeyDown, false);
}

function animate() {
    requestAnimationFrame(animate);

    if (currentBlock) {
        currentBlock.position.y -= fallSpeed;
        if (checkCollision(currentBlock)) {
            currentBlock.position.y += fallSpeed;
            placeBlock(currentBlock);
            if (currentBlock && currentBlock.position.y >= 10) {
                gameOver();
                return;
            }
            generateNewBlock();
        }
    }
    
    renderer.render(scene, camera);
}

function addGridWalls() {
    function createGridPlane(width, height, segmentsW, segmentsH, color = 0x00ff00) {
        const material = new THREE.LineBasicMaterial({ color: color });
        const geometry = new THREE.BufferGeometry();
        const vertices = [];

        const stepX = width / segmentsW;
        const stepY = height / segmentsH;

        for (let i = 0; i <= segmentsH; i++) {
            vertices.push(-width / 2, 0, i * stepY - height / 2, width / 2, 0, i * stepY - height / 2);
        }

        for (let i = 0; i <= segmentsW; i++) {
            vertices.push(i * stepX - width / 2, 0, -height / 2, i * stepX - width / 2, 0, height / 2);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        return new THREE.LineSegments(geometry, material);
    }

    const floor = createGridPlane(5, 5, 5, 5);
    floor.position.x = 2;
    floor.position.z = 2;
    floor.position.y = -0.5;
    
    scene.add(floor);

    const wall1 = createGridPlane(5, 12, 5, 12);
    wall1.position.x = 4.5;
    wall1.position.z = 2;
    wall1.position.y = 5.5;
    wall1.rotation.x = Math.PI / 2;
    wall1.rotation.z = Math.PI / 2;
    scene.add(wall1);

    const wall2 = createGridPlane(5, 12, 5, 12);
    wall2.position.x = 2;
    wall2.position.z = 4.5;
    wall2.position.y = 5.5;
    wall2.rotation.x = Math.PI / 2;
    scene.add(wall2);

    const wall3 = createGridPlane(5, 12, 5, 12);
    wall3.position.x = 2;
    wall3.position.z = -0.5;
    wall3.position.y = 5.5;
    wall3.rotation.x = Math.PI / 2;
    scene.add(wall3);

    const wall4 = createGridPlane(5, 12, 5, 12);
    wall4.position.x = -0.5;
    wall4.position.z = 2;
    wall4.position.y = 5.5;
    wall4.rotation.x = Math.PI / 2;
    wall4.rotation.z = Math.PI / 2;
    scene.add(wall4);

}

function generateNewBlock() {
const blockTypes = [
        { type: 'cube', positions: [[0, 0, 0]] },
        { type: 'L', positions: [[-1, 0, 0], [0, 0, 0], [1, 0, 0], [1, 0, 1]] },
        { type: 'square', positions: [[0, 0, 0], [1, 0, 0], [0, 0, 1], [1, 0, 1]] },
        { type: 'I', positions: [[-1, 0, 0], [0, 0, 0], [1, 0, 0]] },
        { type: 'Z', positions: [[-1, 0, 0], [0, 0, 0], [0, 0, 1], [1, 0, 1]] },
        { type: 'S', positions: [[-1, 0, 1], [0, 0, 1], [0, 0, 0], [1, 0, 0]] },
        { type: 'J', positions: [[-1, 0, 1], [-1, 0, 0], [0, 0, 0], [1, 0, 0]] },
        { type: 'T', positions: [[-1, 0, 0], [0, 0, 0], [1, 0, 0], [0, 0, 1]] }
    ];
    
    let randomType;
    if (Math.random() < 0.30) {
        randomType = blockTypes[0];
    } else {
        randomType = blockTypes[Math.floor(Math.random() * blockTypes.length)];
    }

    const blockGroup = new THREE.Group();

    for (const pos of randomType.positions) {
        const geometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
        const block = new THREE.Mesh(geometry, material);
        block.position.set(pos[0], pos[1], pos[2]);
        blockGroup.add(block);
    }

    blockGroup.position.set(Math.floor(gridWidth / 2), gridHeight - 1, Math.floor(gridDepth / 2));
    currentBlock = blockGroup;
    scene.add(currentBlock);
}

function checkCollision(blockGroup) {
    for (const block of blockGroup.children) {
        const worldPosition = block.getWorldPosition(new THREE.Vector3());

        const y = Math.floor(worldPosition.y);
        const x = Math.round(worldPosition.x);
        const z = Math.round(worldPosition.z);

        if (y < 0 || x < 0 || x >= gridWidth || z < 0 || z >= gridDepth || (y < gridHeight && grid[y][x][z] !== null)) {
            return true;
        }
    }
    return false;
}

function placeBlock(blockGroup) {
    for (const block of blockGroup.children) {
        const worldPosition = block.getWorldPosition(new THREE.Vector3());

        const y = Math.floor(worldPosition.y);
        const x = Math.round(worldPosition.x);
        const z = Math.round(worldPosition.z);

        if (y < 0 || y >= gridHeight || x < 0 || x >= gridWidth || z < 0 || z >= gridDepth) {
            continue;
        }

        grid[y][x][z] = block;
        blocks.push(block);

        const layerColor = getColorForLayer(y);
        block.material = new THREE.MeshBasicMaterial({
            color: layerColor,
            transparent: true,
            opacity: 0.5,
            depthWrite: false
        });

        const edgesGeometry = new THREE.EdgesGeometry(block.geometry);
        
        const edgesMaterial = new THREE.LineBasicMaterial({
            color: layerColor,
            linewidth: 2
        });

        const blockFrame = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        block.add(blockFrame);
    }
    checkLayers();
}

function getColorForLayer(layer) {
    const colors = [
        0xff0000,
        0xff7f00,
        0xffff00,
        0x00ff00,
        0x0000ff,
        0x4b0082,
        0x8b00ff,
        0xff1493,
        0x00ced1,
        0xff4500,
        0x2e8b57,
        0x1e90ff
    ];
    return colors[layer % colors.length];
}

function checkLayers() {
    for (let y = 0; y < gridHeight; y++) {
        if (grid[y].every(row => row.every(cell => cell !== null))) {
            score += 100;
            document.getElementById('score').innerText = `Score: ${score}`;
            fallSpeed += 0.001;
            removeLayer(y);
        }
    }
}

function removeLayer(layer) {
    for (let x = 0; x < gridWidth; x++) {
        for (let z = 0; z < gridDepth; z++) {
            const block = grid[layer][x][z];
            if (block) {
                scene.remove(block.parent);
            }
        }
    }

    for (let y = layer; y < gridHeight - 1; y++) {
        for (let x = 0; x < gridWidth; x++) {
            for (let z = 0; z < gridDepth; z++) {
                grid[y][x][z] = grid[y + 1][x][z];
                if (grid[y][x][z]) {
                    grid[y][x][z].position.y -= 1;

                    grid[y][x][z].material.color.set(getColorForLayer(y));
                }
            }
        }
    }

    for (let x = 0; x < gridWidth; x++) {
        for (let z = 0; z < gridDepth; z++) {
            grid[gridHeight - 1][x][z] = null;
        }
    }
    
}

function onDocumentKeyDown(event) {
    switch (event.keyCode) {
        case 65:
            moveBlock(-1, 0);
            break;
        case 68:
            moveBlock(1, 0);
            break;
        case 87:
            moveBlock(0, -1);
            break;
        case 83:
            moveBlock(0, 1);
            break;
        case 32:
            dropBlockImmediately();
            break;
        case 37:
            rotateBlock('left');
            break;
        case 39:
            rotateBlock('right');
            break;
    }
}

function rotateBlock(direction) {
    if (currentBlock) {
        const initialRotation = currentBlock.rotation.y;

        if (direction === 'left') {
            currentBlock.rotation.y -= Math.PI / 2;
        } else if (direction === 'right') {
            currentBlock.rotation.y += Math.PI / 2;
        }

        if (checkCollision(currentBlock)) {
            currentBlock.rotation.y = initialRotation;
        }
    }
}

function moveBlock(deltaX, deltaZ) {
    if (currentBlock) {
        currentBlock.position.x += deltaX;
        currentBlock.position.z += deltaZ;

        if (checkCollision(currentBlock)) {
            currentBlock.position.x -= deltaX;
            currentBlock.position.z -= deltaZ;
        }
    }
}

function dropBlockImmediately() {
    if (!currentBlock) return;

    currentBlock.position.y = Math.round(currentBlock.position.y);

    if (checkCollision(currentBlock)) {
        currentBlock.position.y += 1;
    }

    while (!checkCollision(currentBlock)) {
        currentBlock.position.y -= 1;
    }

    currentBlock.position.y += 1;
    currentBlock.position.y = Math.round(currentBlock.position.y);
    placeBlock(currentBlock);

    if (currentBlock && currentBlock.position.y >= 10) {
        gameOver();
        return;
    }

    generateNewBlock();
}

function gameOver() {
    document.getElementById('gameOverText').innerText = 'Game Over';

    currentBlock = null;
}