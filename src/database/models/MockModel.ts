import mongoose from 'mongoose';

export function createMockModel(modelName: string, schema: mongoose.Schema) {
    // Se estivermos conectados ao MongoDB Atlas, retorna o model real do Mongoose
    try {
        if (mongoose.connection && mongoose.connection.readyState === 1) {
            return mongoose.models[modelName] || mongoose.model(modelName, schema);
        }
    } catch (e) {
        // Se falhar, usa o mock em memória
    }

    // Armazenamento em memória (fallback)
    const memoryDb = new Map<string, any>();
    const OriginalModel = mongoose.modelNames().includes(modelName) ? mongoose.model(modelName) : mongoose.model(modelName, schema);
    
    const getQueryKey = (query: any) => {
        if (!query) return 'global';
        if (query.userId) return `user-${query.userId}`;
        if (query.guildId) return `guild-${query.guildId}`;
        if (query._id) return `id-${query._id}`;
        return `query-${JSON.stringify(query)}`;
    };

    const createInstance = (data: any) => {
        if (!data) return null;
        return {
            ...data,
            save: function() { 
                const key = getQueryKey({ userId: this.userId, guildId: this.guildId, _id: this._id });
                memoryDb.set(key, { ...this });
                return Promise.resolve(this); 
            },
            toObject: () => data,
            toJSON: () => data,
        };
    };

    const mockMethods: any = {
        findOne: (query: any) => {
            const key = getQueryKey(query);
            let data = memoryDb.get(key);
            if (!data) {
                data = { ...query, coins: 1000000, bank: 0, level: 1, xp: 0, vipLevel: 5 };
                memoryDb.set(key, data);
            }
            return {
                exec: () => Promise.resolve(createInstance(data)),
                then: (cb: any) => Promise.resolve(createInstance(data)).then(cb),
                sort: function() { return this; },
                limit: function() { return this; },
                select: function() { return this; }
            };
        },
        find: (query: any) => {
            const results: any[] = [];
            for (const [k, v] of memoryDb.entries()) {
                results.push(createInstance(v));
            }
            return {
                exec: () => Promise.resolve(results),
                then: (cb: any) => Promise.resolve(results).then(cb),
                sort: function() { return this; },
                limit: function() { return this; }
            };
        },
        findOneAndUpdate: (query: any, update: any, options: any = {}) => {
            const key = getQueryKey(query);
            let existing = memoryDb.get(key);
            if (!existing) {
                existing = { ...query, coins: 1000000, bank: 0, level: 1, xp: 0, vipLevel: 5 };
            }
            if (update.$inc) {
                for (const k in update.$inc) existing[k] = (existing[k] || 0) + update.$inc[k];
            }
            if (update.$set) {
                for (const k in update.$set) existing[k] = update.$set[k];
            }
            memoryDb.set(key, existing);
            const resultData = options.new ? existing : existing;
            return {
                exec: () => Promise.resolve(createInstance(resultData)),
                then: (cb: any) => Promise.resolve(createInstance(resultData)).then(cb)
            };
        },
        create: (data: any) => {
            const key = getQueryKey(data);
            memoryDb.set(key, data);
            return Promise.resolve(createInstance(data));
        },
        countDocuments: () => Promise.resolve(memoryDb.size),
        updateOne: (query: any, update: any) => {
            const key = getQueryKey(query);
            let existing = memoryDb.get(key) || { ...query };
            if (update.$inc) {
                for (const k in update.$inc) existing[k] = (existing[k] || 0) + update.$inc[k];
            }
            if (update.$set) {
                for (const k in update.$set) existing[k] = update.$set[k];
            }
            memoryDb.set(key, existing);
            return Promise.resolve({ nModified: 1 });
        },
        deleteOne: (query: any) => {
            const key = getQueryKey(query);
            memoryDb.delete(key);
            return Promise.resolve({ deletedCount: 1 });
        }
    };

    const handler = {
        get(target: any, prop: string) {
            // Se estiver conectado ao Atlas, retorna o model real do Mongoose
            if (mongoose.connection && mongoose.connection.readyState === 1) {
                return (OriginalModel as any)[prop];
            }
            if (mockMethods[prop]) {
                return mockMethods[prop];
            }
            const original = target[prop];
            return typeof original === 'function' ? original.bind(target) : original;
        }
    };
    
    return new Proxy(OriginalModel, handler) as any;
}
