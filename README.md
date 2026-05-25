<div align="center">
  <p>
    <img src="client/src/media/cims.png" alt="CIMS Logo" width="250" style="margin-right: 30px;" />
    <img src="client/src/media/siyana.png" alt="SIYENA Logo" width="250" />
  </p>

# 🛠️ SIYENA - Plateforme de Gestion Technique

**Une plateforme modulaire et moderne pour le suivi des interventions et la gestion du personnel technique.**

[![Angular](https://img.shields.io/badge/Angular-v16+-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-API-404D59?style=for-the-badge)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-RealTime-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)

</div>

---

## 📖 À propos du projet

**SIYENA** a été pensée pour répondre aux défis techniques et logistiques des équipes d'intervention. Elle fluidifie l'intégration de nouveaux membres, sécurise l'accès aux données grâce à un système d'authentification par rôle, et permet un suivi en temps réel.

🚀 **Double architecture** :
- **Frontend** : Application Single Page (SPA) en **Angular** avec une UI élégante et entièrement responsive grâce à **Tailwind CSS**.
- **Backend** : API REST robuste en **Node.js** dotée de WebSockets (Socket.IO) pour l'instantanéité.

---

## ✨ Fonctionnalités Clés

| Fonctionnalité | Description |
| :--- | :--- |
| **🛡️ Authentification Sécurisée** | Inscription/Connexion sécurisée par **JWT** et **Bcrypt**. Les nouveaux comptes sont mis "en attente" d'approbation. |
| **👑 Panneau Administrateur** | Gestion visuelle des utilisateurs : modifier les rôles, accepter ou rejeter (supprimer) les nouvelles inscriptions. |
| **⚡ Temps Réel & Alertes** | Centre de notifications intégré alimenté par **Socket.IO** pour les événements critiques (ex: arrivée d'un nouveau membre). |
| **📧 Processus Email Automatisé** | Déclenchement automatique d'un email de bienvenue stylisé (via **Nodemailer**) dès qu'un compte est approuvé par l'admin. |

---

## 🚦 Démarrage Rapide

### Pré-requis obligatoires
- **Node.js** (v18+)
- **Angular CLI**
- Accès à un cluster **MongoDB** (ex: Atlas)

### 1. Variables d'Environnement
Dans le répertoire `server/`, créez un fichier `.env` basé sur `.env.example` :

```ini
PORT=5000
MONGODB_URI=mongodb+srv://<votre_cluster>
JWT_SECRET=super_secret_jwt_key
JWT_EXPIRES_IN=1d

# Paramètres SMTP (ex: Gmail App Password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre_email@gmail.com
EMAIL_PASS=votre_mot_de_passe_app
EMAIL_FROM=votre_email@gmail.com
```

### 2. Lancement Global (Développement)

> Nous vous conseillons d'ouvrir deux terminaux simultanément.

**🖥️ Terminal 1 - Serveur (Port 5000) :**
```bash
cd server
npm install
npm start # (ou npm run dev pour hot-reload)
```

**🌐 Terminal 2 - Client Angular (Port 4200) :**
```bash
cd client
npm install
npx ng serve --host 0.0.0.0
```

👉 L'application est maintenant disponible sur : **[http://localhost:4200](http://localhost:4200)**

---

## 👥 Gestion des Autorisations

Le système repose sur un contrôle d'accès strict (RBAC) :

- 🔴 **Admin (`admin`)** : Contrôle absolu. Gère les membres, modifie les niveaux d'accès, et reçoit les alertes de sécurité et d'arrivées.
- 🔵 **Technicien (`technician`)** : Utilisateur standard. Peut intervenir sur les processus métiers et visualiser son dashboard technique.
- 🟢 **Employé (`employee`)** : Profil avec un niveau d'interaction limité, orienté vers la visualisation d'informations et l'assistance technique.
  - **Interface intelligente assistée par IA**
  - **Communication avec modèle Ollama** local
  - **Historique personnel des conversations**
  - **Assistant technique intelligent** pour aider aux tâches quotidiennes

---

## 🤖 AI Assistant (Ollama)

L'espace employé intègre une solution d'IA conversationnelle fonctionnant entièrement en local pour une confidentialité maximale.

### Architecture

L'assistant repose sur une architecture multi-tier :
`Frontend Angular` ➡️ `API Node.js` ➡️ `Backend Python` ➡️ `Ollama (Modèle Local)`

1. **Angular (Frontend)** : Fournit une interface utilisateur moderne et réactive (type ChatGPT), incluant l'historique des conversations et le chat en temps réel.
2. **Node.js (Backend Gateway)** : Intercepte les requêtes, gère la sécurité (JWT, Rôles), sauvegarde l'historique dans MongoDB (modèles `Conversation` et `Message`) et transmet la requête.
3. **Python (API d'inférence)** : Communique directement avec le moteur Ollama local pour générer la réponse IA.
4. **Ollama** : Exécute le LLM localement.

### Lancement Local (Ollama & Python)

Assurez-vous que l'URL du backend Python est configurée dans votre `.env` Node.js :
```ini
PYTHON_AI_URL=http://localhost:8000/chat
```

Pour démarrer l'IA :
1. Démarrez Ollama avec votre modèle (ex: `ollama run llama2` ou `ollama run mistral`).
2. Démarrez votre serveur Python FastAPI/Flask sur le port 8000.
3. Les employés peuvent désormais interagir avec l'IA via `/employee/chat`.

---

<details>
<summary><b>📂 Voir l'Architecture du Projet</b></summary>
<br>

```text
SIYENA/
├─ client/                # FRONTEND (Angular + Tailwind)
│  ├─ src/
│  │  ├─ app/
│  │  │  ├─ core/         # Services globaux, Intercepteurs HTTP, Guards (Auth)
│  │  │  ├─ features/     # Composants métiers (Login, Admin Dashboard, Profil)
│  │  │  └─ shared/       # Composants réutilisables (Navbar, Footer)
│  │  ├─ assets/          # Médias & Images
│  │  └─ environments/    # URLs d'API pour dév / prod
│  └─ ...
│
├─ server/                # BACKEND (Node.js + Express)
│  ├─ controllers/        # Logique métier liant les requêtes et la base de données
│  ├─ middleware/         # Protections de routes (Vérification JWT & Rôles)
│  ├─ models/             # Modèles Mongoose (Données)
│  ├─ routes/             # Indexation des endpoints API (/api/auth, /api/admin...)
│  ├─ services/           # Services tiers autonomes (Envoi d'e-mails HTML, WebSockets...)
│  └─ server.js           # Point de lancement (Bootstrap de l'app)
│
└─ README.md
```

</details>

---
