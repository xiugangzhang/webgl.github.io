//实现一个我的机器人的运动模型
//顶点着色器
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +                        //顶点的位置信息
    'attribute vec4 a_Normal;\n' +                          //每个面的法向量
    'uniform mat4 u_MvpMatrix;\n' +                         //模型视图投影矩阵
    'uniform mat4 u_NormalMatrix;\n' +                      //逆转置矩阵
    'varying vec4 v_Color;\n' +                             //顶点的颜色
    'void main() {' +
    '   gl_Position = u_MvpMatrix * a_Position;\n' +        //对顶点进行矩阵变换
    '   vec3 lightDirection = normalize(vec3(0.0, 0.5, 0.7));\n' +   //指定光照的方向
    '   vec4 color = vec4(1.0, 0.4, 0.0, 1.0);\n' +                 //指定光的颜色
    '   vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);\n' +//计算我运动过程中的法向量，并归一化
    '   float nDotL = max(dot(normal, lightDirection), 0.0);\n' +       //及计算点积
    '   v_Color = vec4(color.rgb * nDotL + vec3(0.1), color.a);\n' +         //计算合成后的颜色
    '}\n';

//片元着色器
var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +      //指定float类型精度为中等精度
    '#endif\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '   gl_FragColor = v_Color;\n' +    //接收来自顶点着色器传过来的颜色（内插后）
    '}\n';


//主函数
function main() {
    //获取canvas元素节点
    var canvas = document.getElementById('webgl');

    //获取WEBGL上下文
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WEBGL');
        return;
    }

    // 初始化我的着色器
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders');
        return;
    }

    // 设置我的顶点位置和颜色信息
    var n = initVertexBuffers(gl);
    if (n < 0){
        console.log('Failed to set the vertex information.');
        return ;
    }

    //清空画布
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    //开启隐藏面消除
    gl.enable(gl.DEPTH_TEST);

    //实现我的绘制功能
    //1.获取我的模型视图投影矩阵 和逆转置矩阵
    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    if (!u_MvpMatrix || !u_NormalMatrix){
        console.log('Failed to get the location of u_MvpMatrix or u_NormalMatrix');
        return;
    }

    //计算我的模型矩阵
    var modelMatrix = new Matrix4();
    var mvpMatrix = new Matrix4();
    var normalMatrix = new Matrix4();
    var viewProjMatrix = new Matrix4();

    //1.计算模型矩阵
    modelMatrix.setRotate(45.0, 0.0, 1.0, 0.0);

    //2.计算视图投影矩阵
    viewProjMatrix.setPerspective(30.0, canvas.width/canvas.height, 1.0, 100.0);
    viewProjMatrix.lookAt(20.0, 10.0, 50.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

    //3.计算模型视图投影矩阵
    mvpMatrix.set(viewProjMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);


    //4.求出逆转置矩阵
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    //传给顶点着色器
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);


    //接下来在这里添加上键盘对手臂的控制
    document.onkeydown = function (ev) {
        keydown(ev, gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
    }


    //图形的绘制工作封装成一个函数
    draw(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);

}

//实现我的initVertexBuffers函数
function initVertexBuffers(gl) {
    //在这里设置我的立方体的顶点， 颜色， 和法向量信息
    // Create a cube：长：3， 宽：3， 高：10
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3
    var vertices = new Float32Array([
        1.5, 10.0, 1.5, -1.5, 10.0, 1.5, -1.5,  0.0, 1.5,  1.5,  0.0, 1.5, // v0-v1-v2-v3 front
        1.5, 10.0, 1.5,  1.5,  0.0, 1.5,  1.5,  0.0,-1.5,  1.5, 10.0,-1.5, // v0-v3-v4-v5 right
        1.5, 10.0, 1.5,  1.5, 10.0,-1.5, -1.5, 10.0,-1.5, -1.5, 10.0, 1.5, // v0-v5-v6-v1 up
        -1.5, 10.0, 1.5, -1.5, 10.0,-1.5, -1.5,  0.0,-1.5, -1.5,  0.0, 1.5, // v1-v6-v7-v2 left
        -1.5,  0.0,-1.5,  1.5,  0.0,-1.5,  1.5,  0.0, 1.5, -1.5,  0.0, 1.5, // v7-v4-v3-v2 down
        1.5,  0.0,-1.5, -1.5,  0.0,-1.5, -1.5, 10.0,-1.5,  1.5, 10.0,-1.5  // v4-v7-v6-v5 back
    ]);

    // 定义每一个面的法向量
    var normals = new Float32Array([
        0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0, // v0-v1-v2-v3 front
        1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0, // v0-v3-v4-v5 right
        0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0, // v0-v5-v6-v1 up
        -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // v1-v6-v7-v2 left
        0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0, // v7-v4-v3-v2 down
        0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0  // v4-v7-v6-v5 back
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

    //把数据在缓冲区中的操作与着色器中的操作封装成一个函数
    // num为每个顶点/法向量的分量个数
    if (!initArrayBuffer(gl, 'a_Position', vertices, gl.FLOAT, 3)){
        return -1;
    }
    if (!initArrayBuffer(gl, 'a_Normal', normals, gl.FLOAT, 3)){
        return -1;
    }

    //设置完成后， 取消缓冲区和目标对象之间的绑定
    gl.bindBuffer(gl.ARRAY_BUFFER, null);


    //开始把顶点的索引下标写入到缓冲区对象
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer){
        console.log('Failed to create the indexBuffer Object');
        return ;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return indices.length;
}

function initArrayBuffer(gl, attribute, data, type, num) {
    //1.创建缓冲区
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create buffer Object');
        return ;
    }
    //2.绑定缓冲区到目标对象
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    //3.向目标对象（缓冲区）中写入数据
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    //获取目标对象的属性
    var a_attribute = gl.getAttribLocation(gl.program, attribute);
    /*if (!a_attribute){        //注意对于attribute变量， 需要判断是否小于0， 确定是否获取attribute成功
    //对于uniform变量， 需要使用判断是否为空， 来确定它是否获取到uniform变量
        console.log('failed to get rhe storage of ' + attribute +' location');
        return ;
    }*/
    if (a_attribute < 0){
        console.log('failed to get rhe storage of ' + attribute +' location');
        return ;
    }

    //4.将整个缓冲区对象分配给attribute对象
    //a_Position： 指定待分配attribute变量的存储位置
    //2： 指定缓冲区中每个顶点的分量个书（1-4）；由于在缓冲区中我们只提供了x坐标和y坐标， 因此这里设置为2
    //gl.FLOAT： 用来指定数据格式
    //false： 表明是否将非浮点型的数据归一化到[0, 1] 或者 [-1, 1]区间
    //0： 指定相邻两个顶点之间的字节数
    //0： 指定缓冲区对象中的偏移量
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);

    //5.连接a_Position变量与分配给他的缓冲区对象（开启attribute变量， 使得缓冲区对attribute变量的分配生效）
    gl.enableVertexAttribArray(a_attribute);

    return true;
}


