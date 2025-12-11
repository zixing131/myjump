#!/bin/bash
# Linux/Mac build script for classes.jar
# Usage: ./build.sh

echo "Cleaning old build files..."
rm -rf build build-src build-srcs.txt

echo "Creating build directories..."
mkdir build build-src

echo "Copying source files..."
cp -a gbkwriter/. build-src/gbkwriter/
cp -a freej2me/. build-src/freej2me/
cp -a cldc1.1.1/. build-src/cldc1.1.1/
cp -a vm/. build-src/vm/
cp -a midp/. build-src/midp/
cp -a custom/. build-src/custom/
cp -a jsr-256/. build-src/jsr-256/
cp -a jsr-082/. build-src/jsr-082/
cp -a jsr-179/. build-src/jsr-179/
cp -a kemulator/. build-src/kemulator/
cp -a pl/. build-src/pl/

echo "Finding Java source files..."
find ./build-src -name "*.java" > build-srcs.txt

echo "Compiling Java files..."
javac -cp build-src -g:none -source 8 -target 8 -bootclasspath "" -extdirs "" -d ./build @build-srcs.txt
if [ $? -ne 0 ]; then
    echo "Compilation failed!"
    exit 1
fi

echo "Creating JAR file..."
cd build && jar cf0 ../classes.jar * && cd ..

echo "Adding extra resources..."
find . -name "*.png" -o -name "*.bin" | xargs jar uf0 classes.jar 2>/dev/null
find l10n -name "*.json" | xargs jar uf0 classes.jar 2>/dev/null

echo "Cleaning up..."
rm -rf build-src build-srcs.txt

echo "Build complete! classes.jar created."
