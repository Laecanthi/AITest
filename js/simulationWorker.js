const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
const lerp = (start, end, t) => start + (end - start) * t;

function SoftClamp(value) { return Math.tanh(value); }

function ResetLayers(network)
{
    for (var node = 0; node < network.inputs.length; node++) {network.inputs[node] = 0;}
    for (var node = 0; node < network.hl1.length; node++) {network.hl1[node] = 0;}
    for (var node = 0; node < network.hl2.length; node++) {network.hl2[node] = 0;}
    for (var node = 0; node < network.outputs.length; node++) {network.outputs[node] = 0;}
    for (var node = 0; node < network.mb1.length; node++) {network.mb1[node] = 0;}
    for (var node = 0; node < network.mb2.length; node++) {network.mb2[node] = 0;}
}

function UpdateNeuralNetwork(network, agent, targets, nextMovingTargetX, nextMovingTargetY, targetRadius) 
{   
    const inputs = network.inputs;
    const cn1 = network.cn1;
    const cn2 = network.cn2;
    const cn3 = network.cn3;
    const hl1 = network.hl1;
    const hl2 = network.hl2;
    const bs1 = network.bs1;
    const bs2 = network.bs2;
    const bs3 = network.bs3;
    const mb1 = network.mb1;
    const mb2 = network.mb2;
    const outputs = network.outputs;

    const inputsLen = inputs.length;
    const hl1Len = hl1.length;
    const hl2Len = hl2.length;
    const outputsLen = outputs.length;
    const mb1Len = mb1.length;
    const mb2Len = mb2.length;
    const totalOutputs = outputsLen + mb1Len + mb2Len;

    let dx = targets[agent.targetID].X - agent.xPos;
    let dy = targets[agent.targetID].Y - agent.yPos;
    let dist = Math.sqrt(
        dx*dx +
        dy*dy
    );

    /**************************************** INPUTS ********************************/

    inputs[0] = (targets[agent.targetID].X - agent.xPos) / 100;
    inputs[1] = (targets[agent.targetID].Y - agent.yPos) / 100;
    inputs[2] = Math.sin(agent.angle);
    inputs[3] = Math.cos(agent.angle);
    inputs[4] = (dist - targetRadius) / targetRadius;
    inputs[5] = (agent.xVel) / 25;
    inputs[6] = (agent.yVel) / 25;
    inputs[7] = (agent.aVel) * 5;
    inputs[8] = agent.fuel / 500;
    inputs[9] = (agent.yPos + 60) / 100;
    inputs[10] = (agent.xPos) / 100;
    inputs[11] = agent.xLastExternalForce / 10;
    inputs[12] = agent.yLastExternalForce / 10;

    if(agent.targetID + 1 < targets.length)
    {
        inputs[13] = (targets[agent.targetID + 1].X - agent.xPos) / 100;
        inputs[14] = (targets[agent.targetID + 1].Y - agent.yPos) / 100;
    }else{
        inputs[13] = (nextMovingTargetX - agent.xPos) / 100;
        inputs[14] = (nextMovingTargetY - agent.yPos) / 100;
    }

    // end of inputs

    //update hl1

    for (var hl1Node = 0; hl1Node < hl1Len; hl1Node++)
    {
        let sum = bs1[hl1Node];

        for (var inputNode = 0; inputNode < inputsLen; inputNode++) // inputs
        {
            var connection = (inputNode * hl1Len) + hl1Node;
            sum += inputs[inputNode] * cn1[connection];
        }

        for (var mb1Node = 0; mb1Node < mb1Len; mb1Node++) // mb1
        {
            var connection = ((mb1Node + inputsLen) * hl1Len) + hl1Node;
            sum += mb1[mb1Node] * cn1[connection];
        }

        for (var mb2Node = 0; mb2Node < mb2Len; mb2Node++) // mb2
        {
            var connection = ((mb2Node + mb1Len + inputsLen) * hl1Len) + hl1Node;
            sum += mb2[mb2Node] * cn1[connection];
        }

        hl1[hl1Node] = SoftClamp(sum);
    }

    //update hl2

    for (var hl2Node = 0; hl2Node < hl2Len; hl2Node++)
    {
        let sum = bs2[hl2Node];

        for (var hl1Node = 0; hl1Node < hl1Len; hl1Node++)
        {
            var connection = (hl1Node * hl2Len) + hl2Node;
            sum += hl1[hl1Node] * cn2[connection];
        }

        hl2[hl2Node] = SoftClamp(sum);
    }

    //update outputs

    for (var outputNode = 0; outputNode < outputsLen; outputNode++)
    {
        let sum = bs3[outputNode];

        for (var hl2Node = 0; hl2Node < hl2Len; hl2Node++)
        {
            var connection = (hl2Node * totalOutputs) + outputNode;
            sum += hl2[hl2Node] * cn3[connection];
        }

        outputs[outputNode] = SoftClamp(sum);
    }

    // update mb1: overwrite buffer
    for (var mb1Node = 0; mb1Node < mb1Len; mb1Node++)
    {
        let sum = bs3[mb1Node + outputsLen];

        for (var hl2Node = 0; hl2Node < hl2Len; hl2Node++)
        {
            var connection = (hl2Node * totalOutputs) + mb1Node + outputsLen;
            sum += hl2[hl2Node] * cn3[connection];
        }

        mb1[mb1Node] = SoftClamp(sum);
    }

    // update mb2: persistent buffer
    for (var mb2Node = 0; mb2Node < mb2Len; mb2Node++)
    {
        let sum = bs3[mb2Node + outputsLen + mb1Len];

        for (var hl2Node = 0; hl2Node < hl2Len; hl2Node++)
        {
            var connection = (hl2Node * totalOutputs) + mb2Node + outputsLen + mb1Len;
            sum += hl2[hl2Node] * cn3[connection];
        }

        if(!isFinite(sum))
        {
            console.log("error: mb2 node sum is not finite");
            sum = 0;
        }

        const bufferPersistence = 0.05;

        mb2[mb2Node] =
            SoftClamp(
                mb2[mb2Node] * (1 - bufferPersistence) +
                sum * bufferPersistence
            );
    }
}


