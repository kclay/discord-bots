const {Command} = require('discord-akairo');
const _ = require('lodash');
const Bungie = require('../common/bungie');
const Manifest = require('../common/manifest');


const consts = require('../common/constants');

class GunsmithCommand extends Command {

    constructor() {
        super('gunsmith', {
            aliases: ['gunsmith'],
            args: [

                {
                    id: 'handle',
                    type: function (word, message, prevArgs) {
                        if (!word) return null;
                        const id = word.match(/<@!?(\d+)>/);
                        if (!id) return 'word';
                        return message.guild.members.get(id[1]);
                    },
                    match: (message, prevArgs) => {
                        const peak = message.content.split(' ')[1];
                        if (consts.PLATFORM_TYPES.includes(peak)) return 'none';
                        if (consts.ALL_SLOTS.includes(peak)) return 'none';
                        return 'word';
                    },
                    /**
                     *
                     * @param {Message} message
                     * @return {GuildMember}
                     */
                    default: message => message.member
                },
                {
                    id: 'platform',
                    type: [...consts.PLATFORM_TYPES]
                },
                {
                    id: 'slot',
                    type: [...consts.ALL_SLOTS]
                }
            ]
        });

        this.bungie = new Bungie(new Manifest(process.env.DB))
    }

    _isWeaponSlot(slot) {
        return consts.WEAPON_SLOTS.includes(slot);
    }

    _isGearSlot(slot) {
        return consts.GEAR_SLOTS.includes(slot);
    }

    async exec(message, args) {
        const network = await this.resolveNetwork(args.handle, args.platform);

        let player = await this.resolvePlayer(network, args.handle);
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
     * @param handleOrMember
     * @return {Promise<UserInfoCard>}
     */
    async resolvePlayer(network, handleOrMember) {

        const isMember = !_.isString(handleOrMember);
        const member = isMember ? handleOrMember : null;
        const handle = !isMember ? handleOrMember : null;
        let profileName = this.parseName(handle || member.user.username);
        let player;
        if (member && member.nickname) {
            const network = this.parseNetwork(member.nickname) || network;
            profileName = this.parseName(member.nickname);
            player = await this.getBungiePlayerProfile(network, profileName);
        }
        if (player && !this.isError(player)) {
            return player;
        }
        player = await this.getBungiePlayerProfile(network, profileName);
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
        return e && e instanceof Error;
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
     * @param {GuildMember|string} member
     * @param {?string} platform
     */
    resolveNetwork(member, platform) {
        let network;
        if (platform) {
            network = this._resolveNetworkType(platform);
        } else {
            if (_.isString(member)) {
                network = this.parseNetwork(member)
            } else {
                network = this.parseNetwork(member.nickname)
            }

        }
        return network;
    }

    parseNetwork(name) {
        let parts = (name || '').split('[');
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
        ]).then((results) => {
            return results.filter(card => !!card)[0];
        })
    }

    /**
     *
     * @param name
     * @param membershipType
     * @return {Promise<UserInfoCard>}
     */
    getBungiePlayerProfile(membershipType, name) {
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