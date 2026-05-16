function MutateNextGen() /**************************************** NEXT GENERATION *********************************/
{

    population = neuralNetworks.map((network, index) => {
    return { network: network, score: scores[index] };
    });

    population.sort((a, b) => a.score - b.score);

    //console.log(population);

    var best;
    var average;
    var median;
    var worst;

    best = population[0].score;
    average = 0;
    for(var i = 0; i < amountOfAgents; i++)
    {
        average += population[i].score;
    }
    average /= amountOfAgents;
    median = population[Math.floor(amountOfAgents/2)].score;
    worst = population[population.length - 1].score;

    // RETRIES GENERATION IF FLUKE

    let combinedScore = best+average+(worst * 0.5); // because median scores tend to vastly varry, they are ignored for this
    let smoothedPreviousScore = RollingAverage(bestScore,10)+RollingAverage(averageScore,10)+(RollingAverage(worstScore,10) * 0.5); // worst has less impact due to inherent environmental noise
    if (smoothedPreviousScore === 0) {
        var deltaScore = 0;
    }else
    {
        var deltaScore = (combinedScore - smoothedPreviousScore) / smoothedPreviousScore;
    } 

    if(Math.abs(deltaScore) > 0.5)
    {
        deltaScore *= 100;

        if(retrySign == Math.sign(deltaScore) && retryFlipCount < 2)
        {
            if(retryCount < 2)
            {
                console.log("Generation retried for high delta score: " + deltaScore.toFixed(2) + "%");
                console.log("Attempt: " + retryCount);
                retryCount++;
                generation--;
                return;
            }else{
                console.log("High delta score has been confirmed:" + deltaScore.toFixed(2) + "%");
            }
        }else{
            console.log("Sign flipped, reset attempt count")
            retrySign = Math.sign(deltaScore);
            retryCount = 0;
            generation--;
            retryFlipCount++;
            return;
        }
    }else{
        if(retryCount > 0)
        {
            console.log("High delta score was ignored");
        }
    }
    retrySign = Math.sign(deltaScore)
    retryCount = 0;
    retryFlipCount = 0;
    lastVerifiedGeneration = generation;

    bestScore.push(best);
    averageScore.push(average);
    medianScore.push(median);
    worstScore.push(worst);

    //console.log("Best score: " + best.toFixed(2) + ", average score: " + average.toFixed(2) + ", median score: " + median.toFixed(2));

    const eliteCount = Math.floor(
        amountOfAgents *
        CurriculumBlend([0.02, 0.05, 0.12])
    );

    let nextGeneration = [];

    for (let i = 0; i < eliteCount; i++)
    {
        population[i].network.age++;
        population[i].network.lastScore = population[i].score;
        population[i].network.i = i;
        ResetLayers(population[i].network);
        nextGeneration.push(population[i].network);
    }

    const survivorCount = Math.floor(amountOfAgents * 0.4);

    var survivors = population.slice(0, survivorCount);

    survivors = survivors.filter(agent => agent.score <= 500);

    if(survivors.length === 0)
    {
        survivors = population.slice(0, survivorCount);
    }

    while (nextGeneration.length < amountOfAgents)
    {
        let parentA = TournamentSelect(survivors);
        let parentB = TournamentSelect(survivors);

        var percentile = population.indexOf(parentA) + population.indexOf(parentB);
        percentile /= 2 * amountOfAgents;

        let child = Crossover(parentA.network, parentB.network);

        child = NudgeNetwork(child, percentile);

        child.i = nextGeneration.length;
        child.id = child.id + child.i;

        nextGeneration.push(child);
    }

    neuralNetworks = nextGeneration;
    
}

function TournamentSelect(population)
{
    let best = null;

    for (let i = 0; i < 5; i++)
    {
        let candidate =
            population[Math.floor(Math.random() * population.length)];

        if (!best || candidate.score < best.score)
        {
            best = candidate;
        }
    }

    return best;
}

function Crossover(a, b)
{
    let child = CloneNetwork(a);

    for (let i = 0; i < child.cn1.length; i++)
    {
        child.cn1[i] =
            Math.random() < 0.5
                ? a.cn1[i]
                : b.cn1[i];
    }

    for (let i = 0; i < child.cn2.length; i++)
    {
        child.cn2[i] =
            Math.random() < 0.5
                ? a.cn2[i]
                : b.cn2[i];
    }

    for (let i = 0; i < child.cn3.length; i++)
    {
        child.cn3[i] =
            Math.random() < 0.5
                ? a.cn3[i]
                : b.cn3[i];
    }


    for (let i = 0; i < child.bs1.length; i++)
    {
        child.bs1[i] =
            Math.random() < 0.5
                ? a.bs1[i]
                : b.bs1[i];
    }

    for (let i = 0; i < child.bs2.length; i++)
    {
        child.bs2[i] =
            Math.random() < 0.5
                ? a.bs2[i]
                : b.bs2[i];
    }

    for (let i = 0; i < child.bs3.length; i++)
    {
        child.bs3[i] =
            Math.random() < 0.5
                ? a.bs3[i]
                : b.bs3[i];
    }

    // repeat for all arrays

    return child;
}

function NudgeNetwork(network, percentile = 0)
{
    const newNetwork = CloneNetwork(network);


    const weightMutationRate =
        mutationRate + percentile * 0.25;

    const biasMutationRate =
        weightMutationRate * 2;

    const geneMutationChance =
        mutationChance;

    // rare full randomization
    const rareMutationChance =
        0.002;

    MutateArray(
        newNetwork.cn1,
        weightMutationRate,
        geneMutationChance,
        rareMutationChance
    );

    MutateArray(
        newNetwork.cn2,
        weightMutationRate,
        geneMutationChance,
        rareMutationChance
    );

    MutateArray(
        newNetwork.cn3,
        weightMutationRate,
        geneMutationChance,
        rareMutationChance
    );

    MutateArray(
        newNetwork.bs1,
        biasMutationRate,
        geneMutationChance,
        rareMutationChance
    );

    MutateArray(
        newNetwork.bs2,
        biasMutationRate,
        geneMutationChance,
        rareMutationChance
    );

    MutateArray(
        newNetwork.bs3,
        biasMutationRate,
        geneMutationChance,
        rareMutationChance
    );



    return newNetwork;
}

function MutateArray(array, mutationMagnitude, mutationChance, rareMutationChance)
{
    for(let i = 0; i < array.length; i++)
    {
        // normal mutation
        if(Math.random() < mutationChance)
        {
            array[i] +=
                (Math.random() - Math.random()) *
                mutationMagnitude;
        }

        // rare evolutionary jump
        if(Math.random() < rareMutationChance)
        {
            array[i] = Math.random() * 6 - 3;
        }

        array[i] = clamp(array[i], -3, 3);
    }
}