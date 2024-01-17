import * as THREE from "three";
import TWEEN from '@tweenjs/tween.js'
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";
import {FBXLoader} from "three/examples/jsm/loaders/FBXLoader";
import {TransformControls} from 'three/addons/controls/TransformControls.js';

import {GRID_SIZE, selection} from "./globals";
import {resetRoads, addRoad, AssetsObject, Building, Road} from "./objects";
import {addCity, graph, grid, removeCity, constructGraph, roads, buildings} from "./datas";
import {dijkstra} from "./algorithmUtilities";
import {toonVertexShader, havaliVertexShader} from "./Shaders/toonVertexShader";
import {toonFragmentShader, havaliFragmentShader} from "./Shaders/toonFragmentShader";
import {degToRad} from "three/src/math/MathUtils";

const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;


renderer.setSize(window.innerWidth, window.innerHeight);
//console.log(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const selectYellowBtn = document.getElementById("selectYellow");
const selectWhiteBtn = document.getElementById("selectWhite");
const selectRockBtn = document.getElementById("selectRock");
const selectTreeBtn = document.getElementById("selectTree");
const generateBtn = document.getElementById("generate");

// Flag to indicate the current selection mode
let selectionMode = null; // Default to yellow cube

// Event listeners for UI buttons
selectYellowBtn.addEventListener("click", function () {
    selectionMode = selection.BUILDING_1;
    selectedAssetsObject = FindSelectedAssetsObject();
    console.log("Selected: Yellow Cube");
});

selectWhiteBtn.addEventListener("click", function () {
    selectionMode = selection.BUILDING_2;
    selectedAssetsObject = FindSelectedAssetsObject();
    console.log("Selected: White Cube");
});
selectRockBtn.addEventListener("click", function () {
    selectionMode = selection.ROCK;
    selectedAssetsObject = FindSelectedAssetsObject();
    console.log("Selected: Rock");
});
selectTreeBtn.addEventListener("click", function () {
    selectionMode = selection.TREE;
    selectedAssetsObject = FindSelectedAssetsObject();
    console.log("Selected: Tree");
});

generateBtn.addEventListener("click", function () {
    generate();
});

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const loader = new THREE.CubeTextureLoader();
loader.setPath("Assets/skybox/");

const textureCube = loader.load([
    '4.jpg', '2.jpg', '1.jpg', '6.jpg', '3.jpg', '5.jpg',
]);
scene.background = textureCube;

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
orbit.target.set(GRID_SIZE / 2.0 - 0.5, 0, GRID_SIZE / 2.0 - 0.5);

camera.position.set(30, 50, 60);

orbit.update();

const planeMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE), // Change size to represent a 3x3 grid
    new THREE.MeshPhongMaterial({
        side: THREE.DoubleSide,
        visible: true,
        color: "#66cdaa",
    })
);
planeMesh.receiveShadow = true;
planeMesh.name = "PlaneMesh";

planeMesh.position.set(GRID_SIZE / 2.0 - 0.5, 0, GRID_SIZE / 2.0 - 0.5,);
planeMesh.rotateX(-Math.PI / 2);
scene.add(planeMesh);
var clonePlaneMesh = planeMesh.clone();
clonePlaneMesh.name = "aa";
clonePlaneMesh.position.set(GRID_SIZE / 2.0 - 0.5, 0, GRID_SIZE / 2.0 - 0.5);
clonePlaneMesh.scale.set(3,3,3);
scene.add(clonePlaneMesh);
    


const gridHelper = new THREE.GridHelper(GRID_SIZE, GRID_SIZE); // Change size to represent a 3x3 grid
gridHelper.position.set(GRID_SIZE / 2.0 - 0.5, 0.01, GRID_SIZE / 2.0 - 0.5);
scene.add(gridHelper);

const mousePosition = new THREE.Vector2();

const assets = [];

var building1AssetsObject =
    new Building(
        new THREE.Vector2(1, 1),
        new THREE.Vector2(1, 1),
        null,
        new THREE.Vector2(0, 2),
        selection.BUILDING_1,
        scene,
        assets
    );
var building2AssetsObject = new Building(
    new THREE.Vector2(2, 2),
    new THREE.Vector2(2, 2),
    null,
    new THREE.Vector2(0, 3),
    selection.BUILDING_2,
    scene,
    assets
);

var selectedAssetsObject = FindSelectedAssetsObject();

