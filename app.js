import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader';

import {GRID_SIZE, selection} from "./globals";

let fbxObject;
let fbxObject2;
let direction = 0;


const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

const selectYellowBtn = document.getElementById('selectYellow');
const selectWhiteBtn = document.getElementById('selectWhite');
const selectDeleteBtn = document.getElementById('selectDelete');

// Flag to indicate the current selection mode
let selectionMode = selection.BUILDING_1; // Default to yellow cube

// Event listeners for UI buttons
selectYellowBtn.addEventListener('click', function () {
    selectionMode = selection.BUILDING_1;
    console.log('Selected: Yellow Cube');
});

selectWhiteBtn.addEventListener('click', function () {
    selectionMode = selection.BUILDING_2;
    console.log('Selected: White Cube');
});

selectDeleteBtn.addEventListener('click', function () {
    selectionMode = selection.DELETE;
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

const light = new THREE.PointLight(0xffffff, 50)
light.position.set(0.8, 20, 1.0)
scene.add(light)

const ambientLight = new THREE.AmbientLight()
scene.add(ambientLight)

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

const fbxLoader = new FBXLoader();
fbxLoader.load('/Assets/bina2.fbx', (object) => {
    object.scale.set(.07, .09, .09);
    fbxObject = object;
})

fbxLoader.load('Assets/building.fbx', (object) => {
    object.scale.set(.025, .03, .05);
    fbxObject2 = object;
})
const planeMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE), // Change size to represent a 3x3 grid
    new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        visible: false
    })
);
planeMesh.rotateX(-Math.PI / 2);
scene.add(planeMesh);

const grid = new THREE.GridHelper(62, 62); // Change size to represent a 3x3 grid
scene.add(grid);

const doorMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1,1),
    new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        transparent: true
    })
);
doorMesh.rotateX(-Math.PI / 2);
doorMesh.position.set(1.5, 0, 1.5); // Adjust position for a 3x3 grid
scene.add(doorMesh);

const deleteMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        transparent: true
    })
);
deleteMesh.rotateX(-Math.PI / 2);
deleteMesh.position.set(1, 0, 1);
deleteMesh.material.color.setHex(0xFFFFFF);
scene.add(deleteMesh);

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

const highlightMesh2 = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 5), // Change size to represent a 3x3 grid
    new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        transparent: true
    })
);

highlightMesh2.rotateX(-Math.PI / 2);
highlightMesh2.position.set(1.5, 0, 1.5);
scene.add(highlightMesh2);

const mousePosition = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let intersects;

window.addEventListener('mousemove', function (e) {
    mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
    mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mousePosition, camera);
    intersects = raycaster.intersectObject(planeMesh);
    let usedHighlight = highlightMesh;
    if (intersects.length > 0) {
        const intersect = intersects[0];
        let gridSize = 3;
        if (selectionMode === selection.BUILDING_2) {
            usedHighlight = highlightMesh2;
            gridSize = 5; // Adjust gridSize for the second building
        }

        // Calculate the center of the 3x3 grid based on the mouse position
        const highlightPos = new THREE.Vector3().copy(intersect.point).floor().addScalar(gridSize / 2 - 1);

        if (selectionMode == selection.BUILDING_1) {
            usedHighlight.position.set(highlightPos.x, 0, highlightPos.z);
            if (direction % 4 == 0){
                doorMesh.position.set(usedHighlight.position.x,0,usedHighlight.position.z + 2);
            }
            else if (direction % 4 == 1){
                doorMesh.position.set(usedHighlight.position.x - 2,0,usedHighlight.position.z);
            }
            else if (direction % 4 == 2){
                doorMesh.position.set(usedHighlight.position.x,0,usedHighlight.position.z - 2);
            }
            else if (direction % 4 == 3){
                doorMesh.position.set(usedHighlight.position.x + 2,0,usedHighlight.position.z);
            }
        } else if (selectionMode == selection.BUILDING_2) {
            usedHighlight.position.set(highlightPos.x - 1, 0, highlightPos.z - 1);
        } else if (selectionMode == selection.DELETE) {
            deleteMesh.position.set(highlightPos.x, 0, highlightPos.z);
        }


        // Check for intersections with existing objects in both horizontal and vertical directions
        const isIntersection = objects.some(function (object) {
            if (selectionMode == selection.BUILDING_1) {
                if (object.name == 'group1') {
                    return (
                        Math.abs(object.position.x - highlightMesh.position.x) <= 3 &&
                        Math.abs(object.position.z - highlightMesh.position.z) <= 3
                    );
                } else {
                    return (
                        Math.abs(object.position.x - highlightMesh.position.x) <= 5 &&
                        Math.abs(object.position.z - highlightMesh.position.z) <= 5
                    )
                }
            } else {
                if (object.name == 'group1') {
                    return (
                        Math.abs(object.position.x - highlightMesh2.position.x) <= 5 &&
                        Math.abs(object.position.z - highlightMesh2.position.z) <= 5
                    );
                }
                return (
                    Math.abs(object.position.x - highlightMesh2.position.x) <= 5 &&
                    Math.abs(object.position.z - highlightMesh2.position.z) <= 5
                )
            }
        });

        if (isIntersection) {
            usedHighlight.material.color.setHex(0xFF0000); // Red color for intersection
        } else {
            usedHighlight.material.color.setHex(0x00FF00); // Green color for no intersection
        }
    }
});

