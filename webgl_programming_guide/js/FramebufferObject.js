// FramebufferObject.js (c) matsuda and kanda
// Vertex shader program
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec2 a_TexCoord;\n' +
    'uniform mat4 u_MvpMatrix;\n' +
    'varying vec2 v_TexCoord;\n' +
    'void main() {\n' +
    '  gl_Position = u_MvpMatrix * a_Position;\n' +
    '  v_TexCoord = a_TexCoord;\n' +
    '}\n';

// Fragment shader program
var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'uniform sampler2D u_Sampler;\n' +
    'varying vec2 v_TexCoord;\n' +
    'void main() {\n' +
    '  gl_FragColor = texture2D(u_Sampler, v_TexCoord);\n' +
    '}\n';

// 离屏绘制的尺寸（cavas的大小为400*400）
var OFFSCREEN_WIDTH = 256;
var OFFSCREEN_HEIGHT = 256;


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


    // Get the storage location of attribute variables and uniform variables
    var program = gl.program; // Get program object
    program.a_Position = gl.getAttribLocation(program, 'a_Position');
    program.a_TexCoord = gl.getAttribLocation(program, 'a_TexCoord');
    program.u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix');
    if (program.a_Position < 0 || program.a_TexCoord < 0 || !program.u_MvpMatrix) {
        console.log('Failed to get the storage location of a_Position, a_TexCoord, u_MvpMatrix');
        return;
    }

    // Set the vertex information
    var cube = initVertexBuffersForCube(gl);
    var plane = initVertexBuffersForPlane(gl);
    if (!cube || !plane) {
        console.log('Failed to set the vertex information');
        return;
    }

    // Set texture
    var texture = initTextures(gl);
    if (!texture) {
        console.log('Failed to intialize the texture.');
        return;
    }

    // 1.创建帧缓冲区对象（初始化我的帧缓冲区）
    var fbo = initFramebufferObject(gl);
    if (!fbo) {
        console.log('Failed to intialize the framebuffer object (FBO)');
        return;
    }

    // Enable depth test
    gl.enable(gl.DEPTH_TEST);   //  gl.enable(gl.CULL_FACE);  //可以开启消除隐藏面的功能，让WEBGL不再绘制图形的背面，以提高绘制速度

    var viewProjMatrix = new Matrix4();   // Prepare view projection matrix for color buffer
    viewProjMatrix.setPerspective(30, canvas.width/canvas.height, 1.0, 100.0);
    viewProjMatrix.lookAt(0.0, 0.0, 7.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);


    // 为帧缓冲区做准备
    var viewProjMatrixFBO = new Matrix4();   // Prepare view projection matrix for FBO
    viewProjMatrixFBO.setPerspective(30.0, OFFSCREEN_WIDTH/OFFSCREEN_HEIGHT, 1.0, 100.0);
    viewProjMatrixFBO.lookAt(0.0, 2.0, 7.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

    // Start drawing
    var currentAngle = 0.0; // Current rotation angle (degrees)
    var tick = function() {
        currentAngle = animate(currentAngle);  // Update current rotation angle
        draw(gl, canvas, fbo, plane, cube, currentAngle, texture, viewProjMatrix, viewProjMatrixFBO);
        window.requestAnimationFrame(tick, canvas);
    };
    tick();
}

function initVertexBuffersForCube(gl) {
    // Create a cube
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3

    // Vertex coordinates
    var vertices = new Float32Array([
        1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,    // v0-v1-v2-v3 front
        1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,    // v0-v3-v4-v5 right
        1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,    // v0-v5-v6-v1 up
        -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,    // v1-v6-v7-v2 left
        -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,    // v7-v4-v3-v2 down
        1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0     // v4-v7-v6-v5 back
    ]);

    // Texture coordinates
    var texCoords = new Float32Array([
        1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v0-v1-v2-v3 front
        0.0, 1.0,   0.0, 0.0,   1.0, 0.0,   1.0, 1.0,    // v0-v3-v4-v5 right
        1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0,    // v0-v5-v6-v1 up
        1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v1-v6-v7-v2 left
        0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,    // v7-v4-v3-v2 down
        0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0     // v4-v7-v6-v5 back
    ]);

    // Indices of the vertices
    var indices = new Uint8Array([
        0, 1, 2,   0, 2, 3,    // front
        4, 5, 6,   4, 6, 7,    // right
        8, 9,10,   8,10,11,    // up
        12,13,14,  12,14,15,    // left
        16,17,18,  16,18,19,    // down
        20,21,22,  20,22,23     // back
    ])

    var o = new Object();  // Create the "Object" object to return multiple objects.

    // Write vertex information to buffer object
    o.vertexBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
    o.texCoordBuffer = initArrayBufferForLaterUse(gl, texCoords, 2, gl.FLOAT);
    o.indexBuffer = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);
    if (!o.vertexBuffer || !o.texCoordBuffer || !o.indexBuffer) return null;

    o.numIndices = indices.length;

    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return o;
}


