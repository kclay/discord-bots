const {GunsmithError} = require('./common');
const request = require('request-promise');
const consts = require('./constants');
const destiny = require('bungie-api-ts/destiny2');
const {DestinyComponentType} = require('bungie-api-ts/destiny2');
const {stringify} = require('querystring');
const httpAdapter = require('../common/bungieHttpAdapter');


class Bungie {

    constructor(apiKey) {
        this.apiKey = apiKey;
    }


    /**
     *
     * @param {DestinyCharacterResponse} character
     * @param {DestinyItemComponent} item
     * @return {PromiseLike<T> | Promise<T>}
     */
    getItemDetails(character, item) {
        const itemComponents = character.itemComponents;
        const instances = itemComponents.instances.data;
        const perks = itemComponents.perks.data;
        const renderData = itemComponents.renderData.data;
        const stats = itemComponents.stats.data;

        const instance = instances[item.itemInstanceId];

        const damageTypeName = consts.BUCKET_TO_TYPE[instance.damageTypeHash];
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
        this.validateResponse(response, new GunsmithError(`Could not find guardian with name: ${displayName} on ${networkName}.`));
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
            components: [DestinyComponentType.CharacterEquipment, DestinyComponentType.ItemInstances,
                DestinyComponentType.ItemPerks, DestinyComponentType.ItemRenderData,
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