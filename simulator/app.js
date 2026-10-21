/**
 * SPIKE Prime Browser Simulator - Milestone B
 * 
 * Scaled FLL table, mat placement, background calibration, robot placement,
 * movement test panel and simulated sensors (physics in physics.js).
 * 
 * Coordinate system:
 * - Origin at bottom-left table interior
 * - X increases right, Y increases up
 * - Heading zero points right (positive X), positive is counterclockwise
 * 
 * Table interior: 2362.2 mm × 1143 mm (supplied by the team)
 * Mat: 2019.3 mm × 1136.65 mm (supplied by the team)
 * 
 * No build step required. Serve the project folder and open /simulator/.
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const TABLE_INTERIOR_X = 2362.2; // mm
const TABLE_INTERIOR_Y = 1143;   // mm
const TABLE_ASPECT_RATIO = TABLE_INTERIOR_X / TABLE_INTERIOR_Y; // ~2.067

const MAT_WIDTH = 2019.3;        // mm
const MAT_HEIGHT = 1136.65;      // mm

// Default mat placement (centered on table)
const DEFAULT_MAT_X = 171.45;    // mm from left
const DEFAULT_MAT_Y = 3.175;     // mm from bottom

// BIOGLOW wireframe: page 2 of assets/bioglow-wireframe-grid.pdf rendered at 300 dpi.
// Crop = centres of the drawn mat border lines, measured from the PNG pixels (±1 px).
const BIOGLOW_IMAGE_URL = 'assets/bioglow-wireframe-page2-300dpi.png';
const BIOGLOW_CROP = { x: 166, y: 636, w: 2967, h: 1689 };

// Grid defaults
const DEFAULT_GRID_MINOR = 50;   // mm
const DEFAULT_GRID_MAJOR = 100;  // mm

// Robot defaults (example dimensions)
const DEFAULT_ROBOT_LENGTH = 180; // mm (forward/backward)
const DEFAULT_ROBOT_WIDTH = 150;  // mm (left/right)
const DEFAULT_ROBOT_X = 1181.1;   // mm (centered on table)
const DEFAULT_ROBOT_Y = 571.5;    // mm (centered on table)
const DEFAULT_ROBOT_HEADING = 0;  // degrees

// ============================================================================
// STATE
// ============================================================================

const state = {
    // View state
    zoom: 1.0,
    panX: 0, // pixels
    panY: 0, // pixels
    
    // Grid state
    gridVisible: true,
    gridMinorSpacing: DEFAULT_GRID_MINOR,
    gridMajorSpacing: DEFAULT_GRID_MAJOR,
    
    // Mat state
    matX: DEFAULT_MAT_X,
    matY: DEFAULT_MAT_Y,
    matRotation: 0, // degrees
    
    // Background state (crop is in image pixels, top-left origin)
    backgroundImage: null,
    bgDefaultCrop: null,
    bgVisible: true,
    bgOpacity: 0.7,
    bgCropX: 0,
    bgCropY: 0,
    bgCropWidth: 0,
    bgCropHeight: 0,
    bgOrientation: 0, // degrees: 0, 90, 180, 270
    
    // Robot state
    robotLength: DEFAULT_ROBOT_LENGTH,
    robotWidth: DEFAULT_ROBOT_WIDTH,
    robotX: DEFAULT_ROBOT_X,
    robotY: DEFAULT_ROBOT_Y,
    robotHeading: DEFAULT_ROBOT_HEADING,
    
    // Start pose (saved position)
    startPose: null,
    
    // Interaction state
    isDraggingRobot: false,
    dragStartX: 0,
    dragStartY: 0,
    dragRobotStartX: 0,
    dragRobotStartY: 0,
    
    // Cursor position
    cursorX: 0,
    cursorY: 0,
    
    // Traveled path (points live in the simulation)
    pathVisible: true,
};

// ============================================================================
// DOM REFERENCES
// ============================================================================

const canvas = document.getElementById('simulator');
const ctx = canvas.getContext('2d');
const container = document.getElementById('canvas-container');

// Control elements
const btnFitView = document.getElementById('btn-fit-view');
const btnToggleGrid = document.getElementById('btn-toggle-grid');
const zoomSlider = document.getElementById('zoom-slider');
const zoomValue = document.getElementById('zoom-value');

const matXInput = document.getElementById('mat-x');
const matYInput = document.getElementById('mat-y');
const matRotationInput = document.getElementById('mat-rotation');
const matWarning = document.getElementById('mat-warning');

const bgFileInput = document.getElementById('bg-file');
const btnLoadBioglow = document.getElementById('btn-load-bioglow');
const btnRemoveBg = document.getElementById('btn-remove-bg');
const btnResetCrop = document.getElementById('btn-reset-crop');
const bgSettings = document.getElementById('bg-settings');
const bgSource = document.getElementById('bg-source');
const bgPreview = document.getElementById('bg-preview');
const bgShowInput = document.getElementById('bg-show');
const bgOpacityInput = document.getElementById('bg-opacity');
const bgOpacityValue = document.getElementById('bg-opacity-value');
const bgCropXInput = document.getElementById('bg-crop-x');
const bgCropYInput = document.getElementById('bg-crop-y');
const bgCropWInput = document.getElementById('bg-crop-w');
const bgCropHInput = document.getElementById('bg-crop-h');
const bgOrientationInput = document.getElementById('bg-orientation');
const aspectCheck = document.getElementById('aspect-check');

const robotLengthInput = document.getElementById('robot-length');
const robotWidthInput = document.getElementById('robot-width');
const robotXInput = document.getElementById('robot-x');
const robotYInput = document.getElementById('robot-y');
const robotHeadingInput = document.getElementById('robot-heading');
const btnSavePose = document.getElementById('btn-save-pose');
const btnRotateLeft = document.getElementById('btn-rotate-left');
const btnRotateRight = document.getElementById('btn-rotate-right');
const btnResetPose = document.getElementById('btn-reset-pose');
const startPoseInfo = document.getElementById('start-pose-info');

const driveWheelDiameterInput = document.getElementById('drive-wheel-diameter');
const driveTrackWidthInput = document.getElementById('drive-track-width');
const driveGearRatioInput = document.getElementById('drive-gear-ratio');
const driveMaxSpeedInput = document.getElementById('drive-max-speed');
const driveLeftSignInput = document.getElementById('drive-left-sign');
const driveRightSignInput = document.getElementById('drive-right-sign');
const driveErrors = document.getElementById('drive-errors');

const testLeftInput = document.getElementById('test-left');
const testRightInput = document.getElementById('test-right');
const testDurationInput = document.getElementById('test-duration');
const testPlaybackInput = document.getElementById('test-playback');
const btnTestStart = document.getElementById('btn-test-start');
const btnTestStop = document.getElementById('btn-test-stop');
const btnTestPause = document.getElementById('btn-test-pause');
const btnTestStep = document.getElementById('btn-test-step');
const btnSimReset = document.getElementById('btn-sim-reset');
const btnGyroReset = document.getElementById('btn-gyro-reset');
const pathShowInput = document.getElementById('path-show');
const btnPathClear = document.getElementById('btn-path-clear');
const telStatus = document.getElementById('tel-status');
const telTime = document.getElementById('tel-time');
const telX = document.getElementById('tel-x');
const telY = document.getElementById('tel-y');
const telHeading = document.getElementById('tel-heading');
const telGyro = document.getElementById('tel-gyro');
const telEncLeft = document.getElementById('tel-enc-left');
const telEncRight = document.getElementById('tel-enc-right');
const telFault = document.getElementById('tel-fault');

const programFileInput = document.getElementById('program-file');
const programInfo = document.getElementById('program-info');
const programMoveModeInput = document.getElementById('program-move-mode');
const btnProgramRun = document.getElementById('btn-program-run');
const btnProgramNext = document.getElementById('btn-program-next');
const programNow = document.getElementById('program-now');
const programList = document.getElementById('program-list');
const programNotes = document.getElementById('program-notes');
const progYaw = document.getElementById('prog-yaw');
const progPosB = document.getElementById('prog-pos-b');
const progPosA = document.getElementById('prog-pos-a');
const progAttach = document.getElementById('prog-attach');

const gridMinorInput = document.getElementById('grid-minor');
const gridMajorInput = document.getElementById('grid-major');

const cursorXmm = document.getElementById('cursor-x-mm');
const cursorYmm = document.getElementById('cursor-y-mm');
const cursorXcm = document.getElementById('cursor-x-cm');
const cursorYcm = document.getElementById('cursor-y-cm');

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert degrees to radians
 */
