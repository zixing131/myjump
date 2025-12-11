# J2ME 模拟器 3D 支持集成计划

## 概述
从 freej2me-web 复制 3D 支持代码到当前项目，包括：
- M3G API (JSR-184)
- Micro3D API (Nokia)
- JBlend J3D API
- WebGL2 桥接层

## 需要复制的文件

### 1. JavaScript 文件
- `freej2me-web-main/web/libjs/libgles2.js` → `libs/libgles2.js`
  - WebGL2 桥接实现

### 2. Shader 文件
- `freej2me-web-main/resources/m3g_shaders/*.glsl` → `resources/m3g_shaders/`
  - mesh_vertex.glsl
  - mesh_fragment.glsl
  - sprite_vertex.glsl
  - sprite_fragment.glsl
  - background_vertex.glsl
  - background_fragment.glsl

### 3. Java 源文件

#### M3G API (javax.microedition.m3g)
- 所有 `freej2me-web-main/src/javax/microedition/m3g/*.java` → `javamake/java/javax/microedition/m3g/`

#### Emulator3D 实现
- `freej2me-web-main/src/kemulator/m3g/**/*.java` → `javamake/java/kemulator/m3g/`
  - gles2/ (Emulator3D, ShaderProgram, etc.)
  - impl/ (RenderPipe, M3GLoader, etc.)
  - utils/ (Transform3D, Quaternion, etc.)

#### GLES2 桥接
- `freej2me-web-main/src/pl/zb3/freej2me/bridge/gles2/*.java` → `javamake/java/pl/zb3/freej2me/bridge/gles2/`
  - GLES2.java
  - BufferHelper.java

#### Graphics 桥接（如果缺失）
- `freej2me-web-main/src/pl/zb3/freej2me/bridge/graphics/CanvasGraphics.java` → `javamake/java/pl/zb3/freej2me/bridge/graphics/`

#### Micro3D API (可选)
- `freej2me-web-main/src/ru/woesss/j2me/micro3d/*.java` → `javamake/java/ru/woesss/j2me/micro3d/`

#### JBlend J3D API (可选)
- `freej2me-web-main/src/com/jblend/graphics/j3d/*.java` → `javamake/java/com/jblend/graphics/j3d/`

## 集成步骤

### 步骤 1: 复制 JavaScript 和资源文件
1. 复制 libgles2.js
2. 创建 resources/m3g_shaders 目录并复制 shader 文件
3. 在 index.html 中加载 libgles2.js

### 步骤 2: 在 native.js 中注册 GLES2 native 方法
- 将 libgles2.js 中的 GLES2 对象方法注册为 Native 方法
- 方法名格式：`Java_pl_zb3_freej2me_bridge_gles2_GLES2_<methodName>`

### 步骤 3: 复制 Java 源文件
- 按照上述目录结构复制所有 Java 文件

### 步骤 4: 修改构建系统
- 确保新 Java 文件被编译到 classes.jar

### 步骤 5: 测试
- 编译并测试 3D 功能

## 注意事项
1. freej2me-web 使用 CheerpJ，当前项目可能使用不同的 JVM 实现，需要适配
2. CanvasGraphics 可能需要适配当前项目的 Graphics 实现
3. Native 方法注册方式需要匹配当前项目的模式

