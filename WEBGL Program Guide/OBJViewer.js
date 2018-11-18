// OBJViewer.js (c) 2012 matsuda and itami
// Vertex shader program
/*
* 主要实现步骤如下：
* 1.准备一个空的缓冲区buffer对象；
* 2.开始读取OBJ文件中的内容（顶点坐标，材质等信息）
* 3.开始逐行解析OBJ文件中的顶点和材质信息；
* 4.将解析出来的顶点数据写入到我们已经准备好的缓冲区buffer对象中去；
* 5.开始进行绘制（包括动画效果）
*
* */

var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'attribute vec4 a_Normal;\n' +
    'uniform mat4 u_MvpMatrix;\n' +
    'uniform mat4 u_NormalMatrix;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  vec3 lightDirection = vec3(-0.35, 0.35, 0.87);\n' +                  //这个是我的光照的方向
    '  gl_Position = u_MvpMatrix * a_Position;\n' +                         //可以计算出来我的顶点位置在模型视图投影变换后的位置
    '  vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
    '  float nDotL = max(dot(normal, lightDirection), 0.0);\n' +
    '  v_Color = vec4(a_Color.rgb * nDotL, a_Color.a);\n' +
    '}\n';

// Fragment shader program
var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
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

    // Set the clear color and enable the depth test
    gl.clearColor(1.0, 0.8, 0.2, 1.0);
    gl.enable(gl.DEPTH_TEST);


    // 获取attribute变量和uniform变量的存储地址
    var program = gl.program;
    program.a_Position = gl.getAttribLocation(program, 'a_Position');
    program.a_Normal = gl.getAttribLocation(program, 'a_Normal');
    program.a_Color = gl.getAttribLocation(program, 'a_Color');
    program.u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix');
    program.u_NormalMatrix = gl.getUniformLocation(program, 'u_NormalMatrix');

    if (program.a_Position < 0 ||  program.a_Normal < 0 || program.a_Color < 0 ||
        !program.u_MvpMatrix || !program.u_NormalMatrix) {
        console.log('attribute, uniform varible load error…………');
        return;
    }

    // 为顶点坐标，颜色和法线准备空缓冲区对象（调用该函数后仅仅会创建一个新的缓冲区对象，还没有开始加载顶点，法向量和颜色等信息）
    var model = initVertexBuffers(gl, program);
    //（将缓冲区对象保存为model对象，这样我的空的缓冲区对象就已经准备完毕了）
    if (!model) {
        console.log('Failed to set the vertex information');
        return;
    }

    // 初始化我的模型视图投影矩阵
    var viewProjMatrix = new Matrix4();
    viewProjMatrix.setPerspective(30.0, canvas.width/canvas.height, 1.0, 5000.0);
    viewProjMatrix.lookAt(0.0, 500.0, 200.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

    // 开始读取我本地的obj文件（文件地址url, webgl上下文，存储有多个缓冲区对象的model对象 ）
    readOBJFile('cube.obj', gl, model, 60, true);    //从这里往后的代码必须要理解；3objects.mqo

    //实现场景的运动
    var currentAngle = 0.0; // Current rotation angle [degree]
    var tick = function() {   // Start drawing
        currentAngle = animate(currentAngle); // Update current rotation angle
        draw(gl, gl.program, currentAngle, viewProjMatrix, model);
        requestAnimationFrame(tick, canvas);
    };

    tick();

    //我在这里来测试一下我自己定义的StringParser函数的使用
    var sp = new StringParser("Tomorrow is my Moyher's Birthday!")
    // 显示一下我这个构造函数的成员属性，和我的成员函数
    console.log(sp.index+" "+sp.str);  //0 Tomorrow is my Moyher's Birthday!
}




