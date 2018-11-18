//对多边形实现纹理贴图(两个纹理图像)
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +        //图形的坐标位置
    'attribute vec2 a_TexCoord;\n' +        //这里定义的是纹理坐标（先把纹理坐标传递给顶点着色器， 然后经过图形装配和光山化操作之后传递给片元着色器）
    'varying vec2 v_TexCoord;\n' +
    'void main() {\n' +
    '  gl_Position = a_Position;\n' +
    '  v_TexCoord = a_TexCoord;\n' +
    '}\n';

// Fragment shader program
var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'uniform sampler2D u_Sampler0;\n' +      //纹理图像不会随着片元变化（这里是一种特殊工艺的，专门用于处理纹理对象的数据类型， 二维纹理就使用samper2D）//如果是三维纹理， 就使用samperCube
    'uniform sampler2D u_Sampler1;\n' +
    'varying vec2 v_TexCoord;\n' +          //这里的纹理坐标室友顶点着色器中的varying变量传递过来的（这里使用的是内插后的纹理坐标）
    'void main() {\n' +
    '  vec4 color0 = texture2D(u_Sampler0, v_TexCoord);\n' +
    '  vec4 color1 = texture2D(u_Sampler1, v_TexCoord);\n' +
    '  gl_FragColor = color0 * color1;\n' +        //将两个矢量中对应的分量相乘作为新的矢量的分量（r1*r2, g1*r2, b1*b2, a1*a2）
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

    // 设置顶点信息
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // 配置纹理
    if (!initTextures(gl, n)) {
        console.log('Failed to intialize the texture.');
        return;
    }
}


//设置顶点的纹理坐标
function initVertexBuffers(gl) {
    //定义一个顶点纹理坐标数组
    var verticesTexCoords = new Float32Array([
        // 顶点坐标， 纹理坐标
        -0.5,  0.5,   0.0, 1.0,
        -0.5, -0.5,   0.0, 0.0,
        0.5,  0.5,   1.0, 1.0,
        0.5, -0.5,   1.0, 0.0,
    ]);



    var n = 4; // The number of vertices

    // 将顶点坐标和纹理坐标写入到缓冲区对象
    var vertexTexCoordBuffer = gl.createBuffer();
    if (!vertexTexCoordBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    // 绑定目标对象到缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexCoordBuffer);
    //向目标对象自如数据（将顶点坐标和纹理坐标写入到缓冲区对象）
    gl.bufferData(gl.ARRAY_BUFFER, verticesTexCoords, gl.STATIC_DRAW);

    //计算每个类型化数组中元素的大小
    var FSIZE = verticesTexCoords.BYTES_PER_ELEMENT;


    //获取顶点坐标的存储位置
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }

    //每个顶点的分量个数为2
    //每一项数据有4个
    //顶点数据在刚开始的位置（0）
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 4, 0);
    gl.enableVertexAttribArray(a_Position);  // Enable the assignment of the buffer object

    // 获取纹理坐标的存储位置
    var a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
    if (a_TexCoord < 0) {
        console.log('Failed to get the storage location of a_TexCoord');
        return -1;
    }


    // 每个纹理的分量个数为2
    //每一项数据有4个
    //缓冲区对象的偏移量为2
    gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
    gl.enableVertexAttribArray(a_TexCoord);  // Enable the assignment of the buffer object

    return n;
}


//纹理对象的创建（准备待加载的纹理图像， 令浏览器读取它）
function initTextures(gl, n) {
    //创建2个纹理对象
    var texture0 = gl.createTexture();
    var texture1 = gl.createTexture();
    if (!texture0 || !texture1) {
        console.log('Failed to create the texture0 or texture1 object');
        return false;
    }

    // 获得 u_Sampler 的存储位置；（输入纹理坐标， 返回颜色值， Samper就是一个取样器）
    var u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    var u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
    if (!u_Sampler0 || !u_Sampler1) {
        console.log('Failed to get the storage location of u_Sampler0 or u_Sampler1');
        return false;
    }

    //创建一个image对象
    var image0 = new Image();
    var image1 = new Image();
    if (!image0 || !image1) {
        console.log('Failed to create the image0 or image1 object');
        return false;
    }

    // 注册加载事件的响应函数（一旦图像加载完成， 就在WEBGL系统中使用纹理）
    //这里顺带把图片的下标传过去(纹理单元的编号)
    image0.onload = function(){
        loadTexture(gl, n, texture0, u_Sampler0, image0, 0);
    };
    image1.onload = function(){
        loadTexture(gl, n, texture1, u_Sampler1, image1, 1);
    };



    //请求浏览器开始加载图像（将该属性赋值为图像文件的路径和名称来告诉浏览器奶开始加载图像）
    image0.src = '../resources/sky.jpg';     //这里相当于是<img src="../resources/sky.jpg" />
    //image.src = 'http://h.hiphotos.baidu.com/exp/w=500/sign=d426fd31d858ccbf1bbcb53a29dabcd4/d788d43f8794a4c21ae6b3a807f41bd5ac6e396f.jpg';

    image1.src = '../resources/circle.gif';
    return true;
}



