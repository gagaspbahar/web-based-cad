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

// Link the two shaders above into a program
var program = createProgram(gl, vertexShader, fragmentShader);
