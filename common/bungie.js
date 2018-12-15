const {GunsmithError} = require('./common');
const request = require('request-promise');
const consts = require('./constants');
const destiny = require('bungie-api-ts/destiny2');
const {DestinyComponentType} = consts;
const {stringify} = require('querystring');
const httpAdapter = require('../common/bungieHttpAdapter');
const _ = require('lodash');


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
    async getItemDetails(character, item) {
        const itemComponents = character.itemComponents;
        const instance = itemComponents.instances.data[item.itemInstanceId];
        const perksDescriptor = itemComponents.perks.data[item.itemInstanceId];
        const statsDescriptors = itemComponents.stats.data[item.itemInstanceId];
        const socketDescriptors = itemComponents.sockets.data[item.itemInstanceId];
        const talentGrid = itemComponents.talentGrids.data[item.itemInstanceId];


        const itemDef = await this.manifest.inventoryItem(item.itemHash);

        const stats = [];
        for (let descriptor of Object.values(statsDescriptors.stats)) {
            const statDef = await this.manifest.stats(descriptor.statHash);
            if (!statDef) continue;
            stats.push({
                name: statDef.name,
                value: descriptor.value
            });
        }
        for (let descriptor of Object.values(itemDef.stats.stats)) {
            const statDef = await this.manifest.stats(descriptor.statHash);
            // only aim assist and zoom for now
            if (![1345609583, 3555269338, 2715839340].includes(descriptor.statHash) || !descriptor.value) {
                continue;
            }
            stats.push({
                name: statDef.name,
                value: descriptor.value
            })
        }
        const perks = [];

        if (perksDescriptor) {
            for (let descriptor of perksDescriptor.perks) {
                if (!descriptor.visible || !descriptor.isActive) continue;
                const perkDef = await this.manifest.perks(descriptor.perkHash);
                if (!perkDef) continue;
                perks.push({
                    name: perkDef.name
                });
            }
        }

        const sockets = [];

        for (let descriptor of socketDescriptors.sockets) {
            let plugDef = await this.manifest.plugs(descriptor.plugHash);
            if (!plugDef) continue;
            const {plugCategoryIdentifier} = plugDef.plug || {};
            if (plugCategoryIdentifier === 'shader') continue;
            const plugs = [];
            const reusablePlugHashes = descriptor.reusablePlugHashes || [descriptor.plugHash];
            let masterwork = false;
            for (let plugHash of reusablePlugHashes) {
                if (masterwork) continue;
                const reusablePlugDef = await this.manifest.plugs(plugHash);

                if(!reusablePlugDef || !reusablePlugDef.plug){
                    console.log(plugHash);
                }
                if (reusablePlugDef.plug.plugCategoryIdentifier.includes('masterworks.')) {
                    let stat = reusablePlugDef.plug.plugCategoryIdentifier.split('.').pop().replace('_', ' ');
                    masterwork = {
                        name: stat.capitalize(),
                        tier: plugDef.displayProperties.name
                    }
                }

                const plug = {
                    perks: await Promise.all((plugDef.perks || perksDescriptor.perks).filter(perk => !!perk.iconPath).map(perk => perk.perkHash)
                        .map(perkHash => this.manifest.perks(perkHash))),
                    active: reusablePlugDef.hash === descriptor.plugHash,
                    name: reusablePlugDef.displayProperties.name,
                    masterwork
                };
                plugs.push(plug);
            }

            if (!plugs.length) continue;

            sockets.push({
                name: masterwork ? (masterwork.name.includes('Tracker') ? 'Kill Tracker' : 'Masterwork') : plugDef.itemTypeDisplayName,
                plugs
            });


        }

        const damageTypeDef = await this.manifest.damageType(instance.damageTypeHash);
        const damageName = instance
            ? [null, 'kinetic', 'arc', 'solar', 'void', 'raid'][instance.damageType || 0]
            : null;
        let prefix = 'https://www.bungie.net';
        let iconSuffix = itemDef.displayProperties.icon;
        let itemSuffix = `/en/Armory/Detail?item=${item.itemHash}`;

        return {
            name: itemDef.displayProperties.name,
            description: itemDef.displayProperties.description,
            itemTypeName: consts.BUCKET_TO_TYPE[item.bucketHash],
            color: parseInt(consts.DAMAGE_COLOR[damageTypeDef.name], 16),
            iconLink: prefix + iconSuffix,
            itemLink: `https://db.destinytracker.com/d2/en/items/${item.itemHash}`,
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
     * @param classType
     * @return {Promise<DestinyCharacterComponent>}
     */
    async getEquippedCharacter(membershipType, destinyMembershipId, classType) {
        const characters = await this.getCharacters(membershipType, destinyMembershipId);

        if (!classType) return _.sortBy(characters, ['dateLastPlayed']).reverse()[0];
        return characters.find(character => character.classType === classType);

    }

    /**
     *
     * @param {DestinyCharacterComponent} character
     * @return {Promise<DestinyCharacterResponse>}
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
        return response.Response;

    }


    getBucketHashFromSlot(slot) {
        switch (slot) {
            case 'primary':
            case 'kinetic':
                return consts.TYPE_TO_BUCKET['Kinetic'];
            case 'special':
            case 'energy':
            case 'secondary':
                return consts.TYPE_TO_BUCKET['Energy'];
            case 'heavy':
            case 'power':
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