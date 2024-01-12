import {dijkstra, minimumSpanningTree} from "./algorithmUtilities";
import {GRID_SIZE} from "./globals";
import {Building} from "./objects";

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

export let grid;
for (let i = 0; i < GRID_SIZE; i++) {
    let gridItem;
    for (let j = 0; j < GRID_SIZE; j++) {
        gridItem.push(false);
    }
    grid.push(gridItem);
}

export let graph = new Graph(); // tüm şehirleri birbirine bağlayan graph

let buildings = []; // Şehir array'i

let buildingId = 0;

export function addCity(building) {
    buildings.push({object: building, id: buildingId});
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
            const building1 = buildings[i];
            const building2 = buildings[j];
            graph.addEdge(building1.id, building2.id, dijkstra(grid, building1.doorPosition, building2.doorPosition).length);
        }
    }
}


/*

function findMinimumSpanningTree(graph) {
    const visited = {};
    const edges = [];

    const startVertex = Object.keys(graph.vertices)[0];
    visited[startVertex] = true;

    graph.vertices[startVertex].forEach(edge => {
        edges.push({ node1: startVertex, node2: edge.node, weight: edge.weight });
    });

    const mst = [];

    while (edges.length > 0) {
        edges.sort((a, b) => a.weight - b.weight);
        const minEdge = edges.shift();

        const { node1, node2, weight } = minEdge;
        const otherNode = visited[node1] ? node2 : node1;

        if (!visited[otherNode]) {
            visited[otherNode] = true;
            mst.push({ node1, node2, weight });

            graph.vertices[otherNode].forEach(edge => {
                if (!visited[edge.node]) {
                    edges.push({ node1: otherNode, node2: edge.node, weight: edge.weight });
                }
            });
        }
    }

    return mst;
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
graphh.addEdge('C', 'D', 5);

const result = findMinimumSpanningTree(graphh);
console.log(result);*/
