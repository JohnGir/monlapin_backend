require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const adminData = {
      email: 'admin@lapin.ci',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'Système',
      phone: '+2250700000000'
    };

    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('⚠️  Admin existe déjà');
      return;
    }

    // Créer l'admin
    const admin = new User({
      email: adminData.email,
      passwordHash: adminData.password,
      role: 'admin',
      profile: {
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        phone: adminData.phone
      }
    });

    await admin.save();

    // Générer le token
    const { generateToken } = require('./utils/token');
    const token = generateToken(admin._id);
    await admin.addToken(token);

    console.log('\n🎉 ADMIN CRÉÉ AVEC SUCCÈS!');
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Token:', token);
    console.log('🎯 Role: Admin');
    console.log('🔐 Mot de passe: admin123');

    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
};

createAdmin();