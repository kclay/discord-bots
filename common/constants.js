const _ = require('lodash')

const WEAPON_SLOTS = [
    "kinetic", "primary", "special", 'energy', "secondary", "heavy", "power", "ghost",
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
const PC_TYPES = [
    'pc', 'bnet'
];
const PLATFORM_TYPES = [
    ...XBOX_TYPES,
    ...PSN_TYPES,
    ...PC_TYPES
];
const NETWORK_TYPES = {
    XBOX: 1,
    PSN: 2,
    PC: 4
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

const D2Categories = {
    Weapons: ['Class', 'Kinetic', 'Energy', 'Power'],
    Armor: ['Helmet', 'Gauntlets', 'Chest', 'Leg', 'ClassItem'],
};
const TYPE_TO_BUCKET = _.invert(BUCKET_TO_TYPE);
const DAMAGE_COLOR = {
    'Kinetic': 'd9d9d9',
    'Arc': '80b3ff',
    'Solar': 'e68a00',
    'Void': '400080'
};


const DestinyComponentType = {
    None: 0,
    /**
     * Profiles is the most basic component, only relevant when calling GetProfile.
     * This returns basic information about the profile, which is almost nothing: a
     * list of characterIds, some information about the last time you logged in, and
     * that most sobering statistic: how long you've played.
     */
    Profiles: 100,
    /**
     * Only applicable for GetProfile, this will return information about receipts for
     * refundable vendor items.
     */
    VendorReceipts: 101,
    /**
     * Asking for this will get you the profile-level inventories, such as your Vault
     * buckets (yeah, the Vault is really inventory buckets located on your Profile)
     */
    ProfileInventories: 102,
    /**
     * This will get you a summary of items on your Profile that we consider to be "
     * currencies", such as Glimmer. I mean, if there's Glimmer in Destiny 2. I didn't
     * say there was Glimmer.
     */
    ProfileCurrencies: 103,
    /**
     * This will get you any progression-related information that exists on a Profile-
     * wide level, across all characters.
     */
    ProfileProgression: 104,
    /** This will get you summary info about each of the characters in the profile. */
    Characters: 200,
    /**
     * This will get you information about any non-equipped items on the character or
     * character(s) in question, if you're allowed to see it. You have to either be
     * authenticated as that user, or that user must allow anonymous viewing of their
     * non-equipped items in Bungie.Net settings to actually get results.
     */
    CharacterInventories: 201,
    /**
     * This will get you information about the progression (faction, experience, etc...
     * "levels") relevant to each character, if you are the currently authenticated
     * user or the user has elected to allow anonymous viewing of its progression info.
     */
    CharacterProgressions: 202,
    /**
     * This will get you just enough information to be able to render the character in
     * 3D if you have written a 3D rendering library for Destiny Characters, or "
     * borrowed" ours. It's okay, I won't tell anyone if you're using it. I'm no snitch.
     * (actually, we don't care if you use it - go to town)
     */
    CharacterRenderData: 203,
    /**
     * This will return info about activities that a user can see and gating on it, if
     * you are the currently authenticated user or the user has elected to allow
     * anonymous viewing of its progression info. Note that the data returned by this
     * can be unfortunately problematic and relatively unreliable in some cases. We'll
     * eventually work on making it more consistently reliable.
     */
    CharacterActivities: 204,
    /**
     * This will return info about the equipped items on the character(s). Everyone can
     * see this.
     */
    CharacterEquipment: 205,
    /**
     * This will return basic info about instanced items - whether they can be equipped,
     * their tracked status, and some info commonly needed in many places (current
     * damage type, primary stat value, etc)
     */
    ItemInstances: 300,
    /**
     * Items can have Objectives (DestinyObjectiveDefinition) bound to them. If they do,
     * this will return info for items that have such bound objectives.
     */
    ItemObjectives: 301,
    /**
     * Items can have perks (DestinyPerkDefinition). If they do, this will return info
     * for what perks are active on items.
     */
    ItemPerks: 302,
    /**
     * If you just want to render the weapon, this is just enough info to do that
     * rendering.
     */
    ItemRenderData: 303,
    /**
     * Items can have stats, like rate of fire. Asking for this component will return
     * requested item's stats if they have stats.
     */
    ItemStats: 304,
    /**
     * Items can have sockets, where plugs can be inserted. Asking for this component
     * will return all info relevant to the sockets on items that have them.
     */
    ItemSockets: 305,
    /**
     * Items can have talent grids, though that matters a lot less frequently than it
     * used to. Asking for this component will return all relevant info about activated
     * Nodes and Steps on this talent grid, like the good ol' days.
     */
    ItemTalentGrids: 306,
    /**
     * Items that *aren't* instanced still have important information you need to know:
     * how much of it you have, the itemHash so you can look up their
     * DestinyInventoryItemDefinition, whether they're locked, etc... Both instanced
     * and non-instanced items will have these properties. You will get this
     * automatically with Inventory components - you only need to pass this when
     * calling GetItem on a specific item.
     */
    ItemCommonData: 307,
    /**
     * Items that are "Plugs" can be inserted into sockets. This returns statuses about
     * those plugs and why they can/can't be inserted. I hear you giggling, there's
     * nothing funny about inserting plugs. Get your head out of the gutter and pay
     * attention!
     */
    ItemPlugStates: 308,
    /**
     * When obtaining vendor information, this will return summary information about
     * the Vendor or Vendors being returned.
     */
    Vendors: 400,
    /**
     * When obtaining vendor information, this will return information about the
     * categories of items provided by the Vendor.
     */
    VendorCategories: 401,
    /**
     * When obtaining vendor information, this will return the information about items
     * being sold by the Vendor.
     */
    VendorSales: 402,
    /**
     * Asking for this component will return you the account's Kiosk statuses: that is,
     * what items have been filled out/acquired. But only if you are the currently
     * authenticated user or the user has elected to allow anonymous viewing of its
     * progression info.
     */
    Kiosks: 500,
    /**
     * A "shortcut" component that will give you all of the item hashes/quantities of
     * items that the requested character can use to determine if an action (purchasing,
     * socket insertion) has the required currency. (recall that all currencies are
     * just items, and that some vendor purchases require items that you might not
     * traditionally consider to be a "currency", like plugs/mods!)
     */
    CurrencyLookups: 600,
    /**
     * Returns summary status information about all "Presentation Nodes". See
     * DestinyPresentationNodeDefinition for more details, but the gist is that these
     * are entities used by the game UI to bucket Collectibles and Records into a
     * hierarchy of categories. You may ask for and use this data if you want to
     * perform similar bucketing in your own UI: or you can skip it and roll your own.
     */
    PresentationNodes: 700,
    /**
     * Returns summary status information about all "Collectibles". These are records
     * of what items you've discovered while playing Destiny, and some other basic
     * information. For detailed information, you will have to call a separate endpoint
     * devoted to the purpose.
     */
    Collectibles: 800,
    /**
     * Returns summary status information about all "Records" (also known in the game
     * as "Triumphs". I know, it's confusing because there's also "Moments of Triumph"
     * that will themselves be represented as "Triumphs.")
     */
    Records: 900
}
module.exports = {
    TYPE_TO_BUCKET,
    BUCKET_TO_TYPE,
    WEAPON_SLOTS,
    GEAR_SLOTS,
    ALL_SLOTS,
    XBOX_TYPES,
    PSN_TYPES,
    PC_TYPES,
    PLATFORM_TYPES,
    NETWORK_TYPES,
    DAMAGE_COLOR,
    DestinyComponentType
};