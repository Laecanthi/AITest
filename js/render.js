function render()
{
    const ctx = m_ctx;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if(renderField)
    {
        /*DrawDistanceField(
            distanceField,
            fieldWidth,
            fieldHeight,
            cellSize,
            fieldOriginX,
            fieldOriginY
        );*/
        ctx.putImageData(distanceFieldTexture, 0, 0);
    }

    DrawObstacles();

    DrawGround();

    if(!showOnlyLeader)
    {
        ctx.globalAlpha = nonLeaderOpacity;

        for (agent of agents)
        {
            DrawAgent(agent);
        }

        ctx.globalAlpha = 1;
    }        

    let bestIndex = 0;

    for(let i = 1; i < scores.length; i++)
    {
        if(scores[i] < scores[bestIndex])
        {
            bestIndex = i;
        }
    }

    DrawAgent(agents[bestIndex], "black", true);

    for(var i = 1; i < 10; i++)
    {
        DrawAgent(agents[i], "Blue", true);
    }

    DrawAgent(agents[0], "Red", true);

    /*for(var i = 0; i < targets.length; i++)
    {
        DrawTarget(targets[i].X, targets[i].Y, i);
    }*/

    DrawTarget(targetX, GetGroundHeight(targetX, groundY, generationSeed, targetX, targetRadius, curriculumStage), "Landing pad");

    ctx.strokeStyle = "Blue";
    ctx.beginPath();
    ctx.moveTo(155 * pixelsPerMeter, 5 * pixelsPerMeter);
    ctx.lineTo((155 + (windForceX + Math.cos(windDirection))) * pixelsPerMeter, (5 - (windForceY + Math.sin(windDirection))) * pixelsPerMeter);
    ctx.stroke();

    ctx.fillStyle = "Blue";
    ctx.beginPath();
    ctx.arc(155 * pixelsPerMeter, 5 * pixelsPerMeter, pixelsPerMeter / 2, 0, 2 * Math.PI);
    ctx.fill(); // Optional: Fill the circle with color

}

function UnrenderedSnapshot()
{
    const ctx = m_ctx;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if(renderField)
    {
        ctx.putImageData(distanceFieldTexture, 0, 0);
    }

    DrawObstacles();

    DrawGround();

    RenderTrajectory(trajectory, "Black", trajectoryValue);

    DrawTarget(targetX, GetGroundHeight(targetX, groundY, generationSeed, targetX, targetRadius, curriculumStage), "Landing pad");

    ctx.strokeStyle = "Blue";
    ctx.beginPath();
    ctx.moveTo(155 * pixelsPerMeter, 5 * pixelsPerMeter);
    ctx.lineTo((155 + (windForceX + Math.cos(windDirection))) * pixelsPerMeter, (5 - (windForceY + Math.sin(windDirection))) * pixelsPerMeter);
    ctx.stroke();

    ctx.fillStyle = "Blue";
    ctx.beginPath();
    ctx.arc(155 * pixelsPerMeter, 5 * pixelsPerMeter, pixelsPerMeter / 2, 0, 2 * Math.PI);
    ctx.fill(); // Optional: Fill the circle with color
}

function DrawAgent(agent, color = "Black", drawVectorLine = false)
{
const ctx = m_ctx;

ctx.strokeStyle = "Green";
ctx.beginPath();
ctx.moveTo(agent.xPos * pixelsPerMeter, -agent.yPos * pixelsPerMeter);
ctx.lineTo((agent.xPos + (agent.xAcc / 5)) * pixelsPerMeter, -(agent.yPos + (agent.yAcc / 5)) * pixelsPerMeter);
ctx.stroke();          // Render the line

/*ctx.strokeStyle = "Blue";
ctx.beginPath();
ctx.moveTo(agent.xPos * pixelsPerMeter, -agent.yPos * pixelsPerMeter);
ctx.lineTo((agent.xPos + (agent.xThrust * 2.5)) * pixelsPerMeter, -(agent.yPos + (agent.yThrust * 2.5)) * pixelsPerMeter);
ctx.stroke();          // Render the line*/

ctx.strokeStyle = "Blue";
ctx.beginPath();
ctx.moveTo((agent.xPos + (Math.cos(agent.angle) * 2.5)) * pixelsPerMeter, -(agent.yPos + (Math.sin(agent.angle)) * 2.5) * pixelsPerMeter);
ctx.lineTo((agent.xPos + (Math.cos(agent.angle) * 2.5 + Math.cos(agent.angle + (Math.PI / 2)) * agent.rotation)) * pixelsPerMeter, -(agent.yPos + (Math.sin(agent.angle)) * 2.5 +  Math.sin(agent.angle + (Math.PI / 2)) * agent.rotation) * pixelsPerMeter);
ctx.stroke();          // Render the line

ctx.strokeStyle = "Red";
ctx.beginPath();
ctx.moveTo(agent.xPos * pixelsPerMeter, -agent.yPos * pixelsPerMeter);
ctx.lineTo((agent.xPos + (agent.xVel / 5)) * pixelsPerMeter, -(agent.yPos + (agent.yVel / 5)) * pixelsPerMeter);
ctx.stroke();          // Render the line


ctx.fillStyle = color;
ctx.beginPath();
ctx.arc(agent.xPos * pixelsPerMeter, -agent.yPos * pixelsPerMeter, 0.5 * pixelsPerMeter, 0, 2 * Math.PI);
ctx.fill(); // Optional: Fill the circle with color

ctx.strokeStyle = color;
ctx.beginPath();
ctx.moveTo(agent.xPos * pixelsPerMeter, -agent.yPos * pixelsPerMeter);
ctx.lineTo((agent.xPos + (Math.cos(agent.angle) * 2.5)) * pixelsPerMeter, -(agent.yPos + (Math.sin(agent.angle)) * 2.5) * pixelsPerMeter);
ctx.stroke();          // Render the line

    if(drawVectorLine)
    {
        const v = SampleFlowGradient(agent.xPos, agent.yPos, distanceField, fieldWidth, fieldHeight, cellSize, fieldOriginX, fieldOriginY);

        ctx.strokeStyle = "Cyan";
        ctx.beginPath();
        ctx.moveTo(agent.xPos * pixelsPerMeter, -agent.yPos * pixelsPerMeter);
        ctx.lineTo((agent.xPos + (v.x * 5)) * pixelsPerMeter, -(agent.yPos + (v.y * 5)) * pixelsPerMeter);
        ctx.stroke();          // Render the line
    }
}

