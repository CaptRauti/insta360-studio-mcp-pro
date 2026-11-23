/**
 * Camera capability table tests — pure data lookups, no Studio needed.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CAMERAS,
  cameraAngles,
  cameraCaps,
  describeCamera,
  listCameras,
  validateFov,
} from "../src/camera.mjs";

test("camera table is populated", () => {
  const cams = listCameras();
  assert.ok(cams.length >= 15, `expected >=15 cameras, got ${cams.length}`);
  assert.ok(cams.includes("X6"), "X6 should be present");
  assert.ok(cams.includes("X4"), "X4 should be present");
});

test("every camera exposes fov types and modes", () => {
  for (const cam of listCameras()) {
    const caps = cameraCaps(cam);
    assert.ok(caps.fovTypes.length > 0, `${cam} has no FOV types`);
    assert.ok(caps.modes.length > 0, `${cam} has no modes`);
  }
});

test("cameraCaps returns null for an unknown camera", () => {
  assert.equal(cameraCaps("NotACamera"), null);
});

test("describeCamera renders a summary", () => {
  const s = describeCamera("X6");
  assert.match(s, /^X6:/);
  assert.match(s, /angle rules/);
});

test("angle lookup finds the Dewarp/Video/Sphere/16:9 rule", () => {
  const rules = cameraAngles("X6", {
    fov: "Dewarp",
    videoPhoto: "Video",
    mode: "Sphere",
    aspect: "16:9",
  });
  assert.equal(rules.length, 1);
  assert.equal(rules[0].defaultFov, 100);
  assert.equal(rules[0].minFov, 20);
  assert.equal(rules[0].maxFov, 150);
});

test("validateFov accepts an in-range angle", () => {
  const v = validateFov("X6", {
    fov: "Dewarp",
    videoPhoto: "Video",
    mode: "Sphere",
    aspect: "16:9",
    angle: 120,
  });
  assert.equal(v.valid, true);
});

test("validateFov rejects an out-of-range angle", () => {
  const v = validateFov("X6", {
    fov: "Dewarp",
    videoPhoto: "Video",
    mode: "Sphere",
    aspect: "16:9",
    angle: 200,
  });
  assert.equal(v.valid, false);
  assert.match(v.reason, /outside/);
});

test("validateFov rejects a FOV type the camera does not have", () => {
  const v = validateFov("X6", { fov: "NotARealFov" });
  assert.equal(v.valid, false);
  assert.match(v.reason, /no FOV type/);
  assert.ok(Array.isArray(v.supported));
});

test("validateFov rejects an unknown camera", () => {
  const v = validateFov("Nope", { fov: "Dewarp" });
  assert.equal(v.valid, false);
  assert.match(v.reason, /unknown camera/);
});

test("angle rows are non-empty across the table", () => {
  const total = Object.values(CAMERAS).reduce((n, c) => n + c.angleRows, 0);
  assert.ok(total > 300, `expected >300 angle rules, got ${total}`);
});