function degToRad(deg) {
    return deg * Math.PI / 180;
}

/**
 * Convert radians to degrees
 */
function radToDeg(rad) {
    return rad * 180 / Math.PI;
}

/**
 * Convert millimeters to centimeters
 */
function mmToCm(mm) {
    return mm / 10;
}

/**
 * Convert world coordinates to screen coordinates
 */
function worldToScreen(wx, wy) {
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Scale factor (pixels per mm)
    const scale = state.zoom * getBaseScale();
    
    // Transform to screen coordinates
    const sx = state.panX + wx * scale;
    const sy = canvasHeight - state.panY - wy * scale;
    
    return [sx, sy];
}

/**
 * Convert screen coordinates to world coordinates
 */
function screenToWorld(sx, sy) {
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Scale factor (pixels per mm)
    const scale = state.zoom * getBaseScale();
    
    // Transform to world coordinates
    const wx = (sx - state.panX) / scale;
    const wy = (canvasHeight - state.panY - sy) / scale;
    
    return [wx, wy];
}

/**
 * Get base scale (pixels per mm) for current canvas size
 */
function getBaseScale() {
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Fit table to canvas while maintaining aspect ratio
    const scaleX = canvasWidth / TABLE_INTERIOR_X;
    const scaleY = canvasHeight / TABLE_INTERIOR_Y;
    const baseScale = Math.min(scaleX, scaleY);
    
    return baseScale;
}

/**
 * Check if mat extends outside table bounds
 */
function checkMatBounds() {
    const matLeft = state.matX;
    const matRight = state.matX + MAT_WIDTH;
    const matBottom = state.matY;
    const matTop = state.matY + MAT_HEIGHT;
    
    // For rotated mat, check all four corners
    const cos = Math.cos(degToRad(state.matRotation));
    const sin = Math.sin(degToRad(state.matRotation));
    
    const corners = [
        [0, 0],
        [MAT_WIDTH, 0],
        [MAT_WIDTH, MAT_HEIGHT],
        [0, MAT_HEIGHT]
    ];
    
    for (const [cx, cy] of corners) {
        // Apply rotation around mat center
        const centerX = MAT_WIDTH / 2;
        const centerY = MAT_HEIGHT / 2;
        const rx = cx - centerX;
        const ry = cy - centerY;
        
        const rotatedX = rx * cos - ry * sin;
        const rotatedY = rx * sin + ry * cos;
        
        const worldX = state.matX + centerX + rotatedX;
        const worldY = state.matY + centerY + rotatedY;
        
        if (worldX < 0 || worldX > TABLE_INTERIOR_X ||
            worldY < 0 || worldY > TABLE_INTERIOR_Y) {
            return true; // Outside bounds
        }
    }
    
    return false; // All corners inside
}

/**
 * Update mat warning display
 */
function updateMatWarning() {
    const outside = checkMatBounds();
    if (outside) {
        matWarning.classList.remove('hidden');
    } else {
        matWarning.classList.add('hidden');
    }
}

