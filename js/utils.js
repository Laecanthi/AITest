/*function SoftClamp(value)
{
    return Math.tanh(value);
}

function ArrayBlend(array, value)
{
    const length = array.length;

    const v =
        clamp(value, 0, length - 1);

    const lower = Math.floor(v);
    const upper = Math.ceil(v);

    const t = v - lower;

    return lerp(array[lower], array[upper], t);
}

function CurriculumBlend(array)
{
    return ArrayBlend(array, curriculumStage);
}*/

const degreesToRadians = (degrees) => (degrees * Math.PI) / 180;


function RollingAverage(array, windowSize)
{
    let result = 0;

    const count = Math.min(windowSize, array.length);

    if(count === 0)
    {
        return 0;
    }

    for(let i = 1; i <= count; i++)
    {
        result += array[array.length - i];
    }

    return result / count;
}

function LogTransform(value) //just ignoring log transform for now
{
    //return Math.sign(value) * Math.log10(Math.abs(value) + 1);
    return value;
}

function LargestAbs2D(array)
{
    let largestAbs = 0;

    for(let i = 0; i < array.length; i++)
    {
        for(let j = 0; j < array[i].length; j++)
        {
            largestAbs = Math.max(
                largestAbs,
                Math.abs(array[i][j])
            );
        }
    }

    return largestAbs;
}

function RollingAverage2D(history, index, node, windowSize)
{
    let sum = 0;
    let count = 0;

    const start =
        Math.max(0, index - windowSize + 1);

    for(let i = start; i <= index; i++)
    {
        sum += history[i][node];
        count++;
    }

    return sum / count;
}