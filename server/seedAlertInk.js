require('dotenv').config();
const mongoose = require('mongoose');
const Alert = require('./models/Alert');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('DB connected');
    const alert = new Alert({
      printerModel: 'HP Color LaserJet Pro M454dn',
      issue: "Niveau d'encre bas (cartouche cyan) et fuite détectée près de la tête d'impression.",
      severity: 'medium',
      status: 'new',
      confidence: 85,
      conversation: "Bot: Le système a détecté une anomalie sur le niveau d'encre.\nSystème: Cartouche Cyan < 5%, fuite mineure possible."
    });
    await alert.save();
    console.log('Ink Alert created:', alert._id);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