function DrawTarget(x, y, id)
{
const ctx = m_ctx;

ctx.fillStyle = "Red";
ctx.beginPath();
ctx.arc(x * pixelsPerMeter, -y * pixelsPerMeter, 0.5 * pixelsPerMeter, 0, 2 * Math.PI);
ctx.fill();

ctx.strokeStyle = "Red";
ctx.beginPath();
ctx.arc(x * pixelsPerMeter, -y * pixelsPerMeter, targetRadius * pixelsPerMeter, degreesToRadians(-15), degreesToRadians(15));
ctx.stroke();
ctx.beginPath();
ctx.arc(x * pixelsPerMeter, -y * pixelsPerMeter, targetRadius * pixelsPerMeter, degreesToRadians(180-15), degreesToRadians(180+15));
ctx.stroke();
ctx.beginPath();
ctx.moveTo((x-targetRadius) * pixelsPerMeter, -y * pixelsPerMeter);
ctx.lineTo((x+targetRadius) * pixelsPerMeter, -y * pixelsPerMeter);
ctx.stroke();



ctx.font = "15px Arial";
ctx.fillStyle = "red";

ctx.fillText(id, x * pixelsPerMeter + (25 + targetRadius), -y * pixelsPerMeter - 15);
}

function RenderGraph()
{
const ctx = g_ctx;

graphXScale = (genCanv.width - padding * 2) / Math.max(1, bestScore.length - 1 - xMinValue);

let maxLogValue = 0;
let minLogValue = Infinity;

const allArrays = [bestScore, averageScore, medianScore]; // Worst score is not accounted for with scaling

for (const array of allArrays)
{
    for (var i = xMinValue; i < array.length; i++)
    {
        maxLogValue = Math.min(Math.max(
            maxLogValue,
            LogTransform(array[i])
        ), yMaxValue);

        minLogValue = Math.min(
            minLogValue,
            LogTransform(array[i])
        )
    }
}

graphYScale = (genCanv.height - padding * 2) / (maxLogValue - minLogValue);

yShift = minLogValue * graphYScale - padding;
xShift = padding;

ctx.clearRect(0, 0, genCanv.width, genCanv.height);

PlotArray(bestScore, "Black");
PlotArray(averageScore, "Green");
PlotArray(medianScore, "Blue");
PlotArray(worstScore, "Red");

ctx.strokeStyle = "black";

DrawHorizontalGrid(ctx, [
    0,
    1000,
    10000,
    20000,
    50000,
    100000
], graphYScale);

AddTitle(ctx, genCanv, "Generation");

RenderStackedGraph(
    grade_ctx,
    gradeCanv,
    [
        grade0History,
        grade1History,
        grade2History,
        grade3History,
        grade4History
    ],
    {
        smooth: false,

        colors:
        [
            "#222222", // 0
            "#4444ff", // 1
            "#44aa44", // 2
            "#ffaa44", // 3
            "#ff4444"  // 4
        ]
    }
);

AddTitle(grade_ctx, gradeCanv, "Grades")
}

