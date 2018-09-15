const assert = require('assert');
const expect = require('chai').expect;
const should = require('chai').should();
const path = require('path');
require('dotenv').config();
const Gunsmith = require('../commands/gunsmith');
const consts = require('../common/constants');
describe('gunsmith', function () {
    let gunsmith;
    beforeEach(() => {
        process.env.DB = './db/manifest.sqlite';
        gunsmith = new Gunsmith();
    });
    it('should resolve networkType', function () {
        const network = gunsmith._resolveNetworkType('psn');
        network.should.equal(consts.NETWORK_TYPES.PSN)
    });

    it('should search for player', async () => {
        const userCard = await gunsmith.resolveBungieProfile('xastey', consts.NETWORK_TYPES.PSN)
        userCard.displayName.should.equal('xastey')
    })
    it('should search all networks for profile', async () => {
        const userCard = await gunsmith.resolveBungieProfile('xastey');
        userCard.displayName.should.equal('xastey')
    })

    it('should parse network from name', () => {
        const name = 'xastey[PS4]';
        const networkType = gunsmith.parseNetwork(name);
        networkType.should.equal(consts.NETWORK_TYPES.PSN);
    });

    it('should get character', async () => {
        const player = await   gunsmith.resolveBungieProfile('xastey', consts.NETWORK_TYPES.PSN);
        const character = await  gunsmith.getEquippedCharacter(player);
        character.membershipType.should.equal(consts.NETWORK_TYPES.PSN);
    })

});