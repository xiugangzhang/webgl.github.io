//开始向多维度图形进攻(实现图形的运动)
// ClickedPints.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'uniform vec4 u_Translation;\n' +           //注意这里由于Tx， Ty, Tz对于所有的顶点来说是固定的， 伊霓裳使用uniform变量来表示三角形 的平移距离
    'void main() {\n' +
    '  gl_Position = a_Position + u_Translation;\n' +       //特别注意:这里的变量的赋值操作只能发生在相同类型的变量之间
    //'  gl_PointSize = 10.0;\n' +        注意设置点的尺寸大小只有在绘制单个点的时候才会起作用
    '}\n';

// Fragment shader program
var FSHADER_SOURCE =
    'void main() {\n' +
    '  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' +
    '}\n';


//定义在XYZ上平移的距离
var Tx = 0.0, Ty = 0.5, Tz = 0.0;



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

    //将平移距离传输给顶点着色器
    var u_Translation = gl.getUniformLocation(gl.program, 'u_Translation');
    if (!u_Translation){
        console.log('Failed to load u_Translation variable');
        return ;
    }

    //开始平移（注意这里接受的是其次坐标， 因此我们把最后一个参数设置为0.0）
    //注意坐标平移后的坐标第四分量w1+w2也必须是1.0(点的位置坐标平移之后还会是一个点的位置坐标， 由于w1本身是1.0， 因此w2只能就是0.0)
    //齐次坐标：（x, y, z, w）等价于 三维坐标（x/w, y/w, z/w）, 如果w的值趋于0， 那么表示的就是无穷远的点
    gl.uniform4f(u_Translation, Tx, Ty, Tz, 0.0);


    // Specify the color for clearing <canvas>
    gl.clearColor(1.0, 1.0, 0.0, 1.0);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    //绘制三个点（这里；利用initVertexBuffers函数中的缓冲区对象向顶点着色器中传输了多个顶点的数据）
    //从缓冲区的第一个坐标开始画， 总共画出来3个点
    //绘制我的第一个三角形
    gl.drawArrays(gl.TRIANGLES, 0, n);  //绘制n个点（n=3）

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
