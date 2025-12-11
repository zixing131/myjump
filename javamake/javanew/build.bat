@echo off
REM Windows batch script to build classes.jar
REM Usage: build.bat
REM Note: JDK 8 is required to compile with -source 1.3 -target 1.3

REM Find Java installation - prefer JDK 8 for 1.3 compatibility
set "JAVA_BIN="

REM Check JAVA_HOME first
if defined JAVA_HOME (
    if exist "%JAVA_HOME%\bin\javac.exe" (
        set "JAVA_BIN=%JAVA_HOME%\bin\"
        goto :java_found
    )
)

REM Search for JDK 1.8.x (required for -source 1.3 -target 1.3)
for /d %%d in ("C:\Program Files\Java\jdk1.8*") do (
    if exist "%%d\bin\javac.exe" (
        set "JAVA_BIN=%%d\bin\"
        goto :java_found
    )
)

REM Search for JDK 8 alternative naming
if exist "C:\Program Files\Java\jdk-8\bin\javac.exe" (
    set "JAVA_BIN=C:\Program Files\Java\jdk-8\bin\"
    goto :java_found
)
if exist "C:\Program Files\Java\jdk8\bin\javac.exe" (
    set "JAVA_BIN=C:\Program Files\Java\jdk8\bin\"
    goto :java_found
)

REM Search for versioned JDK 8 (e.g. jdk-8u202)
for /d %%d in ("C:\Program Files\Java\jdk-8*") do (
    if exist "%%d\bin\javac.exe" (
        set "JAVA_BIN=%%d\bin\"
        goto :java_found
    )
)

REM Fallback: search any JDK (but warn about compatibility)
for /d %%d in ("C:\Program Files\Java\jdk*") do (
    if exist "%%d\bin\javac.exe" (
        set "JAVA_BIN=%%d\bin\"
        echo WARNING: JDK 8 not found, using %%d
        echo NOTE: JDK 9+ does not support -source 1.3, will use -source 8 instead.
        set "USE_JAVA8_COMPAT=1"
        goto :java_found
    )
)

echo ERROR: Java JDK not found! Please install JDK 8 or set JAVA_HOME.
echo JDK 8 is required to compile with -source 1.3 -target 1.3
pause
exit /b 1

:java_found
echo Using Java from: %JAVA_BIN%

echo Cleaning old build files...
if exist build rmdir /s /q build
if exist build-src rmdir /s /q build-src
if exist build-srcs.txt del /q build-srcs.txt
if exist classes.jar del /q classes.jar

echo Creating build directories...
mkdir build
mkdir build-src

echo Copying source files...
REM Copy in order - later copies will overwrite earlier ones
REM This matches the Makefile order: gbkwriter freej2me cldc1.1.1 vm midp custom jsr-256 jsr-082 jsr-179 kemulator pl
REM Note: midp should be the authoritative source for javax.microedition.* classes
xcopy /E /I /Y gbkwriter build-src\gbkwriter >nul 2>&1
xcopy /E /I /Y freej2me build-src\freej2me >nul 2>&1
xcopy /E /I /Y cldc1.1.1 build-src\cldc1.1.1 >nul 2>&1
xcopy /E /I /Y vm build-src\vm >nul 2>&1
xcopy /E /I /Y custom build-src\custom >nul 2>&1
xcopy /E /I /Y jsr-256 build-src\jsr-256 >nul 2>&1
xcopy /E /I /Y jsr-082 build-src\jsr-082 >nul 2>&1
xcopy /E /I /Y jsr-179 build-src\jsr-179 >nul 2>&1
xcopy /E /I /Y kemulator build-src\kemulator >nul 2>&1
xcopy /E /I /Y pl build-src\pl >nul 2>&1
REM Copy midp last so it overwrites any duplicates
xcopy /E /I /Y midp build-src\midp
if errorlevel 1 (
    echo ERROR: Failed to copy midp directory!
    pause
    exit /b 1
)
REM Verify critical directories were copied
if not exist build-src\midp\javax\microedition\m3g (
    echo ERROR: m3g directory was not copied!
    pause 
)

