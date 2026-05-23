const costArray = [
    1.914, 1.5, 1.914,
    0.9, 0, 0.9,
    0.914, 0.45, 0.914
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

/************************************************************* THIS IS THE MAIN FUNCTION ************************************************/
function CreateDistanceField(
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

    let distanceField = BuildDistanceField(
        collisionGrid,
        targetX,
        targetY,
        fieldOriginX,
        fieldOriginY,
        cellSize
    );

    return FlattenDistanceField(distanceField);
}

function BuildDistanceField(
    collisionGrid,
    targetX,
    targetY,
    originX,
    originY,
    cellSize,
    sweeps = 12
)
{
    const W = collisionGrid.length;
    const H = collisionGrid[0].length;

    const field = Array.from(
        { length: W },
        () => Array(H).fill(Infinity)
    );

    const tx = Math.floor(
        (targetX - originX) / cellSize
    );

    const ty = Math.floor(
        (targetY - originY) / cellSize
    );

    if(
        tx < 0 || ty < 0 ||
        tx >= W || ty >= H
    )
    {
        return field;
    }

    field[tx][ty] = 0;

    for(let i = 0; i < sweeps; i++)
    {
        SweepField(
            field,
            collisionGrid,
            W,
            H,
            cellSize,
            0, W, 1,
            0, H, 1
        );

        SweepField(
            field,
            collisionGrid,
            W,
            H,
            cellSize,
            W - 1, -1, -1,
            0, H, 1
        );

        SweepField(
            field,
            collisionGrid,
            W,
            H,
            cellSize,
            0, W, 1,
            H - 1, -1, -1
        );

        SweepField(
            field,
            collisionGrid,
            W,
            H,
            cellSize,
            W - 1, -1, -1,
            H - 1, -1, -1
        );
    }

    return field;
}

function SweepField(
    field,
    collisionGrid,
    W,
    H,
    h,
    startX,
    endX,
    stepX,
    startY,
    endY,
    stepY
)
{
    for(let y = startY; y !== endY; y += stepY)
    {
        for(let x = startX; x !== endX; x += stepX)
        {
            if(collisionGrid[x][y])
            {
                continue;
            }

            if(field[x][y] === 0)
            {
                continue;
            }

            const left =
                x > 0
                    ? field[x - 1][y]
                    : Infinity;

            const right =
                x < W - 1
                    ? field[x + 1][y]
                    : Infinity;

            const down =
                y > 0
                    ? field[x][y - 1]
                    : Infinity;

            const up =
                y < H - 1
                    ? field[x][y + 1]
                    : Infinity;

            const a = Math.min(left, right);
            const b = Math.min(up, down);

            let d;

            if(Math.abs(a - b) >= h)
            {
                d = Math.min(a, b) + h;
            }
            else
            {
                d =
                    (
                        a +
                        b +
                        Math.sqrt(
                            2 * h * h -
                            (a - b) * (a - b)
                        )
                    ) * 0.5;
            }

            if(d < field[x][y])
            {
                field[x][y] = d;
            }
        }
    }
}

function FlattenDistanceField(field)
{
    const width = field.length;
    const height = field[0].length;

    const buffer =
        new Float32Array(width * height);

    let i = 0;

    for(let y = 0; y < height; y++)
    {
        for(let x = 0; x < width; x++)
        {
            buffer[i++] = field[x][y];
        }
    }

    return buffer;
}

function SampleFlowGradient(
    x, y,
    field,
    width,
    height,
    cellSize,
    originX,
    originY
)
{
    const eps = cellSize * 0.5;

    const c  = SampleDistanceField(x, y, field, width, height, cellSize, originX, originY);
    const lx = SampleDistanceField(x - eps, y, field, width, height, cellSize, originX, originY);
    const rx = SampleDistanceField(x + eps, y, field, width, height, cellSize, originX, originY);
    const dy = SampleDistanceField(x, y - eps, field, width, height, cellSize, originX, originY);
    const uy = SampleDistanceField(x, y + eps, field, width, height, cellSize, originX, originY);

    if (!Number.isFinite(c))
        return { x: 0, y: 0 };

    let gx = 0;
    let gy = 0;

    if (Number.isFinite(lx) && Number.isFinite(rx))
        gx = (rx - lx) / (2 * eps);
    else if (Number.isFinite(rx))
        gx = (rx - c) / eps;
    else if (Number.isFinite(lx))
        gx = (c - lx) / eps;

    if (Number.isFinite(dy) && Number.isFinite(uy))
        gy = (uy - dy) / (2 * eps);
    else if (Number.isFinite(uy))
        gy = (uy - c) / eps;
    else if (Number.isFinite(dy))
        gy = (c - dy) / eps;

    const mag = Math.hypot(gx, gy);
    if (mag < 1e-8)
        return { x: 0, y: 0 };

    return {
        x: -gx / mag,
        y: -gy / mag
    };
}

function SampleDistanceFieldGrid(ix, iy, field, width, height)
{
    if (ix < 0 || iy < 0 || ix >= width || iy >= height)
        return Infinity;

    return field[ix][iy];
}

function Safe(v)
{
    return Number.isFinite(v);
}

function SampleDistanceField(
    x, y,
    field,
    width,
    height,
    cellSize,
    originX,
    originY
)
{
    const gx = (x - originX) / cellSize;
    const gy = (y - originY) / cellSize;

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
            ix >= width || iy >= height
        )
        {
            return Infinity;
        }
        return field[ix + iy * width];
    }

    const v00 = get(x0, y0);
    const v10 = get(x1, y0);
    const v01 = get(x0, y1);
    const v11 = get(x1, y1);

    // bilinear weights
    const w00 = (1 - tx) * (1 - ty);
    const w10 = tx * (1 - ty);
    const w01 = (1 - tx) * ty;
    const w11 = tx * ty;

    let sum = 0;
    let weight = 0;

    function add(v, w)
    {
        if (Number.isFinite(v))
        {
            sum += v * w;
            weight += w;
        }
    }

    add(v00, w00);
    add(v10, w10);
    add(v01, w01);
    add(v11, w11);

    if (weight === 0)
    {
        return Infinity;
    }

    //console.log(sum / weight);

    return sum / weight;
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

    const costField = BuildSmoothCostField(collisionGrid, targetX, targetY, fieldOriginX, fieldOriginY, cellSize);

    //onsole.log(costField);

    //const costField = SmoothCostField(rawCostField, collisionGrid, width, height);

    let flowField = BuildGradientFlowField(costField, collisionGrid, width, height);

    flowField = SmoothFlowFieldStructured(flowField, collisionGrid, fieldWidth, fieldHeight, 2, 1, 0.2);

    //flowField = FillInvalidFlowCells(flowField, collisionGrid, width, height);

    //flowField = SmoothFlowFieldStructured(flowField, collisionGrid, fieldWidth, fieldHeight, 4, 2, 0.65);

    //flowField = SmoothFlowField(flowField, width, height);

    return flowField;
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

