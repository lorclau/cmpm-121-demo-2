// Define MarkerLine interface
interface MarkerLine {
    points: Array<{ x: number; y: number }>;
    thickness: number;
    color: string;
    drag(x: number, y: number): void;
    display(ctx: CanvasRenderingContext2D): void;
}

// Define ToolPreview interface
interface ToolPreview {
    x: number;
    y: number;
    thickness: number;
    draw(ctx: CanvasRenderingContext2D): void;
}

// Define Sticker interface
interface Sticker {
    x: number;
    y: number;
    drag(x: number, y: number): void;
    display(ctx: CanvasRenderingContext2D): void;
}

enum ColorMode {
    RGB,
    HSL
}

// Create a union type for lines and stickers
type Drawable = MarkerLine | Sticker;

// Function to create a new MarkerLine
function createMarkerLine(initialX: number, initialY: number, thickness: number, color: string): MarkerLine {
    const points = [{ x: initialX, y: initialY }];
    
    return {
        points,
        thickness,
        color,
        drag(x: number, y: number) {
            points.push({ x, y });
        },
        display(ctx: CanvasRenderingContext2D) {
            ctx.lineWidth = thickness; // Use the specified thickness
            ctx.strokeStyle = color; // Use the specified color
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
const title = document.querySelector<HTMLDivElement>("#title")!;
const uToolbar = document.querySelector<HTMLDivElement>("#upper-toolbar")!;
const app = document.querySelector<HTMLDivElement>("#app")!;
const lToolbar = document.querySelector<HTMLDivElement>("#lower-toolbar")!;

document.title = APP_NAME;

const colorUpdated : Event = new Event("color-updated");

const curColor : number[] = [0,1,0.5];
const colorSliders : HTMLInputElement[] = [];
const colorText : HTMLSpanElement[] = [];
let colorMode : ColorMode = ColorMode.HSL;

// Create the app title
const appTitle = document.createElement('h1');
appTitle.textContent = 'Scribbler';
title.append(appTitle);

// Create the canvas
const canvas = document.createElement('canvas');
canvas.width = 256;
canvas.height = 256;
app.append(canvas);

// Create a clear button
const clearButton = document.createElement('button');
clearButton.textContent = 'Clear';
uToolbar.append(clearButton);

// Create an undo and redo button
const undoButton = document.createElement('button');
undoButton.textContent = 'Undo';
uToolbar.append(undoButton);

const redoButton = document.createElement('button');
redoButton.textContent = 'Redo';
uToolbar.append(redoButton);

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
uToolbar.append(customStickerButton);

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

// Create export button
const exportButton = document.createElement('button');
exportButton.textContent = 'Export';
uToolbar.append(exportButton);

// Create a color preview box
const colorPreview = document.createElement('div');
colorPreview.style.width = '50px'; // Width of the preview box
colorPreview.style.height = '30px'; // Height of the preview box
colorPreview.style.border = '1px solid #000'; // Optional border for visibility
colorPreview.style.display = 'inline-block'; // Align it with the slider
colorPreview.style.marginLeft = '10px'; // Space between slider and preview
lToolbar.append(colorPreview);

const toggleColorButton = document.createElement('button');
toggleColorButton.innerHTML = "Toggle Color Mode";
toggleColorButton.addEventListener("click", () => {
    colorMode = 1 - colorMode;
    setSliderText();
    canvas.dispatchEvent(colorUpdated);
})
lToolbar.append(toggleColorButton);

function formatMarkerColor() : string{
    switch(colorMode) {
        case ColorMode.RGB:
            return `rgb(${curColor[0]*255}, ${curColor[1]*255}, ${curColor[2]*255})`
        case ColorMode.HSL:
            return `hsl(${curColor[0]*360}, ${curColor[1]*100}%, ${curColor[2]*100}%)`
    }
}

// Create color slider
function createSlider(index = 0) {
    const colorSlider = document.createElement('input');
    colorSliders[index] = colorSlider
    colorSlider.type = 'range';
    colorSlider.min = '0';
    colorSlider.max = `1`;
    colorSlider.step = `.001`
    colorSlider.value = `${curColor[index]}`; // Default hue value
    colorSlider.style.width = '200px'; // Adjust width as needed
    colorSlider.addEventListener('input', () => {
        curColor[index] = Number(colorSlider.value);
        canvas.dispatchEvent(colorUpdated);
        redraw(); // Redraw canvas to update color based on the selected hue
    });
    lToolbar.append(document.createElement("br"));
    colorText[index] = document.createElement("span");
    lToolbar.append(colorText[index]);
    lToolbar.append(colorSlider);
}

function setSliderText() {
    switch(colorMode) {
        case ColorMode.RGB:
            colorText[0].innerHTML = "R: ";
            colorText[1].innerHTML = "G: ";
            colorText[2].innerHTML = "B: ";
            break;
        case ColorMode.HSL:
            colorText[0].innerHTML = "H: ";
            colorText[1].innerHTML = "S: ";
            colorText[2].innerHTML = "L: ";
            break;
    }
}

canvas.addEventListener("color-updated", () => {
    colorPreview.style.backgroundColor = formatMarkerColor();
}) 

for (let i = 0; i < 3; i++) {
    createSlider(i);
}
setSliderText();

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
    const color = formatMarkerColor(); // Get current color
    currentLine = createMarkerLine(event.offsetX, event.offsetY, currentThickness, color);
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

// Export functionality
exportButton.addEventListener('click', () => {
    // Create a new canvas and context
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 1024;
    exportCanvas.height = 1024;
    const exportCtx = exportCanvas.getContext('2d');

    if (!exportCtx) return; // Safety check

    // Scale the context
    exportCtx.scale(4, 4); // Scale up by 4x

    // Redraw all lines to the new canvas using the same command objects
    lines.forEach(line => line.display(exportCtx)); // Use the same display method

    // Create a PNG file from the new canvas using anchor
    const anchor = document.createElement("a");
    anchor.href = exportCanvas.toDataURL("image/png");
    anchor.download = "sketchpad.png";
    anchor.click();
});

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

// Set UI defaults
setThickness(2, thinButton); // Set initial thickness and style feedback
colorPreview.style.backgroundColor =  formatMarkerColor(); // Initial color

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