const fbxLoader = new FBXLoader();
fbxLoader.load("Assets/evyeni/ev.fbx", (object) => {
    object.scale.set(0.005, 0.01, 0.005);
    object.rotateY(-Math.PI / 2);

    let light;
    let yol;
    let tas;
    object.traverse(function (child) {
        //console.log(child);
        if (child.type == "DirectionalLight") {
            light = child;
        } else if (child.name == "yol") {
            yol = child;
        } else if (child.name == "taslar") {
            tas = child;
        }
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

        }
    });
    object.remove(light, tas, yol);
    object.castShadow = true;
    object.receiveShadow = true;
    building1AssetsObject.fbxObject = object.clone();
    //building1AssetsObject.fbxObject.material = toonMat;
    //console.log(building1AssetsObject.fbxObject );
});


var uniformsA = {
    u_lightPower: {type: "f", value: 1000.0},
    u_limit: {type: "f", value: Math.cos(degToRad(60.0))},
    u_lightDirection: {type: "v3", value: new THREE.Vector3()},
    u_lightWorldPosition: {type: "v3", value: new THREE.Vector3()},
    u_viewWorldPosition: {type: "v3", value: new THREE.Vector3()},
};
const toonMat = new THREE.ShaderMaterial({
    uniforms: uniformsA,
    vertexShader: toonVertexShader,
    fragmentShader: toonFragmentShader
});


var uniformsB = {
    u_time: {type: "f", value: 0.0}
};
const havaliMat = new THREE.ShaderMaterial({
    uniforms: uniformsB,
    vertexShader: havaliVertexShader,
    fragmentShader: havaliFragmentShader
});


var yolFbxObject = new AssetsObject(
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0, 0),
    null,
    null,
    scene,
    assets
);

fbxLoader.load('Assets/yolyeni/yeniyol.fbx', (object) => {
    object.scale.set(.005, .005, .005);
    let light;
    object.traverse(function (child) {

        //console.log(child);
        if (child.type == "PointLight") {
            light = child;
        }
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    })
    object.remove(light);
    object.receiveShadow = true;
    object.castShadow = true;
    yolFbxObject.fbxObject = object.clone();

})


fbxLoader.load("Assets/building1/building.fbx", (object) => {

    object.scale.set(0.025, 0.03, 0.05);
    object.traverse(function (child) {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    })
    object.receiveShadow = true;
    object.castShadow = true;
    building2AssetsObject.fbxObject = object.clone();
});


let totoroFBXObject;
fbxLoader.load("Assets/totoro/totoro.fbx", (object) => {
    //object.position.set(30,0,30);
    object.scale.set(0.005, 0.005, 0.005);
    let light;
    let cam;
    object.traverse(function (child) {

        //console.log(child.type);
        if (child.type == "PointLight") {
            light = child;
        } else if (child.type == "PerspectiveCamera") {
            cam = child;
        }
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    })
    object.remove(light, cam);
    object.castShadow = true;
    object.receiveShadow = true;
    totoroFBXObject = object.clone();
    //scene.add(totoroFBXObject);
});


var dagFbxObject = new AssetsObject(
    new THREE.Vector2(2, 2),
    new THREE.Vector2(2, 2),
    null,
    selection.ROCK,
    scene,
    assets
);



fbxLoader.load('Assets/rock/rock.fbx', (object) => {

    //console.log(object);
    let light;
    let cam;
    object.traverse(function (child) {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
        if (child.type == "PointLight") {
            light = child;
        } else if (child.type == "PerspectiveCamera") {
            cam = child;
        }
        
    })
    object.remove(light, cam);
    //object.rotateX(-Math.PI / 2);
    object.scale.set(.008, .008, .008);
    object.receiveShadow = true;
    object.castShadow = true;
    dagFbxObject.fbxObject = object.clone();
    //scene.add(object);
    //object.position.set(30,0,30);

})

var treeFbxObject =  new AssetsObject(
    new THREE.Vector2(1, 1),
    new THREE.Vector2(1, 1),
    null,
    selection.TREE,
    scene,
    assets
);

let controalbleTreeFBX ;

