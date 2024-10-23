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
clearButton.textContent = 'Clear Canvas';
app.append(clearButton);

// Get the canvas context
const ctx = canvas.getContext('2d');

let isDrawing = false;
let lastX = 0;
let lastY = 0;

// Function to start drawing
function startDrawing(event: MouseEvent) {
    isDrawing = true;
    [lastX, lastY] = [event.offsetX, event.offsetY];
}

// Function to draw on the canvas
function draw(event: MouseEvent) {
    if (!isDrawing) return;
    
    ctx!.strokeStyle = 'black'; // Line color
    ctx!.lineWidth = 2; // Line width
    ctx!.beginPath();
    ctx!.moveTo(lastX, lastY);
    ctx!.lineTo(event.offsetX, event.offsetY);
    ctx!.stroke();
    [lastX, lastY] = [event.offsetX, event.offsetY];
}

// Function to stop drawing
function stopDrawing() {
    isDrawing = false;
    ctx!.beginPath(); // Reset the path
}

// Function to clear the canvas
function clearCanvas() {
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
}

// Event listeners
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);
clearButton.addEventListener('click', clearCanvas);


