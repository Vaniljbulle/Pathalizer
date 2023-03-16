let context = null;
let canvas = null;
let boxSize = 50;
let panOffsetX = 0;
let panOffsetY = 0;
let walls = [];
let path = [];
let animateNodeOrder = [];
let animated = [];
let startNode = null;
let endNode = null;

const wallColor = "darkred"
const startColor = "salmon"
const endColor = "lightblue"
const pathColor = "darkblue"
const exploringColor = "lightgreen"
const frontierNodesColor = "yellow"


function ChangeSpeed(e) {
    // Set interval to new value if it is not null
    if (animateInterval !== null) {
        if (Math.floor(e.target.value) === -1) {
            clearInterval(animateInterval);
            animateInterval = null;
            PaintAnimationInstantly();
        }
        else {
            clearInterval(animateInterval);
            animateInterval = setInterval(animate, e.target.value);
        }
    }
}

window.addEventListener('load', () => {
    // Get the canvas element
    canvas = document.getElementById('canvas');
    if (!canvas) {
        console.error('Could not find canvas element with id "canvas"');
    }

    // Get the 2D drawing context
    context = canvas.getContext('2d');
    if (!context) {
        console.error('Could not get 2D context for canvas element');
    }else {
        canvas.addEventListener("wheel", (e) => Zoom(e));
        canvas.addEventListener("click", (e) => CanvasClick(e));
        window.addEventListener("resize", () => ResizeCanvas());
        canvas.addEventListener("mousemove", (e) => { CanvasMouseMove(e) });

        // Button events
        document.getElementById("btnContainer2").addEventListener("click", (e) => { btn(e) });
        document.getElementById("btnContainer3").addEventListener("click", (e) => { btn(e) });
        document.getElementById("clear").addEventListener("click", () => { Clear() });
        document.getElementById("reset").addEventListener("click", () => { Reset() });
        document.getElementById("start").addEventListener("click", () => { Pathfinder() });
        document.getElementById("speed").addEventListener("change", (e) => { ChangeSpeed(e) });


        ResizeCanvas();
    }
});

// Manhattan distance
function Heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// Euclidean distance
function Heuristic2(a, b) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

function GetNeighbors(node) {
    let neighbors = [];

    neighbors.push(new Node(node.x + 1, node.y, 1));
    neighbors.push(new Node(node.x - 1, node.y, 1));
    neighbors.push(new Node(node.x, node.y + 1, 1));
    neighbors.push(new Node(node.x, node.y - 1, 1));

    return neighbors;
}

class Node {
    constructor(x, y, cost) {
        this.x = x;
        this.y = y;
        this.cost = cost
    }

    toString() {
        return this.x + "," + this.y;
    }
}


class PriorityQueue {
    constructor(comparator = (a, b) => a.cost < b.cost) {
        this._heap = [];
        this._comparator = comparator;
    }

    isEmpty() {
        return this._heap.length === 0;
    }

    push(node) {
        this._heap.push(node);
        let currentIndex = this._heap.length - 1;
        while (currentIndex > 0) {
            const parentIndex = Math.floor((currentIndex - 1) / 2);
            if (this._comparator(this._heap[currentIndex], this._heap[parentIndex])) {
                // If the current node should be before its parent, swap them
                [this._heap[currentIndex], this._heap[parentIndex]] = [this._heap[parentIndex], this._heap[currentIndex]];
                currentIndex = parentIndex;
            } else {
                break;
            }
        }
    }

    dequeue() {
        if (this.isEmpty()) {
            return null;
        }
        const node = this._heap[0];
        const lastNode = this._heap.pop();
        if (this._heap.length > 0) {
            this._heap[0] = lastNode;
            let currentIndex = 0;
            while (true) {
                const leftChildIndex = 2 * currentIndex + 1;
                const rightChildIndex = 2 * currentIndex + 2;
                let nextIndex = currentIndex;
                if (leftChildIndex < this._heap.length && this._comparator(this._heap[leftChildIndex], this._heap[nextIndex])) {
                    nextIndex = leftChildIndex;
                }
                if (rightChildIndex < this._heap.length && this._comparator(this._heap[rightChildIndex], this._heap[nextIndex])) {
                    nextIndex = rightChildIndex;
                }
                if (nextIndex !== currentIndex) {
                    [this._heap[currentIndex], this._heap[nextIndex]] = [this._heap[nextIndex], this._heap[currentIndex]];
                    currentIndex = nextIndex;
                } else {
                    break;
                }
            }
        }
        return node;
    }

