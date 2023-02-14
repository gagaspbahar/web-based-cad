// Main entry point for the application
var lines = []
var squares = []
var rectangles = []
var polygon = []


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

canvas.addEventListener("click", function (event) {
    var x = event.clientX;
    var y = event.clientY;
    setRectangle(gl, x, y, 50, 50);
    gl.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    // drawcanvas()
}, false)

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

setRectangle(gl, randomInt(300), randomInt(300), randomInt(300), randomInt(300));


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
        primitiveType = gl.LINES;
        offset = 0;
        count = 2;
        for (var i = 0; i < lines.length; i++) {
            createGaris(gl, lines[i].x, lines[i].y, lines[i].width, lines[i].height)
            gl.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);
            gl.drawArrays(primitiveType, offset, count);
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

// drawcanvas()
