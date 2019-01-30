//定义两个全局变量
//顶点着色器
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n'+     //声明了一个attribute变量（存储限定符）， attribute变量必须声明为全局变量， 数据从着色器外部传给该变量
    'void main() {\n' +
    '  gl_Position = a_Position;\n' + // Set the vertex coordinates of the point； 将声明的变量赋值给gl_position
    '  gl_PointSize = 10.0;\n' +                    // Set the point size
    '}\n';

//片元着色器
var FSHADER_SOURCE =
    'void main() {\n' +
    '  gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);\n' + // Set the point color
    '}\n';


//DrawRectangle.js （JavaScript脚本执行文件）
function main() {
    //获取canvas元素
    var canvas = document.getElementById('webgl');
    //如果执行结果为假， 就会执行下面的语句
    if (!canvas){
        console.log("Failed to retrieve the <canvas> element!");
        //直接退出
        return ;
    }
    //获取WebGL绘图上下文。
    var gl = getWebGLContext(canvas);

    //获取二维图形的绘图上下文(通过这种上下文机制来绘制图形， 2D, 3D)
   // var ctx = canvas.getContext('2d');
    //如果ctx为真，就会执行下面的语句
    /*if (ctx){
        console.log("ctx get ok!");
    }*/


    //如果浏览器不支持WebGL则提示错误。
    if (!gl) {
        console.log("Failed to get the rendering context for WebGL.");
        return;
    }

    //gl.fillStyle = 'rgba(255, 0, 255, 1.0)';
    //gl.fillText("1212", 10, 10);  //error



    // Initialize shaders(指定渲染上下文， 顶点着色器， 片元着色器)
    // 注意着色器是运行在WEBGL系统中， 而不是在JavaScript中的
    //在这里完成着色器的初始化操作
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    //获取attribute变量的存储位置（从而通过这个地址向变量传输数据）
    //gl.program 是一个程序对象， 包括了顶点着色器和片元着色器， 第二个参数是要获取存储地址的attribute的变量的名称
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    //如果指定的attribute变量不存在（不能有gl_ 或webgl_前缀）
    if (a_Position < 0){
        console.log('Failed to grt the storage location of a_Position');
        return ;
    }

    //方法一：通过获取的额attribute变量的地址将顶点位置传输给attribute变量（X,Y,z），这种方法会自动将第四个参数设置为1.0（VEC4）
    gl.vertexAttrib3f(a_Position, 0.0, 0.0, 0.0);

    //方法二：矢量数组方法传值
    var position = new Float32Array([1.0, 2.0, 3.0, 1.0]);
    gl.vertexAttrib4fv(a_Position, position);


    //指定清除颜色缓冲区的颜色。(WEBGL中秦空绘图区之前得先指定背景颜色)(设定canvas的背景色)
    gl.clearColor(1,1,0,1);
    //用指定的颜色清除颜色缓冲区（之前指定的颜色清空）
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw a point（绘制一个点， 从第一个顶点开始绘制， 指定绘制的顶点数量为1）
    // 绘制的过程中， 顶点着色器会执行一次（顶点着色器每一次会绘制一个顶点）
    gl.drawArrays(gl.POINTS, 0, 1);


    //绘制蓝色图形(并且设置为不透明)
    //ctx.fillStyle = 'rgba(255, 0, 255, 1.0)';
    // x y  w h （使用颜色来来填充矩形）
    //ctx.fillRect(10, 10, 150, 150);
}
