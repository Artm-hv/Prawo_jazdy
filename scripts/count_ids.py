import json
import re

with open('js/data/courseData.js', encoding='utf-8') as f:
    data = f.read()
    
# Extract all media IDs
qs = re.findall(r'\"mediaUrl\":\s*\"assets/media/(\d+)\.(?:jpg|mp4|png|jpeg)\"', data)
print('Found media IDs:', len(set(qs)))
