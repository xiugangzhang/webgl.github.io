// RotatingTriangle_contextLost.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'uniform mat4 u_ModelMatrix;\n' +
    'void main() {\n' +
    '  gl_Position = u_ModelMatrix * a_Position;\n' +
    '}\n';

// Fragment shader program
var FSHADER_SOURCE =
    'void main() {\n' +
    '  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' +
    '}\n';

function main() {
    // Retrieve <canvas> element
    var canvas = document.getElementById('webgl');

    //这里注册了上下文丢失和上下文恢复事件的响应函数
    // Register event handler for context lost and context restored events
    canvas.addEventListener('webglcontextlost', contextLost, false);            //上下文丢失的函数
    canvas.addEventListener('webglcontextrestored', function(ev) { start(canvas); }, false);    //上下文恢复的函数


    //调用这个函数就会重置WEBGL系统
    start(canvas);   // Perform WebGL related processes
}

// Current rotation angle
var ANGLE_STEP = 45.0;
// Current rotation angle
var g_currentAngle = 0.0; // 把三角形的当前旋转角度存储在全局变量中而不是局部变量中
var g_requestID; // The return value of requestAnimationFrame()，为了在上下文丢失后停止动画（停止反复调用tick()函数）

function start(canvas) {
    // Get the rendering context for WebGL
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    var n = initVertexBuffers(gl);   // Write the positions of vertices to a vertex shader
    if (n < 0) {
        console.log('Failed to set the positions of the vertices');
        return;
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);   // Specify the color for clearing <canvas>

    // Get storage location of u_ModelMatrix
    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of u_ModelMatrix');
        return;
    }

    var modelMatrix = new Matrix4();   // Create a model matrix

    var tick = function() {    // Start drawing
        g_currentAngle = animate(g_currentAngle);                // Update current rotation angle
        draw(gl, n, g_currentAngle, modelMatrix, u_ModelMatrix); // Draw the triangle
        //把反复重绘函数的返回值存起来
        g_requestID = requestAnimationFrame(tick, canvas);       // Reregister this Function again
    };
    tick();
}

//这个函数是用来响应上下文丢失的响应函数
function contextLost(ev) { // Event Handler for context lost event
    cancelAnimationFrame(g_requestID); //  Stop animation， 取消窗体的不断重绘功能
    ev.preventDefault();  // Prevent the default behavior   阻止浏览器对这个事件的默认处理行为（默认行为是：浏览器不再触发上下文的恢复事件）
}

function initVertexBuffers(gl) {
    var vertices = new Float32Array ([
        0.0, 0.5,   -0.5, -0.5,   0.5, -0.5
    ]);
    var n = 3;   // The number of vertices

    // Create a buffer object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Assign the buffer object to a_Position variable
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if(a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);

    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return n;
}

function draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix) {
    // Set the rotation matrix
    modelMatrix.setRotate(currentAngle, 0, 0, 1);

    // Pass the rotation matrix to the vertex shader
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw the rectangle
    gl.drawArrays(gl.TRIANGLES, 0, n);
}

// Last time that this function was called
var g_last = Date.now();
function animate(angle) {
    // Calculate the elapsed time
    var now = Date.now();
    var elapsed = now - g_last;
    g_last = now;
    // Update the current rotation angle (adjusted by the elapsed time)
    var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
    return newAngle %= 360;
}
