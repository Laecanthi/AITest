// SLIDERS AND CHECKBOXES

const speedSlider =
    document.getElementById("speedSlider");

const substepSlider =
    document.getElementById("substepSlider");

const showOnlyLeaderCheckbox =
    document.getElementById("showOnlyLeaderCheckbox");

const nonLeaderOpacitySlider =
    document.getElementById("nonLeaderOpacitySlider");

const renderSimulationCheckbox =
    document.getElementById("renderSimulationCheckbox");

speedSlider.oninput = function()
{
    simSpeed = Number(this.value) / 10;

    document.getElementById(
        "speedLabel"
    ).textContent = simSpeed;
};

substepSlider.oninput = function()
{
    simSubsteps = Number(this.value);

    document.getElementById(
        "substepLabel"
    ).textContent = simSubsteps;
};

showOnlyLeaderCheckbox.oninput = function()
{
    showOnlyLeader = this.checked;
}

nonLeaderOpacitySlider.oninput = function()
{
    nonLeaderOpacity = this.value / 100;

    document.getElementById(
        "nonLeaderOpacityLabel"
    ).textContent =
        nonLeaderOpacity.toFixed(2);
};

renderSimulationCheckbox.oninput = function()
{
    renderSimulation = this.checked;
    if(renderSimulation) {
        unrenderedLoopActive = false;
        requestAnimationFrame(SystemLoop);
    }
}

// END OF SLIDERS AND CHECKBOXES

// BUTTONS

const playButton =
    document.getElementById("playButton");

const pauseButton =
    document.getElementById("pauseButton");

const stepButton =
    document.getElementById("stepButton");

const quickStepButton =
    document.getElementById("quickStepButton");

const resetButton =
    document.getElementById("resetButton");

const confirmResetButton =
    document.getElementById("confirmResetButton");

playButton.addEventListener('click', function() {
    simPlay = true;
    // Start the loop
    if(renderSimulation) {
        requestAnimationFrame(SystemLoop);
    } else {
        unrenderedLoopActive = true;
        startNextGeneration();
    }
});

pauseButton.addEventListener('click', function() {
    simPlay = false;
});

stepButton.addEventListener('click', function() {
    const ctx = m_ctx;

    Iterate(1/60/simSubsteps, true);

    render();

    RenderNetwork(neuralNetworks[0], true);

    ctx.font = "30px Arial";
    ctx.fillStyle = "black";

    ctx.fillText(generation + ": " + time.toFixed(2), 10, 30);
});

quickStepButton.addEventListener('click', function() {
    const ctx = m_ctx;

    const cacheSimspeed = simSpeed;

    simSpeed = 1;

    Iterate(1/60/simSubsteps);

    simSpeed = cacheSimspeed;

    render();

    RenderNetwork(neuralNetworks[0], true);

    ctx.font = "30px Arial";
    ctx.fillStyle = "black";

    ctx.fillText(generation + ": " + time.toFixed(2), 10, 30);
});

resetButton.addEventListener('click', function() {
    confirmResetButton.classList.remove("hide");

    setTimeout(() => {
        confirmResetButton.classList.add("hide");
    }, 3000);
});

confirmResetButton.addEventListener('click', function() {
    agents.length = 0;
    neuralNetworks.length = 0;
    scores.length = 0;
    generation = 0;
    bestScore.length = 0;
    averageScore.length = 0;
    medianScore.length = 0;
    worstScore.length = 0;
    BuildAgents();
    SetNextGen(true);
    confirmResetButton.classList.add("hide");
});

function BuildAgents() /********************************************** CREATE AGENTS ***********************************/
{
    for(var i = 0; i < amountOfAgents; i++) 
    {
        agents.push(new Agent(randomPosX, randomPosY, 50, 500, 0.1, 2000, 80));

        var newNetwork = new NeuralNetwork(15, 16, 16, 2, 2, 2);

        for (var node = 0; node < newNetwork.cn1.length; node++) {newNetwork.cn1[node] = Math.random() * 2 - 1;}
        for (var node = 0; node < newNetwork.cn2.length; node++) {newNetwork.cn2[node] = Math.random() * 2 - 1;}
        for (var node = 0; node < newNetwork.cn3.length; node++) {newNetwork.cn3[node] = Math.random() * 2 - 1;}

        for (var node = 0; node < newNetwork.bs1.length; node++) {newNetwork.bs1[node] = Math.random() * 2 - 1;}
        for (var node = 0; node < newNetwork.bs2.length; node++) {newNetwork.bs2[node] = Math.random() * 2 - 1;}
        for (var node = 0; node < newNetwork.bs3.length; node++) {newNetwork.bs3[node] = Math.random() * 2 - 1;}

        ResetLayers(newNetwork);

        //console.log(newNetwork);

        neuralNetworks.push(newNetwork);

        scores.push(0);
        
        
    }
}



