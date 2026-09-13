import { Color, Group, Mesh, MeshBasicNodeMaterial, NormalBlending, PlaneGeometry, Sprite, SpriteNodeMaterial, Vector2, type Texture } from "three/webgpu";
import { Fn, If, float, instancedArray, instancedBufferAttribute, instanceIndex, mix, sin, smoothstep, texture, uniform, uv, varying, vec2, vec3 } from "three/tsl";
import type { Node } from "three/webgpu";
import { revealDuration, revealEase, revealQuality, revealTones, type RevealColor } from "@/components/HairColorParticleReveal/model";

export type RevealAssets = { photo: Texture; mask: Texture; flow: Texture; seeds: Float32Array };
export function colorMultiplier(color: RevealColor) {
  const tone = revealTones[color], tint = new Color(tone.tint);
  return tint.multiplyScalar(tone.exposure / (tint.r * .2126 + tint.g * .7152 + tint.b * .0722));
}

/** One TSL graph for both backends. Only WebGPU allocates mutable storage and
 * dispatches compute; WebGL2 uses analytic advection in its vertex shader.
 * JS changes a fixed set of uniforms, never any particle buffer after upload.
 */
export function createRevealNodes(assets: RevealAssets, compact: boolean, gpu: boolean, initialColor: RevealColor) {
  const quality = revealQuality[compact ? "mobile" : "desktop"];
  const u = {
    uTime: uniform(0), uPointer: uniform(new Vector2(10, 10)), uFlow: texture(assets.flow),
    uColorFrom: uniform(colorMultiplier(initialColor)), uColorTo: uniform(colorMultiplier(initialColor)),
    uProgress: uniform(1), uNoise: uniform(quality.noise as number),
    uDelta: uniform(0), uReset: uniform(1), uMotion: uniform(1),
  };
  const progress = smoothstep(0, 1, u.uProgress);
  const color = mix(u.uColorFrom, u.uColorTo, progress);
  const mask = texture(assets.mask);
  const hair = new MeshBasicNodeMaterial({ toneMapped: false });
  hair.colorNode = Fn(() => {
    const photo = texture(assets.photo).rgb;
    const luminance = photo.dot(vec3(.2126, .7152, .0722));
    // Preserve photographic strand contrast. All adjustments are hair-masked.
    const colored = mix(vec3(luminance), photo, .07).mul(color);
    const sheen = smoothstep(.13, .7, luminance).mul(.017);
    return mix(photo, colored.add(sheen), mask.r);
  })();
  const plane = new Mesh(new PlaneGeometry(2, 3), hair);
  plane.frustumCulled = false;

  const seeds = gpu ? instancedArray(assets.seeds, "vec4").toReadOnly() : null;
  const seedAttribute = instancedBufferAttribute<"vec4">(assets.seeds, "vec4");
  const positions = gpu ? instancedArray(quality.count, "vec3") : null;
  const velocities = gpu ? instancedArray(quality.count, "vec3") : null;
  const sourcePosition = (seed: Node<"vec4">) => vec3(seed.x.sub(.5).mul(2), seed.y.sub(.5).mul(3), .025);
  const strandFlow = (seed: Node<"vec4">) => u.uFlow.sample(seed.xy).level(float(0)).rg.mul(2).sub(1).normalize();
  const turbulence = (p: Node<"vec3">, seed: Node<"vec4">) => {
    const phase = seed.w.mul(6.283).add(u.uTime.mul(.65));
    let n = vec2(sin(p.y.mul(13).add(phase)), sin(p.x.mul(11).sub(phase))).mul(.60);
    // Compile-time branch: mobile does not execute the extra octaves.
    if (quality.noiseOctaves > 1) {
      n = n.add(vec2(sin(p.y.mul(27).sub(phase)), sin(p.x.mul(23).add(phase))).mul(.27));
      n = n.add(vec2(sin(p.y.mul(47).add(phase)), sin(p.x.mul(41).sub(phase))).mul(.13));
    }
    return n.mul(u.uNoise);
  };
  const compute = gpu && positions && velocities && seeds ? Fn(() => {
    const seed = seeds.element(instanceIndex);
    const position = positions.element(instanceIndex);
    const velocity = velocities.element(instanceIndex);
    const origin = sourcePosition(seed);
    const flow = strandFlow(seed);
    const speed = seed.w.mul(.085).add(.075);
    const emitted = u.uProgress.greaterThan(seed.z.mul(.30));
    If(u.uReset.greaterThan(.5).or(emitted.not()), () => {
      position.assign(origin);
      velocity.assign(vec3(flow.mul(speed), 0));
    }).Else(() => {
      const offset = position.xy.sub(u.uPointer);
      const influence = offset.dot(offset).mul(-7).exp().mul(.13);
      const desired = flow.mul(speed).add(turbulence(position, seed)).add(offset.mul(influence));
      velocity.assign(mix(velocity, vec3(desired, 0), u.uDelta.mul(4).clamp(0, 1)));
      position.addAssign(velocity.mul(u.uDelta).mul(u.uMotion));
    });
  })().compute(quality.count).setName("Hair dust — strand advection") : null;

  const dust = new SpriteNodeMaterial({ transparent: true, depthWrite: false, depthTest: false, blending: NormalBlending, toneMapped: false });
  // Varyings make seed data available in the fragment stage on both backends.
  const seed = seedAttribute;
  const vSeed = varying(seed);
  const age = u.uProgress.sub(vSeed.z.mul(.30)).div(.70).clamp(0, 1);
  dust.positionNode = positions ? positions.toAttribute() : Fn(() => {
    const origin = sourcePosition(seed);
    const elapsed = u.uProgress.sub(seed.z.mul(.30)).max(0).mul(revealDuration);
    const drift = strandFlow(seed).mul(seed.w.mul(.085).add(.075));
    const offset = origin.xy.sub(u.uPointer);
    const influence = offset.dot(offset).mul(-7).exp().mul(.065);
    return origin.add(vec3(drift.add(turbulence(origin, seed)).add(offset.mul(influence)).mul(elapsed).mul(u.uMotion), 0));
  })();
  // Mostly fine pigment, with a small fraction of broad, very soft mist.
  const mist = smoothstep(.86, 1, seed.w);
  dust.scaleNode = vec2(float(.005).add(mist.mul(.032)), float(.011).add(mist.mul(.050)));
  const flow = strandFlow(seed);
  dust.rotationNode = flow.y.atan(flow.x).sub(Math.PI / 2);
  dust.colorNode = mix(color.div(color.dot(vec3(.2126, .7152, .0722)).max(.001)).mul(.36), vec3(.70, .68, .65), .24);
  const radial = uv().sub(.5).length().mul(2);
  const softDisc = float(1).sub(smoothstep(.10, 1, radial)).pow(2);
  const envelope = smoothstep(0, .12, age).mul(float(1).sub(smoothstep(.40, 1, age)));
  // Recheck the source matte on the GPU; nothing can emit from face/background.
  const emissionMask = texture(assets.mask).sample(vSeed.xy).r;
  dust.opacityNode = softDisc.mul(envelope).mul(emissionMask).mul(u.uMotion)
    .mul(mix(.36, .075, smoothstep(.86, 1, vSeed.w)));
  const particles = new Sprite(dust);
  particles.count = quality.count;
  particles.frustumCulled = false;
  particles.renderOrder = 1;
  const group = new Group(); group.add(plane, particles);
  return {
    group, plane, particles, compute, uniforms: u,
    transition(color: RevealColor) {
      // Capture the actual on-screen mixture when interrupting a transition.
      u.uColorFrom.value.lerp(u.uColorTo.value, revealEase(u.uProgress.value));
      u.uColorTo.value.copy(colorMultiplier(color));
      u.uProgress.value = 0; u.uReset.value = 1;
    },
    setMotion(motion: boolean) {
      u.uMotion.value = motion ? 1 : 0;
      if (!motion) u.uProgress.value = 1;
    },
    advance(dt: number, motion: boolean, pointer: { x: number; y: number }) {
      u.uDelta.value = dt; u.uTime.value += dt;
      u.uProgress.value = motion ? Math.min(1, u.uProgress.value + dt / revealDuration) : 1;
      u.uPointer.value.set(pointer.x, pointer.y);
      const animating = motion && u.uProgress.value < 1;
      particles.visible = animating;
      return { animating, needsCompute: animating || u.uReset.value > 0 };
    },
    didCompute() { u.uReset.value = 0; },
    dispose() {
      plane.geometry.dispose(); hair.dispose(); dust.dispose();
      // Sprite.geometry is shared by Three.js. Renderer disposal owns GPU buffers.
      compute?.dispose();
    },
  };
}
