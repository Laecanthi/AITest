const costArray = [
    1.914, 1.5, 1.914,
    1, 0, 1,
    0.914, 0.5, 0.914
]; // arbitrary numbers that make going up more difficult, and going down very easy

// default:

/*
    1.414, 1, 1.414,
    1, 0, 1,
    1.414, 1, 1.414
*/

class MinHeap {
    constructor() {
        this.data = [];
    }

    push(item) {
        this.data.push(item);
        this.data.sort((a, b) => a.cost - b.cost);
    }

    pop() {
        return this.data.shift();
    }

    get size() {
        return this.data.length;
    }
}

// 0 1 2
// 3 4 5
// 6 7 8

function BuildCollisionGrid(
    width,
    height,
    cellSize,
    targetX,
    groundY,
    seed,
    targetRadius,
    curriculumStage,
    obstacles,
    fieldOriginX,
    fieldOriginY
)
{
    const grid = new Array(width);

    for (let x = 0; x < width; x++)
    {
        grid[x] = new Array(height);

        for (let y = 0; y < height; y++)
        {
            const wx = x * cellSize + fieldOriginX;
            const wy = y * cellSize + fieldOriginY;

            const terrainY = GetGroundHeight(
                wx,
                groundY,
                seed,
                targetX,
                targetRadius,
                curriculumStage
            );

            const inGround = wy <= terrainY;

            if(inGround)
            {
                grid[x][y] = true;
                continue;
            }

            // collision in obstacles requires O(n) for obstacles, while there is always only one ground
            // because of that, there's no reason to check if the grid space is in an obstacle if it's already in the ground

            const inObstacle = PointInObstacles(wx, wy, obstacles); 

            grid[x][y] = inObstacle; // true = blocked
        }
    }

    return grid;
}


function BuildFlowField(collisionGrid, targetX, targetY, fieldOriginX, fieldOriginY, cellSize)
{
    const W = collisionGrid.length;
    const H = collisionGrid[0].length;

    const cost = Array.from({ length: W }, () =>
        Array(H).fill(Infinity)
    );

    const flow = Array.from({ length: W }, () =>
        Array.from({ length: H }, () => ({ x: 0, y: 0 }))
    );

    const queue = [];

    const quantizedTargetX =
        Math.floor(
            (targetX - fieldOriginX) / cellSize
        );

    const quantizedTargetY =
        Math.floor(
            (targetY - fieldOriginY) / cellSize
        );

    console.log({
        targetX,
        targetY,
        fieldOriginX,
        fieldOriginY,
        cellSize,
        quantizedTargetX,
        quantizedTargetY,
        W,
        H
    });

    cost[quantizedTargetX][quantizedTargetY] = 0;
    queue.push([quantizedTargetX, quantizedTargetY]);

    while (queue.length > 0)
    {
        const [x, y] = queue.shift();
        const baseCost = cost[x][y];

        for (let dx = -1; dx <= 1; dx++)
        for (let dy = -1; dy <= 1; dy++)
        {
            if (dx === 0 && dy === 0) continue;

            const nx = x + dx;
            const ny = y + dy;

            if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
            if (collisionGrid[nx][ny]) continue;

            const step =
                dx + 1 + (3 * (dy + 1));

            const stepCost = costArray[step];
            const newCost = baseCost + stepCost;

            if (newCost < cost[nx][ny])
            {
                cost[nx][ny] = newCost;

                const len = Math.hypot(dx, dy) || 1;

                flow[nx][ny] = {
                    x: -dx / len,
                    y: -dy / len
                };

                queue.push([nx, ny]);
            }
        }
    }

    return flow;
}

function SampleFlowField2D(
    x,
    y,
    flowField,
    cellSize,
    width,
    height
)
{
    const gx =
        (x - fieldOriginX) / cellSize;

    const gy =
        (y - fieldOriginY) / cellSize;

    const x0 = Math.floor(gx);
    const y0 = Math.floor(gy);
    const x1 = x0 + 1;
    const y1 = y0 + 1;

    const tx = gx - x0;
    const ty = gy - y0;

    function get(ix, iy)
    {
        if (
            ix < 0 || iy < 0 ||
            ix >= flowField.length ||
            iy >= flowField[0].length
        ) return { x: 0, y: 0 };

        return flowField[ix][iy];
    }

    const v00 = get(x0, y0);
    const v10 = get(x1, y0);
    const v01 = get(x0, y1);
    const v11 = get(x1, y1);

    // bilinear interpolation (vector space = EASY MODE now)
    const vx =
        v00.x * (1 - tx) * (1 - ty) +
        v10.x * tx * (1 - ty) +
        v01.x * (1 - tx) * ty +
        v11.x * tx * ty;

    const vy =
        v00.y * (1 - tx) * (1 - ty) +
        v10.y * tx * (1 - ty) +
        v01.y * (1 - tx) * ty +
        v11.y * tx * ty;

    const mag = Math.hypot(vx, vy) || 1;

    return {
        x: vx / mag,
        y: vy / mag
    };
}

