// ColoredCube.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +            //顶点的位置
    'attribute vec4 a_Color;\n' +               //顶点的颜色
    'uniform mat4 u_MvpMatrix;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_Position = u_MvpMatrix * a_Position;\n' +     //模型视图投影矩阵
    '  v_Color = a_Color;\n' +              //颜色信息放在这里后， 然后经过图形装配， 光栅化操作后把内插后的颜色属性值存储在v_color中
    '}\n';

// Fragment shader program
var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'varying vec4 v_Color;\n' +         //这里接受的颜色实际上是由顶点着色器对颜色内插之后的属性信息
    'void main() {\n' +
    '  gl_FragColor = v_Color;\n' +     //将内插后的颜色信息传给片元着色器
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

    // 初始化顶点着色器和片元着色器
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // 设置顶点信息（颜色和位置信息）
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }

    // 指定清空的背景色， 并且开启隐藏面消除
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // 获得我的模型视图投影矩阵 u_MvpMatrix
    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    if (!u_MvpMatrix) {
        console.log('Failed to get the storage location of u_MvpMatrix');
        return;
    }

    // 设置我的视点和我的可视空间
    var mvpMatrix = new Matrix4();
    var projMatrix = new Matrix4();
    var viewMatrix = new Matrix4();
    var modelMatrix = new Matrix4();

    //垂直视角， 宽高比， 近裁剪面的位置， 远处裁剪面的位置
    projMatrix.setPerspective(30, 1, 1, 100);
    viewMatrix.setLookAt(5, 2, 0, 0, 0, 0, 0, 1, 0);

    //注册我的鼠标点击事件
    document.onkeydown = function (ev) {
        keydown(ev, gl, n, u_MvpMatrix, mvpMatrix, modelMatrix, viewMatrix, projMatrix);
    }


    //开始绘制
    draw(gl, n, u_MvpMatrix, mvpMatrix, modelMatrix, viewMatrix, projMatrix);

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

    //定义了顶点位置的信息（24个顶点）
    var vertices = new Float32Array([   // Vertex coordinates
        1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,  // v0-v1-v2-v3 front
        1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,  // v0-v3-v4-v5 right
        1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,  // v0-v5-v6-v1 up
        -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,  // v1-v6-v7-v2 left
        -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,  // v7-v4-v3-v2 down
        1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0   // v4-v7-v6-v5 back
    ]);

    //为相应的每一个面设置不同的颜色（24中颜色）
    var colors = new Float32Array([     // Colors
        0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  // v0-v1-v2-v3 front(blue)
        0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  // v0-v3-v4-v5 right(green)
        1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  // v0-v5-v6-v1 up(red)
        1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  // v1-v6-v7-v2 left
        1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  // v7-v4-v3-v2 down
        0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0   // v4-v7-v6-v5 back
    ]);

    //三角形列表的索引(每个顶点之间的索引不会重复)
    //这里的0-23的编号， 分别对应了顶点数组和颜色数组中的值
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

    // 把顶点的位置和颜色信息写入到缓冲区
    if (!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position'))
        return -1;

    if (!initArrayBuffer(gl, colors, 3, gl.FLOAT, 'a_Color'))
        return -1;

    // indices 数组以索引的方式存储了绘制顶点的顺序
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return indices.length;
}

//在这里封装了缓冲区对象的创建、绑定、数据写入和开启操作
// 注意这里顶点信息和颜色信息是分别存储的， 因此这里的属性信息中， 偏移量offset都为0
function initArrayBuffer(gl, data, num, type, attribute) {
    var buffer = gl.createBuffer();   // Create a buffer object
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

var Ty = 0.0;
var Vz = 3.0;
//在这里实现我的按键响应函数
function keydown(ev, gl, n, u_MvpMatrix, mvpMatrix, modelMatrix, viewMatrix, projMatrix) {
    //对键盘的监听
    if (ev.keyCode == 39){
        //右键
        Ty += 10;
    } else if (ev.keyCode == 37){
        //左键
        Ty -= 10;
    } else if (ev.keyCode == 33){
        //alert('pagwup');
        Vz -= 0.1;
    } else if (ev.keyCode == 34){
        //alert('pagedown');
        Vz += 0.1;
    } else {
        //其他按键不起作用
        return ;
    }

    //修改旋转的角度
    modelMatrix.setRotate(Ty, 0, 1, 0);
    viewMatrix.setLookAt(5, 2, Vz, 0, 0,-2, 0, 1, 0);
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
    document.getElementById('nearFar').innerHTML = "当前的转动角度:"+Ty+"</br>当前的可视空间："+Math.round(Vz)/100;

    //每次按下键盘后， 就开始重新绘制我的三角形
    draw(gl, n, u_MvpMatrix, mvpMatrix, modelMatrix, viewMatrix, projMatrix);
}

//封装我的绘制函数
function draw(gl, n, u_MvpMatrix, mvpMatrix, modelMatrix, viewMatrix, projMatrix) {

    //mvpMatrix.setPerspective(30, 1, 1, 100);
    //mvpMatrix.lookAt(3, 3, 7, 0, 0, 0, 0, 1, 0);
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);

    // Pass the model view projection matrix to u_MvpMatrix
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Draw the cube
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

}