const axios = require('axios');

(async () => {
  console.log("Démarrage du test direct avec Ollama (modèle de base llama3:8b)...");
  try {
    const startTime = Date.now();
    const response = await axios.post(
      'http://localhost:11434/api/generate',
      {
        model: 'llama3:8b',
        prompt: 'Réponds par un seul mot: "Oui"',
        stream: false
      },
      {
        timeout: 300000 // 5 minutes max
      }
    );
    const duration = (Date.now() - startTime) / 1000;
    console.log(`Succès! Temps de réponse: ${duration} secondes.`);
    console.log("Réponse:", response.data.response);
  } catch (error) {
    console.error("Erreur Ollama:", error.message);
  }
})();
