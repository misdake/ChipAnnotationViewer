const test = require('node:test');
const assert = require('node:assert/strict');

const { groupAdjacentChips } = require('../.test-dist/util/ChipGrouping.js');

test('adjacent chips with the same vendor, type, and family share a tone', () => {
    const chips = [
        { name: 'A', vendor: 'AMD', type: 'GPU', family: 'Radeon' },
        { name: 'B', vendor: 'AMD', type: 'GPU', family: 'Radeon' },
        { name: 'C', vendor: 'AMD', type: 'GPU', family: 'Instinct' },
        { name: 'D', vendor: 'AMD', type: 'GPU', family: 'Instinct' },
        { name: 'E', vendor: 'AMD', type: 'GPU', family: 'Radeon' },
    ];

    assert.deepEqual(groupAdjacentChips(chips).map(group => group.tone), [
        'base', 'base', 'alternate', 'alternate', 'base',
    ]);
});

test('a type or vendor change starts a new alternating group', () => {
    const chips = [
        { vendor: 'AMD', type: 'CPU', family: 'Zen' },
        { vendor: 'AMD', type: 'APU', family: 'Zen' },
        { vendor: 'Intel', type: 'APU', family: 'Zen' },
    ];

    assert.deepEqual(groupAdjacentChips(chips).map(group => group.tone), [
        'base', 'alternate', 'base',
    ]);
});
