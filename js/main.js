// SLIDERS

const speedSlider =
    document.getElementById("speedSlider");

const substepSlider =
    document.getElementById("substepSlider");

const mutationSlider =
    document.getElementById("mutationSlider");

const generationSlider =
    document.getElementById("generationSlider");

const showOnlyLeaderCheckbox =
    document.getElementById("showOnlyLeaderCheckbox");

const nonLeaderOpacitySlider =
    document.getElementById("nonLeaderOpacitySlider");

const renderSimulationCheckbox =
    document.getElementById("renderSimulationCheckbox");

speedSlider.oninput = function()
{
    simSpeed = Number(this.value);

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

const mutationLabel = document.getElementById(
        "mutationLabel"
    );

mutationSlider.oninput = function()
{
    mutationRate = this.value / 100;

    mutationLabel.textContent = mutationRate.toFixed(2);
};

const generationLabel = document.getElementById(
        "generationLabel"
    );

generationSlider.oninput = function()
{
    generationLength = Number(this.value);

    generationLabel.textContent = generationLength;
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

// END OF SLIDERS

for(var i = 0; i < amountOfAgents; i++) /********************************************** CREATE AGENTS ***********************************/
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

function SystemLoop(timestamp) { /******************************************* SYSTEM LOOP ***********************************************/
    const ctx = m_ctx;
    //const deltaTime = Math.min((timestamp - lastTime) / 1000, 0.05) / simSubsteps;
    const deltaTime = 1/60/simSubsteps;
    lastTime = timestamp;

    if(renderSimulation)
    {
        unrenderedLoopActive = false; // signal the other loop to stop

        Iterate(deltaTime);

        render();

        RenderNetwork(neuralNetworks[0], true);

        ctx.font = "30px Arial";
        ctx.fillStyle = "black";

        ctx.fillText(generation + ": " + time.toFixed(2), 10, 30);

        //generationText.textContent = "";

        // Request the next frame to keep the loop running
        requestAnimationFrame(SystemLoop);
    }else{
        if(!unrenderedLoopActive) {
            unrenderedLoopActive = true;
            UnrenderedLoop();
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

SetNextGen(true);

// Start the loop
requestAnimationFrame(SystemLoop);