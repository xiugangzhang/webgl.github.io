//顶点着色器
//通过键盘来控制视点的移动
//通过键盘来控制视点的移动
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +        //存储顶点的位置信息
    'attribute vec4 a_Color;\n' +           //存储顶点的颜色
    'uniform mat4 u_ViewMatrix;\n' +        //定义一个视图矩阵
    'uniform mat4 u_ProjMatrix;\n' +        //定义一个正射投影矩阵(投影矩阵与顶点无关)
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_Position = u_ProjMatrix * u_ViewMatrix * a_Position;\n' + //用当前的顶点位置向量乘以视图矩阵
    '  v_Color = a_Color;\n' +
    '}\n';

//片元着色器
var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +      //指定float数据类型的默认精度水平为 中等水平
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

    // Set the vertex coordinates and color (the blue triangle is in the front)
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }

    // Specify the color for clearing <canvas>
    gl.clearColor(0, 0, 0, 1);

    // Get the storage location of u_ViewMatrix
    var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    if (!u_ViewMatrix) {
        console.log('Failed to get the storage locations of u_ViewMatrix');
        return;
    }

    //获取我的正射投影矩阵
    var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
    if (!u_ProjMatrix){
        console.log('Failed to get the storage location of u_ProjMatrix');
        return ;
    }

    // 设置视点， 观察点， 和上方向
    var viewMatrix = new Matrix4();



    //在创建我的视图矩阵之前先注册一个键盘事件的响应函数
    document.onkeydown = function (ev) {
        //响应函数
        keydown(ev, gl, n, u_ViewMatrix, viewMatrix);
    }

    //创建指定可视空间的矩阵并传给u_ProjMatrix变量
    var projMatrix = new Matrix4();
    //projMatrix.setOrtho(-1.0, 1.0, -1.0, 1.0, 0.0, 2.0);
    //缩小我的可是空间后的变化
    projMatrix.setOrtho(-0.5, 0.5, -1.0, 1.0, 0.0, 5.0);

    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);



    //把我的绘制图形的函数封装成一个函数
    draw(gl, n, u_ViewMatrix, viewMatrix);

}

function initVertexBuffers(gl) {
    var verticesColors = new Float32Array([
        // Vertex coordinates and color(RGBA)
        // 注意这里的顶点坐标的z分量不是0（-0.4， -0.2， 0.0）
        0.0,  0.5,  -0.4,  0.4,  1.0,  0.4, // The back green one
        -0.5, -0.5,  -0.4,  0.4,  1.0,  0.4,
        0.5, -0.5,  -0.4,  1.0,  0.4,  0.4,

        0.5,  0.4,  -0.2,  1.0,  0.4,  0.4, // The middle yellow one
        -0.5,  0.4,  -0.2,  1.0,  1.0,  0.4,
        0.0, -0.6,  -0.2,  1.0,  1.0,  0.4,

        0.0,  0.5,   0.0,  0.4,  0.4,  1.0,  // The front blue one
        -0.5, -0.5,   0.0,  0.4,  0.4,  1.0,
        0.5, -0.5,   0.0,  1.0,  0.4,  0.4,
    ]);
    var n = 9;

    // Create a buffer object
    var vertexColorbuffer = gl.createBuffer();
    if (!vertexColorbuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    // Write the vertex coordinates and color to the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

    var FSIZE = verticesColors.BYTES_PER_ELEMENT;
    // Assign the buffer object to a_Position and enable the assignment
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if(a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
    gl.enableVertexAttribArray(a_Position);

    // Assign the buffer object to a_Color and enable the assignment
    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if(a_Color < 0) {
        console.log('Failed to get the storage location of a_Color');
        return -1;
    }
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
    gl.enableVertexAttribArray(a_Color);

    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return n;
}


//初始化我的视点
var g_eyeX = 0.2, g_eyeY = 0.25, g_eyeZ = 0.25;

//在这里实现我的按键响应函数
function keydown(ev, gl, n, u_ViewMatrix, viewMatrix) {
    //对键盘的监听
    if (ev.keyCode == 39){
        //右键
        g_eyeX += 0.01;
    } else if (ev.keyCode == 37){
        //左键
        g_eyeX -= 0.01;
    } else {
        //其他按键不起作用
        return ;
    }

    //每次按下键盘后， 就开始重新绘制我的三角形
    draw(gl, n, u_ViewMatrix, viewMatrix);
}

//封装我的绘制函数
function draw(gl, n, u_ViewMatrix, viewMatrix) {
    //设置视点和视线
    viewMatrix.setLookAt(g_eyeX, g_eyeY, g_eyeZ, 0, 0, 0, 0, 1, 0);


    // 将当前矩阵设置为视图矩阵【视点（我的位置）， 被观察目标所在的点， 上方向】
    //viewMatrix.setLookAt(0.20, 0.25, 0.25, 0, 0, 0, 0, 1, 0);
    // 将视图矩阵传给u_ViewMatrix变量
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw the rectangle
    gl.drawArrays(gl.TRIANGLES, 0, n);

}
