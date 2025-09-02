@echo off
echo 🎭 Face Recognition System Launcher
echo =====================================

echo.
echo 🔧 Installing/Updating requirements...
pip install -r requirements_simple.txt

echo.
echo 🚀 Starting Face Recognition System...
echo.
echo 📋 Available options:
echo 1. Run demo script
echo 2. Start web interface
echo 3. Run main system
echo.
set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo.
    echo 🎬 Running demo script...
    python demo.py
) else if "%choice%"=="2" (
    echo.
    echo 🌐 Starting web interface...
    echo 📱 Open your browser and go to: http://localhost:5001
    python web_interface.py
) else if "%choice%"=="3" (
    echo.
    echo 🔧 Running main system...
    python face_recognition_system.py
) else (
    echo.
    echo ❌ Invalid choice. Please run the script again.
)

echo.
echo ✅ Script completed. Press any key to exit...
pause > nul