/**
 * Size (mm) of the cropped image when fitted inside the mat without stretching.
 */
function backgroundFitSize() {
    const sideways = state.bgOrientation % 180 !== 0;
    const w = sideways ? state.bgCropHeight : state.bgCropWidth;
    const h = sideways ? state.bgCropWidth : state.bgCropHeight;
    const scale = Math.min(MAT_WIDTH / w, MAT_HEIGHT / h);
    return [w * scale, h * scale];
}

/**
 * Check background aspect ratio against mat
 */
function checkBackgroundAspect() {
    if (!state.backgroundImage) return;
    
    const [fitW, fitH] = backgroundFitSize();
    const imgAspect = fitW / fitH;
    const matAspect = MAT_WIDTH / MAT_HEIGHT;
    const diffPct = Math.abs(imgAspect / matAspect - 1) * 100;
    
    if (diffPct < 0.1) {
        aspectCheck.textContent = '✓ Crop shape matches the mat';
        aspectCheck.className = 'info';
    } else {
        aspectCheck.textContent = `⚠ Crop shape ${imgAspect.toFixed(3)} vs mat ${matAspect.toFixed(3)} ` +
            `(${diffPct.toFixed(1)}% off). Not stretched: drawn ${fitW.toFixed(1)} × ${fitH.toFixed(1)} mm, centred on the mat.`;
        aspectCheck.className = 'warning';
    }
}

/**
 * Draw the whole image small, with the crop box in red
 */
function drawBackgroundPreview() {
    const img = state.backgroundImage;
    if (!img) return;
    const pctx = bgPreview.getContext('2d');
    const s = Math.min(bgPreview.width / img.naturalWidth, bgPreview.height / img.naturalHeight);
    pctx.clearRect(0, 0, bgPreview.width, bgPreview.height);
    pctx.drawImage(img, 0, 0, img.naturalWidth * s, img.naturalHeight * s);
    pctx.strokeStyle = '#e94560';
    pctx.lineWidth = 2;
    pctx.strokeRect(state.bgCropX * s, state.bgCropY * s, state.bgCropWidth * s, state.bgCropHeight * s);
}

// ============================================================================
// RENDERING
// ============================================================================

/**
 * Main render function
 */
function render() {
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Hand placement (inputs, drag, reset pose) only edits state; copy it into the simulation while stopped
    if (!SimPhysics.isActive(sim)) {
        const p = sim.pose;
        if (p.x !== state.robotX || p.y !== state.robotY || p.headingDeg !== state.robotHeading) movedByHand = true;
        SimPhysics.placeRobot(sim, poseFromState());
    }
    
    // Clear canvas
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw grid
    if (state.gridVisible) {
        drawGrid();
    }
    
    // Draw table boundary
    drawTableBoundary();
    
    // Draw background image if present
    if (state.backgroundImage && state.bgVisible) {
        drawBackground();
    }
    
    // Draw mat
    drawMat();
    
    // Draw traveled path
    if (state.pathVisible) drawPath();
    
    // Draw robot
    drawRobot();
    
    // Draw cursor crosshair
    drawCursor();
}

/**
 * Draw coordinate grid
 */
function drawGrid() {
    const scale = state.zoom * getBaseScale();
    
    // Minor grid lines
    ctx.strokeStyle = 'rgba(100, 100, 150, 0.2)';
    ctx.lineWidth = 0.5;
    
    for (let x = 0; x <= TABLE_INTERIOR_X; x += state.gridMinorSpacing) {
        const [sx] = worldToScreen(x, 0);
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, canvas.height);
        ctx.stroke();
    }
    
    for (let y = 0; y <= TABLE_INTERIOR_Y; y += state.gridMinorSpacing) {
        const [, sy] = worldToScreen(0, y);
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.lineTo(canvas.width, sy);
        ctx.stroke();
    }
    
    // Major grid lines
    ctx.strokeStyle = 'rgba(100, 100, 200, 0.4)';
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= TABLE_INTERIOR_X; x += state.gridMajorSpacing) {
        const [sx] = worldToScreen(x, 0);
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, canvas.height);
        ctx.stroke();
        
        // Labels (in cm)
        const cmValue = mmToCm(x);
        ctx.fillStyle = 'rgba(200, 200, 255, 0.6)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(cmValue.toFixed(0), sx, canvas.height - 5);
    }
    
    for (let y = 0; y <= TABLE_INTERIOR_Y; y += state.gridMajorSpacing) {
        const [, sy] = worldToScreen(0, y);
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.lineTo(canvas.width, sy);
        ctx.stroke();
        
        // Labels (in cm)
        const cmValue = mmToCm(y);
        ctx.fillStyle = 'rgba(200, 200, 255, 0.6)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(cmValue.toFixed(0), canvas.width - 5, sy + 3);
    }
}

/**
 * Draw table boundary
 */
function drawTableBoundary() {
    const [x1, y1] = worldToScreen(0, 0);
    const [x2, y2] = worldToScreen(TABLE_INTERIOR_X, TABLE_INTERIOR_Y);
    
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 3;
    ctx.strokeRect(x1, y2, x2 - x1, y1 - y2); // top-left is (x1, y2) because screen Y is inverted
    
    // Label
    ctx.fillStyle = '#e94560';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    const [labelX, labelY] = worldToScreen(TABLE_INTERIOR_X / 2, TABLE_INTERIOR_Y + 20);
    ctx.fillText(`Table: ${TABLE_INTERIOR_X.toFixed(1)} × ${TABLE_INTERIOR_Y.toFixed(1)} mm`, labelX, labelY);
}

/**
 * Draw background image
 */
