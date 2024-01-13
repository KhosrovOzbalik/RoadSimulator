import {GRID_SIZE} from "./globals";

function minimumSpanningTree(graph) {
    const visited = {};
    const edges = [];

    const startVertex = Object.keys(graph.vertices)[0];
    visited[startVertex] = true;

    graph.vertices[startVertex].forEach(edge => {
        edges.push({node1: startVertex, node2: edge.node, weight: edge.weight});
    });

    const mst = [];

    while (edges.length > 0) {
        edges.sort((a, b) => a.weight - b.weight);
        const minEdge = edges.shift();

        const {node1, node2, weight} = minEdge;
        const otherNode = visited[node1] ? node2 : node1;

        if (!visited[otherNode]) {
            visited[otherNode] = true;
            mst.push({node1, node2, weight});

            graph.vertices[otherNode].forEach(edge => {
                if (!visited[edge.node]) {
                    edges.push({node1: otherNode, node2: edge.node, weight: edge.weight});
                }
            });
        }
    }

    return mst;
}

function dijkstra(grid, node1, node2) {
    const rows = grid.length;
    const cols = grid[0].length;
    const distances = Array.from({length: rows}, () => Array(cols).fill(Infinity));
    //console.log(distances);
    distances[start[0]][start[1]] = 0;

    const queue = [[start[0], start[1]]];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    const previous = Array.from({length: rows}, () => Array(cols).fill(null));

    while (queue.length > 0) {
        const [currentRow, currentCol] = queue.shift();

        for (const [dx, dy] of directions) {
            const newRow = currentRow + dx;
            const newCol = currentCol + dy;

            if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols && (!grid[newRow][newCol] ||
                [newRow, newCol].toString() === end.toString())) {
                const newDistance = distances[currentRow][currentCol] + 1;

                if (newDistance < distances[newRow][newCol]) {
                    distances[newRow][newCol] = newDistance;
                    previous[newRow][newCol] = [currentRow, currentCol];
                    queue.push([newRow, newCol]);
                }
            }
        }
    }

    const shortestPathLength = distances[end[0]][end[1]] === Infinity ? null : distances[end[0]][end[1]];

    if (shortestPathLength !== null) {
        const shortestPath = reconstructPath(previous, start, end);
        return {length: shortestPathLength, path: shortestPath};
    } else {
        return {length: null, path: null};
    }
}

function reconstructPath(previous, start, end) {
    const path = [];
    let current = end;

    while (current !== null) {
        path.unshift(current);
        current = previous[current[0]][current[1]];
    }

    return path;
}

function isIntersect(grid, meshCoords) {
    for (let i = 0; i < meshCoords.length; i++) {
        if (grid[meshCoords[i][0] + (GRID_SIZE) /2][meshCoords[i][1] + (GRID_SIZE) /2])
            return true;
    }
    return false;
}

export {minimumSpanningTree, dijkstra, isIntersect};
/*
// Example usage:
const grid = [
  [true, false, false, false, false],
  [false, true, true, true, true],
  [false, true, false, false, false],
  [false, true, false, true, false],
  [false, false, false, true, true],
];

const start = [0, 0];
const end = [4, 4];

const result = dijkstra(grid, start, end);

if (result.length !== null) {
  console.log(`Shortest path length: ${result.length}`);
  console.log(`Shortest path: ${result.path}`);
} else {
  console.log("No path found.");
}*/
