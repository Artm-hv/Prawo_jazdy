import os, json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

os.makedirs('frontend/js/data', exist_ok=True)

# 1. Traffic Signs
with open('backend/data/traffic_signs.json', 'r', encoding='utf-8') as f:
    signs = json.load(f)

with open('frontend/js/data/trafficSignsData.js', 'w', encoding='utf-8') as f:
    f.write('window.TRAFFIC_SIGNS_DATA = ' + json.dumps(signs, ensure_ascii=False, indent=2) + ';\n')
print(f"Exported {len(signs)} traffic signs to frontend/js/data/trafficSignsData.js")

# 2. Test Questions
with open('backend/data/test_questions.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

with open('frontend/js/data/testQuestionsData.js', 'w', encoding='utf-8') as f:
    f.write('window.TEST_QUESTIONS_DATA = ' + json.dumps(questions, ensure_ascii=False, indent=2) + ';\n')
print(f"Exported {len(questions)} test questions to frontend/js/data/testQuestionsData.js")

# 3. Course Modules
with open('backend/data/course_modules.json', 'r', encoding='utf-8') as f:
    courses = json.load(f)

with open('frontend/js/data/courseModulesData.js', 'w', encoding='utf-8') as f:
    f.write('window.COURSE_MODULES_DATA = ' + json.dumps(courses, ensure_ascii=False, indent=2) + ';\n')
print(f"Exported {len(courses)} courses to frontend/js/data/courseModulesData.js")
