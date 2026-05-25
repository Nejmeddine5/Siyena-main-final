# 🤖 Guide d'intégration d'Open‑WebUI avec Siyana

## 📚 Vue d'ensemble
Ce document décrit **comment intégrer l'interface Open‑WebUI** (API compatible OpenAI) dans l'application **Siyana** tout en conservant le **backend Node.js** pour la persistance des conversations et la gestion des droits JWT.

- **Frontend Angular** → **Open‑WebUI** (génération de texte) via `AiService.sendMessageViaOpenWeb`.
- **Backend Node.js** → **MongoDB** (stockage des conversations, validation JWT).
- **Ollama** n’est plus utilisé pour la génération, mais le code est conservé commenté au cas où vous voudriez le réactiver.

---

## 🛠️ Prérequis
1. **Node.js** ≥ 18, **npm**.
2. **MongoDB Atlas** ou serveur local (déjà configuré dans `.env`).
3. **Docker** installé pour lancer Open‑WebUI.
4. Un **modèle** disponible sur Ollama (ex. `llama3:8b`).

---

## 🚀 Étape 1 – Lancer Open‑WebUI avec CORS
```bash
docker run -p 3000:8080 \
  -e CORS_ALLOW_ORIGINS="http://localhost:4200" \
  ghcr.io/open-webui/open-webui:latest
```
- Le conteneur expose l’API sur **`http://localhost:3000/api`**.
- Le header **CORS** autorise votre front‑end Angular (`http://localhost:4200`).

> **⚠️ Astuce** : si vous avez déjà un conteneur Open‑WebUI en cours d’exécution, arrêtez‑le (`docker stop <id>`) avant de relancer avec le flag `CORS_ALLOW_ORIGINS`.

---

## 🔑 Étape 2 – Authentification (optionnelle)
Si votre instance Open‑WebUI nécessite un token :
```ts
// src/app/core/services/ai.service.ts
const headers = new HttpHeaders({
  'Content‑Type': 'application/json',
  // Remplacez YOUR_API_KEY par la clé générée dans Open‑WebUI > Settings > API Keys
  'Authorization': `Bearer YOUR_API_KEY`
});
```
Ajoutez ce header dans la méthode `sendMessageViaOpenWeb` (déjà présent, il suffit de décommenter la ligne correspondante).

---

## 📡 Étape 3 – Configuration du front‑end
`AiService` expose déjà deux méthodes :
- `sendMessage(message, conversationId)` : conservée pour la persistance (appelé uniquement si vous avez besoin de créer une conversation).
- `sendMessageViaOpenWeb(message, model = 'llama3:8b')` : **utilisée par le composant `ai-chat`** pour obtenir la réponse de l’IA.

Le composant `ai-chat.component.ts` a été mis à jour :
```ts
this.aiService.sendMessageViaOpenWeb(userText).subscribe({
  next: (res) => {
    const content = res?.choices?.[0]?.message?.content || 'No response';
    this.messages.push({ role: 'assistant', content, formattedContent: this.formatMessageContent(content) });
    this.isLoading = false;
    this.scrollToBottom();
  },
  error: (err) => { /* gestion d’erreur */ }
});
```
> **Remarque** : la fonction `sendMessage` du backend reste disponible pour créer/mettre à jour les conversations dans MongoDB.

---

## 🗄️ Étape 4 – Conserver le backend pour la persistance
Les routes suivantes restent **actives** :
- `GET /api/ai/conversations` – liste les conversations de l’utilisateur.
- `GET /api/ai/conversations/:id/messages` – récupère l’historique d’une conversation.
- `POST /api/ai/chat` – **ne génère plus la réponse** ; elle sauvegarde uniquement le message utilisateur et, si vous le désirez, crée la conversation. Le bloc d’appel à Ollama a été **commenté** dans `server/controllers/aiController.js` (voir à la fin du fichier).

Vous pouvez donc continuer d’utiliser ces endpoints pour :
- Afficher la liste des conversations dans la sidebar.
- Charger l’historique lorsqu’on ouvre une conversation.
- Conserver les dates d’activité (`lastMessageAt`).

---

## 🛠️ Étape 5 – Désactiver le code Ollama (déjà fait)
Dans `server/controllers/aiController.js` :
```js
//   // 4. Call Ollama directly
//   let aiResponseContent = '';
//   try { … } catch (error) { … }
```
Le bloc est entièrement commenté ; il peut être ré‑activé à tout moment en supprimant les `//`.

---

## 📦 Étape 6 – Lancer l'application
```bash
# Terminal 1 – Backend
npm start   # depuis le répertoire server

# Terminal 2 – Frontend
npx ng serve --host 0.0.0.0   # depuis le répertoire client
```
Le front‑end sera accessible sur **`http://localhost:4200`** et communiquera directement avec Open‑WebUI.

---

## ✅ Vérification
1. Ouvrez le chat dans le navigateur.
2. Saisissez une question ; le message devrait arriver instantanément et la réponse s’afficher.
3. Rafraîchissez la page ; la conversation doit persister (les messages sont stockés dans MongoDB).  
4. Consultez les logs du backend : aucun appel à `http://localhost:11434/api/generate` ne doit apparaître.

---

## 📚 Ressources complémentaires
- **Open‑WebUI Docs** : https://docs.open-webui.com
- **Docker Hub – Open‑WebUI** : https://hub.docker.com/r/openwebui/open-webui
- **Ollama** : https://ollama.com

---

*Ce guide a été mis à jour le **2026‑05‑25** pour refléter l’intégration actuelle.*