function drawBackground() {
    if (!state.backgroundImage) return;
    
    ctx.save();
    ctx.globalAlpha = state.bgOpacity;
    
    // Same transform as drawMat so the image stays attached to the mat
    const [sx, sy] = worldToScreen(state.matX + MAT_WIDTH / 2, state.matY + MAT_HEIGHT / 2);
    ctx.translate(sx, sy);
    ctx.rotate(degToRad(state.matRotation));
    ctx.rotate(degToRad(state.bgOrientation));
    
    // Fit inside the mat, keeping the crop's shape; size in the image's own (unrotated) frame
    const scale = state.zoom * getBaseScale();
    let [fitW, fitH] = backgroundFitSize();
    if (state.bgOrientation % 180 !== 0) [fitW, fitH] = [fitH, fitW];
    const pixelWidth = fitW * scale;
    const pixelHeight = fitH * scale;
    
    ctx.drawImage(
        state.backgroundImage,
        state.bgCropX, state.bgCropY, state.bgCropWidth, state.bgCropHeight,
        -pixelWidth / 2, -pixelHeight / 2, pixelWidth, pixelHeight
    );
    
    ctx.restore();
}

/**
 * Draw mat outline
 */
function drawMat() {
    ctx.save();
    
    const centerX = state.matX + MAT_WIDTH / 2;
    const centerY = state.matY + MAT_HEIGHT / 2;
    
    const [sx, sy] = worldToScreen(centerX, centerY);
    
    ctx.translate(sx, sy);
    ctx.rotate(degToRad(state.matRotation));
    
    const scale = state.zoom * getBaseScale();
    const pixelWidth = MAT_WIDTH * scale;
    const pixelHeight = MAT_HEIGHT * scale;
    
    ctx.strokeStyle = '#00d2d3';
    ctx.lineWidth = 2;
    ctx.strokeRect(-pixelWidth / 2, -pixelHeight / 2, pixelWidth, pixelHeight);
    
    // Fill with semi-transparent color
    ctx.fillStyle = 'rgba(0, 210, 211, 0.1)';
    ctx.fillRect(-pixelWidth / 2, -pixelHeight / 2, pixelWidth, pixelHeight);
    
    ctx.restore();
}

/**
 * Draw robot
 */
function drawRobot() {
    ctx.save();
    
    const [sx, sy] = worldToScreen(state.robotX, state.robotY);
    
    ctx.translate(sx, sy);
    // World heading is counterclockwise-positive; screen Y points down, so rotate the other way
    ctx.rotate(-degToRad(state.robotHeading));
    
    const scale = state.zoom * getBaseScale();
    const pixelLength = state.robotLength * scale;
    const pixelWidth = state.robotWidth * scale;
    
    // Draw robot body
    ctx.fillStyle = 'rgba(233, 69, 96, 0.8)';
    ctx.fillRect(-pixelLength / 2, -pixelWidth / 2, pixelLength, pixelWidth);
    
    // Draw drive wheels, centred track width apart (wheel length = diameter)
    const wheelLength = sim.profile.wheelDiameterMm * scale;
    const wheelThickness = 12 * scale;
    const halfTrack = sim.profile.trackWidthMm / 2 * scale;
    if (Number.isFinite(wheelLength + halfTrack)) {
        ctx.fillStyle = '#222';
        for (const side of [-1, 1]) {
            ctx.fillRect(-wheelLength / 2, side * halfTrack - wheelThickness / 2, wheelLength, wheelThickness);
        }
    }
    
    // Draw forward direction marker
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(pixelLength / 2, 0);
    ctx.stroke();
    
    // Draw center point
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw heading label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('F', pixelLength / 2 + 15, 4);
    
    ctx.restore();
}

/**
 * Draw cursor crosshair and position
 */
function drawCursor() {
    const [sx, sy] = worldToScreen(state.cursorX, state.cursorY);
    
    // Crosshair
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    ctx.moveTo(sx, sy - 20);
    ctx.lineTo(sx, sy + 20);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(sx - 20, sy);
    ctx.lineTo(sx + 20, sy);
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    // Position label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`(${state.cursorX.toFixed(1)}, ${state.cursorY.toFixed(1)})`, sx + 25, sy - 10);
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Handle canvas mouse move
 */
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    
    const [wx, wy] = screenToWorld(sx, sy);
    state.cursorX = wx;
    state.cursorY = wy;
    
    // Update cursor display
    cursorXmm.textContent = `${wx.toFixed(1)} mm`;
    cursorYmm.textContent = `${wy.toFixed(1)} mm`;
    cursorXcm.textContent = `${mmToCm(wx).toFixed(2)} cm`;
    cursorYcm.textContent = `${mmToCm(wy).toFixed(2)} cm`;
    
    // Handle robot dragging
    if (state.isDraggingRobot) {
        const [newX, newY] = screenToWorld(sx, sy);
        state.robotX = state.dragRobotStartX + (newX - state.dragStartX);
        state.robotY = state.dragRobotStartY + (newY - state.dragStartY);
        
        // Update inputs
        robotXInput.value = state.robotX.toFixed(1);
        robotYInput.value = state.robotY.toFixed(1);
        
        render();
    }
});

/**
 * Handle canvas mouse down
 */
canvas.addEventListener('mousedown', (e) => {
    if (SimPhysics.isActive(sim)) return;  // no dragging during a test
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    
    const [wx, wy] = screenToWorld(sx, sy);
    
    // Check if clicking on robot
    const dx = wx - state.robotX;
    const dy = wy - state.robotY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < Math.max(state.robotLength, state.robotWidth) / 2) {
        state.isDraggingRobot = true;
        state.dragStartX = wx;
        state.dragStartY = wy;
        state.dragRobotStartX = state.robotX;
        state.dragRobotStartY = state.robotY;
        canvas.classList.add('dragging-robot');
    }
});

/**
 * Handle canvas mouse up
 */
canvas.addEventListener('mouseup', () => {
    state.isDraggingRobot = false;
    canvas.classList.remove('dragging-robot');
});