function PlotArray(array, color)
{
const ctx = g_ctx;

if(array.length === 0) return;

ctx.strokeStyle = color;

ctx.beginPath();

let firstY = genCanv.height - (LogTransform(array[xMinValue] + 1) * graphYScale);

ctx.moveTo(padding, firstY + yShift);

for(var i = xMinValue; i < array.length; i++)
{
    let y =
        genCanv.height -
        (LogTransform(array[i] + 1) * graphYScale);

    ctx.lineTo((i - xMinValue) * graphXScale + padding, y + yShift);
}
ctx.stroke();
}

function RenderNetwork(network, liveMode)
{
const ctx = n_ctx;

const W = networkCanv.width;
const H = networkCanv.height;

ctx.clearRect(0, 0, W, H);

const pad = {
    left: 120,
    right: 90,
    top: 60,
    bottom: 20
};

const nodeRadius = 10;

const innerW = W - pad.left - pad.right;
const innerH = H - pad.top - pad.bottom;

// ---------------------------------------------------
// TRUE VISUAL LAYERS
// ---------------------------------------------------
const layers = [
    { type: "input", size: network.inputs.length },

    { type: "hl1", size: network.hl1.length },
    { type: "hl2", size: network.hl2.length },

    { type: "output", size: network.outputs.length },
    { type: "mb1", size: network.mb1.length },
    { type: "mb2", size: network.mb2.length }
];

const L = layers.length;

const layerX = (i) =>
    pad.left + (i / (L - 1)) * innerW;

const nodeY = (i, size) =>
    pad.top + (i / Math.max(1, size - 1)) * innerH;

// ---------------------------------------------------
// NODE POSITIONS
// ---------------------------------------------------
const pos = layers.map((layer, li) => {
    const x = layerX(li);
    const arr = [];

    for (let i = 0; i < layer.size; i++) {
        if(layer.type == "mb1" || layer.type == "mb2")
        {
            arr.push({ x, y: nodeY(i, layer.size * 1.5) });
        }else{
            arr.push({ x, y: nodeY(i, layer.size) });
        }
        
    }
    
    return arr;
});

// ---------------------------------------------------
// VALUE ACCESS (LIVE vs BIAS)
// ---------------------------------------------------
function getValue(li, i)
{
    const type = layers[li].type;

    if (liveMode)
    {
        if (type === "input") return network.inputs[i];
        if (type === "hl1") return network.hl1[i];
        if (type === "hl2") return network.hl2[i];
        if (type === "output") return network.outputs[i];
        if (type === "mb1") return network.mb1[i];
        if (type === "mb2") return network.mb2[i];
    }
    else
    {
        if (type === "input") return 0;
        if (type === "hl1") return network.bs1[i];
        if (type === "hl2") return network.bs2[i];

        if (type === "output") return network.bs3[i];

        if (type === "mb1") return network.bs3[network.outputs.length + i];
        if (type === "mb2") return network.bs3[network.outputs.length + network.mb1.length + i];
    }

    return 0;
}

// ---------------------------------------------------
// VISUALS
// ---------------------------------------------------
function weightColor(w)
{
    const a = Math.min(1, Math.abs(w));
    return w >= 0
        ? `rgba(0,0,255,${a})`
        : `rgba(255,0,0,${a})`;
}

function nodeColor(v)
{
    const a = Math.min(1, Math.abs(v));
    return v >= 0
        ? `rgb(0,0,${255 * a})`
        : `rgb(${255 * a},0,0)`;
}

// ---------------------------------------------------
// DRAW CONNECTIONS
// ---------------------------------------------------

function connect(fromL, toL, weights)
{
    const A = layers[fromL];
    const B = layers[toL];

    let idx = 0;

    for (let i = 0; i < A.size; i++)
    {
        for (let j = 0; j < B.size; j++)
        {
            const w = weights[idx++];

            const p1 = pos[fromL][i];
            const p2 = pos[toL][j];

            ctx.beginPath();
            ctx.strokeStyle = weightColor(w);
            ctx.lineWidth = Math.min(1, Math.abs(w)) * 2;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }
    }
}

// ---------------------------------------------------
// CONNECTIONS
// ---------------------------------------------------

// cn1: inputs + mb1 + mb2 → hl1
connect(0, 1, network.cn1);

// cn2: hl1 → hl2
connect(1, 2, network.cn2);

// cn3: hl2 → outputs + mb1 + mb2
connect(2, 3, network.cn3);

// ---------------------------------------------------
// DRAW NODES
// ---------------------------------------------------
ctx.font = "10px Arial";
ctx.textAlign = "center";
ctx.lineWidth = 1;

for (let li = 0; li < layers.length; li++)
{
    for (let i = 0; i < layers[li].size; i++)
    {
        const p = pos[li][i];
        const v = getValue(li, i);

        ctx.beginPath();
        ctx.fillStyle = nodeColor(v);
        if (layers[li].type === "mb1" || layers[li].type === "mb2")
        {
            ctx.arc(p.x, p.y, nodeRadius + 5, 0, Math.PI * 2); // larger memory nodes
        }else{
            ctx.arc(p.x, p.y, nodeRadius, 0, Math.PI * 2);
        }
        ctx.fill();

        ctx.strokeStyle = "black";
        ctx.stroke();

                // Label memory nodes
        if (layers[li].type === "mb1")
        {
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.font = "500 10px Arial";
            ctx.fillText(`M1-${i}`, p.x, p.y + 3);
        }

        if (layers[li].type === "mb2")
        {
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.font = "500 10px Arial";
            ctx.fillText(`M2-${i}`, p.x, p.y + 3);
        }
    }
}

// ---------------------------------------------------
// LABELS
// ---------------------------------------------------
ctx.fillStyle = "black";
ctx.font = "12px Arial";

for (let i = 0; i < layers.length; i++)
{
    const x = layerX(i);
    const label = layerLabels?.[i] ?? layers[i].type;
    ctx.textAlign = "center";
    ctx.fillText(label, x, pad.top - 10 - (nodeRadius + 4));
}

if (inputLabels)
{
    for (let i = 0; i < inputLabels.length; i++)
    {
        const p = pos[0][i];
        if (!p) continue;
        ctx.textAlign = "right";
        ctx.fillText(inputLabels[i], p.x - (nodeRadius + 4), p.y + 4);
    }
}

if (outputLabels)
{
    for (let i = 0; i < outputLabels.length; i++)
    {
        const p = pos[3][i];
        if (!p) continue;
        ctx.textAlign = "left";
        ctx.fillText(outputLabels[i], p.x + (nodeRadius + 4), p.y + 4);
    }
}

//---------------------
// INFO TEXT
//---------------------

ctx.fillStyle = "white"
ctx.fillRect(W - 25, H - pad.bottom, -225, -175);

ctx.fillStyle = "black";
ctx.font = "12px Arial";
ctx.textAlign = "left";

ctx.fillText("Age: " + network.age, W - 225, H - pad.bottom - 150);
ctx.fillText(network.i + " " + network.id, W - 225, H - pad.bottom - 125)
if(scores[network.i] != null)
{
    ctx.fillText("Score: " + scores[network.i].toFixed(2), W - 225, H - pad.bottom - 100);
}else{
    ctx.fillText("Score: " + 0.00, W - 225, H - pad.bottom - 100);
}
ctx.fillText("Last Score: " + network.lastScore.toFixed(2), W - 225, H - pad.bottom - 75)
}

