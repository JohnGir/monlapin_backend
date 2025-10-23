const mongoose = require('mongoose');
const User = require('./models/User');

const testToken = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/lapin_business');
    console.log('✅ Connecté à MongoDB');

    // Créer un user de test
    const testUser = new User({
      email: 'test-token@example.com',
      passwordHash: '123456',
      role: 'client',
      profile: {
        firstName: 'Test',
        lastName: 'Token',
        phone: '+2250700000888'
      }
    });

    await testUser.save();
    console.log('✅ User créé:', testUser._id);

    // Générer un token factice pour le test
    const fakeToken = 'fake-jwt-token-for-test-' + Date.now();

    // Tenter d'ajouter le token
    await testUser.addToken(fakeToken);
    console.log('✅ Token ajouté');

    // Vérifier le résultat
    const updatedUser = await User.findById(testUser._id);
    console.log('✅ User avec tokens:', JSON.stringify(updatedUser.tokens, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

testToken();