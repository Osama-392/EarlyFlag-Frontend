path = 'f:/Bave Office/Projects/Early_flag_Backend/earlyflag-backend/app/services/email_template_service.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Map template_type to the exact folder names on disk (case-sensitive for Linux)
# Folders: red, yellow, absent, Super Green, admin_concern, admin_commendation, admin_attendance
old = '''    # We assume a fixed max number of templates (e.g. 5 for yellow, 3 for red)
    # But to be robust, we can dynamically check what files exist in the folder.
    subject_dir = os.path.join(TEMPLATE_DIR, subject, template_type)
    
    if not os.path.isdir(subject_dir):
        # Fallback to Math if subject directory doesn't exist just to prevent errors
        if template_type.startswith("admin_"):
            pass # admin directories should exist, no fallback needed
        else:
            subject_dir = os.path.join(TEMPLATE_DIR, "Math", template_type)
            subject = "Math"'''

new = '''    # Map template_type to exact folder name on disk (Linux is case-sensitive)
    TEMPLATE_TYPE_TO_FOLDER = {
        "Red": "red",
        "Yellow": "yellow",
        "Absent": "absent",
        "Super Green": "Super Green",
        "absent": "absent",
        "red": "red",
        "yellow": "yellow",
        "super_green": "Super Green",
        "super green": "Super Green",
    }
    folder_name = TEMPLATE_TYPE_TO_FOLDER.get(template_type, template_type)

    subject_dir = os.path.join(TEMPLATE_DIR, subject, folder_name)
    
    if not os.path.isdir(subject_dir):
        # Fallback to Math if subject directory doesn't exist just to prevent errors
        if template_type.startswith("admin_"):
            pass # admin directories should exist, no fallback needed
        else:
            subject_dir = os.path.join(TEMPLATE_DIR, "Math", folder_name)
            subject = "Math"'''

if old in content:
    content = content.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Patched successfully: template_type now maps to correct case-sensitive folder names')
else:
    print('Target not found!')
    # Debug: show what we have
    idx = content.find('subject_dir = os.path.join(TEMPLATE_DIR, subject, template_type)')
    print(f'subject_dir line at char {idx}')
    print(repr(content[max(0,idx-200):idx+200]))
