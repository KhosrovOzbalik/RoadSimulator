import * as THREE from "three";
import TWEEN from '@tweenjs/tween.js'
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";
import {FBXLoader} from "three/examples/jsm/loaders/FBXLoader";
import { TransformControls } from 'three/addons/controls/TransformControls.js';

import {GRID_SIZE, selection} from "./globals";
import {resetRoads, addRoad, AssetsObject, Building,Road} from "./objects";
import {addCity, graph, grid, removeCity, constructGraph, roads, buildings} from "./datas";
import { dijkstra } from "./algorithmUtilities";

const renderer = new THREE.WebGLRenderer({canvas: canvas});

renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

const selectYellowBtn = document.getElementById("selectYellow");
const selectWhiteBtn = document.getElementById("selectWhite");
const selectRockBtn = document.getElementById("selectRock");
const selectTreeBtn = document.getElementById("selectTree");
const selectDeleteBtn = document.getElementById("selectDelete");
const generateBtn = document.getElementById("generate");

// Flag to indicate the current selection mode
let selectionMode = selection.BUILDING_1; // Default to yellow cube

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

selectDeleteBtn.addEventListener("click", function () {
    selectionMode = selection.DELETE;
    console.log("Selected: Delete");
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
    '2.jpg', '4.jpg', '1.jpg', '6.jpg', '5.jpg', '3.jpg',
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
    new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        visible: true,
        color: "green",
    })
);
planeMesh.position.set(GRID_SIZE / 2.0 - 0.5, 0, GRID_SIZE / 2.0 - 0.5,);
planeMesh.rotateX(-Math.PI / 2);
scene.add(planeMesh);

const gridHelper = new THREE.GridHelper(GRID_SIZE, GRID_SIZE); // Change size to represent a 3x3 grid
gridHelper.position.set(GRID_SIZE / 2.0 - 0.5, 0.01, GRID_SIZE / 2.0 - 0.5);
scene.add(gridHelper);

const light = new THREE.PointLight(0xffffff, 50);
light.position.set(30, 20, 30);
//scene.add(light);

const ambientLight = new THREE.AmbientLight();
ambientLight.position.set(30, 20, 30);
scene.add(ambientLight);

const assets = [];

var denemefbxObject = new AssetsObject(
    new THREE.Vector2(1, 1),
    new THREE.Vector2(1, 1),
    null,
    selection.BUILDING_1,
    scene,
    assets
);
/*
new Building(
    new THREE.Vector2(1, 1),
    new THREE.Vector2(1, 1),
    null,
    new THREE.Vector2(0, 2),
    selection.BUILDING_1,
    scene,
    assets
);*/
var denemefbxObject2 = new Building(
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
    //object.type = "assets";
    //console.log(object.type);

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
    });
    object.remove(light, tas, yol);
    denemefbxObject.fbxObject = object.clone();
});


var yolFbxObject = new AssetsObject(
    new THREE.Vector2(0,0),
    new THREE.Vector2(0,0),
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
        if(child.type == "PointLight")
        {
          light = child;
        }
    })
    object.remove(light);
    yolFbxObject.fbxObject = object.clone();
    
})

fbxLoader.load("Assets/building.fbx", (object) => {
    //console.log(object);
//    object.type = "assets";
    object.scale.set(0.025, 0.03, 0.05);
    denemefbxObject2.fbxObject = object.clone();
});

const mousePosition = new THREE.Vector2();
window.addEventListener("mousemove", function (e) {
    //console.log(e.clientX-120);
    mousePosition.x = ((e.clientX-120) / window.innerWidth) * 2 - 1;
    mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;
    //mousePosition.x = (e.clientX / canvas.width) * 2 - 1;
    //mousePosition.y = -(e.clientY / canvas.height) * 2 + 1;
   // console.log(window.innerWidth, canvas.width);
});



