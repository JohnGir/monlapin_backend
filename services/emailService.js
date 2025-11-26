const nodemailer = require('nodemailer');

// Configuration (à mettre dans .env)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.sendOrderConfirmationEmail = async (order) => {
  try {
    const mailOptions = {
      from: '"Mon Lapin CI" <contact@monlapinci.com>',
      to: order.customerInfo.email,
      subject: `Confirmation de commande #${order.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1F4627;">Merci pour votre commande !</h2>
          <p>Votre commande <strong>#${order.orderNumber}</strong> a été enregistrée avec succès.</p>
          
          <h3 style="color: #1F4627;">Détails de la commande :</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${order.items.map(item => `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">
                  <strong>${item.name}</strong><br>
                  Quantité: ${item.quantity} x ${item.price} FCFA
                </td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">
                  ${item.quantity * item.price} FCFA
                </td>
              </tr>
            `).join('')}
          </table>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
            <strong>Total: ${order.totalAmount.toLocaleString()} FCFA</strong>
          </div>
          
          <p>Nous vous contacterons dans les plus brefs délais pour la livraison.</p>
          
          <p>Cordialement,<br>L'équipe Mon Lapin CI</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de confirmation envoyé à ${order.customerInfo.email}`);
    
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    throw error;
  }
};