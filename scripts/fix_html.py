import json
import re

def fix_html(html):
    if not html: return html
    
    html = html.replace('<div class="fx-c g-8">', '<div class="explanation-card">')
    
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html, 'html.parser')
    
    contents = soup.find('div', class_='contents')
    if not contents:
        return html
        
    new_children = []
    current_card = None
    
    for child in list(contents.children):
        if child.name is None: 
            if current_card:
                current_card.append(child.extract())
            else:
                new_children.append(child.extract())
            continue
            
        is_header = False
        if 'explanation-head' in child.get('class', []):
            is_header = True
        if 'subtitle' in child.get('class', []):
            is_header = True
            
        if child.name == 'div' and 'explanation-card' in child.get('class', []):
            new_children.append(child.extract())
            current_card = None
            continue
            
        if is_header:
            current_card = soup.new_tag('div', attrs={'class': 'explanation-card'})
            new_children.append(current_card)
            current_card.append(child.extract())
        elif current_card:
            current_card.append(child.extract())
        else:
            new_children.append(child.extract())
            
    for child in new_children:
        contents.append(child)
        
    return str(soup)

def main():
    with open('js/data/courseData.js', 'r', encoding='utf-8') as f:
        content = f.read()
        
    match = re.search(r'window\.COURSE_DATA\s*=\s*(\[.*\]);', content, re.DOTALL)
    if not match:
        print("Could not find COURSE_DATA")
        return
        
    json_str = match.group(1)
    data = json.loads(json_str)
    
    modified = 0
    for module in data:
        for q in module.get('questions', []):
            if 'explanation' in q and q['explanation']:
                old = q['explanation']
                new = fix_html(old)
                if old != new:
                    q['explanation'] = new
                    modified += 1
                    
    print(f"Fixed {modified} explanations.")
    
    new_json_str = json.dumps(data, ensure_ascii=False, indent=2)
    new_content = content[:match.start(1)] + new_json_str + content[match.end(1):]
    
    with open('js/data/courseData.js', 'w', encoding='utf-8') as f:
        f.write(new_content)

if __name__ == '__main__':
    main()
