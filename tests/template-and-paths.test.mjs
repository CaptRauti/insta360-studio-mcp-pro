// Two rules the builder has to obey, both learned from a real failure.
//
// 1. A template is a project *Studio* authored, never one this tooling built.
//    `findTemplate` returned `mcpE2E`, an earlier output of the builder, so every
//    later project was modelled on a machine-written file. Discovery sorts by
//    mtime, and a build writes the newest file on disk — so without an explicit
//    marker the builder always ends up cloning itself.
// 2. Paths go into the project with forward slashes, the way Studio writes them.
//    A filter attached from the asset library arrived with backslashes
//    (`D:\...\HD Fireworks.cube.binary`) because the path came from `path.join`
//    on Windows, while every other path field in the same clip used `/`.
//
// Usage: node --test tests/template-and-paths.test.mjs

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { findTemplate, markBuilt, isBuiltProject, BUILD_MARKER } from "../src/pipeline.mjs";
import { setEffect, makeTransition, projectPath } from "../src/project.mjs";

/** A minimal project that `findTemplate` accepts: video track, one clip. */
function projectFile(dir, name, clipCount = 1) {
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${name}.insproj`);
  const project = {
    id: name,
    name,
    frames: 100,
    tracks: [
      {
        type: 0,
        clips: Array.from({ length: clipCount }, (_, i) => ({ id: `c${i}`, url: "C:/a.mp4", sourceFrames: 100 })),
      },
      { type: 2, clips: [] },
    ],
  };
  fs.writeFileSync(file, JSON.stringify(project), "utf8");
  return file;
}

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "mcp-templates-"));
}

test("findTemplate skips a project this tooling built", () => {
  const root = tempRoot();
  const ours = projectFile(path.join(root, "mcpEdit"), "mcpEdit");
  const theirs = projectFile(path.join(root, "StudioProject"), "StudioProject");
  markBuilt(path.join(root, "mcpEdit"));

  const picked = findTemplate({ root });
  assert.equal(picked, theirs, "the Studio project must win even though ours is newer");
  assert.notEqual(picked, ours);
});

test("findTemplate returns null when every candidate is ours", () => {
  const root = tempRoot();
  projectFile(path.join(root, "mcpA"), "mcpA");
  markBuilt(path.join(root, "mcpA"));
  assert.equal(findTemplate({ root }), null);
});

test("findTemplate ignores a project with no clip to clone", () => {
  const root = tempRoot();
  const empty = projectFile(path.join(root, "Leer"), "Leer", 0);
  const full = projectFile(path.join(root, "Voll"), "Voll");
  // Newer, but nothing to model a clip on.
  const future = new Date(Date.now() + 60_000);
  fs.utimesSync(empty, future, future);
  assert.equal(findTemplate({ root }), full);
  assert.notEqual(findTemplate({ root }), empty);
});

test("findTemplate skips directories named in exclude", () => {
  const root = tempRoot();
  projectFile(path.join(root, "Eins"), "Eins");
  const two = projectFile(path.join(root, "Zwei"), "Zwei");
  const now = new Date();
  fs.utimesSync(two, new Date(now.getTime() + 60_000), new Date(now.getTime() + 60_000));
  assert.equal(findTemplate({ root, exclude: ["Zwei"] }), path.join(root, "Eins", "Eins.insproj"));
});

test("INSTA360_TEMPLATE forces a specific template", () => {
  const root = tempRoot();
  const forced = projectFile(path.join(root, "NichtNeu"), "NichtNeu");
  projectFile(path.join(root, "Neuer"), "Neuer");
  const previous = process.env.INSTA360_TEMPLATE;
  process.env.INSTA360_TEMPLATE = forced;
  try {
    assert.equal(findTemplate({ root }), forced);
    process.env.INSTA360_TEMPLATE = path.join(root, "does-not-exist.insproj");
    assert.equal(findTemplate({ root }), null, "a forced path that is gone is an error, not a fallback");
  } finally {
    if (previous === undefined) delete process.env.INSTA360_TEMPLATE;
    else process.env.INSTA360_TEMPLATE = previous;
  }
});

test("the build marker is a file beside the project, not a key inside it", () => {
  const root = tempRoot();
  const file = projectFile(path.join(root, "mcpX"), "mcpX");
  markBuilt(path.join(root, "mcpX"), { project: "mcpX" });
  assert.ok(fs.existsSync(path.join(root, "mcpX", BUILD_MARKER)));
  assert.ok(isBuiltProject(path.join(root, "mcpX")));
  assert.ok(!isBuiltProject(root));
  const project = JSON.parse(fs.readFileSync(file, "utf8"));
  assert.ok(!Object.keys(project).some((k) => k.includes("mcp")), "marker leaked into the project JSON");
});

test("setEffect writes the resource path with forward slashes", () => {
  const clip = {};
  setEffect(clip, { id: "f1", name: "HD Fireworks", resourcePath: "D:\\Dokumente\\Assets\\HD Fireworks.cube.binary" });
  assert.equal(clip.effect_filter.externfilterResourcePath, "D:/Dokumente/Assets/HD Fireworks.cube.binary");
});

test("a missing effect resource is an empty string, not undefined", () => {
  const clip = {};
  setEffect(clip, { id: "f1", name: "x" });
  assert.equal(clip.effect_filter.externfilterResourcePath, "");
});

test("makeTransition writes the resource path with forward slashes", () => {
  const t = makeTransition({ resourcePath: "C:\\Program Files\\Insta360 Studio\\transition\\v1" });
  assert.equal(t.path, "C:/Program Files/Insta360 Studio/transition/v1");
  assert.equal(makeTransition({}).path, null, "no path stays null rather than becoming 'null'");
});

test("projectPath leaves non-strings alone", () => {
  assert.equal(projectPath(null), null);
  assert.equal(projectPath(undefined), undefined);
  assert.equal(projectPath(7), 7);
  assert.equal(projectPath("D:\\a\\b"), "D:/a/b");
});
