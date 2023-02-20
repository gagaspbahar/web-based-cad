// Main entry point for the application
// Type for shape
// const shape = {
//     type: "line",
//     id: 0,
//     vertices: [],
// }

var shapes = [];
var colorRgb = [];

var currentAction = "create";
var currentShape = "line";
var selectedShapeId = 0;
var selectedVertex = [];
var selectedShapeId2 = 0;
var selectedVertex2 = [];
var translationMode = "x";

var isDrawing = false;
var temporaryLine = [];
var sliderValue = 0;
var unionSelected = false;
var intersectionSelected = false;

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
      render(gl.LINES, shapes[i].vertices, shapes[i].color);
      renderCornerPoint(shapes[i].vertices);
    } else if (shapes[i].type == "square") {
      render(gl.TRIANGLE_STRIP, shapes[i].vertices, shapes[i].color);
      renderCornerPoint(shapes[i].vertices);
    } else if (shapes[i].type == "polygon" || shapes[i].type == "rectangle") {
      render(gl.TRIANGLE_FAN, shapes[i].vertices, shapes[i].color);
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

// Change Color
const setHexToRgb = (hex) => {

  colorRgb[0] = parseInt(hex[1] + hex[2], 16) / 255;
  colorRgb[1] = parseInt(hex[3] + hex[4], 16) / 255;
  colorRgb[2] = parseInt(hex[5] + hex[6], 16) / 255;
  colorRgb[3] = 1;
}

const setShapeColor = () => {
  const colorInput = document.getElementById("color").value;
  setHexToRgb(colorInput);
}


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

const execChangeColor = () => {
  if (currentAction == "change-color") {
    var idx = getIndexById(selectedShapeId);
    console.log(shapes[idx]);
    setShapeColor();
    shapes[idx].color = colorRgb;
    colorRgb = [];
  }
}

function sortVerticesCounterClockwise(vertices) {
  // Get the centroid of the polygon
  let cx = 0, cy = 0;
  for (let i = 0; i < vertices.length; i += 2) {
    cx += vertices[i];
    cy += vertices[i + 1];
  }
  cx /= vertices.length / 2;
  cy /= vertices.length / 2;

  // Sort the vertices in counter-clockwise order
  const sortedVertices = [];
  for (let i = 0; i < vertices.length / 2; i++) {
    sortedVertices.push([vertices[i * 2], vertices[i * 2 + 1]]);
  }
  sortedVertices.sort((a, b) => {
    return Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx);
  });

  // Convert the sorted vertices back to the flat array format
  const output = [];
  for (let i = 0; i < sortedVertices.length; i++) {
    output.push(sortedVertices[i][0]);
    output.push(sortedVertices[i][1]);
  }
  return output;
}


const execUnionShape = () => {
  if (currentAction == "union") {
    var idx1 = getIndexById(selectedShapeId1);
    console.log("selectedShapeId: " + selectedShapeId1)
    console.log("idx1: " + idx1)
    var idx2 = getIndexById(selectedShapeId2);
    console.log("selectedShapeId2: " + selectedShapeId2)
    console.log("idx2: " + idx2)
    var vertices = shapes[idx1].vertices.concat(shapes[idx2].vertices);
    console.log(shapes[idx1])
    console.log(shapes[idx1].vertices)
    console.log(shapes[idx2])
    console.log(shapes[idx2].vertices)
    //vertices is in format [x1, y1, x2, y2, x3, y3, x4, y4]. sort vertices by its position in the canvas coordinate counterclockwise
    vertices = sortVerticesCounterClockwise(vertices);
    
    console.log(vertices)
    var color = shapes[idx1].color;
    // shapes.splice(idx1, 1);
    // shapes.splice(idx2, 1);
    shapes.push({
      id: shapes.length,
      type: "polygon",
      vertices: vertices,
      color: color,
    });
  }
};

