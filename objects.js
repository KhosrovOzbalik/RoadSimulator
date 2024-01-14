import { Vector2 ,Mesh,PlaneGeometry,MeshBasicMaterial,DoubleSide} from "three";
//import * as THREE from 'three';

export class AssetsObject {
    constructor(topLeftGridPos,bottomRightGridPos,fbxObject) {
        this.fbxObject = fbxObject;
        this.occupiedGridPoses = [];
        this.centerGridPos = new Vector2(0,0);
        this.highlightMeshMaterial = new MeshBasicMaterial({ color: 0xff0000 ,side: DoubleSide,
            transparent: true});
        this.highlightMesh =generateMesh2(topLeftGridPos.x + bottomRightGridPos.x + 1
            , topLeftGridPos.y + bottomRightGridPos.y + 1,this.highlightMeshMaterial); 
        
        this.highlightMesh.rotateX(-Math.PI / 2);
        this.highlightMesh.geometry.translate( (bottomRightGridPos.x-topLeftGridPos.x)/2.0  
                                            ,(topLeftGridPos.y-bottomRightGridPos.y)/2.0 ,0);

        for (let x = -topLeftGridPos.x; x <= bottomRightGridPos.x; x++) {
            for (let z = -topLeftGridPos.y; z <= bottomRightGridPos.y; z++) {
                if(x== 0 && z==0){
                    continue;
                }
                this.occupiedGridPoses.push(new Vector2(x,z));
            }            
        }
        this.occupiedGridPoses.push(new Vector2(0,0));
    }

    RotateCCW(radian) {
        this.occupiedGridPoses.forEach(element => {
            element.rotateAround(new Vector2(0,0),radian).round();
        });
        this.highlightMesh.rotateZ(radian);
        //FBX OBJESİNİ DE ROTATE ET
    }

    CheckIntersecting(mouseVec2,grid){
        var isIntersect = false;
        for (let i = 0; i < this.occupiedGridPoses.length; i++) {
            var temp = mouseVec2.clone().add(this.occupiedGridPoses[i]);
            if(temp.y >= grid.length || temp.x >= grid[0].length || temp.y<0 || temp.x<0 || grid[temp.y][temp.x]){
                isIntersect = true;
                break; 
            }
        }
        return isIntersect;
    }
}

export class Building extends AssetsObject {
    constructor(topLeftGridPos,bottomRightGridPos,fbxObject, doorGridPos) {
        super(topLeftGridPos,bottomRightGridPos,fbxObject);
        this.doorGridPos = doorGridPos;
        this.occupiedGridPoses.push(doorGridPos);
        var doorMesh = generateMesh(1,this.highlightMeshMaterial);
        doorMesh.position.set(doorGridPos.x,-doorGridPos.y,0);
        this.highlightMesh.add(doorMesh);
    }   
}

function generateMesh(size,material) {
    return new Mesh(
        new PlaneGeometry(size, size), // Change size to represent a 3x3 grid
        material);
}

 function generateMesh2(size1,size2,material) {
    return new Mesh(
        new PlaneGeometry(size1, size2), // Change size to represent a 3x3 grid
        material);
}
