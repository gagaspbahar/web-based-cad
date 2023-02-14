// Main entry point for the application
var lines = []
var squares = []
var rectangles = []
var polygon = []

var currentShape = "line"
var isDrawing = false
var temporaryLine = []

// Initialize the WebGL context
var canvas = document.querySelector('#gl-canvas');
var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
if (!gl) {
    alert('WebGL not available');
}


// Create, upload, and compile the shaders
var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

function randomInt(range) {
    return Math.floor(Math.random() * range);
}


// Link the two shaders above into a program
var program = createProgram(gl, vertexShader, fragmentShader);

var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
var colorUniformLocation = gl.getUniformLocation(program, "u_color");

var positionBuffer = gl.createBuffer();

gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

gl.viewport(0, 0, canvas.width, canvas.height);



var size = 2;          // 2 components per iteration
var type = gl.FLOAT;   // the data is 32bit floats
var normalize = false; // don't normalize the data
var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
var offset = 0;        // start at the beginning of the buffer
gl.vertexAttribPointer(
    positionAttributeLocation, size, type, normalize, stride, offset)  
    
gl.useProgram(program);
    
gl.enableVertexAttribArray(positionAttributeLocation);
    
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

// setRectangle(gl, randomInt(300), randomInt(300), randomInt(300), randomInt(300));


// Tell WebGL how to convert from clip space to pixels
gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

function drawcanvas() {
    var primitiveType;
    var offset;
    var count;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height); 
    

    // Draw the garis.
    if (lines.length != 0) {
        for (var i = 0; i < lines.length; i++) {
            render(gl.LINES, [lines[i].x1, lines[i].y1, lines[i].x2, lines[i].y2], [Math.random(), Math.random(), Math.random(), 1])
        }
    }

    // Draw the rectangle.

    if (rectangles.length != 0) {
        primitiveType = gl.TRIANGLES;
        offset = 0;
        count = 6;
        for (var i = 0; i < rectangles.length; i++) {
            createRectangle(gl, rectangles[i].x, rectangles[i].y, rectangles[i].width, rectangles[i].height)
            gl.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);
            gl.drawArrays(primitiveType, offset, count);
        }
    }

}

const radioButton = document.querySelectorAll('input[name="shape"]');
radioButton.forEach((radio) => {
    radio.addEventListener('change', (event) => {
        currentShape = event.target.value;
    });
})

const render = (type, vertices, color) => {
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.uniform4f(colorUniformLocation, color[0], color[1], color[2], 1);
    gl.drawArrays(type, 0, vertices.length / 2);
}

canvas.addEventListener("click", function (event) {
    var x = event.clientX;
    var y = event.clientY;
    if (!isDrawing) {
        if (currentShape == "line") {
            temporaryLine = {
                x1: x,
                y1: y,
            }
        }
    
        isDrawing = true
    } else {
        if (currentShape == "line") {
            temporaryLine = {
                x1: temporaryLine.x1,
                y1: temporaryLine.y1,
                x2: x,
                y2: y,
            }
            lines.push(temporaryLine)
            render(gl.LINES, [temporaryLine.x1, temporaryLine.y1, temporaryLine.x2, temporaryLine.y2], [Math.random(), Math.random(), Math.random()])   
        }
        isDrawing = false
    }

    // setRectangle(gl, x, y, 50, 50);
    // gl.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);
    // gl.drawArrays(gl.TRIANGLES, 0, 6);
    drawcanvas()
}, false)

canvas.addEventListener("mousemove", function (event) {
    drawcanvas()
    if (isDrawing) {
        let x2 = event.clientX;
        let y2 = event.clientY;
        if (currentShape == "line") {
            temporaryLine = {
                x1: temporaryLine.x1,
                y1: temporaryLine.y1,
                x2: x2,
                y2: y2,
            }
            render(gl.LINES, [temporaryLine.x1, temporaryLine.y1, temporaryLine.x2, temporaryLine.y2], [Math.random(), Math.random(), Math.random()])   
        }
    }
})

// drawcanvas()