function RenderNodeGraph(ctx, canvas, history, options = {})
{
    if(history.length < 2) return;

    //-----------------------------------
    // OPTIONS
    //-----------------------------------

    const {
        padding = 20,

        minValue = -1,
        maxValue = 1,

        clear = true,

        lineWidth = 1,

        smooth = false,

        colorFunction = (node, totalNodes) =>
        {
            const hue =
                (node / totalNodes) * 300;

            return `hsl(${hue},100%,50%)`;
        },

        drawBounds = true
    } = options;

    //-----------------------------------
    // SETUP
    //-----------------------------------

    const W = canvas.width;
    const H = canvas.height;

    if(clear)
    {
        ctx.clearRect(0,0,W,H);
    }

    const totalNodes =
        history[0].length;

    const xScale =
        (W - padding * 2) /
        Math.max(1, history.length - 1);

    const valueRange =
        maxValue - minValue;

    

    //-----------------------------------
    // BOUNDARY LINES
    //-----------------------------------

    if(drawBounds)
    {
        ctx.strokeStyle = "black";

        ctx.beginPath();

        // center
        ctx.moveTo(0, H/2);
        ctx.lineTo(W, H/2);

        // top
        ctx.moveTo(0, padding);
        ctx.lineTo(W, padding);

        // bottom
        ctx.moveTo(0, H - padding);
        ctx.lineTo(W, H - padding);

        ctx.stroke();
    }

    //-----------------------------------
    // DRAW ALL NODES
    //-----------------------------------

    ctx.lineWidth = lineWidth;

    for(let node = 0; node < totalNodes; node++)
    {
        ctx.strokeStyle =
            colorFunction(node, totalNodes);

        ctx.beginPath();

let ema = 0;

        for (let i = 0; i < history.length; i++)
        {
            let value;

            if (smooth)
            {
                const maxAlpha = 0.75;
                const minAlpha = 0.005;

                const raw = history[i][node];

                if (i === 0)
                {
                    ema = raw;
                }
                else
                {
                    const previous = history[i - 1][node];

                    let delta =
                        Math.abs(raw - previous);

                    const alpha =
                        lerp(
                            maxAlpha,
                            minAlpha,
                            clamp(delta / 1, 0, 1)
                        );

                    ema = alpha * raw + (1 - alpha) * ema;
                }

                value = ema;
            }else{
                value = history[i][node];
            }

            const normalized =
                (value - minValue) / valueRange;

            const x =
                i * xScale + padding;

            const y =
                H - padding -
                normalized * (H - padding * 2);

            if(i === 0)
            {
                ctx.moveTo(x, y);
            }
            else
            {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();
    }

    ctx.lineWidth = 1;
}

function RenderStackedGraph(ctx, canvas, histories, options = {})
{
    //-----------------------------------
    // OPTIONS
    //-----------------------------------

    const {
        padding = 20,

        clear = true,

        smooth = false,

        lineWidth = 1,

        colors = [
            "#222222",
            "#4444ff",
            "#44aa44",
            "#ffaa44",
            "#ff4444"
        ],

        normalize = true,

        drawBounds = true
    } = options;

    //-----------------------------------
    // SETUP
    //-----------------------------------

    const W = canvas.width;
    const H = canvas.height;

    if(clear)
    {
        ctx.clearRect(0,0,W,H);
    }

    if(histories.length === 0) return;
    if(histories[0].length < 2) return;

    const historyLength = histories[0].length;

    const xScale =
        (W - padding * 2) /
        Math.max(1, historyLength - 1);

    const graphHeight =
        H - padding * 2;

    //-----------------------------------
    // GRID
    //-----------------------------------

    if(drawBounds)
    {
        ctx.strokeStyle = "rgba(0,0,0,0.2)";
        ctx.lineWidth = 1;

        for(let i = 0; i <= 4; i++)
        {
            const y =
                H - padding -
                (i / 4) * graphHeight;

            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(W - padding, y);
            ctx.stroke();
        }
    }

    //-----------------------------------
    // BUILD STACKED DATA
    //-----------------------------------

    const stacked = [];

    for(let i = 0; i < historyLength; i++)
    {
        //-----------------------------------
        // FIRST:
        // get smoothed/raw values
        //-----------------------------------

        const values = [];

        let total = 0;

        for(let j = 0; j < histories.length; j++)
        {
            let value;

            if(smooth)
            {
                value =
                    RollingAverageIndexed(
                        histories[j],
                        5,
                        i
                    );
            }
            else
            {
                value = histories[j][i];
            }

            value = Math.max(0, value);

            values.push(value);

            total += value;
        }

        if(total <= 0) total = 1;

        //-----------------------------------
        // THEN normalize + accumulate
        //-----------------------------------

        let cumulative = 0;

        stacked[i] = [];

        for(let j = 0; j < histories.length; j++)
        {
            let value = values[j];

            if(normalize)
            {
                value /= total;
            }

            cumulative += value;

            stacked[i][j] = cumulative;
        }
    }

    //-----------------------------------
    // DRAW STACKS
    //-----------------------------------

    for(let layer = histories.length - 1; layer >= 0; layer--)
    {
        ctx.beginPath();

        //-----------------------------------
        // TOP EDGE
        //-----------------------------------

        for(let i = 0; i < historyLength; i++)
        {
            const x =
                padding + i * xScale;

            const value =
                stacked[i][layer];

            const y =
                H - padding -
                value * graphHeight;

            if(i === 0)
            {
                ctx.moveTo(x, y);
            }
            else
            {
                ctx.lineTo(x, y);
            }
        }

        //-----------------------------------
        // BOTTOM EDGE
        //-----------------------------------

        for(let i = historyLength - 1; i >= 0; i--)
        {
            const x =
                padding + i * xScale;

            let value = 0;

            if(layer > 0)
            {
                value =
                    stacked[i][layer - 1];
            }

            const y =
                H - padding -
                value * graphHeight;

            ctx.lineTo(x, y);
        }

        ctx.closePath();

        //-----------------------------------
        // FILL
        //-----------------------------------

        ctx.globalAlpha = 0.85;

        ctx.fillStyle =
            colors[layer % colors.length];

        ctx.fill();

        ctx.globalAlpha = 1;

        //-----------------------------------
        // OUTLINE
        //-----------------------------------

        ctx.strokeStyle = "rgba(0,0,0,0.15)";
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    }

}

function AddTitle(ctx, canvas, title)
{
    ctx.fillStyle = "black";
    ctx.font = "12px Arial";
    ctx.textAlign = "left";

    ctx.fillText(title, padding / 2, padding / 2);
}

function RenderEventGraph(ctx, canvas, events, maxLength, options = {})
{
    //-----------------------------------
    // OPTIONS
    //-----------------------------------

    const {
        padding = 20,

        lineColor = "rgba(0,0,0,0.4)",
        textColor = "black",

        font = "12px Arial",

        staggerHeight = 14,

        lineWidth = 1
    } = options;

    //-----------------------------------
    // SETUP
    //-----------------------------------

    const W = canvas.width;
    const H = canvas.height;

    const graphWidth =
        W - padding * 2;

    //ctx.save();

    ctx.font = font;
    ctx.fillStyle = textColor;
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;

    //-----------------------------------
    // DRAW EVENTS
    //-----------------------------------

    for(let i = 0; i < events.length; i++)
    {
        const event = events[i];

        const normalizedX =
            event.x / Math.max(1, maxLength);

        const x =
            padding + normalizedX * graphWidth;

        //-----------------------------------
        // vertical line
        //-----------------------------------

        ctx.beginPath();

        ctx.moveTo(x, padding);

        ctx.lineTo(x, H - padding);

        ctx.stroke();

        //-----------------------------------
        // label
        //-----------------------------------

        // stagger labels so they don't overlap horribly
        const y =
            H - padding * 2 +
            ((i % 3) * staggerHeight);

        ctx.fillText(
            event.label,
            x + 4,
            y
        );
    }

    //ctx.restore();
}

function RenderInfoGraphs()
{
    RenderNodeGraph(
        mem_ctx,
        memoryCanv,
        memoryHistory,
        {
            padding: padding,

            minValue: -1,
            maxValue: 1,

            smooth: true,

            lineWidth: 2,

            colorFunction: (node, total) =>
            {
                const hue =
                    (node / total) * 300;

                return `hsl(${hue},100%,50%)`;
            }
        }
    );
    AddTitle(mem_ctx, memoryCanv, "Memory");
    RenderEventGraph(
        mem_ctx,
        memoryCanv,
        generationEvents,
        memoryHistory.length
    );

    RenderNodeGraph(
        o_ctx,
        outputCanv,
        outputHistory,
        {
            padding: padding,

            minValue: -1,
            maxValue: 1,

            smooth: true,

            clear: true,

            lineWidth: 2,

            colorFunction: (node) =>
            {
                const colors = ["blue", "green", "black", "red"];
                return colors[node];
            },

            drawBounds: true
        }
    );
    AddTitle(o_ctx, outputCanv, "Outputs");
    RenderEventGraph(
        o_ctx,
        outputCanv,
        generationEvents,
        memoryHistory.length
    );

    let largestAbs = LargestAbs2D(linearMHistory);

    RenderNodeGraph(
        lm_ctx,
        linearMCanv,
        linearMHistory,
        {
            padding: padding,

            minValue: -largestAbs,
            maxValue: largestAbs,

            smooth: true,

            lineWidth: 2,

            colorFunction: (node, total) =>
            {
                const hue = node % 2 === 0 ? 240 : 0;
                const value = (node - (node % 2)) / total * 50 + 25;

                return `hsl(${hue},${value}%,${value}%)`;
            }
        }
    );

    RenderNodeGraph(
        lm_ctx,
        linearMCanv,
        positionHistory,
        {
            padding: padding,

            minValue: -1,
            maxValue: 1,

            clear: false,

            smooth: true,

            lineWidth: 2,

            colorFunction: (node) =>
            {
                return node === 0 ? "blue" : "red";
            },

            drawBounds: false
        }
    );

    AddTitle(lm_ctx, linearMCanv, "Linear Motion");
    RenderEventGraph(
        lm_ctx,
        linearMCanv,
        generationEvents,
        memoryHistory.length
    );

    RenderNodeGraph(
        am_ctx,
        angularMCanv,
        angularMHistory,
        {
            padding: padding,

            minValue: -1,
            maxValue: 1,

            smooth: true,

            lineWidth: 2,

            colorFunction: (node, total) =>
            {
                const hue =
                    (node / total) * 300;

                return `hsl(${hue},50%,40%)`;
            }
        }
    );
    AddTitle(am_ctx, angularMCanv, "Angular Motion");
    RenderEventGraph(
        am_ctx,
        angularMCanv,
        generationEvents,
        memoryHistory.length
    );

    largestAbs = LargestAbs2D(instabilityHistory);

    RenderNodeGraph(
        ins_ctx,
        instabilityCanv,
        instabilityHistory,
        {
            padding: padding,

            minValue: 0,
            maxValue: largestAbs,

            smooth: true,

            lineWidth: 2,

            drawBounds: false,

            colorFunction: (node, total) =>
            {
                const hue =
                    (node / total) * 300;

                return `hsl(${hue},50%,40%)`;
            }
        }
    );
    AddTitle(ins_ctx, instabilityCanv, "Instability");
    RenderEventGraph(
        ins_ctx,
        instabilityCanv,
        generationEvents,
        memoryHistory.length
    );

    RenderNodeGraph(
        con_ctx,
        conditionsCanv,
        conditionsHistory,
        {
            padding: padding,

            minValue: -1,
            maxValue: 1,

            smooth: true,

            lineWidth: 2,

            drawBounds: true,

            colorFunction: (node, total) =>
            {
                const hue =
                    (node / total) * 300;

                return `hsl(${hue},50%,40%)`;
            }
        }
    );
    AddTitle(con_ctx, conditionsCanv, "Conditions");
    RenderEventGraph(
        con_ctx,
        conditionsCanv,
        generationEvents,
        memoryHistory.length
    );
}

function RenderTrajectory(positions, color = "Black", values = [])
{
        const ctx = m_ctx;
        const last = positions[positions.length - 1];

        if(values.length == 0)
        {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();

            for(let i = 0; i < positions.length; i++)
            {
                const x = positions[i][0] * pixelsPerMeter;
                const y = positions[i][1] * pixelsPerMeter;

                if(i === 0)
                {
                    ctx.moveTo(x, -y);
                }
                else
                {
                    ctx.lineTo(x, -y);
                }
            }

            ctx.stroke();

            if(!renderSimulation)
            {
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(
                    last[0] * pixelsPerMeter,
                    -last[1] * pixelsPerMeter,
                    4,
                    0,
                    Math.PI * 2
                    );
                ctx.fill();
            }
        }else{

            let dist = 0;
            
            for(let i = 1; i < positions.length; i++)
            {
                const dx = positions[i][0] - positions[i-1][0];
                const dy = positions[i][1] - positions[i-1][1];

                dist += Math.sqrt(dx*dx + dy*dy);

                const hue = (dist * 10) % 300;
                const val = (Math.floor(i / 60 / simSubsteps) % 2) * 30 + 20;
                ctx.strokeStyle = `hsl(${hue},${val * 2}%,${val}%)`;
                ctx.lineWidth = values[i] + 1;

                const x = positions[i][0] * pixelsPerMeter;
                const y = positions[i][1] * pixelsPerMeter;

                ctx.beginPath();
                ctx.moveTo(positions[i-1][0] * pixelsPerMeter, -(positions[i-1][1] * pixelsPerMeter));
                ctx.lineTo(x, -y);
                ctx.stroke();
            }

            if(!renderSimulation)
            {
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(
                    last[0] * pixelsPerMeter,
                    -last[1] * pixelsPerMeter,
                    values[values.length - 1] * 2,
                    0,
                    Math.PI * 2
                    );
                ctx.fill();
            }
        }

        const first = positions[0];

        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(first[0] * pixelsPerMeter - 5,-first[1] * pixelsPerMeter - 5);
        ctx.lineTo(first[0] * pixelsPerMeter + 5,-first[1] * pixelsPerMeter + 5); 
        ctx.moveTo(first[0] * pixelsPerMeter + 5,-first[1] * pixelsPerMeter - 5);
        ctx.lineTo(first[0] * pixelsPerMeter - 5,-first[1] * pixelsPerMeter + 5); 
        ctx.stroke();

        

        //console.log(positions);
        //console.log("Trajectory Rendered!");
        
}

function DrawGround()
{
    const ctx = m_ctx;

    ctx.fillStyle = "green";
    ctx.beginPath();

    for(let x = 0; x < 800 / pixelsPerMeter; x++)
    {
        const y = GetGroundHeight(x, groundY, generationSeed, targetX, targetRadius, curriculumStage);

        if(x === 0)
        {
            ctx.moveTo(x * pixelsPerMeter, -y * pixelsPerMeter);
        }
        else
        {
            ctx.lineTo(x * pixelsPerMeter, -y * pixelsPerMeter);
        }
    }

    ctx.lineTo(800, 1000);
    ctx.lineTo(0, 1000);
    ctx.closePath();
    ctx.fill();

    const targetY = -GetGroundHeight(targetX, groundY, generationSeed, targetX, targetRadius, curriculumStage) * pixelsPerMeter;

    ctx.fillStyle = "grey";
    ctx.beginPath();
    ctx.moveTo((targetX-targetRadius) * pixelsPerMeter, targetY);
    ctx.lineTo((targetX+targetRadius) * pixelsPerMeter, targetY);
    ctx.lineTo((targetX+targetRadius) * pixelsPerMeter, targetY + (2 * pixelsPerMeter));
    ctx.lineTo((targetX-targetRadius) * pixelsPerMeter, targetY + (2 * pixelsPerMeter));
    ctx.closePath();
    ctx.fill();
}

function DrawObstacles()
{
    const ctx = m_ctx;

    ctx.fillStyle = "grey";
    ctx.beginPath();

    for(let obs of obstacles)
    {
        const x = obs.x * pixelsPerMeter;
        const y = -obs.y * pixelsPerMeter;
        const w = obs.w * pixelsPerMeter;
        const h = -obs.h * pixelsPerMeter;

        ctx.fillRect(x, y, w, h);
    }

    ctx.fill();
}

function DrawHorizontalGrid(ctx, values, yScale)
{
    for(let v of values)
    {
        const y =
            yShift +
            genCanv.height +
            (v * yScale);

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(genCanv.width, y);
        ctx.stroke();
    }
}

function DrawFlowField(
    flowField,
    width,
    height,
    cellSize,
    fieldOriginX,
    fieldOriginY,
)
{
    const ctx = m_ctx;
    ctx.save();
    ctx.lineWidth = 1;

    ctx.fillStyle = "red";
    ctx.fillRect(
        fieldOriginX * pixelsPerMeter,
        canvas.height - fieldOriginY * pixelsPerMeter,
        5, 5
    );

    ctx.fillStyle = "red";
    ctx.fillRect(
        0 * pixelsPerMeter,
        0 * pixelsPerMeter,
        5, 5
    );

    const scale = cellSize * pixelsPerMeter;

    for (let y = 0; y < height; y++)
    {
        for (let x = 0; x < width; x++)
        {
            const i = (x + y * width) * 2;

            const fx = flowField[i];
            const fy = flowField[i + 1];

            if (!Number.isFinite(fx) || !Number.isFinite(fy)) continue;

            const mag = Math.hypot(fx, fy);
            if (mag < 0.0001) continue;

            const nx = fx / mag;
            const ny = fy / mag;

            const px =
                (fieldOriginX + x * cellSize) * pixelsPerMeter;

            const py =
                0 -
                (fieldOriginY + y * cellSize) * pixelsPerMeter;

            const dx = nx * scale;
            const dy = -ny * scale;

            ctx.strokeStyle =
                `rgba(${(fx + 1) * 127.5}, ${(fy + 1) * 127.5}, 0, 0.6)`;

            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + dx, py + dy);
            ctx.stroke();

            // arrow head
            ctx.beginPath();
            ctx.arc(px + dx, py + dy, 1.2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${(fx + 1) * 127.5}, ${(fy + 1) * 127.5}, 0, 0.6)`;;
            ctx.fill();
        }
    }

    ctx.restore();
}

function DrawDistanceField(
    distanceField,
    width,
    height,
    cellSize,
    fieldOriginX,
    fieldOriginY
)
{
    const ctx = m_ctx;

    ctx.save();

    const scale = cellSize * pixelsPerMeter * 0.8;

    const worldLeft   = 0;
    const worldRight  = 0 + canvas.width  / pixelsPerMeter;
    const worldTop    = 0;
    const worldBottom = 0 - canvas.height / pixelsPerMeter;

    let minX = Math.floor((worldLeft  - fieldOriginX) / cellSize);
    let maxX = Math.ceil ((worldRight - fieldOriginX) / cellSize);

    let minY = Math.floor((worldBottom - fieldOriginY) / cellSize);
    let maxY = Math.ceil ((worldTop    - fieldOriginY) / cellSize);

    minX = Math.max(0, minX);
    minY = Math.max(0, minY);
    maxX = Math.min(width - 1, maxX);
    maxY = Math.min(height - 1, maxY);

    //----------------------------------------
    // SAMPLE DISTANCE HELPER
    //----------------------------------------

    function get(x, y)
    {
        if (
            x < 0 || y < 0 ||
            x >= width || y >= height
        )
        {
            return Infinity;
        }

        return distanceField[x + y * width];
    }

    //----------------------------------------
    // DRAW
    //----------------------------------------

    for (let y = minY; y <= maxY; y++)
    {
        for (let x = minX; x <= maxX; x++)
        {
            const center = get(x, y);

            if (!Number.isFinite(center))
                continue;

            const wx = fieldOriginX + x * cellSize;
            const wy = fieldOriginY + y * cellSize;

            const px = wx * pixelsPerMeter;
            const py = -wy * pixelsPerMeter;

            const v = SampleFlowGradient(
                wx,
                wy,
                distanceField,
                width,
                height,
                cellSize,
                fieldOriginX,
                fieldOriginY
            );

            const dx = v.x * scale;
            const dy = -v.y * scale;

            ctx.strokeStyle =
                `rgba(${(v.x + 1) * 127.5}, ${(v.y + 1) * 127.5}, 0, 0.7)`;

            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + dx, py + dy);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(px + dx, py + dy, 1.2, 0, Math.PI * 2);
            ctx.fillStyle =
                `rgba(${(v.x + 1) * 127.5}, ${(v.y + 1) * 127.5}, 0, 0.7)`;
            ctx.fill();
        }
    }

    ctx.restore();
}

function BakeFlowTexture(flowField, width, height)
{
    const img = new ImageData(width, height);
    const data = img.data;

    let i = 0;

    for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
    {
        const wx = x / pixelsPerMeter
        const wy = -y / pixelsPerMeter

        const v = SampleFlowGradient(
                wx,
                wy,
                flowField,
                fieldWidth,
                fieldHeight,
                cellSize,
                fieldOriginX,
                fieldOriginY
            );

        const vx = v.x;
        const vy = v.y;

        const r = (vx * 0.5 + 0.5) * 255;
        const g = (vy * 0.5 + 0.5) * 255;

        data[i++] = r;
        data[i++] = g;
        data[i++] = 0;
        data[i++] = 155;
    }

    return img;
}