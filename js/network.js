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

    instability
    memoryInstability

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

        this.instability = 0;
        this.memoryInstability = 0;
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

class NodeGroup
{
    // biases

    biasMean
    biasMagnitude
    biasDeviation
    biasSign

    // weights

    weightMean
    weightMagnitude
    weightDeviation
    weightSign

    // metadata

    nodeCount
    connectionCount

    constructor (biases, weights)
    {
        const biasBreakdown = GetArrayBreakdown(biases);

        this.biasMean = biasBreakdown.mean;
        this.biasMagnitude = biasBreakdown.magnitude;
        this.biasDeviation = biasBreakdown.deviation;
        this.biasSign = biasBreakdown.sign;

        const weightBreakdown = GetArrayBreakdown(weights)

        this.weightMean = weightBreakdown.mean;
        this.weightMagnitude = weightBreakdown.magnitude;
        this.weightDeviation = weightBreakdown.deviation;
        this.weightSign = weightBreakdown.sign;

        this.nodeCount = biases.length;
        this.connectionCount = weights.length;
    }
}

function GetArrayBreakdown(array)
{
    if(array.length === 0)
    {
        console.error("No array to break down!")
        return {
            mean: 0,
            magnitude: 0,
            deviation: 0,
            sign: 0
        };
    }

    const length = array.length;
    let mean = 0;
    let magnitude = 0;
    let deviation = 0;
    let sign = 0;

    for(let i = 0; i < length; i++)
    {
        const v = array[i];
        mean += v;
        magnitude += Math.abs(v);
        sign += Math.sign(v);
    }

    mean /= length;
    magnitude /= length;
    sign /= length;

    for(let i = 0; i < length; i++)
    {
        const v = array[i];
        const difference = v - mean;
        deviation += difference * difference;
    }

    deviation /= length;
    deviation = Math.sqrt(deviation);

    const breakdown = {
        mean,
        magnitude,
        deviation,
        sign
    }

    return breakdown;
}

function NetworkToNodeGroups(network)
{
    const groups = [];

    //----------------------------------------
    // SHORTHANDS
    //----------------------------------------

    const {
        bs1, bs2, bs3,
        cn1, cn2, cn3,

        hl1,
        hl2,

        outputs,
        mb1,
        mb2,

        inputs
    } = network;

    const hl1Len = hl1.length;
    const hl2Len = hl2.length;

    const outputsLen = outputs.length;
    const mb1Len = mb1.length;
    const mb2Len = mb2.length;

    const totalOutputs =
        outputsLen +
        mb1Len +
        mb2Len;

    //----------------------------------------
    // HIDDEN GROUPS
    //----------------------------------------

    const hiddenGroupSize = 8;

    const hiddenGroupCount =
        hl1Len / hiddenGroupSize;

    for(let g = 0; g < hiddenGroupCount; g++)
    {
        const biases = [];
        const weights = [];

        //------------------------------------
        // HL1 NODES
        //------------------------------------

        const start = g * hiddenGroupSize;
        const end = start + hiddenGroupSize;

        for(let node = start; node < end; node++)
        {
            //--------------------------------
            // HL1 BIAS
            //--------------------------------

            biases.push(bs1[node]);

            //--------------------------------
            // CN1 CONNECTIONS
            //--------------------------------

            const cn1Inputs =
                inputs.length +
                mb1Len +
                mb2Len;

            for(let inputNode = 0; inputNode < cn1Inputs; inputNode++)
            {
                const connection =
                    (inputNode * hl1Len) + node;

                weights.push(
                    cn1[connection]
                );
            }
        }

        //------------------------------------
        // HL2 NODES
        //------------------------------------

        for(let node = start; node < end; node++)
        {
            //--------------------------------
            // HL2 BIAS
            //--------------------------------

            biases.push(bs2[node]);

            //--------------------------------
            // CN2 CONNECTIONS
            //--------------------------------

            for(let hl1Node = 0; hl1Node < hl1Len; hl1Node++)
            {
                const connection =
                    (hl1Node * hl2Len) + node;

                weights.push(
                    cn2[connection]
                );
            }
        }

        groups.push(
            new NodeGroup(
                biases,
                weights
            )
        );
    }

    //----------------------------------------
    // OUTPUT GROUP
    //----------------------------------------

    {
        const biases = [];
        const weights = [];

        for(let node = 0; node < outputsLen; node++)
        {
            biases.push(bs3[node]);

            for(let hl2Node = 0; hl2Node < hl2Len; hl2Node++)
            {
                const connection =
                    (hl2Node * totalOutputs) + node;

                weights.push(
                    cn3[connection]
                );
            }
        }

        groups.push(
            new NodeGroup(
                biases,
                weights
            )
        );
    }

    //----------------------------------------
    // MB1 GROUP
    //----------------------------------------

    {
        const biases = [];
        const weights = [];

        for(let node = 0; node < mb1Len; node++)
        {
            const outputIndex =
                node + outputsLen;

            biases.push(
                bs3[outputIndex]
            );

            for(let hl2Node = 0; hl2Node < hl2Len; hl2Node++)
            {
                const connection =
                    (hl2Node * totalOutputs) +
                    outputIndex;

                weights.push(
                    cn3[connection]
                );
            }
        }

        groups.push(
            new NodeGroup(
                biases,
                weights
            )
        );
    }

    //----------------------------------------
    // MB2 GROUP
    //----------------------------------------

    {
        const biases = [];
        const weights = [];

        for(let node = 0; node < mb2Len; node++)
        {
            const outputIndex =
                node +
                outputsLen +
                mb1Len;

            biases.push(
                bs3[outputIndex]
            );

            for(let hl2Node = 0; hl2Node < hl2Len; hl2Node++)
            {
                const connection =
                    (hl2Node * totalOutputs) +
                    outputIndex;

                weights.push(
                    cn3[connection]
                );
            }
        }

        groups.push(
            new NodeGroup(
                biases,
                weights
            )
        );
    }

    return groups;
}

function NodeGroupsToVector(nodeGroups)
{
    const vector = [];

    for(let i = 0; i < nodeGroups.length; i++)
    {
        const g = nodeGroups[i];

        //------------------------------------
        // BIAS STATS
        //------------------------------------

        vector.push(g.biasMean);
        vector.push(g.biasMagnitude);
        vector.push(g.biasDeviation);
        vector.push(g.biasSign);

        //------------------------------------
        // WEIGHT STATS
        //------------------------------------

        vector.push(g.weightMean);
        vector.push(g.weightMagnitude);
        vector.push(g.weightDeviation);
        vector.push(g.weightSign);

        //------------------------------------
        // TOPOLOGY METADATA
        //------------------------------------

        //vector.push(g.nodeCount);
        //vector.push(g.connectionCount);
    }

    return vector;
}