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
        this.#canvas.addEventListener("wheel", (e) => this.#zoom(e));
    }

    #zoom(e) {
        let linesW = Math.floor(this.#canvas.width / this.#boxSize);
        let linesH = Math.floor(this.#canvas.height / this.#boxSize);
        if (e.deltaY < 0) {
            this.#boxSize += 1;
            if (this.#boxSize > 50) this.#boxSize = 50; else {
                this.#panOffsetX -= linesW/2;
                this.#panOffsetY -= linesH/2;
            }
        } else {
            this.#boxSize -= 1;
            if (this.#boxSize < 5) this.#boxSize = 5; else {
                this.#panOffsetX += linesW/2;
                this.#panOffsetY += linesH/2;
            }
        }
        this.Repaint();
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
                this.#finished = true;
            }
        }
    }

    #oldMousePosition;
    // Button event
    #CanvasMouseMove(e) {
        if (e.buttons === 1) { // Left mouse button
            let currentMousePos = [e.clientX, e.clientY];
            // If distance is larger than box size, interpolate points accoring to box size
            if (Math.abs(currentMousePos[0] - this.#oldMousePosition[0]) > this.#boxSize ||
                Math.abs(currentMousePos[1] - this.#oldMousePosition[1]) > this.#boxSize) {
                let dx = currentMousePos[0] - this.#oldMousePosition[0];
                let dy = currentMousePos[1] - this.#oldMousePosition[1];
                let steps = Math.max(Math.abs(dx), Math.abs(dy)) / this.#boxSize;
                let xStep = dx / steps;
                let yStep = dy / steps;
                for (let i = 0; i < steps; i++) {
                    this.#click({clientX: Math.trunc(this.#oldMousePosition[0] + xStep * i), clientY: Math.trunc(this.#oldMousePosition[1] + yStep * i)});
                }
            }else {
                this.#click(e);
            }
        }
        if (e.buttons === 4) { // Scroll wheel button
            this.#pan(e.movementX, e.movementY);
        }
        this.#oldMousePosition = [e.clientX, e.clientY];
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

        if (this.#nodesToAnimate.length === 0)
            this.#PaintCells(this.#path, PATH_COLOR);

        this.#PaintCells(this.#walls, WALL_COLOR);

        // Paint start and end node
        if (this.#startNode) this.#PaintBox(this.#startNode.x, this.#startNode.y, START_COLOR);
        if (this.#endNode) this.#PaintBox(this.#endNode.x, this.#endNode.y, END_COLOR);
    }

    #InBounds(x, y, w, h) {
        return x * this.#boxSize + this.#panOffsetX < w && x * this.#boxSize + this.#panOffsetX > 0 ||
            y * this.#boxSize + this.#panOffsetY < h && y * this.#boxSize + this.#panOffsetY > 0;
    }

    #PaintGrid() {
        if (this.#boxSize > 5) {
            this.#ctx.strokeStyle = `rgba(0, 0, 0, ${this.#boxSize / 50})`;
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
