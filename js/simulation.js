function Iterate(dt, step = false)
{
    let steps = simSpeed * simSubsteps;
    if(step)
    {
        steps = 1;
    }

    for(var iteration = 0; iteration < steps; iteration++)
    {
        time += dt;

        let aliveCount = 0;

        for(const agent of agents)
        {
            if(agent.alive == true)
            {
                aliveCount++;
            }
        }

        if(time>generationLength || aliveCount === 0)
        {   
            for(let i = 0; i < agents.length; i++)
            {
                const agent = agents[i]
                let distance = SampleDistanceField(agent.xPos, agent.yPos, distanceField, fieldWidth, fieldHeight, cellSize, fieldOriginX, fieldOriginY);
                scores[i] += CalculateTerminalScore(agent, targetX, groundY, targetRadius, generationLength, curriculumStage, crashVelocity, generationSeed, distance);
                grades[i] = CalculateGrade(agent, targetX, groundY, targetRadius, generationLength, curriculumStage, crashVelocity, generationSeed);
                neuralNetworks[i].lastScore = scores[i];
            }
            //SetNextGen();
            return true;
        }

        update(dt);
    }

    return false;
}

function SetNextGen(initialize = false)
{
    

    //curriculumStage = generation / 300;

    highestPassRateDuringCurriculum = Math.max(passRate, highestPassRateDuringCurriculum); // highest pass rate is defined for the previous generation's pass rate

    passRate = 0;
    for(let i = 0; i < grades.length; i++)
    {
        passRate += grades[i];
    }
    passRate /= grades.length * 2; // although the max is 4, remember, 2 is pasing, 4 is exceeding!
    

    curriculumStage += Math.max(0,
        (passRate - 0.5) / 4
    ); // for every % passing over 50%, curriculumStage increases by 0.25

    capTimer--;

    if(passRate >= 0.9 && capTimer <= 0)
    {
        curriculumCap++; // with a pass rate over 90%, the curriculum cap increases
        highestPassRateDuringCurriculum = 0;
        capTimer = 50;
        console.warn("Cap has increased to " + curriculumCap);
    }

    curriculumStage = Math.min(curriculumStage, curriculumCap);

    memoryHistory.length = 0;
    outputHistory.length = 0;
    positionHistory.length = 0;
    trajectory.length = 0;
    trajectoryValue.length = 0;
    linearMHistory.length = 0;
    angularMHistory.length = 0;
    instabilityHistory.length = 0;
    conditionsHistory.length = 0;
    generationEvents.length = 0;
    generationEventBools = [false, false, false, false, false, false];
    
    if(!initialize)
    {
        if(generation!=0) MutateNextGen();
        ResetAgents();
        RenderGraph();
    }
    
    time = 0;
    substepTime = 0;
    generation++;

    // GET GENERATION SEED

    let attempts = 0;

    const spawnX = agents[0].xPos;
    const spawnY = agents[0].yPos;

    obsAmount = Math.floor(CurriculumBlend([0,0,5,10,15], curriculumStage) / 2);
    obsDensity = CurriculumBlend([0,0,5,10,15], curriculumStage);

    do
    {
        generationSeed = Math.floor((Math.random() - 0.5) * 5981257);

        

        targetX = 80 + (Hash(142, generationSeed) - 0.5) * CurriculumBlend([0,15,40,80], curriculumStage);

        const targetY = GetGroundHeight(
            targetX,
            groundY,
            generationSeed,
            targetX,
            targetRadius,
            curriculumStage
        );

        obstacles = generateObstacles(obsAmount, obsDensity, generationSeed, curriculumStage, targetX, targetY);

        const spawnValid = !PointInObstaclesExpanded(spawnX, spawnY, obstacles, 3)
            && (spawnY + 3 > GetGroundHeight(spawnX, groundY, generationSeed, targetX, targetRadius, curriculumStage));
        const targetValid = !PointInObstaclesExpanded(targetX, targetY, obstacles, targetRadius);

        attempts++;

        if (spawnValid && targetValid)
            break;

    } while (attempts < 50);

    // DONE
    
    generationLength = 30;
    mutationRate = CurriculumBlend([0.08,0.03,0.01]);
    mutationChance = CurriculumBlend([0.03,0.02,0.01]);
    // if the curriculum cap just increased, mutation change temporarily decreases
    if(capTimer >= 25) mutationChance /= 2;
    
    targetRadius = CurriculumBlend([8,4,3,2,1.5]);
    maxThrustDuration = CurriculumBlend([100,30,15,10]);
    thrustBurn = CurriculumBlend([0, 500 / maxThrustDuration]);
    crashVelocity = CurriculumBlend([6, 4, 2.5, 1.5, 0.5]);


    windDirection = Math.random() * Math.PI * 2;
    globalWindMagnitude = Math.random() * CurriculumBlend([0,1,2.5,5,15]);
    windForceY = Math.sin(windDirection) * globalWindMagnitude;
    windForceX = Math.cos(windDirection) * globalWindMagnitude;

    /*flowField = CreateFlowField(
        fieldWidth,
        fieldHeight,
        cellSize,
        targetX,
        groundY,
        generationSeed,
        targetRadius,
        curriculumStage,
        obstacles,
        fieldOriginX,
        fieldOriginY
    );
    flatFlowField = new Float32Array(FlattenFlowField(flowField));*/

    distanceField = CreateDistanceField(
        fieldWidth,
        fieldHeight,
        cellSize,
        targetX,
        groundY,
        generationSeed,
        targetRadius,
        curriculumStage,
        obstacles,
        fieldOriginX,
        fieldOriginY
    );

    distanceFieldTexture = BakeFlowTexture(distanceField, 800, 600);
    //console.log(flowField);
}

function update(dt) /***************************** UPDATE ******************************/
{
    
    //console.log(1 / dt);

    RunStep(agents, neuralNetworks, targetX, groundY, targetRadius, dt, time,
                 thrustBurn, windForceX, windForceY, 
                 crashVelocity, curriculumStage,
                 generationLength, scores, generationSeed, trajectory, trajectoryValue, obstacles,
                 distanceField, fieldWidth, fieldHeight, cellSize,
                 fieldOriginX, fieldOriginY);

    
}