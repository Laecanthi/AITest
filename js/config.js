const canvas = document.getElementById("main-canvas");
const m_ctx = canvas.getContext("2d");

const networkCanv = document.getElementById("network-canvas");
const n_ctx = networkCanv.getContext("2d");

const memoryCanv = document.getElementById("memory-canvas");
const mem_ctx = memoryCanv.getContext("2d");
const outputCanv = document.getElementById("output-canvas");
const o_ctx = outputCanv.getContext("2d");
let memoryHistory = [];
let outputHistory = [];
let generationEvents = [];
let generationEventBools = [false, false, false, false, false, false];
//const MEMORY_HISTORY_LIMIT = 15000;

const linearMCanv = document.getElementById("linearM-canvas");
const lm_ctx = linearMCanv.getContext("2d");
const angularMCanv = document.getElementById("angularM-canvas");
const am_ctx = angularMCanv.getContext("2d");
let positionHistory = [];
let trajectory = [];
let trajectoryValue = [];
let linearMHistory = [];
let angularMHistory = [];

const instabilityCanv = document.getElementById("instability-canvas");
const ins_ctx = instabilityCanv.getContext("2d");
let instabilityHistory = [];

const conditionsCanv = document.getElementById("conditions-canvas");
const con_ctx = conditionsCanv.getContext("2d");
let conditionsHistory = [];

const genCanv = document.getElementById("generation-canvas");
const g_ctx = genCanv.getContext("2d");
var graphXScale;
var graphYScale;
var yShift;
var xShift;
var padding = 25;
var yMaxValue = 1000;
var xMinValue = 0;

const gradeCanv = document.getElementById("grade-canvas");
const grade_ctx = gradeCanv.getContext("2d");
let grade0History = [];
let grade1History = [];
let grade2History = [];
let grade3History = [];
let grade4History = [];

const pixelsPerMeter = 5;
//const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
//const lerp = (start, end, t) => start + (end - start) * t;

var agents = [];
var neuralNetworks = [];
var scores = [];
var grades = [];
const amountOfAgents = 300;

var time = 0;
var substepTime = 0;
var generation = 0;
var randomPosX = 0;
var randomPosY = 0;

var targetX = 80;
var groundY = -115;

var bestScore = []
var averageScore = []
var medianScore = []
var worstScore = []


    //SIMULATION VARIABLES

var simSpeed;
var simSubsteps;
var mutationRate = 0.05;
var generationLength = 5;
var generationSeed = 0;
var showOnlyLeader = false;
var nonLeaderOpacity = 0.1;
var renderSimulation = true;
let pendingRenderMode = null;
let stopAtGenerationEnd = false;
let runSingleGeneration = false;
let ignoreStops = false;

    let lastTime = 0;

var simPlay = false;
var simSpeed = 1;
var simSubsteps = 2;

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

var passRate = 0;
var highestPassRateDuringCurriculum = 0;
var curriculumCap = 0.999; //just below zero so that it can't start the next curriculum without increasing the cap
var capTimer = 50;

let obstacles = [];
var obsAmount = 15;
var obsDensity = 25;

let renderField = false;

const fieldOriginX = -100;
const fieldMaxX = 300;

const fieldOriginY = -200;
const fieldMaxY = 100;

const cellSize = 1.5;
const fieldWidth = Math.ceil(
        (fieldMaxX - fieldOriginX) / cellSize
    );
const fieldHeight = Math.ceil(
        (fieldMaxY - fieldOriginY) / cellSize
    );
//let flowField = [];
//let flatFlowField = null;
let distanceField = null;
var distanceFieldTexture = null;

var inputLabels =
    [
        "Relative FF Sine",
        "Relative FF Cosine",
        "Relative X Pos",
        "Relative Y Pos",
        "Sine of angle",
        "Cosine of angle",
        "X Vel",
        "Y Vel",
        "A Vel",
        "Fuel",
        "External Force X",
        "External Force Y",
        "External Force A",
        "Ray Forward",
        "Ray Motion",
        "Ray Down"
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