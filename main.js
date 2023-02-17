// Main entry point for the application
// Type for shape
// const shape = {
//     type: "line",
//     id: 0,
//     vertices: [],
// }

var shapes = [];

var currentAction = "create";
var currentShape = "line";
var selectedShapeId = 0;
var selectedVertex = [];
var translationMode = "x";

var isDrawing = false;
var temporaryLine = [];
var sliderValue = 0;

// Initialize the WebGL context
var canvas = document.querySelector("#gl-canvas");
var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
if (!gl) {
  alert("WebGL not available");
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
var rotationUniformLocation = gl.getUniformLocation(program, "u_rotation");

var positionBuffer = gl.createBuffer();

gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

gl.viewport(0, 0, canvas.width, canvas.height);

var size = 2; // 2 components per iteration
var type = gl.FLOAT; // the data is 32bit floats
var normalize = false; // don't normalize the data
var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
var offset = 0; // start at the beginning of the buffer
gl.vertexAttribPointer(
  positionAttributeLocation,
  size,
  type,
  normalize,
  stride,
  offset
);

gl.useProgram(program);

gl.enableVertexAttribArray(positionAttributeLocation);

gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

// Tell WebGL how to convert from clip space to pixels
gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

function drawcanvas() {
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

  for (var i = 0; i < shapes.length; i++) {
    if (shapes[i].type == "line") {
      render(gl.LINES, shapes[i].vertices, [
        Math.random(),
        Math.random(),
        Math.random(),
        1,
      ]);
      renderCornerPoint(shapes[i].vertices);
    } else if (shapes[i].type == "polygon") {
      render(gl.TRIANGLE_FAN, shapes[i].vertices, [
        Math.random(),
        Math.random(),
        Math.random(),
        1,
      ]);
      renderCornerPoint(shapes[i].vertices);
    }
  }
}

const rangeSlider = document.querySelector('input[name="input-slider"]');
rangeSlider.addEventListener("input", (event) => {
  sliderValue = event.target.value;
  if (currentAction == "translation") {
    execTranslation();
  } else if (currentAction == "rotation") {
    execRotation();
  }
  drawcanvas();
});

const transformationRadioButton = document.querySelectorAll(
  'input[name="transformation"]'
);

transformationRadioButton.forEach((radio) => {
  radio.addEventListener("change", (event) => {
    currentAction = event.target.value;
    if (event.target.value == "translation") {
      rangeSlider.value = 50;
      sliderValue = 50;
    } else if (event.target.value == "rotation") {
      rangeSlider.value = 0;
      sliderValue = 0;
    }
  });
});

const getIndexById = (id) => {
  for (var i = 0; i < shapes.length; i++) {
    if (shapes[i].id == id) {
      return i;
    }
  }
};

const changeTranslationMode = () => {
  const elmt = document.getElementById("input-slider-label");
  if (translationMode === "x") {
    translationMode = "y";
    elmt.innerHTML = "Y";
  } else {
    translationMode = "x";
    elmt.innerHTML = "X";
  }
};

const execTranslation = () => {
  if (currentAction == "translation") {
    var idx = getIndexById(selectedShapeId);
    var x = 0;
    if (translationMode == "x") {
      x = scaleCanvasFrom100X(sliderValue) - shapes[idx].vertices[0];
    } else {
      x = scaleCanvasFrom100Y(sliderValue) - shapes[idx].vertices[1];
    }
    for (var i = 0; i < shapes[idx].vertices.length; i += 2) {
      if (translationMode == "x") {
        shapes[idx].vertices[i] += x;
      } else {
        shapes[idx].vertices[i + 1] += x;
      }
    }
  }
};

const execRotation = () => {
  if (currentAction == "rotation") {
    var idx = getIndexById(selectedShapeId);
    var deg = scaleDegreeFrom100(sliderValue);
    var rad = angleInEighthRadians(deg);
    var center = calculateMidPoint(shapes[idx].vertices);
    for (var i = 0; i < shapes[idx].vertices.length; i += 2) {
      var x1 = shapes[idx].vertices[i];
      var y1 = shapes[idx].vertices[i + 1];
      var x2 = x1 - center[0];
      var y2 = y1 - center[1];
      var x3 = x2 * Math.cos(rad) - y2 * Math.sin(rad);
      var y3 = x2 * Math.sin(rad) + y2 * Math.cos(rad);
      shapes[idx].vertices[i] = x3 + center[0];
      shapes[idx].vertices[i + 1] = y3 + center[1];
    }
  }
};

const calculateMidPoint = (vertices) => {
  var x = 0;
  var y = 0;
  for (var i = 0; i < vertices.length; i += 2) {
    x += vertices[i];
    y += vertices[i + 1];
  }
  return [x / (vertices.length / 2), y / (vertices.length / 2)];
};

const scaleDegreeFrom100 = (x) => {
  return (x * 360) / 100;
};

const angleInEighthRadians = (x) => {
  return (x * Math.PI) / (180 * 8);
};

const scale100FromCanvasX = (x) => {
  return (x * 100) / canvas.width;
};

const scaleCanvasFrom100X = (x) => {
  return (x * canvas.width) / 100;
};

const scale100FromCanvasY = (y) => {
  return (y * 100) / canvas.height;
};

const scaleCanvasFrom100Y = (y) => {
  return (y * canvas.height) / 100;
};

const radioButton = document.querySelectorAll('input[name="shape"]');
radioButton.forEach((radio) => {
  radio.addEventListener("change", (event) => {
    currentShape = event.target.value;
  });
});

const render = (type, vertices, color) => {
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.uniform4f(colorUniformLocation, color[0], color[1], color[2], 1);
  //   gl.uniform2f(rotationUniformLocation, rotation[0], rotation[1]);
  gl.drawArrays(type, 0, vertices.length / 2);
};

const renderCornerPoint = (shape) => {
  const points = shape.length / 2;
  for (var i = 0; i < points; i++) {
    let x1 = shape[i * 2];
    let y1 = shape[i * 2 + 1];
    let x2 = shape[i * 2] + 5;
    let y2 = shape[i * 2 + 1] + 5;
    let vertices = [x1, y1, x2, y1, x1, y2, x2, y2];
    render(gl.TRIANGLE_STRIP, vertices, [0, 0, 0, 1]);
  }
};

const distance = (x1, y1, x2, y2) => {
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
};

const findNearestPoint = (x, y) => {
  var min = 1000000;
  var index = 0;
  var vertex = [];
  for (var i = 0; i < shapes.length; i++) {
    for (var j = 0; j < shapes[i].vertices.length; j += 2) {
      var dist = distance(
        x,
        y,
        shapes[i].vertices[j],
        shapes[i].vertices[j + 1]
      );
      if (dist < min) {
        min = dist;
        vertex = [shapes[i].vertices[j], shapes[i].vertices[j + 1]];
        index = shapes[i].id;
      }
    }
  }
  return {
    vertex: vertex,
    index: index,
  };
};

const canvasX = (x) => {
  const rect = canvas.getBoundingClientRect();
  let newX = x - rect.left;
  newX = (newX / (rect.right - rect.left)) * canvas.width;
  return newX;
};

const canvasY = (y) => {
  const rect = canvas.getBoundingClientRect();
  let newY = y - rect.top;
  newY = (newY / (rect.bottom - rect.top)) * canvas.height;
  return newY;
};

canvas.addEventListener(
  "mousedown",
  function (event) {
    var x = canvasX(event.clientX);
    var y = canvasY(event.clientY);

    // Rightclick
    if (event.button == 2) {;
      if (isDrawing && currentShape == "polygon") {
        temporaryLine = [];
        isDrawing == false;
      }
    } else {
        // leftclick
      if (currentAction === "translation") {
        const nearestPoint = findNearestPoint(x, y);
        if (nearestPoint.index != 0) {
          selectedShapeId = nearestPoint.index;
          selectedVertex = nearestPoint.vertex;
          if (translationMode === "x") {
            rangeSlider.value = scale100FromCanvasX(selectedVertex[0]);
          } else {
            rangeSlider.value = scale100FromCanvasY(selectedVertex[1]);
          }
        }
      }

      if (currentAction === "create") {
        if (!isDrawing) {
          if (currentShape == "line" || currentShape == "polygon") {
            temporaryLine.push(x);
            temporaryLine.push(y);
          }
          isDrawing = true;
        } else {
          if (currentShape == "line") {
            temporaryLine.push(x);
            temporaryLine.push(y);
            shapes.push({
              type: "line",
              id: shapes.length + 1,
              vertices: temporaryLine,
            });
            render(gl.LINES, temporaryLine, [
              Math.random(),
              Math.random(),
              Math.random(),
            ]);

            renderCornerPoint(temporaryLine);
            temporaryLine = [];
            isDrawing = false;
          }

          if (currentShape == "polygon") {
            temporaryLine.push(x);
            temporaryLine.push(y);
            shapes.push({
              type: "polygon",
              id: shapes.length + 1,
              vertices: temporaryLine,
            });
            render(gl.TRIANGLE_FAN, temporaryLine, [
              Math.random(),
              Math.random(),
              Math.random(),
            ]);
            renderCornerPoint(temporaryLine);
          }
        }
      }
    }

    drawcanvas();
  },
  false
);

canvas.addEventListener("mousemove", function (event) {
  drawcanvas();
  if (isDrawing) {
    let x2 = canvasX(event.clientX);
    let y2 = canvasY(event.clientY);
    if (currentShape == "line") {
      temporaryLine = [temporaryLine[0], temporaryLine[1], x2, y2];
      render(gl.LINES, temporaryLine, [
        Math.random(),
        Math.random(),
        Math.random(),
      ]);
    }
  }
});

const clearCanvas = () => {
  shapes = [];
  drawcanvas();
};

// drawcanvas()