// 绘制我的正方形
function initVertexBuffersForPlane(gl) {
    // Create face
    //  v1------v0
    //  |        |
    //  |        |
    //  |        |
    //  v2------v3

    // Vertex coordinates
    var vertices = new Float32Array([
        1.0, 1.0, 0.0,  -1.0, 1.0, 0.0,  -1.0,-1.0, 0.0,   1.0,-1.0, 0.0    // v0-v1-v2-v3
    ]);

    // Texture coordinates
    var texCoords = new Float32Array([1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0]);

    // Indices of the vertices
    var indices = new Uint8Array([0, 1, 2,   0, 2, 3]);

    var o = new Object(); // Create the "Object" object to return multiple objects.

    // Write vertex information to buffer object
    o.vertexBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
    o.texCoordBuffer = initArrayBufferForLaterUse(gl, texCoords, 2, gl.FLOAT);
    o.indexBuffer = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);
    if (!o.vertexBuffer || !o.texCoordBuffer || !o.indexBuffer) return null;

    o.numIndices = indices.length;

    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return o;
}

//初始化顶点缓冲区坐标数据
function initArrayBufferForLaterUse(gl, data, num, type) {
    // 创建一个缓冲区对象
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return null;
    }
    // 向缓冲区对象中写入数据
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    // Store the necessary information to assign the object to the attribute variable later
    buffer.num = num;
    buffer.type = type;

    return buffer;
}

//初始化顶点索引坐标缓冲区
function initElementArrayBufferForLaterUse(gl, data, type) {
    // Create a buffer object
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return null;
    }
    // Write date into the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

    buffer.type = type;

    return buffer;
}


//初始化纹理
function initTextures(gl) {
    var texture = gl.createTexture();   // Create a texture object
    if (!texture) {
        console.log('Failed to create the Texture object');
        return null;
    }

    // Get storage location of u_Sampler
    var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
    if (!u_Sampler) {
        console.log('Failed to get the storage location of u_Sampler');
        return null;
    }

    var image = new Image();  // Create image object
    if (!image) {
        console.log('Failed to create the Image object');
        return null;
    }

    // 处理图片加载完成之后的系列操作（图片的异步处理）
    image.onload = function() {
        // Write image data to texture object
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);  // Flip the image Y coordinate
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        // Pass the texure unit 0 to u_Sampler
        gl.uniform1i(u_Sampler, 0);

        gl.bindTexture(gl.TEXTURE_2D, null); // Unbind the texture object
    };

    // Tell the browser to load an Image
    image.src = '../resources/sky_cloud.jpg';

    return texture;
}


//初始化我的帧缓冲区对象
function initFramebufferObject(gl) {
    var framebuffer, texture, depthBuffer;

    // Define the error handling function
    var error = function() {
        //开始根据framebuffer，texture，depthbuffer出错，就删除
        if (framebuffer) gl.deleteFramebuffer(framebuffer);     //删除帧缓冲区对象
        if (texture) gl.deleteTexture(texture);                 //删除纹理对象
        if (depthBuffer) gl.deleteRenderbuffer(depthBuffer);    //删除渲染缓冲区对象
        return null;
    }

    // 1.创建我的帧缓冲区（FBO）对象
    framebuffer = gl.createFramebuffer();
    if (!framebuffer) {
        console.log('Failed to create frame buffer object');
        return error();
    }

    // 创建一个纹理对象并且设置他的尺寸和参数
    texture = gl.createTexture(); // Create a texture object
    if (!texture) {
        console.log('Failed to create texture object');
        return error();
    }
    gl.bindTexture(gl.TEXTURE_2D, texture); // Bind the object to target
    //创建纹理对象并设置其尺寸和参数，把宽度和高度分别存储在了OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT这两个变量中，设置地比canvas小一点，从而加快绘制的速度
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    framebuffer.texture = texture; // 保存纹理对象

    // 创建渲染缓冲区对象并设置其尺寸和参数
    depthBuffer = gl.createRenderbuffer(); // 3.创建一个渲染缓冲区
    if (!depthBuffer) {
        console.log('Failed to create renderbuffer object');
        return error();
    }

    //4.绑定渲染缓冲区对象并且设置其尺寸，depthBuffer为被绑定的渲染缓冲区对象
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer); // Bind the object to target
    // 设置渲染缓冲区的格式、宽度、高度
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);

    //将纹理和渲染缓冲区对象关联到帧缓冲区对象上
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    //5.将帧缓冲区的颜色关联对象指定为一个纹理对象
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    //将渲染缓冲区depthBuffer对象关联到gl.FRAMEBUFFER帧缓冲区对象，渲染缓冲区对象的作用是帮助进行隐藏面消除
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);


    // 7.检查帧缓冲区是否正确配置
    var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    // 如果返回的结果e是0就不会出错，否则相当于是出错了
    if (gl.FRAMEBUFFER_COMPLETE !== e) {
        console.log('Frame buffer object is incomplete: ' + e.toString());
        return error();
    }

    // Unbind the buffer object
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);


    return framebuffer;
}

