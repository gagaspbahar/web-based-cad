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

const canvasX = (canvas, x) => {
  const rect = canvas.getBoundingClientRect();
  let newX = x - rect.left;
  newX = (newX / (rect.right - rect.left)) * canvas.width;
  return newX;
};

const canvasY = (canvas, y) => {
  const rect = canvas.getBoundingClientRect();
  let newY = y - rect.top;
  newY = (newY / (rect.bottom - rect.top)) * canvas.height;
  return newY;
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

function isInsidePolygon(x, y, vertices) {
  // Initialize the count of intersections
  let count = 0;
  // Iterate over each edge of the polygon
  for (let i = 0; i < vertices.length; i += 2) {
    const x1 = vertices[i];
    const y1 = vertices[i+1];
    const x2 = vertices[(i+2) % vertices.length];
    const y2 = vertices[(i+3) % vertices.length];
    // Check if the edge intersects the ray cast from the point
    if (((y1 > y) !== (y2 > y)) &&
        (x < (x2 - x1) * (y - y1) / (y2 - y1) + x1)) {
      count += 1;
    }
  }
  // If the number of intersections is odd, the point is inside the polygon
  console.log("x: " + x + " y: " + y + " inside: " + (count % 2 === 1));
  return count % 2 === 1;
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
  var y = y1 + b * (y2 - y1);
  // if line1 is a segment and line2 is infinite, they intersect if:
  if (a > 0 && a < 1 && b > 0 && b < 1) {
    return [x, y];
  } else {
    return null;
  }
}


const resize = (shapeVertices) => {
  const [x, y] = calculateMidPoint(shapeVertices);
  const scale = inputValue;
  const newVertices = shapeVertices.map((val, idx) => {
    if (idx % 2 == 0) {
      return scale * (val - x) + x;
    } else {
      return scale * (val - y) + y;
    }
  });
  return newVertices;
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

const getIndexById = (id) => {
  for (var i = 0; i < shapes.length; i++) {
    if (shapes[i].id == id) {
      return i;
    }
  }
};