REM Remove duplicate javax.microedition.* classes from other directories
REM Keep only the ones from midp (which is the authoritative source)
echo Removing duplicate classes...
REM Verify midp\javax was copied before removing duplicates
if not exist build-src\midp\javax (
    echo ERROR: midp\javax was not copied! Cannot safely remove duplicates.
    pause 
)
if exist build-src\cldc1.1.1\javax (
    rmdir /s /q build-src\cldc1.1.1\javax 2>nul
)
if exist build-src\freej2me\javax (
    rmdir /s /q build-src\freej2me\javax 2>nul
)
REM For custom\javax, preserve classes that don't exist in midp (like Font.java, MIDletTunnelImpl.java)
if exist build-src\custom\javax (
    if exist build-src\midp\javax (
        REM Backup Font.java if it exists in custom but not in midp
        if exist build-src\custom\javax\microedition\lcdui\Font.java (
            if not exist build-src\midp\javax\microedition\lcdui\Font.java (
                mkdir build-src\midp\javax\microedition\lcdui 2>nul
                copy /Y build-src\custom\javax\microedition\lcdui\Font.java build-src\midp\javax\microedition\lcdui\Font.java >nul 2>&1
            )
        )
        REM Backup MIDletTunnelImpl.java if it exists in custom but not in midp
        if exist build-src\custom\javax\microedition\midlet\MIDletTunnelImpl.java (
            if not exist build-src\midp\javax\microedition\midlet\MIDletTunnelImpl.java (
                mkdir build-src\midp\javax\microedition\midlet 2>nul
                copy /Y build-src\custom\javax\microedition\midlet\MIDletTunnelImpl.java build-src\midp\javax\microedition\midlet\MIDletTunnelImpl.java >nul 2>&1
            )
        )
        rmdir /s /q build-src\custom\javax 2>nul
    )
)

echo Removing duplicate Java files...
powershell -ExecutionPolicy Bypass -File "%~dp0remove-duplicates.ps1" -BuildSrcDir "build-src"
if errorlevel 1 (
    echo Warning: Failed to remove duplicates, continuing anyway...
)

echo Finding Java source files...
dir /s /b build-src\*.java > build-srcs.txt

echo Compiling Java files...
REM For CLDC, we need to compile without bootclasspath first to let javac find classes from source
REM Then use the compiled classes as bootclasspath for dependent classes
REM JDK 8 supports -source 1.3, JDK 9+ minimum is -source 8
if defined USE_JAVA8_COMPAT (
    echo Using -source 8 -target 8 for JDK 9+ compatibility...
    "%JAVA_BIN%javac" -cp build-src -g:none -source 8 -target 8 -bootclasspath "" -extdirs "" -d build @build-srcs.txt > compile-errors.txt 2>&1
) else (
    echo Using -source 1.3 -target 1.3 for JDK 8...
    "%JAVA_BIN%javac" -cp build-src -g:none -source 1.3 -target 1.3 -bootclasspath "" -extdirs "" -d build @build-srcs.txt > compile-errors.txt 2>&1
)
if errorlevel 1 (
    echo Compilation failed! Check compile-errors.txt for details.
    type compile-errors.txt | findstr /V /C:"警告" /C:"warning" /C:"deprecation" /C:"deprecated" /C:"Note:"
    pause 
)
REM Verify critical M3G classes were compiled
if not exist build\javax\microedition\m3g\Background.class (
    echo ERROR: M3G classes were not compiled! Check compile-errors.txt for details.
    type compile-errors.txt | findstr /I "m3g Background"
    pause  
)
del /q compile-errors.txt 2>nul

echo Creating JAR file...
cd build
"%JAVA_BIN%jar" cf0 ..\classes.jar *
cd ..

echo Adding extra resources...
"%JAVA_BIN%jar" uf0 classes.jar *.png *.bin 2>nul
if exist l10n\*.json "%JAVA_BIN%jar" uf0 classes.jar l10n\*.json

echo Cleaning up...
rmdir /s /q build-src
del /q build-srcs.txt

echo Build complete! classes.jar created.
pause


pause


