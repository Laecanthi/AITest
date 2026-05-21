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

function UpdateNeuralNetwork(network, agent, targetX, groundY, targetRadius, dt, generationSeed, curriculumStage, obstacles) 
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

    let instability = network.instability;
    let memoryInstability = network.memoryInstability;
    const velocityDir = Math.atan2(agent.yVel, agent.xVel);

    /**************************************** INPUTS ********************************/

    inputs[0] = (targetX - agent.xPos) / 100; // difference X
    inputs[1] = (GetGroundHeight(targetX, groundY, generationSeed, targetX, targetRadius, curriculumStage) - agent.yPos) / 100; // difference Y
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

    inputs[12] = RaycastStep(agent.xPos, agent.yPos, agent.angle, 25, obstacles, groundY, generationSeed, targetX, targetRadius, curriculumStage);
    inputs[13] = RaycastStep(agent.xPos, agent.yPos, velocityDir, 25, obstacles, groundY, generationSeed, targetX, targetRadius, curriculumStage);
    inputs[14] = RaycastStep(agent.xPos, agent.yPos, -Math.PI / 2, 25, obstacles, groundY, generationSeed, targetX, targetRadius, curriculumStage);

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

        const oldValue = hl1[hl1Node];

        const newValue = SoftClamp(sum);

        instability += Math.abs(newValue - oldValue);

        hl1[hl1Node] = newValue;
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

        const oldValue = hl2[hl2Node];

        const newValue = SoftClamp(sum);

        instability += Math.abs(newValue - oldValue);

        hl2[hl2Node] = newValue;
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

        const oldValue = outputs[outputNode];

        const newValue = SoftClamp(sum);

        instability += Math.abs(newValue - oldValue);

        outputs[outputNode] = newValue;
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

        const oldValue = mb1[mb1Node];

        const newValue = SoftClamp(sum);

        memoryInstability += Math.abs(newValue - oldValue);

        mb1[mb1Node] = newValue;
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

        const memoryResponseRates = [
            2.0,   // medium
            0.5,   // slow
            8.0,   // very fast
            0.1    // very slow
        ];

        const responseRate =
            memoryResponseRates[mb2Node]; // make sure the memory buffer is only 4 long or it will throw an error

        const bufferPersistence =
            1 - Math.exp(-responseRate * dt);

        const oldValue = mb2[mb2Node];

        const newValue = SoftClamp(
                mb2[mb2Node] * (1 - bufferPersistence) +
                sum * bufferPersistence
            );

        memoryInstability += Math.abs(newValue - oldValue);

        mb2[mb2Node] = newValue;
    }

    network.instability =
        instability / (hl1Len + hl2Len + outputsLen);

    network.memoryInstability =
        memoryInstability / (mb1Len + mb2Len);
}


