//点源光的使用
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'attribute vec4 a_Normal;\n' +
    'uniform mat4 u_MvpMatrix;\n' +
    'uniform mat4 u_ModelMatrix;\n' +   // Model matrix
    'uniform mat4 u_NormalMatrix;\n' +  // Transformation matrix of the normal
    'uniform vec3 u_LightColor;\n' +    // Light color
    'uniform vec3 u_LightPosition;\n' + // 点光源的位置 (in the world coordinate system)
    'uniform vec3 u_AmbientLight;\n' +  // Ambient light color
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_Position = u_MvpMatrix * a_Position;\n' +     //对顶点位置进行模型视图投影变换
    // 计算变换后的法向量并归一化
    '  vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
    // （计算经过模型矩阵变换以后的坐标位置）
    '  vec4 vertexPosition = u_ModelMatrix * a_Position;\n' +
    // 计算光线的方向并且归一化（光线的方向是由点光源坐标减去顶点坐标得到的矢量）
    '  vec3 lightDirection = normalize(u_LightPosition - vec3(vertexPosition));\n' +
    // 计算光线方向与法向量的点积（cos 0）
    '  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
    // 计算漫反射光的颜色 = 光的颜色 * 基底的颜色 * 点积
    '  vec3 diffuse = u_LightColor * a_Color.rgb * nDotL;\n' +
    // 计算环境光产生的反射光的颜色
    '  vec3 ambient = u_AmbientLight * a_Color.rgb;\n' +
    //  将以上两种光叠加作为最终的颜色
    '  v_Color = vec4(diffuse + ambient, a_Color.a);\n' +
    '}\n';

// Fragment shader program
var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_FragColor = v_Color;\n' +
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

    // Set the vertex coordinates, the color and the normal
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }

    // Set the clear color and enable the depth test
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // Get the storage locations of uniform variables and so on
    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');     //模型矩阵
    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');         //模型视图投影矩阵
    var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');   //变化法向量的逆转置矩阵
    var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');       //点光源的颜色
    var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition'); //点光源的位置
    var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');   //环境光的颜色
    if (!u_MvpMatrix || !u_NormalMatrix || !u_LightColor || !u_LightPosition　|| !u_AmbientLight) {
        console.log('Failed to get the storage location');
        return;
    }

    //让我的立方体转动起来
    //设置我的视图投影矩阵
    var vpMatrix = new Matrix4();
    vpMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
    vpMatrix.lookAt(6, 6, 14, 0, 0, 0, 0, 1, 0);

    // 设置点光源的颜色
    gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
    // 设置光源的位置
    gl.uniform3f(u_LightPosition, 2.3, 4.0, 3.5);
    // 设置环境光的颜色
    gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);

    //定义运动需要的变量
    var currentAngle = 0.0;              //当前的角度
    var modelMatrix = new Matrix4();    //模型矩阵
    var mvpMatrix = new Matrix4();      //模型视图投影矩阵
    var normalMatrix = new Matrix4();   //逆转置矩阵

    var tick = function () {
        currentAngle = animate(currentAngle);   //更新当前的角度

        //计算模型矩阵
        modelMatrix.setRotate(currentAngle, 0, 1, 0);
        //把模型矩阵传给顶点着色器
        gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

        //计算模型视图投影矩阵
        mvpMatrix.set(vpMatrix).multiply(modelMatrix);
        gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

        //计算我的逆转置矩阵
        normalMatrix.setInverseOf(modelMatrix);     //对我的模型矩阵求逆矩阵
        normalMatrix.transpose();                   //模型矩阵转置
        gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

        //清空颜色和深度测试
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        //开始绘制
        gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

        //请求浏览器再次调用
        requestAnimationFrame(tick, canvas);
    }

    //首次调用
    tick();

    /*
    // 设置点光源的颜色
    gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
    // 设置光源的位置
    gl.uniform3f(u_LightPosition, 2.3, 4.0, 3.5);
    // 设置环境光的颜色
    gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);

    var modelMatrix = new Matrix4();  // Model matrix
    var mvpMatrix = new Matrix4();    // Model view projection matrix
    var normalMatrix = new Matrix4(); // Transformation matrix for normals

    // 计算我的模型矩阵
    modelMatrix.setRotate(90, 0, 1, 0); // Rotate around the y-axis
    // Pass the model matrix to u_ModelMatrix
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // 计算我的模型视图投影矩阵
    mvpMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
    mvpMatrix.lookAt(6, 6, 14, 0, 0, 0, 0, 1, 0);


    mvpMatrix.multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    // 计算我的法向量的逆转置矩阵
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    //  清空画布和深度测试
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Draw the cube
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
    */
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
    // Coordinates
    var vertices = new Float32Array([
        2.0, 2.0, 2.0,  -2.0, 2.0, 2.0,  -2.0,-2.0, 2.0,   2.0,-2.0, 2.0, // v0-v1-v2-v3 front
        2.0, 2.0, 2.0,   2.0,-2.0, 2.0,   2.0,-2.0,-2.0,   2.0, 2.0,-2.0, // v0-v3-v4-v5 right
        2.0, 2.0, 2.0,   2.0, 2.0,-2.0,  -2.0, 2.0,-2.0,  -2.0, 2.0, 2.0, // v0-v5-v6-v1 up
        -2.0, 2.0, 2.0,  -2.0, 2.0,-2.0,  -2.0,-2.0,-2.0,  -2.0,-2.0, 2.0, // v1-v6-v7-v2 left
        -2.0,-2.0,-2.0,   2.0,-2.0,-2.0,   2.0,-2.0, 2.0,  -2.0,-2.0, 2.0, // v7-v4-v3-v2 down
        2.0,-2.0,-2.0,  -2.0,-2.0,-2.0,  -2.0, 2.0,-2.0,   2.0, 2.0,-2.0  // v4-v7-v6-v5 back
    ]);

    // Colors
    var colors = new Float32Array([
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v1-v2-v3 front
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v3-v4-v5 right
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v5-v6-v1 up
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v1-v6-v7-v2 left
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v7-v4-v3-v2 down
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0　    // v4-v7-v6-v5 back
    ]);

    // Normal
    var normals = new Float32Array([
        0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
        1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
        0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
        -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
        0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
        0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
    ]);

    // Indices of the vertices
    var indices = new Uint8Array([
        0, 1, 2,   0, 2, 3,    // front
        4, 5, 6,   4, 6, 7,    // right
        8, 9,10,   8,10,11,    // up
        12,13,14,  12,14,15,    // left
        16,17,18,  16,18,19,    // down
        20,21,22,  20,22,23     // back
    ]);

    // Write the vertex property to buffers (coordinates, colors and normals)
    if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // Write the indices to the buffer object
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create the buffer object');
        return false;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return indices.length;
}

function initArrayBuffer(gl, attribute, data, num, type) {
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

    return true;
}


// Rotation angle (degrees/second)
var ANGLE_STEP = 30.0;
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
