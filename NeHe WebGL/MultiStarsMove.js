var gl;

//初始化WEBGL的上下文信息
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



//初始化顶点着色器和片元着色器
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
    shaderProgram.colorUniform = gl.getUniformLocation(shaderProgram, "uColor");
}


function handleLoadedTexture(texture) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    gl.bindTexture(gl.TEXTURE_2D, null);
}



//初始化我的纹理图片
var starTexture;

function initTexture() {
    starTexture = gl.createTexture();
    starTexture.image = new Image();
    starTexture.image.onload = function () {
        handleLoadedTexture(starTexture)
    }

    starTexture.image.src = "./resources/star.gif";
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



//可以同时按下多个按键
var currentlyPressedKeys = {};

function handleKeyDown(event) {
    currentlyPressedKeys[event.keyCode] = true;
}


function handleKeyUp(event) {
    currentlyPressedKeys[event.keyCode] = false;
}


var zoom = -15;


var tilt = 90;
var spin = 0;


//处理事件的响应函数
function handleKeys() {
    if (currentlyPressedKeys[33]) {
        // Page Up
        zoom -= 0.1;
    }
    if (currentlyPressedKeys[34]) {
        // Page Down
        zoom += 0.1;
    }
    if (currentlyPressedKeys[38]) {
        // Up cursor key
        tilt += 2;
    }
    if (currentlyPressedKeys[40]) {
        // Down cursor key
        tilt -= 2;
    }
}


var starVertexPositionBuffer;
var starVertexTextureCoordBuffer;


//初始化缓冲区（用来存放顶点位置和颜色等信息）
function initBuffers() {
    //初始化我的星星的顶点位置缓冲区
    starVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, starVertexPositionBuffer);
    var vertices = [
        -1.0, -1.0,  0.0,
        1.0, -1.0,  0.0,
        -1.0,  1.0,  0.0,
        1.0,  1.0,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    starVertexPositionBuffer.itemSize = 3;
    starVertexPositionBuffer.numItems = 4;

    //初始化星星的顶点纹理坐标缓冲区（这里的纹理坐标和上面的位置是一一对应起来的）
    starVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, starVertexTextureCoordBuffer);
    var textureCoords = [
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        1.0, 1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    starVertexTextureCoordBuffer.itemSize = 2;
    starVertexTextureCoordBuffer.numItems = 4;
}


function drawStar() {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, starTexture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, starVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, starVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, starVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, starVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, starVertexPositionBuffer.numItems);
}


//我这里新建了一个类（构造函数）
function Star(startingDistance, rotationSpeed) {
    this.angle = 0;
    this.dist = startingDistance;
    this.rotationSpeed = rotationSpeed;

    // Set the colors to a starting value.
    this.randomiseColors();
}

//星星的成员方法一：绘制函数
Star.prototype.draw = function (tilt, spin, twinkle) {
    //每次绘制的之前先把当前的模型视图矩阵的状态保存起来
    mvPushMatrix();

    // Move to the star's position
    mvMatrix.rotY(OAK.SPACE_LOCAL, this.angle, true);
    mvMatrix.translate(OAK.SPACE_LOCAL, this.dist, 0.0, 0.0, true);

    // Rotate back so that the star is facing the viewer
    mvMatrix.rotY(OAK.SPACE_LOCAL, -this.angle, true);
    mvMatrix.rotX(OAK.SPACE_LOCAL, -tilt, true);

    //闪烁的星星
    if (twinkle) {
        // Draw a non-rotating star in the alternate "twinkling" color
        gl.uniform3f(shaderProgram.colorUniform, this.twinkleR, this.twinkleG, this.twinkleB);
        drawStar();
    }

    // All stars spin around the Z axis at the same rate
    mvMatrix.rotZ(OAK.SPACE_LOCAL, spin, true);

    // Draw the star in its main color
    gl.uniform3f(shaderProgram.colorUniform, this.r, this.g, this.b);
    drawStar();

    //绘制完毕，就弹出当前的模型视图矩阵
    mvPopMatrix();
};


//星星的成员方法二：运动函数
var effectiveFPMS = 60 / 1000;
Star.prototype.animate = function (elapsedTime) {
    this.angle += this.rotationSpeed * effectiveFPMS * elapsedTime;

    // Decrease the distance, resetting the star to the outside of
    // the spiral if it's at the center.
    this.dist -= 0.01 * effectiveFPMS * elapsedTime;
    if (this.dist < 0.0) {
        this.dist += 5.0;
        this.randomiseColors();
    }

};


//星星的成员方法三：随机生成不同的颜色
Star.prototype.randomiseColors = function () {
    // Give the star a random color for normal
    // circumstances...
    this.r = Math.random();
    this.g = Math.random();
    this.b = Math.random();

    // When the star is twinkling, we draw it twice, once
    // in the color below (not spinning) and then once in the
    // main color defined above.
    this.twinkleR = Math.random();
    this.twinkleG = Math.random();
    this.twinkleB = Math.random();
};




//开始创建星星对象
var stars = [];

function initWorldObjects() {
    var numStars = 50;

    for (var i=0; i < numStars; i++) {
        stars.push(new Star((i / numStars) * 5.0, i / numStars));
    }
}


//开始绘制场景
function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    //设置透视投影
    pMatrix = okMat4Proj(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);


    //开启颜色的混合效果（关键点：允许物体互相透过彼此，星星图片本身的he藕色部分看起来回是透明效果）
    //当绘制星星的时候，星星黑色的部分会看起来是透明的；星星中不那么明亮的部分，看起来就会更透明一些
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.enable(gl.BLEND);

    mvMatrix = okMat4Trans(0.0, 0.0, zoom);
    mvMatrix.rotX(OAK.SPACE_LOCAL, tilt, true);


    //这里通过获取闪烁复选框是否被选中的状态，来决定是否开启闪光
    var twinkle = document.getElementById("twinkle").checked;
    //循环遍历每一个星星
    for (var i in stars) {
        stars[i].draw(tilt, spin, twinkle);
        spin += 0.1;
    }

}



//这里循环遍历每一个星星，让他们都自己动起来
var lastTime = 0;

function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;

        for (var i in stars) {
            stars[i].animate(elapsed);
        }
    }
    lastTime = timeNow;

}


function tick() {
    okRequestAnimationFrame(tick);
    handleKeys();
    drawScene();
    animate();
}




//主函数
function webGLStart() {
    var canvas = document.getElementById("lesson09-canvas");
    initGL(canvas);
    initShaders();

    //重要部分
    initBuffers();
    initTexture();
    initWorldObjects();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    //注册事件
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    tick();
}

