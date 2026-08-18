path = 'f:/Bave Office/Projects/Early_flag_Backend/earlyflag-backend/app/services/email_template_service.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = '    template_name = f"{subject}/{template_type}/{selected_id}.html"'
new = '    template_name = f"{subject}/{folder_name}/{selected_id}.html"'

if old in content:
    content = content.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Patched: template_name now uses folder_name instead of template_type')
else:
    print('Target not found in file!')
    idx = content.find('template_name')
    print(repr(content[max(0,idx-50):idx+200]))
