import "./style.css";

const APP_NAME = "Scribbler";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = APP_NAME;

// Create the app title
const appTitle = document.createElement('h1');
appTitle.textContent = 'The Scribble App';
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

// Get the canvas context
const ctx = canvas.getContext('2d');

let isDrawing = false;
// deno-lint-ignore no-unused-vars
let lastX = 0;
// deno-lint-ignore no-unused-vars
let lastY = 0;

//Array to hold the points
const points: Array<Array<{ x: number; y: number }>> = [];

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

// Event listeners
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);
clearButton.addEventListener('click', clearCanvas);
canvas.addEventListener('drawing-changed', redraw);


