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