fbxLoader.load('Assets/agac/tree.fbx', (object) => {
    let light;
    let cam;
    //console.log(object);
    object.traverse(function (child) {
        //console.log(child);
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
        if (child.type == "PointLight") {
            light = child;
        } else if (child.type == "PerspectiveCamera") {
            cam = child;
        }
    })
    //object.rotateX(-Math.PI / 2);
    object.scale.set(.015, .015, .015);
    object.receiveShadow = true;
    object.castShadow = true;
    object.remove(light, cam);
    treeFbxObject.fbxObject = object.clone();
    controalbleTreeFBX = object.clone();
    controalbleTreeFBX.name = "Controlable Tree";

    for (let i = 0; i < 80; i++) {
        
        var randX = Math.random()*180-60;
        var randZ = Math.random()*180 -60;
        if(randX>0 && randX<60 && randZ>0 && randZ<60){
            continue;
        }

        var cloneTree = controalbleTreeFBX.clone();
        cloneTree.position.set(randX,0,randZ);
        allMatObjs.push(cloneTree);
        scene.add(cloneTree);
    }

})


let cloudFbxObject1;
fbxLoader.load('Assets/cloud/cloud1.fbx', (object) => {
    let light;
    let cam;
    //console.log(object);
    object.traverse(function (child) {
        //console.log(child);
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
        if (child.type == "PointLight") {
            light = child;
        } else if (child.type == "PerspectiveCamera") {
            cam = child;
        }
    })
    //object.rotateX(-Math.PI / 2);
    object.scale.set(.01, .01, .01);
    object.receiveShadow = true;
    object.castShadow = true;
    object.remove(light, cam);
    cloudFbxObject1 = object.clone();
    cloudFbxObject1.name = "Controlable Cloud1";
    scene.add(cloudFbxObject1);
    cloudFbxObject1.position.set(30,10,30);
    allMatObjs.push(cloudFbxObject1);

    var clone2 = cloudFbxObject1.clone();
    scene.add(clone2);
    clone2.position.set(50,10,50);
    allMatObjs.push(clone2);
})

let rock;
fbxLoader.load('Assets/dag/dag.fbx', (object) => {
    let light;
    let cam;
    //console.log(object);
    object.traverse(function (child) {
        console.log(child);
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
        if (child.type == "PointLight") {
            light = child;
        } else if (child.type == "PerspectiveCamera") {
            cam = child;
        }
    })
    object.rotateX(-Math.PI / 2);
    object.scale.set(.01, .01, .01);
    object.receiveShadow = true;
    object.castShadow = true;
    object.remove(light, cam);
    rock = object.clone();
    rock.name = "Controlable Mountain";
    scene.add(rock);
    rock.position.set(-30,15,-30);
    allMatObjs.push(rock);

    var clone2 = rock.clone();
    scene.add(clone2);
    clone2.position.set(90,15,90);
    allMatObjs.push(clone2);
})




window.addEventListener("mousemove", function (e) {
    //console.log(e.clientX-120);
    mousePosition.x = ((e.clientX - 120) / window.innerWidth) * 2 - 1;
    mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;


    //mousePosition.x = (e.clientX / canvas.width) * 2 - 1;
    //mousePosition.y = -(e.clientY / canvas.height) * 2 + 1;
    // console.log(window.innerWidth, canvas.width);
});


/*
const pointLight = new THREE.PointLight(0xff0000, 500);
pointLight.position.set(30, 20, 30);
scene.add(pointLight);*/

const ambientLight = new THREE.AmbientLight();
ambientLight.position.set(30, 20, 30);
scene.add(ambientLight);

const spotLight = new THREE.SpotLight(0xffffff, 1000);
spotLight.castShadow = true;
spotLight.shadow.camera.near = 10;
spotLight.shadow.camera.far = 100;
spotLight.shadow.camera.left = -50;
spotLight.shadow.camera.right = 50;
spotLight.shadow.camera.top = 50;
spotLight.shadow.camera.bottom = -50;
spotLight.name = "SpotLight";
scene.add(spotLight);
const spotLightTarget = new THREE.Object3D();
scene.add(spotLightTarget);
spotLight.target = spotLightTarget;
const cone = new THREE.Mesh(new THREE.ConeGeometry(6 / Math.sqrt(3), 2, 32), new THREE.MeshBasicMaterial({
    color: 0xffff00,
    side: THREE.FrontSide
}));
scene.add(cone);
cone.add(spotLightTarget);
cone.add(spotLight);
cone.position.set(30, 20, 30);
cone.name = "Controlable SpotLight";


const controls = new TransformControls(camera, renderer.domElement);
//controls.attach(cone);
//controls.object = planeMesh;
//control
scene.add(controls);





