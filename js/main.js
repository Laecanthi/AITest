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
    requestAnimationFrame(SystemLoop);
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

        var newNetwork = new NeuralNetwork(15, 24, 24, 2, 4, 4);

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

        ctx.fillText(generation + ": " + time.toFixed(2), 10, 30);

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
    const ctx = m_ctx;

    if(!unrenderedLoopActive) return; // stop if rendered mode was re-enabled
    const deltaTime = 1/60/simSubsteps;
    const budget = 50; // ms per tick, leave some breathing room for the browser
    const start = performance.now();

    while(performance.now() - start < budget) {
        Iterate(deltaTime);
    }

    RenderNetwork(neuralNetworks[0], false);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = "30px Arial";
    ctx.fillStyle = "black";

    ctx.fillText(generation + ": " + (time / generationLength * 100).toFixed(2) + "%", 10, 30);

    //generationText.textContent = generation;

    setTimeout(UnrenderedLoop, 0);
}

const testWorker = new Worker('js/simulationWorker.js');
testWorker.postMessage({ value: 42 });
testWorker.onmessage = (e) => console.log("got back:", e.data);

BuildAgents();
SetNextGen(true);