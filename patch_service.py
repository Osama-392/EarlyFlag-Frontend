path = 'f:/Bave Office/Projects/Early_flag_Backend/earlyflag-backend/app/services/dashboard_service.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = '''        SuperGreenHighlightRow(
            signal_id=signal.id,
            student_id=stu.id,
            slug=stu.slug,
            first_name=stu.first_name,
            last_name=stu.last_name,
            signal_date=signal.signal_date,
            reason_code=signal.reason_code or "super_green",
            reason_description=signal.reason_description or signal.note or "Super Green",
            parent_email_on_file=_parent_email_on_file(stu),
        )'''

new = '''        SuperGreenHighlightRow(
            signal_id=signal.id,
            student_id=stu.id,
            slug=stu.slug,
            first_name=stu.first_name,
            last_name=stu.last_name,
            signal_date=signal.signal_date,
            reason_code=signal.reason_code or "super_green",
            reason_description=signal.reason_description or signal.note or "Super Green",
            class_id=signal.class_id,
            parent_email_on_file=_parent_email_on_file(stu),
        )'''

if old in content:
    content = content.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Service patched successfully: class_id added to SuperGreenHighlightRow return')
else:
    print('Target not found in service - check manually')
