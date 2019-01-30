```$xslt
<html>
<!--开始实现一个三维街景的渲染效果-->
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>NeHeWebGL----环境光（光照模型）</title>
    <meta http-equiv="content-type" content="text/html; charset=ISO-8859-1">

    <script type="text/javascript" src="../lib/Oak3D_v_0_5.js"></script>

    <script id="shader-fs" type="x-shader/x-fragment">

    precision mediump float;


    varying vec2 vTextureCoord;
    varying vec3 vLightWeighting;

    uniform sampler2D uSampler;

    void main(void) {
        vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
        gl_FragColor = vec4(textureColor.rgb * vLightWeighting, textureColor.a);
    }

    </script>

    <script id="shader-vs" type="x-shader/x-vertex">
    attribute vec3 aVertexPosition;
    attribute vec3 aVertexNormal;
    attribute vec2 aTextureCoord;

    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;
    uniform mat4 uNMatrix;

    uniform vec3 uAmbientColor;

    uniform vec3 uLightingDirection;
    uniform vec3 uDirectionalColor;

    uniform bool uUseLighting;

    varying vec2 vTextureCoord;
    varying vec3 vLightWeighting;

    void main(void) {
        gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
        vTextureCoord = aTextureCoord;

        if (!uUseLighting) {
            vLightWeighting = vec3(1.0, 1.0, 1.0);
        } else {
            vec3 transformedNormal = (uNMatrix * vec4(aVertexNormal, 1.0)).xyz;
            float directionalLightWeighting = max(dot(transformedNormal, uLightingDirection), 0.0);
            vLightWeighting = uAmbientColor + uDirectionalColor * directionalLightWeighting;
        }
    }

    </script>


    <script type="text/javascript">

        var gl;

        //初始化WEBGL上下文
        function initGL(canvas) {
            try {
                gl = canvas.getContext("experimental-webgl");
                gl.viewportWidth = canvas.width;
                gl.viewportHeight = canvas.height;
            } catch (e) {
            }
            if (!gl) {
                alert("Could not initialise WebGL, sorry :-(");
            }
        }


        //获取着色器
        function getShader(gl, id) {
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
            if (shaderScript.type == "x-shader/x-fragment") {
                shader = gl.createShader(gl.FRAGMENT_SHADER);
            } else if (shaderScript.type == "x-shader/x-vertex") {
                shader = gl.createShader(gl.VERTEX_SHADER);
            } else {
                return null;
            }

            gl.shaderSource(shader, str);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                alert(gl.getShaderInfoLog(shader));
                return null;
            }

            return shader;
        }


        //初始化着色器
        var shaderProgram;

        function initShaders() {
            var fragmentShader = getShader(gl, "shader-fs");
            var vertexShader = getShader(gl, "shader-vs");

            shaderProgram = gl.createProgram();
            gl.attachShader(shaderProgram, vertexShader);
            gl.attachShader(shaderProgram, fragmentShader);
            gl.linkProgram(shaderProgram);

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
                alert("Could not initialise shaders");
            }

            gl.useProgram(shaderProgram);


            //获取顶点着色器中的aVertexPosition变量，并开启
            shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
            gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

            //获取顶点着色器中的aVertexNormal法向量变量，并开启
            shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
            gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

            //获取顶点着色器中的aTextureCoord纹理坐标的存储位置，并且开启
            shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
            gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

            //获取模型居住，取样器，光照等参数信息的存储位置
            shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
            shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
            shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
            shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
            shaderProgram.useLightingUniform = gl.getUniformLocation(shaderProgram, "uUseLighting");
            shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
            shaderProgram.lightingDirectionUniform = gl.getUniformLocation(shaderProgram, "uLightingDirection");
            shaderProgram.directionalColorUniform = gl.getUniformLocation(shaderProgram, "uDirectionalColor");
        }


        //处理已经加载的纹理图片
        /*function handleLoadedTexture(texture) {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
            gl.generateMipmap(gl.TEXTURE_2D);

            gl.bindTexture(gl.TEXTURE_2D, null);
        }*/


        //从本地文件中加载一张纹理图片并且初始化
       /* var crateTexture;

        function initTexture() {
            crateTexture = gl.createTexture();
            crateTexture.image = new Image();
            crateTexture.image.onload = function () {
                handleLoadedTexture(crateTexture)
            }

            //设置我的纹理图片
            crateTexture.image.src = "./resources/woodbox.bmp";
        }*/


        //创建我的模型视图矩阵
        var mvMatrix;
        var mvMatrixStack = [];
        var pMatrix;


        //该函数主要是吧我当前的模型视图投影矩阵及时更新到顶点着色器
        function setMatrixUniforms() {
            gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix.toArray());
            gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix.toArray());

            //计算模型视图矩阵的逆转置矩阵（运动物体的法向量不断在改变）
            var normalMatrix = mvMatrix.inverse().transpose();
            gl.uniformMatrix4fv(shaderProgram.nMatrixUniform, false, normalMatrix.toArray());
        }


        //处理物体运动的一些基本参数
        var xRot = 0;
        var xSpeed = 3;

        var yRot = 0;
        var ySpeed = -3;

        var z = -5.0;


        //可以处理多个按键同时按下的情形
        var currentlyPressedKeys = {};

        function handleKeyDown(event) {
            currentlyPressedKeys[event.keyCode] = true;
        }

        function handleKeyUp(event) {
            currentlyPressedKeys[event.keyCode] = false;
        }


        //根据不同的按键做出不同的反应
        function handleKeys() {
            if (currentlyPressedKeys[33]) {
                // Page Up
                z -= 0.05;
            }
            if (currentlyPressedKeys[34]) {
                // Page Down
                z += 0.05;
            }
            if (currentlyPressedKeys[37]) {
                // Left cursor key
                ySpeed -= 1;
            }
            if (currentlyPressedKeys[39]) {
                // Right cursor key
                ySpeed += 1;
            }
            if (currentlyPressedKeys[38]) {
                // Up cursor key
                xSpeed -= 1;
            }
            if (currentlyPressedKeys[40]) {
                // Down cursor key
                xSpeed += 1;
            }
        }


        //初始化我的顶点缓冲区参数（包括位置、法向量、纹理坐标、位置索引）
        var cubeVertexPositionBuffer;
        var cubeVertexNormalBuffer;
        var cubeVertexTextureCoordBuffer;
        var cubeVertexIndexBuffer;

        //立方体的索引
        var cubeVertexTextureIndex0;
        var cubeVertexTextureIndex1;
        var cubeVertexTextureIndex2;
        var cubeVertexTextureIndex3;
        var cubeVertexTextureIndex4;
        var cubeVertexTextureIndex5;

        //利用这个全局变量来保存所有的属性信息
        var pwgl = {};
        // Keep track of ongoing image loads to be able to handle lost context
        pwgl.ongoingImageLoads = [];


        function initBuffers() {
            cubeVertexPositionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
            var vertices = [
                // Front face
                -1.0, -1.0, 1.0,
                1.0, -1.0, 1.0,
                1.0, 1.0, 1.0,
                -1.0, 1.0, 1.0,

                // Back face
                -1.0, -1.0, -1.0,
                -1.0, 1.0, -1.0,
                1.0, 1.0, -1.0,
                1.0, -1.0, -1.0,

                // Top face
                -1.0, 1.0, -1.0,
                -1.0, 1.0, 1.0,
                1.0, 1.0, 1.0,
                1.0, 1.0, -1.0,

                // Bottom face
                -1.0, -1.0, -1.0,
                1.0, -1.0, -1.0,
                1.0, -1.0, 1.0,
                -1.0, -1.0, 1.0,

                // Right face
                1.0, -1.0, -1.0,
                1.0, 1.0, -1.0,
                1.0, 1.0, 1.0,
                1.0, -1.0, 1.0,

                // Left face
                -1.0, -1.0, -1.0,
                -1.0, -1.0, 1.0,
                -1.0, 1.0, 1.0,
                -1.0, 1.0, -1.0,
            ];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            cubeVertexPositionBuffer.itemSize = 3;
            cubeVertexPositionBuffer.numItems = 24;


            //设置我的立方体各个方向的法向量
            cubeVertexNormalBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
            var vertexNormals = [
                // Front face
                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0,

                // Back face
                0.0, 0.0, -1.0,
                0.0, 0.0, -1.0,
                0.0, 0.0, -1.0,
                0.0, 0.0, -1.0,

                // Top face
                0.0, 1.0, 0.0,
                0.0, 1.0, 0.0,
                0.0, 1.0, 0.0,
                0.0, 1.0, 0.0,

                // Bottom face
                0.0, -1.0, 0.0,
                0.0, -1.0, 0.0,
                0.0, -1.0, 0.0,
                0.0, -1.0, 0.0,

                // Right face
                1.0, 0.0, 0.0,
                1.0, 0.0, 0.0,
                1.0, 0.0, 0.0,
                1.0, 0.0, 0.0,

                // Left face
                -1.0, 0.0, 0.0,
                -1.0, 0.0, 0.0,
                -1.0, 0.0, 0.0,
                -1.0, 0.0, 0.0
            ];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
            cubeVertexNormalBuffer.itemSize = 3;
            cubeVertexNormalBuffer.numItems = 24;


            //纹理坐标的创建
            cubeVertexTextureCoordBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
            var textureCoords = [
                // Front face
                0.0, 0.0,
                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0,

                // Back face
                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0,
                0.0, 0.0,

                // Top face
                0.0, 1.0,
                0.0, 0.0,
                1.0, 0.0,
                1.0, 1.0,

                // Bottom face
                1.0, 1.0,
                0.0, 1.0,
                0.0, 0.0,
                1.0, 0.0,

                // Right face
                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0,
                0.0, 0.0,

                // Left face
                0.0, 0.0,
                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0
            ];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
            cubeVertexTextureCoordBuffer.itemSize = 2;
            cubeVertexTextureCoordBuffer.numItems = 24;

            //顶点索引坐标的初始化
            /*cubeVertexIndexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
            var cubeVertexIndices = [
                0, 1, 2, 0, 2, 3,    // Front face
                4, 5, 6, 4, 6, 7,    // Back face
                8, 9, 10, 8, 10, 11,  // Top face
                12, 13, 14, 12, 14, 15, // Bottom face
                16, 17, 18, 16, 18, 19, // Right face
                20, 21, 22, 20, 22, 23  // Left face
            ];
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
            cubeVertexIndexBuffer.itemSize = 1;
            cubeVertexIndexBuffer.numItems = 36;*/


            //对立方体的六个面建立索引，为后面的渲染做准备
            //对立方体的每一个面分别建立缓冲区，以实现对不同的面实现不同的纹理
            //前面
            cubeVertexTextureIndex0 = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexTextureIndex0);
            var Indices0 = [0, 1, 2,      0, 2, 3];
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(Indices0), gl.STATIC_DRAW);
            cubeVertexTextureIndex0.itemSize = 1;
            cubeVertexTextureIndex0.numItems = 6;

            //后面
            cubeVertexTextureIndex1 = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexTextureIndex1);
            var Indices1 = [4, 5, 6,      4, 6, 7];
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(Indices1), gl.STATIC_DRAW);
            cubeVertexTextureIndex1.itemSize = 1;
            cubeVertexTextureIndex1.numItems = 6;

            //上面
            cubeVertexTextureIndex2 = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexTextureIndex2);
            var Indices2 = [8, 9, 10,     8, 10, 11];
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(Indices2), gl.STATIC_DRAW);
            cubeVertexTextureIndex2.itemSize = 1;
            cubeVertexTextureIndex2.numItems = 6;

            //下面
            cubeVertexTextureIndex3 = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexTextureIndex3);
            var Indices3 = [12, 13, 14,   12, 14, 15];
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(Indices3), gl.STATIC_DRAW);
            cubeVertexTextureIndex3.itemSize = 1;
            cubeVertexTextureIndex3.numItems = 6;

            //右边
            cubeVertexTextureIndex4 = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexTextureIndex4);
            var Indices4 = [16, 17, 18,   16, 18, 19];
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(Indices4), gl.STATIC_DRAW);
            cubeVertexTextureIndex4.itemSize = 1;
            cubeVertexTextureIndex4.numItems = 6;

            //左边
            cubeVertexTextureIndex5 = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexTextureIndex5);
            var Indices5 = [20, 21, 22,   20, 22, 23];
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(Indices5), gl.STATIC_DRAW);
            cubeVertexTextureIndex5.itemSize = 1;
            cubeVertexTextureIndex5.numItems = 6;

        }

        /*************************创建一个纹理对象并且载入纹理数据的8个过程【】*************************/
        //纹理加载完成之后的处理
        function textureFinishedLoading(image, texture) {
            //5.开始绑定当前的这个纹理对象
            gl.bindTexture(gl.TEXTURE_2D, texture);
            //6.修正图像的坐标
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

            //7.把纹理对象载入到顶点着色器
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
                image);
            //Mip映射纹理（会自动生成Mip映射纹理链）---会提高纹理的分辨率
            gl.generateMipmap(gl.TEXTURE_2D);


            //8.设置我的纹理滤波方式
            //拉伸纹理
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            //纹理收缩
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

            //对于所有的纹理坐标的S,T方向应用镜面映射
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
            gl.bindTexture(gl.TEXTURE_2D, null);
        }

        //开始从本地加载图片作为纹理图片
        function loadImageForTexture(url, texture) {
            //2.创建一个类似javascript的DOM对象的图片对象【< img src="" id=""/>】
            var image = new Image();
            //3.图片在加载完成之后，把刚刚创建的纹理对象数据上传到GPU
            image.onload = function() {
                //删除当前数组中的这张图片
                pwgl.ongoingImageLoads.splice(pwgl.ongoingImageLoads.indexOf(image), 1);
                //5.图像载入完成之后，就可以开始绑定这个纹理对象了
                textureFinishedLoading(image, texture);
            }
            pwgl.ongoingImageLoads.push(image);
            image.crossOrigin = "anonymous";
            //4.把Image对象的src属性设置为希望绑定到纹理图像的URL
            image.src = url;
        }

        //在这里我设置了三张纹理图片
        function setupTextures() {
            // Texture for the table
            pwgl.woodTexture = gl.createTexture();
            loadImageForTexture("../resources/wood_128x128.jpg", pwgl.woodTexture);

            // Texture for the floor
            pwgl.groundTexture = gl.createTexture();
            loadImageForTexture("../resources/wood_floor_256.jpg", pwgl.groundTexture);

            // Texture for the box on the table
            pwgl.boxTexture = gl.createTexture();
            loadImageForTexture("../resources/cube.bmp", pwgl.boxTexture);
            //这里会出现错误的跨域请求
            //has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource
            //loadImageForTexture("127.0.0.1:8080/webgl/images/xiuxiu.bmp", pwgl.boxTexture);
            pwgl.mofangTexture = gl.createTexture();
            loadImageForTexture("../resources/cube_number.bmp", pwgl.mofangTexture);


            //再次循环创建六个立方体纹理图片
            //1.创建一个WEBGLTexture对象
            pwgl.cube1 = gl.createTexture();
            pwgl.cube2 = gl.createTexture();
            pwgl.cube3 = gl.createTexture();
            pwgl.cube4 = gl.createTexture();
            pwgl.cube5 = gl.createTexture();
            pwgl.cube6 = gl.createTexture();
            loadImageForTexture("../resources/cube/01.bmp", pwgl.cube1);
            loadImageForTexture("../resources/cube/02.bmp", pwgl.cube2);
            loadImageForTexture("../resources/cube/03.bmp", pwgl.cube3);
            loadImageForTexture("../resources/cube/04.bmp", pwgl.cube4);
            loadImageForTexture("../resources/cube/05.bmp", pwgl.cube5);
            loadImageForTexture("../resources/cube/06.bmp", pwgl.cube6);

        }

        //绘制场景
        function drawScene() {
            gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            //设置我的投影矩阵
            pMatrix = okMat4Proj(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);

            //模型视图矩阵
            mvMatrix = okMat4Trans(0.0, 0.0, z);

            mvMatrix.rotX(OAK.SPACE_LOCAL, xRot, true);
            mvMatrix.rotY(OAK.SPACE_LOCAL, yRot, true);


            //开始向顶点着色器中的相应参数传值
            gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, cubeVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
            gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
            setMatrixUniforms();

           /* gl.activeTexture(gl.TEXTURE0);
            //绑定纹理坐标到目标对象
            gl.bindTexture(gl.TEXTURE_2D, crateTexture);
            gl.uniform1i(shaderProgram.samplerUniform, 0);
            var lighting = document.getElementById("lighting").checked;
            //console.log(lighting);
            //这里就只是把光照是否勾选的状态传给顶点着色器
            gl.uniform1i(shaderProgram.useLightingUniform, lighting);*/

            var lighting = document.getElementById("lighting").checked;
            //console.log(lighting);
            //这里就只是把光照是否勾选的状态传给顶点着色器
            gl.uniform1i(shaderProgram.useLightingUniform, lighting);



            //在这里重复执行六次赋值纹理的操作
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, pwgl.cube1);
            gl.uniform1i(shaderProgram.samplerUniform, 0);
            //开始绘制前面
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexTextureIndex0);
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, pwgl.cube2);
            gl.uniform1i(shaderProgram.samplerUniform, 0);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexTextureIndex1);
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, pwgl.cube3);
            gl.uniform1i(shaderProgram.samplerUniform, 0);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexTextureIndex2);                          //
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, pwgl.cube4);
            gl.uniform1i(shaderProgram.samplerUniform, 0);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexTextureIndex3);
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, pwgl.cube5);
            gl.uniform1i(shaderProgram.samplerUniform, 0);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexTextureIndex4);
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, pwgl.cube6);
            gl.uniform1i(shaderProgram.samplerUniform, 0);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexTextureIndex5);
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

            setMatrixUniforms();


            //判断光照选项框是否被选中
            if (lighting) {
                //读出用户在输入框中键入的环境光的红、绿、蓝的颜色值，并传递给着色器
                gl.uniform3f(
                    shaderProgram.ambientColorUniform,
                    parseFloat(document.getElementById("ambientR").value),
                    parseFloat(document.getElementById("ambientG").value),
                    parseFloat(document.getElementById("ambientB").value)
                );

                //传递光线方向给着色器
                var lightingDirection = new okVec3(
                    parseFloat(document.getElementById("lightDirectionX").value),
                    parseFloat(document.getElementById("lightDirectionY").value),
                    parseFloat(document.getElementById("lightDirectionZ").value)
                );

                //光线方向的归一化（实时胴体地在物体运动的每一个时刻，把环境光的相应参数传给顶点着色器）
                var adjustedLD = lightingDirection.normalize(false);
                //将光线方向向量乘以一个标量-1，用于调转向量的方向
                adjustedLD = okVec3MulVal(adjustedLD, -1.0);
                gl.uniform3fv(shaderProgram.lightingDirectionUniform, adjustedLD.toArray());

                gl.uniform3f(
                    shaderProgram.directionalColorUniform,
                    parseFloat(document.getElementById("directionalR").value),
                    parseFloat(document.getElementById("directionalG").value),
                    parseFloat(document.getElementById("directionalB").value)
                );
            }

            //开始把顶点位置 传给顶点着色器（通过索引方式绘图）
            /*gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
            setMatrixUniforms();
            //gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);*/
        }


        var lastTime = 0;

        //实时更新旋转角度
        function animate() {
            var timeNow = new Date().getTime();
            if (lastTime != 0) {
                var elapsed = timeNow - lastTime;

                xRot += (xSpeed * elapsed) / 1000.0;
                yRot += (ySpeed * elapsed) / 1000.0;
            }
            lastTime = timeNow;
        }

        //不断重绘场景
        function tick() {
            okRequestAnimationFrame(tick);
            handleKeys();
            drawScene();
            animate();
        }


        //主函数
        function webGLStart() {
            var canvas = document.getElementById("lesson07-canvas");
            initGL(canvas);
            initShaders();
            initBuffers();
            //initTexture();

            //设置纹理
            setupTextures();
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.enable(gl.DEPTH_TEST);

            document.onkeydown = handleKeyDown;
            document.onkeyup = handleKeyUp;

            tick();
        }

    </script>


</head>


<body onload="webGLStart();">
<br>
<canvas id="lesson07-canvas" style="border: none;" width="500" height="500"></canvas>

<br/>
<input type="checkbox" id="lighting" checked/> 开启光照<br/>
（使用<code>Page Up</code>和<code>Page Down</code>键来进行缩放）

<br/>
<h2>平行光：</h2>

<table style="border: 0; padding: 10px;">
    <tr>
        <td><b>方向：</b>
        <td>X: <input type="text" id="lightDirectionX" value="-0.25"/>
        <td>Y: <input type="text" id="lightDirectionY" value="-0.25"/>
        <td>Z: <input type="text" id="lightDirectionZ" value="-1.0"/>
    </tr>
    <tr>
        <td><b>颜色：</b>
        <td>R: <input type="text" id="directionalR" value="0.8"/>
        <td>G: <input type="text" id="directionalG" value="0.8"/>
        <td>B: <input type="text" id="directionalB" value="0.8"/>
    </tr>
</table>

<h2>环境光：</h2>
<table style="border: 0; padding: 10px;">
    <tr>
        <td><b>颜色：</b>
        <td>R: <input type="text" id="ambientR" value="0.2"/>
        <td>G: <input type="text" id="ambientG" value="0.2"/>
        <td>B: <input type="text" id="ambientB" value="0.2"/>
    </tr>
</table>

</body>

<!--
 注释：简单记录一下吧，经过前期的百般尝试；终于实现了在立方体的六个面贴上不同的纹理图片的功能；
 但是使用的额仍然是2D纹理贴图方式，虽然功能实现了， 但是代码中仍然有待进一步改善哈@@@webmaster@xiuxiu.space  2017 11/9/
-->
</html>

```