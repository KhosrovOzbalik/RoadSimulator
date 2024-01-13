import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader';



import {GRID_SIZE, selection} from "./globals";
import {MeshObject, Building} from "./objects";
import {addCity,grid} from "./datas";
import {isIntersect} from "./algorithmUtilities";

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
const lightXSlider = document.getElementById('lightX');
const lightZSlider = document.getElementById('lightZ');
const intensitySlider = document.getElementById('intensity');

lightXSlider.addEventListener('input', function() {
    // Update the light's X coordinate based on the slider value
    light.position.x = parseFloat(lightXSlider.value);
});

lightZSlider.addEventListener('input', function() {
    // Update the light's Z coordinate based on the slider value
    light.position.z = parseFloat(lightZSlider.value);
});

intensitySlider.addEventListener('input', function() {
    // Update the light's intensity based on the slider value
    light.intensity = parseFloat(intensitySlider.value); // Adjust as needed
});

const scene = new THREE.Scene();
const light = new THREE.PointLight(0xffffff, 200)
light.position.set(0, 5, 0)
scene.add(light)


const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.mouseButtons = {
    LEFT: false,
    MIDDLE: THREE.MOUSE.MIDDLE,
    RIGHT: THREE.MOUSE.LEFT,
};
orbit.enableDamping = true;
orbit.screenSpacePanning = true;
orbit.maxPolarAngle = Math.PI / 2;
orbit.enablePan = true;
orbit.keys = {
    LEFT: 'KeyA', //left arrow
    UP: 'KeyW', // up arrow
    RIGHT: 'KeyD', // right arrow
    BOTTOM: 'KeyS' // down arrow
};
orbit.listenToKeyEvents(window);
orbit.keyPanSpeed = 40;


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
    new THREE.PlaneGeometry(GRID_SIZE-2, GRID_SIZE-2), // Change size to represent a 3x3 grid
    new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        visible: false
    })
);
planeMesh.rotateX(-Math.PI / 2);
scene.add(planeMesh);

const gridHelper = new THREE.GridHelper(GRID_SIZE, GRID_SIZE); // Change size to represent a 3x3 grid
scene.add(gridHelper);

const doorMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
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

function generateMesh(size) {
    return new THREE.Mesh(
        new THREE.PlaneGeometry(size, size), // Change size to represent a 3x3 grid
        new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide,
            transparent: true
        }));
}

function generateMeshCoordinatesThree(highlightMesh){
    let temp = [];
    for (let i = -1; i < 2; i++) {

        for (let j = -1; j < 2; j++) {
            temp.push([Math.floor(highlightMesh.position.x + i),Math.floor(highlightMesh.position.z + j)]);
        }
    }
    return temp;
}
function generateMeshCoordinatesFive(highlightMesh){
    let temp = [];
    for (let i = -2; i < 3; i++) {
        for (let j = -2; j < 3; j++) {
            temp.push([Math.floor(highlightMesh.position.x + i),Math.floor(highlightMesh.position.z + j)]);
        }
    }
    return temp;
}

const highlightMesh = generateMesh(3);

highlightMesh.rotateX(-Math.PI / 2);
highlightMesh.position.set(1.5, 0, 1.5); // Adjust position for a 3x3 grid

const highlightMesh2 = generateMesh(5);

highlightMesh2.rotateX(-Math.PI / 2);
highlightMesh2.position.set(1.5, 0, 1.5);

const mousePosition = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let intersects;

window.addEventListener('mousemove', function (e) {
    mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
    mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;

});

const objects = [];

window.addEventListener('mousedown', function (event) {
    if (event.button === 0) {
        let intersectedObject;
        let isIntersection;
        if (selectionMode == selection.BUILDING_1) {
            isIntersection = isIntersect(grid,generateMeshCoordinatesThree(highlightMesh));
        }
        else if (selectionMode == selection.BUILDING_2) {
            isIntersection = isIntersect(grid,generateMeshCoordinatesFive(highlightMesh2));
        } else if (selectionMode == selection.DELETE) {
             isIntersection = (grid[Math.floor(deleteMesh.position.x) + 31][Math.floor(deleteMesh.position.x) + 31]);
        };
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
                    let building;
                    building = new Building(generateMeshCoordinatesThree(highlightMesh),(Math.floor(doorMesh.position.x),Math.floor(doorMesh.position.z)));
                    addCity(building);
                    for (let i = 0; i < 9; i++) {
                        grid[generateMeshCoordinatesThree(highlightMesh)[i][0] + 31][generateMeshCoordinatesThree(highlightMesh)[i][1] + 31] = true;
                    }
                    scene.add(buildingClone);
                    objects.push(buildingClone);
                    highlightMesh.material.color.setHex(0x00FF00);
                } else if (selectionMode === selection.BUILDING_2) {
                    const building2Clone = fbxObject2.clone();
                    building2Clone.position.copy(highlightMesh2.position);
                    let building;
                    building = new Building(generateMeshCoordinatesFive(highlightMesh2),(Math.floor(doorMesh.position.x),Math.floor(doorMesh.position.z)));
                    addCity(building);
                    for (let i = 0; i < 25; i++) {
                        grid[generateMeshCoordinatesFive(highlightMesh2)[i][0] + 31][generateMeshCoordinatesFive(highlightMesh2)[i][1] + 31] = true;
                    }
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
        case 'e':
            // Rotate highlight mesh to the right (clockwise)
            direction += 1;
            fbxObject.rotateY(-Math.PI / 2);
            fbxObject2.rotateY(-Math.PI / 2);
            break;
        case 'q':
            direction += 3;
            // Rotate highlight mesh to the left (counterclockwise)
            fbxObject.rotateY(+Math.PI / 2);
            fbxObject2.rotateY(+Math.PI / 2);
            break;
    }
});


