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

    get(id, compact) {
        if (this.loadAll && !this.cache.loaded) {
            this.cache = this.manifest.getAllRecords(this.table);
        }
        let record = this.cache[id];
        if (!record) {
            record = this.cache[id] = this.manifest.getRecord(this.table, id);
        }
        if (compact) {
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
        this.makeStatement = _.memoize((table) => {
            return this.db.prepare(`select json from ${table} where id = ?`);
        });
    }

    /**
     *
     * @param id
     * @return {*}
     */

    plugs(id) {
        return this.defs.InventoryItem.get(id);
    }

    /**
     *
     * @param  id
     * @return {DisplayProperties}
     */
    damageType(id) {
        return this.defs.DamageType.get(id, true);
    }

    /**
     *
     * @param id
     * @return {*}
     */
    inventoryItem(id) {
        return this.defs.InventoryItem.get(id);
    }

    /**
     *
     * @param id
     * @return {DisplayProperties}
     */
    stats(id) {
        return this.defs.Stats.get(id, true);
    }

    /**
     *
     * @param id
     * @return {DisplayProperties}
     */
    perks(id) {
        return this.defs.Perks.get(id, true);
    }


    getRecord(table, id) {
        const statement = this.makeStatement(table);
        // The ID in sqlite is a signed 32-bit int, while the id we
        // use is unsigned, so we must convert
        const sqlId = new Int32Array([id])[0];
        const result = statement.get([sqlId]);
        statement.reset();
        if (result.length) {
            return JSON.parse(result[0]);
        }
        return null;
    }

    getAllRecords(table) {
        const rows = this.db.exec(`SELECT json FROM ${table}`);
        const result = {};
        rows[0].values.forEach((row) => {
            const obj = JSON.parse(row);
            result[obj.hash] = obj;
        });
        return result;
    }
}

module.exports = Manifest;