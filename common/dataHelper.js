const consts = require('./constants');

class DataHelper {

    /**
     * {Manifest} manifest
     */
    constructor(manifest) {

        this.manifest = manifest;
    }

    /**
     *
     * @param {DestinyCharacterResponse} character
     * @param {DestinyItemComponent} item
     * @return {PromiseLike<T> | Promise<T>}
     */
    getItemDetails(character, item) {
        const itemComponents = character.itemComponents;
        const instance = itemComponents.instances.data[item.itemInstanceId];
        const perksDescriptor = itemComponents.perks.data[item.itemInstanceId];
        const statsDescriptors = itemComponents.stats.data[item.itemInstanceId];
        const socketDescriptors = itemComponents.sockets.data[item.itemInstanceId];
        const talentGrid = itemComponents.talentGrids.data[item.itemInstanceId];


        const itemDef = this.manifest.inventoryItem(item.itemHash);


        let stats = this.getStats(statsDescriptors);
        if (itemDef.stats && itemDef.stats.stats) {
            stats = {...stats, ...this.getHiddenStats(itemDef.stats.stats)}
        }

        // TODO : check default status
        //https://github.com/DestinyItemManager/DIM/blob/69c11be8f13201dcea421e19393246e2f0d8e59b/src/app/inventory/store/d2-item-factory.service.ts#L443
        const perks = {};

        for (let descriptor of perksDescriptor.perks) {
            if (!descriptor.visible || !descriptor.isActive) continue;
            const perkDef = this.manifest.perks(descriptor.perkHash);
            perks[perkDef.name] = perkDef.name;
        }

        const sockets = [];

        for (let descriptor of socketDescriptors.sockets) {
            let plugDef = this.manifest.plugs(descriptor.plugHash);
            if (!plugDef) continue;
            if (plugDef.plug.plugCategoryIdentifier === 'shader') continue;
            const plugs = [];
            for (let plugHash of descriptor.reusablePlugHashes) {
                plugDef = this.manifest.plugs(plugHash);
                let masterwork = false;
                if (plugDef.plug.plugCategoryIdentifier.includes('masterworks.')) {
                    masterwork = {
                        name: plugDef.plug.plugCategoryIdentifier.split('.').pop(),
                        tier: plugDef.displayProperties.name
                    }
                }

                const plug = {
                    perks: (plugDef.perks || perksDescriptor.perks).filter(perk => !!perk.iconPath).map(perk => perk.perkHash)
                        .map(perkHash => this.manifest.perks(perkHash)),
                    active: plugDef.hash === descriptor.plugHash,
                    name: plugDef.displayProperties.name,
                    masterwork
                };
                plugs.push(plug);
            }
            sockets.push(plugs);

        }

        const damageTypeDef = this.manifest.damageType(instance.damageTypeHash);
        const damageName = instance
            ? [null, 'kinetic', 'arc', 'solar', 'void', 'raid'][instance.damageType || 0]
            : null;
        let prefix = 'https://www.bungie.net';
        let iconSuffix = itemDef.icon;
        let itemSuffix = `/en/Armory/Detail?item=${hash}`;

        return {
            name: itemDef.name,
            description: itemDef.description,
            itemTypeName: consts.BUCKET_TO_TYPE[item.bucketHash],
            color: parseInt(consts.DAMAGE_COLOR[damageTypeDef.name], 16),
            iconLink: prefix + iconSuffix,
            itemLink: prefix + itemSuffix,
            talentGrid,
            damageName,
            stats,
            sockets
        }

    }

    /**
     * @param {DestinyItemStatsComponent} descriptors
     * * @return {{[name]:number}}
     */
    getStats(descriptors) {
        const stats = {};
        for (let descriptor of Object.values(descriptors)) {
            const statDef = this.manifest.stats(descriptor.statHash);
            stats[statDef.name] = descriptor.value;
        }
        return stats;
    }

    /**
     *
     * @param descriptors
     * @return {{[name]:number}}
     */
    getHiddenStats(descriptors) {
        const stats = {};
        for (let descriptor of Object.values(descriptors)) {
            // only aim assist and zoom for now
            if (![1345609583, 3555269338, 2715839340].includes(descriptor.statHash) || !descriptor.value) {
                return undefined;
            }
            const statDef = this.manifest.stats(descriptor.statHash);
            stats[statDef.name] = descriptor.value;
        }
        return stats;
    }
}

module.exports = DataHelper;