// draw the intersection shape of two shapes
const execIntersectionShape = () => {
  if (currentAction == "intersection") {
    var idx1 = getIndexById(selectedShapeId1);
    console.log("selectedShapeId: " + selectedShapeId1)
    console.log("idx1: " + idx1)
    var idx2 = getIndexById(selectedShapeId2);
    console.log("selectedShapeId2: " + selectedShapeId2)
    console.log("idx2: " + idx2)
    var vertices1 = shapes[idx1].vertices;
    console.log(shapes[idx1])
    console.log(shapes[idx1].vertices)
    var vertices2 = shapes[idx2].vertices;
    console.log(shapes[idx2])
    console.log(shapes[idx2].vertices)
    var color = shapes[idx1].color;
    var vertices = [];
    for (var i = 0; i < vertices1.length; i += 2) {
      var x = vertices1[i];
      var y = vertices1[i + 1];
      if (isInsidePolygon(x, y, vertices2)) {
        vertices.push(x);
        vertices.push(y);
      }
    }
    console.log(vertices)
    for (var i = 0; i < vertices2.length; i += 2) {
      var x = vertices2[i];
      var y = vertices2[i + 1];
      if (isInsidePolygon(x, y, vertices1)) {
        vertices.push(x);
        vertices.push(y);
      }
    }
    console.log(vertices)
    // add vertices of the intersection shape
    for (var i = 0; i < vertices1.length; i += 2) {
      var x1 = vertices1[i];
      var y1 = vertices1[i + 1];
      var x2 = vertices1[(i + 2) % vertices1.length];
      var y2 = vertices1[(i + 3) % vertices1.length];
      for (var j = 0; j < vertices2.length; j += 2) {
        var x3 = vertices2[j];
        var y3 = vertices2[j + 1];
        var x4 = vertices2[(j + 2) % vertices2.length];
        var y4 = vertices2[(j + 3) % vertices2.length];
        var intersection = getIntersection(x1, y1, x2, y2, x3, y3, x4, y4);
        if (intersection != null) {
          vertices.push(intersection[0]);
          vertices.push(intersection[1]);
        }
      }
    }
    console.log(vertices)
    //vertices is in format [x1, y1, x2, y2, x3, y3, x4, y4]. sort vertices by its position in the canvas coordinate counterclockwise
    vertices = sortVerticesCounterClockwise(vertices);
    shapes.push({
      id: shapes.length,
      type: "polygon",
      vertices: vertices,
      color: color,
    });
    // delete the two shapes
    shapes.splice(idx1, 1);
    shapes.splice(idx2, 1);
  }
};