function FindSelectedAssetsObject() {
    if (selectedAssetsObject != null) {
        selectedAssetsObject.highlightMesh.visible = false;
    }

    let selectedAssetsObjectTemp;
    for (let i = 0; i < assets.length; i++) {
        if (selectionMode == assets[i].selectionMode) {
            //console.log("aaa");
            selectedAssetsObjectTemp = assets[i];
            //console.log(selectedAssetsObject.fbxObject);
            break;
        }
    }
    return selectedAssetsObjectTemp;
}


export var doorPoses = [];
const raycaster = new THREE.Raycaster();
let intersects;
var aa = false;
var canTotoroSpawn = false;
var allMatObjs = [];



window.addEventListener("mousedown", function (event) {
    event.stopImmediatePropagation();
    if (event.button === 0) {
        //console.log("lan");
        aa = true;
        raycaster.setFromCamera(mousePosition, camera);
        if (controls.dragging) {
            return;
        }
        intersects = raycaster.intersectObjects(scene.children.filter((element) => element.name == "PlaneMesh" || element.name.split(" ")[0] == "Controlable"));


        if (intersects.length > 0) {
            var par = intersects[0].object;
            while (par.parent.type !== "Scene") {
                par = par.parent;
            }
            if (par.name == "PlaneMesh" && selectionMode != null) {
                var mousePosOnGrid = new THREE.Vector2(
                    intersects[0].point.x,
                    intersects[0].point.z
                ).round();
                var isIntersect = selectedAssetsObject.CheckOccupying(
                    mousePosOnGrid,
                    grid
                );
                //console.log(isIntersect);
                if (!isIntersect) {
                    //console.log("inşaa");
                    const buildingClone = selectedAssetsObject.fbxObject.clone();
                    buildingClone.name = "Deletable" + selectedAssetsObject.constructor.name + " " +
                        selectedAssetsObject.assetsId +
                        " " +
                        selectedAssetsObject.buildedId++ +
                        " " +
                        selectedAssetsObject.rotationDeg;
                    //console.log(buildingClone.name);
                    buildingClone.position.set(
                        mousePosOnGrid.x,
                        0,
                        mousePosOnGrid.y
                    );
                    scene.add(buildingClone);
                    allMatObjs.push(buildingClone);
                    selectedAssetsObject.SetOccupying(mousePosOnGrid, grid);
                    //console.log(mousePosOnGrid.clone().add(selectedAssetsObject.doorGridPos));

                    //console.log(buildingClone.name);
                    //console.log(selectedAssetsObject.constructor.name);
                    if (selectedAssetsObject.constructor.name == "Building") {
                        doorPoses.push(
                            mousePosOnGrid.clone().add(selectedAssetsObject.doorGridPos)
                        );
                        addCity(
                            mousePosOnGrid
                                .clone()
                                .add(selectedAssetsObject.doorGridPos),
                            buildingClone.name
                        );
                    }

                    canTotoroSpawn = false;
                    //console.log(graph);
                    controls.detach(controls.object);
                }
            } else if (par.name.split(" ")[0] == "Controlable") {
                //console.log("contrll");
                controls.attach(par);
                selectionMode = null;
            } else {
                controls.detach(controls.object);
            }
        } else {
            controls.detach(controls.object);
        }
    } else if (event.button === 1) {
        raycaster.setFromCamera(mousePosition, camera);
        intersects = raycaster.intersectObjects(scene.children.filter((element) => element.name.split(" ")[0] == "DeletableAssetsObject" || element.name.split(" ")[0] == "DeletableBuilding"));

        if (intersects.length > 0) {
            //console.log(intersects[0]);
            var par = intersects[0].object;
            while (par.parent.type !== "Scene") {
                par = par.parent;
            }
            //console.log(doorPoses);

            var doorPosV2 = assets[parseInt(par.name.split(" ")[1])].SetFree(
                new THREE.Vector2(par.position.x, par.position.z),
                grid,
                par.name.split(" ")[3],
                1
            );

            if (par.name.split(" ")[0] == "DeletableBuilding") {

                doorPoses = doorPoses.filter((element) => {
                    return element.x != doorPosV2.x || element.y != doorPosV2.y;
                });
                removeCity(par.name);
            }


            scene.remove(par);
            allMatObjs = allMatObjs.filter(
                (element) => element != par);
            canTotoroSpawn = false;

            //console.log(graph);
        }
    } else if (event.button === 2) {
    }
});
window.addEventListener("contextmenu", function (event) {
    // event.preventDefault();
});

