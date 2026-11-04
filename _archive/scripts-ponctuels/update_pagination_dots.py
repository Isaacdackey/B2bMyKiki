import os, re

def update_file(ts_path, html_path=None):
    if not os.path.exists(ts_path):
        return False
        
    with open(ts_path, 'r', encoding='utf-8') as f:
        ts_content = f.read()
        
    # Inject getPaginationArray if not present
    if 'getPaginationArray(' not in ts_content:
        # Find a good place to insert it, maybe before the last closing brace
        last_brace_idx = ts_content.rfind('}')
        
        helper_method = '''
  getPaginationArray(currentPage: number, totalPages: number): (number | string)[] {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i == 1 || i == totalPages || i >= currentPage - delta && i < currentPage + delta + 1) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }
    return rangeWithDots;
  }
'''
        ts_content = ts_content[:last_brace_idx] + helper_method + ts_content[last_brace_idx:]

    # Replace all getXPageArray() logic
    # Original is like: 
    # getFaqPageArray(): number[] { return Array.from({ length: this.getFaqTotalPages() }, (_, i) => i + 1); }
    # OR 
    # getRequestPageArray(): number[] { ... return pages; }
    
    # We will just do a regex replace for any get(.*?)PageArray\(\)(: number\[\])? \{[\s\S]*?\}
    # But that's risky. Let's do targeted replacements.
    
    methods = re.findall(r'get([a-zA-Z]*)PageArray\(\)(: number\[\])?\s*\{', ts_content)
    
    for method in set(methods):
        name = method[0]
        # find the full method body. it could be 1 line or multiple lines.
        # we can just use a simple state machine to replace the method body
        pattern = r'get' + name + r'PageArray\(\)(?: \w+)?(?::\s*number\[\])?\s*\{[\s\S]*?\}'
        
        # We need to know which page variable it is associated with.
        # Usually it's lowercase of name + "Page". E.g. Faq -> faqPage. Request -> requestPage.
        # Sometimes there's a mismatch (eventList vs event).
        # We can deduce the page variable by looking at what was clicked in the HTML, but that's hard here.
        # Let's map them explicitly:
        if name == '':
            page_var = 'currentPage'
        else:
            page_var = name[0].lower() + name[1:] + 'Page'
        
        if name == 'Event': page_var = 'eventListPage'
        
        new_method = f"get{name}PageArray(): (number | string)[] {{\n    return this.getPaginationArray(this.{page_var}, this.get{name}TotalPages());\n  }}"
        
        # Careful with regex replace to avoid matching too much
        # Since the methods are usually small, we can use a non-greedy match that stops at the first '}' after a return
        # Actually, let's just do a manual string replace by finding the start and the matching brace
        start_idx = ts_content.find(f'get{name}PageArray()')
        if start_idx != -1:
            brace_idx = ts_content.find('{', start_idx)
            # Find the matching closing brace
            open_braces = 0
            end_idx = -1
            for i in range(brace_idx, len(ts_content)):
                if ts_content[i] == '{':
                    open_braces += 1
                elif ts_content[i] == '}':
                    open_braces -= 1
                    if open_braces == 0:
                        end_idx = i
                        break
            if end_idx != -1:
                ts_content = ts_content[:start_idx] + new_method + ts_content[end_idx+1:]

    with open(ts_path, 'w', encoding='utf-8') as f:
        f.write(ts_content)

    # Now update HTML
    html_file = html_path if html_path else ts_path
    if os.path.exists(html_file):
        with open(html_file, 'r', encoding='utf-8') as f:
            html_content = f.read()

        # Update the button loop styles and click handler
        # Old: <button *ngFor="let p of getXPageArray()" ... (click)="xPage = p"> {{ p }} </button>
        # We want to use a regex to capture the button tag and its contents.
        
        pattern_html = r'(<button \*ngFor=\"let p of get[a-zA-Z]*PageArray\(\)\"[^>]*)(>[\s\S]*?<\/button>)'
        
        def repl_html(m):
            tag = m.group(1)
            inner = m.group(2)
            
            # replace logic inside the tag
            # [style.background]="... ? '#...' : 'white'" -> [style.background]="... ? '#...' : (p === '...' ? 'transparent' : 'white')"
            tag = re.sub(r'(\[style\.background\]=".*? \? \'.*?\' \: )\'white\'"', r'\1(p === \'...\' ? \'transparent\' : \'white\')"', tag)
            tag = re.sub(r'(\[style\.border\]=".*? \? \'.*?\' \: )\'1px solid #CBD5E1\'"', r'\1(p === \'...\' ? \'none\' : \'1px solid #CBD5E1\')"', tag)
            
            # extract the page variable from click handler: (click)="faqPage = p"
            click_match = re.search(r'\(click\)="([a-zA-Z]+) = p"', tag)
            if click_match:
                page_var = click_match.group(1)
                tag = tag.replace(f'(click)="{page_var} = p"', f'(click)="p !== \'...\' && ({page_var} = $any(p))"')
            
            if 'disabled=' not in tag:
                tag = tag + ' [disabled]="p === \'...\'" [style.cursor]="p === \'...\' ? \'default\' : \'pointer\'"'
                
            return tag + inner
            
        new_html_content = re.sub(pattern_html, repl_html, html_content)
        
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(new_html_content)

components = [
    ('src/app/gestionnaire.component.ts', None),
    ('src/app/gestionnaire/components/demandes/demandes.component.ts', 'src/app/gestionnaire/components/demandes/demandes.component.html'),
    ('src/app/gestionnaire/components/personnel/personnel.component.ts', 'src/app/gestionnaire/components/personnel/personnel.component.html'),
    ('src/app/gestionnaire/components/mediatheque/mediatheque.component.ts', 'src/app/gestionnaire/components/mediatheque/mediatheque.component.html'),
    ('src/app/gestionnaire/components/agenda/agenda.component.ts', 'src/app/gestionnaire/components/agenda/agenda.component.html'),
    ('src/app/gestionnaire/components/clients/clients.component.ts', 'src/app/gestionnaire/components/clients/clients.component.html'),
    ('src/app/gestionnaire/components/cms/cms.component.ts', 'src/app/gestionnaire/components/cms/cms.component.html')
]

for ts, html in components:
    update_file(ts, html)
    print(f"Processed {ts}")