//在帧缓冲区对象中开始绘制图
function draw(gl, canvas, fbo, plane, cube, angle, texture, viewProjMatrix, viewProjMatrixFBO) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);              // Change the drawing destination to FBO
    gl.viewport(0, 0, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT); // Set a viewport for FBO

    gl.clearColor(0.2, 0.2, 0.4, 1.0); // Set clear color (the color is slightly changed)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  // Clear FBO

    //绘制立方体
    drawTexturedCube(gl, gl.program, cube, angle, texture, viewProjMatrixFBO);   // Draw the cube

    //切换绘制目标为颜色缓冲区
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);        // Change the drawing destination to color buffer
    // 将视窗设置回去canvas原本的尺寸大小
    gl.viewport(0, 0, canvas.width, canvas.height);  // Set the size of viewport back to that of <canvas>

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear the color buffer

    //绘制矩形平面
    drawTexturedPlane(gl, gl.program, plane, angle, fbo.texture, viewProjMatrix);  // Draw the plane
}

// Coordinate transformation matrix
var g_modelMatrix = new Matrix4();
var g_mvpMatrix = new Matrix4();

function drawTexturedCube(gl, program, o, angle, texture, viewProjMatrix) {
    // Calculate a model matrix
    g_modelMatrix.setRotate(20.0, 1.0, 0.0, 0.0);
    g_modelMatrix.rotate(angle, 0.0, 1.0, 0.0);

    // Calculate the model view project matrix and pass it to u_MvpMatrix
    g_mvpMatrix.set(viewProjMatrix);
    g_mvpMatrix.multiply(g_modelMatrix);
    gl.uniformMatrix4fv(program.u_MvpMatrix, false, g_mvpMatrix.elements);

    drawTexturedObject(gl, program, o, texture);
}

function drawTexturedPlane(gl, program, o, angle, texture, viewProjMatrix) {
    // Calculate a model matrix
    g_modelMatrix.setTranslate(0, 0, 1);
    g_modelMatrix.rotate(20.0, 1.0, 0.0, 0.0);
    g_modelMatrix.rotate(angle, 0.0, 1.0, 0.0);

    // Calculate the model view project matrix and pass it to u_MvpMatrix
    g_mvpMatrix.set(viewProjMatrix);
    g_mvpMatrix.multiply(g_modelMatrix);
    gl.uniformMatrix4fv(program.u_MvpMatrix, false, g_mvpMatrix.elements);

    drawTexturedObject(gl, program, o, texture);
}

function drawTexturedObject(gl, program, o, texture) {
    // Assign the buffer objects and enable the assignment
    initAttributeVariable(gl, program.a_Position, o.vertexBuffer);    // Vertex coordinates
    initAttributeVariable(gl, program.a_TexCoord, o.texCoordBuffer);  // Texture coordinates

    // Bind the texture object to the target
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Draw
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);
    gl.drawElements(gl.TRIANGLES, o.numIndices, o.indexBuffer.type, 0);
}

// Assign the buffer objects and enable the assignment
function initAttributeVariable(gl, a_attribute, buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);
}

//绘制地问个立方体
function drawTexturedCube2(gl, o, angle, texture, viewpProjMatrix, u_MvpMatrix) {
    // Calculate a model matrix
    g_modelMatrix.rotate(20.0, 1.0, 0.0, 0.0);
    g_modelMatrix.rotate(angle, 0.0, 1.0, 0.0);
    g_modelMatrix.scale(1, 1, 1);

    // Calculate the model view project matrix and pass it to u_MvpMatrix
    g_mvpMatrix.set(vpMatrix);
    g_mvpMatrix.multiply(g_modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, g_mvpMatrix.elements);

    drawTexturedObject(gl, o, texture);
}


//开始转动场景
var ANGLE_STEP = 30;   // The increments of rotation angle (degrees)

var last = Date.now(); // Last time that this function was called
function animate(angle) {
    var now = Date.now();   // Calculate the elapsed time
    var elapsed = now - last;
    last = now;
    // Update the current rotation angle (adjusted by the elapsed time)
    var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
    return newAngle % 360;
}
