// ⚠️ AJOUTEZ CETTE LIGNE AU DÉBUT DU FICHIER
require('dotenv').config();

const mongoose = require('mongoose');
const User = require('./models/User');
const Eleveur = require('./models/Eleveur');

const createEleveurApprouve = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Vérifier que JWT_SECRET est défini
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET non défini dans les variables d\'environnement');
    }

    console.log('🔑 JWT_SECRET chargé:', process.env.JWT_SECRET ? 'OUI' : 'NON');

    // Données de l'éleveur
    const eleveurData = {
      email: 'eleveur.bouafle@test.com',
      password: '123456',
      firstName: 'Jean',
      lastName: 'Akichi',
      phone: '+2250703333333',
      farmName: 'Ferme des Lapins Heureux',
      city: 'Abidjan'
    };

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email: eleveurData.email });
    if (existingUser) {
      console.log('⚠️  Utilisateur existe déjà, suppression...');
      await User.deleteOne({ email: eleveurData.email });
      await Eleveur.deleteOne({ userId: existingUser._id });
    }

    // Créer l'utilisateur
    const user = new User({
      email: eleveurData.email,
      passwordHash: eleveurData.password,
      role: 'eleveur',
      profile: {
        firstName: eleveurData.firstName,
        lastName: eleveurData.lastName,
        phone: eleveurData.phone
      }
    });

    await user.save();
    console.log('✅ Utilisateur créé:', user._id);

    // Créer l'éleveur APPROUVÉ
    const eleveur = new Eleveur({
      userId: user._id,
      farmName: eleveurData.farmName,
      farmAddress: {
        addressLine1: `Ferme de ${eleveurData.firstName} ${eleveurData.lastName}`,
        city: eleveurData.city,
        coordinates: {
          type: 'Point',
          coordinates: [-4.008, 5.320] // Abidjan
        }
      },
      isApproved: true,
      description: `Éleveur professionnel ${eleveurData.firstName} ${eleveurData.lastName}`
    });

    await eleveur.save();
    console.log('✅ Éleveur créé et approuvé:', eleveur._id);

    // Générer un token
    const { generateToken } = require('./utils/token');
    const token = generateToken(user._id);
    
    // Stocker le token
    await user.addToken(token);

    console.log('\n🎉 ÉLEVEUR CRÉÉ AVEC SUCCÈS!');
    console.log('📧 Email:', eleveurData.email);
    console.log('🔑 Token:', token);
    console.log('🏪 Ferme:', eleveurData.farmName);
    console.log('🏙️  Ville:', eleveurData.city);
    console.log('✅ Statut: Approuvé');

    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
};

createEleveurApprouve();