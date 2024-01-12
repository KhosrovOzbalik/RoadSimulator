import "./algorithmUtilities"
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

let grid; // X'e x array
let graph = new Graph(); // tüm şehirleri birbirine bağlayan graph
let cities = []; // Şehir array'i

let cityId = 0;

function addCity(coords) {
    cities.push({coords: coords, id: cityId});
    cityId += 1;
}

function removeCity(id) {
    for (let i = 0; i < cities.length; i++) {
        if (cities[i].id === id) {
            cities.splice(i, 1);
            break;
        }
    }
}

function constructGraph() {
    cities.forEach((element) => {
        graph.addVertex(element.id);
    });
    connectCities();

    minimumSpanningTree(graph);
}

function connectCities() {
    for (let i = 0; i < cities.length; i++) {
        for (let j = i; j < cities.length; j++) {
            if (j === i) continue;
            const city1 = cities[i];
            const city2 = cities[j];
            graph.addEdge(city1, city2, dijkstra(grid, city1.coords, city2.coords));
        }
    }
}
