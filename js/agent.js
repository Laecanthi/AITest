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

    xLastExternalForce;
    yLastExternalForce;

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

        this.targetID = 0;
        this.timeInTarget = 0;
        this.lastDist = Infinity;
        this.alive = true;

        this.xLastExternalForce = 0;
        this.yLastExternalForce = 0;
    }
}

    function UpdateAgent(agent, dt)
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

    const localWindMagnitude = Math.sin(agent.yPos / 10) + Math.cos(agent.xPos / 10);

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
}

function ResetAgents()
{
    var randomPosX = Math.random() * 80;
    var randomPosY = Math.random() * -60;

    agents.length = 0;
    scores.length = 0;

    for(var i = 0; i < amountOfAgents; i++)
    {
        agents.push(new Agent(randomPosX, randomPosY, 50, 500, 0.1, 2000, 80));
        scores.push(0);
    }

    //console.log(agents);
}