class Grid {
    #nodesToAnimate = [];
    #animatedNodes = [];
    #t1 = 0;
    #t2 = 0;
    #finished = false;
    #boxSize;
    #panOffsetX = 0;
    #panOffsetY = 0;
    #walls = [];
    #path = [];
    #startNode = null;
    #endNode = null;
    #canvas;
    #ctx;
    #speed;

    constructor(boxSize = 20, canvasID = "canvas") {
        this.#boxSize = boxSize;
        this.#canvas = document.getElementById(canvasID);
        this.#ctx = this.#canvas.getContext("2d");

        this.render = this.#render.bind(this);
        this.repaintCanvas = this.#RepaintCanvas.bind(this);

        window.addEventListener("resize", () => this.Repaint());
        this.#canvas.addEventListener("mousemove", (e) => this.#CanvasMouseMove(e));
        this.#canvas.addEventListener("click", (e) => this.#click(e));
    }

    // Get start/end
    getStartNode() {
        return this.#startNode;
    }
    getEndNode() {
        return this.#endNode;
    }

    reset() {
        this.#nodesToAnimate = [];
        this.#animatedNodes = [];
        this.#path = [];
        requestAnimationFrame(this.repaintCanvas);
    }

    setSpeed(speed) {
        this.#speed = speed;
    }

    clear() {
        this.#walls = [];
        this.#startNode = null;
        this.#endNode = null;
        this.reset();
    }

    Animate(nodes) {
        this.#path = nodes[0];
        this.#nodesToAnimate = nodes[1];
        this.#t1 = performance.now();
        requestAnimationFrame(this.render)
    }

    #render() {
        if (this.#finished) {
            this.#finished = false;
            return;
        }
        requestAnimationFrame(this.render)

        this.#t2 = performance.now();
        let dt = this.#t2 - this.#t1;

        if (dt > 1000/60) {
            this.#t1 = this.#t2 - (dt % (1000/60));

            if (this.#nodesToAnimate.length > 0) {
                let cap = this.#nodesToAnimate.length > this.#speed ? this.#speed : this.#nodesToAnimate.length;
                for (let i = 0; i < cap; i++) {
                    let node = this.#nodesToAnimate.shift();
                    this.#PaintBox(node[0], node[1], EXPLORED_COLOR);
                    this.#animatedNodes.push(node);
                }
            } else {
                this.#PaintCells(this.#path, PATH_COLOR);
                console.log("Done");
                this.#finished = true;
            }
        }
    }

    // Button event
    #CanvasMouseMove(e) {
        if (e.buttons === 1) { // Left mouse button
            this.#click(e);
        }
        if (e.buttons === 4) { // Scroll wheel button
            this.#pan(e.movementX, e.movementY);
        }
    }

    // Panning the grid
    #pan(x, y) {
        this.#panOffsetX += x;
        this.#panOffsetY += y;
        requestAnimationFrame(this.repaintCanvas);
    }

    // Clicking on the grid
    #click(e) {
        let rect = this.#canvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        let xBox = Math.floor(x / this.#boxSize - this.#panOffsetX / this.#boxSize);
        let yBox = Math.floor(y / this.#boxSize - this.#panOffsetY / this.#boxSize);

        // Check if the box is already a wall
        for (let i = 0; i < this.#walls.length; i++) {
            if (this.#walls[i][0] === xBox && this.#walls[i][1] === yBox) {
                return;
            }
        }

        // Check if the box is the start or end node
        if (this.#startNode && this.#startNode.x === xBox && this.#startNode.y === yBox ||
            this.#endNode && this.#endNode.x === xBox && this.#endNode.y === yBox)
            return;

        this.#PlaceNewNode(xBox, yBox);
    }


    #PlaceNewNode(x, y) {
        switch (document.querySelector("#btnContainer2 .active").id) {
            case "wall":
                this.addWall(x, y)
                break;
            case "startNode":
                this.#startNode = new Node(x, y, 0, 0);
                break;
            case "endNode":
                this.#endNode = new Node(x, y, 0, 0);
                break;
            default:
                break;
        }
        requestAnimationFrame(this.repaintCanvas);
    }

    // Add wall to the grid
    addWall(x, y) {
        this.#walls.push([x, y]);
    }

    // Get all walls
    getWalls() {
        return this.#walls;
    }

    Repaint() {
        requestAnimationFrame(this.repaintCanvas)
    }

    #RepaintCanvas() {
        this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
        this.#canvas.width = window.innerWidth;
        this.#canvas.height = window.innerHeight;

        this.#PaintGrid();
        this.#PaintCells(this.#animatedNodes, EXPLORED_COLOR);
        this.#PaintCells(this.#walls, WALL_COLOR);

        if (this.#nodesToAnimate.length === 0)
            this.#PaintCells(this.#path, PATH_COLOR);

        // Paint start and end node
        if (this.#startNode) this.#PaintBox(this.#startNode.x, this.#startNode.y, START_COLOR);
        if (this.#endNode) this.#PaintBox(this.#endNode.x, this.#endNode.y, END_COLOR);
    }

    #InBounds(x, y, w, h) {
        return x * this.#boxSize + this.#panOffsetX < w && x * this.#boxSize + this.#panOffsetX > 0 ||
            y * this.#boxSize + this.#panOffsetY < h && y * this.#boxSize + this.#panOffsetY > 0;
    }

    #PaintGrid() {
        if (this.#boxSize > 2) {
            this.#ctx.beginPath();
            for (let x = 0; x <= this.#canvas.width; x += this.#boxSize) {
                this.#ctx.moveTo(x + .5 + this.#panOffsetX % this.#boxSize, 0);
                this.#ctx.lineTo(x + .5 + this.#panOffsetX % this.#boxSize, this.#canvas.height);
            }
            // horizontal lines
            for (let y = 0; y <= this.#canvas.height; y += this.#boxSize) {
                this.#ctx.moveTo(0, y + 0.5 + this.#panOffsetY % this.#boxSize);
                this.#ctx.lineTo(this.#canvas.width, y + 0.5 + this.#panOffsetY % this.#boxSize);
            }
            this.#ctx.stroke();
        }
    }

    #PaintCells(nodes, color = "black") {
        for (let i = 0; i < nodes.length; i++) {
            if (this.#InBounds(nodes[i][0], nodes[i][1], this.#canvas.width, this.#canvas.height))
                this.#PaintBox(nodes[i][0], nodes[i][1], color);
            //context.drawImage(wallImage, walls[i][0] * boxSize + panOffsetX, walls[i][1] * boxSize + panOffsetY, boxSize, boxSize);
        }
    }


    #PaintBox(x, y, color = "yellow", alpha = 1) {
        x = x * this.#boxSize + this.#panOffsetX;
        y = y * this.#boxSize + this.#panOffsetY;
        context.fillStyle = color;
        context.globalAlpha = alpha;
        context.fillRect(x + 1, y + 1, this.#boxSize - 1, this.#boxSize - 1);
    }
}