    exists(node) {
        for (let i = 0; i < this._heap.length; i++) {
            if (this._heap[i].x === node.x && this._heap[i].y === node.y) {
                return true;
            }
        }
        return false;
    }

    cleanse() {
        this._heap = [];
    }
}
let animateInterval = null;

function PaintAnimatedNode(node) {
    if (node[1] === "exploring")
        PaintBox(node[0].x * boxSize + panOffsetX, node[0].y * boxSize + panOffsetY, exploringColor);
    else PaintBox(node[0].x * boxSize + panOffsetX, node[0].y * boxSize + panOffsetY, frontierNodesColor);
}

function animate() {
    if (animateNodeOrder.length > 0) {
        let node = animateNodeOrder.shift();
        PaintAnimatedNode(node);
        animated.push(node);
    } else {
        clearInterval(animateInterval);
        PaintPath();
        document.getElementById("start").disabled = false;
        console.log("Done");
    }
}

function PaintAnimationInstantly() {
    console.log("Painting instantly");
    while (animateNodeOrder.length > 0) {
        let node = animateNodeOrder.shift();
        PaintAnimatedNode(node);
        animated.push(node);
    }
    PaintPath();
    document.getElementById("start").disabled = false;
}

function Pathfinder() {
    Reset();
    if (!startNode || !endNode) {
        console.log("No start or end node");
        return;
    }
    document.getElementById("start").disabled = true;

    let frontier = new PriorityQueue();
    let explored = new Set();
    let parents = {};
    const manhattan = document.querySelector("#btnContainer3 .active").id === "manhattan";

    frontier.push(startNode);
    for (let i = 0; i < walls.length; i++) {
        explored.add(walls[i].toString());
    }

    while (!frontier.isEmpty()) {
        let node = frontier.dequeue();
        explored.add(node.toString());

        animateNodeOrder.push([node, "exploring"])
        if (node.x === endNode.x && node.y === endNode.y) {
            console.log("Arrived at end node");
            console.log("Cost: " + node.cost);
            let current = node;
            while (current) {
                path.unshift(current);
                current = parents[current.toString()];
            }
            if (document.getElementById("speed").value === "-1") {
                PaintAnimationInstantly();
            } else {
                animateInterval = setInterval(animate, document.getElementById("speed").value);
                animate();
            }
            return;
        }

        let neighbors = GetNeighbors(node);
        for (let i = 0; i < neighbors.length; i++) {
            let neighbor = neighbors[i];
            if (explored.has(neighbor.toString()) || frontier.exists(neighbor)) {
                continue;
            }

            if (manhattan) {
                neighbor.cost = node.cost + Heuristic(neighbor, endNode);
            } else {
                neighbor.cost = node.cost + Heuristic2(neighbor, endNode);
            }
            frontier.push(neighbor);
            animateNodeOrder.push([neighbor, "frontier"])

            parents[neighbor.toString()] = node;
            //context.fillStyle = "black";
            //context.font = (boxSize / 2) + "px Arial";
            //context.fillText(neighbor.cost, neighbor.x * boxSize + panOffsetX + 5, neighbor.y * boxSize + panOffsetY + (boxSize / 2) + 5);
        }
    }
}

function Clear() {
    walls = [];
    startNode = null;
    endNode = null;
    Reset();
}

function Reset() {
    path = [];
    animateNodeOrder = [];
    animated = [];
    clearInterval(animateInterval);
    document.getElementById("start").disabled = false;
    RepaintGrid();
}

function btn(e) {
    const button = e.target;
    const target = document.querySelector(button.dataset.target);
    if (target) {
        target.parentElement.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
        button.classList.add('active');
        target.classList.add('active');
    }
}


function CanvasMouseMove(e) {
    if (e.buttons === 1) { // Left click
        CanvasClick(e);
    }
    if (e.buttons === 4) { // Scroll wheel click
        panOffsetX += e.movementX;
        panOffsetY += e.movementY;
        RepaintGrid();
    }
}