//----------------------------- 步骤一：创建缓冲区对象并且进行初始化-----------------------------
function initVertexBuffers(gl, program) {
    var o = new Object(); // Utilize Object object to return multiple buffer objects
    o.vertexBuffer = createEmptyArrayBuffer(gl, program.a_Position, 3, gl.FLOAT);       //创建顶点缓冲区对象
    o.normalBuffer = createEmptyArrayBuffer(gl, program.a_Normal, 3, gl.FLOAT);         //创建法向量缓冲区对象
    o.colorBuffer = createEmptyArrayBuffer(gl, program.a_Color, 4, gl.FLOAT);           //创建颜色缓冲区对象
    o.indexBuffer = gl.createBuffer();
    if (!o.vertexBuffer || !o.normalBuffer || !o.colorBuffer || !o.indexBuffer) { return null; }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    //把顶点，法向量和颜色缓冲区都存储在object这个对象里面，并且返回(这个对象现在基本具有了四个缓冲区对象了哈)
    return o;
}

// 创建一个空的缓冲区对象，并且将其分配给相应的attribute变量，并且开启
function createEmptyArrayBuffer(gl, a_attribute, num, type) {
    var buffer =  gl.createBuffer();  // Create a buffer object
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return null;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);                         //绑定缓冲区到目标对象
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);    //将缓冲区分配给了相应的attribute变量，但是还没有开始向里面写入数据呢
    gl.enableVertexAttribArray(a_attribute);                        //正式开启这个分配

    return buffer;
}




// -----------------------------步骤二：开始从本地读取obj格式的文件（ajax 方式）---------------------------
function readOBJFile(fileName, gl, model, scale, reverse) {
    //1.创建一个XMLHttpRequest对象
    var request = new XMLHttpRequest();

    //2.注册事件响应函数，党模型加载完成的时候回调用【会在浏览器加载到我本地的obj模型文件后会执行该函数的调用】
    request.onreadystatechange = function() {
        //首先会检查加载文件的请求是都发生了错误
        if (request.readyState === 4 && request.status !== 404) {
            //加载文件的请求完全正确就会开始读取文件中的内容
            //(字符串形式的模型文件的文本， 文件名称， webgl上下文，存储有顶点颜色法向量的缓冲区对象)
            // 在这里把从服务器中返回的文本内容打印出来
            //alert("文件内容接收成功啦："+request.responseText);   //由于这个文件是异步加载的，通过调试不一定能看得出文本信息
            //onReadOBJFile(request.responseText, fileName, gl, model, scale, reverse);   //这里我们首先来读取OBJ文件

            //为了测试一下调试效果，在这里把内容修改一下哈：
            var content = "# Blender v2.60 (sub 0) OBJ File: ''\n" +
                "# www.blender.org\n" +
                "mtllib cube.mtl\n" +
                "o Cube\n" +
                "v 1.000000 -1.000000 -1.000000\n" +        //在这里来设置立方体的顶点信息
                "v 1.000000 -1.000000 1.000000\n" +
                "v -1.000000 -1.000000 1.000000\n" +        //下底面（顺时针方向）
                "v -1.000000 -1.000000 -1.000000\n" +

                "v 1.000000 1.000000 -1.000000\n" +
                "v 1.000000 1.000000 1.000001\n" +
                "v -1.000000 1.000000 1.000000\n" +         //上顶面（顺时针方向）
                "v -1.000000 1.000000 -1.000000\n" +

                "usemtl Material\n" +                    //在这里来使用材质（这里使用了Material这个材质）
                "f 1 2 3 4\n" +         //底面
                "f 5 8 7 6\n" +         //上面
                "f 2 6 7 3\n" +         //正前面
                "f 3 7 8 4\n" +         //左面
                "f 5 1 4 8\n" +         //最后面

                "usemtl Material.001\n" +               //这里使用了Material.001这个材质
                "f 1 5 6 2\n";          //右面


            //再去调用我的解析文件的函数
            onReadOBJFile(content, fileName, gl, model, scale, reverse);
        }
    }
    //使用open()方法创建一个Http Get请求
    request.open('GET', fileName, true); // 创建一个获取文件的请求信息，把文件名字传过去（请求方式，文件名称， 请求是否异步）
    request.send();                      // 开始正式发送这个请求， 开始加载这个模型文件
}

var g_objDoc = null;      // 用于存储obj文件中的文本内容信息（已经读取出来的数据信息）
var g_drawingInfo = null; // 用于绘制三维模型的信息





