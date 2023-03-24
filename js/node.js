class Node {
    constructor(x, y, g, h) {
        this.x = x;
        this.y = y;
        this.accruedCost = g;
        this.heuristicCost = h;
        this.cost = g+h;
    }

    toString() {
        return this.x + "," + this.y;
    }
}

