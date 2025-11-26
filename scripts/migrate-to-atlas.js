require('dotenv').config();
const { MongoClient } = require('mongodb');

const migrateToAtlas = async () => {
  let localClient, atlasClient;
  
  try {
    // URLs de connexion
    const localUri = 'mongodb://localhost:27017';
    const atlasUri = process.env.MONGODB_URI;

    console.log('🔄 Début de la migration...');

    // Connexions
    localClient = new MongoClient(localUri);
    atlasClient = new MongoClient(atlasUri);

    await localClient.connect();
    console.log('✅ Connecté à MongoDB Local');

    await atlasClient.connect();
    console.log('✅ Connecté à MongoDB Atlas');

    const localDb = localClient.db('lapin_business');
    const atlasDb = atlasClient.db();

    // Collections à migrer
    const collections = ['users', 'clients', 'eleveurs', 'lapins', 'commandes', 'notifications', 'settings'];

    for (const collectionName of collections) {
      console.log(`\n📦 Migration de ${collectionName}...`);
      
      const documents = await localDb.collection(collectionName).find({}).toArray();
      
      if (documents.length > 0) {
        // Vider la collection existante dans Atlas (optionnel)
        await atlasDb.collection(collectionName).deleteMany({});
        
        // Insérer les documents
        await atlasDb.collection(collectionName).insertMany(documents);
        console.log(`✅ ${documents.length} documents migrés`);
        
        // Aperçu des données
        console.log(`   Aperçu: ${documents.slice(0, 2).map(d => JSON.stringify(d)).join(', ')}...`);
      } else {
        console.log(`ℹ️  Aucun document dans ${collectionName}`);
      }
    }

    console.log('\n🎉 MIGRATION TERMINÉE AVEC SUCCÈS!');
    console.log('🌐 Vos données sont maintenant sur MongoDB Atlas');

  } catch (error) {
    console.error('❌ Erreur migration:', error);
  } finally {
    if (localClient) await localClient.close();
    if (atlasClient) await atlasClient.close();
    process.exit(0);
  }
};

migrateToAtlas();