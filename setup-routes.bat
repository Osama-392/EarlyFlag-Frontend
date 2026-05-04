@echo off
REM Clean up old routing structure
rmdir /s /q "app\students\[id]" 2>nul

REM Create new routing structure for:
REM /students (Classes)
REM /students/[classId] (Student Roster)
REM /students/[classId]/[studentId] (Student Profile)
mkdir "app\students\[classId]\[studentId]" 2>nul

echo Routing structure updated successfully!