const objects = [];

window.addEventListener('mousedown', function (event) {
    if (event.button === 0) {
        let intersectedObject;
        const isIntersection = objects.some(function (object) {
            if (selectionMode == selection.BUILDING_1) {
                if (object.name == 'group1') {
                    if (Math.abs(object.position.x - highlightMesh.position.x) <= 3 &&
                        Math.abs(object.position.z - highlightMesh.position.z) <= 3) {
                        intersectedObject = object;
                        return true;
                    }
                } else {
                    if (Math.abs(object.position.x - highlightMesh.position.x) <= 5 &&
                        Math.abs(object.position.z - highlightMesh.position.z) <= 5) {
                        intersectedObject = object;
                        return true;
                    }
                }
            } else if (selectionMode == selection.BUILDING_2) {
                if (object.name == 'group1') {
                    if (Math.abs(object.position.x - highlightMesh2.position.x) <= 5 &&
                        Math.abs(object.position.z - highlightMesh2.position.z) <= 5) {
                        intersectedObject = object;
                        return true;
                    }
                } else {
                    if (Math.abs(object.position.x - highlightMesh2.position.x) <= 5 &&
                        Math.abs(object.position.z - highlightMesh2.position.z) <= 5) {
                        intersectedObject = object;
                        return true;
                    }
                }
            } else if (selectionMode == selection.DELETE) {
                if (Math.abs(object.position.x - deleteMesh.position.x) <= 1 &&
                    Math.abs(object.position.z - deleteMesh.position.z) <= 1) {
                    intersectedObject = object;
                    return true;
                }
            }
        });
        if (isIntersection) {
            if (selectionMode == selection.DELETE) {
                const index = objects.indexOf(intersectedObject);

                if (index !== -1) {
                    scene.remove(intersectedObject);
                    objects.splice(index, 1);
                    highlightMesh.material.color.setHex(0x00FF00);
                    console.log('Deleted an object');
                }
            }
        }

        if (!isIntersection) {
            if (intersects.length > 0) {
                if (selectionMode === selection.BUILDING_1) {
                    const buildingClone = fbxObject.clone();
                    buildingClone.position.copy(highlightMesh.position);
                    scene.add(buildingClone);
                    objects.push(buildingClone);
                    highlightMesh.material.color.setHex(0x00FF00);
                } else if (selectionMode === selection.BUILDING_2) {
                    const building2Clone = fbxObject2.clone();
                    building2Clone.position.copy(highlightMesh2.position);
                    scene.add(building2Clone);
                    objects.push(building2Clone);
                    highlightMesh2.material.color.setHex(0x00FF00);
                }
            }
        }
        console.log(scene.children.length);
        console.log(objects);
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
        case 'e':
            // Rotate highlight mesh to the right (clockwise)
            direction += 1;
            fbxObject.rotateY(-Math.PI / 2);
            fbxObject2.rotateY(Math.PI / 2);
            break;
        case 'q':
            direction += 3;
            // Rotate highlight mesh to the left (counterclockwise)
            fbxObject.rotateY(+Math.PI / 2);
            fbxObject2.rotateY(-Math.PI / 2);
            break;
    }
});


function animate(time) {
    orbit.update();
    if (selectionMode == selection.BUILDING_1) {
        scene.remove(highlightMesh2);
        scene.remove(deleteMesh);
        scene.add(highlightMesh);
    } else if (selectionMode == selection.BUILDING_2) {
        scene.remove(highlightMesh);
        scene.remove(deleteMesh);
        scene.add(highlightMesh2);
    } else {
        scene.remove(highlightMesh);
        scene.remove(highlightMesh2);
    }
    highlightMesh.material.opacity = 1 + Math.sin(time / 120);
    doorMesh.material.opacity = 1 + Math.sin(time / 120);
    highlightMesh2.material.opacity = 1 + Math.sin(time / 120);
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});