/**
 * Handle canvas mouse leave
 */
canvas.addEventListener('mouseleave', () => {
    state.isDraggingRobot = false;
    canvas.classList.remove('dragging-robot');
});

/**
 * Handle wheel for zoom
 */
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    state.zoom = Math.max(0.1, Math.min(3, state.zoom * zoomFactor));
    
    zoomSlider.value = (state.zoom * 100).toFixed(0);
    zoomValue.textContent = `${Math.round(state.zoom * 100)}%`;
    
    render();
});

/**
 * Fit to view
 */
btnFitView.addEventListener('click', () => {
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Calculate scale to fit table
    const scaleX = canvasWidth / TABLE_INTERIOR_X;
    const scaleY = canvasHeight / TABLE_INTERIOR_Y;
    const baseScale = Math.min(scaleX, scaleY);
    
    state.zoom = 1;
    state.panX = (canvasWidth - TABLE_INTERIOR_X * baseScale) / 2;
    state.panY = (canvasHeight - TABLE_INTERIOR_Y * baseScale) / 2;
    
    zoomSlider.value = '100';
    zoomValue.textContent = '100%';
    
    render();
});

/**
 * Toggle grid
 */
btnToggleGrid.addEventListener('click', () => {
    state.gridVisible = !state.gridVisible;
    btnToggleGrid.textContent = state.gridVisible ? 'Hide Grid' : 'Show Grid';
    render();
});

/**
 * Zoom slider
 */
zoomSlider.addEventListener('input', () => {
    state.zoom = parseInt(zoomSlider.value) / 100;
    zoomValue.textContent = `${zoomSlider.value}%`;
    render();
});

// ============================================================================
// MAT CONTROLS
// ============================================================================

matXInput.addEventListener('input', () => {
    state.matX = parseFloat(matXInput.value) || 0;
    updateMatWarning();
    render();
});

matYInput.addEventListener('input', () => {
    state.matY = parseFloat(matYInput.value) || 0;
    updateMatWarning();
    render();
});

matRotationInput.addEventListener('input', () => {
    state.matRotation = parseFloat(matRotationInput.value) || 0;
    updateMatWarning();
    render();
});

// ============================================================================
// BACKGROUND CONTROLS
// ============================================================================

/**
 * Show a loaded image as the background, cropped to defaultCrop (image px)
 */
function setBackground(img, label, defaultCrop) {
    state.backgroundImage = img;
    state.bgDefaultCrop = defaultCrop;
    bgSource.textContent = `${label} (${img.naturalWidth} × ${img.naturalHeight} px)`;
    bgSettings.classList.remove('hidden');
    btnRemoveBg.classList.remove('hidden');
    applyCrop(defaultCrop);
}

function applyCrop(crop) {
    state.bgCropX = crop.x;
    state.bgCropY = crop.y;
    state.bgCropWidth = crop.w;
    state.bgCropHeight = crop.h;
    bgCropXInput.value = crop.x;
    bgCropYInput.value = crop.y;
    bgCropWInput.value = crop.w;
    bgCropHInput.value = crop.h;
    onCropChanged();
}

function onCropChanged() {
    checkBackgroundAspect();
    drawBackgroundPreview();
    render();
}

/**
 * Read one crop input; an invalid number or one outside the image puts the old value back
 */
function readCropInput(input, key, min, max) {
    const v = parseFloat(input.value);
    if (Number.isFinite(v) && v >= min && v <= max) state[key] = v;
    input.value = state[key];
    onCropChanged();
}

bgFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            setBackground(img, `Uploaded: ${file.name}`, { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight });
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

function loadBioglow(isStartup) {
    const img = new Image();
    img.onload = () => {
        bgFileInput.value = '';
        setBackground(img, 'BIOGLOW wireframe, PDF page 2', BIOGLOW_CROP);
    };
    img.onerror = () => {
        const msg = `Could not load ${BIOGLOW_IMAGE_URL}. Serve the project folder (python3 -m http.server 8000) or upload an image instead.`;
        // No popup on page open; the upload button still works
        if (isStartup) console.warn(msg); else alert(msg);
    };
    img.src = BIOGLOW_IMAGE_URL;
}

btnLoadBioglow.addEventListener('click', () => loadBioglow(false));

btnRemoveBg.addEventListener('click', () => {
    state.backgroundImage = null;
    bgSettings.classList.add('hidden');
    btnRemoveBg.classList.add('hidden');
    bgFileInput.value = '';
    render();
});

btnResetCrop.addEventListener('click', () => {
    if (state.bgDefaultCrop) applyCrop(state.bgDefaultCrop);
});

bgShowInput.addEventListener('change', () => {
    state.bgVisible = bgShowInput.checked;
    render();
});

bgOpacityInput.addEventListener('input', () => {
    state.bgOpacity = parseInt(bgOpacityInput.value) / 100;
    bgOpacityValue.textContent = `${bgOpacityInput.value}%`;
    render();
});

bgCropXInput.addEventListener('change', () => {
    readCropInput(bgCropXInput, 'bgCropX', 0, state.backgroundImage.naturalWidth - state.bgCropWidth);
});

bgCropYInput.addEventListener('change', () => {
    readCropInput(bgCropYInput, 'bgCropY', 0, state.backgroundImage.naturalHeight - state.bgCropHeight);
});

bgCropWInput.addEventListener('change', () => {
    readCropInput(bgCropWInput, 'bgCropWidth', 1, state.backgroundImage.naturalWidth - state.bgCropX);
});

bgCropHInput.addEventListener('change', () => {
    readCropInput(bgCropHInput, 'bgCropHeight', 1, state.backgroundImage.naturalHeight - state.bgCropY);
});

bgOrientationInput.addEventListener('change', () => {
    state.bgOrientation = parseInt(bgOrientationInput.value);
    checkBackgroundAspect();
    render();
});

