// Define the MarkerLine interface
interface MarkerLine {
    points: Array<{ x: number; y: number }>;
    thickness: number; // Added thickness property
    drag(x: number, y: number): void;
    display(ctx: CanvasRenderingContext2D): void;
}

// Define the ToolPreview interface
interface ToolPreview {
    x: number;
    y: number;
    thickness: number;
    draw(ctx: CanvasRenderingContext2D): void;
}

// Sticker interface
interface Sticker {
    x: number;
    y: number;
    drag(x: number, y: number): void;
    display(ctx: CanvasRenderingContext2D): void;
}

// Create a union type for lines and stickers
type Drawable = MarkerLine | Sticker;

// Function to create a new MarkerLine
function createMarkerLine(initialX: number, initialY: number, thickness: number): MarkerLine {
    const points = [{ x: initialX, y: initialY }];
    
    return {
        points,
        thickness,
        drag(x: number, y: number) {
            points.push({ x, y });
        },
        display(ctx: CanvasRenderingContext2D) {
            ctx.lineWidth = thickness; // Use the specified thickness
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (const point of points) {
                ctx.lineTo(point.x, point.y);
            }
            ctx.stroke();
        }
    };
}

// Function to create a tool preview
function createToolPreview(thickness: number): ToolPreview {
    return {
        x: 0,
        y: 0,
        thickness,
        draw(ctx: CanvasRenderingContext2D) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent color for the preview
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.thickness, 0, Math.PI * 2); // Circle as the preview
            ctx.fill();
        }
    };
}

// Function to create a new Sticker
function createSticker(emoji: string): Sticker {
    return {
        x: 0,
        y: 0,
        display(ctx: CanvasRenderingContext2D) { 
            ctx.font = '30px Arial'; // Set font size
            ctx.fillStyle = 'rgba(0, 0, 0, 1)';
            ctx.fillText(emoji, this.x, this.y); // Draw emoji at current position
        },
        drag(x: number, y: number) {
            this.x = x;
            this.y = y; // Update position without history
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

// Create tool buttons
const thinButton = document.createElement('button');
thinButton.textContent = '•';
app.append(thinButton);

const thickButton = document.createElement('button');
thickButton.textContent = '●';
app.append(thickButton);

// Initial stickers defined in JSON format
const initialStickers: string[] = ['😊', '🐶', '🎉'];

// Emoji button listeners
initialStickers.forEach(emoji => {
    const button = document.createElement('button');
    button.textContent = emoji;
    app.append(button);
    
    button.addEventListener('click', () => {
        currentSticker = createSticker(emoji);
        dispatchToolMoved(); // Dispatch tool-moved event when an emoji is selected
    });
});

// Button for adding custom stickers
const customStickerButton = document.createElement('button');
customStickerButton.textContent = 'Add Custom Sticker';
app.append(customStickerButton);

// Event listener for custom sticker button
customStickerButton.addEventListener('click', () => {
    const newSticker = prompt("Enter a new sticker:", "✨");
    if (newSticker) {
        initialStickers.push(newSticker); // Add new sticker to the array
        const button = document.createElement('button');
        button.textContent = newSticker;
        app.append(button);
        
        // Event listener for the new sticker button
        button.addEventListener('click', () => {
            currentSticker = createSticker(newSticker);
            dispatchToolMoved(); // Dispatch tool-moved event when an emoji is selected
        });
    }
});

// Get the canvas context
const ctx = canvas.getContext('2d');

let isDrawing = false;
let currentLine: MarkerLine | null = null;
let currentThickness = 2; // Default thickness
let toolPreview: ToolPreview | null = createToolPreview(currentThickness); // Initialize tool preview
let currentSticker: Sticker | null = null; // For emoji stickers

//Arrays to hold lines and redo stack
const lines: Drawable[] = [];
const redoStack: Drawable[] = [];

// Function to start drawing
function startDrawing(event: MouseEvent) {
    isDrawing = true;
    currentLine = createMarkerLine(event.offsetX, event.offsetY, currentThickness); // Start a new line
}

// Function to draw on the canvas
function draw(event: MouseEvent) {
    if (!isDrawing || !currentLine) return;
    
    currentLine.drag(event.offsetX, event.offsetY); // Extend the current line
    toolPreview!.x = event.offsetX; // Update tool preview position
    toolPreview!.y = event.offsetY; // Update tool preview position
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

    lines.forEach(line => line.display(ctx!)); // Display all lines
    if (currentLine) currentLine.display(ctx!); // Display the current line if drawing
    if (toolPreview) toolPreview.draw(ctx!); // Draw the tool preview if visible
    if (currentSticker) currentSticker.display(ctx!); // Display the current sticker if selected
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

// Function to set the current thickness and style feedback
function setThickness(thickness: number, selectedButton: HTMLButtonElement) {
    currentThickness = thickness;
    toolPreview = createToolPreview(thickness); // Update tool preview thickness
    thinButton.classList.remove('selectedTool');
    thickButton.classList.remove('selectedTool');
    selectedButton.classList.add('selectedTool');
}

// Event listeners
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', (event) => {
    if (isDrawing) {
        draw(event); // Update drawing and preview while the mouse is down
    } else {
        if (currentSticker) {
            currentSticker.drag(event.offsetX, event.offsetY); // Update sticker position
        } else {
            toolPreview!.x = event.offsetX; // Update tool preview position
            toolPreview!.y = event.offsetY; // Update tool preview position
        }
        dispatchToolMoved(); // Dispatch tool-moved event
        redraw(); // Redraw the canvas to show the preview
    }
});
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);
clearButton.addEventListener('click', clearCanvas);
undoButton.addEventListener('click', undo);
redoButton.addEventListener('click', redo);
canvas.addEventListener('drawing-changed', redraw);

// Tool button listeners
thinButton.addEventListener('click', () => setThickness(2, thinButton)); // Set thickness to 2 for thin marker
thickButton.addEventListener('click', () => setThickness(5, thickButton)); // Set thickness to 5 for thick marker

// Set the thin marker as the default tool on load
setThickness(2, thinButton); // Set initial thickness and style feedback

// Handle canvas click to place sticker
canvas.addEventListener('click', () => {
    if (currentSticker) {
        lines.push(currentSticker); // Place sticker in lines for drawing
        currentSticker = null; // Reset current sticker
        dispatchDrawingChanged(); // Trigger a redraw
    }
});

// Dispatch tool-moved event
function dispatchToolMoved() {
    const toolMovedEvent = new Event('tool-moved');
    canvas.dispatchEvent(toolMovedEvent);
}