function PlaceNewNode(xBox, yBox) {
    if (document.querySelector("#btnContainer2 .active").id === "wall") {
        walls.push([xBox, yBox]);
        PaintBox(xBox * boxSize + panOffsetX, yBox * boxSize + panOffsetY, wallColor);
    } else if (document.querySelector("#btnContainer2 .active").id === "startNode") {
        if (startNode) PaintBox(startNode.x * boxSize + panOffsetX, startNode.y * boxSize + panOffsetY, "white");
        startNode = new Node(xBox, yBox, 0);
        PaintBox(xBox * boxSize + panOffsetX, yBox * boxSize + panOffsetY, startColor);
    } else {
        if (endNode) PaintBox(endNode.x * boxSize + panOffsetX, endNode.y * boxSize + panOffsetY, "white");
        endNode = new Node(xBox, yBox, -99999);
        PaintBox(xBox * boxSize + panOffsetX, yBox * boxSize + panOffsetY, endColor);
    }
}

function CanvasClick(e) {
    let rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    let xBox = Math.floor(x / boxSize - panOffsetX / boxSize);
    let yBox = Math.floor(y / boxSize - panOffsetY / boxSize);

    for (let i = 0; i < walls.length; i++)
        if (walls[i][0] === xBox && walls[i][1] === yBox)
            return;
    if (startNode && startNode.x === xBox && startNode.y === yBox || endNode && endNode.x === xBox && endNode.y === yBox)
        return;
    PlaceNewNode(xBox, yBox);
}

function PaintBox(x, y, color = "yellow") {
    context.fillStyle = color;
    context.fillRect(x+1, y+1, boxSize-1, boxSize-1);
}

function Zoom(e) {
    /*
    let rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    let centerX = canvas.width / 2;
    let centerY = canvas.height / 2;

    let xDiff = x - centerX;
    let yDiff = y - centerY;

    console.log("zoom", xDiff, yDiff);
*/
    if (e.deltaY < 0) {
        boxSize += 2;
    } else {
        boxSize -= 2;
    }
    if (boxSize < 2) {
        boxSize = 2;
    }
    RepaintGrid();
}

function ResizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    RepaintGrid();
}

function PaintPath() {
    // Paint path
    for (let i = 1; i < path.length-1; i++) {
        PaintBox(path[i].x * boxSize + panOffsetX, path[i].y * boxSize + panOffsetY, pathColor);
    }
}

function PaintGrid(width, height) {
    if (boxSize > 2) {
        context.beginPath();
        for (let x = 0; x <= width; x += boxSize) {
            context.moveTo(x + .5 + panOffsetX % boxSize, 0);
            context.lineTo(x + .5 + panOffsetX % boxSize, height);
        }
        // horizontal lines
        for (let y = 0; y <= height; y += boxSize) {
            context.moveTo(0, y + 0.5 + panOffsetY % boxSize);
            context.lineTo(width, y + 0.5 + panOffsetY % boxSize);
        }
        context.stroke();
    }
}

function PaintWalls(width, height) {
    // Paint walls
    for (let i = 0; i < walls.length; i++) {
        if (InBounds(walls[i][0], walls[i][1], width, height))
            PaintBox(walls[i][0] * boxSize + panOffsetX, walls[i][1] * boxSize + panOffsetY, wallColor);
    }
}

function PaintAnimated(width, height) {
    // Paint already animated
    for (let i = 0; i < animated.length; i++) {
        if (InBounds(animated[i][0].x, animated[i][0].y, width, height)) {
            if (animated[i][1] === "exploring")
                PaintBox(animated[i][0].x * boxSize + panOffsetX, animated[i][0].y * boxSize + panOffsetY, exploringColor);
            else PaintBox(animated[i][0].x * boxSize + panOffsetX, animated[i][0].y * boxSize + panOffsetY, frontierNodesColor);
        }
    }
}

function RepaintGrid() {
    let width = canvas.width;
    let height = canvas.height;

    context.clearRect(0, 0, width, height);

    PaintGrid(width, height);
    PaintWalls(width, height);
    PaintAnimated(width, height);
    if (animateNodeOrder.length === 0)
        PaintPath();

    // Paint start and end node
    if (startNode) PaintBox(startNode.x * boxSize + panOffsetX, startNode.y * boxSize + panOffsetY, startColor);
    if (endNode) PaintBox(endNode.x * boxSize + panOffsetX, endNode.y * boxSize + panOffsetY, endColor);
}

function InBounds(x, y, w, h) {
    return x * boxSize + panOffsetX < w && x * boxSize + panOffsetX > 0 ||
        y * boxSize + panOffsetY < h && y * boxSize + panOffsetY > 0;
}