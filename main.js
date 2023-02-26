// Main entry point for the application
// Type for shape
// const shape = {
//     type: "line",
//     id: 0,
//     vertices: [],
// }

var shapes = [];
var colorRgb = [];

var currentAction = "none";
var currentShape = "line";
var currentPolygonAction = "none";
var selectedShapeId = 0;
var selectedVertex = [];
var selectedShapeId2 = 0;
var selectedVertex2 = [];
var translationMode = "x";
var sizeMode = "Length";

var isDrawing = false;
var temporaryLine = [];
var temporaryColor = [];
var sliderValue = 0;
var unionSelected = false;
var intersectionSelected = false;
var preserveShapeSelected = false;
var polygonActionFlag = false;
var currentColorMode = "shape";
// var colorMode = "vertex";

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
var colorAttributeLocation = gl.getAttribLocation(program, "a_color");

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
  } else if (currentAction == "move-point") {
    execMovePoint();
  }
  drawcanvas();
});

const sizeSlider = document.querySelector('input[name="input-size-slider"]');
sizeSlider.addEventListener("input", (event) => {
  sliderValue = event.target.value;
  if (currentAction == "dilatation") {
    execDilatation();
  } else if (currentAction == "change-size") {
    execChangeSize();
  }
  drawcanvas();
})

const transformationRadioButton = document.querySelectorAll(
  'input[name="transformation"]'
);

transformationRadioButton.forEach((radio) => {
  radio.addEventListener("change", (event) => {
    currentAction = event.target.value;
    if (
      event.target.value == "translation" ||
      event.target.value == "move-point" ||
      event.target.value == "dilatation" ||
      event.target.value == "change-size"
    ) {
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
};

const setShapeColor = () => {
  const colorInput = document.getElementById("color").value;
  setHexToRgb(colorInput);
};

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

const changeSizeMode = () => {
  const elmt = document.getElementById("input-size-slider-label");
  if (sizeMode === "Length") {
    sizeMode = "Width";
    elmt.innerHTML = "Width";
  } else {
    sizeMode = "Length";
    elmt.innerHTML = "Length";
  }
}

const preserveShape = () => {
  preserveShapeSelected = !preserveShapeSelected;
  if (preserveShapeSelected) {
    document.getElementById("preserve-shape").innerHTML = "Preserve Shape";
  } else {
    document.getElementById("preserve-shape").innerHTML =
      "Do Not Preserve Shape";
  }
};

const customSplice = (arr, pair) => {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] == pair[0] && arr[i + 1] == pair[1]) {
      arr.splice(i, 2);
    }
  }
  return arr;
};

const getVertexIndex = (arr, pair) => {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] == pair[0] && arr[i + 1] == pair[1]) {
      return i;
    }
  }
}