// ============================================================================
// ROBOT CONTROLS
// ============================================================================

robotLengthInput.addEventListener('input', () => {
    state.robotLength = parseFloat(robotLengthInput.value) || DEFAULT_ROBOT_LENGTH;
    render();
});

robotWidthInput.addEventListener('input', () => {
    state.robotWidth = parseFloat(robotWidthInput.value) || DEFAULT_ROBOT_WIDTH;
    render();
});

robotXInput.addEventListener('input', () => {
    state.robotX = parseFloat(robotXInput.value) || 0;
    render();
});

robotYInput.addEventListener('input', () => {
    state.robotY = parseFloat(robotYInput.value) || 0;
    render();
});

robotHeadingInput.addEventListener('input', () => {
    state.robotHeading = parseFloat(robotHeadingInput.value) || 0;
    render();
});

/** Turn the robot in place by exactly 90° (+ = left/counterclockwise, world convention) */
function rotateRobotBy(deg) {
    state.robotHeading += deg;
    robotHeadingInput.value = state.robotHeading.toFixed(1);
    render();
}

btnRotateLeft.addEventListener('click', () => rotateRobotBy(90));
btnRotateRight.addEventListener('click', () => rotateRobotBy(-90));

btnSavePose.addEventListener('click', () => {
    state.startPose = {
        x: state.robotX,
        y: state.robotY,
        heading: state.robotHeading
    };
    
    startPoseInfo.textContent = `Start pose saved: (${state.robotX.toFixed(1)}, ${state.robotY.toFixed(1)}, ${state.robotHeading.toFixed(1)}°)`;
    startPoseInfo.className = 'info';
});

btnResetPose.addEventListener('click', () => {
    if (state.startPose) {
        state.robotX = state.startPose.x;
        state.robotY = state.startPose.y;
        state.robotHeading = state.startPose.heading;
        
        robotXInput.value = state.robotX.toFixed(1);
        robotYInput.value = state.robotY.toFixed(1);
        robotHeadingInput.value = state.robotHeading.toFixed(1);
        
        render();
    } else {
        startPoseInfo.textContent = 'No start pose saved. Click "Save as Start Pose" first.';
        startPoseInfo.className = 'warning';
    }
});

// ============================================================================
// MOVEMENT TEST, SENSORS, PATH (physics lives in physics.js)
// ============================================================================

function poseFromState() {
    return { x: state.robotX, y: state.robotY, headingDeg: state.robotHeading };
}

function readProfile() {
    return {
        wheelDiameterMm: parseFloat(driveWheelDiameterInput.value),
        trackWidthMm: parseFloat(driveTrackWidthInput.value),
        gearRatio: parseFloat(driveGearRatioInput.value),
        maxMotorDegPerS: parseFloat(driveMaxSpeedInput.value),
        leftMotorSign: parseInt(driveLeftSignInput.value),
        rightMotorSign: parseInt(driveRightSignInput.value),
    };
}

const sim = SimPhysics.createSim(readProfile(), poseFromState());
const clock = { accumS: 0, playback: parseFloat(testPlaybackInput.value) };
let loopActive = false;
let lastFrameMs = null;
let pausedByHiddenTab = false;
let movedByHand = false;   // robot dragged/typed since the last run: Run program starts from there

function showDriveErrors(errors) {
    driveErrors.textContent = errors.join(' ');
    driveErrors.classList.toggle('hidden', errors.length === 0);
}

/** Lock settings and placement while a test is running or paused */
function updateLocks() {
    const active = SimPhysics.isActive(sim);
    document.querySelectorAll('#mat-controls input, #robot-controls input, #robot-controls button, #drive-settings input, #drive-settings select')
        .forEach((el) => { el.disabled = active; });
    [testLeftInput, testRightInput, testDurationInput, btnTestStart].forEach((el) => { el.disabled = active; });
    btnTestStop.disabled = !active;
    btnTestPause.disabled = !active;
    btnTestPause.textContent = sim.status === 'paused' ? 'Resume' : 'Pause';
    btnTestStep.disabled = sim.status !== 'paused';
    btnGyroReset.disabled = sim.status === 'running';
    programFileInput.disabled = active;
    programMoveModeInput.disabled = active;
    btnProgramRun.disabled = active || !loadedProgram;
    btnProgramNext.disabled = !loadedProgram || (active && !(sim.program && sim.status === 'paused'));
}

function updateTelemetry() {
    const { x, y, headingDeg } = sim.pose;
    telStatus.textContent = sim.status + (sim.status === 'paused' && pausedByHiddenTab ? ' (tab was hidden)' : '');
    telTime.textContent = `${sim.timeS.toFixed(3)} s`;
    telX.textContent = `${x.toFixed(1)} mm (${mmToCm(x).toFixed(2)} cm)`;
    telY.textContent = `${y.toFixed(1)} mm (${mmToCm(y).toFixed(2)} cm)`;
    telHeading.textContent = `${SimPhysics.normalizeHeading(headingDeg).toFixed(2)}° (CCW +)`;
    telGyro.textContent = `${SimPhysics.gyroDeg(sim).toFixed(2)}° (CCW +)`;
    telEncLeft.textContent = `${sim.encLeftDeg.toFixed(1)}°`;
    telEncRight.textContent = `${sim.encRightDeg.toFixed(1)}°`;
    telFault.textContent = sim.fault;
    telFault.classList.toggle('hidden', !sim.fault);
}

/** Copy the simulated pose back to the placement state/inputs, then refresh everything */
function afterSimChange() {
    state.robotX = sim.pose.x;
    state.robotY = sim.pose.y;
    state.robotHeading = sim.pose.headingDeg;
    robotXInput.value = state.robotX.toFixed(1);
    robotYInput.value = state.robotY.toFixed(1);
    robotHeadingInput.value = state.robotHeading.toFixed(1);
    updateTelemetry();
    updateLocks();
    updateProgramView();
    render();
}

