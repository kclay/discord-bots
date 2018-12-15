const {Command} = require('discord-akairo');
const _ = require('lodash');
const Bungie = require('../common/bungie');
const Manifest = require('../common/manifest');


const consts = require('../common/constants');
const Discord = require("discord.js");

class GunsmithCommand extends Command {

    constructor() {
        super('gunsmith', {
            aliases: ['gunsmith', 'gm'],
            args: [
                {
                    id: 'help',
                    match: (message, prevArgs) => {
                        const peak = message.content.split(' ')[1];
                        if (peak !== 'help') return 'none';
                        return 'word';
                    },
                    type: 'help'
                },

                {
                    id: 'handle',
                    type: function (word, message, prevArgs) {
                        if (!word) return null;
                        const id = word.match(/<@!?(\d+)>/);
                        if (!id) return word;
                        return message.guild.members.get(id[1]);
                    },
                    match: (message, prevArgs) => {
                        const peak = message.content.split(' ')[1];
                        if (consts.PLATFORM_TYPES.includes(peak)) return 'none';
                        if (consts.ALL_SLOTS.includes(peak)) return 'none';
                        return 'word';
                    },

                },
                {
                    id: 'platform',
                    type: [...consts.PLATFORM_TYPES],
                    match: (message, prevArgs) => {
                        const peakIndex = !prevArgs.handle ? 1 : 2;
                        const peak = message.content.split(' ')[peakIndex];
                        if (consts.PLATFORM_TYPES.includes(peak)) return 'word';
                        return 'none';
                    }

                },
                {
                    id: 'slot',
                    type: [...consts.ALL_SLOTS]
                },
                {
                    id: 'classType',
                    type: ['hunter', 'warlock', 'titan']
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
        if (args.help) {
            return message.channel.send({embed: this.renderHelp()});
        }
        if (!args.handle) {
            args.handle = message.member;
        }
        const network = await this.resolveNetwork(args.handle, args.platform);

        let player = await this.resolvePlayer(network, args.handle);
        if (this.isError(player)) {
            return false;
        }
        const character = await this.getEquippedCharacter(player, args.classType);
        if (this.isError(character)) {
            return false;
        }
        const characterWithEquipment = await this.getCharacterEquipment(character);
        if (this.isError(characterWithEquipment)) {
            return false;
        }
        const items = characterWithEquipment.equipment.data.items;
        const bucketHash = this.bungie.getBucketHashFromSlot(args.slot);
        if (!bucketHash) {
            return false;
        }
        const item = await this.getItemByBucketHash(items, bucketHash);
        if (this.isError(item)) {
            return false;
        }

        const details = await this.resolveItemDetails(characterWithEquipment, item);

        return message.channel.send({embed: this.buildEmbed(details)})

    }

    renderHelp() {
        const embed = new Discord.RichEmbed()
            .setTitle('Gunsmith Bot help')
            .setAuthor('Gunsmith Bot')
            /*
             * Alternatively, use "#00AE86", [0, 174, 134] or an integer number.
             */

            .setDescription('Gunsmith bot help');
        const commands = [
            '!gunsmith primary'
        ];
        embed.addField('How to trigger',
            '```' +
            "Hello\n" +
            "Hello 2" +
            '', true)
        return embed;


    }

    buildEmbed(details) {
        const embed = new Discord.RichEmbed()
            .setTitle(details.name)
            .setAuthor('Gunsmith Bot', details.iconLink)
            /*
             * Alternatively, use "#00AE86", [0, 174, 134] or an integer number.
             */
            .setColor(details.color)
            .setDescription(details.description)


            .setThumbnail(details.iconLink)
            /*
             * Takes a Date object, defaults to current date.
             */
            .setTimestamp()
            .setURL(details.itemLink);
        console.log(details);
        details.sockets.filter(({name}) => {
            return !!name && name.indexOf('Ornament') === -1
                && name.indexOf("Kills") === -1
                && name.indexOf("Tracker") === -1
        }).map(({name, plugs}, index) => {
            const plug = plugs.map(plug => plug.active || plug.masterwork)[0];

            const value = plugs.map(plug => {
                let plugName = plug.active ? `**${plug.name}**` : plug.name;
                if (plug.masterwork) {
                    if (plug.masterwork.tier === 'Masterwork') {
                        plugName = `**Tier 10 ${plug.masterwork.name}**`
                    } else {
                        plugName = `**${plug.name.replace('Weapon', plug.masterwork.name)}**`
                    }
                }
                return plugName;
            }).join(' | ');
            if (!name) {
                name = `Perk #${index + 1}`;
            }

            return {
                name: `__*${name}*__`,
                value
            }
        }).forEach(field => {
            if (field) {
                embed.addField(field.name, field.value, false)
            }
        })
        details.stats.forEach(stat => {
            embed.addField(`__*${stat.name}*__`, stat.value, true)
            //return `***${stat.name}***: ${stat.value}`
        });
        /*embed.addField("__*Stats*__", details.stats.map(stat => {
            return `***${stat.name}***: ${stat.value}`
        }), true);*/


        return embed;


    }


    resolveName(handleOrMember) {
        const isMember = !_.isString(handleOrMember);
        const member = isMember ? handleOrMember : null;
        const handle = !isMember ? handleOrMember : null;
        return this.parseName(handle || member.user.username);
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
        let profileName = this.resolveName(handleOrMember);

        let player;
        if (member && member.nickname) {
            network = this.parseNetwork(member.nickname) || network;
            profileName = this.parseName(member.nickname);
            player = await this.resolveBungieProfile(profileName, network);
        }
        if (player && !this.isError(player)) {
            return player;
        }

        player = await this.resolveBungieProfile(profileName, network);
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


    parseName(name) {
        let start = "[";
        let end = "]";
        let index = 0;
        if (name.indexOf("(") !== -1 && name.indexOf('[') === -1) {
            start = "(";
            end = ")";
            //index = ;
        }
        name =  (name.split(start)[index] || '').replace(end, '').trim();
        return name.replace(/[^\x00-\x7F]/g,'');
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
        } else if (member) {
            if (_.isString(member)) {
                network = this.parseNetwork(member)
            } else {
                network = this.parseNetwork(member.user.username)
                    || this.parseNetwork(member.nickname)

            }

        }
        return network;
    }

    parseNetwork(name) {
        name = name || '';
        let parts = name.split('[');
        if (parts.length > 1) {
            let network = parts[1].split(']')[0].trim();
            network = network.toLowerCase().trim();
            return this._resolveNetworkType(network);
        } else if (name.indexOf('#') !== -1) {
            return this._resolveNetworkType(name);
        }
        return null;

    }

    _resolveNetworkType(network) {
        network = network.toLowerCase();
        if (consts.XBOX_TYPES.includes(network)) return consts.NETWORK_TYPES.XBOX;
        if (consts.PSN_TYPES.includes(network)) return consts.NETWORK_TYPES.PSN;
        if (consts.PC_TYPES.includes(network) || network.indexOf('#') !== -1) return consts.NETWORK_TYPES.PC;
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
        if (membershipType === consts.NETWORK_TYPES.PC) {
            name = name.replace('#', '%23')
        }
        return this.try(() => {
            return this.bungie.playerSearch(membershipType, name)
        });
    }

    /**
     *
     * @param {DestinyCharacterComponent} character
     * @return {Promise<DestinyCharacterResponse>}
     */
    getCharacterEquipment(character) {
        return this.try(() => {
            return this.bungie.getCharacterEquipment(character);
        })
    }


    /**
     *
     * @param {UserInfoCard} profile
     * @param classType
     * @return {Promise<DestinyCharacterComponent>}
     */
    async getEquippedCharacter(profile, classType) {
        classType = (classType || '').toLowerCase();
        switch (classType) {
            case 'hunter':
                classType = 1;
                break;
            case 'titan':
                classType = 0;
                break;
            case 'warlock':
                classType = 2;
                break;
        }
        return this.try(() => {
            return this.bungie.getEquippedCharacter(profile.membershipType, profile.membershipId, classType);
        })
    }

    /**
     *
     * @param {DestinyItemComponent[]} items
     * @param bucketHash
     * @return {DestinyItemComponent}
     */
    getItemByBucketHash(items, bucketHash) {
        bucketHash = parseInt(bucketHash, 10);
        return _.find(items, (item) => item.bucketHash === bucketHash);
    }

    /**
     *
     * @param {DestinyCharacterResponse} character
     * @param {DestinyItemComponent} item
     * @return {Promise<*>}
     */
    async resolveItemDetails(character, item) {
        return this.try(() => {
            return this.bungie.getItemDetails(character, item)
        })


    }
}


module.exports = GunsmithCommand;