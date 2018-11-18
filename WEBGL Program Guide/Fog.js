// Fog.js (c) 2012 matsuda and ohnishi
// Vertex shader program
//在这里实现了一种雾化的效果
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'uniform mat4 u_MvpMatrix;\n' +
    'uniform mat4 u_ModelMatrix;\n' +
    'uniform vec4 u_Eye;\n' +     // Position of eye point (world coordinates)
    'varying vec4 v_Color;\n' +
    'varying float v_Dist;\n' +
    'void main() {\n' +
    '  gl_Position = u_MvpMatrix * a_Position;\n' +
    '  v_Color = a_Color;\n' +
    // 计算顶点与视点之间的距离（现将点的坐标转换为世界坐标系下，然后调用distance（）函数计算距离）
    '  v_Dist = distance(u_ModelMatrix * a_Position, u_Eye);\n' +
    '}\n';

// Fragment shader program
var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'uniform vec3 u_FogColor;\n' + // 雾的颜色
    'uniform vec2 u_FogDist;\n' +  // 雾的起点和终点 (starting point, end point)
    'varying vec4 v_Color;\n' +
    'varying float v_Dist;\n' +     //来自顶点着色器的距离
    'void main() {\n' +
    // 计算雾化因子 (factor becomes smaller as it goes further away from eye point)
    //clamp 函数的目的是将第一个变量限制在第二个和第三个数值之间的范围
    '  float fogFactor = clamp((u_FogDist.y - v_Dist) / (u_FogDist.y - u_FogDist.x), 0.0, 1.0);\n' +
    //计算雾化之后的片元颜色（传入雾的颜色）
    // Stronger fog as it gets further: u_FogColor * (1 - fogFactor) + v_Color * fogFactor
    //mix()函数计算规则：x*(1-z)+y*z
    '  vec3 color = mix(u_FogColor, vec3(v_Color), fogFactor);\n' +
    '  gl_FragColor = vec4(color, v_Color.a);\n' +
    '}\n';

function main() {
    // Retrieve <canvas> element
    var canvas = document.getElementById('webgl');

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

    //
    var n = initVertexBuffers(gl);
    if (n < 1) {
        console.log('Failed to set the vertex information');
        return;
    }

    // 雾的颜色(实际上是通过指定画布的颜色来设置雾的颜色效果的)
    var fogColor = new Float32Array([0.137, 0.231, 0.423]);
    // 雾化的起点与视点之间的距离 [where fog starts, where fog completely covers object]
    var fogDist = new Float32Array([55, 80]);
    //视点在世界坐标系下的位置
    var eye = new Float32Array([25, 65, 35, 1.0]);

    // Get the storage locations of uniform variables
    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    var u_Eye = gl.getUniformLocation(gl.program, 'u_Eye');
    var u_FogColor = gl.getUniformLocation(gl.program, 'u_FogColor');
    //初始的距离属性的存储地址
    var u_FogDist = gl.getUniformLocation(gl.program, 'u_FogDist');
    if (!u_MvpMatrix || !u_ModelMatrix || !u_Eye || !u_FogColor || !u_FogDist) {
        console.log('Failed to get the storage location');
        return;
    }

    // 将雾的颜色，起点与终点，视点坐标传给相应的uniform变量
    // fog color, distances, and eye point to uniform variable
    gl.uniform3fv(u_FogColor, fogColor); // Colors
    //把初始的距离传到顶点着色器
    gl.uniform2fv(u_FogDist, fogDist);   // Starting point and end point
    gl.uniform4fv(u_Eye, eye);           // Eye point

    // 设置背景色并且开启隐藏面消除的功能
    gl.clearColor(fogColor[0], fogColor[1], fogColor[2], 1.0); // Color of Fog
    gl.enable(gl.DEPTH_TEST);

    // Pass the model matrix to u_ModelMatrix
    var modelMatrix = new Matrix4();
    modelMatrix.setScale(10, 10, 10);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // Pass the model view projection matrix to u_MvpMatrix
    var mvpMatrix = new Matrix4();
    mvpMatrix.setPerspective(30, canvas.width/canvas.height, 1, 1000);
    //设置我的视点的位置
    mvpMatrix.lookAt(eye[0], eye[1], eye[2], 0, 2, 0, 0, 1, 0);
    mvpMatrix.multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    //添加一个鼠标监听的事件
    document.onkeydown = function(ev){
        keydown(ev, gl, n, u_FogDist, fogDist);
    };

    // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // Draw
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

    var modelViewMatrix = new Matrix4();
    modelViewMatrix.setLookAt(eye[0], eye[1], eye[2], 0, 2, 0, 0, 1, 0);
    modelViewMatrix.multiply(modelMatrix);
    modelViewMatrix.multiplyVector4(new Vector4([1, 1, 1, 1]));
    mvpMatrix.multiplyVector4(new Vector4([1, 1, 1, 1]));
    modelViewMatrix.multiplyVector4(new Vector4([-1, 1, 1, 1]));
    mvpMatrix.multiplyVector4(new Vector4([-1, 1, 1, 1]));
}

