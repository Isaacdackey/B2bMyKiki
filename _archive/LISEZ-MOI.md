# Archive — à supprimer

Ce dossier est **hors du périmètre de compilation** (`tsconfig.app.json` ne compile
que `src/**/*.ts`). Rien ici n'est utilisé par l'application.

Il n'a été créé que parce que `kiki_front/` n'était pas versionné au moment du
nettoyage : supprimer directement 240 Ko de code sans historique Git aurait été
irréversible.

**Dès que le frontend est poussé sur le dépôt privé, supprimez ce dossier entier.**

## `code-mort/`

| Fichier | Pourquoi il est mort |
|---|---|
| `gestionnaire.component.ts` | Monolithe d'origine, 4 857 lignes. Déjà découpé dans `src/app/gestionnaire/components/`. La route `/gestionnaire` charge `src/app/gestionnaire/gestionnaire.component.ts` (9 Ko), pas celui-ci. Aucun import ne le référence. |
| `admin-dashboard.component.ts` | 1 089 lignes, référencé par aucune route ni aucun import. |

## `scripts-ponctuels/`

Scripts de refactoring à usage unique et fichiers de travail intermédiaires
(`fix_monolith.py`, `fix_escapes.py`, `fix.js`, `update_pagination*.py`,
`modals_extracted.html`, `extracted_methods.txt`, `temp_end.txt`).
Ils ont servi à découper le monolithe et n'ont plus d'objet.