var spotlightState = 0;
var modes = ["translate", "rotate"];
var modeIndex = 0;
var shaderIndex = 0;
var shadersMat = [toonMat,havaliMat];
window.addEventListener("keydown", function (event) {
    event.stopImmediatePropagation();
    //console.log("tuşa basıldı");
    switch (event.key) {
        case "w":
            // Move camera forward
            camera.position.z -= 1;
            break;
        case "s":
            // Move camera backward
            camera.position.z += 1;
            break;
        case "a":
            // Move camera left
            camera.position.x -= 1;
            break;
        case "d":
            // Move camera right
            camera.position.x += 1;
            break;
        case "e":
            if(selectedAssetsObject == null){
                break;
            }
            selectedAssetsObject.RotateCCW(-Math.PI / 2);
            break;
        case "q":
            if(selectedAssetsObject == null){
                break;
            }
            selectedAssetsObject.RotateCCW(Math.PI / 2);
            break;
        case "z":
            if (canTotoroSpawn) {
                Totoro();
            }
            break;
        case "x":
            if (controls.object != null && controls.object.name == "Controlable SpotLight" && controls.object.getObjectByName("SpotLight") != null) {
                console.log("aaa");
                var spot = controls.object.getObjectByName("SpotLight");
                spot.intensity += 100;
                if (spot.intensity > 2000) {
                    spot.intensity = 2000;
                }

                uniformsA.u_lightPower.value = (spot.intensity * 1.0);
            }
            break;
        case "c":
            if (controls.object != null && controls.object.name == "Controlable SpotLight" && controls.object.getObjectByName("SpotLight") != null) {
                var spot = controls.object.getObjectByName("SpotLight");
                spot.intensity -= 100;
                if (spot.intensity < 0) {
                    spot.intensity = 0;
                }
                uniformsA.u_lightPower.value = (spot.intensity * 1.0);
            }
            break;
        case "r":
            controls.mode = modes[(modeIndex++) % modes.length];
            break;
        case "p":
            console.log("aa");
            shaderIndex  = (++shaderIndex)%shadersMat.length;
            for (let id = 0; id < allMatObjs.length; id++) {
                const element = allMatObjs[id];
                element.traverse(function (child) {
                    if(child.isMesh){
                        child.material = shadersMat[shaderIndex];
                    }
                });
                
            }
            break;
        case "k":
            spotLight.visible = !spotLight.visible;
            break;
    }
});

var start = 0;
var clock = new THREE.Clock(true);

