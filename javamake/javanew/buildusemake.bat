@echo off
echo Cleaning old classes.jar...
if exist classes.jar del /q classes.jar

echo Running make...
"C:\Program Files\Git\bin\bash.exe" -c "make -j8"
pause
