import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import { GALLERY_PROJECTS } from "../data/galleryProjects";
import "./ProjectGallery.css";

gsap.registerPlugin(ScrollTrigger);

const FRAME_ASPECT = 4 / 3;
const CARD_W = 2.95;
const CARD_H = CARD_W / FRAME_ASPECT;
const CARD_DEPTH = 0.08;

/**
 * Continuous helix ribbon.
 * Spacing tightened but kept clear of physical intersection
 * (angular half-width of card < half ANGLE_STEP).
 */
const RADIUS = 5.9;
const ANGLE_STEP = THREE.MathUtils.degToRad(40);
/** Slightly tighter staircase — gap remains so cards never intersect */
const Y_STEP = 0.52;
const Y_BASE = 0;

const HOVER_SCALE = 1.015;

/**
 * Static third-person camera — slightly elevated. Never driven by scroll.
 */
const CAM_POS = new THREE.Vector3(12.8, 7.2, 13.6);
const CAM_LOOK = new THREE.Vector3(0, 2.2, 0);

const _outward = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _zAxis = new THREE.Vector3(0, 0, 1);

function spiralSpan(count) {
  const yMin = Y_BASE;
  const yMax = Y_BASE + Math.max(count - 1, 0) * Y_STEP;
  return {
    yMin,
    yMax,
    height: yMax - yMin,
    totalAngle: Math.max(count - 1, 1) * ANGLE_STEP,
  };
}

/** Local helix slot — tangent to the cylinder, upright. */
function helixLocal(index) {
  const angle = index * ANGLE_STEP;
  return {
    angle,
    x: RADIUS * Math.cos(angle),
    y: Y_BASE + index * Y_STEP,
    z: RADIUS * Math.sin(angle),
  };
}

function prepareTexture(texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
}

/** Cover the 4:3 window — uniform scale up, crop overflow, never stretch */
function applyCoverTexture(texture, frameW, frameH) {
  prepareTexture(texture);
  const img = texture.image;
  const imgAspect =
    img && img.width && img.height ? img.width / img.height : FRAME_ASPECT;
  const frameAspect = frameW / frameH;

  if (imgAspect > frameAspect) {
    // Wider than frame — fill height, crop sides
    const rx = frameAspect / imgAspect;
    texture.repeat.set(rx, 1);
    texture.offset.set((1 - rx) / 2, 0);
  } else {
    // Taller / narrower — fill width, crop top/bottom
    const ry = imgAspect / frameAspect;
    texture.repeat.set(1, ry);
    texture.offset.set(0, (1 - ry) / 2);
  }
}

/** Artwork face — cover fill, unlit so original colors stay true */
function ArtworkFace({ src, width, height }) {
  const texture = useTexture(src);

  useMemo(() => {
    applyCoverTexture(texture, width, height);
  }, [texture, width, height]);

  return (
    <mesh position={[0, 0, 0.001]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} side={THREE.FrontSide} />
    </mesh>
  );
}

/**
 * Physical double-sided exhibition card.
 * Front = project cover; back = paired artwork (never empty/black).
 * Orientation: +Z faces radially outward — tangent to the helix cylinder.
 */
function HelixCard({
  project,
  backSrc,
  index,
  hoveredId,
  setHoveredId,
}) {
  const group = useRef();
  const pose = useMemo(() => helixLocal(index), [index]);
  const scaleAnim = useRef(1);

  useFrame((_, delta) => {
    if (!group.current) return;

    // Exact helix slot — no float (avoids accidental overlap)
    group.current.position.set(pose.x, pose.y, pose.z);

    // Face radially outward — tangent to the cylinder
    _outward.set(Math.cos(pose.angle), 0, Math.sin(pose.angle)).normalize();
    _quat.setFromUnitVectors(_zAxis, _outward);
    group.current.quaternion.copy(_quat);

    const isHover = hoveredId === project.id;
    const target = isHover ? HOVER_SCALE : 1;
    scaleAnim.current += (target - scaleAnim.current) * Math.min(1, delta * 6);
    group.current.scale.setScalar(scaleAnim.current);
  });

  return (
    <group
      ref={group}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHoveredId(project.id);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHoveredId((id) => (id === project.id ? null : id));
        document.body.style.cursor = "auto";
      }}
    >
      <mesh>
        <boxGeometry args={[CARD_W, CARD_H, CARD_DEPTH]} />
        <meshBasicMaterial color="#0a0a0a" />
      </mesh>

      <group position={[0, 0, CARD_DEPTH * 0.5]}>
        <Suspense fallback={null}>
          <ArtworkFace src={project.src} width={CARD_W} height={CARD_H} />
        </Suspense>
      </group>

      <group position={[0, 0, -CARD_DEPTH * 0.5]} rotation={[0, Math.PI, 0]}>
        <Suspense fallback={null}>
          <ArtworkFace src={backSrc} width={CARD_W} height={CARD_H} />
        </Suspense>
      </group>
    </group>
  );
}

