// VERTEX SHADER
var vertexShaderSource = 
`    
attribute vec2 a_position;
uniform vec2 u_resolution;
attribute vec4 a_color;
varying vec4 v_color;

void main() {
    vec2 zeroToOne = a_position / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;
      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    v_color = a_color;
}`

// FRAGMENT SHADER
var fragmentShaderSource = 
    `
    precision mediump float;
    varying vec4 v_color;
    void main() {
      gl_FragColor = v_color;
    }`


    
// Create a shader object, upload the source and compile the shader.
function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
        alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

// Create the shader program.
function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log("Unable to initialize the shader program: " + gl.getProgramInfoLog(program));
        alert("Unable to initialize the shader program: " + gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    return program;
}