function frame(nowMs) {
    if (sim.status !== 'running') {
        loopActive = false;
        return;
    }
    const realDtS = lastFrameMs === null ? 0 : (nowMs - lastFrameMs) / 1000;
    lastFrameMs = nowMs;
    SimPhysics.runFrame(sim, clock, realDtS);
    afterSimChange();
    requestAnimationFrame(frame);
}

function startLoop() {
    clock.accumS = 0;
    lastFrameMs = null;  // first frame after start/resume adds no time, so nothing jumps
    if (!loopActive) {
        loopActive = true;
        requestAnimationFrame(frame);
    }
}

function drawPath() {
    ctx.save();
    ctx.strokeStyle = '#feca57';
    ctx.lineWidth = 2;
    ctx.beginPath();
    let penDown = false;
    for (const pt of sim.path) {
        if (pt === null) { penDown = false; continue; }
        const [sx, sy] = worldToScreen(pt[0], pt[1]);
        if (penDown) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy);
        penDown = true;
    }
    ctx.stroke();
    ctx.restore();
}

function onDriveSettingChanged() {
    showDriveErrors(SimPhysics.setProfile(sim, readProfile()));
    render();
}

[driveWheelDiameterInput, driveTrackWidthInput, driveGearRatioInput, driveMaxSpeedInput].forEach((el) => {
    el.addEventListener('input', onDriveSettingChanged);
});
[driveLeftSignInput, driveRightSignInput].forEach((el) => el.addEventListener('change', onDriveSettingChanged));

btnTestStart.addEventListener('click', () => {
    SimPhysics.setProfile(sim, readProfile());
    SimPhysics.placeRobot(sim, poseFromState());
    if (!state.startPose) {
        btnSavePose.click();
        startPoseInfo.textContent += ' (saved automatically at first test)';
    }
    pausedByHiddenTab = false;
    movedByHand = false;
    const errors = SimPhysics.startTest(sim,
        parseFloat(testLeftInput.value), parseFloat(testRightInput.value), parseFloat(testDurationInput.value));
    afterSimChange();
    if (!errors.length) startLoop();
});

btnTestStop.addEventListener('click', () => {
    SimPhysics.stop(sim);
    afterSimChange();
});

btnTestPause.addEventListener('click', () => {
    if (sim.status === 'running') {
        SimPhysics.pause(sim);
    } else if (sim.status === 'paused') {
        pausedByHiddenTab = false;
        SimPhysics.resume(sim);
        startLoop();
    }
    afterSimChange();
});

btnTestStep.addEventListener('click', () => {
    SimPhysics.stepOnce(sim);
    afterSimChange();
});

btnSimReset.addEventListener('click', () => {
    const sp = state.startPose;
    SimPhysics.resetSim(sim, sp ? { x: sp.x, y: sp.y, headingDeg: sp.heading } : poseFromState());
    pausedByHiddenTab = false;
    movedByHand = false;
    lastRunner = null;
    stepPauseKeys = null;
    afterSimChange();
});

btnGyroReset.addEventListener('click', () => {
    SimPhysics.resetGyro(sim);
    afterSimChange();
});

testPlaybackInput.addEventListener('change', () => {
    clock.playback = parseFloat(testPlaybackInput.value);
});

pathShowInput.addEventListener('change', () => {
    state.pathVisible = pathShowInput.checked;
    render();
});

btnPathClear.addEventListener('click', () => {
    SimPhysics.clearPath(sim);
    render();
});

// ============================================================================
// PROGRAM (.llsp3): read-only import, run step by step (wordblocks.js)
// ============================================================================

let loadedProgram = null;   // compiled program
let lastRunner = null;      // runner of the current or last run (sensors, notes, highlight)
let stepPauseKeys = null;   // "Next block": pause when a main block not in this set starts
let programItemEls = [];    // [stack][item] -> <li>
let shownNotes = 0;

function renderProgramList() {
    programList.replaceChildren();
    programItemEls = loadedProgram.stacks.map((stack, s) => stack.items.map((item) => {
        const li = document.createElement('li');
        li.textContent = (loadedProgram.stacks.length > 1 ? `[stack ${s + 1}] ` : '') + item.label;
        programList.appendChild(li);
        return li;
    }));
}

function updateProgramView() {
    const r = lastRunner;
    programItemEls.forEach((els, s) => {
        const thread = r && r.threads[s];
        const at = thread ? (thread.done ? els.length : thread.topIndex) : -1;
        els.forEach((li, i) => {
            li.classList.toggle('active', i === at && sim.program === r);
            li.classList.toggle('done', i < at);
        });
    });
    const active = programList.querySelector('li.active');
    if (active && loopActive) active.scrollIntoView({ block: 'nearest' });
    programNow.textContent = r && sim.program === r
        ? 'Now: ' + r.threads.filter((t) => !t.done).map((t) => t.path.join(' › ')).join(' | ')
        : '';
    if (!r || !r.threads.length) {
        [progYaw, progPosB, progPosA, progAttach].forEach((el) => { el.textContent = '–'; });
        programNotes.replaceChildren();
        shownNotes = 0;
        return;
    }
    progYaw.textContent = `${r.wordYaw().toFixed(1)}°`;
    progPosB.textContent = `${r.portPosition('B')}° (left wheel, assumed)`;
    progPosA.textContent = `${r.portPosition('A')}° (right wheel, assumed)`;
    const attach = Object.entries(r.attachment);
    progAttach.textContent = attach.length ? attach.map(([p, deg]) => `${p} at ${deg.toFixed(0)}° (clockwise +, estimate)`).join(', ') : 'none moved';
    if (r.notes.length !== shownNotes) {
        programNotes.replaceChildren(...r.notes.map((n) => {
            const li = document.createElement('li');
            li.textContent = `NOTE at ${n.timeS.toFixed(2)} s: ${n.text}`;
            return li;
        }));
        shownNotes = r.notes.length;
    }
}