function UpdateAgent(agent, dt, thrustBurn, windForceX, windForceY, crashVelocity, time, generationSeed)
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
    localWindMagnitude++;

    const windNoise = FractalNoise2D(
        agent.xPos * 0.001,
        agent.yPos * 0.01,
        generationSeed
    );

    localWindMagnitude *= Amplify(windNoise) + 0.5; // wind tends to be near an extreme, and is more

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
                 generationLength, scores, generationSeed, traj, trajVal, obstacles)
{
    for(let i = 0; i < agents.length; i++)
    {
        if(!agents[i].alive) continue;

        var lastRotation = agents[i].rotation;
        var lastThrust = agents[i].thrust;

        UpdateNeuralNetwork(networks[i], agents[i],
                           targetX, groundY, targetRadius, dt, generationSeed, curriculumStage, obstacles);

        const targetRotation = networks[i].outputs[0];
        const targetThrust = networks[i].outputs[1] / 2 + 0.5;

        agents[i].rotation = lerp(agents[i].rotation, targetRotation, 0.15);
        agents[i].thrust = lerp(agents[i].thrust, targetThrust, 0.15);

        UpdateAgent(agents[i], dt, thrustBurn, windForceX, windForceY, crashVelocity, time, generationSeed);

        if (CollideAnything(
                agents[i].xPos,
                agents[i].yPos,
                obstacles,
                groundY,
                generationSeed,
                targetX,
                targetRadius,
                curriculumStage
            ))
        {
            agents[i].alive = false;
            agents[i].timeOfDeath = time;
        }

        if(i === 0)
        {
            traj.push([
                agents[i].xPos,
                agents[i].yPos
            ]);
            trajVal.push([
                Math.sqrt(agents[i].xVel*agents[i].xVel + agents[i].yVel*agents[i].yVel) / 3
            ]);
        }

        // RECORD LEADER MEMORY HISTORY (rendered mode only)
        if(typeof renderSimulation != 'undefined' && i === 0) // renderSimulation doesn't exist for the web workers, and thus should return false in unrendered mode anyways
        {
            substepTime++;

            memoryHistory.push([
                ...networks[i].mb1,
                ...networks[i].mb2
            ]);

            outputHistory.push([
                ...networks[i].outputs,
                agents[i].rotation,
                agents[i].thrust
            ]);

            positionHistory.push([
                (agents[i].xPos - 80) / 80,
                (agents[i].yPos + 60) / 60
            ]);

            linearMHistory.push([
                agents[i].xVel,
                agents[i].yVel,
                agents[i].xAcc,
                agents[i].yAcc
            ]);

            angularMHistory.push([
                agents[i].angle / Math.PI,
                agents[i].aVel,
                agents[i].aAcc
            ]);

            instabilityHistory.push([
                networks[i].instability,
                networks[i].memoryInstability
            ]);

            conditionsHistory.push([
                agents[i].fuel / 250 - 1,
                agents[i].xLastExternalForce / 10,
                agents[i].yLastExternalForce / 10
            ]);

            // EVENTS

            if(!generationEventBools[0] && !agents[i].alive) // when agent first reaches ground
            {
                generationEvents.push({x: substepTime, label: "touchdown"})
                generationEventBools[0] = true;
            }

            if(!generationEventBools[1] && agents[i].yVel < -0.01-crashVelocity) // when agent first reaches crash velocity
            {
                generationEvents.push({x: substepTime, label: "high velocity"})
                generationEventBools[1] = true;
            }

            if(generationEventBools[1] && !generationEventBools[2] && agents[i].yVel > 0.01-crashVelocity) // after entering crash velocity, this is when the agent first exits
            {
                generationEvents.push({x: substepTime, label: "low velocity"})
                generationEventBools[2] = true;
            }

            if(!generationEventBools[3] && agents[i].yPos <= GetGroundHeight(agents[i].xPos, groundY, generationSeed, targetX, targetRadius, curriculumStage) + 10) // when agent is 10 meters above the ground
            {
                generationEvents.push({x: substepTime, label: "10 meters"})
                generationEventBools[3] = true;
            }

            if(!generationEventBools[4] && agents[i].yPos <= GetGroundHeight(agents[i].xPos, groundY, generationSeed, targetX, targetRadius, curriculumStage) + 1) // when agent is 1 meters above the ground
            {
                generationEvents.push({x: substepTime, label: "1 meter"})
                generationEventBools[4] = true;
            }

            if(!generationEventBools[5] && agents[i].fuel <= 0) // when agent runs out of fuel
            {
                generationEvents.push({x: substepTime, label: "out of fuel"})
                generationEventBools[5] = true;
            }

        }
    }
}