function SystemLoop(timestamp) { /******************************************* SYSTEM LOOP ***********************************************/
    const ctx = m_ctx;
    //const deltaTime = Math.min((timestamp - lastTime) / 1000, 0.05) / simSubsteps;
    const deltaTime = 1/60/simSubsteps;
    lastTime = timestamp;

    if(renderSimulation)
    {
        unrenderedLoopActive = false; // signal the other loop to stop

        const ctx = m_ctx;

        Iterate(deltaTime);

        render();

        RenderNetwork(neuralNetworks[0], true);

        ctx.font = "30px Arial";
        ctx.fillStyle = "black";

        if(retryCount > 0 || retryFlipCount > 0)
        {
            ctx.fillText(generation + " x" + retryCount + "-" + retryFlipCount + ": " + time.toFixed(2), 10, 30);
        }else{
            ctx.fillText(generation + ": " + time.toFixed(2), 10, 30);
        }

        //generationText.textContent = "";

        // Request the next frame to keep the loop running

        if(simPlay)
        {
            requestAnimationFrame(SystemLoop);
        }
      
    }else{
        if(!unrenderedLoopActive) {
            unrenderedLoopActive = true;
            UnrenderedLoop(); // this is getting a rehaul so ignoring pausing in this for now
        }
        // don't re-request an animation frame
    }
}

function UnrenderedLoop()
{
    if(!unrenderedLoopActive) return;
    // just start the first generation, workers take it from here
    startNextGeneration();
}

BuildAgents();
SetNextGen(true);

// WORKERS

const NUM_WORKERS = 4;
const workers = [];
let workersFinished = 0;
let workerScores = new Array(amountOfAgents).fill(0);

for(let i = 0; i < NUM_WORKERS; i++)
{
    const worker = new Worker('js/simulationWorker.js');
    
    worker.onmessage = function(event)
    {
        const { scores: workerResult, workerIndex } = event.data;
        const sliceStart = workerIndex * (amountOfAgents / NUM_WORKERS);
        for(let j = 0; j < workerResult.length; j++) {
            workerScores[sliceStart + j] = workerResult[j];
        }

        workersFinished++;

        //console.log("Worker", workerIndex, "finished generation, time taken:", performance.now());

        if(workersFinished === NUM_WORKERS)
        {
            workersFinished = 0;
            for(let j = 0; j < amountOfAgents; j++) {
                scores[j] = workerScores[j];
            }
            
            //console.log(scores[0], scores[1], scores[2]);
            SetNextGen();
            // update curriculum etc
            RenderNetwork(neuralNetworks[0], false);

            m_ctx.clearRect(0,0,canvas.width,canvas.height);

            m_ctx.font = "30px Arial";
            m_ctx.fillStyle = "black";

            if(retryCount > 0 || retryFlipCount > 0)
            {
                m_ctx.fillText(generation + " x" + retryCount + "-" + retryFlipCount, 10, 30);
            }else{
                m_ctx.fillText(generation, 10, 30);
            }

            
            startNextGeneration();
        }

        
    };

    worker.onerror = function(e) {
        console.error("Worker error:", e.message, e.filename, e.lineno);
    };

    workers.push(worker);
}

function startNextGeneration()
{
    if(!unrenderedLoopActive || !simPlay) return; // respects pause

    const agentsPerWorker = amountOfAgents / NUM_WORKERS;

    for(let w = 0; w < NUM_WORKERS; w++)
    {
        const sliceStart = w * agentsPerWorker;

        const networkSlice = neuralNetworks.slice(sliceStart, sliceStart + agentsPerWorker).map(n => ({
            cn1: new Float32Array(n.cn1),
            cn2: new Float32Array(n.cn2),
            cn3: new Float32Array(n.cn3),
            bs1: new Float32Array(n.bs1),
            bs2: new Float32Array(n.bs2),
            bs3: new Float32Array(n.bs3),
            mb1: new Float32Array(n.mb1),
            mb2: new Float32Array(n.mb2),
        }));

        const agentSlice = agents.slice(sliceStart, sliceStart + agentsPerWorker).map(a => ({
            xPos: a.xPos, yPos: a.yPos,
            xVel: a.xVel, yVel: a.yVel,
            aVel: a.aVel, angle: a.angle,
            thrust: a.thrust, rotation: a.rotation,
            fuel: a.fuel, mass: a.mass,
            dryMass: a.dryMass, fuelMass: a.fuelMass,
            fThrust: a.fThrust, torque: a.torque,
            targetID: a.targetID, timeInTarget: a.timeInTarget,
            lastDist: a.lastDist, alive: a.alive,
            xLastExternalForce: a.xLastExternalForce,
            yLastExternalForce: a.yLastExternalForce
        }));

        workers[w].postMessage({
            networks: networkSlice,
            agents: agentSlice,
            workerIndex: w,
            targets: JSON.parse(JSON.stringify(targets)), // deep copy
            windForceX, windForceY,
            generationLength,
            dt: 1/60/simSubsteps,
            targetRadius, thrustBurn, crashVelocity,
            curriculumStage,
            currentMovingTargetX, currentMovingTargetY,
            nextMovingTargetX, nextMovingTargetY,
            networkShape: {
                inputLen: neuralNetworks[0].inputs.length,
                hl1Len: neuralNetworks[0].hl1.length,
                hl2Len: neuralNetworks[0].hl2.length,
                outputLen: neuralNetworks[0].outputs.length,
            }
        });
    }
}