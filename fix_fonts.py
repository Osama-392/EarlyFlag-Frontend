import os
import glob
import re

directory = r'f:\Bave Office\Projects\Earlyflag\components'
for filepath in glob.glob(os.path.join(directory, '*.tsx')):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    # Replace Playfair Display
    new_content = new_content.replace('" style={{ fontFamily: \'Playfair Display, serif\' }}', ' font-playfair"')
    new_content = new_content.replace('" style={{ fontFamily: \'Playfair Display\' }}', ' font-playfair"')
    
    # Replace Sora
    new_content = new_content.replace('" style={{ fontFamily: \'Sora, sans-serif\' }}', ' font-sora"')
    new_content = new_content.replace('" style={{ fontFamily: \'Sora\' }}', ' font-sora"')
    
    # Clean up inline imports
    new_content = re.sub(r"        @import url\('https://fonts\.googleapis\.com/css2\?family=Playfair\+Display:wght@700;800&family=Sora:wght@400;500;600;700&display=swap'\);\n?", "", new_content)
    new_content = re.sub(r"      <style>\{`@import url\('https://fonts\.googleapis\.com/css2\?family=Playfair\+Display:wght@700;800&family=Sora:wght@400;500;600;700&display=swap'\);`\}</style>\n?", "", new_content)
    
    if content != new_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {filepath}')
