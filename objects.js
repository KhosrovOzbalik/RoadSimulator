import {Vector2, Vector3, Mesh, PlaneGeometry, MeshBasicMaterial, DoubleSide} from "three";
import {degToRad, radToDeg} from "three/src/math/MathUtils";
import {roads} from "./datas";
//import * as THREE from 'three';

var assetsId = 0;


export class AssetsObject {
    constructor(topLeftGridPos, bottomRightGridPos, fbxObject, selectionMode, scene, assets) {
        this.selectionMode = selectionMode;
        this.fbxObject = fbxObject;
        this.assetsId = assetsId++;
        this.buildedId = 0;
        this.rotationDeg = 0;
        this.occupiedGridPoses = [];
        this.highlightMeshMaterial = new MeshBasicMaterial({
            color: 0xff0000, side: DoubleSide,
            transparent: true
        });
        this.highlightMesh = generateMesh2(topLeftGridPos.x + bottomRightGridPos.x + 1
            , topLeftGridPos.y + bottomRightGridPos.y + 1, this.highlightMeshMaterial);
        this.highlightMesh.visible = false;

        this.highlightMesh.rotateX(-Math.PI / 2);
        this.highlightMesh.geometry.translate((bottomRightGridPos.x - topLeftGridPos.x) / 2.0
            , (topLeftGridPos.y - bottomRightGridPos.y) / 2.0, 0);

        for (let x = -topLeftGridPos.x; x <= bottomRightGridPos.x; x++) {
            for (let z = -topLeftGridPos.y; z <= bottomRightGridPos.y; z++) {
                if (x == 0 && z == 0) {
                    continue;
                }
                this.occupiedGridPoses.push(new Vector2(x, z));
            }
        }
        this.occupiedGridPoses.push(new Vector2(0, 0));
        scene.add(this.highlightMesh);
        assets.push(this);
    }

    RotateCCW(radian) {
        this.rotationDeg = (this.rotationDeg + radToDeg(radian) + 360) % 360;

        this.occupiedGridPoses.forEach(element => {
            element.rotateAround(new Vector2(0, 0), -radian).round();
        });
        this.highlightMesh.rotateZ(radian);
        //FBX OBJESİNİ DE ROTATE ET
        this.fbxObject.rotateOnWorldAxis(new Vector3(0, 1, 0), radian);

    }

    CheckOccupying(mouseVec2, grid) {
        var isIntersect = false;
        for (let i = 0; i < this.occupiedGridPoses.length; i++) {
            var temp = mouseVec2.clone().add(this.occupiedGridPoses[i]);
            //console.log(temp);
            if (temp.y >= grid.length || temp.x >= grid[0].length || temp.y < 0 || temp.x < 0 || grid[temp.y][temp.x]) {
                isIntersect = true;
                break;
            }
        }
        return isIntersect;
    }

    SetOccupying(mouseVec2, grid) {
        for (let i = 0; i < this.occupiedGridPoses.length; i++) {
            var temp = mouseVec2.clone().add(this.occupiedGridPoses[i]);
            grid[temp.y][temp.x] = true;
        }
    }

    SetFree(centerGridPos, grid, rotationDegTemp) {
        let doorPos;
        var newRad = degToRad(parseInt(rotationDegTemp) - this.rotationDeg);
        this.occupiedGridPoses.forEach(element => {
            element.rotateAround(new Vector2(0, 0), -newRad).round();
        });
        for (let i = 0; i < this.occupiedGridPoses.length; i++) {
            var temp = centerGridPos.clone().add(this.occupiedGridPoses[i]);

            grid[temp.y][temp.x] = false;
        }
        doorPos = centerGridPos.clone().add(this.doorGridPos);
        this.occupiedGridPoses.forEach(element => {
            element.rotateAround(new Vector2(0, 0), newRad).round();
        });
        console.log(doorPos);
        return doorPos;
    }
}

export class Building extends AssetsObject {
    constructor(topLeftGridPos, bottomRightGridPos, fbxObject, doorGridPos, selectionMode, scene, assets) {
        super(topLeftGridPos, bottomRightGridPos, fbxObject, selectionMode, scene, assets);
        this.doorGridPos = doorGridPos;
        this.occupiedGridPoses.push(doorGridPos);
        var doorMesh = generateMesh(1, this.highlightMeshMaterial);
        doorMesh.position.set(doorGridPos.x, -doorGridPos.y, 0);
        this.highlightMesh.add(doorMesh);
        this.highlightMesh.visible = false;
    }
}


function generateMesh(size, material) {
    return new Mesh(
        new PlaneGeometry(size, size),
        material);
}

function generateMesh2(size1, size2, material) {
    return new Mesh(
        new PlaneGeometry(size1, size2),
        material);
}

class Road {
    constructor(coords, fbxObject) {
        this.fbxObject = fbxObject;
        this.coords = coords;
    }

}

export function resetRoads() {
    roads.length = 0;
}

export function addRoad(coords, object) {
    roads.push(new Road(coords, object));
}