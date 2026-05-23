function SaveSnapshot(neuralNetworks, generation, curriculumStage, curriculumCap)
{
    return JSON.stringify({
        generation,
        curriculumStage,
        curriculumCap,

        inputsLength: neuralNetworks[0].inputs.length,
        hl1Length: neuralNetworks[0].hl1.length,
        hl2Length: neuralNetworks[0].hl2.length,
        outputsLength: neuralNetworks[0].outputs.length,
        mb1Length: neuralNetworks[0].mb1.length,
        mb2Length: neuralNetworks[0].mb2.length,


        networks: neuralNetworks.map(n => ({
            cn1: [...n.cn1],
            cn2: [...n.cn2],
            cn3: [...n.cn3],
            bs1: [...n.bs1],
            bs2: [...n.bs2],
            bs3: [...n.bs3],
        }))
    });
}

function LoadSnapshot(json)
{
    const data = JSON.parse(json);

    const networks = data.networks.map(n => ({
        cn1: new Float32Array(n.cn1),
        cn2: new Float32Array(n.cn2),
        cn3: new Float32Array(n.cn3),
        bs1: new Float32Array(n.bs1),
        bs2: new Float32Array(n.bs2),
        bs3: new Float32Array(n.bs3),
    }));

    return {
        neuralNetworks: networks,

        generation: data.generation,
        curriculumStage: data.curriculumStage,
        curriculumCap: data.curriculumCap,

        inputsLength: data.inputsLength,
        hl1Length: data.hl1Length,
        hl2Length: data.hl2Length,
        outputsLength: data.outputsLength,
        mb1Length: data.mb1Length,
        mb2Length: data.mb2Length
    };
}


const saveBtn = document.getElementById("saveGeneration")

saveBtn.onclick = () =>
{
    const json = SaveSnapshot(
        neuralNetworks,
        generation,
        curriculumStage,
        curriculumCap
    );

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `gen_${generation}.json`;
    a.click();

    URL.revokeObjectURL(url);
};

const loadBtn = document.getElementById("loadGeneration")

const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.accept = ".json";
fileInput.style.display = "none";

loadBtn.onclick = () => fileInput.click();

fileInput.onchange = (e) =>
{
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (ev) =>
    {
        const data = LoadSnapshot(ev.target.result);

        //neuralNetworks = data.neuralNetworks;
        neuralNetworks.length = 0;
        generation = data.generation;
        curriculumStage = data.curriculumStage;
        curriculumCap = data.curriculumCap;

        for(let i = 0; i < data.neuralNetworks.length; i++)
        {
            let network = data.neuralNetworks[i];

            let newNetwork = new NeuralNetwork(
                data.inputsLength,
                data.hl1Length,
                data.hl2Length,
                data.outputsLength,
                data.mb1Length,
                data.mb2Length
            );

            newNetwork.cn1 = new Float32Array(network.cn1);
            newNetwork.cn2 = new Float32Array(network.cn2);
            newNetwork.cn3 = new Float32Array(network.cn3);

            newNetwork.bs1 = new Float32Array(network.bs1);
            newNetwork.bs2 = new Float32Array(network.bs2);
            newNetwork.bs3 = new Float32Array(network.bs3);

            ResetLayers(newNetwork);

            neuralNetworks.push(newNetwork);
        }

        console.log("Snapshot loaded");

        console.log(neuralNetworks[0]);
    };

    reader.readAsText(file);
};