async function loadProgramFile(file) {
    if (SimPhysics.isActive(sim)) {
        programInfo.textContent = `Not opened ${file.name}: press Stop first, then drop the file again.`;
        programInfo.className = 'warning';
        return;
    }
    try {
        const { target, manifest } = await Llsp3.readLlsp3(new Uint8Array(await file.arrayBuffer()));
        const program = WordBlocks.compileProgram(target);
        if (!program.stacks.length) throw new Error('No "when program starts" stack with blocks under it.');
        loadedProgram = program;   // replace only after the whole file checked out
        lastRunner = null;
        renderProgramList();
        const extra = [];
        if (program.emptyStarts) extra.push(`${program.emptyStarts} empty start block(s)`);
        if (program.looseStacks) extra.push(`${program.looseStacks} loose stack(s), not run`);
        programInfo.textContent = `${file.name}${manifest && manifest.name ? ` ("${manifest.name}")` : ''}: ` +
            program.stacks.map((s) => `${s.items.length} blocks`).join(' + ') + (extra.length ? `; ${extra.join('; ')}` : '') +
            '. Place the robot, then click Run program.';
        programInfo.className = 'info';
    } catch (e) {
        programInfo.textContent = `Could not open ${file.name}: ${e.message} The previous program is still loaded.`;
        programInfo.className = 'warning';
    }
    afterSimChange();
}

programFileInput.addEventListener('change', async () => {
    const file = programFileInput.files[0];
    if (!file) return;
    await loadProgramFile(file);
    programFileInput.value = '';
});

// Drop a .llsp3 anywhere on the page. preventDefault stops the browser from opening the file instead.
let dragDepth = 0;
document.addEventListener('dragenter', (e) => {
    if (!e.dataTransfer || !Array.from(e.dataTransfer.types).includes('Files')) return;
    e.preventDefault();
    dragDepth++;
    document.body.classList.add('file-over');
});
document.addEventListener('dragover', (e) => {
    if (e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')) e.preventDefault();
});
document.addEventListener('dragleave', () => {
    dragDepth = Math.max(0, dragDepth - 1);
    if (!dragDepth) document.body.classList.remove('file-over');
});
document.addEventListener('drop', async (e) => {
    if (!e.dataTransfer || !e.dataTransfer.files.length) return;
    e.preventDefault();
    dragDepth = 0;
    document.body.classList.remove('file-over');
    const files = Array.from(e.dataTransfer.files);
    const file = files.find((f) => /\.llsp3$/i.test(f.name));
    if (!file) {
        programInfo.textContent = `Not opened ${files[0].name}: drop a .llsp3 file.`;
        programInfo.className = 'warning';
        return;
    }
    await loadProgramFile(file);
});

/** Reset to the saved start pose, then run the loaded program. stepMode pauses as soon as the first block starts. */
function runProgram(stepMode) {
    SimPhysics.setProfile(sim, readProfile());
    SimPhysics.placeRobot(sim, poseFromState());
    if (!state.startPose || movedByHand) {
        btnSavePose.click();
        startPoseInfo.textContent += ' (robot was placed by hand, so this is the new start)';
    }
    movedByHand = false;
    const sp = state.startPose;
    SimPhysics.resetSim(sim, { x: sp.x, y: sp.y, headingDeg: sp.heading });
    pausedByHiddenTab = false;
    stepPauseKeys = stepMode ? new Set() : null;
    const runner = WordBlocks.createRunner(loadedProgram, {
        plainMoveMode: programMoveModeInput.value,
        onTopBlock: (t, i) => {
            if (stepPauseKeys && !stepPauseKeys.has(`${t}:${i}`)) {
                stepPauseKeys = null;
                SimPhysics.pause(sim);
            }
        },
    });
    lastRunner = runner;
    const errors = SimPhysics.startProgram(sim, runner);
    afterSimChange();
    if (!errors.length) startLoop();
}

btnProgramRun.addEventListener('click', () => runProgram(false));

btnProgramNext.addEventListener('click', () => {
    if (sim.program && sim.status === 'paused') {
        stepPauseKeys = new Set(sim.program.threads.map((t) => `${t.index}:${t.topIndex}`));
        SimPhysics.resume(sim);
        afterSimChange();
        startLoop();
    } else if (!SimPhysics.isActive(sim) && loadedProgram) {
        runProgram(true);
    }
});

// Pause when the tab is hidden; the user resumes by hand, and resume adds no catch-up time
document.addEventListener('visibilitychange', () => {
    if (document.hidden && sim.status === 'running') {
        SimPhysics.pause(sim);
        pausedByHiddenTab = true;
        afterSimChange();
    }
});

// ============================================================================
// GRID CONTROLS
// ============================================================================

gridMinorInput.addEventListener('input', () => {
    state.gridMinorSpacing = parseFloat(gridMinorInput.value) || DEFAULT_GRID_MINOR;
    render();
});

gridMajorInput.addEventListener('input', () => {
    state.gridMajorSpacing = parseFloat(gridMajorInput.value) || DEFAULT_GRID_MAJOR;
    render();
});

// ============================================================================
// CANVAS RESIZE
// ============================================================================

function resizeCanvas() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    render();
}

window.addEventListener('resize', resizeCanvas);

// ============================================================================
// INITIALIZATION
// ============================================================================

function init() {
    // Resize canvas
    resizeCanvas();
    
    // Set initial button text
    btnToggleGrid.textContent = 'Hide Grid';
    
    // Initial render
    render();
    updateTelemetry();
    updateLocks();
    
    // Show the BIOGLOW wireframe by default
    loadBioglow(true);
}

// Start the application
init();
