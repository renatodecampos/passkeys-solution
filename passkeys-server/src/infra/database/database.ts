import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import { WebAuthnCredential } from '@simplewebauthn/server';
import { UserModel } from '../../types';
import {
  AuthAttemptModel,
  KeystoreBindingModel,
} from '../../types/auth-audit';
import { logger } from '../logger';
import {
  collectionName,
  mongodbUri,
  dbName,
  authAttemptsCollectionName,
  keystoreBindingCollectionName,
} from '../../setup';


let client: MongoClient;
let db: Db;

export const connectMongoDB = async (): Promise<void> => {
    try {
        client = new MongoClient(mongodbUri);
        await client.connect();
        db = client.db(dbName);
        await ensureAuditIndexes();
        logger.info('Connected to MongoDB');
    } catch (error) {
        logger.error('MongoDB connection error:', error);
        throw error;
    }
};

export const disconnectMongoDB = async (): Promise<void> => {
    try {
        await client.close();
        logger.info('Disconnected from MongoDB');
    } catch (error) {
        logger.error('MongoDB disconnection error:', error);
        throw error;
    }
};

const getCollection = (): Collection<UserModel> => {
    return db.collection<UserModel>(collectionName);
};

const getAuthAttemptsCollection = (): Collection<AuthAttemptModel & { _id?: ObjectId }> => {
    return db.collection<AuthAttemptModel>(authAttemptsCollectionName);
};

const getKeystoreBindingCollection = (): Collection<KeystoreBindingModel & { _id?: ObjectId }> => {
    return db.collection<KeystoreBindingModel>(keystoreBindingCollectionName);
};

async function ensureAuditIndexes(): Promise<void> {
    try {
        await getAuthAttemptsCollection().createIndex({ userId: 1, createdAt: -1 });
        // Drop old unique index (Phase 3 migration) — allows multiple bindings per user (revokedAt history)
        try {
            await getKeystoreBindingCollection().dropIndex('userId_1');
        } catch (_) { /* index may not exist yet */ }
        await getKeystoreBindingCollection().createIndex({ userId: 1 });
    } catch (e) {
        logger.error('Failed to ensure auth audit indexes:', e);
        throw e;
    }
}

export const getUser = async (username: string): Promise<UserModel | null> => {
    try {
        const collection = getCollection();
        return await collection.findOne({ username: username });
    } catch (error) {
        logger.error('Error getting user:', error);
        throw error;
    }
};

export const createUser = async (user: UserModel): Promise<void> => {
    try {
        const collection = getCollection();
        await collection.insertOne(user);
    } catch (error) {
        logger.error('Error creating user:', error);
        throw error;
    }
};

export const updateUser = async (userId: string, user: Partial<UserModel>): Promise<void> => {
    try {
        const collection = getCollection();
        await collection.updateOne(
            { id: userId },
            { $set: user }
        );
    } catch (error) {
        logger.error('Error updating user:', error);
        throw error;
    }
};

export const addCredential = async (userId: string, credential: WebAuthnCredential): Promise<void> => {
    try {
        const collection = getCollection();
        await collection.updateOne(
            { id: userId },
            { $push: { credentials: credential } }
        );
    } catch (error) {
        logger.error('Error adding credential:', error);
        throw error;
    }
};

export const insertAuthAttempt = async (doc: AuthAttemptModel): Promise<ObjectId> => {
    const collection = getAuthAttemptsCollection();
    const r = await collection.insertOne(doc);
    if (!r.insertedId) {
        throw new Error('insertAuthAttempt: missing insertedId');
    }
    return r.insertedId;
};

export const getKeystoreBindingByUserId = async (
    userId: string,
): Promise<KeystoreBindingModel | null> => {
    try {
        const collection = getKeystoreBindingCollection();
        return await collection.findOne({ userId, revokedAt: { $exists: false } });
    } catch (error) {
        logger.error('Error getting keystore binding:', error);
        throw error;
    }
};

export const revokeKeystoreBinding = async (userId: string): Promise<void> => {
    try {
        const collection = getKeystoreBindingCollection();
        await collection.updateMany(
            { userId, revokedAt: { $exists: false } },
            { $set: { revokedAt: new Date() } },
        );
    } catch (error) {
        logger.error('Error revoking keystore binding:', error);
        throw error;
    }
};

export const insertKeystoreBinding = async (doc: KeystoreBindingModel): Promise<void> => {
    try {
        const collection = getKeystoreBindingCollection();
        await collection.insertOne(doc);
    } catch (error) {
        logger.error('Error inserting keystore binding:', error);
        throw error;
    }
};
