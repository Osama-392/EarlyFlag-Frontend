import sys
import os

path = 'f:/Bave Office/Projects/Early_flag_Backend/earlyflag-backend/app/services/dashboard_service.py'

try:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # The exact string from dashboard_service.py to replace
    old_logic = "class_ids_stmt = select(Class.id).where(Class.name.ilike(f'%{subject}%'), Class.school_id == school_id)"
    
    new_logic = """clean_subject = subject.split("•")[-1].strip() if "•" in subject else subject
        class_ids_stmt = select(Class.id).where(Class.name.ilike(f'%{clean_subject}%'), Class.school_id == school_id)"""

    if old_logic in content:
        content = content.replace(old_logic, new_logic)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print('Patch applied successfully')
    else:
        print('Old logic not found! Did you already patch it?')
except Exception as e:
    print('Error:', str(e))