function SampleFlowField(
    x,
    y,
    flowField,
    cellSize,
    width,
    height,
    fieldOriginX,
    fieldOriginY
)
{

    //-----------------------------------
    // GRID SPACE
    //-----------------------------------

    const gx =
        (x - fieldOriginX) / cellSize;

    const gy =
        (y - fieldOriginY) / cellSize;

    const x0 = Math.floor(gx);
    const y0 = Math.floor(gy);

    const x1 = x0 + 1;
    const y1 = y0 + 1;

    const tx = gx - x0;
    const ty = gy - y0;

    //-----------------------------------
    // SAMPLE HELPER
    //-----------------------------------

    function get(ix, iy)
    {
        if(
            ix < 0 || iy < 0 ||
            ix >= width ||
            iy >= height
        )
        {
            return { x: 0, y: 0 };
        }

        const i = (ix + iy * width) * 2;

        if(i < 0 || i + 1 >= flowField.length)
        {
            console.error(
                "FLOW INDEX OOB",
                {
                    ix,
                    iy,
                    i,
                    flowLength: flowField.length,
                    width,
                    height
                }
            );

            return { x: 0, y: 0 };
        }

        return {
            x: flowField[i],
            y: flowField[i + 1]
        };
    }

    //-----------------------------------
    // CORNER SAMPLES
    //-----------------------------------

    const v00 = get(x0, y0);
    const v10 = get(x1, y0);

    const v01 = get(x0, y1);
    const v11 = get(x1, y1);

    //-----------------------------------
    // BILINEAR INTERPOLATION
    //-----------------------------------

    const vx =
        v00.x * (1 - tx) * (1 - ty) +
        v10.x * tx * (1 - ty) +
        v01.x * (1 - tx) * ty +
        v11.x * tx * ty;

    const vy =
        v00.y * (1 - tx) * (1 - ty) +
        v10.y * tx * (1 - ty) +
        v01.y * (1 - tx) * ty +
        v11.y * tx * ty;

    //-----------------------------------
    // NORMALIZE
    //-----------------------------------

    const mag = Math.hypot(vx, vy) || 1;

    return {
        x: vx / mag,
        y: vy / mag
    };
}

function CreateFlowField(
    width,
    height,
    cellSize,
    targetX,
    groundY,
    seed,
    targetRadius,
    curriculumStage,
    obstacles,
    fieldOriginX,
    fieldOriginY
)
{
    const collisionGrid = BuildCollisionGrid(
        width,
        height,
        cellSize,
        targetX,
        groundY,
        seed,
        targetRadius,
        curriculumStage,
        obstacles,
        fieldOriginX,
        fieldOriginY
    );

    const targetY = GetGroundHeight(
        targetX,
        groundY,
        seed,
        targetX,
        targetRadius,
        curriculumStage
    );

    const costField = BuildCostField(collisionGrid, targetX, targetY, fieldOriginX, fieldOriginY, cellSize);

    return BuildFlowFieldFromCost(costField, collisionGrid);
}

function FlattenFlowField(flowField)
{
    const width = flowField.length;
    const height = flowField[0].length;

    const buffer = new Float32Array(width * height * 2);

    let i = 0;

    for (let y = 0; y < height; y++)
    {
        for (let x = 0; x < width; x++)
        {
            const v = flowField[x][y];

            buffer[i++] = v.x;
            buffer[i++] = v.y;
        }
    }

    return buffer;
}

function GetFlow(flowField, width, x, y)
{
    const i = (x + y * width) * 2;

    return {
        x: flowField[i],
        y: flowField[i + 1]
    };
}

