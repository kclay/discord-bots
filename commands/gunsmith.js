const {Command} = require('discord-akairo');
const _ = require('lodash');
const Bungie = require('../common/bungie');


const consts = require('../common/constants');

class GunsmithCommand extends Command {

    constructor() {
        super('gunsmith', {

            args: [
                {
                    id: 'platform',
                    type: ['none', 'string']
                },
                {
                    id: 'member',
                    type: ['none', 'member'],
                    /**
                     *
                     * @param {Message} message
                     * @return {GuildMember}
                     */
                    default: message => message.member
                },
                {
                    id: 'slot',
                    type: [...consts.ALL_SLOTS]
                }
            ]
        });

        this.bungie = new Bungie(process.env.BUNGIE_API_KEY)
    }

    _isWeaponSlot(slot) {
        return consts.WEAPON_SLOTS.includes(slot);
    }

    _isGearSlot(slot) {
        return consts.GEAR_SLOTS.includes(slot);
    }

    async exec(message, args) {
        const network = await this.resolveNetwork(args.member, args.platform);
        if (!network) {
            return false;
        }

        let player = await this.resolvePlayer(network, args.member);
        if (this.isError(player)) {
            return false;
        }
        const character = await this.getEquippedCharacter(player);
        if (this.isError(character)) {
            return false;
        }
        const items = await this.getCharacterEquipment(character);
        if (this.isError(items)) {
            return false;
        }
        const bucketHash = this.bungie.getBucketHashFromSlot(args.slot);
        if (!bucketHash) {
            return false;
        }
        const item = await this.getItemByBucketHash(items, bucketHash);
        if (this.isError(item)) {
            return false;
        }

        const details = await this.resolveItemDetails(character, item);

    }

    /**
     *
     * @param network
     * @param member
     * @param name
     * @return {Promise<UserInfoCard>}
     */
    async resolvePlayer(network, member, name) {

        let profileName = this.resolveName(name || member.user.name);

        let player = await this.getBungiePlayerProfile(network, profileName);
        if (!this.isError(player)) {
            return player;
        }

        if (member.nickname) {
            const networkFromNickname = this.parseNetwork(member.nickname) || network;
            player = await this.getBungiePlayerProfile(network, networkFromNickname);
        }
        return player;

    }

    async try(fn) {
        try {
            return await fn()
        } catch (e) {
            return e;
        }
    }

    isError(e) {
        return e instanceof Error;
    }

    /**
     *
     * @param {GuildMember|string} entity
     * @return {undefined}
     */
    resolveName(entity) {
        if (_.isString(entity)) {

        }
        return undefined;
    }

    parseName(name) {
        return (name.split('[')[0] || '').replace(']', '').trim();
    }

    /**
     *
     * @param {GuildMember} member
     * @param {?string} platform
     */
    resolveNetwork(member, platform) {
        let network;
        if (platform) {
            network = this._resolveNetworkType(platform);
        } else {
            network = this.parseNetwork(member.nickname);
        }
        return network;
    }

    parseNetwork(name) {
        let parts = name.split('[');
        if (parts.length > 1) {
            let network = parts[1].replace(']', '').trim();
            network = network.toLowerCase().trim();
            return this._resolveNetworkType(network);
        }
        return null;

    }

    _resolveNetworkType(network) {
        network = network.toLowerCase();
        if (consts.XBOX_TYPES.includes(network)) return consts.NETWORK_TYPES.XBOX;
        if (consts.PSN_TYPES.includes(network)) return consts.NETWORK_TYPES.PSN;
        return null;
    }

    resolveBungieProfile(name, networkType) {
        if (networkType) {
            return this.getBungiePlayerProfile(networkType, name);
        }
        return Promise.all([
            this.getBungiePlayerProfile(1, name),
            this.getBungiePlayerProfile(2, name)
        ])
    }

    /**
     *
     * @param name
     * @param membershipType
     * @return {Promise<UserInfoCard>}
     */
    getBungiePlayerProfile(name, membershipType) {
        if (membershipType === consts.NETWORK_TYPES.XBOX) {
            name = name.split('_').join(' ');
        }
        return this.try(() => {
            return this.bungie.playerSearch(membershipType, name)
        });
    }


    /**
     *
     * @param {UserInfoCard} profile
     * @return {Promise<DestinyCharacterComponent>}
     */
    async getEquippedCharacter(profile) {
        return this.try(() => {
            return this.bungie.getEquippedCharacter(profile.membershipType, profile.membershipId);
        })
    }

    /**
     *
     * @param {DestinyItemComponent[]} items
     * @param bucketHash
     * @return {DestinyItemComponent}
     */
    getItemByBucketHash(items, bucketHash) {
        return _.find(items, (item) => item.bucketHash === bucketHash);
    }

    /**
     *
     * @param {DestinyCharacterResponse} character
     * @param {DestinyItemComponent} item
     * @return {Promise<*>}
     */
    async resolveItemDetails(character, item) {

        return this.bungie.getItemDetails(character, item)

    }
}


module.exports = GunsmithCommand;