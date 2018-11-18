//这一次通过模型视图矩阵来是三角形旋转起来
//实现在相同的视点下面去旋转矩阵
//顶点着色器
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +        //存储顶点的位置信息
    'attribute vec4 a_Color;\n' +           //存储顶点的颜色
    'uniform mat4 u_ModelViewMatrix;\n' +   //定义一个模型视图矩阵
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_Position = u_ModelViewMatrix * a_Position;\n' + //模型视图矩阵*当前向量
    '  v_Color = a_Color;\n' +
    '}\n';

//片元着色器
var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +      //指定float数据类型的默认精度水平为 中等水平
    '#endif\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_FragColor = v_Color;\n' +
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

    // Set the vertex coordinates and color (the blue triangle is in the front)
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }

    // Specify the color for clearing <canvas>
    gl.clearColor(0, 0, 0, 1);

    // 获取模型视图矩阵的存储位置
    var u_ModelViewMatrix = gl.getUniformLocation(gl.program, 'u_ModelViewMatrix');
    if (!u_ModelViewMatrix ) {
        console.log('Failed to get the storage locations of u_ModelViewMatrix');
        return;
    }

    // 方法一: 设置视点， 观察点， 和上方向（注意这里的视图矩阵不需要从顶点着色器中获取， 需要直接新建一个视图矩阵）
    var viewMatrix = new Matrix4();
    // 将当前矩阵设置为视图矩阵
    viewMatrix.setLookAt(0.20, 0.25, 0.25, 0, 0, 0, 0, 1, 0);

    //开始计算模型视图矩阵（将视图矩阵 * 旋转矩阵）
    //1.新建一个模型矩阵（旋转矩阵）
    var modelMatrix = new Matrix4();
    modelMatrix.setRotate(-180, 0, 0, 1);
    //2.将当前的视图矩阵乘以模型矩阵就得到了视图模型矩阵
    //将这两个矩阵相乘， 然后将结果赋值给modelViewMatrix模型矩阵变量中
   //modelMatrix = viewMatrix * modelMatrix(这里使用了矩阵库中的方法简化了计算方法)
    var modelViewMatrix = viewMatrix.multiply(modelMatrix);

    //将当前的模型视图矩阵传给顶点着色器中的uniform变量
    //注意这里的第三个参数是视图模型矩阵的元素， 而不是模型视图矩阵本身
    //这里是modelViewmatrix/elements,  而不是modelViewMatrix.elemenets()[error]
    gl.uniformMatrix4fv(u_ModelViewMatrix, false, modelViewMatrix.elements);


  //方法二：上述计算模型视图矩阵的方法也可以简化如下
  /*var modelViewmatrix = new Matrix4();
  modelViewmatrix.setLookAt(0.25, 0.25, 0.25, 0, 0, 0, 0, 1, 0).rotate(-90, 0, 0, 1);
  //将模型视图矩阵偿还给uniform顶点着色器
  gl.uniformMatrix4fv(u_ModelViewMatrix, false,  modelViewmatrix.elements);
 */



    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw the rectangle
    gl.drawArrays(gl.TRIANGLES, 0, n);
}



//着实化我的顶点缓冲区
function initVertexBuffers(gl) {
    var verticesColors = new Float32Array([
        // Vertex coordinates and color(RGBA)
        // 注意这里的顶点坐标的z分量不是0（-0.4， -0.2， 0.0）
        0.0,  0.5,  -0.4,  0.4,  1.0,  0.4, // The back green one
        -0.5, -0.5,  -0.4,  0.4,  1.0,  0.4,
        0.5, -0.5,  -0.4,  1.0,  0.4,  0.4,

        0.5,  0.4,  -0.2,  1.0,  0.4,  0.4, // The middle yellow one
        -0.5,  0.4,  -0.2,  1.0,  1.0,  0.4,
        0.0, -0.6,  -0.2,  1.0,  1.0,  0.4,

        0.0,  0.5,   0.0,  0.4,  0.4,  1.0,  // The front blue one
        -0.5, -0.5,   0.0,  0.4,  0.4,  1.0,
        0.5, -0.5,   0.0,  1.0,  0.4,  0.4,
    ]);
    var n = 9;

    // Create a buffer object
    var vertexColorbuffer = gl.createBuffer();
    if (!vertexColorbuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    // Write the vertex coordinates and color to the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

    var FSIZE = verticesColors.BYTES_PER_ELEMENT;
    // Assign the buffer object to a_Position and enable the assignment
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if(a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
    gl.enableVertexAttribArray(a_Position);

    // Assign the buffer object to a_Color and enable the assignment
    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if(a_Color < 0) {
        console.log('Failed to get the storage location of a_Color');
        return -1;
    }
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
    gl.enableVertexAttribArray(a_Color);

    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return n;
}


