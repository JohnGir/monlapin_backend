require('dotenv').config();
const mongoose = require('mongoose');

const migrateToAtlas = async () => {
  try {
    // Connexion à MongoDB Local
    const localConnection = await mongoose.createConnection('mongodb://localhost:27017/lapin_business');
    console.log('✅ Connecté à MongoDB Local');

    // Connexion à MongoDB Atlas
    const atlasConnection = await mongoose.createConnection(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB Atlas');

    // Collections à migrer
    const collections = ['users', 'clients', 'eleveurs', 'lapins', 'commandes', 'notifications', 'settings'];

    for (const collectionName of collections) {
      console.log(`\n🔄 Migration de ${collectionName}...`);
      
      const localCollection = localConnection.collection(collectionName);
      const atlasCollection = atlasConnection.collection(collectionName);
      
      const documents = await localCollection.find({}).toArray();
      
      if (documents.length > 0) {
        await atlasCollection.insertMany(documents);
        console.log(`✅ ${documents.length} documents migrés`);
      } else {
        console.log(`ℹ️  Aucun document dans ${collectionName}`);
      }
    }

    console.log('\n🎉 MIGRATION TERMINÉE AVEC SUCCÈS!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur migration:', error);
    process.exit(1);
  }
};

migrateToAtlas();