//通过按键来调整雾的颜色效果
function keydown(ev, gl, n, u_FogDist, fogDist) {
    switch (ev.keyCode) {
        case 38: // Up arrow key -> Increase the maximum distance of fog
            //增加距离
            fogDist[1]  += 1;
            break;
        case 40: // Down arrow key -> Decrease the maximum distance of fog
            //减少距离
            if (fogDist[1] > fogDist[0])
                fogDist[1] -= 1;
            break;
        default: return;
    }
    //把当前的改变的距离实时更新到顶点着色器中去
    gl.uniform2fv(u_FogDist, fogDist);   // Pass the distance of fog
    // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // Draw
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}

function initVertexBuffers(gl) {
    // Create a cube
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3

    var vertices = new Float32Array([   // Vertex coordinates
        1, 1, 1,  -1, 1, 1,  -1,-1, 1,   1,-1, 1,    // v0-v1-v2-v3 front
        1, 1, 1,   1,-1, 1,   1,-1,-1,   1, 1,-1,    // v0-v3-v4-v5 right
        1, 1, 1,   1, 1,-1,  -1, 1,-1,  -1, 1, 1,    // v0-v5-v6-v1 up
        -1, 1, 1,  -1, 1,-1,  -1,-1,-1,  -1,-1, 1,    // v1-v6-v7-v2 left
        -1,-1,-1,   1,-1,-1,   1,-1, 1,  -1,-1, 1,    // v7-v4-v3-v2 down
        1,-1,-1,  -1,-1,-1,  -1, 1,-1,   1, 1,-1     // v4-v7-v6-v5 back
    ]);

    var colors = new Float32Array([     // Colors
        0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  // v0-v1-v2-v3 front
        0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  // v0-v3-v4-v5 right
        1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  // v0-v5-v6-v1 up
        1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  // v1-v6-v7-v2 left
        1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  // v7-v4-v3-v2 down
        0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0   // v4-v7-v6-v5 back
    ]);

    var indices = new Uint8Array([       // Indices of the vertices
        0, 1, 2,   0, 2, 3,    // front
        4, 5, 6,   4, 6, 7,    // right
        8, 9,10,   8,10,11,    // up
        12,13,14,  12,14,15,    // left
        16,17,18,  16,18,19,    // down
        20,21,22,  20,22,23     // back
    ]);

    // Create a buffer object
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer)
        return -1;

    // Write the vertex property to buffers (coordinates and normals)
    if (!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position')) return -1;
    if (!initArrayBuffer(gl, colors, 3, gl.FLOAT, 'a_Color')) return -1;

    // Write the indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return indices.length;
}

function initArrayBuffer (gl, data, num, type, attribute) {
    // Create a buffer object
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return false;
    }
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    // Assign the buffer object to the attribute variable
    var a_attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_attribute < 0) {
        console.log('Failed to get the storage location of ' + attribute);
        return false;
    }
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    // Enable the assignment of the buffer object to the attribute variable
    gl.enableVertexAttribArray(a_attribute);
    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return true;
}