/** Completely static camera — third-person, slightly above */
function FixedCamera() {
  const { camera, size } = useThree();

  useEffect(() => {
    camera.fov = 38;
    camera.near = 0.1;
    camera.far = 100;
    camera.position.copy(CAM_POS);
    camera.lookAt(CAM_LOOK);
    camera.updateProjectionMatrix();
  }, [camera]);

  useEffect(() => {
    camera.aspect = size.width / Math.max(size.height, 1);
    camera.updateProjectionMatrix();
  }, [camera, size]);

  useFrame(() => {
    camera.position.copy(CAM_POS);
    camera.lookAt(CAM_LOOK);
  });

  return null;
}

/**
 * Scroll moves the whole helix tower upward + around the axis.
 * Camera stays put — viewer watches the installation rise.
 */
function SpiralTower({ projects, progressRef }) {
  const tower = useRef();
  const [hoveredId, setHoveredId] = useState(null);
  const span = useMemo(() => spiralSpan(projects.length), [projects.length]);
  const smooth = useRef({ y: 0, rot: 0 });

  const backs = useMemo(
    () =>
      projects.map((_, i) => {
        const next = projects[(i + 1) % projects.length];
        return next.src;
      }),
    [projects]
  );

  useFrame((_, delta) => {
    if (!tower.current) return;
    const p = progressRef.current;

    // Scroll down → tower spirals upward (Y increases) while rotating
    const targetY = THREE.MathUtils.lerp(-(span.height - 3.2), 2.8, p);
    const targetRot = p * (span.totalAngle + Math.PI * 0.85);

    const ease = 1 - Math.exp(-delta * 3.2);
    smooth.current.y += (targetY - smooth.current.y) * ease;
    smooth.current.rot += (targetRot - smooth.current.rot) * ease;

    tower.current.position.set(0, smooth.current.y, 0);
    tower.current.rotation.set(0, -smooth.current.rot, 0);
  });

  return (
    <group ref={tower}>
      {projects.map((project, index) => (
        <HelixCard
          key={project.id}
          project={project}
          backSrc={backs[index]}
          index={index}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
        />
      ))}

      {/* Subtle structural axis */}
      <mesh position={[0, span.yMin + span.height * 0.5, 0]}>
        <cylinderGeometry args={[0.04, 0.04, span.height + 2.5, 16]} />
        <meshBasicMaterial color="#3a3a3a" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

function SpiralScene({ projects, progressRef }) {
  return (
    <>
      <color attach="background" args={["#000000"]} />

      <ambientLight intensity={1} />

      <FixedCamera />
      <SpiralTower projects={projects} progressRef={progressRef} />
    </>
  );
}

/**
 * Design in Motion — true 3D spiral carousel.
 * Fixed camera; scroll lifts and rotates the helix tower.
 */
export default function ProjectGallery({
  projects = GALLERY_PROJECTS,
  className = "",
}) {
  const sectionRef = useRef(null);
  const progressRef = useRef(0);
  const list = useMemo(() => projects.filter((p) => Boolean(p.src)), [projects]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.15,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        progressRef.current = self.progress;
      },
    });

    // Mount can happen right after the loader; refresh once layout is real.
    const refreshId = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });

    return () => {
      window.cancelAnimationFrame(refreshId);
      st.kill();
    };
  }, [list.length]);

  return (
    <section
      ref={sectionRef}
      id="gallery"
      className={`project-gallery3d project-gallery3d--spiral ${className}`.trim()}
      aria-label="Aevine.design hero gallery"
    >
      <div className="project-gallery3d__sticky">
        <div className="hero-copy project-gallery3d__hero-copy">
          <p className="brand-mark">Aevine.design</p>
          <h1>Visual systems with a quiet edge.</h1>
          <p className="lede">
            Branding, campaigns, editorial, and 3D — shaped with clarity,
            texture, and intent.
          </p>
          <div className="cta-group">
            <a className="btn btn-primary" href="#branding">
              View work
            </a>
            <a className="btn btn-ghost" href="#about">
              About me
            </a>
          </div>
        </div>

        <div className="project-gallery3d__stage">
          <Canvas
            dpr={[1, 2]}
            gl={{
              antialias: true,
              alpha: false,
              powerPreference: "high-performance",
              stencil: false,
            }}
            camera={{
              fov: 38,
              near: 0.1,
              far: 100,
              position: [CAM_POS.x, CAM_POS.y, CAM_POS.z],
            }}
            onCreated={({ gl, camera }) => {
              gl.toneMapping = THREE.NoToneMapping;
              gl.outputColorSpace = THREE.SRGBColorSpace;
              camera.lookAt(CAM_LOOK);
            }}
          >
            <SpiralScene projects={list} progressRef={progressRef} />
          </Canvas>
        </div>
      </div>
    </section>
  );
}
