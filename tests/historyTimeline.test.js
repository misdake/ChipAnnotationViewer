const assert = require("node:assert/strict");
const test = require("node:test");
const { HistoryTimeline } = require("../.test-dist/HistoryTimeline.js");

function entry(kind, before, after, timestamp, mergeKey) {
    return { kind, before, after, timestamp, mergeKey };
}

test("records undo and redo in order", () => {
    const timeline = new HistoryTimeline(10, 600);
    const first = entry("first", 0, 1, 100);
    const second = entry("second", 1, 2, 200);
    timeline.record(first);
    timeline.record(second);
    assert.equal(timeline.peekUndo(), second);
    timeline.completeUndo(second);
    assert.equal(timeline.peekUndo(), first);
    assert.equal(timeline.peekRedo(), second);
    timeline.completeRedo(second);
    assert.equal(timeline.peekUndo(), second);
    assert.equal(timeline.canRedo(), false);
});

test("new edits clear redo entries", () => {
    const timeline = new HistoryTimeline(10, 600);
    const first = entry("first", 0, 1, 100);
    timeline.record(first);
    timeline.completeUndo(first);
    timeline.record(entry("replacement", 0, 2, 200));
    assert.equal(timeline.canRedo(), false);
    assert.equal(timeline.peekUndo().after, 2);
});

test("matching edits merge within the configured window", () => {
    const timeline = new HistoryTimeline(10, 600);
    timeline.record(entry("input", "", "a", 100, "text:1"));
    timeline.record(entry("input", "a", "ab", 500, "text:1"));
    const merged = timeline.peekUndo();
    assert.equal(merged.before, "");
    assert.equal(merged.after, "ab");
    timeline.completeUndo(merged);
    assert.equal(timeline.canUndo(), false);
});

test("does not merge edits across time discontinuities", () => {
    const timeline = new HistoryTimeline(10, 600);
    timeline.record(entry("input", "", "a", 1000, "text:1"));
    const second = entry("input", "a", "ab", 500, "text:1");
    timeline.record(second);
    assert.equal(timeline.peekUndo(), second);
});

test("does not merge different targets or edits outside the window", () => {
    const timeline = new HistoryTimeline(10, 600);
    const first = entry("input", "", "a", 100, "text:1");
    const second = entry("input", "a", "b", 200, "text:2");
    const third = entry("input", "b", "bc", 1000, "text:2");
    timeline.record(first);
    timeline.record(second);
    timeline.record(third);
    assert.equal(timeline.peekUndo(), third);
    timeline.completeUndo(third);
    assert.equal(timeline.peekUndo(), second);
    timeline.completeUndo(second);
    assert.equal(timeline.peekUndo(), first);
});

test("undo and redo create a merge barrier", () => {
    const timeline = new HistoryTimeline(10, 600);
    const first = entry("input", "", "a", 100, "text:1");
    timeline.record(first);
    timeline.completeUndo(first);
    timeline.completeRedo(first);
    timeline.record(entry("input", "a", "ab", 200, "text:1"));
    const latest = timeline.peekUndo();
    assert.equal(latest.before, "a");
    timeline.completeUndo(latest);
    assert.equal(timeline.peekUndo(), first);
});

test("enforces the history limit", () => {
    const timeline = new HistoryTimeline(2, 600);
    timeline.record(entry("one", 0, 1, 100));
    timeline.record(entry("two", 1, 2, 200));
    const third = entry("three", 2, 3, 300);
    timeline.record(third);
    timeline.completeUndo(third);
    const second = timeline.peekUndo();
    timeline.completeUndo(second);
    assert.equal(timeline.canUndo(), false);
});

test("rejects stale completion tokens", () => {
    const timeline = new HistoryTimeline(10, 600);
    const first = entry("first", 0, 1, 100);
    timeline.record(first);
    timeline.record(entry("second", 1, 2, 200));
    assert.throws(() => timeline.completeUndo(first), /no longer current/);
});
