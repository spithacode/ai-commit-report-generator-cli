import { JsonStore } from "./json-local-cache";

export class JsonStoreFactory {
    private instances: Record<string, JsonStore> = {}

    constructor() {

    }

    async createOrGetStore(uniqueName: string) {
        if (this.instances[uniqueName]) {
            console.error(`Store already exists for this path ${uniqueName}`)
            return this.instances[uniqueName]
        }
        const cacheStore = new JsonStore({
            path: `./${uniqueName}cache.json`
        })
        await cacheStore.initCache()

        this.instances[uniqueName] = cacheStore

        return this.instances[uniqueName]
    }
    async getStore(repoPath: string) {
        return this.instances[repoPath]
    }
}