//------------------------------ 步骤三：当我的OBJ 文件已经读取完成并开始解析结果--------------------------------------
// 当obj文件已经读取完成
function onReadOBJFile(fileString, fileName, gl, o, scale, reverse) {

    //注意这里的fileString就是从服务器中返回过来的文本信息
    alert("fileString:"+fileString+"  fileName:"+fileName);

    var objDoc = new OBJDoc(fileName);  // 创建 OBJDoc 对象（这里是我自己定义的一个OBJDoc对象）

    //将字符串形式的文本解析成为WEBGL易用的格式（pase（）方法是我的这个构造函数的成员方法）
    var result = objDoc.parse(fileString, scale, reverse); // Parse the file逐行解析字符串
    if (!result) {
        g_objDoc = null; g_drawingInfo = null;
        console.log("OBJ file parsing error.");
        return;
    }

    //将解析好的objDoc对象赋值给g_objDoc对象（此时objDoc里面已经获取到了文本信息）
    g_objDoc = objDoc;

    console.log("开始输出我的obj文件信息：");
    console.log(g_objDoc);
}




//-------------------------------------------步骤五：新建我的模型视图投影矩阵（并且开始绘制我的立方体）------------------------------------------------------
// Coordinate transformation matrix
var g_modelMatrix = new Matrix4();
var g_mvpMatrix = new Matrix4();
var g_normalMatrix = new Matrix4();

// 绘制函数
function draw(gl, program, angle, viewProjMatrix, model) {
    if (g_objDoc != null && g_objDoc.isMTLComplete()){ // OBJ and all MTLs are available
       //把文件解析完了，此时的效果
        g_drawingInfo = onReadComplete(gl, model, g_objDoc);
        g_objDoc = null;
    }
    if (!g_drawingInfo) return;   // 如果获取信息失败

    //设置画布的颜色
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  // Clear color and depth buffers

    g_modelMatrix.setRotate(angle, 1.0, 0.0, 0.0); // 適当に回転
    g_modelMatrix.rotate(angle, 0.0, 1.0, 0.0);
    g_modelMatrix.rotate(angle, 0.0, 0.0, 1.0);

    //计算立方体的逆转置矩阵（法向量在旋转的过程中不断地改变， 因此需要不断计算）
    // Calculate the normal transformation matrix and pass it to u_NormalMatrix
    g_normalMatrix.setInverseOf(g_modelMatrix);
    g_normalMatrix.transpose();
    gl.uniformMatrix4fv(program.u_NormalMatrix, false, g_normalMatrix.elements);

    // Calculate the model view project matrix and pass it to u_MvpMatrix
    g_mvpMatrix.set(viewProjMatrix);
    g_mvpMatrix.multiply(g_modelMatrix);
    gl.uniformMatrix4fv(program.u_MvpMatrix, false, g_mvpMatrix.elements);

    // Draw
    gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
}





//-----------------------------------步骤四：顶点数据解析完成之后开始写入到缓冲区--------------------------------------------
function onReadComplete(gl, model, objDoc) {
    // 从OBJ文件中获取顶点坐标，颜色等用于绘制的信息
    var drawingInfo = objDoc.getDrawingInfo();

    // 将数据写入各自的缓冲区（顶点信息应该是OK的！）
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);


    //立方体的顶点颜色信息传过来了没有？？？
    gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);

    // 将顶点索引数据写入到缓冲区对象
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

    return drawingInfo;
}


//实现场景的不断重绘功能
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




//------------------------------------------下面的就是OBJ文件内容解析的具体实现步骤----------------------------------------------------------
//------------------------------------------------------------------------------
// OBJParser
//------------------------------------------------------------------------------


//为了能够方便地表达出来一个文件的属性信息；我在这里讲这个文件定义为一个对象
// OBJDoc object
// Constructor（这是cube.obj文件对象的构造函数）；下面的5个成员属性信息主要用来存储解析出来的数据
var OBJDoc = function(fileName) {
    //这个构造函数在初始化的时候，已经先后把文件名，材质，对象，顶点，法向量等信息都一并初始化了哈
    this.fileName = fileName;      //文件名称
    this.mtls = new Array(0);      // 材质mtl列表
    this.objects = new Array(0);   // 对象object列表
    this.vertices = new Array(0);  // 顶点Vertex列表
    this.normals = new Array(0);   // 法线Normal列表
}


