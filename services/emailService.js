// services/emailService.js
const nodemailer = require('nodemailer');

console.log('🔧 Configuration SMTP:');
console.log('- Host:', process.env.SMTP_HOST);
console.log('- Port:', process.env.SMTP_PORT);
console.log('- User:', process.env.SMTP_USER);
console.log('- Pass length:', process.env.SMTP_PASS?.length);


// Configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Test de connexion SMTP
transporter.verify(function (error, success) {
  if (error) {
    console.log('❌ Erreur connexion SMTP:', error);
  } else {
    console.log('✅ Serveur SMTP prêt');
  }
});

// Email au client
exports.sendOrderConfirmationEmail = async (order) => {
  try {

    console.log('📧 Tentative envoi email à:', order.customerInfo.email);
    const mailOptions = {
      from: '"Mon Lapin CI" <noreply@monlapinci.com>',
      to: order.customerInfo.email,
      subject: `✅ Confirmation de commande #${order.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; background-color: #1F4627; padding: 20px; border-radius: 10px 10px 0 0; color: white;">
            <h1 style="margin: 0;">🐇 Mon Lapin CI</h1>
            <p style="margin: 5px 0 0 0;">Votre commande est confirmée !</p>
          </div>
          
          <div style="padding: 20px;">
            <h2 style="color: #1F4627;">Merci pour votre commande !</h2>
            <p>Votre commande <strong>#${order.orderNumber}</strong> a été enregistrée avec succès le ${new Date(order.createdAt).toLocaleDateString('fr-FR')}.</p>
            
            <h3 style="color: #1F4627; border-bottom: 2px solid #1F4627; padding-bottom: 10px;">Détails de la commande :</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Produit</th>
                  <th style="padding: 12px; text-align: center; border-bottom: 1px solid #ddd;">Quantité</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 1px solid #ddd;">Prix</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #ddd;">
                      <strong>${item.name}</strong>
                    </td>
                    <td style="padding: 12px; text-align: center; border-bottom: 1px solid #ddd;">
                      ${item.quantity}
                    </td>
                    <td style="padding: 12px; text-align: right; border-bottom: 1px solid #ddd;">
                      ${(item.price * item.quantity).toLocaleString()} FCFA
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; text-align: right; margin: 20px 0;">
              <strong style="font-size: 18px; color: #1F4627;">Total: ${order.totalAmount.toLocaleString()} FCFA</strong>
            </div>
            
            <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="color: #1F4627; margin-top: 0;">📦 Informations de livraison</h4>
              <p><strong>Statut:</strong> En préparation</p>
              <p><strong>Méthode de paiement:</strong> Wave</p>
              <p><strong>Livraison:</strong> Grand Abidjan (sous 24-48h)</p>
            </div>
            
            <p>Nous vous contacterons dans les plus brefs délais pour finaliser les détails de livraison.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="color: #666; font-size: 14px;">
                Cordialement,<br>
                <strong>L'équipe Mon Lapin CI</strong><br>
                📞 +225 07 00 00 00 00<br>
                📧 contact@monlapinci.com
              </p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email client envoyé à: ${order.customerInfo.email}`);
    console.log('✅ Email envoyé avec succès:', info.messageId);
    
  } catch (error) {
    console.error('❌ Erreur envoi email client:', error);
    throw error;
  }
};

// Email de notification au propriétaire (vous)
exports.sendOrderNotificationToAdmin = async (order) => {
  try {
    const adminEmail = 'giral581@gmail.com'; // Votre email
    const supportEmail = 'monlapinci2025@gmail.com';
    
    const mailOptions = {
      from: '"Mon Lapin CI - Système" <noreply@monlapinci.com>',
      to: [adminEmail, supportEmail],
      subject: `🚨 NOUVELLE COMMANDE #${order.orderNumber} - ${order.totalAmount.toLocaleString()} FCFA`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; background-color: #dc3545; padding: 20px; border-radius: 10px 10px 0 0; color: white;">
            <h1 style="margin: 0;">🚨 NOUVELLE COMMANDE</h1>
            <p style="margin: 5px 0 0 0;">Action requise</p>
          </div>
          
          <div style="padding: 20px;">
            <h2 style="color: #dc3545;">Commande #${order.orderNumber}</h2>
            <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString('fr-FR')}</p>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h4 style="color: #856404; margin-top: 0;">👤 Informations client</h4>
              <p><strong>Email:</strong> ${order.customerInfo.email}</p>
              <p><strong>Téléphone:</strong> ${order.customerInfo.phone || 'Non renseigné'}</p>
              <p><strong>Nom:</strong> ${order.customerInfo.fullName || 'Non renseigné'}</p>
            </div>
            
            <h3 style="color: #1F4627;">📋 Détails de la commande :</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
              <thead>
                <tr style="background-color: #1F4627; color: white;">
                  <th style="padding: 10px; text-align: left;">Produit</th>
                  <th style="padding: 10px; text-align: center;">Qté</th>
                  <th style="padding: 10px; text-align: right;">Prix Unitaire</th>
                  <th style="padding: 10px; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
                    <td style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">${item.quantity}</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">${item.price.toLocaleString()} FCFA</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">${(item.price * item.quantity).toLocaleString()} FCFA</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div style="background-color: #1F4627; color: white; padding: 15px; border-radius: 5px; text-align: right; margin: 20px 0;">
              <strong style="font-size: 20px;">TOTAL: ${order.totalAmount.toLocaleString()} FCFA</strong>
            </div>
            
            <div style="background-color: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="color: #0c5460; margin-top: 0;">📍 Adresse de livraison</h4>
              <p><strong>Ville:</strong> ${order.deliveryAddress?.city || 'Non spécifiée'}</p>
              <p><strong>Adresse:</strong> ${order.deliveryAddress?.address || 'À préciser avec le client'}</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://api.monlapinci.com/api/orders/${order._id}" 
                 style="background-color: #1F4627; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                📊 Voir les détails dans l'admin
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
              <p>Cet email a été généré automatiquement par le système Mon Lapin CI</p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Notification admin envoyée à: ${adminEmail, supportEmail}`);
    
  } catch (error) {
    console.error('❌ Erreur envoi notification admin:', error);
    // Ne pas bloquer la commande si l'email échoue
  }
};