//这里是我的图形绘制工作
//初始化的工作放在外边来完成
var g_modelMatrix = new Matrix4();
var g_mvpMatrix = new Matrix4();
var g_normalMatrix = new Matrix4();
function draw(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
    //清空颜色和深度缓存
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //开始绘制arm1
    var arm1Length = 10.0;      //胳膊的长度
    g_modelMatrix.setTranslate(0.0, -12.0, 0.0);  //让原来的目标沿着Y轴负方向移动12个单位(现在这个矩阵只是一个平移变换矩阵)
    g_modelMatrix.rotate(g_arm1Angle, 0.0, 1.0, 0.0);       //让arm1转动起来
    g_mvpMatrix.set(viewProjMatrix);
    g_mvpMatrix.multiply(g_modelMatrix);        //上面的平移变换矩阵只有在这里乘上视图模型矩阵才会起作用
    //传给顶点着色器
    gl.uniformMatrix4fv(u_MvpMatrix, false, g_mvpMatrix.elements);

    //注意转动的过程中还要不断地修改逆转置矩阵.
    g_normalMatrix.setInverseOf(g_modelMatrix);
    g_normalMatrix.transpose();
    //传给顶点着色器
    gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

    //每次绘制完成一个胳膊， 就调用该函数来完成绘制工作
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);


    //开始绘制arm2
    g_modelMatrix.translate(0.0, arm1Length, 0.0);      //先把当前的目标设置成平移矩阵， 然后把这个平移矩阵向上移动arm1的长度（这个矩阵在这里已经起作用了）
    g_modelMatrix.rotate(g_joint1Angle, 0.0, 0.0, 1.0);
    g_modelMatrix.scale(1.4, 1.0, 1.4);
    g_mvpMatrix.set(viewProjMatrix);
    g_mvpMatrix.multiply(g_modelMatrix);
    //传给顶点着色器
    gl.uniformMatrix4fv(u_MvpMatrix, false, g_mvpMatrix.elements);

    //注意转动的过程中还要不断地修改逆转置矩阵.
    g_normalMatrix.setInverseOf(g_modelMatrix);
    g_normalMatrix.transpose();
    //传给顶点着色器
    gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

    //开始绘制(n表示顶点索引数组的长度， 指定索引数组开始绘制的位置为0)
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}



//在这里定义我旋转过程中需要的变量
var ANGLE_STEP = 3.0;           //每次按键增加的角度
var g_arm1Angle = -90;          //arm1旋转的角度
var g_joint1Angle = 0.0;         //arm2旋转的角度

//在这里实现我的按键响应函数
function keydown(ev, gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix){
    switch (ev.keyCode) {
        case 38: // Up arrow key -> the positive rotation of joint1 around the z-axis
            if (g_joint1Angle < 135.0)
                g_joint1Angle += ANGLE_STEP;
            break;
        case 40: // Down arrow key -> the negative rotation of joint1 around the z-axis
            if (g_joint1Angle > -135.0)
                g_joint1Angle -= ANGLE_STEP;
            break;
        case 39: // Right arrow key -> the positive rotation of arm1 around the y-axis
            g_arm1Angle = (g_arm1Angle + ANGLE_STEP) % 360;
            break;
        case 37: // Left arrow key -> the negative rotation of arm1 around the y-axis
            g_arm1Angle = (g_arm1Angle - ANGLE_STEP) % 360;
            break;
        default:
            return; // Skip drawing at no effective action
    }

    //按键按下以后再次调用我的绘制函数
    //图形的绘制工作封装成一个函数
    draw(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
}
