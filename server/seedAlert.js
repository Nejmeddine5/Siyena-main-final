require('dotenv').config();
const mongoose = require('mongoose');
const Alert = require('./models/Alert');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('DB connected');
    const alert = new Alert({
      clientName: 'Entreprise Demo SARL',
      printerModel: 'Epson WorkForce Pro WF-C869R',
      issue: "Bourrage papier récurrent au niveau du bac 2 et qualité d'impression dégradée.",
      severity: 'high',
      status: 'new',
      confidence: 95,
      conversation: 'Client: Bonjour, notre imprimante Epson est en panne.\\nBot: Pouvez-vous décrire le problème ?\\nClient: Il y a un bourrage papier.'
    });
    await alert.save();
    console.log('Demo Alert created:', alert._id);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
