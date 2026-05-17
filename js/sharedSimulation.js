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

function UpdateNeuralNetwork(network, agent, targetX, groundY, targetRadius) 
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

    /**************************************** INPUTS ********************************/

    inputs[0] = (targetX - agent.xPos) / 100; // difference X
    inputs[1] = (groundY - agent.yPos) / 100; // difference Y
    inputs[2] = (agent.yPos + 60) / 100; // y pos
    inputs[3] = (agent.xPos - 80) / 100; // x pos
    inputs[4] = Math.sin(agent.angle);
    inputs[5] = Math.cos(agent.angle);
    inputs[6] = (agent.xVel) / 25;
    inputs[7] = (agent.yVel) / 25;
    inputs[8] = (agent.aVel) * 5;
    inputs[9] = agent.fuel / 500;
    inputs[10] = agent.xLastExternalForce / 10;
    inputs[11] = agent.yLastExternalForce / 10;

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


function UpdateAgent(agent, dt, thrustBurn, windForceX, windForceY, crashVelocity, time)
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

    let localWindMagnitude = Math.sin(time * 1.2) * Math.cos(time * 0.8);
    localWindMagnitude *= localWindMagnitude;
    localWindMagnitude += Math.sin(time);

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

function ArrayBlend(array, value) {
    const length = array.length;
    const v = clamp(value, 0, length - 1);
    const lower = Math.floor(v);
    const upper = Math.ceil(v);
    const t = v - lower;
    return lerp(array[lower], array[upper], t);
}

function CurriculumBlend(array, stage = curriculumStage) {
    return ArrayBlend(array, stage);
}

/********************************************************************************************************/

function RunStep(agents, networks, targetX, groundY, targetRadius, dt, time,
                 thrustBurn, windForceX, windForceY, 
                 crashVelocity, curriculumStage,
                 generationLength, scores)
{
    for(let i = 0; i < agents.length; i++)
    {
        if(!agents[i].alive) continue;

        var lastRotation = agents[i].rotation;
        var lastThrust = agents[i].thrust;

        UpdateNeuralNetwork(networks[i], agents[i],
                           targetX, groundY, targetRadius);

        const targetRotation = networks[i].outputs[0];
        const targetThrust = networks[i].outputs[1] / 2 + 0.5;

        agents[i].rotation = lerp(agents[i].rotation, targetRotation, 0.15);
        agents[i].thrust = lerp(agents[i].thrust, targetThrust, 0.15);

        UpdateAgent(agents[i], dt, thrustBurn, windForceX, windForceY, crashVelocity, time);

        // scoring - actually soon enough this won't be here, just to test for now
        /*scores[i] += CalculateStepRewards(agents[i], targetX, targetRadius, dt, time,
                                          generationLength, curriculumStage,
                                          lastRotation, lastThrust);*/

        if(agents[i].yPos <= groundY)
        {
            agents[i].alive = false;
            agents[i].timeOfDeath = time;
        }
    }
}

function CalculateScore(agent, targetX, groundY, targetRadius, generationLength, curriculumStage, crashVelocity)
{
    // agent never landed - worst possible outcome
    if(agent.alive)
    {
        return 10000;
    }

    let score = 0;

    // LANDING VELOCITY - most important
    // lower is better, hard score = bad
    const verticalSpeed = Math.abs(agent.yVel);
    const horizontalSpeed = Math.abs(agent.xVel);
    const angularSpeed = Math.abs(agent.aVel);

    score += verticalSpeed * 100;   // heavily penalize fast vertical landing
    score += horizontalSpeed * 50;  // penalize sideways drift
    score += angularSpeed * 50;     // penalize spinning

    // big reward for soft landing (under crashVelocity)
    if(verticalSpeed < crashVelocity)
    {
        score -= 1000; // clear separation between soft and hard landings
        score -= (crashVelocity - verticalSpeed) / crashVelocity * 4000; // extra bonus for landing softly and slowly
    }

    // ORIENTATION - should be upright (angle = PI/2)
    const angleError = Math.abs(
        ((agent.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) - Math.PI / 2
    );
    score += angleError * 200; // penalize being tilted

    // LANDING POSITION - how close to target
    const horizontalError = Math.abs(agent.xPos - targetX);
    score += horizontalError * 20;

    // big reward for landing in target zone
    if(horizontalError <= targetRadius)
    {
        score -= 2000;
        score -= (targetRadius - horizontalError) / targetRadius * 2000; // extra bonus for landing in the center of the target zone
    }

    // FUEL CONSERVATION - bonus for not wasting fuel
    score -= (agent.fuel / 500) * 500;

    // TIME TAKEN TO LAND
    if(isFinite(agent.timeOfDeath))
    {
        score -= (agent.timeOfDeath / generationLength) * 1000;
    }else{
        console.error(agent.timeOfDeath);
    }

    return score;
}