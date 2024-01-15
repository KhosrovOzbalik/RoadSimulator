import {dijkstra, minimumSpanningTree} from "./algorithmUtilities";
import {GRID_SIZE} from "./globals";

class Graph {
    constructor() {
        this.doors = {};
    }

    addVertex(vertex) {
        this.doors[vertex] = [];
    }

    addEdge(vertex1, vertex2, weight) {
        this.doors[vertex1].push({node: vertex2, weight});
        this.doors[vertex2].push({node: vertex1, weight});
    }
}

export let grid = [];
for (let i = 0; i < GRID_SIZE; i++) {
    let gridItem = [];
    for (let j = 0; j < GRID_SIZE; j++) {
        gridItem.push(false);
    }
    grid.push(gridItem);
}

export let graph = new Graph(); // tüm şehirleri birbirine bağlayan graph

let buildings = []; // Şehir array'i

export let roads = [];


export function addCity(doorGridPos,buildingId) {
    //console.log(buildingId);
    buildings.push({door: doorGridPos, id: buildingId});
}

export function removeCity(buildingId) {
    for (let i = 0; i < buildings.length; i++) {
        if (buildings[i].id === buildingId) {
             buildings.splice(i, 1);
            break;
        }
    }
    console.log(buildings);
}

export function constructGraph() {
    graph.doors = {};
    //console.log(graph);
    //console.log("aa");
    //console.log(buildings);
    //console.log("bb");
    buildings.forEach((element) => {

        graph.addVertex(element.id);
    });
    

    if(!connectCities()){
        console.log("optimum yol bulunamadı");
        return null;
    }
    return minimumSpanningTree(graph);
}

function connectCities() {
    for (let i = 0; i < buildings.length; i++) {
        for (let j = i; j < buildings.length; j++) {
            if (j === i) continue;
            const building1 = buildings[i];
            const building2 = buildings[j];
            var dist =  dijkstra(grid, building1.door, building2.door).length;
            if(dist == null){
                return false;
            }
            graph.addEdge(building1.id, building2.id, dist);
            //graph.addEdge(building1.id, building2.id, 5);
        }
    }
    return true;
}






const graphh = new Graph();

graphh.addVertex('A');
graphh.addVertex('B');
graphh.addVertex('C');
graphh.addVertex('D');


graphh.addEdge('A', 'B', 3);
graphh.addEdge('B', 'C', 5);
graphh.addEdge('A', 'C', 2);
graphh.addEdge('A', 'D', 15);
graphh.addEdge('B', 'D', 3);

//console.log(graphh.doors);

const result = minimumSpanningTree(graphh);
//console.log(result);
