#### 动起来的四锥体和立方体
<p><iframe style="width: 100%; height: 520px; text-align:center;" src="/nehe_webgl/lessons/NeHeWebGL4.html" frameborder="0" width="500" height="500"></iframe></p>

#### 源码笔记

```
<html lang="zh-CN">

<!--服务器运行地址：http://127.0.0.1:8080/webgl/LearnNeHeWebGL/NeHeWebGL4.html-->
<head>
    <title>NeHe's WebGL</title>
    <meta charset="UTF-8"/>
    <!--引入需要的库文件-->
    <script type="text/javascript" src="../lib/Oak3D_v_0_5.js"></script>

    <!--片元着色器；为JavaScript片段指定一个ID编号，后面我可以更具这个ID编号来获取这段片元着色器的JavaScript片段代码-->
    <script id="shader-fs" type="x-shader/x-fragment">
    precision mediump float;

    varying vec4 vColor;
    void main(void) {
        gl_FragColor = vColor;
    }
    </script>

    <!--顶点着色器；后面可以通过ID编号来获取这段顶点着色器代码-->
    <script id="shader-vs" type="x-shader/x-vertex">
    attribute vec3 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;

    varying vec4 vColor;
    void main(void) {
        gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
        vColor = aVertexColor;
    }
    </script>


    <script type="text/javascript">

        var gl;
        //初始化WEBGL
        function initGL(canvas) {
            try {
                //获取WEBGL上下文
                gl = canvas.getContext("experimental-webgl");
                //gl这个上下文中存放了一些属性（canvas的宽度、长度和其他相关属性数据）
                //设置我的视口的宽度和高度
                gl.viewportWidth = canvas.width;
                gl.viewportHeight = canvas.height;
            } catch (e) {
            }
            //如果获取失败
            if (!gl) {
                alert("Could not initialise WebGL, sorry :-(");
            }
        }


        //获取我的着色器对象
        function getShader(gl, id) {
            //根据id获取着色器源程序代码
            var shaderScript = document.getElementById(id);
            if (!shaderScript) {
                return null;
            }

            var str = "";
            var k = shaderScript.firstChild;
            while (k) {
                if (k.nodeType == 3) {
                    str += k.textContent;
                }
                k = k.nextSibling;
            }

            var shader;
            //1.根据着色器的类型创建相应的着色器对象
            if (shaderScript.type == "x-shader/x-fragment") {
                shader = gl.createShader(gl.FRAGMENT_SHADER);
            } else if (shaderScript.type == "x-shader/x-vertex") {
                shader = gl.createShader(gl.VERTEX_SHADER);
            } else {
                return null;
            }

            //2.向着色器对象中指定相应的GLSL ES源代码（以字符串的形式传递进去）
            gl.shaderSource(shader, str);
            //3.开始编译着色器（编译成为二进制的可执行文件）
            gl.compileShader(shader);

            //检查下着色器的状态（是否编译成功）
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                alert(gl.getShaderInfoLog(shader));
                return null;
            }

            return shader;
        }


        //一个着色器对象必须包含一个顶点着色器和一个片元着色器
        var shaderProgram;

        //初始化着色器
        function initShaders() {
            //获取我的顶点着色器和片元着色器
            var fragmentShader = getShader(gl, "shader-fs");
            var vertexShader = getShader(gl, "shader-vs");

            //每一个program中可以存放一个顶点着色器和一个片元着色器
            //4.创建我的程序对象
            shaderProgram = gl.createProgram();
            //5.为程序对象分配着色器对象
            gl.attachShader(shaderProgram, vertexShader);
            gl.attachShader(shaderProgram, fragmentShader);

            //6.链接程序对象
            /**
             * 1.可以保证顶点着色器和片元着色器同名并且是同类型的
             * 2.attribute，uniform和varying变量个数不超过着色器的上限
             */
            gl.linkProgram(shaderProgram);
            //检测是否连接成功
            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
                alert("Could not initialise shaders");
            }
            //7.告诉WEBGL要使用的程序对象
            gl.useProgram(shaderProgram);

            //指定一个新的属性；gl.enableVertexAttribArray，我们使用它来告诉WebGL我们会用一个数组来为属性赋值
            //顶点的位置信息
            shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
            gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

            //获取我的顶点着色器中的attribute颜色变量
            shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
            gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

            //从program中取得另外的两个属性值（模型视图投影矩阵）
            shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
            shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
        }


        //定义了我的模型视图矩阵和投影矩阵
        var mvMatrix;
        var pMatrix;

        //在这里实现我的矩阵的进栈和出栈操作
        var mvMatrixStack = [];
        function myPushMatrix() {
            var copy = new okMat4();
            mvMatrix.clone(copy);
            mvMatrixStack.push(copy);
        }

        function myPopMatrix() {
            if (mvMatrixStack.length == 0) {
                throw "Invalid popMatrix!";
            }
            mvMatrix = mvMatrixStack.pop();
        }

        //把我们新设置的模型视图投影矩阵传给顶点着色器中的uniform变量
        function setMatrixUniforms() {
            gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix.toArray());
            gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix.toArray());
        }


        //定义我的三角形和矩形缓冲区顶点位置
        var pyramidVertexPositionBuffer;
        var cubeVertexPositionBuffer;
        //定义我的三角形和矩形缓冲区的顶点颜色
        var pyramidVertexColorBuffer;
        var cubeVertexColorBuffer;
        //定义我的立方体索引下标
        var cubeVertexIndexBuffer;

        //缓冲区的初始化
        function initBuffers() {
            //1.新建三角形顶点缓冲区对象
            pyramidVertexPositionBuffer = gl.createBuffer();
            //2.绑定目标对象到缓冲区
            gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexPositionBuffer);
            //初始化我的顶点数组
            var vertices = [
                // Front face
                0.0,  1.0,  0.0,
                -1.0, -1.0,  1.0,
                1.0, -1.0,  1.0,

                // Right face
                0.0,  1.0,  0.0,
                1.0, -1.0,  1.0,
                1.0, -1.0, -1.0,

                // Back face
                0.0,  1.0,  0.0,
                1.0, -1.0, -1.0,
                -1.0, -1.0, -1.0,

                // Left face
                0.0,  1.0,  0.0,
                -1.0, -1.0, -1.0,
                -1.0, -1.0,  1.0
            ];
            //3.缓冲区对象中写入数据
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

            //计算顶点数组的大小和顶点个数
            pyramidVertexPositionBuffer.itemSize = 3;
            pyramidVertexPositionBuffer.numItems = 12;

            //1.创建我的颜色缓冲区
            pyramidVertexColorBuffer = gl.createBuffer();
            //2.绑定我的颜色缓冲区到目标对象
            gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexColorBuffer);
            //初始化我的颜色数组(对每一个顶点指定相应的颜色)
            var colors = [
                //注意保证在同一个顶点上面的颜色要相同
                // Front face
                1.0, 0.0, 0.0, 1.0,
                0.0, 1.0, 0.0, 1.0,
                0.0, 0.0, 1.0, 1.0,

                // Right face
                1.0, 0.0, 0.0, 1.0,
                0.0, 0.0, 1.0, 1.0,
                0.0, 1.0, 0.0, 1.0,

                // Back face
                1.0, 0.0, 0.0, 1.0,
                0.0, 1.0, 0.0, 1.0,
                0.0, 0.0, 1.0, 1.0,

                // Left face
                1.0, 0.0, 0.0, 1.0,
                0.0, 0.0, 1.0, 1.0,
                0.0, 1.0, 0.0, 1.0
            ];
            //3.向缓冲区对象中写入数据
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
            //计算三角形顶点颜色数组的大小和顶点个数
            pyramidVertexColorBuffer.itemSize = 4;
            pyramidVertexColorBuffer.numItems = 12;



            //1.新建矩形顶点缓冲区对象
            cubeVertexPositionBuffer = gl.createBuffer();
            //2.绑定目标对象到缓冲区
            gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
            //立方体的顶点位置数组
            vertices = [
                // Front face(123第一个三角形， 134第二个三角形)
                -1.0, -1.0,  1.0,
                1.0, -1.0,  1.0,
                1.0,  1.0,  1.0,
                -1.0,  1.0,  1.0,

                // Back face
                -1.0, -1.0, -1.0,
                -1.0,  1.0, -1.0,
                1.0,  1.0, -1.0,
                1.0, -1.0, -1.0,

                // Top face
                -1.0,  1.0, -1.0,
                -1.0,  1.0,  1.0,
                1.0,  1.0,  1.0,
                1.0,  1.0, -1.0,

                // Bottom face
                -1.0, -1.0, -1.0,
                1.0, -1.0, -1.0,
                1.0, -1.0,  1.0,
                -1.0, -1.0,  1.0,

                // Right face
                1.0, -1.0, -1.0,
                1.0,  1.0, -1.0,
                1.0,  1.0,  1.0,
                1.0, -1.0,  1.0,

                // Left face
                -1.0, -1.0, -1.0,
                -1.0, -1.0,  1.0,
                -1.0,  1.0,  1.0,
                -1.0,  1.0, -1.0
            ];
            //3.向缓冲区对象中写入数据
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            //计算矩形顶点数组每一项数据的大小，和顶点个数（有四个不同的顶点位置，每个顶点由3个数字组成）
            cubeVertexPositionBuffer.itemSize = 3;
            cubeVertexPositionBuffer.numItems = 24;

            //1.创建我的立方体的顶点颜色缓冲区
            cubeVertexColorBuffer = gl.createBuffer();
            //2.绑定目标对象到缓冲区
            gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexColorBuffer);
            //定义我的矩形的颜色数组
            colors = [
                [1.0, 0.0, 0.0, 1.0], // Front face[red]
                [1.0, 1.0, 0.0, 1.0], // Back face[yellow]
                [0.0, 1.0, 0.0, 1.0], // Top face[green]
                [1.0, 0.5, 0.5, 1.0], // Bottom face[]
                [1.0, 0.0, 1.0, 1.0], // Right face[]
                [0.0, 0.0, 1.0, 1.0]  // Left face[blue]
            ];

            //对于矩形的四个顶点赋予相同的颜色
            //每一个面的四个顶点都是同样的颜色
            /***
             * 1.0, 0.0, 0.0, 1.0
             * 1.0, 0.0, 0.0, 1.0
             * 1.0, 0.0, 0.0, 1.0
             * 1.0, 0.0, 0.0, 1.0
             * 1.0, 1.0, 0.0, 1.0
             * 1.0, 1.0, 0.0, 1.0
             * 1.0, 1.0, 0.0, 1.0
             * 1.0, 1.0, 0.0, 1.0
             * ………………………………
             * 0.0, 0.0, 1.0, 1.0
             * 0.0, 0.0, 1.0, 1.0
             * 0.0, 0.0, 1.0, 1.0
             * 0.0, 0.0, 1.0, 1.0
             * @type {Array}
             */
            var unpackedColors = [];
            for (var i in colors) {
                var color = colors[i];
                for (var j=0; j < 4; j++) {
                    unpackedColors = unpackedColors.concat(color);
                }
            }

            //3.向缓冲区对象中写入数据
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unpackedColors), gl.STATIC_DRAW);
            //计算我的正方形的顶点数组
            cubeVertexColorBuffer.itemSize = 4;
            cubeVertexColorBuffer.numItems = 24;


            //开始定义我的顶点位置数组
            //1.创建我的顶点索引缓冲区对象
            cubeVertexIndexBuffer = gl.createBuffer();
            //2.绑定目标对象到缓冲区
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
            //设置我的顶点索引数组
            var cubeVertexIndices = [
                0, 1, 2,      0, 2, 3,    // Front face
                4, 5, 6,      4, 6, 7,    // Back face
                8, 9, 10,     8, 10, 11,  // Top face
                12, 13, 14,   12, 14, 15, // Bottom face
                16, 17, 18,   16, 18, 19, // Right face
                20, 21, 22,   20, 22, 23  // Left face
            ];
            //3.向缓冲区对象写入数据
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
            //计算我的顶点索引数组的大小(每一项数据的大小，总共36个数据)
            /**
             * 1个不同的顶点位置（numItems），每个顶点由36个数字组成（itemSize）
             * @type {number}
             */
            cubeVertexIndexBuffer.itemSize = 1;
            cubeVertexIndexBuffer.numItems = 36;
        }


        //定义我的三角形和我的矩形的初始旋转角度
        var rPyramid = 0;
        var rCube = 0;

        //绘制我的场景（三角形和矩形）
        function drawScene() {
            //设置视口大小
            gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
            //清空颜色缓存和深度缓存
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            //建立一个透视投影（视场角，视口比例，最近，最远距离）
            pMatrix = okMat4Proj(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);

            //新建一个模型视图矩阵
            mvMatrix = new okMat4();
            //保存矩阵的初始状态
            myPushMatrix();


            //设置我的模型视图矩阵为平移矩阵
            //mvMatrix = okMat4Trans(-1.5, 0.0, -7.0);
            mvMatrix.translate(OAK.SPACE_WORLD, -1.5, 0.0, -8.0, true);
            //三角形的椎体绕着Y轴旋转(本地坐标系旋转)
            mvMatrix.rotY(OAK.SPACE_LOCAL, rPyramid, true);

            //1.绑定三角形顶点数据到缓冲区对象
            gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexPositionBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, pyramidVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

            //2.绑定三角形颜色信息到缓冲区对象,并且传递给顶点着色器
            gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexColorBuffer);
            gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, pyramidVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);



            //告诉WEBGL当前使用的模型视图投影矩阵
            setMatrixUniforms();
            //开始绘制三角形（从第0个位置开始，绘制numItems个顶点）
            gl.drawArrays(gl.TRIANGLES, 0, pyramidVertexPositionBuffer.numItems);
            //绘制完毕后再次恢复我的模型视图矩阵
            myPopMatrix();


            //再次保存我的模型视图矩阵
            myPushMatrix();
            //开始绘制立方体
            mvMatrix.translate(OAK.SPACE_WORLD, 1.5, 0.0, -8.0, true);
            //让我的矩形绕着XYZ轴旋转
            //mvMatrix.rotX(OAK.SPACE_LOCAL, rCube, true);
            mvMatrix.rot(OAK.SPACE_LOCAL, rCube, 1.0, 1.0, 1.0, true);

            //绑定四边形的顶点信息（与索引下标绑定在一起）
            gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);


            //开始传递颜色数据
            gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexColorBuffer);
            gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cubeVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

            //开始绑定索引下标信息
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);

            setMatrixUniforms();

            //开始绘制立方体
            //gl.drawArrays(gl.TRIANGLE_STRIP, 0, cubeVertexPositionBuffer.numItems);
            gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

            //绘制完毕后，恢复我的模型视图矩阵的初始状态
            myPopMatrix();
        }


        //这里是我的主函数
        function webGLStart() {
            //获取canvas元素
            var canvas = document.getElementById("lesson01-canvas");

            //初始化WEBGL上下文信息
            initGL(canvas);

            //初始化着色器
            initShaders();

            //出事阿虎缓冲区
            initBuffers();

            //指定清空画布的颜色，开启隐藏面消除的功能
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.enable(gl.DEPTH_TEST);

            //开始绘制我的场景
            //drawScene();
            //开始使用动画效果来绘制我的图形
            tick();
        }

        //实现我的动画绘制函数
        function tick() {
            //重复调用tick函数
            okRequestAnimationFrame(tick);

            //开始绘制场景
            drawScene();

            //改变我的三角形和我的矩阵的旋转角度
            animate();
        }

        //开始不断修改我的旋转角度
        var lastTime = 0;
        function animate() {
            var timeNow = new Date().getTime();
            if (lastTime != 0) {
                var elapsed = timeNow - lastTime;

                //三角形 90/s， 矩形 75/s
                rPyramid += (90 * elapsed) / 1000.0;
                rCube -= (75 * elapsed) / 1000.0;
            }
            lastTime = timeNow;
        }

    </script>


</head>

<body onload="webGLStart();">
<canvas id="lesson01-canvas" style="border: none;" width="500" height="500"></canvas>
</body>

</html>

```