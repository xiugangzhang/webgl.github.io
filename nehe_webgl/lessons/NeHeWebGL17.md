#### 读取文件载入世界模型
<p><iframe style="width: 100%; height: 520px; text-align:center;" src="/nehe_webgl/lessons/NeHeWebGL17.html" frameborder="0" width="500" height="500"></iframe></p>

#### 源码笔记
```
<html>

<head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>WebGL中文教程 - 通过文件载入世界</title>

    <script type="text/javascript" src="../lib/Oak3D_v_0_5.js"></script>

    <script id="shader-fs" type="x-shader/x-fragment">

    precision mediump float;


    varying vec2 vTextureCoord;

    uniform sampler2D uSampler;

    void main(void) {
        gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
    }
</script>

    <script id="shader-vs" type="x-shader/x-vertex">
    attribute vec3 aVertexPosition;
    attribute vec2 aTextureCoord;

    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;

    varying vec2 vTextureCoord;

    void main(void) {
        gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
        vTextureCoord = aTextureCoord;
    }
</script>


    <script type="text/javascript">

        var gl;

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

            shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
            gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

            shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
            gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

            shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
            shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
            shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
        }


        function handleLoadedTexture(texture) {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

            gl.bindTexture(gl.TEXTURE_2D, null);
        }


        var mudTexture;

        function initTexture() {
            mudTexture = gl.createTexture();
            mudTexture.image = new Image();
            mudTexture.image.onload = function () {
                handleLoadedTexture(mudTexture)
            }

            mudTexture.image.src = "../resources/word/wand.bmp";
        }


        var mvMatrix ;
        var mvMatrixStack = [];
        var pMatrix ;

        function mvPushMatrix() {
            var copy = new okMat4();
            mvMatrix.clone(copy);
            mvMatrixStack.push(copy);
        }

        function mvPopMatrix() {
            if (mvMatrixStack.length == 0) {
                throw "Invalid popMatrix!";
            }
            mvMatrix = mvMatrixStack.pop();
        }


        function setMatrixUniforms() {
            gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix.toArray());
            gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix.toArray());
        }









        var currentlyPressedKeys = {};

        function handleKeyDown(event) {
            currentlyPressedKeys[event.keyCode] = true;
        }


        function handleKeyUp(event) {
            currentlyPressedKeys[event.keyCode] = false;
        }


        var pitch = 0;
        var pitchRate = 0;

        var yaw = 0;
        var yawRate = 0;

        var xPos = 0;
        var yPos = 0.4;
        var zPos = 0;

        var speed = 0;

        function handleKeys() {
            if (currentlyPressedKeys[33]) {
                // Page Up
                pitchRate = 0.1;
            } else if (currentlyPressedKeys[34]) {
                // Page Down
                pitchRate = -0.1;
            } else {
                pitchRate = 0;
            }

            if (currentlyPressedKeys[37] || currentlyPressedKeys[65]) {
                // Left cursor key or A
                yawRate = 0.1;
            } else if (currentlyPressedKeys[39] || currentlyPressedKeys[68]) {
                // Right cursor key or D
                yawRate = -0.1;
            } else {
                yawRate = 0;
            }

            if (currentlyPressedKeys[38] || currentlyPressedKeys[87]) {
                // Up cursor key or W
                speed = 0.003;
            } else if (currentlyPressedKeys[40] || currentlyPressedKeys[83]) {
                // Down cursor key
                speed = -0.003;
            } else {
                speed = 0;
            }

        }


        //开始循环读取解析加载的世界中的数据
        var worldVertexPositionBuffer = null;
        var worldVertexTextureCoordBuffer = null;

        function handleLoadedWorld(data) {
            //("Load data sucess "+data);
            var lines = data.split("\n");
            var vertexCount = 0;
            var vertexPositions = [];
            var vertexTextureCoords = [];
            for (var i in lines) {
                var vals = lines[i].replace(/^\s+/, "").split(/\s+/);
                if (vals.length == 5 && vals[0] != "//") {
                    //把顶点信息存储到顶点缓冲区中去
                    // It is a line describing a vertex; get X, Y and Z first
                    //每一行的前三个信息表示的是位置信息，后面的两个点是相应的纹理坐标信息
                    vertexPositions.push(parseFloat(vals[0]));
                    vertexPositions.push(parseFloat(vals[1]));
                    vertexPositions.push(parseFloat(vals[2]));

                    // And then the texture coords
                    vertexTextureCoords.push(parseFloat(vals[3]));
                    vertexTextureCoords.push(parseFloat(vals[4]));

                    //每次读完一行，就记录一次，vertexCount记录了顶点的个数
                    vertexCount += 1;
                }
            }

            //1.创建顶点缓冲区对象
            worldVertexPositionBuffer = gl.createBuffer();
            //2.绑定缓冲区对象到目标对象
            gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexPositionBuffer);
            //3.向缓冲区对象中写入数据
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositions), gl.STATIC_DRAW);
            worldVertexPositionBuffer.itemSize = 3;
            worldVertexPositionBuffer.numItems = vertexCount;


            //1.创建纹理缓冲区对象
            worldVertexTextureCoordBuffer = gl.createBuffer();
            //2.绑定纹理缓冲区到目标对象
            gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexTextureCoordBuffer);
            //3.向纹理缓冲区对象中写入数据
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexTextureCoords), gl.STATIC_DRAW);
            worldVertexTextureCoordBuffer.itemSize = 2;
            worldVertexTextureCoordBuffer.numItems = vertexCount;

            //当这些缓冲区对象创建完毕之后，就清空了原本显示在DIV标签中的内容
            document.getElementById("loadingtext").textContent = "";
        }


        //通过发送Ajax请求的方式来获得本地服务器中的world.txt文件
        function loadWorld() {
            var request = new XMLHttpRequest();
            request.open("GET", "../resources/word/world.txt");
            request.onreadystatechange = function () {
                if (request.readyState == 4) {
                    handleLoadedWorld(request.responseText);
                }
            }
            request.send();
        }



        //绘制场景
        function drawScene() {
            gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            //判断载入世界之后，相应的对象数组是否被正确建立
            if (worldVertexTextureCoordBuffer == null || worldVertexPositionBuffer == null) {
                return;
            }


            //如果物体的顶点位置信息和纹理坐标缓冲区成功创建了
            //开始建立我的投影矩阵和我的模型视图矩阵
            pMatrix = okMat4Proj(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);

            //模型视图矩阵（此时下面的变换已经转换到世界坐标系中了）
            mvMatrix = new okMat4();
            //让当前物体在自己的坐标系相反方向运动
            mvMatrix.rotX(OAK.SPACE_LOCAL, -pitch, true);
            mvMatrix.rotY(OAK.SPACE_LOCAL, -yaw, true);
            mvMatrix.translate(OAK.SPACE_LOCAL, -xPos, -yPos, -zPos, true);


            //模型视图矩阵准备好了之后，就开始设置我的纹理信息
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, mudTexture);
            gl.uniform1i(shaderProgram.samplerUniform, 0);

            //绑定顶点的纹理坐标缓冲区到目标对象，把当前的顶点位置信息传给顶点着色器
            gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexTextureCoordBuffer);
            gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, worldVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

            //绑定当前的顶点缓冲区，把当前的顶点位置信息传给顶点着色器
            gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexPositionBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, worldVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

            //开始绘制三角形
            setMatrixUniforms();
            gl.drawArrays(gl.TRIANGLES, 0, worldVertexPositionBuffer.numItems);
        }

        function degToRad(degrees) {
            return degrees * Math.PI / 180;
        }


        var lastTime = 0;
        // Used to make us "jog" up and down as we move forward.
        var joggingAngle = 0;

        function animate() {
            var timeNow = new Date().getTime();
            if (lastTime != 0) {
                var elapsed = timeNow - lastTime;

                if (speed != 0) {
                    xPos -= Math.sin(degToRad(yaw)) * speed * elapsed;
                    zPos -= Math.cos(degToRad(yaw)) * speed * elapsed;

                    joggingAngle += elapsed * 0.6; // 0.6 "fiddle factor" - makes it feel more realistic :-)
                    yPos = Math.sin(degToRad(joggingAngle)) / 20 + 0.4
                }

                yaw += yawRate * elapsed;
                pitch += pitchRate * elapsed;

            }
            lastTime = timeNow;
        }


        function tick() {
            okRequestAnimationFrame(tick);
            handleKeys();
            drawScene();
            animate();
        }



        function webGLStart() {
            var canvas = document.getElementById("lesson10-canvas");
            initGL(canvas);
            initShaders();
            initTexture();
            loadWorld();

            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.enable(gl.DEPTH_TEST);

            document.onkeydown = handleKeyDown;
            document.onkeyup = handleKeyUp;

            tick();
        }

    </script>


    <!--通过这段Css代码来控制Canvas标签的显示信息-->
    <style type="text/css">
        #loadingtext {
            position:absolute;
            top:250px;
            left:150px;
            font-size:2em;
            color: white;
        }
    </style>



</head>


<body onload="webGLStart();">
<br>

<canvas id="lesson10-canvas" style="border: none;" width="500" height="500"></canvas>


<!--这里使用了DIV标签来充当占位符，在载入世界的时候会显示Loading-->
<div id="loadingtext">Loading world...</div>

<br/>
使用方向键或WASD移动，使用 <code>Page Up</code>键和<code>Page Down</code> 键来上看下看。

<br/>
</body>

</html>

```