function UpdateAgent(agent, dt, thrustBurn, windForceX, windForceY, crashVelocity)
{
    //agent.xThrust = clamp(agent.xThrust, -1, 1);
    //agent.yThrust = clamp(agent.yThrust, -1, 1);

    agent.thrust = clamp(agent.thrust, 0, 1);
    agent.rotation = clamp(agent.rotation, -1, 1);
    
    agent.fuel -= agent.thrust * thrustBurn * dt; // full thrust burns 50 fuel per second, a max of 10 seconds at full thrust
    agent.fuel -= Math.abs(agent.rotation / 10) * thrustBurn * dt; // rotating burns 5 fuel per second
    agent.fuel = Math.max(agent.fuel, 0);

    if(agent.fuel == 0)
    {
        agent.thrust = 0;
        agent.rotation = 0;
    }

    agent.mass = agent.dryMass + agent.fuel * agent.fuelMass;

    //console.log(agent);

    var xExternalForce = 0;
    var yExternalForce = 0;

    const localWindMagnitude = Math.sin(agent.yPos / 10) + Math.cos(agent.xPos / 10);

    xExternalForce += windForceX * localWindMagnitude;
    yExternalForce += windForceY * localWindMagnitude;

    agent.xLastExternalForce = xExternalForce;
    agent.yLastExternalForce = yExternalForce;

    agent.xAcc = agent.thrust * Math.cos(agent.angle) * agent.fThrust;
    agent.yAcc = agent.thrust * Math.sin(agent.angle) * agent.fThrust;

    agent.xAcc += xExternalForce;
    agent.yAcc += yExternalForce;

    agent.xAcc /= agent.mass;
    agent.yAcc /= agent.mass;

    agent.aAcc = agent.rotation * agent.torque / agent.mass;

    agent.yAcc -= 9.8;

    agent.xVel *= 0.999;
    agent.yVel *= 0.999;
    agent.aVel *= 0.98;

    agent.xVel += agent.xAcc * dt;
    agent.yVel += agent.yAcc * dt;
    agent.aVel += agent.aAcc * dt;

    agent.xPos += agent.xVel * dt;
    agent.yPos += agent.yVel * dt;
    agent.angle += agent.aVel * dt;
}

