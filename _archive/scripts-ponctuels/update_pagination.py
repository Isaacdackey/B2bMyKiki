import os, re

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update all PageSize = 5 or 6 to 10
    content = re.sub(r'(requestPageSize|clientPageSize|staffPageSize|faqPageSize|mediaPageSize|eventListPageSize|testimonialPageSize|pageSize)\s*=\s*[56];', r'\1 = 10;', content)

    # 2. Add Prev and Next buttons in pagination divs
    # We look for:
    # <div *ngIf="get[X]TotalPages() > 1" ...>
    #   <button *ngFor="let p of get[X]PageArray()" ... (click)="[x]Page = p"> ... </button>
    # </div>
    # Actually, some variables are just "currentPage" (like in personnel). So:
    # <div *ngIf="get(.*?)TotalPages\(\) > 1"[^>]*>\s*<button \*ngFor="let p of get(.*?)PageArray\(\)"[^>]*\(click\)="([a-zA-Z]+) = p">[\s\S]*?</button>
    
    # Let's match the exact loop
    pattern = r'(<div \*ngIf=\"get([a-zA-Z]*)TotalPages\(\) > 1\"[^>]*>)\s*(<button \*ngFor=\"let p of get([a-zA-Z]*)PageArray\(\)\"[^>]*\(click\)=\"([a-zA-Z]+) = p\">[\s\S]*?</button>)'
    
    def repl(m):
        div_start = m.group(1)
        total_fn = 'get' + m.group(2) + 'TotalPages()'
        page_var = m.group(5)
        button_loop = m.group(3)
        
        # Add flex alignment to div if not present
        if 'align-items: center' not in div_start:
            div_start = div_start.replace(';">', '; align-items: center;">')
            div_start = div_start.replace('"\n', '" align-items: center;\n')
            
        prev_btn = f'''
              <button type="button" class="btn btn-sm" style="background: white; color: #64748B; border: 1px solid #CBD5E1; border-radius: 8px; font-weight: 600; font-size: 0.85rem; padding: 0 0.75rem; cursor: pointer; transition: all 0.2s; height: 32px;" [disabled]="{page_var} === 1" [style.opacity]="{page_var} === 1 ? '0.5' : '1'" (click)="{page_var} = {page_var} - 1">
                Précédent
              </button>'''
        
        next_btn = f'''
              <button type="button" class="btn btn-sm" style="background: white; color: #64748B; border: 1px solid #CBD5E1; border-radius: 8px; font-weight: 600; font-size: 0.85rem; padding: 0 0.75rem; cursor: pointer; transition: all 0.2s; height: 32px;" [disabled]="{page_var} === {total_fn}" [style.opacity]="{page_var} === {total_fn} ? '0.5' : '1'" (click)="{page_var} = {page_var} + 1">
                Suivant
              </button>'''
              
        return f'{div_start}{prev_btn}\n              {button_loop}{next_btn}'

    new_content = re.sub(pattern, repl, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    return content != new_content

files_to_check = [
    'src/app/gestionnaire.component.ts',
    'src/app/gestionnaire/components/demandes/demandes.component.ts',
    'src/app/gestionnaire/components/demandes/demandes.component.html',
    'src/app/gestionnaire/components/personnel/personnel.component.ts',
    'src/app/gestionnaire/components/personnel/personnel.component.html',
    'src/app/gestionnaire/components/mediatheque/mediatheque.component.ts',
    'src/app/gestionnaire/components/mediatheque/mediatheque.component.html',
    'src/app/gestionnaire/components/agenda/agenda.component.ts',
    'src/app/gestionnaire/components/agenda/agenda.component.html',
    'src/app/gestionnaire/components/clients/clients.component.ts',
    'src/app/gestionnaire/components/clients/clients.component.html',
    'src/app/admin-dashboard.component.ts'
]

updated_count = 0
for filepath in files_to_check:
    if os.path.exists(filepath):
        if update_file(filepath):
            print(f'Updated {filepath}')
            updated_count += 1
print(f'Total files updated: {updated_count}')
