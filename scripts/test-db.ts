// Script de test pour vérifier la configuration Cosmos DB / MongoDB
import * as dotenv from 'dotenv'
import * as path from 'path'

// Charger les variables d'environnement depuis .env
dotenv.config({ path: path.resolve(__dirname, '../.env') })

import { connectDatabase, disconnectDatabase } from '../lib/database'
import User from '../models/User.model'
import Animation from '../models/Animation.model'
import Generation from '../models/Generation.model'
import Session from '../models/Session.model'

async function testDatabase() {
  console.log('=== Test de configuration MongoDB ===\n')

  try {
    // 1. Connexion
    console.log('1. Test connexion database...')
    await connectDatabase()
    console.log('   ✅ Connexion réussie\n')

    // 2. Créer les collections et appliquer les index
    console.log('2. Création des collections et application des index...')

    // User
    await User.createCollection()
    await User.createIndexes()
    console.log('   ✅ Collection "users" créée avec index')

    // Animation
    await Animation.createCollection()
    await Animation.createIndexes()
    console.log('   ✅ Collection "animations" créée avec index')

    // Generation
    await Generation.createCollection()
    await Generation.createIndexes()
    console.log('   ✅ Collection "generations" créée avec index')

    // Session
    await Session.createCollection()
    await Session.createIndexes()
    console.log('   ✅ Collection "sessions" créée avec index\n')

    // 3. Vérifier les index appliqués
    console.log('3. Vérification des index...')

    const userIndexes = await User.collection.getIndexes()
    console.log('   Users indexes:', Object.keys(userIndexes))

    const animationIndexes = await Animation.collection.getIndexes()
    console.log('   Animations indexes:', Object.keys(animationIndexes))

    const generationIndexes = await Generation.collection.getIndexes()
    console.log('   Generations indexes:', Object.keys(generationIndexes))

    const sessionIndexes = await Session.collection.getIndexes()
    console.log('   Sessions indexes:', Object.keys(sessionIndexes))
    console.log()

    // 4. Test insertion données
    console.log('4. Test insertion de données de test...')

    // User de test
    const testUser = await User.create({
      email: 'test@example.com',
      passwordHash: 'hashed_password_123',
      role: 'admin'
    })
    console.log('   ✅ User créé:', testUser._id)

    // Animation de test
    const testAnimation = await Animation.create({
      userId: testUser._id,
      name: 'Animation Test',
      slug: 'animation-test',
      description: 'Animation de test',
      status: 'draft',
      pipeline: []
    })
    console.log('   ✅ Animation créée:', testAnimation._id)

    // Generation de test
    const testGeneration = await Generation.create({
      animationId: testAnimation._id,
      participantData: { name: 'Test User' },
      status: 'pending'
    })
    console.log('   ✅ Generation créée:', testGeneration._id)

    // Session de test
    const testSession = await Session.create({
      userId: testUser._id,
      refreshToken: 'test_token_123',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // +24h
    })
    console.log('   ✅ Session créée:', testSession._id)
    console.log()

    // 5. Vérifier que les données existent
    console.log('5. Vérification lecture des données...')
    const userCount = await User.countDocuments()
    const animationCount = await Animation.countDocuments()
    const generationCount = await Generation.countDocuments()
    const sessionCount = await Session.countDocuments()

    console.log(`   Users: ${userCount}`)
    console.log(`   Animations: ${animationCount}`)
    console.log(`   Generations: ${generationCount}`)
    console.log(`   Sessions: ${sessionCount}`)
    console.log()

    console.log('✅ Tous les tests ont réussi !')
    console.log('\n=== Résumé ===')
    console.log('✅ Connexion database : OK')
    console.log('✅ Collections créées : 4/4')
    console.log('✅ Index appliqués : OK')
    console.log('✅ Insert/Read : OK')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
    process.exit(1)
  } finally {
    await disconnectDatabase()
    console.log('\n✅ Déconnexion database')
    process.exit(0)
  }
}

// Exécuter le test
testDatabase()
