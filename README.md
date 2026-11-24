# Kiki Traiteur — Plateforme B2B (Restauration d'Entreprise)

Monorepo officiel de la solution B2B **Kiki Traiteur** :

- **`BToBKikiFront/`** — Application web Angular (Espaces Super Admin, Responsable Entreprise / RH, Responsable de Site / Cuisine, Salarié Conventionné & Autonome).
- **`BToBKikiBack/`** — API REST Spring Boot 4 / Java 21 (architecture modulaire SOLID, PostgreSQL, authentification JWT, endpoint de santé `/api/ping`).

---

## Prérequis

- **Node.js** 20+ & npm
- **Java** 21+ (JDK)
- **PostgreSQL** (ou instance Neon)

---

## Démarrage rapide

### 1. Backend (`BToBKikiBack/`)
```bash
cd BToBKikiBack
cp .env.example .env   # Renseigner SPRING_DATASOURCE_URL, USERNAME, PASSWORD, APP_JWT_SECRET
./mvnw spring-boot:run
```
L'API démarre sur `http://localhost:8080` (healthcheck : `GET /api/ping`).

### 2. Frontend (`BToBKikiFront/`)
```bash
cd BToBKikiFront
npm install
npx ng serve --port 4200
```
L'application est accessible sur `http://localhost:4200`.

---

## Déploiement VPS / Production

- **Backend** : `./mvnw clean package -DskipTests` puis `java -jar target/*.jar` avec les variables d'environnement de `.env`.
- **Frontend** : `npx ng build` dans `BToBKikiFront/` (génère `dist/` prêt à être servi par Nginx / Vercel).
