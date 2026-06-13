const assert = require("node:assert/strict");
const test = require("node:test");
const { reconcileEntities } = require("../.test-dist/EntityReconciler.js");

function restore(target, snapshots, affectedIds) {
    reconcileEntities(
        target,
        snapshots,
        new Set(affectedIds),
        item => item.id,
        snapshot => ({ id: snapshot.id, value: snapshot.value }),
        (item, snapshot) => { item.value = snapshot.value; },
    );
}

test("redo creates a missing entity directly in its final modified state", () => {
    const target = [{ id: 1, value: "untouched" }];
    restore(target, [{ id: 2, index: 1, value: "clone after drag" }], [2]);
    assert.deepEqual(target, [
        { id: 1, value: "untouched" },
        { id: 2, value: "clone after drag" },
    ]);
});

test("undo restores a deleted entity at its original index", () => {
    const target = [{ id: 1, value: "a" }, { id: 3, value: "c" }];
    restore(target, [{ id: 2, index: 1, value: "b" }], [2]);
    assert.deepEqual(target.map(item => item.id), [1, 2, 3]);
});

test("modification reuses the live object", () => {
    const entity = { id: 2, value: "before" };
    const target = [{ id: 1, value: "a" }, entity];
    restore(target, [{ id: 2, index: 1, value: "after" }], [2]);
    assert.equal(target[1], entity);
    assert.equal(entity.value, "after");
});

test("restores multiple affected entities without disturbing unrelated order", () => {
    const target = [
        { id: 1, value: "a" },
        { id: 3, value: "c" },
        { id: 5, value: "e" },
    ];
    restore(target, [
        { id: 2, index: 1, value: "b" },
        { id: 4, index: 3, value: "d" },
    ], [2, 4]);
    assert.deepEqual(target.map(item => item.id), [1, 2, 3, 4, 5]);
});

test("empty target snapshots remove affected entities", () => {
    const target = [{ id: 1, value: "a" }, { id: 2, value: "b" }];
    restore(target, [], [2]);
    assert.deepEqual(target.map(item => item.id), [1]);
});
