class Pathfinder {
    #startNode;
    #endNode;
    constructor(startNode, endNode) {
        this.#startNode = startNode;
        this.#endNode = endNode;
    }

    /*
    * @param {string} algo - The algorithm to use
    * @param {boolean} manhattan - Whether to use manhattan distance or euclidean distance
    * @param {Array} walls - The walls in the grid
    * @returns {Array, Array} - The path from start to end and explored nodes
     */
    GetPath(algo, manhattan, walls) {
        switch (algo) {
            case "astar":
                return this.#Pathfinder(1, manhattan, walls);
            case "greedy":
                return this.#Pathfinder(0, manhattan, walls);
            case "dijkstra":
                return this.#Pathfinder(1, manhattan, walls, true);
        }
    }

    #Heuristic(x, y, manhattan) {
        if (manhattan)
            return Math.abs(x - this.#endNode.x) + Math.abs(y - this.#endNode.y);
        else
            return Math.sqrt(Math.pow(x - this.#endNode.x, 2) + Math.pow(y - this.#endNode.y, 2));
    }

    #GetNeighbors(current, manhattan, weight, dijkstra) {
        let r_ne, l_ne, u_ne, d_ne;
        if (dijkstra){
            r_ne = new Node(current.x + 1, current.y, current.accruedCost + weight, 0);
            l_ne = new Node(current.x - 1, current.y, current.accruedCost + weight, 0);
            u_ne = new Node(current.x, current.y - 1, current.accruedCost + weight, 0);
            d_ne = new Node(current.x, current.y + 1, current.accruedCost + weight, 0);
        } else {
            r_ne = new Node(current.x + 1, current.y, current.accruedCost + weight, this.#Heuristic(current.x + 1, current.y, manhattan));
            l_ne = new Node(current.x - 1, current.y, current.accruedCost + weight, this.#Heuristic(current.x - 1, current.y, manhattan));
            u_ne = new Node(current.x, current.y - 1, current.accruedCost + weight, this.#Heuristic(current.x, current.y - 1, manhattan));
            d_ne = new Node(current.x, current.y + 1, current.accruedCost + weight, this.#Heuristic(current.x, current.y + 1, manhattan));
        }

        return [r_ne, l_ne, u_ne, d_ne];
    }

    #Pathfinder(weight = 2, manhattan, walls, dijkstra = false) {
        if (!this.#startNode || !this.#endNode) {
            console.log("No start or end node");
            return null;
        }

        // Setup
        let frontier = [], path = [], nodeOrder = [];
        let explored = new Set();
        let parentMap = new Map();
        for (let i = 0; i < walls.length; i++) {
            explored.add(walls[i].toString());
        }
        explored.add(this.#startNode.toString());
        frontier.push(this.#startNode);

        while (frontier.length > 0) {
            frontier.sort((a, b) => a.cost - b.cost);
            let current = frontier.shift();

            // Found path
            if (current.x === this.#endNode.x && current.y === this.#endNode.y) {
                // Found the end node
                console.log("Found end node");
                console.log("Path length: " + current.accruedCost);
                let pathNode = current;
                while (pathNode.x !== this.#startNode.x || pathNode.y !== this.#startNode.y) {
                    path.push([pathNode.x, pathNode.y]);
                    pathNode = parentMap.get(pathNode.toString());
                }
                nodeOrder.shift();
                nodeOrder.pop();
                path.shift();
                return [path, nodeOrder];
            }

            // Path finding
            nodeOrder.push([current.x, current.y]);

            let neighbors = this.#GetNeighbors(current, manhattan, weight, dijkstra);
            for (let i = 0; i < neighbors.length; i++) {
                let neighbor = neighbors[i];
                if (!explored.has(neighbor.toString())) {
                    frontier.push(neighbor);
                    parentMap.set(neighbor.toString(), current);
                    explored.add(neighbor.toString());
                    //nodeOrder.push([neighbor.x, neighbor.y]);
                }
            }
        }
    }
}