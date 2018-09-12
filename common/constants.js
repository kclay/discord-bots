import {BungieMembershipType} from "bungie-api-ts/common";

const WEAPON_SLOTS = [
    "primary", "special", "secondary", "heavy", "ghost",
];
const GEAR_SLOTS = [
    "head", "helm", "helmet", "chest", "arm", "arms",
    "gloves", "gauntlets", "leg", "legs", "boots", "class", "mark", "bond", "cape", "cloak"
];
const ALL_SLOTS = [
    ...WEAPON_SLOTS,
    ...GEAR_SLOTS
];

const XBOX_TYPES = [
    'xbox', 'xb1', 'xbox1', 'xboxone', 'xbox360', 'xb360', 'xbone', 'xb',
];
const PSN_TYPES = [
    'psn', 'playstation', 'ps', 'ps3', 'ps4', 'playstation3', 'playstation4'
];
const PLATFORM_TYPES = [
    ...XBOX_TYPES,
    ...PSN_TYPES
];
const NETWORK_TYPES = {
    XBOX: BungieMembershipType.TigerXbox,
    PSN: BungieMembershipType.TigerPsn
};
// Mapping from itemCategoryHash to our category strings for filtering.
const CATEGORY_FROM_HASH = {
    153950757: 'CATEGORY_GRENADE_LAUNCHER',
    3954685534: 'CATEGORY_SUBMACHINEGUN',
    2489664120: 'CATEGORY_TRACE_RIFLE',
    1504945536: 'CATEGORY_LINEAR_FUSION_RIFLE',
    3317538576: 'CATEGORY_BOW',
    5: 'CATEGORY_AUTO_RIFLE',
    6: 'CATEGORY_HAND_CANNON',
    7: 'CATEGORY_PULSE_RIFLE',
    8: 'CATEGORY_SCOUT_RIFLE',
    9: 'CATEGORY_FUSION_RIFLE',
    10: 'CATEGORY_SNIPER_RIFLE',
    11: 'CATEGORY_SHOTGUN',
    12: 'CATEGORY_MACHINE_GUN',
    13: 'CATEGORY_ROCKET_LAUNCHER',
    14: 'CATEGORY_SIDEARM',
    54: 'CATEGORY_SWORD'
};
const BUCKET_TO_TYPE = {
    2465295065: 'Energy',
    2689798304: 'Upgrade Point',
    2689798305: 'Strange Coin',
    2689798308: 'Glimmer',
    2689798309: 'Legendary Shards',
    2689798310: 'Silver',
    2689798311: 'Bright Dust',
    2973005342: 'Shaders',
    3161908920: 'Messages',
    3284755031: 'Class',
    3313201758: 'Modifications',
    3448274439: 'Helmet',
    3551918588: 'Gauntlets',
    3865314626: 'Materials',
    4023194814: 'Ghost',
    4274335291: 'Emblems',
    4292445962: 'ClanBanners',
    14239492: 'Chest',
    20886954: 'Leg',
    215593132: 'LostItems',
    284967655: 'Ships',
    375726501: 'Engrams',
    953998645: 'Power',
    1269569095: 'Auras',
    1367666825: 'SpecialOrders',
    1498876634: 'Kinetic',
    1585787867: 'ClassItem',
    2025709351: 'Vehicle',
    1469714392: 'Consumables',
    138197802: 'General',
    1107761855: 'Emotes',
    1345459588: 'Pursuits'
};

export const D2Categories = {
    Weapons: ['Class', 'Kinetic', 'Energy', 'Power'],
    Armor: ['Helmet', 'Gauntlets', 'Chest', 'Leg', 'ClassItem'],
};
const TYPE_TO_BUCKET = _.invert(BUCKET_TO_TYPE);

module.exports = {
    TYPE_TO_BUCKET,
    BUCKET_TO_TYPE,
    WEAPON_SLOTS,
    GEAR_SLOTS,
    ALL_SLOTS,
    XBOX_TYPES,
    PSN_TYPES,
    PLATFORM_TYPES,
    NETWORK_TYPES
};