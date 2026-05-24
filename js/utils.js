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

function RollingAverageIndexed(array, windowSize, index)
{
    let sum = 0;
    let count = 0;

    const half = Math.floor(windowSize / 2);

    for (let offset = -half; offset <= half; offset++)
    {
        const i = index + offset;

        if (i >= 0 && i < array.length)
        {
            sum += array[i];
            count++;
        }
    }

    return count === 0 ? 0 : sum / count;
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

function EMA(array, alpha, index)
{
    if (index <= 0) return array[0] ?? 0;

    let value = array[0] ?? 0;

    for (let i = 1; i <= index; i++)
    {
        const v = array[i] ?? value;
        value = alpha * v + (1 - alpha) * value;
    }

    return value;
}

function EMA2D(history, index, node, alpha = 0.1)
{
    if (!history || history.length === 0) return 0;

    let ema = history[0]?.[node] ?? 0;

    for (let i = 1; i <= index; i++)
    {
        const value = history[i]?.[node] ?? ema;
        ema = alpha * value + (1 - alpha) * ema;
    }

    return ema;
}

function NormalizeAngle(a)
{
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
}

function LerpAngle(a, b, t)
{
    let diff = NormalizeAngle(b - a);
    return a + diff * t;
}

function VectorDistance(a, b)
{
    if(a.length !== b.length)
    {
        console.error(
            "Vector length mismatch",
            a.length,
            b.length
        );

        return Infinity;
    }

    let sum = 0;

    for(let i = 0; i < a.length; i++)
    {
        const difference =
            a[i] - b[i];

        sum += difference * difference;
    }

    return Math.sqrt(sum);
}