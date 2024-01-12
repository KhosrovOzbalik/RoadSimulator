export class MeshObject {
    constructor(positions) {
        this.positions = positions;
    }
}

export class Building extends MeshObject {
    constructor(positions, doorPosition) {
        super(positions);
        this.doorPosition = doorPosition;
    }
}