@echo off
setlocal
chcp 65001 >nul

rem 进入脚本所在目录
cd /d "%~dp0"

:MENU
cls
echo ==========================================
echo       Q-SYS 科技风控制系统 一键管理
echo ==========================================
echo  1. 启动服务 (前端 + 后端)
echo  2. 结束服务 (关闭所有进程)
echo  3. 退出脚本
echo ==========================================
echo.
set /p choice=请输入选项编号 (1/2/3): 

if "%choice%"=="1" goto START_ALL
if "%choice%"=="2" goto STOP_ALL
if "%choice%"=="3" goto END
echo 无效选项，请重新输入。
pause
goto MENU

:START_ALL
echo.
echo [1/2] 正在启动后端 FastAPI (端口 8000)...
if exist qsys_api.pid (
    echo [警告] 发现旧的后端 PID 文件，尝试先清理...
    call :STOP_BACKEND
)
start /b cmd /c "python -m uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1"
timeout /t 2 >nul
for /f "tokens=5" %%i in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do set BE_PID=%%i
echo %BE_PID% > qsys_api.pid
echo [成功] 后端已在后台启动 (PID: %BE_PID%)

echo.
echo [2/2] 正在启动前端 Vite (端口 5173)...
start cmd /k "npm run dev"
echo [提示] 前端控制台已弹出，请勿关闭该黑色窗口。

echo.
echo ==========================================
echo 服务启动完成！
echo 后端文档: http://localhost:8000/docs
echo 前端界面: http://localhost:5173
echo ==========================================
pause
goto MENU

:STOP_ALL
echo.
echo 正在停止所有服务...
call :STOP_BACKEND
echo [1/2] 正在关闭前端 Vite 进程...
taskkill /F /IM node.exe /T >nul 2>&1
echo [成功] 服务已全部结束。
pause
goto MENU

:STOP_BACKEND
if exist qsys_api.pid (
    for /f "usebackq delims=" %%i in ("qsys_api.pid") do set PID=%%i
    taskkill /PID %PID% /F >nul 2>&1
    del /f qsys_api.pid >nul 2>&1
    echo [2/2] 成功关闭后端进程 (PID: %PID%)
)
goto :eof

:END
echo 已退出。
endlocal
exit /b 0