// 开始解析OBJ文件中的文本（这个其实是OBJDoc的成员函数，当一个对象实例被构建起来的时候，这个对象的成员函数也会相继被调用起来）
OBJDoc.prototype.parse = function(fileString, scale, reverse) {         //fileString 用来接收字符串形式的模型文件文本
    var lines = fileString.split('\n');  // 把文件内容拆解成逐行的（分解成若干个部分），分解成一行一行的数据，并且保存在lines这个数组中
    lines.push(null); // 添加末尾行作为标识（作为显式的数组结尾标记）
    var index = 0;    // 初始化当前行索引（用于表示模型文件的文本总行数）

    var currentObject = null;
    var currentMaterialName = "";

    // Parse line by line
    var line;         // 接收当前的行文本
    var sp = new StringParser();  // Create StringParser
    while ((line = lines[index++]) != null) {
        sp.init(line);                  // 创建一个 StringParser 类型的对象
        //主要用来获得OBJ文件每一行的第一个元素
        var command = sp.getWord();     // 获取指令名称（某一行的第一个文本）
        if(command == null)	 continue;  // 检查command指令是否为空（为空的话就直接结束当前的循环）


        //这里是根据每一行的第一个字母的情况，去执行不同的文件内容解析操作
        switch(command){
            case '#':
                continue;  // 跳过注释（如果这一行的首字母是#，说明这一行是注释，就直接使用Continue语句跳过哈）
            case 'mtllib':     // 读取材质文件
                //先获得 mtl的文件路径
                var path = this.parseMtllib(sp, this.fileName);
                var mtl = new MTLDoc();   // Create MTL instance
                this.mtls.push(mtl);
                var request = new XMLHttpRequest();
                request.onreadystatechange = function() {
                    if (request.readyState == 4) {
                        if (request.status != 404) {

                            //onReadMTLFile(request.responseText, mtl);       //开始读取mtl文件
                            //为了在这里模拟MTL文件中的内容，现在处理如下：
                            var mtlContent = "# Blender MTL File: ''\n" +
                                "# Material Count: 2\n" +
                                "newmtl Material\n" +
                                "Ka 0.000000 0.000000 0.000000\n" +         //环境光
                                "Kd 0.000000 1.000000 0.000000\n" +         //漫射色（也就是物体表面本来的颜色）
                                "Ks 0.000000 0.000000 0.000000\n" +         //高光色
                                "Ns 96.078431\n" +                          //指定了高光色颜色的权重
                                "Ni 1.000000\n" +                           //表面的光学密度
                                "d 1.000000\n" +                            //透明度
                                "illum 0\n" +

                                "newmtl Material.001\n" +
                                "Ka 0.000000 0.000000 0.000000\n" +
                                "Kd 1.000000 0.000000 0.000000\n" +
                                "Ks 0.000000 0.000000 0.000000\n" +
                                "Ns 96.078431\n" +
                                "Ni 1.000000\n" +
                                "d 1.000000\n" +
                                "illum 0\n";
                            alert("MTL文件加载完成啦哈："+mtlContent);
                            //开始去解析我的本地MTL文件内容
                            onReadMTLFile(mtlContent, mtl);
                        }else{
                            mtl.complete = true;
                        }
                    }
                }
                request.open('GET', path, true);  // 创建请求
                request.send();                   // 发送请求
                continue; // 开始解析下一行
            case 'o':    //暂时还没有使用
                //在这里显示了对象的名字
            case 'g':   // 读取对象名称
                var object = this.parseObjectName(sp);
                this.objects.push(object);
                currentObject = object;
                continue; // Go to the next line
            case 'v':   // 读取顶点
                var vertex = this.parseVertex(sp, scale);
                this.vertices.push(vertex);
                continue; // 解析下一行
            case 'vn':   // 读取法线
                var normal = this.parseNormal(sp);
                this.normals.push(normal);
                continue; // Go to the next line
            case 'usemtl': // 读取材质名称
                currentMaterialName = this.parseUsemtl(sp);
                continue; // Go to the next line
            case 'f': // 读取表面的信息
                var face = this.parseFace(sp, currentMaterialName, this.vertices, reverse);
                currentObject.addFace(face);
                continue; // 直接结束当前循环，进入到下一个循环
        }
    }

    return true;
}

