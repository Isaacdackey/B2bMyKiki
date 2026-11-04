import os

filepath = 'src/app/gestionnaire.component.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    # 1. HTML Blocks
    (
        '''<button *ngFor="let p of getRequestPageArray(): (number | string)[] {
    return this.getPaginationArray(this.requestPage, this.getRequestTotalPages());
  }
              </button>''',
        '''<button *ngFor="let p of getRequestPageArray()" type="button" class="btn btn-sm"
                [style.background]="requestPage === p ? '#7A1C1C' : (p === '...' ? 'transparent' : 'white')"
                [style.color]="requestPage === p ? 'white' : '#64748B'"
                [style.border]="requestPage === p ? '1px solid #7A1C1C' : (p === '...' ? 'none' : '1px solid #CBD5E1')"
                [disabled]="p === '...'" [style.cursor]="p === '...' ? 'default' : 'pointer'"
                style="width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.85rem; padding: 0; transition: all 0.2s;"
                (click)="p !== '...' && (requestPage = $any(p))">
                {{ p }}
              </button>'''
    ),
    (
        '''<button *ngFor="let p of getEventPageArray(): (number | string)[] {
    return this.getPaginationArray(this.eventListPage, this.getEventTotalPages());
  }
              </button>''',
        '''<button *ngFor="let p of getEventPageArray()" type="button" class="btn btn-sm"
                [style.background]="eventListPage === p ? '#7A1C1C' : (p === '...' ? 'transparent' : 'white')"
                [style.color]="eventListPage === p ? 'white' : '#64748B'"
                [style.border]="eventListPage === p ? '1px solid #7A1C1C' : (p === '...' ? 'none' : '1px solid #CBD5E1')"
                [disabled]="p === '...'" [style.cursor]="p === '...' ? 'default' : 'pointer'"
                style="width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.85rem; padding: 0; transition: all 0.2s;"
                (click)="p !== '...' && (eventListPage = $any(p))">
                {{ p }}
              </button>'''
    ),
    (
        '''<button *ngFor="let p of getMediaPageArray(): (number | string)[] {
    return this.getPaginationArray(this.mediaPage, this.getMediaTotalPages());
  }
              </button>''',
        '''<button *ngFor="let p of getMediaPageArray()" type="button" class="btn btn-sm"
                [style.background]="mediaPage === p ? '#7A1C1C' : (p === '...' ? 'transparent' : 'white')"
                [style.color]="mediaPage === p ? 'white' : '#64748B'"
                [style.border]="mediaPage === p ? '1px solid #7A1C1C' : (p === '...' ? 'none' : '1px solid #CBD5E1')"
                [disabled]="p === '...'" [style.cursor]="p === '...' ? 'default' : 'pointer'"
                style="width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.85rem; padding: 0; transition: all 0.2s;"
                (click)="p !== '...' && (mediaPage = $any(p))">
                {{ p }}
              </button>'''
    ),
    (
        '''<button *ngFor="let p of getFaqPageArray(): (number | string)[] {
    return this.getPaginationArray(this.faqPage, this.getFaqTotalPages());
  }
              </button>''',
        '''<button *ngFor="let p of getFaqPageArray()" type="button" class="btn btn-sm"
                [style.background]="faqPage === p ? '#7A1C1C' : (p === '...' ? 'transparent' : 'white')"
                [style.color]="faqPage === p ? 'white' : '#64748B'"
                [style.border]="faqPage === p ? '1px solid #7A1C1C' : (p === '...' ? 'none' : '1px solid #CBD5E1')"
                [disabled]="p === '...'" [style.cursor]="p === '...' ? 'default' : 'pointer'"
                style="width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.85rem; padding: 0; transition: all 0.2s;"
                (click)="p !== '...' && (faqPage = $any(p))">
                {{ p }}
              </button>'''
    ),
    (
        '''<button *ngFor="let p of getClientPageArray(): (number | string)[] {
    return this.getPaginationArray(this.clientPage, this.getClientTotalPages());
  }
              </button>''',
        '''<button *ngFor="let p of getClientPageArray()" type="button" class="btn btn-sm"
                [style.background]="clientPage === p ? '#7A1C1C' : (p === '...' ? 'transparent' : 'white')"
                [style.color]="clientPage === p ? 'white' : '#64748B'"
                [style.border]="clientPage === p ? '1px solid #7A1C1C' : (p === '...' ? 'none' : '1px solid #CBD5E1')"
                [disabled]="p === '...'" [style.cursor]="p === '...' ? 'default' : 'pointer'"
                style="width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.85rem; padding: 0; transition: all 0.2s;"
                (click)="p !== '...' && (clientPage = $any(p))">
                {{ p }}
              </button>'''
    ),
    (
        '''<button *ngFor="let p of getStaffPageArray(): (number | string)[] {
    return this.getPaginationArray(this.staffPage, this.getStaffTotalPages());
  }
              </button>''',
        '''<button *ngFor="let p of getStaffPageArray()" type="button" class="btn btn-sm"
                [style.background]="staffPage === p ? '#7A1C1C' : (p === '...' ? 'transparent' : 'white')"
                [style.color]="staffPage === p ? 'white' : '#64748B'"
                [style.border]="staffPage === p ? '1px solid #7A1C1C' : (p === '...' ? 'none' : '1px solid #CBD5E1')"
                [disabled]="p === '...'" [style.cursor]="p === '...' ? 'default' : 'pointer'"
                style="width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.85rem; padding: 0; transition: all 0.2s;"
                (click)="p !== '...' && (staffPage = $any(p))">
                {{ p }}
              </button>'''
    ),
    
    # 2. TS Function Blocks
    (
        '''getRequestPageArray(): number[] {
    return Array.from({ length: this.getRequestTotalPages() }, (_, i) => i + 1);
  }''',
        '''getRequestPageArray(): (number | string)[] {
    return this.getPaginationArray(this.requestPage, this.getRequestTotalPages());
  }'''
    ),
    (
        '''getClientPageArray(): number[] {
    return Array.from({ length: this.getClientTotalPages() }, (_, i) => i + 1);
  }''',
        '''getClientPageArray(): (number | string)[] {
    return this.getPaginationArray(this.clientPage, this.getClientTotalPages());
  }'''
    ),
    (
        '''getStaffPageArray(): number[] {
    return Array.from({ length: this.getStaffTotalPages() }, (_, i) => i + 1);
  }''',
        '''getStaffPageArray(): (number | string)[] {
    return this.getPaginationArray(this.staffPage, this.getStaffTotalPages());
  }'''
    ),
    (
        '''getFaqPageArray(): number[] {
    return Array.from({ length: this.getFaqTotalPages() }, (_, i) => i + 1);
  }''',
        '''getFaqPageArray(): (number | string)[] {
    return this.getPaginationArray(this.faqPage, this.getFaqTotalPages());
  }'''
    ),
    (
        '''getMediaPageArray(): number[] {
    return Array.from({ length: this.getMediaTotalPages() }, (_, i) => i + 1);
  }''',
        '''getMediaPageArray(): (number | string)[] {
    return this.getPaginationArray(this.mediaPage, this.getMediaTotalPages());
  }'''
    ),
    (
        '''getEventPageArray(): number[] {
    return Array.from({ length: this.getEventTotalPages() }, (_, i) => i + 1);
  }''',
        '''getEventPageArray(): (number | string)[] {
    return this.getPaginationArray(this.eventListPage, this.getEventTotalPages());
  }'''
    )
]

for old, new in replacements:
    content = content.replace(old, new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Finished fixing gestionnaire.component.ts")
