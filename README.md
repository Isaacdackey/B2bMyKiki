# KikiFront

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.1.1.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Configuration des variables d'environnement (`.env`)

Le frontend utilise un fichier `.env` pour configurer l'URL de l'API et les clés externes (Cloudinary).

1. Copiez le template d'exemple :
   ```bash
   cp .env.example .env
   ```
2. Personnalisez les valeurs si nécessaire (ex: `API_URL=http://localhost:8080` en local).
3. Les fichiers d'environnement Angular sont régénérés automatiquement lors de `npm start` et `npm run build` (via `scripts/set-env.mjs`).

## Workflow Git et Branches

Pour chaque nouvelle fonctionnalité :
1. Créez une branche dédiée :
   ```bash
   git checkout -b feature/nom-de-la-fonctionnalite
   ```
2. Développez, commitez vos changements :
   ```bash
   git commit -m "feat(...): description de la fonctionnalite"
   ```
3. Poussez la branche sur GitHub :
   ```bash
   git push origin feature/nom-de-la-fonctionnalite
   ```
4. Ouvrez une Pull Request / fusionnez vers `main`.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