OBJDoc.prototype.parseMtllib = function(sp, fileName) {
    // Get directory path
    var i = fileName.lastIndexOf("/");
    var dirPath = "";
    if(i > 0) dirPath = fileName.substr(0, i+1);   //stringObject.substr(start,length)
    console.log("filename:"+fileName+" drrPath:"+dirPath);

    return dirPath + sp.getWord();   // Get path
}

OBJDoc.prototype.parseObjectName = function(sp) {
    var name = sp.getWord();
    //console.log("name is"+name);   name is cube
    return (new OBJObject(name));
}

//开始解析顶点数据信息（把每一个顶点从一个单位立方体，长宽高分别扩展了60倍数之后的效果！）
OBJDoc.prototype.parseVertex = function(sp, scale) {
    //这里使用getFloat()函数来获取XYZ的坐标值，并且将其乘以一个缩放系数，最后利用这三个值新建一个Vertex对象并且返回
    var x = sp.getFloat() * scale;
    var y = sp.getFloat() * scale;
    var z = sp.getFloat() * scale;
    return (new Vertex(x, y, z));
}

OBJDoc.prototype.parseNormal = function(sp) {
    var x = sp.getFloat();
    var y = sp.getFloat();
    var z = sp.getFloat();
    return (new Normal(x, y, z));
}

OBJDoc.prototype.parseUsemtl = function(sp) {
    return sp.getWord();
}

OBJDoc.prototype.parseFace = function(sp, materialName, vertices, reverse) {
    var face = new Face(materialName);
    // get indices
    for(;;){
        var word = sp.getWord();
        if(word == null) break;
        var subWords = word.split('/');
        if(subWords.length >= 1){
            var vi = parseInt(subWords[0]) - 1;
            face.vIndices.push(vi);
        }
        if(subWords.length >= 3){
            var ni = parseInt(subWords[2]) - 1;
            face.nIndices.push(ni);
        }else{
            face.nIndices.push(-1);
        }
    }

    // calc normal
    var v0 = [
        vertices[face.vIndices[0]].x,
        vertices[face.vIndices[0]].y,
        vertices[face.vIndices[0]].z];
    var v1 = [
        vertices[face.vIndices[1]].x,
        vertices[face.vIndices[1]].y,
        vertices[face.vIndices[1]].z];
    var v2 = [
        vertices[face.vIndices[2]].x,
        vertices[face.vIndices[2]].y,
        vertices[face.vIndices[2]].z];

    // 如果文件里面没有法向量信息，我就在这里来自己计算法向量
    var normal = calcNormal(v0, v1, v2);
    // 法線が正しく求められたか調べる
    if (normal == null) {
        if (face.vIndices.length >= 4) { // 面が四角形なら別の3点の組み合わせで法線計算
            var v3 = [
                vertices[face.vIndices[3]].x,
                vertices[face.vIndices[3]].y,
                vertices[face.vIndices[3]].z];
            normal = calcNormal(v1, v2, v3);
        }
        if(normal == null){         // 法線が求められなかったのでY軸方向の法線とする
            normal = [0.0, 1.0, 0.0];
        }
    }
    //如果要反转（求出运动过程中的法向量，逆转置矩阵）
    if(reverse){
        normal[0] = -normal[0];
        normal[1] = -normal[1];
        normal[2] = -normal[2];
    }
    face.normal = new Normal(normal[0], normal[1], normal[2]);

    // 如果一个面有三个点，我就把它分割成为一个三角形
    if(face.vIndices.length > 3){
        var n = face.vIndices.length - 2;
        var newVIndices = new Array(n * 3);
        var newNIndices = new Array(n * 3);
        for(var i=0; i<n; i++){
            newVIndices[i * 3 + 0] = face.vIndices[0];
            newVIndices[i * 3 + 1] = face.vIndices[i + 1];
            newVIndices[i * 3 + 2] = face.vIndices[i + 2];
            newNIndices[i * 3 + 0] = face.nIndices[0];
            newNIndices[i * 3 + 1] = face.nIndices[i + 1];
            newNIndices[i * 3 + 2] = face.nIndices[i + 2];
        }
        face.vIndices = newVIndices;
        face.nIndices = newNIndices;
    }
    face.numIndices = face.vIndices.length;

    return face;
}


