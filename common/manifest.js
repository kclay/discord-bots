const sqlite = require('sqlite');
const NodeCache = require("node-cache");
const _ = require('lodash')

/**
 * @typedef {object} DisplayProperties
 * @property string description
 * @property string name
 * @property string icon
 */

class Definition {


    /**
     *
     * @param {Manifest} manifest
     * @param {string} name
     * @param {boolean=} loadAll
     */
    constructor(manifest, name, loadAll) {

        this.manifest = manifest;
        this.name = name;
        this.table = `Destiny${name}Definition`;
        this.cache = {};
        this.loadAll = loadAll;

    }

    async get(id, compact) {
        if (this.loadAll && !this.cache.length) {
            this.cache = await this.manifest.getAllRecords(this.table);
        }
        let record = this.cache[id];
        if (!record) {
            record = this.cache[id] = await this.manifest.getRecord(this.table, id);
        }
        if (compact && record) {
            return record.displayProperties;
        }
        return record;

    }
}

class Manifest {

    constructor(path) {

        this.defs = {
            DamageType: new Definition(this, 'DamageType'),
            InventoryItem: new Definition(this, 'InventoryItem'),
            Stats: new Definition(this, 'Stat'),
            Perks: new Definition(this, 'SandboxPerk', true)

        };
        sqlite.open(path).then(db => {
            /**
             *
             * @type {Database}
             */
            this.db = db;
        })
        this.makeStatement = _.memoize(async (table) => {
            return await this.db.prepare(`select json from ${table} where id = ?`);
        });
    }


    /**
     *
     * @param id
     * @return {Promise<*>}
     */
    plugs(id) {
        return this.defs.InventoryItem.get(id);
    }

    /**
     *
     * @param  id
     * @return {Promise<DisplayProperties>}
     */
    damageType(id) {
        return this.defs.DamageType.get(id, true);
    }

    /**
     *
     * @param id
     * @return {Promise<*>}
     */
    inventoryItem(id) {
        return this.defs.InventoryItem.get(id);
    }

    /**
     *
     * @param id
     * @return {Promise<DisplayProperties>}
     */
    stats(id) {
        return this.defs.Stats.get(id, true);
    }

    /**
     *
     * @param id
     * @return {Promise<DisplayProperties>}
     */
    perks(id) {
        return this.defs.Perks.get(id, true);
    }


    async getRecord(table, id) {
        const statement = await this.makeStatement(table);
        // The ID in sqlite is a signed 32-bit int, while the id we
        // use is unsigned, so we must convert
        const sqlId = new Int32Array([id])[0];
        const result = await  statement.get([sqlId]);
        statement.reset();
        if (result && result.json) {
            return JSON.parse(result.json);
        }
        return null;
    }

    async getAllRecords(table) {
        const result = {};
        result.length = await this.db.each(`SELECT json FROM ${table}`, (err, row) => {
            if (err) return;
            const obj = JSON.parse(row.json);
            result[obj.hash] = obj;
        });
        return result;
    }
}

module.exports = Manifest;