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
                scores[i] = CalculateScore(agents[i], targetX, groundY, targetRadius, generationLength, curriculumStage, crashVelocity);
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
    

    curriculumStage = generation / 300;

    targetX = 80;
    targetX += (Math.random() - 0.5) * CurriculumBlend([0,15,40,80]);

    memoryHistory.length = 0;
    outputHistory.length = 0;
    positionHistory.length = 0;
    trajectory.length = 0;
    linearMHistory.length = 0;
    angularMHistory.length = 0;
    instabilityHistory.length = 0;
    conditionsHistory.length = 0;
    generationEvents.length = 0;
    generationEventBools = [false, false, false, false, false, false];
    
    if(!initialize)
    {
        MutateNextGen();
        ResetAgents();
        RenderGraph();
    }
    
    time = 0;
    substepTime = 0;
    generation++;
    
    generationLength = 30;
    generationSeed = (Math.random() - 0.5) * 10000;
    mutationRate = CurriculumBlend([0.08,0.03,0.01]);
    mutationChance = CurriculumBlend([0.03,0.02,0.01]);
    targetRadius = CurriculumBlend([8,4,1.5]);
    maxThrustDuration = CurriculumBlend([100,30,15,5]);
    thrustBurn = CurriculumBlend([0, 500 / maxThrustDuration]);
    crashVelocity = CurriculumBlend([10, 5, 1, 0.5]);


    windDirection = Math.random() * Math.PI * 2;
    globalWindMagnitude = Math.random() * CurriculumBlend([0,1,5,15]);
    windForceY = Math.sin(windDirection) * globalWindMagnitude;
    windForceX = Math.cos(windDirection) * globalWindMagnitude;
}

function update(dt) /***************************** UPDATE ******************************/
{
    
    //console.log(1 / dt);

    RunStep(agents, neuralNetworks, targetX, groundY, targetRadius, dt, time,
                 thrustBurn, windForceX, windForceY, 
                 crashVelocity, curriculumStage,
                 generationLength, scores, generationSeed, trajectory);

    
}