//开始读取MTL文件
//当前解析：MTL文件的主要Bug
/*
* bug1:在解析 newmtl后面的文件名字是，未能正确解析出来名字
* bug2:解析颜色的是RGB颜色中的分量B解析错误(NAN)
*
* */
// Analyze the material file(分析材质文件)
function onReadMTLFile(fileString, mtl) {
    var lines = fileString.split('\n');  // Break up into lines and store them as array
    lines.push(null);           // Append null
    var index = 0;              // Initialize index of line

    // Parse line by line
    var line;      // A string in the line to be parsed
    var name = ""; // Material name
    var sp = new StringParser();  // Create StringParser
    while ((line = lines[index++]) != null) {
        sp.init(line);                  // init StringParser
        var command = sp.getWord();     // Get command
        //console.log("sp.getWord()"+sp.getWord());  //【严重警告：不要随便地去调用一些有返回值的函数，否则会很麻烦的】
        if(command == null)	 continue;  // check null command


        //在这里我们也可以来扩展Ka，Kd,ks, Ns, Ni, d, illum等参数的解析
        switch(command){
            case '#':
                continue;    // Skip comments
            case 'newmtl': // 【解析文件的名字出现问题的地方就是这里哈！】：时间：2018年1月29日星期一17:10分钟
                name = mtl.parseNewmtl(sp);    // Get name; 这里获取失败
                //name = "Material.001";
                continue; // Go to the next line
            case 'Kd':   // Read normal
                if(name == "") continue; // Go to the next line because of Error
                var material = mtl.parseRGB(sp, name);
                mtl.materials.push(material);  //把物体表面的漫射色存储起来
                name = "";
                continue; // Go to the next line
        }
    }
    mtl.complete = true;
}

// Check Materials
OBJDoc.prototype.isMTLComplete = function() {
    if(this.mtls.length == 0) return true;
    for(var i = 0; i < this.mtls.length; i++){
        if(!this.mtls[i].complete) return false;
    }
    return true;
}



// Find color by material name
OBJDoc.prototype.findColor = function(name){
    //如果在文件里面找到了这个颜色，我就返回出去；否则我就使用我自己定义的一个颜色
    for(var i = 0; i < this.mtls.length; i++){
        for(var j = 0; j < this.mtls[i].materials.length; j++){
            if(this.mtls[i].materials[j].name == name){
                return(this.mtls[i].materials[j].color)
            }
        }
    }
    return(new Color(0.8, 0.8, 0.8, 1));
}



