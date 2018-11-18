//动画的实现
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +                //【这里之所以使用uniform的原因， 是由于这两个变量的值与顶点无关】
    'uniform mat4 u_ModelMatrix;\n' +               //u_ModelMatrix是一个模型变换矩阵
    'void main() {\n' +
    '  gl_Position = u_ModelMatrix * a_Position;\n'+            //用模型变换矩阵乘当前矩阵
    '}\n';



// Fragment shader program
var FSHADER_SOURCE =
    'void main() {\n' +
    '  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' +
    '}\n';


//在这里定义一个全局变量， 旋转速度(三角形每秒旋转的角度)， 单位是：度 / s
//注意这里的单位是： 度/s（后面需要把毫秒进行单位的转换）
var ANGLE_STEP = 45.0;

//主函数
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


    //设置顶点位置(创建顶点缓冲区对象)----返回待绘制顶点的数量， 保存在变量n中
    var n = initVertexBuffers(gl);
    if (n < 0){
        console.log("Failed to set the position of the vertices");
        return ;
    }

    //设置<canvas>的背景色
    gl.clearColor(1.0, 1.0, 0.0, 1.0);



    //获取模型矩阵的存储位置， 并且传输给顶点着色器(将模型矩阵传输给顶点着色器)
    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix){
        console.log('Failed to load u_ModelMatrix variable');
        return ;
    }



    //设置三角形当前的旋转角度（表示每一次绘制的时候， 三角形相对于初始状态的旋转角度值）
    var currentAngle = 0.0;

    //创建matrix4对象来进行模型变换
    var modelMatrix = new Matrix4();

    //开始绘制三角形
    var tick = function () {
        //更新三角形的旋转角（把当前的旋转角度传递过去）
        currentAngle = animate(currentAngle); //(不断地更新当前角度)

        //这里是我自定义的绘图函数(在这里绘制我的三角形)
        draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix);

        //请求浏览器再次调用tick（高度浏览器在将来的摸一个时间调用作为第一个参数的函数（tick(）函数））
        //这里需要取消请求， 就需要调用cancelAnimationFrame()函数;(在适当的实际去调用参数函数)
        //【t2-t1 ≠ t1-t0】, 导致了调用tick()函数的时间间隔不固定， 如果每次增加一个固定角度，会导致不可控制的加速或者减速的旋转效果
        requestAnimationFrame(tick);
    }

    //在这里直接调用tick()函数， 可以实现这个函数反复被调用
    tick();

}


function initVertexBuffers(gl) {

    //创建一个缓冲区， 向其中写入顶点数据（是一种特殊的JavaScript数组）
    var vertices = new Float32Array([
        0.0, 0.5,
        -0.5, -0.5,
        0.5, -0.5
    ]);


    var n = 3;  //设置顶点的个数

    //1.创建缓冲区对象
    var vertexBuffer = gl.createBuffer();           //此外， 可以使用gl.deleteBuffer(buffer)函数删除已经创建出来的缓冲区对象
    if (!vertexBuffer){
        //创建失败
        console.log('Failed to create the buffer object');
        return -1;
    }
    //2.将缓冲区对象绑定到目标（向顶点着色器提供传给attribute变量的数据）
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    //3.开辟空间并向缓冲区对象写入数据：将vertices中的数据写入利润绑定到第一个参数gl.ARRAY_BUFFER上的缓冲区对象
    //注意这里的vertices是一个类型化数组（通常用来存储顶点的坐标或者是颜色数组； 里面存储的元素都是同一种数据类型）， 但是类型化数组不支持push()和pop()方法
    //gl.STATIC_DRAW表示只会向缓冲区对象中写入头一次数据， 但需要绘制很多次
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // 获取attitude变量的地址
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }


    //4.将整个缓冲区对象分配给a_Position对象(分配给一个attribute变量)
    //a_Position： 指定待分配attribute变量的存储位置
    //2： 指定缓冲区中每个顶点的分量个书（1-4）；由于在缓冲区中我们只提供了x坐标和y坐标， 因此这里设置为2
    //gl.FLOAT： 用来指定数据格式
    //false： 表明是否将非浮点型的数据归一化到[0, 1] 或者 [-1, 1]区间
    //0： 指定相邻两个顶点之间的字节数
    //0： 指定缓冲区对象中的偏移量
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

    //5.连接a_Position变量与分配给他的缓冲区对象（开启attribute变量， 使得缓冲区对attribute变量的分配生效）
    //这里也可以使用    gl.disableVertexAttribArray(a_Position)来关闭分配
    gl.enableVertexAttribArray(a_Position);

    return n;
}


//定义绘制的函数
function draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix) {
    //设置当前的模型矩阵为我的旋转矩阵（计算旋转矩阵， 然后将结果写入到modelMatrix中去）
    modelMatrix.setRotate(currentAngle, 0, 0, 1);

    //将旋转矩阵传输给顶点着色器
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    //请空画布
    gl.clear(gl.COLOR_BUFFER_BIT);

    //绘制三角形
    gl.drawArrays(gl.TRIANGLES, 0, n);
}


//记录上一次调用函数的时刻
var g_last = Date.now();

//更新旋转角
function animate(angle) {
    //计算距离上一次调用经过的时间
    var now = Date.now();
    //得到上次调用与本次调用的时间间隔
    var elapsed = now - g_last; //毫秒
    //这里计算出来的时间都是毫秒
    //onsole.log(g_last+'   '+now+'   '+elapsed);

    //将本次设置为上一次
    g_last = now;

    //根据距离上一次调用的时间， 更新当前的旋转角度
    //【t2-t1 ≠ t1-t0】
    //这一帧中三角形的旋转角度就由elapsed时间间隔来决定
    //由于Date对象的Now方法默认单位是毫秒（1/1000）
    var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;

    //var newAngle = angle + 2;
    //返回这一帧的旋转角要保证它始终小于360度
    return newAngle %= 360;
}


