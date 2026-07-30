import re

with open('components/ReportsPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Split the content into three parts: Top (up to <Link>), Recognition, Classes
# First, find the end of the <Link> block
link_end_pattern = re.compile(r'Back to Dashboard\s*</Link>', re.MULTILINE)
link_end_match = link_end_pattern.search(content)
if not link_end_match:
    print("Could not find <Link>")
    exit(1)

link_end_idx = link_end_match.end()

# The Classes Header is currently at: {/* Classes Header */}
classes_header_idx = content.find('{/* Classes Header */}')
if classes_header_idx == -1:
    print("Could not find Classes Header")
    exit(1)

# The end of the classes block is right before the last closing </div>\s*\);
classes_end_pattern = re.compile(r'\)\s*:\s*\(\s*<div className="text-center py-12">.*?</div>\s*\)\}\s*</div>', re.DOTALL)
classes_end_match = classes_end_pattern.search(content)

if not classes_end_match:
    print("Could not find classes end")
    exit(1)

classes_end_idx = classes_end_match.end() - len('</div>')

# Extract parts
top_part = content[:link_end_idx]
recognition_part = content[link_end_idx:classes_header_idx].strip()
classes_part = content[classes_header_idx:classes_end_idx].strip()
bottom_part = content[classes_end_idx:]

# Restore original classes header
original_classes_header = """      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Classes</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Quickly make a Detailed report for any student</p>
        {error && <p className="text-red-600 mt-1 text-sm">{error}</p>}
      </div>"""

# Remove the temporary classes header we added during merge
classes_part = re.sub(r'\{/\* Classes Header \*/\}.*?</p>\s*</div>', '', classes_part, flags=re.DOTALL).strip()

new_content = top_part + '\n\n' + original_classes_header + '\n\n      ' + classes_part + '\n\n      <hr className="my-12 border-gray-200 dark:border-gray-800" />\n\n      ' + recognition_part + '\n    ' + bottom_part

with open('components/ReportsPage.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Reordered successfully")