//标记纹理单元是否已经准备就绪（加载图片的过程是异步的， 无法知道拿衣服图片先被加载完成）
var g_texUnit0 = false, g_texUnit1 = false;

//配置纹理供WEBGL使用
function loadTexture(gl, n, texture, u_Sampler, image, texUnit) {
    //对纹理图像进行Y轴反转（由于WEBGL纹理坐标系统中的t轴的方向和PGN， BMP， JPG等格式图片的坐标系统的Y轴方向是相反的）
    //1表示非0（TRUE）， 0表示假（FALSE）
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

    // 开启0号纹理单元（通过纹理单元的机制来同时使用多个纹理， 支持8个， 数字表示纹理单元的编号）
    if (texUnit == 0){
        //激活第一张图片
        gl.activeTexture(gl.TEXTURE0);
        g_texUnit0 = true;
    } else {
        //激活第二张图片
        //gl.activeTexture(gl.TEXTURE2);  //error
        //纹理单元的编号是从0开始的， 0  1 2 3 4 5 6 7 8 ………………
        gl.activeTexture(gl.TEXTURE1);
        g_texUnit1 = true;
    }

    // 向target绑定纹理对象（WEBGL支持二维纹理和立方体文亮两种类型， texture表示我要绑定的纹理单元）
    gl.bindTexture(gl.TEXTURE_2D, texture);


    //配置纹理对象的参数（以此来设置纹理图像映射到图形上的具体方式）
    //如何更具纹理坐标获取纹理颜色， 按照那种方式来重复填充纹理？？？
    //target: gl.TEXTURE_2D, 或者是gl.TEXTURE_CUBE_MAP
    //pname: 放大方法， 缩小方法， 水平填充方法， 垂直填充方法
    //param：
    //      1.gl.NEAREST: 使用原纹理上距离新像素中心最近的那个像素的颜色值
    //      2.gl.LINEAR: 使用距离新像素中心最近的四个像素的颜色值的加权平均值（质量更好， 开销大）
    //      4.gl.REPEAT: 平铺式的重复纹理
    //      5.gl.MIRRORED_REPEAT: 镜像对城市的重复纹理
    //      6.gl.CLAMP_TO_EDGE: 使用纹理图像边缘值
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    // 配置纹理图像（将纹理图像分配给纹理对象）--此时image图像就从JavaScript中传入到WEBGL系统中了
    //target：
    //level: 没有用到金字塔纹理就用0
    //internalformat: 图像的内部格式（PNG格式的图像这里就使用gl.RGBA; JPG和BMP格式的图像这里就使用gl.RGB）
    //format ; 纹理数据的格式(WEBGL  中， internalformat必须和format一样)
    //type: 纹理数据的类型（gl.UNSIGNED_BYTE每个颜色分量占据一个字节）
    //image: 包含纹理图像的Image对象
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);


    // 将0号纹理和1号纹理传递给片元着色器中中的取样器变量u_Sampler0和u_samper1
    // gl.uniform1i(u_Sampler, 0);
    //gl.uniform1i(u_Sampler, 1)
    gl.uniform1i(u_Sampler, texUnit);

    //清空画布
    gl.clear(gl.COLOR_BUFFER_BIT);


    //如果两个纹理单元都已经准备好了， 那么我就开始绘制
    //开始绘制矩形（两幅纹理图像都完成加载的时候）
    if (g_texUnit0 && g_texUnit1){
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
    }

}
