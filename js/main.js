let context = null;
let canvas = null;
let grid = null;

const WALL_COLOR = "black"
const START_COLOR = "green"
const END_COLOR = "red"
const PATH_COLOR = "darkblue"
const EXPLORED_COLOR = "rgba(255, 153, 80, 0.7)";


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


        message("Welcome to Pathalize!", 10)
        setTimeout(() => {  message("You can navigate the grid by holding down the scroll wheel on your mouse and moving it to move the view around") }, 3000);
    }
});

function AlgoChanged() {
    const algorithm = document.getElementById("algorithm").value;
    switch (algorithm) {
        case "astar":
            message("A* is weighted, guaranteed to find the shortest path", 5);
            break;
        case "dijkstra":
            message("Dijkstra's algorithm is weighted, guaranteed to find the shortest path", 5);
            break;
        case "greedy":
            message("Greedy best first search is unweighted, not guaranteed to find the shortest path", 5);
            break;
    }

    document.body.appendChild(p);

}

function message(text, duration) {
    const oldMessage = document.querySelector(".message");
    if (oldMessage) oldMessage.remove();

    const p = document.createElement("p");
    p.classList.add("message");
    p.innerHTML = text;
    p.style.animationDuration = duration + "s";
    document.body.appendChild(p);
}

function Pathalize() {
    const algorithm = document.getElementById("algorithm").value;
    grid.reset();
    const pf = new Pathfinder(grid.getStartNode(), grid.getEndNode());
    grid.setSpeed(document.getElementById("speed").value);
    const manhattan = document.querySelector("#btnContainer2 .active").id === "manhattan";
    const nodes = pf.GetPath(algorithm, manhattan, grid.getWalls());
    if (nodes) {
        grid.Animate(nodes);
        if (nodes[0].length > 0) {
            message("Path cell length: " + (1+nodes[0].length), 5);
        }
        else {
            message("No path was found", 2);
        }
    }
    else {
        message("No start or end node", 2);
    }
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