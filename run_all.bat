@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

:MENU
cls
echo ==========================================
echo       Q-SYS 科技风控制系统 一键管理
echo ==========================================
echo  1. 启动服务 (同时弹出前端和后端黑框)
echo  2. 结束服务 (关闭所有进程和黑框)
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
echo [1/2] 正在启动后端 FastAPI (独立窗口)...
rem 移除后台静默运行，直接弹出名为 QSYS_Backend 的新窗口
start "QSYS_Backend" cmd /k "python -m uvicorn main:app --host 0.0.0.0 --port 8000"
timeout /t 2 >nul

echo.
echo [2/2] 正在启动前端 Vite (独立窗口)...
start "QSYS_Frontend" cmd /c "npm run dev"

echo.
echo ==========================================
echo 服务启动完成！请查看弹出的两个黑框是否有报错。
echo 后端文档: http://localhost:8000/docs
echo 前端界面: http://localhost:5173
echo ==========================================
pause
goto MENU

:STOP_ALL
echo.
echo 正在停止所有服务...
taskkill /FI "WINDOWTITLE eq QSYS_Backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq QSYS_Frontend*" /T /F >nul 2>&1
taskkill /F /IM node.exe /T >nul 2>&1
echo [成功] 服务及窗口已全部结束。
pause
goto MENU

:END
echo 已退出。
endlocal
exit /b 0