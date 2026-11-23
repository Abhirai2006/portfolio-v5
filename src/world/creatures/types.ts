import type * as THREE from "three";
import type { CinematicSpec } from "../cinematics/spec";
import type { V3 } from "../fx/bolt";
import type { ParticleField } from "../fx/particles";

/** What every creature receives from the Director each render. */
export type CreatureProps = {
  /** Normalised cinematic time 0–1. */
  t: number;
  spec: CinematicSpec;
  /** Where the hero piece stood (board space). */
  origin: V3;
  /** The creature's route: a chamfered polyline, and the 0–1 distance along it right now. */
  path: THREE.Vector3[];
  u: number;
  /** Shared GPU particles (flames, dust, feathers). */
  field: ParticleField;
  reduced: boolean;
  /** Seconds since the cinematic started (drives animation clips and gaits). */
  seconds: number;
};
