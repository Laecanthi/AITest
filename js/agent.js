class Agent /**************************** AGENT **************************/
{
    angle
    xPos
    yPos
    xVel
    yVel
    aVel
    xAcc
    yAcc
    aAcc
    torque 
    thrust // 0 to 1
    rotation // -1 to 1
    mass
    dryMass
    fuel
    fuelMass
    fThrust

    targetID;
    timeInTarget;
    lastDist;
    alive;
    timeOfDeath;

    xLastExternalForce;
    yLastExternalForce;
    aLastExternalForce;

    engineOn
    engineTimer
    engineCooldown

    constructor (x, y, dm, fu, fm, f, t) // VALUES IN METERS
    {
        this.angle = Math.PI / 2;
        this.xPos = x;
        this.yPos = y;
        this.xVel = 0;
        this.yVel = 0;
        this.aVel = 0;
        this.xAcc = 0;
        this.yAcc = 0;
        this.aAcc = 0;
        //this.xThrust = 0;
        //this.yThrust = 0;
        this.torque = t;
        this.thrust = 0;
        this.rotation = 0;
        this.mass = dm + fu * fm;
        this.dryMass = dm;
        this.fuel = fu;
        this.fuelMass = fm
        this.fThrust = f;

        this.lastDist = Infinity;
        this.alive = true;
        this.timeOfDeath = 0;

        this.xLastExternalForce = 0;
        this.yLastExternalForce = 0;
        this.aLastExternalForce = 0;

        this.engineOn = false;
        this.engineTimer = 0;
        this.engineCooldown = 0;
    }
}

/*function UpdateAgent(agent, dt)
{
    //agent.xThrust = clamp(agent.xThrust, -1, 1);
    //agent.yThrust = clamp(agent.yThrust, -1, 1);

    agent.thrust = clamp(agent.thrust, 0, 1);
    agent.rotation = clamp(agent.rotation, -1, 1);
    
    agent.fuel -= agent.thrust * thrustBurn * dt; // full thrust burns 50 fuel per second, a max of 10 seconds at full thrust
    agent.fuel -= Math.abs(agent.rotation / 10) * thrustBurn * dt; // rotating burns 5 fuel per second
    agent.fuel = Math.max(agent.fuel, 0);

    if(agent.fuel == 0)
    {
        agent.thrust = 0;
        agent.rotation = 0;
    }

    agent.mass = agent.dryMass + agent.fuel * agent.fuelMass;

    //console.log(agent);

    var xExternalForce = 0;
    var yExternalForce = 0;

    const localWindMagnitude = Math.sin(time);

    xExternalForce += windForceX * localWindMagnitude;
    yExternalForce += windForceY * localWindMagnitude;

    agent.xLastExternalForce = xExternalForce;
    agent.yLastExternalForce = yExternalForce;

    agent.xAcc = agent.thrust * Math.cos(agent.angle) * agent.fThrust;
    agent.yAcc = agent.thrust * Math.sin(agent.angle) * agent.fThrust;

    agent.xAcc += xExternalForce;
    agent.yAcc += yExternalForce;

    agent.xAcc /= agent.mass;
    agent.yAcc /= agent.mass;

    agent.aAcc = agent.rotation * agent.torque / agent.mass;

    agent.yAcc -= 9.8;

    agent.xVel *= 0.999;
    agent.yVel *= 0.999;
    agent.aVel *= 0.98;

    agent.xVel += agent.xAcc * dt;
    agent.yVel += agent.yAcc * dt;
    agent.aVel += agent.aAcc * dt;

    agent.xPos += agent.xVel * dt;
    agent.yPos += agent.yVel * dt;
    agent.angle += agent.aVel * dt;
}*/

function ResetAgents()
{
    const velocityFactor = 5 * CurriculumBlend([1, 1, 1, 1.1, 2, 5]); // random velocity increases from small to devious
    const spawnX = targetX + (Math.random() - 0.5) * 40 * CurriculumBlend([1, 1, 1.5, 3, 4]); // ±20m from target to ±80m from target (width of map is 160)
    const spawnY = Math.random() * -30 * CurriculumBlend([1, 1, 1.1, 2.5, 3]); // between 0 and 30 to 90 (height of map is 120)
    const spawnA = Math.PI / 2 + ((Math.random() - 0.5) * degreesToRadians(5) * CurriculumBlend([1, 1, 2, 3, 5])); // ±5 degress from 90, to ±25 degrees from 90
    const spawnVelX = (Math.random() - 0.5) * velocityFactor; // small random initial velocity
    const spawnVelY = (Math.random() - 0.5) * velocityFactor;
    const spawnVelA = (Math.random() - 0.5) * degreesToRadians(velocityFactor);

    agents.length = 0;
    scores.length = 0;
    grades.length = 0;

    for(var i = 0; i < amountOfAgents; i++)
    {
        let newAgent = DefaultAgent(spawnX, spawnY);
        newAgent.angle = spawnA;
        newAgent.xVel = spawnVelX;
        newAgent.yVel = spawnVelY;
        newAgent.aVel = spawnVelA;

        agents.push(newAgent);
        scores.push(0);
        grades.push(0);
    }
}

function DefaultAgent(x, y)
{
    return new Agent(x, y, 50, 500, 0.1, 2500, 250);
}