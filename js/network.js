class NeuralNetwork
{
    inputs
    cn1
    hl1
    bs1
    cn2
    hl2
    bs2
    cn3
    outputs
    bs3

    mb1 // overwrite memory buffer
    mb2 // persistent memory buffer

    age
    i
    id
    lastScore

    constructor (i, h1, h2, o, m1, m2)
    {
        this.inputs = new Float32Array(i);
        this.cn1 = new Float32Array((i + m1 + m2)*h1); // input connections are combined with both memory buffers
        this.hl1 = new Float32Array(h1);
        this.bs1 = new Float32Array(h1);
        this.cn2 = new Float32Array(h1*h2);
        this.hl2 = new Float32Array(h2);
        this.bs2 = new Float32Array(h2);
        this.cn3 = new Float32Array(h2*(o + m1 + m2)); // output connections are combined with both memory buffers
        this.outputs = new Float32Array(o);
        this.bs3 = new Float32Array(o + m1 + m2); // output biases are combined with both memory buffers
        this.mb1 = new Float32Array(m1);
        this.mb2 = new Float32Array(m2);

        this.age = 0;
        this.i = neuralNetworks.length;
        if(neuralNetworks.length == amountOfAgents)
        {
            this.id = generation + "-";
        }else{
            this.id = "0-" + neuralNetworks.length;
        }
        
        this.lastScore = 0;
    }
}

function UpdateNeuralNetwork(network, agent)
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

    let dx = targets[agent.targetID].X - agent.xPos;
    let dy = targets[agent.targetID].Y - agent.yPos;
    let dist = Math.sqrt(
        dx*dx +
        dy*dy
    );

    /**************************************** INPUTS ********************************/

    inputs[0] = (targets[agent.targetID].X - agent.xPos) / 100;
    inputs[1] = (targets[agent.targetID].Y - agent.yPos) / 100;
    inputs[2] = Math.sin(agent.angle);
    inputs[3] = Math.cos(agent.angle);
    inputs[4] = (dist - targetRadius) / targetRadius;
    inputs[5] = (agent.xVel) / 25;
    inputs[6] = (agent.yVel) / 25;
    inputs[7] = (agent.aVel) * 5;
    inputs[8] = agent.fuel / 500;
    inputs[9] = (agent.yPos + 60) / 100;
    inputs[10] = (agent.xPos) / 100;
    inputs[11] = agent.xLastExternalForce / 10;
    inputs[12] = agent.yLastExternalForce / 10;

    if(agent.targetID + 1 < targets.length)
    {
        inputs[13] = (targets[agent.targetID + 1].X - agent.xPos) / 100;
        inputs[14] = (targets[agent.targetID + 1].Y - agent.yPos) / 100;
    }else{
        inputs[13] = (nextMovingTargetX - agent.xPos) / 100;
        inputs[14] = (nextMovingTargetY - agent.yPos) / 100;
    }

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

    function CloneNetwork(network)
{
    //console.log(network);
    let newNetwork = new NeuralNetwork(
        network.inputs.length,
        network.hl1.length,
        network.hl2.length,
        network.outputs.length,
        network.mb1.length,
        network.mb2.length
    );

    newNetwork.cn1 = new Float32Array(network.cn1);
    newNetwork.cn2 = new Float32Array(network.cn2);
    newNetwork.cn3 = new Float32Array(network.cn3);

    newNetwork.bs1 = new Float32Array(network.bs1);
    newNetwork.bs2 = new Float32Array(network.bs2);
    newNetwork.bs3 = new Float32Array(network.bs3);

    ResetLayers(newNetwork);

    return newNetwork;
}

    function ResetLayers(network)
{
    for (var node = 0; node < network.inputs.length; node++) {network.inputs[node] = 0;}
    for (var node = 0; node < network.hl1.length; node++) {network.hl1[node] = 0;}
    for (var node = 0; node < network.hl2.length; node++) {network.hl2[node] = 0;}
    for (var node = 0; node < network.outputs.length; node++) {network.outputs[node] = 0;}
    for (var node = 0; node < network.mb1.length; node++) {network.mb1[node] = 0;}
    for (var node = 0; node < network.mb2.length; node++) {network.mb2[node] = 0;}
}