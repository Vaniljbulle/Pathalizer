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

        // Virtual wall
        explored = this.#virtualWall(explored);

        frontier.push(this.#startNode);
        let t1 = performance.now();
        while (frontier.length > 0) {
            if (performance.now() - t1 > 5000) {
                console.log("Pathfinding took too long");
                return null;
            }
            frontier.sort((a, b) => a.cost - b.cost);
            let current = frontier.shift();

            // Found path
            if (current.x === this.#endNode.x && current.y === this.#endNode.y) {
                // Found the end node
                console.log("Path length: " + current.accruedCost);
                let pathNode = current;
                while (pathNode.x !== this.#startNode.x || pathNode.y !== this.#startNode.y) {
                    path.push([pathNode.x, pathNode.y]);
                    pathNode = parentMap.get(pathNode.toString());
                }
                nodeOrder.shift();
                nodeOrder.pop();
                path.shift();
                break;
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

        if (path.length === 0) nodeOrder.shift();
        return [path, nodeOrder];
    }

    #virtualWall(explored) {
        explored.add(this.#endNode.x + "," + this.#endNode.y);
        let bounds = this.#getBounds(explored);
        explored.delete(this.#endNode.x + "," + this.#endNode.y);

        if ((bounds.maxX - bounds.minX) * (bounds.maxY - bounds.minY) < 15000) {
            let xDiff = bounds.maxX - bounds.minX;
            let yDiff = bounds.maxY - bounds.minY;
            let currentArea = xDiff * yDiff;
            let scalingFactor = Math.sqrt(15000 / currentArea);
            let amountToExpand = {
                x: Math.trunc(xDiff * 0.5 * (scalingFactor - 1)),
                y: Math.trunc(yDiff * 0.5 * (scalingFactor - 1))
            };
            bounds.minX -= amountToExpand.x;
            bounds.minY -= amountToExpand.y;
            bounds.maxX += amountToExpand.x;
            bounds.maxY += amountToExpand.y;
        }
        console.log("Grid area: " + (bounds.maxX - bounds.minX) * (bounds.maxY - bounds.minY));
        for (let i = bounds.minX; i <= bounds.maxX; i++) {
            explored.add(i + "," + bounds.minY);
            explored.add(i + "," + bounds.maxY);
        }
        for (let i = bounds.minY; i <= bounds.maxY; i++) {
            explored.add(bounds.minX + "," + i);
            explored.add(bounds.maxX + "," + i);
        }

        return explored;
    }

    #getBounds(explored) {
        let minX = -999999;
        let maxX = -999999;
        let minY = -999999;
        let maxY = -999999;
        for (let node of explored) {
            let x = node.split(",")[0];
            let y = node.split(",")[1];

            if (minX === -999999) {
                minX = x;
                maxX = x;
                minY = y;
                maxY = y;
            }
            if (x <= minX) minX = parseInt(x)-1;
            if (x >= maxX) maxX = parseInt(x)+1;
            if (y <= minY) minY = parseInt(y)-1;
            if (y >= maxY) maxY = parseInt(y)+1;
        }
        return {minX, maxX, minY, maxY};
    }
}