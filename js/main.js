let context = null;
let canvas = null;
let grid = null;

const WALL_COLOR = "black"
const START_COLOR = "green"
const END_COLOR = "red"
const PATH_COLOR = "darkblue"
const EXPLORED_COLOR = "orange"


function ChangeSpeed(e) {
    grid.setSpeed(Math.floor(e.target.value));
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
        // Button events
        document.getElementById("btnContainer2").addEventListener("click", (e) => { btn(e) });
        document.getElementById("btnContainer3").addEventListener("click", (e) => { btn(e) });
        document.getElementById("clear").addEventListener("click", () => { Clear() });
        document.getElementById("reset").addEventListener("click", () => { Reset() });
        document.getElementById("start").addEventListener("click", () => { Pathalize() });
        document.getElementById("speed").addEventListener("change", (e) => { ChangeSpeed(e) });
        document.getElementById("algorithm").addEventListener("change", () => { AlgoChanged() });

        grid = new Grid();
        grid.Repaint();
    }
});

function AlgoChanged() {
    const oldMessage = document.querySelector(".message");
    if (oldMessage) oldMessage.remove();

    const algorithm = document.getElementById("algorithm").value;
    const p = document.createElement("p");
    p.classList.add("message");

    switch (algorithm) {
        case "astar":
            p.innerHTML = "A* is weighted, guaranteed to find the shortest path";
            break;
        case "dijkstra":
            p.innerHTML = "Dijkstra is weighted, guaranteed to find the shortest path";
            break;
        case "greedy":
            p.innerHTML = "Greedy Best-First-Search is weighted, not guaranteed to find the shortest path";
            break;
        case "bfs":
            p.innerHTML = "Breadth-First-Search is unweighted, not guaranteed to find the shortest path [Not implemented]";
            break;
        case "dfs":
            p.innerHTML = "Depth-First-Search is unweighted, not guaranteed to find the shortest path [Not implemented]";
            break;
    }

    document.body.appendChild(p);

}

function Pathalize() {
    const algorithm = document.getElementById("algorithm").value;
    grid.reset();
    const pf = new Pathfinder(grid.getStartNode(), grid.getEndNode());
    grid.setSpeed(document.getElementById("speed").value);
    const manhattan = document.querySelector("#btnContainer2 .active").id === "manhattan";
    const nodes = pf.GetPath(algorithm, manhattan, grid.getWalls());
    if (nodes) grid.Animate(nodes);
}

function Clear() {
    grid.clear();
}

function Reset() {
    grid.reset();
    document.getElementById("start").disabled = false;
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