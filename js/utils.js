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