const execTranslation = () => {
  if (currentAction == "translation") {
    var idx = getIndexById(selectedShapeId);
    var x = 0;
    if (translationMode == "x") {
      x = scaleCanvasFrom100X(sliderValue) - shapes[idx].vertices[0];
      console.log(sliderValue);
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

const resize = (shapeVertices) => {
  const [x, y] = calculateMidPoint(shapeVertices);
  const scale = sliderValue / 50;
  const newVertices = shapeVertices.map((val, idx) => {
    if (idx % 2 == 0) {
      return scale * (val - x) + x;
    } else {
      return scale * (val - y) + y;
    }
  });
  return newVertices;
};

const execDilatation = () => {
  if (currentAction == "dilatation") {
    var idx = getIndexById(selectedShapeId);
    shapes[idx].vertices = resize(shapes[idx].vertices);
  }
};

const execChangeSize = () => {
  if (currentAction == "change-size") {
    var idx = getIndexById(selectedShapeId);
    const [x, y] = calculateMidPoint(shapes[idx].vertices);
    const scale = sliderValue / 50;
    if (shapes[idx].type == "line" || shapes[idx].type == "square") {
      shapes[idx].vertices = resize(shapes[idx].vertices);
    } else if (shapes[idx].type == "rectangle") {
      if (sizeMode == "Length") {
        for (var i = 0; i < shapes[idx].vertices.length; i++) {
          if (i == 4 || i == 6) {
            shapes[idx].vertices[i] = shapes[idx].vertices[i] * scale;
          }
        }
      } else {
        for (var i = 0; i < shapes[idx].vertices.length; i++) {
          if (i == 3 || i == 5) {
            shapes[idx].vertices[i] = shapes[idx].vertices[i] * scale;
          }
        }
      }
    }
  }
}

const execChangeColor = () => {
  if (currentAction == "change-color") {
    var idx = getIndexById(selectedShapeId);
    console.log(shapes[idx]);
    setShapeColor();
    if (currentColorMode == "vertex") {
      for (var i = 0; i < shapes[idx].color.length; i++) {
        shapes[idx].color[i] = colorRgb[i % 4];
      }
      colorRgb = [];
    } else {
      vertexIdx = getVertexIndex(shapes[idx].vertices, selectedVertex);
      colorIdx = vertexIdx * 2;
      for (var i = 0; i < 4; i++) {
        shapes[idx].color[colorIdx + i] = colorRgb[i];
      }
    }
  }
};

const execMovePoint = () => {
  if (currentAction == "move-point") {
    var idx = getIndexById(selectedShapeId);
    console.log(shapes[idx]);
    console.log(selectedVertex);
    var x = 0;
    if (translationMode == "x") {
      x = scaleCanvasFrom100X(sliderValue) - shapes[idx].vertices[0];
    } else {
      x = scaleCanvasFrom100Y(sliderValue) - shapes[idx].vertices[1];
    }
    for (var i = 0; i < shapes[idx].vertices.length; i += 2) {
      if (!preserveShapeSelected) {
        if (
          shapes[idx].vertices[i] == selectedVertex[0] &&
          shapes[idx].vertices[i + 1] == selectedVertex[1]
        ) {
          if (translationMode == "x") {
            shapes[idx].vertices[i] += x;
          } else {
            shapes[idx].vertices[i + 1] += x;
          }
        }
      } else {
        if (translationMode == "x") {
          if (shapes[idx].vertices[i] == selectedVertex[0]) {
            shapes[idx].vertices[i] += x;
          }
        } else {
          if (shapes[idx].vertices[i + 1] == selectedVertex[1]) {
            shapes[idx].vertices[i + 1] += x;
          }
        }
      }
    }
  }
};

function sortVerticesCounterClockwise(vertices) {
  // Get the centroid of the polygon
  let cx = 0,
    cy = 0;
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
    console.log("selectedShapeId: " + selectedShapeId1);
    console.log("idx1: " + idx1);
    var idx2 = getIndexById(selectedShapeId2);
    console.log("selectedShapeId2: " + selectedShapeId2);
    console.log("idx2: " + idx2);
    var vertices = shapes[idx1].vertices.concat(shapes[idx2].vertices);
    console.log(shapes[idx1]);
    console.log(shapes[idx1].vertices);
    console.log(shapes[idx2]);
    console.log(shapes[idx2].vertices);
    //vertices is in format [x1, y1, x2, y2, x3, y3, x4, y4]. sort vertices by its position in the canvas coordinate counterclockwise
    vertices = sortVerticesCounterClockwise(vertices);

    console.log(vertices);
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
    console.log("selectedShapeId: " + selectedShapeId1);
    console.log("idx1: " + idx1);
    var idx2 = getIndexById(selectedShapeId2);
    console.log("selectedShapeId2: " + selectedShapeId2);
    console.log("idx2: " + idx2);
    var vertices1 = shapes[idx1].vertices;
    console.log(shapes[idx1]);
    console.log(shapes[idx1].vertices);
    var vertices2 = shapes[idx2].vertices;
    console.log(shapes[idx2]);
    console.log(shapes[idx2].vertices);
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
    console.log(vertices);
    for (var i = 0; i < vertices2.length; i += 2) {
      var x = vertices2[i];
      var y = vertices2[i + 1];
      if (isInsidePolygon(x, y, vertices1)) {
        vertices.push(x);
        vertices.push(y);
      }
    }
    console.log(vertices);
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
    console.log(vertices);
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
  var denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
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

const uncheckActionRadio = () => {
  var elements = document.getElementsByTagName("transformation");
  for (var i = 0; i < elements.length; i++) {
    if (elements[i].type == "radio") {
      elements[i].checked = false;
    }
  }
  currentAction = "none";
  console.log(currentAction);
};

const toggleAddVertex = () => {
  uncheckActionRadio();
  if (currentPolygonAction == "add") {
    currentPolygonAction = "none";
  } else {
    currentPolygonAction = "add";
  }
};

const toggleRemoveVertex = () => {
  uncheckActionRadio();
  if (currentPolygonAction == "remove") {
    currentPolygonAction = "none";
  } else {
    currentPolygonAction = "remove";
  }
};

const toggleShapeColorMode = () => {
  if (currentColorMode == "shape") {
    currentColorMode = "vertex";
  }
};

const toggleVertexColorMode = () => {
  if (currentColorMode == "vertex") {
    currentColorMode = "shape";
  }
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

  var colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color), gl.STATIC_DRAW);
  gl.vertexAttribPointer(colorAttributeLocation, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(colorAttributeLocation);
  // gl.attribute4f(colorAttributeLocation, ...color);
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
      if (isDrawing && currentShape == "polygon") {
        temporaryLine = [];
        isDrawing == false;
      }
    } else {
      // leftclick
      if (
        currentAction === "translation" ||
        "rotation" ||
        "change-color" ||
        "move-point"
      ) {
        const nearestPoint = findNearestPoint(x, y);
        if (nearestPoint.index != 0) {
          selectedShapeId = nearestPoint.index;
          selectedVertex = nearestPoint.vertex;
        }

        if (currentAction === "translation" || "move-point") {
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
          if (
            currentShape == "line" ||
            currentShape == "polygon" ||
            currentShape == "square" ||
            currentShape == "rectangle"
          ) {
            temporaryLine.push(x);
            temporaryLine.push(y);
            temporaryColor.push(...colorRgb);
            temporaryColor.push(...colorRgb);
          }
          isDrawing = true;
        } else {
          if (currentShape == "line") {
            temporaryLine.push(x);
            temporaryLine.push(y);
            temporaryColor.push(...colorRgb);
            temporaryColor.push(...colorRgb);
            shapes.push({
              type: "line",
              id: shapes.length + 1,
              vertices: temporaryLine,
              color: temporaryColor,
            });
            // render(gl.LINES, temporaryLine, colorRgb);

            renderCornerPoint(temporaryLine);
            temporaryLine = [];
            temporaryColor = [];
            isDrawing = false;
          }

          if (currentShape == "square") {
            temporaryLine.push(x);
            temporaryLine.push(y);
            x1 = temporaryLine[0];
            y1 = temporaryLine[1];
            x2 = temporaryLine[2];
            y2 = temporaryLine[3];
            for (let i = 0; i < 4; i++) {
              temporaryColor.push(...colorRgb);
            }
            const distance =
              Math.abs(x1 - x2) > Math.abs(y1 - y2)
                ? Math.abs(x1 - x2)
                : Math.abs(y1 - y2);
            x2 = x1 > x2 ? x1 - distance : x1 + distance;
            y2 = y1 > y2 ? y1 - distance : y1 + distance;
            verticesSquare = [x1, y1, x1, y2, x2, y1, x2, y2];

            shapes.push({
              type: "square",
              id: shapes.length + 1,
              vertices: verticesSquare,
              color: temporaryColor,
            });
            // render(gl.TRIANGLE_STRIP, verticesSquare, color: colorRgb);

            renderCornerPoint(temporaryLine);
            temporaryLine = [];
            temporaryColor = [];
            isDrawing = false;
          }

          if (currentShape == "rectangle") {
            temporaryLine.push(x);
            temporaryLine.push(y);
            x1 = temporaryLine[0];
            y1 = temporaryLine[1];
            x2 = temporaryLine[2];
            y2 = temporaryLine[3];
            for (let i = 0; i < 4; i++) {
              temporaryColor.push(...colorRgb);
            }
            console.log(temporaryColor);
            verticesRectangle = [x1, y1, x1, y2, x2, y2, x2, y1];
            shapes.push({
              type: "rectangle",
              id: shapes.length + 1,
              vertices: verticesRectangle,
              color: temporaryColor,
            });
            // render(gl.TRIANGLE_FAN, verticesSquare, colorRgb);

            renderCornerPoint(temporaryLine);
            temporaryLine = [];
            temporaryColor = [];
            isDrawing = false;
          }

          if (currentShape == "polygon") {
            temporaryLine.push(x);
            temporaryLine.push(y);
            for (let i = 0; i < temporaryLine.length / 2; i++) {
              temporaryColor.push(...colorRgb);
            }
            shapes.push({
              type: "polygon",
              id: shapes.length + 1,
              vertices: temporaryLine,
              color: temporaryColor,
            });
            // render(gl.TRIANGLE_FAN, temporaryLine, colorRgb);
            renderCornerPoint(temporaryLine);
          }
        }
      }

      if (currentPolygonAction != "none") {
        if (selectedShapeId == 0) {
          const nearestPoint = findNearestPoint(x, y);
          if (nearestPoint.index != 0) {
            selectedShapeId = nearestPoint.index;
            selectedVertex = nearestPoint.vertex;
            console.log("selected shape");
            console.log(selectedShapeId);
            console.log(selectedVertex);
          }
        } else if (shapes[selectedShapeId].type != "polygon") {
          selectedShapeId = 0;
          selectedVertex = 0;
        } else {
          console.log(currentPolygonAction);
          if (currentPolygonAction == "add") {
            shapes[selectedShapeId].vertices.push(x);
            shapes[selectedShapeId].vertices.push(y);
          } else if (currentPolygonAction == "remove") {
            shapes[selectedShapeId].vertices = customSplice(
              shapes[selectedShapeId].vertices,
              selectedVertex
            );
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
      render(gl.LINES, temporaryLine, [...colorRgb, ...colorRgb]);
    } else if (currentShape == "square") {
      x1 = temporaryLine[0];
      y1 = temporaryLine[1];
      const distance =
        Math.abs(x1 - x2) > Math.abs(y1 - y2)
          ? Math.abs(x1 - x2)
          : Math.abs(y1 - y2);
      x2 = x1 > x2 ? x1 - distance : x1 + distance;
      y2 = y1 > y2 ? y1 - distance : y1 + distance;
      verticesSquare = [x1, y1, x1, y2, x2, y1, x2, y2];
      render(gl.TRIANGLE_STRIP, verticesSquare, [...colorRgb, ...colorRgb, ...colorRgb, ...colorRgb]);
    } else if (currentShape == "rectangle") {
      verticesRectangle = [
        temporaryLine[0],
        temporaryLine[1],
        temporaryLine[0],
        y2,
        x2,
        y2,
        x2,
        temporaryLine[1],
      ];
      render(gl.TRIANGLE_FAN, verticesRectangle, [...colorRgb, ...colorRgb, ...colorRgb, ...colorRgb]);
    }
  }
});

const clearCanvas = () => {
  shapes = [];
  temporaryLine = [];
  temporaryColor = [];
  selectedShapeId = 0;
  selectedVertex = 0;

  drawcanvas();
};

// drawcanvas()
