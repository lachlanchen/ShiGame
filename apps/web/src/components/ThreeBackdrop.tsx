import { useEffect, useRef } from "react";
import { createSceneLoop } from "../sceneLoop";

export function ThreeBackdrop({ reducedMotion, paused = false }: { reducedMotion: boolean; paused?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const preferences = useRef({ reducedMotion, paused });
  const reconcile = useRef<() => void>(() => {});
  useEffect(() => {
    preferences.current = { reducedMotion, paused };
    reconcile.current();
  }, [reducedMotion, paused]);

  useEffect(() => {
    // The static art and CSS remain underneath. Reduced motion should not
    // download a renderer or allocate a GPU context just to draw one frame.
    if (!host.current || reducedMotion) return;
    const container = host.current;
    let disposed = false;
    let ownedReconcile: (() => void) | undefined;
    const disposers: Array<() => void> = [];
    const cleanup = () => {
      if (reconcile.current === ownedReconcile) reconcile.current = () => {};
      for (const dispose of disposers.splice(0).reverse()) dispose();
    };
    container.dataset.renderer = "loading";
    void (async () => {
      const THREE = await import("three");
      if (disposed) return;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
      camera.position.set(0, 3.5, 8);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
      disposers.push(() => { renderer.dispose(); renderer.domElement.remove(); });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      container.appendChild(renderer.domElement);

      const geometry = new THREE.PlaneGeometry(14, 9, 30, 20);
      disposers.push(() => geometry.dispose());
      const positions = geometry.getAttribute("position") as import("three").BufferAttribute;
      for (let index = 0; index < positions.count; index += 1) {
        const x = positions.getX(index);
        const y = positions.getY(index);
        const ridge = Math.sin(x * 0.7) * 0.18 + Math.cos(y * 1.1) * 0.12;
        positions.setZ(index, ridge + Math.sin((x + y) * 1.8) * 0.04);
      }
      geometry.rotateX(-Math.PI / 2.35);
      const material = new THREE.MeshBasicMaterial({
        color: 0xb18a51,
        wireframe: true,
        transparent: true,
        opacity: 0.075,
        blending: THREE.AdditiveBlending,
      });
      disposers.push(() => material.dispose());
      const terrain = new THREE.Mesh(geometry, material);
      terrain.position.set(0, -1.5, -1.5);
      scene.add(terrain);

      const rainGeometry = new THREE.BufferGeometry();
      disposers.push(() => rainGeometry.dispose());
      const points = new Float32Array(360 * 3);
      for (let index = 0; index < 360; index += 1) {
        points[index * 3] = (Math.random() - 0.5) * 15;
        points[index * 3 + 1] = (Math.random() - 0.5) * 9;
        points[index * 3 + 2] = (Math.random() - 0.5) * 7;
      }
      rainGeometry.setAttribute("position", new THREE.BufferAttribute(points, 3));
      const rain = new THREE.Points(rainGeometry, new THREE.PointsMaterial({ color: 0xd5d8cf, size: 0.018, transparent: true, opacity: 0.28 }));
      disposers.push(() => (rain.material as import("three").Material).dispose());
      scene.add(rain);

      const loop = createSceneLoop((seconds) => {
        rain.position.y -= .36 * seconds;
        rain.position.x -= .09 * seconds;
        if (rain.position.y < -1) rain.position.y = 1;
        if (seconds > 0) terrain.rotation.z = Math.sin(performance.now() / 14000) * .012;
        renderer.render(scene, camera);
      });
      disposers.push(() => loop.dispose());
      const resize = () => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        renderer.setSize(width, height, false);
        camera.aspect = width / Math.max(height, 1);
        camera.updateProjectionMatrix();
        loop.redraw();
      };
      const updateMode = () => loop.setMode(!preferences.current.reducedMotion && !preferences.current.paused, !document.hidden);
      ownedReconcile = updateMode;
      reconcile.current = updateMode;
      resize();
      updateMode();
      window.addEventListener("resize", resize);
      document.addEventListener("visibilitychange", updateMode);
      disposers.push(() => {
        window.removeEventListener("resize", resize);
        document.removeEventListener("visibilitychange", updateMode);
      });
      container.dataset.renderer = "ready";
    })().catch(() => {
      // Optional atmosphere must not turn an unavailable download or WebGL
      // context into an unhandled rejection in an otherwise playable chapter.
      cleanup();
      if (!disposed) container.dataset.renderer = "unavailable";
    });
    return () => {
      disposed = true;
      cleanup();
    };
  }, [reducedMotion]);

  return <div className="three-backdrop" ref={host} aria-hidden="true" data-renderer={reducedMotion ? "static" : undefined} />;
}
