require('dotenv').config();
const mongoose = require('mongoose');
const Alert = require('./models/Alert');

const printers = [
  'Canon imageRUNNER ADVANCE DX C5840i',
  'Xerox AltaLink C8155',
  'Ricoh IM C4500',
  'Konica Minolta bizhub C360i',
  'Epson WorkForce Enterprise WF-C20900'
];

const issues = [
  'Bruit anormal lors de la prise papier.',
  "Qualité d'impression pâle sur les couleurs foncées.",
  "Code d'erreur E000-0000 affiché à l'écran.",
  'Bourrage papier récurrent au niveau du recto-verso.',
  "L'imprimante ne se connecte plus au réseau Wi-Fi.",
  'Traces noires sur le bord des feuilles imprimées.',
  'Le scanner ne détecte pas les documents dans le chargeur.',
  'Demande de remplacement du four (fuser) imminente.',
  'Impression très lente par rapport à la normale.',
  "Taches d'encre magenta sur tous les documents."
];

const severities = ['low', 'medium', 'high', 'critical'];

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('DB connected');
    const alerts = [];
    
    for (let i = 0; i < 10; i++) {
      const printer = printers[Math.floor(Math.random() * printers.length)];
      const issue = issues[i];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const confidence = (Math.floor(Math.random() * 30) + 70) / 100; // 0.70 to 0.99
      
      alerts.push({
        printerModel: printer,
        issue: issue,
        severity: severity,
        status: 'new',
        confidence: confidence,
        conversation: `Bot: Bonjour. Comment puis-je vous aider ?\nUtilisateur: Nous avons un problème avec l'imprimante ${printer}.\nBot: Que se passe-t-il exactement ?\nUtilisateur: ${issue}`
      });
    }
    
    await Alert.insertMany(alerts);
    console.log('10 Alerts created successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
