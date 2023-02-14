// Main entry point for the application


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

function setRectangle(gl, x, y, width, height) {
    var x1 = x;
    var x2 = x + width;
    var y1 = y;
    var y2 = y + height;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x1, y1,
        x2, y1,
        x1, y2,
        x1, y2,
        x2, y1,
        x2, y2,
    ]), gl.STATIC_DRAW);
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

setRectangle(gl, randomInt(300), randomInt(300), randomInt(300), randomInt(300));
    
    
// Tell WebGL how to convert from clip space to pixels
gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

function drawcanvas() {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height); 
    var positions = [
        10, 20,
        80, 20,
        10, 30,
        10, 30,
        80, 20,
        80, 30,
    ]
    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    gl.uniform4f(colorUniformLocation, 100, 100, 100, 1);
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
}

drawcanvas()