function isInsidePolygon(x, y, vertices) {
  var inside = false;
  for (var i = 0, j = vertices.length - 2; i < vertices.length; j = i, i += 2) {
    var xi = vertices[i],
      yi = vertices[i + 1];
    var xj = vertices[j],
      yj = vertices[j + 1];

    var intersect =
      yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

function getIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
  var denominator =
    (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denominator == 0) {
    return null;
  }
  var a = y1 - y3;
  var b = x1 - x3;
  var numerator1 = (x4 - x3) * a - (y4 - y3) * b;
  var numerator2 = (x2 - x1) * a - (y2 - y1) * b;
  a = numerator1 / denominator;
  b = numerator2 / denominator;

  // if we cast these lines infinitely in both directions, they intersect here:
  var x = x1 + a * (x2 - x1);
  var y = y1 + a * (y2 - y1);

  // if line1 is a segment and line2 is infinite, they intersect if:
  if (a > 0 && a < 1 && b > 0 && b < 1) {
    return [x, y];
  } else {
    return null;
  }
}



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
    let x1, x2, y1, y2;

    setShapeColor();

    // Rightclick
    if (event.button == 2) {
      ;
      if (isDrawing && currentShape == "polygon") {
        temporaryLine = [];
        isDrawing == false;
      }
    } else {
      // leftclick
      if (currentAction === "translation" || "rotation" || "change-color") {
        const nearestPoint = findNearestPoint(x, y);
        if (nearestPoint.index != 0) {
          selectedShapeId = nearestPoint.index;
          selectedVertex = nearestPoint.vertex;
        }

        if (currentAction === "translation") {
          if (translationMode === "x") {
            rangeSlider.value = scale100FromCanvasX(selectedVertex[0]);
          } else {
            rangeSlider.value = scale100FromCanvasY(selectedVertex[1]);
          }
        }

        if (currentAction == "change-color") {
          execChangeColor();
        }
      }

      if (currentAction === "union") {
        if (!unionSelected) { 
          const nearestPoint = findNearestPoint(x, y);
          if (nearestPoint.index != 0) {
            selectedShapeId1 = nearestPoint.index;
            selectedVertex1 = nearestPoint.vertex;
            unionSelected = true;
            console.log("selected shape 1");
            console.log(selectedShapeId1);
            console.log(selectedVertex1);
          } 
        } else {
          const nearestPoint2 = findNearestPoint(x, y);
          if (nearestPoint2.index != 0) {
            selectedShapeId2 = nearestPoint2.index;
            selectedVertex2 = nearestPoint2.vertex;
            unionSelected = false;
            console.log("selected shape 2");
            console.log(selectedShapeId2);
            console.log(selectedVertex2);
            execUnionShape();
          }
        }
      }

      if (currentAction === "intersection") {
        if (!intersectionSelected) {
          const nearestPoint = findNearestPoint(x, y);
          if (nearestPoint.index != 0) {
            selectedShapeId1 = nearestPoint.index;
            selectedVertex1 = nearestPoint.vertex;
            intersectionSelected = true;
            console.log("selected shape 1");
            console.log(selectedShapeId1);
            console.log(selectedVertex1);
          }
        } else {
          const nearestPoint2 = findNearestPoint(x, y);
          if (nearestPoint2.index != 0) {
            selectedShapeId2 = nearestPoint2.index;
            selectedVertex2 = nearestPoint2.vertex;
            intersectionSelected = false;
            console.log("selected shape 2");
            console.log(selectedShapeId2);
            console.log(selectedVertex2);
            execIntersectionShape();
          }
        }
      }


      if (currentAction === "create") {
        if (!isDrawing) {
          if (currentShape == "line" || currentShape == "polygon" || currentShape == "square" || currentShape == "rectangle") {
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
              color: colorRgb
            });
            // render(gl.LINES, temporaryLine, colorRgb);

            renderCornerPoint(temporaryLine);
            temporaryLine = [];
            isDrawing = false;
          }

          if (currentShape == "square") {
            temporaryLine.push(x);
            temporaryLine.push(y);
            x1 = temporaryLine[0]
            y1 = temporaryLine[1]
            x2 = temporaryLine[2]
            y2 = temporaryLine[3]
            const distance = Math.abs(x1 - x2) > Math.abs(y1 - y2) ? Math.abs(x1 - x2) : Math.abs(y1 - y2);
            x2 = x1 > x2 ? x1 - distance : x1 + distance;
            y2 = y1 > y2 ? y1 - distance : y1 + distance;
            verticesSquare = [
              x1, y1,
              x1, y2,
              x2, y1,
              x2, y2
            ];

            shapes.push({
              type: "square",
              id: shapes.length + 1,
              vertices: verticesSquare,
              color: colorRgb
            });
            // render(gl.TRIANGLE_STRIP, verticesSquare, color: colorRgb);

            renderCornerPoint(temporaryLine);
            temporaryLine = [];
            isDrawing = false;
          }

          if (currentShape == "rectangle") {
            temporaryLine.push(x);
            temporaryLine.push(y);
            x1 = temporaryLine[0]
            y1 = temporaryLine[1]
            x2 = temporaryLine[2]
            y2 = temporaryLine[3]
            verticesRectangle = [
              x1, y1,
              x1, y2,
              x2, y2,
              x2, y1
            ];
            shapes.push({
              type: "rectangle",
              id: shapes.length + 1,
              vertices: verticesRectangle,
              color: colorRgb
            });
            // render(gl.TRIANGLE_FAN, verticesSquare, colorRgb);

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
              color: colorRgb
            });
            // render(gl.TRIANGLE_FAN, temporaryLine, colorRgb);
            renderCornerPoint(temporaryLine);
          }
        }
      }
    }

    colorRgb = [];
    drawcanvas();
  },
  false
);

canvas.addEventListener("mousemove", function (event) {
  setShapeColor();
  drawcanvas();
  if (isDrawing) {
    let x2 = canvasX(event.clientX);
    let y2 = canvasY(event.clientY);
    if (currentShape == "line") {
      temporaryLine = [temporaryLine[0], temporaryLine[1], x2, y2];
      render(gl.LINES, temporaryLine, colorRgb);
    } else if (currentShape == "square") {
      x1 = temporaryLine[0];
      y1 = temporaryLine[1];
      const distance = Math.abs(x1 - x2) > Math.abs(y1 - y2) ? Math.abs(x1 - x2) : Math.abs(y1 - y2);
      x2 = x1 > x2 ? x1 - distance : x1 + distance;
      y2 = y1 > y2 ? y1 - distance : y1 + distance;
      verticesSquare = [
        x1, y1,
        x1, y2,
        x2, y1,
        x2, y2
      ];
      render(gl.TRIANGLE_STRIP, verticesSquare, colorRgb);
    } else if (currentShape == "rectangle") {
      verticesRectangle = [
        temporaryLine[0], temporaryLine[1],
        temporaryLine[0], y2,
        x2, y2,
        x2, temporaryLine[1]
      ];
      render(gl.TRIANGLE_FAN, verticesRectangle, colorRgb);
    }
  }
});

const clearCanvas = () => {
  shapes = [];
  drawcanvas();
};

// drawcanvas()
