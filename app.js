import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';

const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

const selectYellowBtn = document.getElementById('selectYellow');
const selectWhiteBtn = document.getElementById('selectWhite');
const selectDeleteBtn = document.getElementById('selectDelete');

// Flag to indicate the current selection mode
let selectionMode = 'yellow'; // Default to yellow cube

// Event listeners for UI buttons
selectYellowBtn.addEventListener('click', function () {
    selectionMode = 'yellow';
    console.log('Selected: Yellow Cube');
});

selectWhiteBtn.addEventListener('click', function () {
    selectionMode = 'white';
    console.log('Selected: White Cube');
});

selectDeleteBtn.addEventListener('click', function () {
    selectionMode = 'delete';
    console.log('Selected: Delete');
});

// Update the object placement logic based on the current selection mode
window.addEventListener('mousedown', function (event) {
    if (event.button === 0) {
        // Your existing object placement logic goes here

        console.log(scene.children.length);
    }
});

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.mouseButtons = {
    LEFT: THREE.MOUSE.RIGHT,
    MIDDLE: THREE.MOUSE.MIDDLE,
    RIGHT: THREE.MOUSE.LEFT,
};
orbit.enableDamping = true;
orbit.dampingFactor = 0.25;
orbit.screenSpacePanning = false;
orbit.maxPolarAngle = Math.PI / 2;
orbit.enablePan = false;



camera.position.set(10, 15, -22);

orbit.update();

const planeMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60), // Change size to represent a 3x3 grid
    new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        visible: false
    })
);
planeMesh.rotateX(-Math.PI / 2);
scene.add(planeMesh);

const grid = new THREE.GridHelper(62, 62); // Change size to represent a 3x3 grid
scene.add(grid);

const highlightMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 3), // Change size to represent a 3x3 grid
    new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        transparent: true
    })
);
highlightMesh.rotateX(-Math.PI / 2);
highlightMesh.position.set(1.5, 0, 1.5); // Adjust position for a 3x3 grid
scene.add(highlightMesh);

const mousePosition = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let intersects;

window.addEventListener('mousemove', function (e) {
    mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
    mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mousePosition, camera);
    intersects = raycaster.intersectObject(planeMesh);
    if (intersects.length > 0) {
        const intersect = intersects[0];
        const gridSize = 3;

        // Calculate the center of the 3x3 grid based on the mouse position
        const highlightPos = new THREE.Vector3().copy(intersect.point).floor().addScalar(gridSize / 2 - 1);

        highlightMesh.position.set(highlightPos.x, 0, highlightPos.z);

        // Check for intersections with existing objects in both horizontal and vertical directions
        const isIntersection = objects.some(function (object) {
            return (
                Math.abs(object.position.x - highlightMesh.position.x) <= 2 &&
                Math.abs(object.position.z - highlightMesh.position.z) <= 2 &&
                Math.abs(object.position.y - 0.75) <= 2  // Adjust this value based on your building height
            );
        });

        if (isIntersection) {
            highlightMesh.material.color.setHex(0xFF0000); // Red color for intersection
        } else {
            highlightMesh.material.color.setHex(0x00FF00); // Green color for no intersection
        }
    }
});



const whiteCubeMesh = new THREE.Mesh(
    new THREE.BoxGeometry(3, 3, 3), // Adjust the size of the building
    new THREE.MeshBasicMaterial({
        wireframe: true,
        color: 0xFFFFFF
    })
);

const yellowCubeMesh = new THREE.Mesh(
    new THREE.BoxGeometry(3,3,3),
    new THREE.MeshBasicMaterial({
        wireframe: true,
        color: 0xFFFF00
    })
)

const objects = [];

window.addEventListener('mousedown', function (event) {
    if (event.button === 0) {
        const isIntersection = objects.some(function (object) {
            return (
                Math.abs(object.position.x - highlightMesh.position.x) <= 2 &&
                Math.abs(object.position.z - highlightMesh.position.z) <= 2
            );
        });

        if (!isIntersection) {
            if (intersects.length > 0) {
                if (selectionMode === 'yellow') {
                    const yellowCubeClone = yellowCubeMesh.clone();
                    yellowCubeClone.position.copy(highlightMesh.position);
                    scene.add(yellowCubeClone);
                    objects.push(yellowCubeClone);
                    highlightMesh.material.color.setHex(0x00FF00);
                } else if (selectionMode === 'white') {
                    const whiteCubeClone = whiteCubeMesh.clone();
                    whiteCubeClone.position.copy(highlightMesh.position);
                    scene.add(whiteCubeClone);
                    objects.push(whiteCubeClone);
                    highlightMesh.material.color.setHex(0x00FF00);
                } else if (selectionMode === 'delete') {
                    const index = objects.indexOf(intersectedObject);

                    if (index !== -1) {
                        scene.remove(intersectedObject);
                        objects.splice(index, 1);
                        highlightMesh.material.color.setHex(0x00FF00);
                        console.log('Deleted an object');
                    }
                }
            }
        }
        console.log(scene.children.length);
    }
});
window.addEventListener('contextmenu', function (event) {
    event.preventDefault();
});
window.addEventListener('keydown', function (event) {
    switch (event.key) {
        case 'w':
            // Move camera forward
            camera.position.z -= 1;
            break;
        case 's':
            // Move camera backward
            camera.position.z += 1;
            break;
        case 'a':
            // Move camera left
            camera.position.x -= 1;
            break;
        case 'd':
            // Move camera right
            camera.position.x += 1;
            break;
    }
});


function animate(time) {
    orbit.update();
    highlightMesh.material.opacity = 1 + Math.sin(time / 120);
    objects.forEach(function (object) {
        // Remove rotation
        object.position.y = 1.5; // Adjust the building height
    });
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