function animate(time) {

    uniformsB.u_time.value = clock.getElapsedTime();


    let spotLightWorld = new THREE.Vector3();
    spotLight.getWorldPosition(spotLightWorld);

    let spotLightTargetWorld = new THREE.Vector3();
    spotLightTarget.getWorldPosition(spotLightTargetWorld);
    var lightDirWorld = spotLightTargetWorld.clone().sub(spotLightWorld).normalize();

    //console.log(aaa);
    //console.log(camera.position);
    uniformsA.u_lightDirection.value.set(lightDirWorld.x, lightDirWorld.y, lightDirWorld.z);
    uniformsA.u_lightWorldPosition.value.set(cone.position.x, cone.position.y, cone.position.z);
    uniformsA.u_viewWorldPosition.value.set(camera.position.x, camera.position.y, camera.position.z);


    start = time;
    raycaster.setFromCamera(mousePosition, camera);
    intersects = raycaster.intersectObjects(scene.children.filter(
        (element) => element.name == "PlaneMesh"));


    if (intersects.length > 0 && selectionMode != null) {
        selectedAssetsObject.highlightMesh.visible = true;
        const intersect = intersects[0];
        var mousePosOnGrid = new THREE.Vector2(
            intersect.point.x,
            intersect.point.z
        ).round();
        selectedAssetsObject.highlightMesh.position.set(
            mousePosOnGrid.x,
            0.1,
            mousePosOnGrid.y
        );

        if (selectedAssetsObject.CheckOccupying(mousePosOnGrid, grid)) {
            selectedAssetsObject.highlightMeshMaterial.color.set(0xff0000);
        } else {
            selectedAssetsObject.highlightMeshMaterial.color.set(0x00ff00);
        }
    } else if (selectedAssetsObject != null) {
        selectedAssetsObject.highlightMesh.visible = false;
    }

    orbit.update();
    TWEEN.update();
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


const timer = ms => new Promise(res => setTimeout(res, ms));

const generate = async () => {
    //resetRoads();

    for (let i = 0; i < roads.length; i++) {
        const element = roads[i];
        new TWEEN.Tween(element.position)
            .to({y: -2}, 1000)
            .start().onComplete(() => {
            scene.remove(element);
        })
        ;
    }
    roads.length = 0;


    var mst = constructGraph();
    if (mst != null) {
        //console.log(mst);
        for (let i = 0; i < mst.length; i++) {
            const yol = mst[i];
            let node1 = yol.node1;
            let node2 = yol.node2;
            //console.log(node1);
            let building1 = buildings.find(building => building.id === node1);
            let building2 = buildings.find(building => building.id === node2);
            //console.log(building1.door,building2.door);
            var dijkstraResult = dijkstra(grid, building1.door, building2.door).path;
            for (let i = 0; i < dijkstraResult.length; i++) {
                const element = dijkstraResult[i];
                const yoll = yolFbxObject.fbxObject.clone();
                yoll.position.set(element[1], 10, element[0]);
                scene.add(yoll);
                new TWEEN.Tween(yoll.position)
                    .to({y: 0.1}, 1000)
                    .start()
                ;
                var tempScale = yoll.scale.clone();
                yoll.scale.set(0, 0, 0);

                new TWEEN.Tween(yoll.scale)
                    .to({x: tempScale.x, y: tempScale.y, z: tempScale.z}, 1000)
                    .start()
                ;
                roads.push(yoll);
                await timer(100);

            }
        }
        canTotoroSpawn = true;
    }
};


var firstBuilding = null;
var secondBuilding = null;

function Totoro() {
    raycaster.setFromCamera(mousePosition, camera);
    intersects = raycaster.intersectObjects(
        scene.children.filter((element) => element.name.split(" ")[0] == "DeletableBuilding")
    );
    if (intersects.length > 0) {
        var par = intersects[0].object;
        while (par.parent.type !== "Scene") {
            par = par.parent;
        }
        //console.log(par);
        if (firstBuilding == null) {
            firstBuilding = par;
        } else if (secondBuilding == null && par != firstBuilding) {
            secondBuilding = par;
        }

        if (firstBuilding != null && secondBuilding != null) {
            CreateTotoro(firstBuilding, secondBuilding);
            firstBuilding = null;
            secondBuilding = null;

        }
    }
}

async function CreateTotoro(b1, b2) {

    let building1 = buildings.find(building => building.id === b1.name);
    let building2 = buildings.find(building => building.id === b2.name);

    var gridRoadMap = [];
    for (let i = 0; i < GRID_SIZE; i++) {
        let gridItem = [];
        for (let j = 0; j < GRID_SIZE; j++) {
            gridItem.push(true);
        }
        gridRoadMap.push(gridItem);
    }
    //console.log(gridRoadMap);
    for (let i = 0; i < roads.length; i++) {
        const element = roads[i].position;
        gridRoadMap[element.z][element.x] = false;

    }
    //console.log(gridRoadMap);


    var dijkstraResult = dijkstra(gridRoadMap, building1.door, building2.door).path;
    //console.log(dijkstraResult);

    const totoro = totoroFBXObject.clone();
    totoro.position.set(dijkstraResult[0][1], 0, dijkstraResult[0][0]);
    var tempScale = totoro.scale.clone();
    //console.log(tempScale);
    totoro.scale.set(0, 0, 0);
    scene.add(totoro);
    var oneGridWalkTimeMS = 100;
    var scalingTimeMS = 100;
    new TWEEN.Tween(totoro.scale)
        .to({x: tempScale.x, y: tempScale.y, z: tempScale.z}, scalingTimeMS)
        .start();
    await timer(scalingTimeMS);

    //console.log(totoro.scale);

    for (let i = 1; i < dijkstraResult.length; i++) {
        new TWEEN.Tween(totoro.position)
            .to({x: dijkstraResult[i][1], y: 0, z: dijkstraResult[i][0]}, oneGridWalkTimeMS)
            .start();
        await timer(oneGridWalkTimeMS);
    }
    //console.log("bb");
    new TWEEN.Tween(totoro.scale)
        .to({x: 0, y: 0, z: 0}, scalingTimeMS)
        .start().onComplete(() => {
        scene.remove(totoro);
    });
    totoro.scale.set(tempScale);


}