function CalculateScore(agent, targetX, groundY, targetRadius, generationLength, curriculumStage, crashVelocity, generationSeed)
{
    // agent never landed - worst possible outcome
    if(agent.alive)
    {
        return 10000;
    }

    let score = 0;
    const targetY = GetGroundHeight(targetX, groundY, generationSeed, targetX, targetRadius, curriculumStage);

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

    // big reward for landing in target zone, else punishment for distance (when obstacles become a bigger issue, there needs to be at least some guidance towards target)
    if(horizontalError <= targetRadius && agent.yPos < targetY + 1)
    {
        score -= 2000;
        score -= (targetRadius - horizontalError) / targetRadius * 2000; // extra bonus for landing in the center of the target zone
    }else{
        score += Math.sqrt(horizontalError*horizontalError+(agent.yPos - targetY)*(agent.yPos - targetY)) / targetRadius * 500;
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

function CalculateGrade(agent, targetX, groundY, targetRadius, generationLength, curriculumStage, crashVelocity, generationSeed)
{
    // agent never landed, automatic failure
    if(agent.alive)
    {
        return 0;
    }

    // grade 2 is minimum to pass, grade 4 is perfect performance, grade 0 is the lowest score
    // notice how this is nearly identicle to score, but not quite
    // score is for evolution, where grade is pass/fail
    // each criteria is a "pass" or "fail", giving 1 point each
    // grade 2 is expected, extra criteria is purposefully harsh

    let grade = 0;
    const targetY = GetGroundHeight(targetX, groundY, generationSeed, targetX, targetRadius, curriculumStage);

    const verticalSpeed = Math.abs(agent.yVel);
    const horizontalSpeed = Math.abs(agent.xVel);
    const angularSpeed = Math.abs(agent.aVel);

    const horizontalError = Math.abs(agent.xPos - targetX);
    const verticalError = Math.abs(agent.yPos - targetY);
    const angleError = Math.abs(
        ((agent.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) - Math.PI / 2
    );
    const dist = Math.sqrt(horizontalError*horizontalError+verticalError*verticalError);

    // MINIMUM - expected criteria with increasing difficulty

    // WITHIN TARGET
    if(dist<=targetRadius) grade++;

    // SOFT LANDING
    if(verticalSpeed<crashVelocity) grade++;

    if(grade == 0) return 0; // if an agent fails both minimum criteria, in cannot earn excess criteria

    // EXCESS - static criteria with high precision
    
    // ORIENTATION
    if(angleError<degreesToRadians(1.5)) grade++; // max error of 1.5 degrees from upright

    // LOW HORIZONTAL MOTION
    if(horizontalSpeed<1.5) grade++; // max speed of 1.5 m/s

    return grade;
}

//******************************* PERLIN NOISE ******************************************************/

function Hash2D(x, y, seed)
{
    let h = (x | 0) ^ (y | 0) ^ seed;

    h = Math.imul(h, 374761393);
    h ^= h >>> 13;

    h = Math.imul(h, 1274126177);
    h ^= h >>> 16;

    return (h >>> 0) / 4294967295;
}

function Hash(x, seed)
{
    let h = x ^ seed;

    h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13;

    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;

    return (h >>> 0) / 4294967295;
}

function Smooth(t)
{
    return t * t * (3 - 2 * t);
}

function Perlin2D(x, y, seed = 0)
{
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);

    const x1 = x0 + 1;
    const y1 = y0 + 1;

    const sx = Smooth(x - x0);
    const sy = Smooth(y - y0);

    // corner random values
    const n00 = Hash2D(x0, y0, seed);
    const n10 = Hash2D(x1, y0, seed);

    const n01 = Hash2D(x0, y1, seed);
    const n11 = Hash2D(x1, y1, seed);

    // interpolate x
    const ix0 = lerp(n00, n10, sx);
    const ix1 = lerp(n01, n11, sx);

    // interpolate y
    const value = lerp(ix0, ix1, sy);

    // remap [0,1] -> [-1,1]
    return value * 2 - 1;
}

function FractalNoise2D(x, y, seed)
{
    let value = 0;

    let amplitude = 1;
    let frequency = 1;

    let totalAmplitude = 0;

    for(let octave = 0; octave < 4; octave++)
    {
        value +=
            Perlin2D(
                x * frequency,
                y * frequency,
                seed + octave * 1000
            ) * amplitude;

        totalAmplitude += amplitude;

        amplitude *= 0.5;
        frequency *= 2;
    }

    return value / totalAmplitude;
}

function Noise1D(x, seed)
{
    const x0 = Math.floor(x);
    const x1 = x0 + 1;

    const t = x - x0;

    const v0 = Hash(x0, seed);
    const v1 = Hash(x1, seed);

    const smoothT = Smooth(t)

    return lerp(v0, v1, smoothT);
}

function FractalNoise1D(x, seed)
{
    let total = 0;
    let amplitude = 1;
    let frequency = 1;
    let norm = 0;

    for(let i = 0; i < 5; i++)
    {
        total +=
            Noise1D(x * frequency, seed + i * 1000)
            * amplitude;

        norm += amplitude;

        amplitude *= 0.5;
        frequency *= 2;
    }

    return total / norm;
}

function Amplify(input)
{
    let value = Math.abs(input);
    value = 1 - value;
    value *= value;
    value = 1 - value;
    return value * Math.sign(input);
}

function GetGroundHeight(x, y, generationSeed, targetX, targetRadius, curriculumStage)
{
    if(Math.abs(x - targetX) <= targetRadius)
    {
        return (
            FractalNoise1D(targetX * CurriculumBlend([0, 0, 0.01, 0.02, 0.04], curriculumStage) /2, generationSeed) * CurriculumBlend([0,25,50,100,250], curriculumStage) / 10
            + y
        );
    }else{
        return (
            FractalNoise1D(x * CurriculumBlend([0, 0, 0.01, 0.02, 0.04], curriculumStage) /2, generationSeed) * CurriculumBlend([0,25,50,100,250], curriculumStage) / 10
            + y
        );
    }
    
}

function generateObstacles(amount, density, seed, curriculumStage, targetX, targetY) {
    const obstacles = [];

    if(curriculumStage >= 1) obstacles.push({x: targetX - 5, y: targetY + 15, w: 10, h: 2.5}); // starting at curriculum stage 1, agents now have to go around an obstacle

    if(curriculumStage >= 1.5) // starting halfway through curriculum stage 1, agents can no longer hug the ground and thus must actually learn to avoid obstacles
    {
        obstacles.push({x: targetX + 7.5, y: targetY - 5, w: 2.5, h: 7.5});
        obstacles.push({x: targetX - 10, y: targetY - 5, w: 2.5, h: 7.5});
    }
    

    for (let i = 0; i < amount; i++) {

        // stable per-obstacle random basis
        const sx = Hash(i * 4 + 0, seed);
        const sy = Hash(i * 4 + 1, seed);
        const sw = Hash(i * 4 + 2, seed);
        const sh = Hash(i * 4 + 3, seed);

        //console.log(sx);

        const x = sx * 160;  
        const y = (sy * 120) - 120;

        // density controls how “chunky” things are
        const w = (0.2 + sw * 1.5) * density;
        const h = (0.2 + sh * 2.0) * density;

        obstacles.push({ x, y, w, h });
    }

    return obstacles;
}

function CollideAnything(
    x, y,
    obstacles,
    groundY,
    generationSeed,
    targetX,
    targetRadius,
    curriculumStage
)
{
    // -----------------------
    // TERRAIN
    // -----------------------
    const terrainY = GetGroundHeight(
        x,
        groundY,
        generationSeed,
        targetX,
        targetRadius,
        curriculumStage
    );

    if (y <= terrainY)
        return true;

    // -----------------------
    // OBSTACLES
    // -----------------------
    for (let i = 0; i < obstacles.length; i++)
    {
        const o = obstacles[i];

        if (
            x >= o.x &&
            x <= o.x + o.w &&
            y >= o.y &&
            y <= o.y + o.h
        ) {
            return true;
        }
    }

    return false;
}

function PointInObstacles(x, y, obstacles)
{
    for (let i = 0; i < obstacles.length; i++)
    {
        const o = obstacles[i];

        if (
            x >= o.x &&
            x <= o.x + o.w &&
            y >= o.y &&
            y <= o.y + o.h
        ) {
            return true;
        }
    }

    return false;
}

function PointInObstaclesExpanded(x, y, obstacles, padding = 2)
{
    for (let i = 0; i < obstacles.length; i++)
    {
        const o = obstacles[i];

        if (
            x >= o.x - padding &&
            x <= o.x + o.w + padding &&
            y >= o.y - padding &&
            y <= o.y + o.h + padding
        ) {
            return true;
        }
    }

    return false;
}

function RaycastStep(
    x, y,
    angle,
    maxDist,
    obstacles,
    groundY,
    generationSeed,
    targetX,
    targetRadius,
    curriculumStage
)
{
    let dist = 0;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);

    while (dist < maxDist)
    {
        const sx = x + dx * dist;
        const sy = y + dy * dist;

        if (CollideAnything(
            sx, sy,
            obstacles,
            groundY,
            generationSeed,
            targetX,
            targetRadius,
            curriculumStage
        ))
        {
            return dist / maxDist;
        }

        stepSize = lerp(0.25, 2.0, dist / maxDist);
        dist += stepSize;
    }

    return 1;
}