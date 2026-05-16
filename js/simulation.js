function Iterate(dt, step = false)
{
    let steps = simSpeed * simSubsteps;
    if(step)
    {
        steps = 2;
    }

    for(var iteration = 0; iteration < steps; iteration++)
    {
        time += dt;

        movingTargetTime += dt / 5;

        if(movingTargetTime > 1)
        {
            currentMovingTargetX = nextMovingTargetX;
            currentMovingTargetY = nextMovingTargetY;
            nextMovingTargetX = Math.random() * 80;
            nextMovingTargetY = Math.random() * -60;
            movingTargetTime = 0;
        }

        if(targets[4] != null)
        {
            targets[4].X = lerp(currentMovingTargetX, nextMovingTargetX, movingTargetTime);
            targets[4].Y = lerp(currentMovingTargetY, nextMovingTargetY, movingTargetTime);
        }

        

        if(time>generationLength)
        {
            //targetX = Math.random() * 80;
            //targetY = Math.random() * -60;
            
            SetNextGen();
        }

        update(dt);
    }
}

function SetNextGen(initialize = false)
{
    targets.length = 0;
    for(var i = 0; i < 5; i++)
    {
        targets.push({X: Math.random() * 80, Y: Math.random() * -60});
        if(i == 4)
        {
            currentMovingTargetX = targets[i].X;
            currentMovingTargetY = targets[i].Y;
        }
    }

    nextMovingTargetX = Math.random() * 80;
    nextMovingTargetY = Math.random() * -60;
    movingTargetTime = 0;

    curriculumStage = generation / 300;
    
    if(!initialize)
    {
        MutateNextGen();
        ResetAgents();
        RenderGraph();
    }
    
    time = 0;
    generation++;
    
    generationLength = CurriculumBlend([5,10,30]);
    mutationRate = CurriculumBlend([0.08,0.03,0.01]);
    mutationChance = CurriculumBlend([0.03,0.02,0.01]);
    targetRadius = CurriculumBlend([8,4,1.5]);
    maxThrustDuration = CurriculumBlend([15,15,15,11]);
    thrustBurn = CurriculumBlend([0, 500 / maxThrustDuration]);

    windDirection = Math.random() * Math.PI * 2;
    globalWindMagnitude = Math.random() * CurriculumBlend([0,0,0.25,5]);
    windForceY = Math.sin(windDirection) * globalWindMagnitude;
    windForceX = Math.cos(windDirection) * globalWindMagnitude;
}

function update(dt) /***************************** UPDATE ******************************/
{
    
    //console.log(1 / dt);

    for (var i = 0; i < agents.length; i++)
    {
        if(!agents[i].alive)
        {
            //scores[i] += (50 + 50 * (1 - curriculumStage)) * dt; // gives a constant penalty for dead agents
            continue; // skips dead agents
        }

        UpdateNeuralNetwork(neuralNetworks[i], agents[i]);

        if(i == 1)
        {
            //console.log(neuralNetworks[i].outputs[0] + ", " + neuralNetworks[i].outputs[1]);
        }

        //agents[i].xThrust = neuralNetworks[i].outputs[0];
        //agents[i].yThrust = neuralNetworks[i].outputs[1];

        var lastRotation = agents[i].rotation;
        var lastThrust = agents[i].thrust;

        //agents[i].rotation = neuralNetworks[i].outputs[0];
        //agents[i].thrust = neuralNetworks[i].outputs[1] / 2 + 0.5;

        const targetRotation =
            neuralNetworks[i].outputs[0];

        const targetThrust =
            neuralNetworks[i].outputs[1] / 2 + 0.5;

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

        UpdateAgent(agents[i], dt);

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


        progress *= CurriculumBlend([0,1,1,0.5]);
        success *= CurriculumBlend([0,1,1,1]);
        safety *= CurriculumBlend([1,0.5,1,0.25]);
        commitment *= CurriculumBlend([1,0.5,0.1,0]);
        stagnation *= CurriculumBlend([0,0,0,1]);

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