importScripts('sharedSimulation.js');
importScripts('utils.js');
importScripts('navigation.js');

onmessage = function(event) {
    const {
        networks, agents,
        targetX, groundY, targetRadius,
        windForceX, windForceY,
        generationLength, dt,
        workerIndex,
        thrustBurn, crashVelocity,
        curriculumStage, generationSeed,
        obsAmount, obsDensity,
        networkShape,
        distanceField,
        fieldWidth, fieldHeight, cellSize,
        fieldOriginX, fieldOriginY
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
    const grades = new Array(agents.length).fill(0);
    let time = 0;

    let trajectory = [];
    let trajectoryValue = [];

    const targetY = GetGroundHeight(
            targetX,
            groundY,
            generationSeed,
            targetX,
            targetRadius,
            curriculumStage
        );

    let obstacles = generateObstacles(obsAmount, obsDensity, generationSeed, curriculumStage, targetX, targetY)

    while(time < generationLength)
    {
        time += dt;

        RunStep(agents, networks, targetX, groundY, targetRadius, dt, time,
                 thrustBurn, windForceX, windForceY, 
                 crashVelocity, curriculumStage,
                 generationLength, scores, generationSeed, trajectory, trajectoryValue, obstacles,
                 distanceField, fieldWidth, fieldHeight, cellSize,
                 fieldOriginX, fieldOriginY);

        //console.log(trajectory);

        let aliveCount = 0;
        for(const agent of agents)
        {
            if(agent.alive == true)
            {
                aliveCount++;
            }
        }
        if(aliveCount === 0) break;
    }

    for(let i = 0; i < agents.length; i++)
    {
        const agent = agents[i]
        let distance = SampleDistanceField(agent.xPos, agent.yPos, distanceField, fieldWidth, fieldHeight, cellSize, fieldOriginX, fieldOriginY);
        scores[i] += CalculateTerminalScore(agent, targetX, groundY, targetRadius, generationLength, curriculumStage, crashVelocity, generationSeed, distance);
        grades[i] = CalculateGrade(agent, targetX, groundY, targetRadius, generationLength, curriculumStage, crashVelocity, generationSeed);
        networks[i].lastScore = scores[i];
    }

    const trajX = new Array(trajectory.length);
    const trajY = new Array(trajectory.length);

    const trajVal = new Array(trajectoryValue.length);

    for(let i = 0; i < trajectory.length; i++)
    {
        trajX[i] = trajectory[i][0];
        trajY[i] = trajectory[i][1];
        trajVal[i] = trajectoryValue[i];
    }

    

    postMessage({ scores, grades, workerIndex, trajX, trajY, trajVal });
};