onmessage = function(event) {
    const {
        networks, agents, targets,
        windForceX, windForceY,
        generationLength, dt,
        workerIndex, targetRadius,
        thrustBurn, crashVelocity,
        curriculumStage,
        nextMovingTargetX, nextMovingTargetY,
        currentMovingTargetX, currentMovingTargetY,
        networkShape 
    } = event.data;

    // reconstruct full network objects with activation arrays

    for(let i = 0; i < networks.length; i++) {
        const n = networks[i];
        n.inputs = new Float32Array(networkShape.inputLen);
        n.hl1 = new Float32Array(networkShape.hl1Len);
        n.hl2 = new Float32Array(networkShape.hl2Len);
        n.outputs = new Float32Array(networkShape.outputLen);
    }

    const scores = new Array(agents.length).fill(0);
    let time = 0;
    let movingTargetTime = 0;
    let currMovingTargetX = currentMovingTargetX;
    let currMovingTargetY = currentMovingTargetY;
    let nextMovTargetX = nextMovingTargetX;
    let nextMovTargetY = nextMovingTargetY;

    while(time < generationLength)
    {
        time += dt;
        movingTargetTime += dt / 5;

        if(movingTargetTime > 1)
        {
            currMovingTargetX = nextMovTargetX;
            currMovingTargetY = nextMovTargetY;
            nextMovTargetX = Math.random() * 80;
            nextMovTargetY = Math.random() * -60;
            movingTargetTime = 0;
        }

        if(targets[4] != null)
        {
            targets[4].X = lerp(currMovingTargetX, nextMovTargetX, movingTargetTime);
            targets[4].Y = lerp(currMovingTargetY, nextMovTargetY, movingTargetTime);
        }

        for(let i = 0; i < agents.length; i++)
        {
            if(!agents[i].alive) continue;

            var lastRotation = agents[i].rotation;
            var lastThrust = agents[i].thrust;

            UpdateNeuralNetwork(networks[i], agents[i], targets, nextMovTargetX, nextMovTargetY, targetRadius);

                const targetRotation =
                    networks[i].outputs[0];

                const targetThrust =
                    networks[i].outputs[1] / 2 + 0.5;

                agents[i].rotation = lerp(
                    agents[i].rotation,
                    targetRotation,
                    0.15
                );

                agents[i].thrust = lerp(
                    agents[i].thrust,
                    targetThrust,
                    0.15
                );

            UpdateAgent(agents[i], dt, thrustBurn, windForceX, windForceY, crashVelocity);

                   /***************************** REWARDS ***************************/

        // high score = bad
        let dx = targets[agents[i].targetID].X - agents[i].xPos;
        let dy = targets[agents[i].targetID].Y - agents[i].yPos;
        let dist = Math.sqrt(
            dx*dx +
            dy*dy
        );
        let speed = Math.sqrt(
            agents[i].xVel*agents[i].xVel +
            agents[i].yVel*agents[i].yVel
        );

        let deltaDist = agents[i].lastDist - dist;
        var deltaRotation = lastRotation - agents[i].rotation;
        var deltaThrust = lastThrust - agents[i].thrust;

        if(agents[i].lastDist == Infinity)
        {
            deltaDist = 0;
        }

        agents[i].lastDist = dist;

        var progress = 0;
        var success = 0;
        var safety = 0;
        var commitment = 0;
        var stagnation = 0;

        // PROGRESS

        if(deltaDist > 0)
        {
            // moving closer rewards agent
            progress -= deltaDist * 100;
        }
        else
        {
            // moving away heavily punishes agent
            progress += Math.abs(deltaDist) * 250;
        }
        //progress += dist / 1000;
        progress *= dt;

        // SUCCESS

        if(dist <= targetRadius)
        {
            agents[i].timeInTarget += dt;

            success = -10; // -10
            success -= agents[i].timeInTarget * 20; // at most -10
            success *= dt; // at most 20/s

            // 15 reward per target max

            if(agents[i].timeInTarget >= 0.5)
            {
                success -= 500;
                success -= 500 * ((generationLength - time) / generationLength);

                if(agents[i].targetID < targets.length - 1)
                {
                    agents[i].targetID++;
                }
                agents[i].timeInTarget = 0;
            }
        }else{
            agents[i].timeInTarget = 0;
        }

        // SAFETY

        if(agents[i].yPos < -60)
        {
            if(Math.abs(agents[i].yVel) < crashVelocity)
            {
                safety = 10;
                safety *= dt;
                agents[i].yVel *= -0.1;
                agents[i].xVel *= 0.9;
                agents[i].yPos = -60;
            }else{
                agents[i].alive = false;
                safety = 1000;
                safety += 500 * ((generationLength - time) / generationLength);
            }
            
        }

        // COMMITMENT

        commitment = deltaRotation*deltaRotation; // at most 4
        commitment += deltaThrust*deltaThrust; // at most 1
        //commitment += deltaSpeed*deltaSpeed;
        commitment *= dt; // at most 5/s

        // STAGNATION

        if(dist > targetRadius)
        {
            if(speed < 10)
            {
                stagnation += 10 - speed; // at most 10
            }

            stagnation *= dist / 10;
        }

        stagnation += dist / 100;

        stagnation *= dt;


        progress *= CurriculumBlend([0,1,1,0.5], curriculumStage);
        success *= CurriculumBlend([0,1,1,1], curriculumStage);
        safety *= CurriculumBlend([1,0.5,1,0.25], curriculumStage);
        commitment *= CurriculumBlend([1,0.5,0.1,0], curriculumStage);
        stagnation *= CurriculumBlend([0,0,0,1], curriculumStage);

        if(
            !isFinite(dist) ||
            !isFinite(speed) ||
            !isFinite(agents[i].xPos) ||
            !isFinite(agents[i].yPos)
        ){
            agents[i].alive = false;
            scores[i] += 100000;
            continue;
        }

        scores[i] += progress + success + safety + commitment + stagnation;

        scores[i] = clamp(scores[i], -500000, 500000);

        }
    }

    postMessage({ scores, workerIndex });
};

function ArrayBlend(array, value) {
    const length = array.length;
    const v = clamp(value, 0, length - 1);
    const lower = Math.floor(v);
    const upper = Math.ceil(v);
    const t = v - lower;
    return lerp(array[lower], array[upper], t);
}

function CurriculumBlend(array, stage) {
    return ArrayBlend(array, stage);
}