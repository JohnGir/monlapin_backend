// Exemple avec Orange SMS API (Côte d'Ivoire)
const axios = require('axios');

exports.sendOrderSMS = async (order) => {
  try {
    const phoneNumber = order.customerInfo.phone;
    
    if (!phoneNumber || !phoneNumber.startsWith('225')) {
      console.log('📞 Numéro de téléphone invalide pour SMS');
      return;
    }

    const message = `Merci pour votre commande #${order.orderNumber} sur Mon Lapin CI. Total: ${order.totalAmount.toLocaleString()} FCFA. Nous vous contacterons pour la livraison.`;

    // Configuration Orange SMS API
    const smsData = {
      recipient: phoneNumber,
      message: message,
      sender: 'MonLapinCI',
      // Ajouter les clés API Orange
    };

    // Envoyer le SMS via l'API Orange
    // const response = await axios.post('https://api.orange.com/smsmessaging/v1/outbound/...', smsData, {
    //   headers: {
    //     'Authorization': `Bearer ${process.env.ORANGE_API_TOKEN}`,
    //     'Content-Type': 'application/json'
    //   }
    // });

    // Pour le moment, on log le message
    console.log(`📱 SMS à envoyer à ${phoneNumber}: ${message}`);
    
    console.log('✅ Notification SMS préparée');

  } catch (error) {
    console.error('❌ Erreur envoi SMS:', error);
    // Ne pas bloquer la commande si SMS échoue
  }
};