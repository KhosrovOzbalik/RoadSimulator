import {dijkstra, minimumSpanningTree} from "./algorithmUtilities";

class Graph {
    constructor() {
        this.vertices = {};
    }

    addVertex(vertex) {
        this.vertices[vertex] = [];
    }

    addEdge(vertex1, vertex2, weight) {
        this.vertices[vertex1].push({node: vertex2, weight});
        this.vertices[vertex2].push({node: vertex1, weight});
    }
}

export let grid; // X'e x array
export let graph = new Graph(); // tüm şehirleri birbirine bağlayan graph

let buildings = []; // Şehir array'i

let buildingId = 0;

export function addCity(coords) {
    buildings.push({coords: coords, id: buildingId});
    buildingId += 1;
}

export function removeCity(id) {
    for (let i = 0; i < buildings.length; i++) {
        if (buildings[i].id === id) {
            buildings.splice(i, 1);
            break;
        }
    }
}

export function constructGraph() {
    buildings.forEach((element) => {
        graph.addVertex(element.id);
    });
    connectCities();

    minimumSpanningTree(graph);
}

function connectCities() {
    for (let i = 0; i < buildings.length; i++) {
        for (let j = i; j < buildings.length; j++) {
            if (j === i) continue;
            const city1 = buildings[i];
            const city2 = buildings[j];
            graph.addEdge(city1, city2, dijkstra(grid, city1.coords, city2.coords));
        }
    }
}