//------------------------------------------------------------------------------
// 获取待绘制的三维模型信息
OBJDoc.prototype.getDrawingInfo = function() {
    // 创建顶点坐标，法线，颜色和索引值的数组
    var numIndices = 0;
    for(var i = 0; i < this.objects.length; i++){
        numIndices += this.objects[i].numIndices;
    }
    var numVertices = numIndices;
    var vertices = new Float32Array(numVertices * 3);
    var normals = new Float32Array(numVertices * 3);
    var colors = new Float32Array(numVertices * 4);
    var indices = new Uint16Array(numIndices);

    // 设置顶点、法线和颜色（在这里同时也把顶点索引的值都设置了哈！）
    var index_indices = 0;
    for(var i = 0; i < this.objects.length; i++){
        var object = this.objects[i];
        //这个for循环主要用于抽取表面的每个顶点索引信息，把顶点的索引坐标存入到Vertices和Colors中去，法线向量存储在Normal中
        for(var j = 0; j < object.faces.length; j++){
            var face = object.faces[j];
            var color = this.findColor(face.materialName);
            var faceNormal = face.normal;
            //通过for循环计算顶点索引的数量
            for(var k = 0; k < face.vIndices.length; k++){
                // Set index
                indices[index_indices] = index_indices;
                // Copy vertex
                var vIdx = face.vIndices[k];
                var vertex = this.vertices[vIdx];
                vertices[index_indices * 3 + 0] = vertex.x;
                vertices[index_indices * 3 + 1] = vertex.y;
                vertices[index_indices * 3 + 2] = vertex.z;
                // Copy color
                colors[index_indices * 4 + 0] = color.r;
                colors[index_indices * 4 + 1] = color.g;
                colors[index_indices * 4 + 2] = color.b;
                colors[index_indices * 4 + 3] = color.a;

                //这里的情况是由于OBJ文件中有可能不包含法线的信息，因此程序在这里事先坐标检查
                // Copy normal
                var nIdx = face.nIndices[k];
                if(nIdx >= 0){
                    var normal = this.normals[nIdx];
                    normals[index_indices * 3 + 0] = normal.x;
                    normals[index_indices * 3 + 1] = normal.y;
                    normals[index_indices * 3 + 2] = normal.z;
                }else{                      //如果OBJ文件中不包含文件的法向量信息，我就在这里使用我之前在解析数据的时候自动生成的法线
                    normals[index_indices * 3 + 0] = faceNormal.x;
                    normals[index_indices * 3 + 1] = faceNormal.y;
                    normals[index_indices * 3 + 2] = faceNormal.z;
                }
                index_indices ++;
            }
        }
    }

    //这里返回了一个匿名对象（绘制信息的对象）
    var dds = new DrawingInfo(vertices, normals, colors, indices);
    //在返回数据信息之前，我先来看一下我里面的数据信息对不对？？？
    if (dds  == null){
        //return new DrawingInfo(vertices, normals, colors, indices);
        //return dds;
        alert("dds is null");
    }
    return dds;
}

//------------------------------------------------------------------------------
// MTLDoc Object
//------------------------------------------------------------------------------
var MTLDoc = function() {
    this.complete = false; // MTL is configured correctly
    this.materials = new Array(0);
}

//在这里来解析材质信息str："newmtl Material.001"
MTLDoc.prototype.parseNewmtl = function(sp) {
    return sp.getWord();         // Get name
}

MTLDoc.prototype.parseRGB = function(sp, name) {
    var r = sp.getFloat();
    var g = sp.getFloat();
    var b = sp.getFloat();
    return (new Material(name, r, g, b, 1));
}

//------------------------------------------------------------------------------
// Material Object
//------------------------------------------------------------------------------
var Material = function(name, r, g, b, a) {
    this.name = name;
    this.color = new Color(r, g, b, a);
}

//------------------------------------------------------------------------------
// Vertex Object
//------------------------------------------------------------------------------
var Vertex = function(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
}

//------------------------------------------------------------------------------
// Normal Object
//------------------------------------------------------------------------------
var Normal = function(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
}

//------------------------------------------------------------------------------
// Color Object
//------------------------------------------------------------------------------
var Color = function(r, g, b, a) {
    this.r = r;
    this.g = g;
    this.b = b;   //注意这里在赋值的时候b出现赋值错误 NAN
    this.a = a;
}


//------------------------------------------------------------------------------
// OBJObject Object
//------------------------------------------------------------------------------
var OBJObject = function(name) {
    this.name = name;
    this.faces = new Array(0);
    this.numIndices = 0;
}

OBJObject.prototype.addFace = function(face) {
    this.faces.push(face);
    this.numIndices += face.numIndices;
}

//------------------------------------------------------------------------------
// Face Object
//------------------------------------------------------------------------------
var Face = function(materialName) {
    this.materialName = materialName;
    if(materialName == null)  this.materialName = "";
    this.vIndices = new Array(0);
    this.nIndices = new Array(0);
}


//把我要绘制的信息数据我也封装成为一个对象，包含到了顶点信息，法向量信息，颜色信息，顶点索引的信息
//------------------------------------------------------------------------------
// DrawInfo Object
//------------------------------------------------------------------------------
var DrawingInfo = function(vertices, normals, colors, indices) {
    this.vertices = vertices;
    this.normals = normals;
    this.colors = colors;
    this.indices = indices;
}



