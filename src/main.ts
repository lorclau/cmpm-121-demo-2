import "./style.css";

const APP_NAME = "Sketchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = APP_NAME;

// Create the app title
const appTitle = document.createElement('h1');
appTitle.textContent = 'Scribbler';
app.append(appTitle);

// Create the canvas
const canvas = document.createElement('canvas');
canvas.width = 256;
canvas.height = 256;
app.append(canvas);

// Create a clear button
const clearButton = document.createElement('button');
clearButton.textContent = 'Clear';
app.append(clearButton);

// Create an undo and redo button
const undoButton = document.createElement('button');
undoButton.textContent = 'Undo';
app.append(undoButton);

const redoButton = document.createElement('button');
redoButton.textContent = 'Redo';
app.append(redoButton);

// Get the canvas context
const ctx = canvas.getContext('2d');

let isDrawing = false;
// deno-lint-ignore no-unused-vars
let lastX = 0;
// deno-lint-ignore no-unused-vars
let lastY = 0;

//Array to hold the points and array for redos
const points: Array<Array<{ x: number; y: number }>> = [];
const redoStack: Array<Array<{ x: number; y: number }>> = [];

// Function to start drawing
function startDrawing(event: MouseEvent) {
    isDrawing = true;
    points.push([]); // Start a new line
    [lastX, lastY] = [event.offsetX, event.offsetY];
}

// Function to draw on the canvas
function draw(event: MouseEvent) {
    if (!isDrawing) return;
    
    const newPoint = { x: event.offsetX, y: event.offsetY };
    points[points.length - 1].push(newPoint); // Add new point to the current line
    dispatchDrawingChanged();
    
    // Move the lastX and lastY
    [lastX, lastY] = [newPoint.x, newPoint.y];
}

// Dispatch the "drawing-changed" event
function dispatchDrawingChanged() {
    const drawingChangedEvent = new Event('drawing-changed');
    canvas.dispatchEvent(drawingChangedEvent);
}

// Function to stop drawing
function stopDrawing() {
    isDrawing = false;
    ctx!.beginPath(); // Reset the path
}

// Function to clear the canvas
function clearCanvas() {
    points.length = 0; // Clear stored points
    redoStack.length = 0; // Clear redo stack
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
}

// Function to redraw the canvas
function redraw() {
    ctx!.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    ctx!.strokeStyle = 'black'; // Line color
    ctx!.lineWidth = 2; // Line width

    points.forEach(line => {
        ctx!.beginPath();
        line.forEach((point, index) => {
            if (index === 0) {
                ctx!.moveTo(point.x, point.y);
            } else {
                ctx!.lineTo(point.x, point.y);
            }
        });
        ctx!.stroke();
    });
}

// Function to undo the last drawing
function undo() {
    if (points.length === 0) return; // Nothing to undo
    const lastLine = points.pop();
    if (lastLine) {
        redoStack.push(lastLine); // Add the line to the redo stack
        dispatchDrawingChanged(); // Trigger a redraw
    }
}

// Function to redo the last undone drawing
function redo() {
    if (redoStack.length === 0) return; // Nothing to redo
    const lastRedoLine = redoStack.pop();
    if (lastRedoLine) {
        points.push(lastRedoLine); // Add it back to the points
        dispatchDrawingChanged(); // Trigger a redraw
    }
}

// Event listeners
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);
clearButton.addEventListener('click', clearCanvas);
undoButton.addEventListener('click', undo);
redoButton.addEventListener('click', redo);
canvas.addEventListener('drawing-changed', redraw);


