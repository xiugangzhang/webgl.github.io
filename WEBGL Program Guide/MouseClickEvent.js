//实现鼠标点击画布来绘制点数据
//顶点着色器
var VSHAER_SOURCE =
    'attribute float a_PointSize;\n'+
    'attribute vec4 a_Position;\n'+
    'void main() {\n' +
    '   gl_Position = a_Position;\n' +
    '   gl_PointSize = a_PointSize;\n' +
    '}\n';


//片元着色器
var FSHADER_SOURCE =
    'precision mediump float;\n'+       //这个不能少（使用了精度限定词来指定变量的范围（最大值和最小值）和精度）， 这里设置为中等精度
    'uniform vec4 u_FragColor;\n' +     //定义一个uniform变量
    'void main() {\n' +
    '  gl_FragColor = u_FragColor;\n' + // Set the point color
    '}\n';

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
    if (!gl){
        console.log("Failed to get the rendering context for WebGL.");
        return;
    }

    //初始化着色器
    if (!initShaders(gl, VSHAER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    //获取a_position的存储位置
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    //如果指定的attribute变量不存在（不能有gl_ 或webgl_前缀）
    if (a_Position < 0){
        console.log('Failed to grt the storage location of a_Position');
        return ;
    }

    //获取a_PointSize的存储位置
    var a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
    if (a_PointSize < 0){
        console.log('Failed to grt the storage location of a_PointSize');
        return ;
    }


    //获取u_FragColor的存储位置
    var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    //如果没有获取到颜色数据
    if (!u_FragColor){
        console.log('Failed to grt  u_FragColor variable');
        return ;
    }


    //注册鼠标点击的响应事件(匿名函数)-----绘制顶点
    /*canvas.onmousedown = function (ev) {
        click(ev, gl, canvas, a_Position);
    }*/

    //绘制顶点的同时修改颜色
    canvas.onmousedown = function (ev) {
        click(ev, gl, canvas, a_Position, u_FragColor, a_PointSize);
    }



    //指定清除颜色缓冲区的颜色。(WEBGL中秦空绘图区之前得先指定背景颜色)(设定canvas的背景色)
    gl.clearColor(1.0, 1.0, 0.0, 1.0);
    //用指定的颜色清除颜色缓冲区（之前指定的颜色清空）
    gl.clear(gl.COLOR_BUFFER_BIT);
}

//定义一个鼠标点击位置的数组
var g_points = [];
//存储颜色的数组
var g_colors = [];
//定义一个点的大小的数组
var g_pointSizes = [];


//点击事件的实现
function click(ev, gl, canvas, a_Position, u_FragColor, a_PointSize) {
    var x = ev.clientX;
    var y = ev.clientY;
    //alert('x=='+x+' y=='+y);

    //获取canvas在浏览器客户区中的坐标
    //x-rect.left, y-rect.top, 将客户区的坐标准换为 <canvas> 下的坐标
    var rect = ev.target.getBoundingClientRect();
    //开始实现从<canvas>下的坐标向 WEBGL下的坐标的转换
    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    //y = (canvas.height/2 - (y - rect.top)/(canvas.height/2)); //error
    y = (canvas.height/2 - (y-rect.top))/(canvas.height/2);


    //将x, y坐标存储在g_points数组中
    //数组中坐标的存放格式：gl_points[0], gl_points[1], gl_points[2], gl_points[3],………………
    //存放的数据：            x1               y1            x2          y2
    //g_points.push(x);
    //g_points.push(y);

    //对上面的代码进行优化， 可以使用在数组中存放数组的方法去存入数据
    g_points.push([x, y]);    //此时我们就可以一次性将点击的坐标位置存入到数组中去

    //将点的颜色存储到g_colors中去
    if (x >= 0.0 && y >=0.0){
        //第一象限
        g_colors.push([1.0, 0.0, 0.0, 1.0]);
        g_pointSizes.push([10.0]);
    } else if (x < 0.0 && y< 0.0){
        //第三象限
        g_colors.push([0.0, 1.0, 0.0, 1.0]);
        g_pointSizes.push([30.0]);
    } else if (x < 0.0 && y > 0) {
        //第二象限
        g_colors.push([1.0, 1.0, 1.0, 1.0]);
        g_pointSizes.push([45.0]);
    } else {
        g_colors.push([1.0, 0.0, 1.0, 1.0]);
        g_pointSizes.push([50.0]);
    }



    //清空画布
    //gl.clearColor(1, 0, 0, 1);
    //这里如果不清空缓存区， WEBGL绘制玩一次点之后， 就会把颜色恢复成为了默认颜色（0.0， 0.0， 0.0， 0.0）
    //此时颜色会变成了透明颜色， 因此为了保证画布的一致性， 需要手动地在这里用我们自定义的颜色去清空缓存区
    gl.clear(gl.COLOR_BUFFER_BIT);

    var len = g_points.length;
    //方法一：注意数组中每两个点才是一组x，y数据
    /*for (var i=0; i<len; i+=2){
        //把点的位置传递到a_Position中去（把顶点位置传递给attribute变量）
        gl.vertexAttrib3f(a_Position, g_points[i], g_points[i+1], 0.0);

        //开始绘制点
        gl.drawArrays(gl.POINTS, 0, 1);
    }*/
    //方法二; 注意和方法一的区别
    for (var i=0; i<len; i++){
        //这里相当于是使用了二维数组， 直接可以设定第I个点的坐标的属性值（包括点的大小、颜色、及其尺寸）
        //开始取出数组中的坐标数据
        var xy = g_points[i];
        //开始取出数组中的颜色数据
        var rgba = g_colors[i];
        //开始取出点的大小的数据
        var pointSize = g_pointSizes[i];


        //每一个数组中存放了XY这两个坐标
        gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);

        //把点的颜色输出到片元着色器中去(分别取出数组中的rgb数据赋值到片元着色器)
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        //把点的大小放入到顶点着色器中去
        gl.vertexAttrib1f(a_PointSize, pointSize[0]);
        //alert(g_pointSizes.length);

        //开始绘制(绘制方式， 从哪个点开始绘制， 指定绘制需要用到几个顶点)
        gl.drawArrays(gl.POINTS, 0, 1);
    }
}