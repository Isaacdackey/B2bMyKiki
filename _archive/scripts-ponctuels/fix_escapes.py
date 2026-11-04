import os

components = [
    'src/app/gestionnaire.component.ts',
    'src/app/gestionnaire/components/demandes/demandes.component.html',
    'src/app/gestionnaire/components/personnel/personnel.component.html',
    'src/app/gestionnaire/components/mediatheque/mediatheque.component.html',
    'src/app/gestionnaire/components/agenda/agenda.component.html',
    'src/app/gestionnaire/components/clients/clients.component.html',
    'src/app/gestionnaire/components/cms/cms.component.html'
]

for f in components:
    if os.path.exists(f):
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Replace \' with '
        new_content = content.replace("\\'", "'")
        
        if new_content != content:
            with open(f, 'w', encoding='utf-8') as file:
                file.write(new_content)
            print(f'Fixed {f}')
