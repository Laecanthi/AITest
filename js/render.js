function render()
{
const ctx = m_ctx;

ctx.clearRect(0, 0, canvas.width, canvas.height);

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

DrawAgent(agents[bestIndex]);

for(var i = 1; i < 10; i++)
{
    DrawAgent(agents[i], "Blue");
}

DrawAgent(agents[0], "Red");

for(var i = 0; i < targets.length; i++)
{
    DrawTarget(targets[i].X, targets[i].Y, i);
}

ctx.strokeStyle = "Blue";
ctx.beginPath();
ctx.moveTo(75 * pixelsPerMeter, 5 * pixelsPerMeter);
ctx.lineTo((75 + (windForceX + Math.cos(windDirection))) * pixelsPerMeter, (5 - (windForceY + Math.sin(windDirection))) * pixelsPerMeter);
ctx.stroke();

ctx.fillStyle = "Blue";
ctx.beginPath();
ctx.arc(75 * pixelsPerMeter, 5 * pixelsPerMeter, pixelsPerMeter / 2, 0, 2 * Math.PI);
ctx.fill(); // Optional: Fill the circle with color

}

function DrawAgent(agent, color = "Black")
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
ctx.arc(agent.xPos * pixelsPerMeter, -agent.yPos * pixelsPerMeter, 5, 0, 2 * Math.PI);
ctx.fill(); // Optional: Fill the circle with color

ctx.strokeStyle = color;
ctx.beginPath();
ctx.moveTo(agent.xPos * pixelsPerMeter, -agent.yPos * pixelsPerMeter);
ctx.lineTo((agent.xPos + (Math.cos(agent.angle) * 2.5)) * pixelsPerMeter, -(agent.yPos + (Math.sin(agent.angle)) * 2.5) * pixelsPerMeter);
ctx.stroke();          // Render the line
}

function DrawTarget(x, y, id)
{
const ctx = m_ctx;

ctx.fillStyle = "Red";

ctx.beginPath();
ctx.arc(x * pixelsPerMeter, -y * pixelsPerMeter, 5, 0, 2 * Math.PI);
ctx.fill();

ctx.strokeStyle = "Red";
ctx.beginPath();
ctx.arc(x * pixelsPerMeter, -y * pixelsPerMeter, targetRadius * pixelsPerMeter, 0, 2 * Math.PI);
ctx.stroke();

ctx.font = "30px Arial";
ctx.fillStyle = "red";

ctx.fillText(id, x * pixelsPerMeter + 10, -y * pixelsPerMeter - 10);
}

function RenderGraph()
{
const ctx = g_ctx;

graphXScale = (graphCanv.width - padding * 2) / Math.max(1, bestScore.length - 1 - xMinValue);

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

graphYScale = (graphCanv.height - padding * 2) / (maxLogValue - minLogValue);

yShift = minLogValue * graphYScale - padding;
xShift = padding;

ctx.clearRect(0, 0, graphCanv.width, graphCanv.height);

PlotArray(bestScore, "Black");
PlotArray(averageScore, "Green");
PlotArray(medianScore, "Blue");
PlotArray(worstScore, "Red");

ctx.strokeStyle = "Black";

ctx.beginPath();
ctx.moveTo(0, yShift + graphCanv.height);
ctx.lineTo(graphCanv.width, yShift + graphCanv.height);
ctx.moveTo(0, yShift + graphCanv.height + (1000 * graphYScale));
ctx.lineTo(graphCanv.width, yShift + graphCanv.height + (1000 * graphYScale));
ctx.moveTo(0, yShift + graphCanv.height + (10000 * graphYScale));
ctx.lineTo(graphCanv.width, yShift + graphCanv.height + (10000 * graphYScale));
ctx.moveTo(0, yShift + graphCanv.height + (20000 * graphYScale));
ctx.lineTo(graphCanv.width, yShift + graphCanv.height + (20000 * graphYScale));
ctx.moveTo(0, yShift + graphCanv.height + (50000 * graphYScale));
ctx.lineTo(graphCanv.width, yShift + graphCanv.height + (50000 * graphYScale));
ctx.moveTo(0, yShift + graphCanv.height + (100000 * graphYScale));
ctx.lineTo(graphCanv.width, yShift + graphCanv.height + (100000 * graphYScale));
ctx.stroke();
}

function PlotArray(array, color)
{
const ctx = g_ctx;

if(array.length === 0) return;

ctx.strokeStyle = color;

ctx.beginPath();

let firstY = graphCanv.height - (LogTransform(array[xMinValue] + 1) * graphYScale);

ctx.moveTo(padding, firstY + yShift);

for(var i = xMinValue; i < array.length; i++)
{
    let y =
        graphCanv.height -
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