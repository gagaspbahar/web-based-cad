function createLine(gl, x1, x2, y1, y2) {
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    x1, y1,
    x2, y2,
  ]), gl.STATIC_DRAW);
}