function SmoothFlowFieldStructured(
    flowField,
    collisionGrid,
    width,
    height,
    radius,
    sigma,
    angleThreshold = 0.6
)
{
    const out = Array.from({ length: width }, () =>
        Array.from({ length: height }, () => ({ x: 0, y: 0 }))
    );

    const sigma2 = sigma * sigma;
    const twoSigma2 = 2 * sigma2;

    for (let x = 0; x < width; x++)
    for (let y = 0; y < height; y++)
    {
        const center = flowField[x][y];

        let sumX = 0;
        let sumY = 0;
        let sumW = 0;

        const cmag = Math.hypot(center.x, center.y) || 1;
        const cx = center.x / cmag;
        const cy = center.y / cmag;

        for (let dx = -radius; dx <= radius; dx++)
        for (let dy = -radius; dy <= radius; dy++)
        {
            const nx = x + dx;
            const ny = y + dy;

            if (
                nx < 0 || ny < 0 ||
                nx >= width || ny >= height
            ) continue;

            if (collisionGrid[nx][ny]) continue;

            const v = flowField[nx][ny];
            const mag = Math.hypot(v.x, v.y);

            if (mag === 0) continue;

            const vx = v.x / mag;
            const vy = v.y / mag;

            // -----------------------------
            // ANGLE FILTER (key feature)
            // -----------------------------
            const dot = cx * vx + cy * vy;

            if (dot < angleThreshold) continue;

            // -----------------------------
            // GAUSSIAN WEIGHT
            // -----------------------------
            const dist2 = dx * dx + dy * dy;
            const w = Math.exp(-dist2 / twoSigma2);

            sumX += vx * w;
            sumY += vy * w;
            sumW += w;
        }

        if (sumW > 0)
        {
            sumX /= sumW;
            sumY /= sumW;

            const mag = Math.hypot(sumX, sumY) || 1;

            out[x][y] = {
                x: sumX / mag,
                y: sumY / mag
            };
        }
        else
        {
            // fallback: keep original direction
            out[x][y] = center;
        }
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

function FillInvalidFlowCells(flowField, collisionGrid, width, height)
{
    const out = flowField;

    const DIRS = [
        [1,0], [-1,0], [0,1], [0,-1],
        [1,1], [1,-1], [-1,1], [-1,-1]
    ];

    for (let x = 0; x < width; x++)
    for (let y = 0; y < height; y++)
    {
        if (!collisionGrid[x][y]) continue;

        // this cell is invalid → replace it

        let found = false;

        for (let r = 1; r <= 3 && !found; r++)
        {
            for (const [dx, dy] of DIRS)
            {
                const nx = x + dx * r;
                const ny = y + dy * r;

                if (
                    nx < 0 || ny < 0 ||
                    nx >= width || ny >= height
                ) continue;

                if (collisionGrid[nx][ny]) continue;

                const v = flowField[nx][ny];

                const mag = Math.hypot(v.x, v.y);
                if (!mag) continue;

                out[x][y] = {
                    x: v.x / mag,
                    y: v.y / mag
                };

                found = true;
                break;
            }
        }

        // fallback: if absolutely nothing found
        if (!found)
        {
            out[x][y] = { x: 0, y: 0 };
        }
    }

    return out;
}

function BuildGradientFlowField(cost, collisionGrid, width, height)
{
    const flow = Array.from({ length: width }, () =>
        Array.from({ length: height }, () => ({ x: 0, y: 0 }))
    );

    const EPS = 1e-6;

    for (let x = 1; x < width - 1; x++)
    for (let y = 1; y < height - 1; y++)
    {
        if (collisionGrid[x][y]) continue;

        let cx = 0;
        let cy = 0;

        let center = cost[x][y];

        // sample neighbors (finite difference gradient)
        const left  = cost[x - 1][y];
        const right = cost[x + 1][y];
        const up    = cost[x][y - 1];
        const down  = cost[x][y + 1];

        // IMPORTANT: treat invalid as high cost wall
        const safe = (v) => (v === Infinity ? center + 1000 : v);

        const dX = safe(right) - safe(left);
        const dY = safe(down) - safe(up);

        cx = -dX; // NEGATIVE GRADIENT (toward lower cost)
        cy = -dY;

        const mag = Math.hypot(cx, cy);

        if (mag > EPS)
        {
            flow[x][y].x = cx / mag;
            flow[x][y].y = cy / mag;
        }
        else
        {
            flow[x][y].x = 0;
            flow[x][y].y = 0;
        }
    }

    return flow;
}

function BuildSmoothCostField(
    collisionGrid,
    targetX,
    targetY,
    originX,
    originY,
    cellSize
)
{
    const W = collisionGrid.length;
    const H = collisionGrid[0].length;

    const cost = Array.from({ length: W }, () =>
        Array(H).fill(Infinity)
    );

    const tx = Math.floor((targetX - originX) / cellSize);
    const ty = Math.ceil((targetY - originY) / cellSize);

    if (
        tx < 0 || ty < 0 ||
        tx >= W || ty >= H
    ) return cost;

    if (collisionGrid[tx][ty])
    {
        console.error("TARGET BLOCKED");
        return cost;
    }

    cost[tx][ty] = 0;

    const DIRS = [
        [1,0,1],
        [-1,0,1],
        [0,1,1],
        [0,-1,1],
        [1,1,1.414],
        [1,-1,1.414],
        [-1,1,1.414],
        [-1,-1,1.414]
    ];

    let updated = true;

    while (updated)
    {
        updated = false;

        for (let x = 0; x < W; x++)
        for (let y = 0; y < H; y++)
        {
            if (collisionGrid[x][y]) continue;

            let best = cost[x][y];

            for (const [dx, dy, w] of DIRS)
            {
                const nx = x + dx;
                const ny = y + dy;

                if (
                    nx < 0 || ny < 0 ||
                    nx >= W || ny >= H
                ) continue;

                if (collisionGrid[nx][ny]) continue;

                const ncost = cost[nx][ny];

                if (ncost === Infinity) continue;

                const candidate = ncost + w;

                if (candidate < best)
                {
                    best = candidate;
                    updated = true;
                }
            }

            cost[x][y] = best;
        }
    }

    return cost;
}

function SmoothCostField(cost, collisionGrid, width, height, iterations = 2, alpha = 0.6)
{
    let field = cost.map(col => col.slice());

    for (let iter = 0; iter < iterations; iter++)
    {
        const next = field.map(col => col.slice());

        for (let x = 1; x < width - 1; x++)
        for (let y = 1; y < height - 1; y++)
        {
            if (collisionGrid[x][y]) continue;

            const c = field[x][y];

            const avg =
                field[x+1][y] +
                field[x-1][y] +
                field[x][y+1] +
                field[x][y-1];

            const smoothed = (avg / 4);

            next[x][y] = c * (1 - alpha) + smoothed * alpha;
        }

        field = next;
    }

    return field;
}

function SampleGradient(x, y, eps)
{

    const left  = SampleDistanceField(x - eps, y);
    const right = SampleDistanceField(x + eps, y);

    const down  = SampleDistanceField(x, y - eps);
    const up    = SampleDistanceField(x, y + eps);

    const gx = (right - left) / (2 * eps);
    const gy = (up - down) / (2 * eps);

    const mag = Math.hypot(gx, gy) || 1;

    return {
        x: -gx / mag,
        y: -gy / mag
    };
}