//这里是我自定义的另外一个对象，主要用来解析OBJ文件的中的字符串
//------------------------------------------------------------------------------
// Constructor（这里我自定义了一个类型StringParser，关键点1：定义一个构造函数； 关键2：为该类型定义方法）
var StringParser = function(str) {   //StringParser的两个成员类型为：str和index； 该类型的所有实例都会具有这两个属性
    this.str;   // 将参数字符串保存下来；  构造函数中的this表示调用构造函数时候新生成的实例
    this.index; // 当前的处理位置
    this.init(str); // 调用init()方法进行初始化
}

//下面就都是我这个构造函数的成员方法了
// 初始化StringParser对象，定义在StringParser的Protype属性上
StringParser.prototype.init = function(str){
    this.str = str;     //成员函数中的this表示调用该函数的实例；这里的this.str,this.index和上面的this.str,this.index 是完全一样的
    this.index = 0;
}

// 这是StringParser的另外一个成员函数，这个函数会跳过分隔符（制表符、空格符、括号或者引号）
StringParser.prototype.skipDelimiters = function()  {
    for(var i = this.index, len = this.str.length; i < len; i++){
        var c = this.str.charAt(i);    //会返回字符串中索引值为i的字符串
        // Skip TAB, Space, '(', ')   【注意：】continue和break有点类似，区别在于continue只是终止本次循环，接着还执行后面的循环，break则完全终止循环
        if (c == '\t'|| c == ' ' || c == '(' || c == ')' || c == '"')
            continue;
        break;
    }
    this.index = i;     //通过这个函数可以把 str.index属性置为非空格符的字符位置
}

// Skip to the next word
StringParser.prototype.skipToNextWord = function() {
    this.skipDelimiters();
    var n = getWordLength(this.str, this.index);
    this.index += (n + 1);
}

// Get word
StringParser.prototype.getWord = function() {
    //我在读取的过程中忽略了定界符（c == '\t'|| c == ' ' || c == '(' || c == ')' || c == '"'）,忽略了左右括号，强制换行， 以及空格
    this.skipDelimiters();
    var n = getWordLength(this.str, this.index);
    if (n == 0) return null;
    var word = this.str.substr(this.index, n); //从this.index开始，向后截取了n个字符；
    this.index += (n + 1);              //this.index:16          n:8(把this.index移动到最后一位数)

    //把空格后面截取的newMtl之后的文件名字（这就是我截取到的材质文件名字）
    return word;
}

// Get integer
StringParser.prototype.getInt = function() {
    return parseInt(this.getWord());
}

// Get floating number
StringParser.prototype.getFloat = function() {
    return parseFloat(this.getWord());
}

// Get the length of word
function getWordLength(str, start) {
    var n = 0;
    for(var i = start, len = str.length; i < len; i++){
        var c = str.charAt(i);
        if (c == '\t'|| c == ' ' || c == '(' || c == ')' || c == '"')
            break;
    }
    return i - start;
}




//这里是我的默认计算自己的法向量函数
//如果OBJ文件中包含了我的法向量信息，我就使用文件里面的法向量； 如果文件中没有，那我就使用自己计算出来的法向量信息
//------------------------------------------------------------------------------
// Common function
//------------------------------------------------------------------------------
function calcNormal(p0, p1, p2) {
    // v0: a vector from p1 to p0, v1; a vector from p1 to p2
    var v0 = new Float32Array(3);
    var v1 = new Float32Array(3);
    for (var i = 0; i < 3; i++){
        v0[i] = p0[i] - p1[i];
        v1[i] = p2[i] - p1[i];
    }

    // The cross product of v0 and v1
    var c = new Float32Array(3);
    c[0] = v0[1] * v1[2] - v0[2] * v1[1];
    c[1] = v0[2] * v1[0] - v0[0] * v1[2];
    c[2] = v0[0] * v1[1] - v0[1] * v1[0];

    // Normalize the result
    var v = new Vector3(c);
    v.normalize();
    return v.elements;
}