function animate(time) {
    raycaster.setFromCamera(mousePosition, camera);
    intersects = raycaster.intersectObject(planeMesh);

    if (intersects.length > 0) {
        const intersect = intersects[0];

        let usedHighlight = highlightMesh;
        let gridSize = 3;
        if (selectionMode === selection.BUILDING_2) {
            usedHighlight = highlightMesh2;
            gridSize = 5; // Adjust gridSize for the second building
        }

        // Calculate the center of the 3x3 grid based on the mouse position
        const highlightPos = new THREE.Vector3().copy(intersect.point).floor().addScalar(gridSize / 2 - 1);

        if (selectionMode == selection.BUILDING_1) {
            usedHighlight.position.set(highlightPos.x, 0, highlightPos.z);
            if (direction % 4 == 0) {
                doorMesh.position.set(usedHighlight.position.x, 0, usedHighlight.position.z + 2);
            } else if (direction % 4 == 1) {
                doorMesh.position.set(usedHighlight.position.x - 2, 0, usedHighlight.position.z);
            } else if (direction % 4 == 2) {
                doorMesh.position.set(usedHighlight.position.x, 0, usedHighlight.position.z - 2);
            } else if (direction % 4 == 3) {
                doorMesh.position.set(usedHighlight.position.x + 2, 0, usedHighlight.position.z);
            }
        } else if (selectionMode == selection.BUILDING_2) {
            usedHighlight.position.set(highlightPos.x - 1, 0, highlightPos.z - 1);
            if (usedHighlight.position.z > 28.5){
                usedHighlight.position.z = 28.5
            }
            if (usedHighlight.position.z < -28.5){
                usedHighlight.position.z = -28.5
            }
            if (usedHighlight.position.x > 28.5){
                usedHighlight.position.x = 28.5
            }
            if (usedHighlight.position.x < -28.5){
                usedHighlight.position.x = -28.5
            }
            if (direction % 4 == 0) {
                doorMesh.position.set(usedHighlight.position.x, 0, usedHighlight.position.z + 3);
            } else if (direction % 4 == 1) {
                doorMesh.position.set(usedHighlight.position.x - 3, 0, usedHighlight.position.z);
            } else if (direction % 4 == 2) {
                doorMesh.position.set(usedHighlight.position.x, 0, usedHighlight.position.z - 3);
            } else if (direction % 4 == 3) {
                doorMesh.position.set(usedHighlight.position.x + 3, 0, usedHighlight.position.z);
            }

        } else if (selectionMode == selection.DELETE) {
            deleteMesh.position.set(highlightPos.x, 0, highlightPos.z);
        }
        let isIntersection

        if (selectionMode == selection.BUILDING_1) {
            isIntersection =  isIntersect(grid,generateMeshCoordinatesThree(highlightMesh));
        }
        else if (selectionMode == selection.BUILDING_2) {
            isIntersection =  isIntersect(grid,generateMeshCoordinatesFive(highlightMesh2));
        }
        if (isIntersection) {
            usedHighlight.material.color.setHex(0xFF0000); // Red color for intersection
            doorMesh.material.color.setHex(0xFF0000);
        } else {
            usedHighlight.material.color.setHex(0x00FF00); // Green color for no intersection
            doorMesh.material.color.setHex(0x00FF00);
        }
    }

    orbit.update();
    if (selectionMode === selection.BUILDING_1) {
        scene.remove(highlightMesh2);
        scene.remove(deleteMesh);
        scene.add(doorMesh);
        scene.add(highlightMesh);
    } else if (selectionMode === selection.BUILDING_2) {
        scene.remove(highlightMesh);
        scene.remove(deleteMesh);
        scene.add(doorMesh);
        scene.add(highlightMesh2);
    } else if (selectionMode === selection.DELETE) {
        scene.add(deleteMesh)
        scene.remove(highlightMesh);
        scene.remove(highlightMesh2);
        scene.remove(doorMesh);
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