function SmoothFlowField(flowField, width, height)
{
    const out = Array.from({ length: width }, () =>
        Array.from({ length: height }, () => ({ x: 0, y: 0 }))
    );

    for (let x = 0; x < width; x++)
    {
        for (let y = 0; y < height; y++)
        {
            let sx = 0;
            let sy = 0;
            let count = 0;

            for (let dx = -1; dx <= 1; dx++)
            for (let dy = -1; dy <= 1; dy++)
            {
                const nx = x + dx;
                const ny = y + dy;

                if (
                    nx < 0 || ny < 0 ||
                    nx >= width || ny >= height
                ) continue;

                const v = flowField[nx][ny];

                sx += v.x;
                sy += v.y;
                count++;
            }

            const len = Math.hypot(sx, sy) || 1;

            out[x][y] = {
                x: sx / len,
                y: sy / len
            };
        }
    }

    return out;
}

function GaussianSmoothFlowField(flowField, width, height, radius, sigma)
{
    const out = Array.from({ length: width }, () =>
        Array.from({ length: height }, () => ({ x: 0, y: 0 }))
    );

    const sigma2 = sigma * sigma;
    const twoSigma2 = 2 * sigma2;

    for (let x = 0; x < width; x++)
    for (let y = 0; y < height; y++)
    {
        let sumX = 0;
        let sumY = 0;
        let sumW = 0;

        for (let dx = -radius; dx <= radius; dx++)
        for (let dy = -radius; dy <= radius; dy++)
        {
            const nx = x + dx;
            const ny = y + dy;

            if (
                nx < 0 || ny < 0 ||
                nx >= width || ny >= height
            ) continue;

            const v = flowField[nx][ny];

            const dist2 = dx * dx + dy * dy;
            const w = Math.exp(-dist2 / twoSigma2);

            sumX += v.x * w;
            sumY += v.y * w;
            sumW += w;
        }

        if (sumW > 0)
        {
            sumX /= sumW;
            sumY /= sumW;
        }

        const mag = Math.hypot(sumX, sumY) || 1;

        out[x][y] = {
            x: sumX / mag,
            y: sumY / mag
        };
    }

    return out;
}

function BuildCostField(collisionGrid, targetX, targetY, originX, originY, cellSize)
{
    const W = collisionGrid.length;
    const H = collisionGrid[0].length;

    const cost = Array.from({ length: W }, () =>
        Array(H).fill(Infinity)
    );

    const queue = [];

    const startX = Math.floor((targetX - originX) / cellSize);
    const startY = Math.floor((targetY - originY) / cellSize);

    if (
        startX < 0 || startY < 0 ||
        startX >= W || startY >= H
    ) return cost;

    cost[startX][startY] = 0;
    queue.push([startX, startY]);

    while (queue.length)
    {
        const [x, y] = queue.shift();
        const base = cost[x][y];

        for (let dx = -1; dx <= 1; dx++)
        for (let dy = -1; dy <= 1; dy++)
        {
            if (dx === 0 && dy === 0) continue;

            const nx = x + dx;
            const ny = y + dy;

            if (
                nx < 0 || ny < 0 ||
                nx >= W || ny >= H
            ) continue;

            if (collisionGrid[nx][ny]) continue;

            const step =
                dx + 1 + (3 * (dy + 1));

            const stepCost = costArray[step];

            const newCost = base + stepCost;

            if (newCost < cost[nx][ny])
            {
                cost[nx][ny] = newCost;
                queue.push([nx, ny]);
            }
        }
    }

    return cost;
}

function BuildFlowFieldFromCost(cost, collisionGrid)
{
    const W = cost.length;
    const H = cost[0].length;

    const flow = Array.from({ length: W }, () =>
        Array.from({ length: H }, () => ({ x: 0, y: 0 }))
    );

    for (let x = 0; x < W; x++)
    for (let y = 0; y < H; y++)
    {
        if (collisionGrid[x][y]) continue;

        let bestX = 0;
        let bestY = 0;
        let bestCost = cost[x][y];

        for (let dx = -1; dx <= 1; dx++)
        for (let dy = -1; dy <= 1; dy++)
        {
            if (dx === 0 && dy === 0) continue;

            const nx = x + dx;
            const ny = y + dy;

            if (
                nx < 0 || ny < 0 ||
                nx >= W || ny >= H
            ) continue;

            const neighborCost = cost[nx][ny];

            if (neighborCost < bestCost)
            {
                bestCost = neighborCost;
                bestX = dx;
                bestY = dy;
            }
        }

        const len = Math.hypot(bestX, bestY) || 1;

        flow[x][y] = {
            x: bestX / len,
            y: bestY / len
        };
    }

    return flow;
}