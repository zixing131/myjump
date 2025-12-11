# 3D 支持编译说明

## 已复制的文件

### 1. M3G API (30个文件)
- 位置: `javamake/java/midp/javax/microedition/m3g/`
- 说明: JSR-184 M3G API 实现

### 2. Emulator3D 实现 (21个文件)
- 位置: `javamake/java/kemulator/m3g/`
  - `gles2/` - WebGL2 渲染程序
  - `impl/` - M3G 加载器和渲染管道
  - `utils/` - 3D 数学工具类

### 3. GLES2 桥接 (2个文件)
- 位置: `javamake/java/pl/zb3/freej2me/bridge/gles2/`
  - `GLES2.java` - WebGL2 native 方法桥接
  - `BufferHelper.java` - 缓冲区辅助类

### 4. Graphics 桥接 (5个文件)
- 位置: `javamake/java/pl/zb3/freej2me/bridge/graphics/`
  - `CanvasGraphics.java` - Canvas 图形接口
  - 其他辅助类

## 编译步骤

### Windows 用户（推荐）

#### 方法 1: 使用 build.bat（最简单）
```cmd
cd javamake\java
build.bat
```

#### 方法 2: 手动编译
```cmd
cd javamake\java
REM 清理旧文件
if exist build rmdir /s /q build
if exist build-src rmdir /s /q build-src

REM 创建目录
mkdir build build-src

REM 复制源文件（需要复制所有 SRC_DIRS 中的目录）
xcopy /E /I /Y midp build-src\midp
xcopy /E /I /Y kemulator build-src\kemulator
xcopy /E /I /Y pl build-src\pl
REM ... 其他目录

REM 查找 Java 文件
dir /s /b build-src\*.java > build-srcs.txt

REM 编译
javac -cp build-src -g:none -source 8 -target 8 -bootclasspath "" -extdirs "" -d build @build-srcs.txt

REM 打包
cd build
jar cf0 ..\classes.jar *
cd ..
```

### Linux/Mac 用户

#### 方法 1: 使用 build.sh
```bash
cd javamake/java
chmod +x build.sh
./build.sh
```

#### 方法 2: 使用 make
```bash
cd javamake/java
make clean
make classes.jar
```

### 4. 复制编译好的 classes.jar
编译完成后，将 `javamake/java/classes.jar` 复制到项目的 `java/` 目录，替换原有的 `classes.jar`。

## 注意事项

1. **Makefile 已更新**: 已添加 `kemulator` 和 `pl` 目录到 `SRC_DIRS`
2. **依赖关系**: 确保所有依赖的类都已包含在编译路径中
3. **编译错误**: 如果遇到编译错误，可能需要：
   - 检查 Java 版本（需要 Java 8）
   - 检查是否有缺失的依赖类
   - 查看编译错误信息，可能需要调整某些 Java 文件

## 可能需要的调整

1. **CanvasGraphics 适配**: 如果当前项目已有不同的 Graphics 实现，可能需要适配 `CanvasGraphics` 接口
2. **Native 方法**: 确保 `bld/main-all.js` 中的 GLES2 native 方法注册正确
3. **Shader 加载**: 确保 shader 文件能够被正确加载（可能需要通过 HTTP 请求）

## 测试

编译完成后，运行支持 3D 的 J2ME 游戏进行测试。如果遇到类找不到的错误，检查：
1. classes.jar 是否正确更新
2. 浏览器控制台的错误信息
3. 是否需要重新加载页面

