//开始向多维度图形进攻
// ClickedPints.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'varying  vec4 v_Color;\n' +        //这里是一个varying变量（与顶点无关）[float类型及相关的vec, mat 类型]
    'void main() {\n' +
    '  gl_Position = a_Position;\n' +
    '  gl_PointSize = 10.0;\n' +
    '  v_Color = a_Color;\n' +      //将数据传输给片元着色器
    '}\n';


//党顶点着色器执行完毕之后， 就会开始逐个片元的处理（逐个像素处理数据）
// Fragment shader program
var FSHADER_SOURCE =
    'precision mediump float;\n' +      //注意这里需要对片元着色器进行精度描述， 否则会出现错误
    'uniform float u_Width;\n' +
    'uniform float u_Height;\n' +
    'varying  vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_FragColor = v_Color;\n' +     //从顶点着色器接受数据（这样会使得每一个顶点的颜色都会被修改）
    //'  gl_FragColor = vec4(gl_FragCoord.x/u_Width, 0.0, gl_FragCoord.y/u_Height, 1.0);\n' +
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


    //设置顶点位置(创建顶点缓冲区对象)----返回待绘制顶点的数量， 保存在变量n中
    var n = initVertexBuffers(gl);
    if (n < 0){
        console.log("Failed to set the position of the vertices");
        return ;
    }


    // Specify the color for clearing <canvas>
    gl.clearColor(1.0, 1.0, 0.0, 1.0);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    //绘制三个点：此时顶点着色器会被执行三次。（这里；利用initVertexBuffers函数中的缓冲区对象向顶点着色器中传输了多个顶点的数据）
    //从缓冲区的第一个坐标开始画， 总共画出来3个点
    //gl.drawArrays(gl.POINTS, 0, n);  //绘制n个点（n=3）
    //1.几何图形装配过程（图元装配）；将鼓励的顶点坐标装配成集合图形
    // 2.光栅化过程：将装配好的几何图形转换为片元
    gl.drawArrays(gl.TRIANGLES, 0, n);
}



//这里讲位置数据和尺寸数据一块打包在一块
function initVertexBuffers(gl) {

    //创建一个缓冲区， 向其中写入顶点数据（是一种特殊的JavaScript数组）和 颜色数据
    var verticesColors = new Float32Array([
        0.0, 0.5,  1.0, 0.0, 0.0,     //第一个点的位置和颜色
        -0.5, -0.5, 0.0, 1.0, 0.0,  //第二个点的位置和颜色
        0.5, -0.5,  0.0, 0.0, 1.0     //第三个点的位置和颜色
    ]);

    var n = 3;  //设置顶点的个数


    //1.创建缓冲区对象
    var vertexColorBuffer = gl.createBuffer();           //此外， 可以使用gl.deleteBuffer(buffer)函数删除已经创建出来的缓冲区对象
    if (!vertexColorBuffer){
        //创建失败
        console.log('Failed to create the vertexColorBuffer object');
        return -1;
    }


    //2.将缓冲区对象绑定到目标（向顶点着色器提供传给attribute变量的数据）
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);

    //3.开辟空间并向缓冲区对象写入数据：将vertices中的数据写入绑定到第一个参数gl.ARRAY_BUFFER上的缓冲区对象
    //注意这里的verticesSizes是一个类型化数组（通常用来存储顶点的坐标或者是颜色数组； 里面存储的元素都是同一种数据类型）， 但是类型化数组不支持push()和pop()方法
    //gl.STATIC_DRAW表示只会向缓冲区对象中写入头一次数据， 但需要绘制很多次
    //gl.bufferData(gl.ARRAY_BUFFER, verticesSizesBuffer, gl.STATIC_DRAW);   error
    gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);


    //获取类型化数组中每个元素所占的字节数
    var FSIZE = verticesColors.BYTES_PER_ELEMENT;

    // 获取attitude变量的地址
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }


    //4.将整个缓冲区对象分配给a_Position对象(分配给一个attribute变量)
    //a_Position： 指定待分配attribute变量的存储位置
    //2： 指定缓冲区中每个顶点的分量个数（1-4）；由于在缓冲区中我们只提供了x坐标和y坐标， 因此这里设置为2
    //gl.FLOAT： 用来指定数据格式
    //false： 表明是否将非浮点型的数据归一化到[0, 1] 或者 [-1, 1]区间
    //0： 指定相邻两个顶点之间的字节数（每一个顶点有三个数据值， 因此Stride大小为每一项数据大小的三倍）
    //0： 指定缓冲区对象中的偏移量（顶点坐标的数据是放在最前面， 所以offset为0）
    //【这里在缓冲区对象中存储了两种类型的数据】
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 5, 0);

    //将颜色缓冲区传过去
    var Width = gl.drawingBufferWidth;
    var Height = gl.drawingBufferHeight;

    //获取高度和宽度
/*    var u_Width = gl.getUniformLocation(gl.program, 'u_Width');
    var u_Height = gl.getUniformLocation(gl.program, 'u_Height');
    if (!u_Width || !u_Height){
        console.log('Failed to get the storage location of u_Width or u_Height');
        return -1;
    }
    //开始膝盖
    gl.uniform1f(u_Width, Width);
    gl.uniform1f(u_Height, Height);
*/


    //5.连接a_Position变量与分配给他的缓冲区对象（开启attribute变量， 使得缓冲区对attribute变量的分配生效）
    //这里也可以使用    gl.disableVertexAttribArray(a_Position)来关闭分配
    gl.enableVertexAttribArray(a_Position);



    //获取a_PointSize的存储位置， 分配缓冲区并开启
    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if (a_Color < 0) {
        console.log('Failed to get the storage location of a_Color');
        //这里出错了就返回一个人负数
        return -1;
    }

    //注意这里点的迟迅大小的分量个数为1
    //此处两个顶点之间的数据项任然是每一项数据的三倍（FSIZE * 3）
    //顶点的尺寸数据是放在第三个位置， 因此每一项数据从FSIZE * 2 开始
    //gl.vertexAttribPointer(a_Color, 1, gl.FLOAT, false, FSIZE * 5, FSIZE * 2);  error
    //注意这里需要设置每一个顶点的分量个数为3（一种颜色有三个分量构成的）
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 5, FSIZE * 2);

    //5.连接a_Position变量与分配给他的缓冲区对象（开启attribute变量， 使得缓冲区对attribute变量的分配生效）
    //这里也可以使用    gl.disableVertexAttribArray(a_Position)来关闭分配
    gl.enableVertexAttribArray(a_Color);




    return n;
}
