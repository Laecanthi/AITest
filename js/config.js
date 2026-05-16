const canvas = document.getElementById("main-canvas");
const m_ctx = canvas.getContext("2d");

const networkCanv = document.getElementById("network-canvas");
const n_ctx = networkCanv.getContext("2d");

const graphCanv = document.getElementById("graph-canvas");
const g_ctx = graphCanv.getContext("2d");
var graphXScale;
var graphYScale;
var yShift;
var xShift;
var padding = 25;
var yMaxValue = 1000;
var xMinValue = 0;

const pixelsPerMeter = 10;
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
const lerp = (start, end, t) => start + (end - start) * t;

var agents = [];
var neuralNetworks = [];
var scores = [];
const amountOfAgents = 300;

var time = 0;
var generation = 0;
var randomPosX = Math.random() * 80;
var randomPosY = Math.random() * -60;

var targets = [
    {
        X: 0,
        Y: 0
    }
]

var bestScore = []
var averageScore = []
var medianScore = []
var worstScore = []


    //SIMULATION VARIABLES

var simSpeed;
var simSubsteps;
var mutationRate = 0.05;
var generationLength = 5;
var showOnlyLeader = false;
var nonLeaderOpacity = 0.1;
var renderSimulation = true;

    let lastTime = 0;

var simPlay = false;
var simSpeed = 5;
var simSubsteps = 5;

var movingTargetTime = 0;
var currentMovingTargetX = Math.random() * 80;
var currentMovingTargetY = Math.random() * -60;
var nextMovingTargetX = Math.random() * 80;
var nextMovingTargetY = Math.random() * -60;
var targetRadius = 1.5;
var thrustBurn = 0;
var maxThrustDuration = 15;
var mutationChance = 0.25;
var crashVelocity = 5;
var windDirection = 0;
var globalWindMagnitude = 0;
var windForceX = 0;
var windForceY = 0;

var curriculumStage = 0;
var retryCount = 0;
var retrySign = 0;
var retryFlipCount = 0;
var lastVerifiedGeneration = 0;

var inputLabels =
    [
        "Relative target x",
        "Relative target y",
        "Sine of angle",
        "Cosine of angle",
        "Signed distance",
        "X Vel",
        "Y Vel",
        "Angular Vel",
        "Fuel",
        "Y Pos",
        "X Pos",
        "External Force X",
        "External Force Y",
        "Next target x",
        "Next target y"
    ];

var outputLabels =
    [
        "Rotation",
        "Thrust"
    ];

var layerLabels =
    [
        "Inputs",
        "HL1",
        "HL2",
        "Outputs",
        "Overwrite Buffer",
        "Persistent Buffer"
    ];

let unrenderedLoopActive = false;