const controls = new TransformControls(camera, renderer.domElement);
//controls.attach(cube);
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
window.addEventListener("mousedown", function (event) {
    event.stopImmediatePropagation();
    if (event.button === 0) {
        //console.log("lan");
        aa = true;
        raycaster.setFromCamera(mousePosition, camera);
        intersects = raycaster.intersectObject(planeMesh);
        

        if (intersects.length > 0) {
            const intersect = intersects[0];
            //console.log(intersect.point.round());
            var mousePosOnGrid = new THREE.Vector2(
                intersect.point.x,
                intersect.point.z
            ).round();
            var isIntersect = selectedAssetsObject.CheckOccupying(
                mousePosOnGrid,
                grid
            );
            //console.log(isIntersect);
            if (!isIntersect) {
                //console.log("inşaa");
                const buildingClone = selectedAssetsObject.fbxObject.clone();
                buildingClone.name ="Deletable"+selectedAssetsObject.constructor.name+" "+
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
                selectedAssetsObject.SetOccupying(mousePosOnGrid, grid);
                //console.log(mousePosOnGrid.clone().add(selectedAssetsObject.doorGridPos));
                
                //console.log(buildingClone.name);
                //console.log(selectedAssetsObject.constructor.name);
                if(selectedAssetsObject.constructor.name == "Building"){
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
            }
        }
    } else if (event.button === 1) {
        raycaster.setFromCamera(mousePosition, camera);
        intersects = raycaster.intersectObjects(scene.children.
            filter((element) => element.name.split(" ")[0] == "DeletableAssetsObject" ||element.name.split(" ")[0] == "DeletableBuilding" ));
       
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

            if(par.name.split(" ")[0] == "DeletableBuilding"){
                
                doorPoses = doorPoses.filter((element) => {
                    return element.x != doorPosV2.x || element.y != doorPosV2.y;
                });
                removeCity(par.name);
            }
            

            scene.remove(par);
            canTotoroSpawn = false;
            
            //console.log(graph);
        }
    } else if (event.button === 2) {
    }
});
window.addEventListener("contextmenu", function (event) {
    // event.preventDefault();
});

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
            selectedAssetsObject.RotateCCW(-Math.PI / 2);
            break;
        case "q":
            selectedAssetsObject.RotateCCW(Math.PI / 2);
            break;
        case "z":
            if(canTotoroSpawn){
                Totoro();
            }            
            break;
    }
});

var start = 0;

function animate(time) {
    //console.log(1000/(time-start));
    start = time;
    raycaster.setFromCamera(mousePosition, camera);
    intersects = raycaster.intersectObject(planeMesh);

    if (intersects.length > 0) {
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
    } else {
        selectedAssetsObject.highlightMesh.visible = false;
    }

    orbit.update();
    TWEEN.update();

    selectedAssetsObject.highlightMesh.material.opacity =
        1 + Math.sin(time / 120);


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
                .to( { y:-2 }, 1000)
                .start().onComplete(()=>{scene.remove(element);})
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
            console.log(node1);
            let building1 = buildings.find(building => building.id === node1);
            let building2 = buildings.find(building => building.id === node2);
            //console.log(building1.door,building2.door);
            var dijkstraResult = dijkstra(grid,building1.door,building2.door).path;
            for (let i = 0; i < dijkstraResult.length; i++) {
                const element = dijkstraResult[i];
                const yoll = yolFbxObject.fbxObject.clone();
                yoll.position.set(element[1],10,element[0]);
                scene.add(yoll);
                new TWEEN.Tween(yoll.position)
                .to( { y:0.1 }, 1000)
                .start()
                ;
                var tempScale = yoll.scale.clone();
                yoll.scale.set(0,0,0);
                
                new TWEEN.Tween(yoll.scale)
                .to({ x:tempScale.x,y:tempScale.y,z:tempScale.z}, 1000)
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

function Totoro(){
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
        if(firstBuilding == null){
            firstBuilding = par;
        }
        else if(secondBuilding == null){
            secondBuilding = par;
        }

        if(firstBuilding != null && secondBuilding != null){
            CreateTotoro(firstBuilding,secondBuilding);
            firstBuilding = null;
            secondBuilding = null;

        }
    }
}

async function CreateTotoro(b1,b2){
    //console.log(roads);
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


    var dijkstraResult = dijkstra(gridRoadMap,building1.door,building2.door).path;
    //console.log(dijkstraResult);

    const totoro = yolFbxObject.fbxObject.clone();
    totoro.position.set(dijkstraResult[0][1],1,dijkstraResult[0][0]);
    scene.add(totoro);
    var oneGridWalkTimeMS = 100;



    for (let i = 1; i < dijkstraResult.length; i++) {
        new TWEEN.Tween(totoro.position)
            .to({ x:dijkstraResult[i][1], y:1, z:dijkstraResult[i][0]}, oneGridWalkTimeMS)
            .start();
        await timer(oneGridWalkTimeMS);
    }

}
