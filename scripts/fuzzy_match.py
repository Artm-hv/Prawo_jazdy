import json
import os
import difflib

file_path = os.path.join('js', 'data', 'courseData.js')
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

import re
json_str = re.search(r'window\.COURSE_DATA\s*=\s*(\[.*\]);', content, re.DOTALL).group(1)
course_data = json.loads(json_str)

# Load the API responses we already fetched!
# Wait, we didn't save the API responses to disk! We only saved the explanations!
