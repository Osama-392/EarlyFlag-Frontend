import re

with open('components/ReportsPage.tsx', 'r', encoding='utf-8') as f:
    reports = f.read()

with open('components/RecognitionPage.tsx', 'r', encoding='utf-8') as f:
    recognition = f.read()

# 1. Add imports to reports
reports = reports.replace("import { ArrowLeft } from 'lucide-react';", 
"import { ArrowLeft, Award, Trophy, Star, Sparkles, TrendingUp, Calendar, AlertCircle } from 'lucide-react';\nimport { getTeacherRecognitions, StudentRecognitionRow } from '@/lib/dashboardService';")

# 2. Extract states from recognition
state_pattern = re.compile(r"const \[recognitions, setRecognitions\].*?\}, \[\]\);", re.DOTALL)
state_match = state_pattern.search(recognition)
if state_match:
    state_block = state_match.group(0)
    # rename loading and error to recLoading and recError to avoid conflict
    state_block = state_block.replace("const [loading, setLoading]", "const [recLoading, setRecLoading]")
    state_block = state_block.replace("const [error, setError]", "const [recError, setRecError]")
    state_block = state_block.replace("setLoading(", "setRecLoading(")
    state_block = state_block.replace("setError(", "setRecError(")
    
    # insert after const { classes: apiClasses, loading, error } = useClasses();
    insert_point = reports.find("const { classes: apiClasses, loading, error } = useClasses();")
    if insert_point != -1:
        end_of_line = reports.find('\n', insert_point) + 1
        reports = reports[:end_of_line] + '\n  ' + state_block.replace('\n', '\n  ') + '\n' + reports[end_of_line:]

# 3. Extract calculations from recognition
calc_pattern = re.compile(r"// Aggregate top students.*?const uniqueStudentCount = uniqueStudentsMap.size;", re.DOTALL)
calc_match = calc_pattern.search(recognition)
if calc_match:
    calc_block = calc_match.group(0)
    # insert before if (selectedClass) {
    insert_point = reports.find("if (selectedClass) {")
    if insert_point != -1:
        reports = reports[:insert_point] + calc_block.replace('\n', '\n  ') + '\n\n  ' + reports[insert_point:]

# 4. Extract UI from recognition
ui_pattern = re.compile(r"<style>.*?(?=</div>\s*</div>\s*</div>\s*\);\s*})", re.DOTALL)
ui_match = ui_pattern.search(recognition)
if ui_match:
    ui_block = ui_match.group(0)
    
    # Change "Student Recognition" header to "Reports & Recognition"
    ui_block = ui_block.replace("Student Recognition", "Reports & Recognition")
    
    # Replace the Reports header (h1 Classes and p) with the recognition block
    reports_header_pattern = re.compile(r"<div>\s*<h1 className=\"text-3xl font-bold.*?</div>", re.DOTALL)
    
    # we want to put the Recognition UI, then a divider, then the Classes list.
    replacement = f"""{ui_block}
      
      {'{/* Classes Header */}'}
      <div className="mt-12 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Generate Reports</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Select a class below to view or generate detailed student reports.</p>
      </div>"""
      
    reports = reports_header_pattern.sub(replacement, reports)

with open('components/ReportsPage.tsx', 'w', encoding='utf-8') as f:
    f.write(reports)

print("Merged successfully")
