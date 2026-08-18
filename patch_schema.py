path = 'f:/Bave Office/Projects/Early_flag_Backend/earlyflag-backend/app/schemas/dashboard.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = '''    reason_code: Optional[str] = None
    reason_description: Optional[str] = None
    parent_email_on_file: bool = Field(
        description="True when student.parent_email is set and non-blank",
    )'''

new = '''    reason_code: Optional[str] = None
    reason_description: Optional[str] = None
    class_id: Optional[uuid.UUID] = None
    parent_email_on_file: bool = Field(
        description="True when student.parent_email is set and non-blank",
    )'''

if old in content:
    content = content.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Schema patched successfully: class_id added to SuperGreenHighlightRow')
else:
    print('Target not found in schema - check manually')
