const {GunsmithError} = require('./common');
const request = require('request-promise');
const consts = require('./constants');
const destiny = require('bungie-api-ts/destiny2');
const {DestinyComponentType} = consts;
const {stringify} = require('querystring');
const httpAdapter = require('../common/bungieHttpAdapter');


class Bungie {

    /**
     *
     * @param {Manifest} manifest
     */
    constructor(manifest) {
        this.manifest = manifest;
    }


    /**
     *
     * @param {DestinyCharacterResponse} character
     * @param {DestinyItemComponent} item
     * @return {{name: *, description: *, itemTypeName: *, color: number, iconLink: string, itemLink: string, talentGrid: DestinyItemTalentGridComponent, damageType: *, stats}}
     */
    getItemDetails(character, item) {
        const itemComponents = character.itemComponents;
        const instance = itemComponents.instances.data[item.itemInstanceId];
        const perksDescriptor = itemComponents.perks.data[item.itemInstanceId];
        const statsDescriptors = itemComponents.stats.data[item.itemInstanceId];
        const socketDescriptors = itemComponents.sockets.data[item.itemInstanceId];
        const talentGrid = itemComponents.talentGrids.data[item.itemInstanceId];


        const itemDef = this.manifest.inventoryItem(item.itemHash);

        const stats = {};
        for (let descriptor of Object.values(statsDescriptors)) {
            const statDef = this.manifest.stats(descriptor.statHash);
            stats[statDef.name] = descriptor.value;
        }
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


    validateResponse(response, error) {

    }

    /**
     *
     * @param membershipType
     * @param displayName
     * @return {Promise<UserInfoCard>}
     */
    async playerSearch(membershipType, displayName) {
        const response = await destiny.searchDestinyPlayer(httpAdapter, {
            displayName,
            membershipType
        });
        this.validateResponse(response, new GunsmithError(`Could not find guardian with name: ${displayName}`));
        return response.Response[0];
    }

    /**
     *
     * @param membershipType
     * @param destinyMembershipId
     * @return {Promise<DestinyCharacterComponent[]>}
     */
    async getCharacters(membershipType, destinyMembershipId) {
        const response = await destiny.getProfile(httpAdapter, {
            destinyMembershipId,
            membershipType,
            components: [DestinyComponentType.Characters]

        });
        this.validateResponse(response, new GunsmithError('Something went wrong, no characters found for this user.'));
        return Object.values(response.Response.characters.data);
    }

    /**
     *
     * @param membershipType
     * @param destinyMembershipId
     * @return {Promise<DestinyCharacterComponent>}
     */
    async getEquippedCharacter(membershipType, destinyMembershipId) {
        const characters = await this.getCharacters(membershipType, destinyMembershipId);
        return characters[0];
    }

    /**
     *
     * @param {DestinyCharacterComponent} character
     * @return {Promise<DestinyItemComponent[]>}
     */
    async getCharacterEquipment(character) {
        const response = await destiny.getCharacter(httpAdapter, {
            characterId: character.characterId,
            destinyMembershipId: character.membershipId,
            membershipType: character.membershipType,
            components: [DestinyComponentType.CharacterEquipment,
                DestinyComponentType.ItemInstances,
                DestinyComponentType.ItemPerks,
                DestinyComponentType.ItemSockets,
                DestinyComponentType.ItemTalentGrids,
                DestinyComponentType.ItemStats]
        });
        this.validateResponse(response);
        return response.Response.equipment.data.items;

    }


    getBucketHashFromSlot(slot) {
        switch (slot) {
            case 'primary':
                return consts.TYPE_TO_BUCKET['Kinetic'];
            case 'special':
            case 'secondary':
                return consts.TYPE_TO_BUCKET['Energy'];
            case 'heavy':
                return consts.TYPE_TO_BUCKET['Power'];
            case 'ghost':
                return consts.TYPE_TO_BUCKET['Ghost'];

            case 'head':
            case 'helmet':
                return consts.TYPE_TO_BUCKET['Helmet'];

            case 'chest':
                return consts.TYPE_TO_BUCKET['Chest'];
            case 'arm':
            case 'arms':
            case 'gloves':
            case 'gauntlets':
                return consts.TYPE_TO_BUCKET['Gauntlets'];
            case 'leg':
            case 'legs':
            case 'boots':
            case 'greaves':
                return consts.TYPE_TO_BUCKET['Leg'];
            case 'class':
            case 'mark':
            case 'bond':
            case 'cape':
            case 'cloak':
                return consts.TYPE_TO_BUCKET['ClassItem'];

        }
    }

}

module.exports = Bungie;