// Define the MarkerLine interface
interface MarkerLine {
    points: Array<{ x: number; y: number }>;
    drag(x: number, y: number): void;
    display(ctx: CanvasRenderingContext2D): void;
}

// Function to create a new MarkerLine
function createMarkerLine(initialX: number, initialY: number): MarkerLine {
    const points = [{ x: initialX, y: initialY }];
    
    return {
        points,
        drag(x: number, y: number) {
            points.push({ x, y });
        },
        display(ctx: CanvasRenderingContext2D) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (const point of points) {
                ctx.lineTo(point.x, point.y);
            }
            ctx.stroke();
        }
    };
}

// Create app
import "./style.css";

const APP_NAME = "Sketchpad:";
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
let currentLine: MarkerLine | null = null;

//Arrays to hold lines and redo stack
const lines: MarkerLine[] = [];
const redoStack: MarkerLine[] = [];

// Function to start drawing
function startDrawing(event: MouseEvent) {
    isDrawing = true;
    currentLine = createMarkerLine(event.offsetX, event.offsetY); // Start a new line
}

// Function to draw on the canvas
function draw(event: MouseEvent) {
    if (!isDrawing || !currentLine) return;
    
    currentLine.drag(event.offsetX, event.offsetY); // Extend the current line
    redraw(); // Redraw the canvas
}

// Dispatch the "drawing-changed" event
function dispatchDrawingChanged() {
    const drawingChangedEvent = new Event('drawing-changed');
    canvas.dispatchEvent(drawingChangedEvent);
}

// Function to stop drawing
function stopDrawing() {
    if (currentLine) {
        lines.push(currentLine); // Save the current line
        currentLine = null; // Reset current line
        dispatchDrawingChanged();
    }
    isDrawing = false;
}

// Function to clear the canvas
function clearCanvas() {
    lines.length = 0; // Clear stored points
    redoStack.length = 0; // Clear redo stack
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
}

// Function to redraw the canvas
function redraw() {
    ctx!.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    ctx!.strokeStyle = 'black'; // Line color
    ctx!.lineWidth = 2; // Line width

    lines.forEach(line => line.display(ctx!)); // Display all lines
    if (currentLine) currentLine.display(ctx!); // Display the current line if drawing
}

// Function to undo the last drawing
function undo() {
    if (lines.length === 0) return; // Nothing to undo
    const lastLine = lines.pop();
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
        lines.push(lastRedoLine); // Add it back to the points
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


