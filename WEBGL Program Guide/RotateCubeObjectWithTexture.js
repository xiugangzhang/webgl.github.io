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
    'attribute vec2 a_TexCoord;\n' +
    'varying vec2 v_TexCoord;\n' +
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
    '  v_TexCoord = a_TexCoord;\n' +
    '}\n';

// Fragment shader program
var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'varying vec4 v_Color;\n' +
    'uniform sampler2D u_Sampler;\n' +
    'varying vec2 v_TexCoord;\n' +
    'void main() {\n' +
    //'  gl_FragColor = v_Color;\n' +
    '  gl_FragColor = texture2D(u_Sampler, v_TexCoord) + v_Color*0.3;\n' +      //在这里还可以实现颜色和纹理的混合效果
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
    gl.uniform3f(u_LightColor, 0.0, 1.0, 0.0);
    // 设置光源的位置
    gl.uniform3f(u_LightPosition, 2.3, 4.0, 3.5);
    // 设置环境光的颜色
    gl.uniform3f(u_AmbientLight, 0.3, 0.3, 0.3);

    //定义运动需要的变量
    var currentAngle = 0.0;              //当前的角度

    var currentMoveAngle = [0.0, 0.0];
    initEventHandlers(canvas, currentMoveAngle);

    //设置我的纹理信息
    if (!initTextures(gl)) {
        console.log('Failed to intialize the texture.');
        return;
    }



    var modelMatrix = new Matrix4();    //模型矩阵
    var mvpMatrix = new Matrix4();      //模型视图投影矩阵
    var normalMatrix = new Matrix4();   //逆转置矩阵

    /**
     * 实现我的鼠标移动控制功能
     */

    /**
     * 20171008   实现了三维图形的旋转操作（函数封装之后）
     */
    var tick = function () {


        currentAngle = animate(currentAngle);   //更新当前的角度
        draw(gl, n, currentMoveAngle, modelMatrix, vpMatrix, normalMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, currentAngle);

        //计算模型矩阵
        /*modelMatrix.setRotate(currentAngle, 0, 1, 0);
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
        gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);*/

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


    //纹理坐标
    var texCoords = new Float32Array([   // Texture coordinates
        1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v0-v1-v2-v3 front
        0.0, 1.0,   0.0, 0.0,   1.0, 0.0,   1.0, 1.0,    // v0-v3-v4-v5 right
        1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0,    // v0-v5-v6-v1 up
        1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v1-v6-v7-v2 left
        0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,    // v7-v4-v3-v2 down
        0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0     // v4-v7-v6-v5 back
    ]);


    // Write the vertex property to buffers (coordinates, colors and normals)
    if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

    //初始化我的纹理坐标
    if (!initArrayBuffer(gl, 'a_TexCoord', texCoords, 2, gl.FLOAT)) return -1;



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

//实现我的事件响应函数
function initEventHandlers(canvas, currentAngle) {
    var dragging = false;         // Dragging or not
    var lastX = -1, lastY = -1;   // Last position of the mouse

    canvas.onmousedown = function(ev) {   // Mouse is pressed
        var x = ev.clientX, y = ev.clientY;
        // Start dragging if a moue is in <canvas>
        var rect = ev.target.getBoundingClientRect();
        if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
            lastX = x; lastY = y;
            dragging = true;
        }
    };

    canvas.onmouseup = function(ev) {
        dragging = false;
    }; // Mouse is released

    canvas.onmousemove = function(ev) { // Mouse is moved
        var x = ev.clientX, y = ev.clientY;
        if (dragging) {
            var factor = 100/canvas.height; // The rotation ratio
            var dx = factor * (x - lastX);
            var dy = factor * (y - lastY);
            // Limit x-axis rotation angle to -90 to 90 degrees
            currentAngle[0] = Math.max(Math.min(currentAngle[0] + dy, 90.0), -90.0);
            currentAngle[1] = currentAngle[1] + dx;
        }
        lastX = x, lastY = y;
    };
}




//封装我的绘图函数
var mvpMatrix = new Matrix4();
function draw(gl, n, currentMoveAngle, modelMatrix, vpMatrix, normalMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, currentAngle) {
    currentAngle = animate(currentAngle);   //更新当前的角度

    //计算模型矩阵
    modelMatrix.setRotate(currentAngle, 0, 1, 0);

    //把当前移动的角度传过去
    modelMatrix.rotate(currentMoveAngle[0], 1.0, 0.0, 0.0);
    modelMatrix.rotate(currentMoveAngle[1], 0.0, 1.0, 0.0);


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
}

//实现我的纹理加载函数（配置和加载我的纹理）
function initTextures(gl) {
    // 创建一个纹理对象
    var texture = gl.createTexture();
    if (!texture) {
        console.log('Failed to create the texture object');
        return false;
    }

    // 从片元着色器中获取对象
    var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
    if (!u_Sampler) {
        console.log('Failed to get the storage location of u_Sampler');
        return false;
    }

    // Create the image object
    var image = new Image();
    if (!image) {
        console.log('Failed to create the image object');
        return false;
    }
    // Register the event handler to be called when image loading is completed
    image.onload = function(){
        loadTexture(gl, texture, u_Sampler, image);
    };
    // Tell the browser to load an Image
    image.src = '../resources/woodbox.bmp';

    return true;
}

function loadTexture(gl, texture, u_Sampler, image) {
    //对纹理图像进行Y轴反转（由于WEBGL纹理坐标系统中的t轴的方向和PGN， BMP， JPG等格式图片的坐标系统的Y轴方向是相反的）
    //1表示非0（TRUE）， 0表示假（FALSE）
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    // 开启0号纹理单元（通过纹理单元的机制来同时使用多个纹理， 支持8个， 数字表示纹理单元的编号）
    gl.activeTexture(gl.TEXTURE0);
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
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);   //s轴纹理外填充了最边缘纹素的颜色
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);  //t轴重复镜像纹理


    // 配置纹理图像（将纹理图像分配给纹理对象）--此时image图像就从JavaScript中传入到WEBGL系统中了
    //target：
    //level: 没有用到金字塔纹理就用0
    //internalformat: 图像的内部格式（PNG格式的图像这里就使用gl.RGBA; JPG和BMP格式的图像这里就使用gl.RGB）
    //format ; 纹理数据的格式(WEBGL  中， internalformat必须和format一样)
    //type: 纹理数据的类型（gl.UNSIGNED_BYTE每个颜色分量占据一个字节）
    //image: 包含纹理图像的Image对象
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    // 将0号纹理传递给片元着色器中中的取样器变量u_Sampler
    gl.uniform1i(u_Sampler, 0);

}

