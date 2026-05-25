let speciesCount = 5;
let threshold = 1;
const targetSpeciesCount = 5;

function MutateNextGen() /**************************************** NEXT GENERATION *********************************/
{

    if(generation <= 0) {
        generation = 0;
        retryCount = 0;
        retryFlipCount = 0;
    }

    let networkVectors = [];

    for(let i = 0; i < neuralNetworks.length; i++)
    {
        const nodeGroups = NetworkToNodeGroups(neuralNetworks[i]);
        networkVectors.push(NodeGroupsToVector(nodeGroups));
    }

    if(speciesCount < targetSpeciesCount)
    {
        threshold -= 0.002;
    }else{
        threshold += 0.002;
    }


    let species = [];
    let speciesIDs = [];

    species.push(networkVectors[0]); // arbitrarily lets the first network create it's own species (which is previous generation's leader)
    speciesIDs.push(0);

    for(let i = 1; i < networkVectors.length; i++)
    {
        let speciesID = null;
        let lowestDistance = Infinity;

        for(let s = 0; s < species.length; s++)
        {
            const distance = VectorDistance(networkVectors[i], species[s]);
            if(distance < threshold && distance < lowestDistance) // I'm just making up a number here
            {
                speciesID = s;
                lowestDistance = distance;
            }
        }

        if(speciesID === null) // add new species
        {
            speciesIDs.push(species.length); // this first so that it's not off by one
            species.push(networkVectors[i]);
        }else{
            speciesIDs.push(speciesID); // add to existing species
        }
    }

    speciesCount = species.length;

    population = neuralNetworks.map((network, index) => {
    return { network: network, score: scores[index] - (grades[index] * 250), rawScore: scores[index], grade: grades[index], species: speciesIDs[index] }; // agents are given an addition 1000 reward for its grade
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

    const minimumPassRate = highestPassRateDuringCurriculum / 100 * 15; // %10 of the highest pass rate achieved this curriculum
    const maxRetries = 4;
    const maxFlips = 3;

    if(Math.abs(deltaScore) > 0.5) // if delta score is greater than 50%
    {
        deltaScore *= 100;

        if(retrySign == Math.sign(deltaScore) || retryFlipCount >= maxFlips)
        {
            if(retryCount < maxRetries)
            {
                console.log("Generation retried for high delta score: " + deltaScore.toFixed(2) + "%");
                console.info("Attempt: " + retryCount);
                retryCount++;
                generation--;
                return;
            }else{
                console.warn("High delta score has been confirmed:" + deltaScore.toFixed(2) + "%");
            }
        }else{
            retryFlipCount++;
            console.log("Sign flipped, reset attempt count: x" + retryFlipCount)
            retrySign = Math.sign(deltaScore);
            retryCount = 0;
            generation--;
            return;
        }
    }else{
        if(retryCount > 0)
        {
            console.log("High delta score was ignored");
        }
    }
    
    if(passRate < minimumPassRate || passRate > highestPassRateDuringCurriculum + 0.1) // if pass rate is below the minimum allowed pass rate or above the current highest pass rate + 10%
    {
        if(retryCount < maxRetries)
        {
            console.log("Generation retried for low pass rate: " + (passRate * 100).toFixed(2) + "%");
            console.info("Attempt: " + retryCount);
            retryCount++;
            generation--;
            return;
        }else{
            console.warn("Low pass rate confirmed:" + (passRate * 100).toFixed(2) + "%");
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

    let percent0 = 0;
    let percent1 = 0;
    let percent2 = 0;
    let percent3 = 0;
    let percent4 = 0;

    for(let i = 0; i < population.length; i++)
    {
        const grade = population[i].grade;
        if(grade == 0)
        {
            percent0++;
        }else{
            if(grade == 2)
            {
                percent2++;
            }else{
                if(grade == 1)
                {
                    percent1++;
                }else{
                    if(grade == 3)
                    {
                        percent3++;
                    }else{
                        percent4++;
                    }
                }
            }
        }
    }

    grade0History.push(percent0);
    grade1History.push(percent1);
    grade2History.push(percent2);
    grade3History.push(percent3);
    grade4History.push(percent4);

    const eliteCount = Math.floor(
        amountOfAgents *
        CurriculumBlend([0.02, 0.04, 0.07, 0.10])
    );

    let nextGeneration = [];
    let eScore = 0;

    for (let i = 0; i < eliteCount; i++)
    {
        eScore += population[i].score;
        population[i].network.age++;
        population[i].network.lastScore = population[i].score;
        population[i].network.i = i;
        ResetLayers(population[i].network);
        nextGeneration.push(population[i].network);
    }
    eScore /= eliteCount;

    eliteScore.push(eScore);

    const survivorCount = Math.floor(amountOfAgents * 0.7); // 70% of the population is the base count of survivors

    const hardCutoff = CurriculumBlend([500, 0, -200, -1000, -8000], curriculumStage);
    const softCutoff = population[Math.floor(survivorCount * 0.75)].score; // top 75th percentile score of survivors

    // minimum survivors should be ~50% of the population

    // use whichever is more permissive
    const activeCutoff = Math.max(hardCutoff, softCutoff);

    /*survivors = population
        .slice(0, survivorCount)
        .filter(a => a.score <= activeCutoff);*/

    survivors = [];

    for(let i = 0; i < survivorCount; i++) // only check the allowed amount of survivors before pushing to list
    {
        const agent = population[i];
        if(agent.score > activeCutoff) continue; // apply cutoff
        if(agent.grade === 0) // grade 0 agents
        {
            if(Math.random() < 0.3) continue; // have a 30% chance of randomly dying
        }

        survivors.push(agent);
    }

    /*console.log("Hard cutoff:", hardCutoff.toFixed(1), 
                "Soft cutoff:", softCutoff.toFixed(1),
                "Active:", activeCutoff.toFixed(1),
                "Survivors:", survivors.length);*/

    let duplicatedAgents = [];

    for(let i = 0; i < survivors.length; i++)
    {
        const grade = survivors[i].grade;
        if(grade >= 3) // grade 3 or higher agents get a 30% chance to get duplicated
        {
            if(Math.random() < 0.3) duplicatedAgents.push(survivors[i]);
        }
        if(grade === 4) // grade 4 agents get an additional 30% chance to get duplicated
        {
            if(Math.random() < 0.3) duplicatedAgents.push(survivors[i]);
        }
        // grade 4 agents have a 51& chance to get duplicated, and a 9% chance to get duplicated twice
    }

    console.log(
        "Duplicated Agents: " + duplicatedAgents.length,
        "Survivors: " + survivors.length
    );

    survivors.push(...duplicatedAgents);

    const speciesBuckets = Array.from(
        { length: speciesCount },
        () => []
    );

    for (const agent of survivors)
    {
        if (!agent || !agent.network)
        {
            console.warn("Invalid agent in survivors:", agent);
            continue;
        }

        const s = agent.species;

        if (s === undefined || s < 0 || s >= speciesCount)
        {
            console.warn("Bad species index:", s, agent);
            continue;
        }

        speciesBuckets[s].push(agent);
    }

    let speciesFitness = [];
    const meanWeight = 1;
    const bestWeight = 3;

    for(let s = 0; s < speciesCount; s++)
    {
        const speciesBucket = speciesBuckets[s];
        const length = speciesBucket.length;
        let sum = 0;
        let best = Infinity;

        if(length === 0)
        {
            speciesFitness.push(Infinity);
            continue;
        }

        for(let i = 0; i < length; i++)
        {
            sum += speciesBucket[i].score;
            best = Math.min(best, speciesBucket[i].score);
        }

        let fitness = sum / length * meanWeight;
        fitness += best * bestWeight;
        fitness /= meanWeight + bestWeight;

        speciesFitness.push(fitness);
    }

    const speciesRank = new Array(speciesCount);

    sortedSpecies = speciesFitness.map((score, index) => {
        return { score: score, species: index };
    });

    sortedSpecies.sort((a, b) => a.score - b.score);

    for(let rank = 0; rank < sortedSpecies.length; rank++)
    {
        const speciesID = sortedSpecies[rank].species;

        speciesRank[speciesID] = rank;
    }

    const offspringRoom = amountOfAgents - nextGeneration.length;
    const allocatedOffsprings = new Array(speciesCount).fill(0);

    const activeSpecies = [];

    for (let s = 0; s < speciesCount; s++)
    {
        if (speciesBuckets[s].length === 0) continue;

        activeSpecies.push({
            id: s,
            rank: speciesRank[s]
        });
    }

    // create weights

    let totalWeight = 0;

    for (const sp of activeSpecies)
    {
        totalWeight += speciesCount - sp.rank;
    }

    // allocat offspring

    let allocatedTotal = 0;

    for (const sp of activeSpecies)
    {
        const weight = speciesCount - sp.rank;

        const offspringCount = Math.floor(
            (weight / totalWeight) * offspringRoom
        );

        allocatedOffsprings[sp.id] = offspringCount;
        allocatedTotal += offspringCount;
    }

    // allocate leftovers
    while (allocatedTotal < offspringRoom)
    {
        for (const sp of activeSpecies)
        {
            if (allocatedTotal >= offspringRoom) break;

            allocatedOffsprings[sp.id]++;
            allocatedTotal++;
        }
    }

    for(let s = 0; s < speciesCount; s++)
    {
        if(speciesBuckets[s].length === 0) continue;

        for(let i = 0; i < allocatedOffsprings[s]; i++)
        {
            //console.log(speciesBuckets[s]);
            nextGeneration.push(CreateOffspringFromPool(speciesBuckets[s], nextGeneration.length));
        }
    }

    if(nextGeneration.length != amountOfAgents)
    {
        console.error("Generation population mismatch!", nextGeneration.length)
    }

    neuralNetworks = nextGeneration;

    console.log(
        speciesBuckets.map(b => b.length)
    );
    
}

function CreateOffspringFromPool(pool, i)
{
            if(Math.random() < 0.3) {
            // clone + mutate single parent
            let parent = TournamentSelect(pool);
            var percentile = population.indexOf(parent);
            percentile /= survivors.length;
            let child = NudgeNetwork(CloneNetwork(parent.network), percentile);

            child.i = i;
            child.id = child.id + child.i;

            return child;
        } else {
            // normal crossover
            let parentA = TournamentSelect(pool);
            let parentB = TournamentSelect(pool);

            var percentile = population.indexOf(parentA) + population.indexOf(parentB);
            percentile /= 2 * survivors.length;

            let child = Crossover(parentA.network, parentB.network);

            child = NudgeNetwork(child, percentile);

            child.i = i;
            child.id = child.id + child.i;

            return child;
        }
}

function TournamentSelect(population)
{
    const minCandidates = 2; // at minimum there are 2 candidates
    const candidateThreshold = 0.175; // at a population of 100, there are 10 candidates
    // as a general rule of thumb, the estimated population input should have ~5 or so candidates
    // currently I expect the estimated population to be around ~30 ish

    const length = population.length;

    const candidateCount = Math.max(minCandidates, Math.ceil(length * candidateThreshold));

    let best = null;

    for (let i = 0; i < candidateCount; i++)
    {
        let candidate =
            population[Math.floor(Math.random() * length)];

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