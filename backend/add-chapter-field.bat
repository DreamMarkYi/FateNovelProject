@echo off
echo ========================================
echo   Sowaka Stories 章节字段添加工具
echo ========================================
echo.

echo 正在为sowaka_stories表添加chapterName字段...
echo.

node src/scripts/addChapterNameField.js

echo.
echo ========================================
echo 迁移完成！请检查上方的执行结果。
echo ========================================
echo.
pause
