import { useEffect, useRef } from "react";

export function ThreeBackdrop({ reducedMotion }: { reducedMotion: boolean }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!host.current) return;
    const container = host.current;
    let disposed = false;
    let cleanup = () => {};
    void (async () => {
      const THREE = await import("three");
      if (disposed) return;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
      camera.position.set(0, 3.5, 8);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      container.appendChild(renderer.domElement);

      const geometry = new THREE.PlaneGeometry(14, 9, 30, 20);
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
      const terrain = new THREE.Mesh(geometry, material);
      terrain.position.set(0, -1.5, -1.5);
      scene.add(terrain);

      const rainGeometry = new THREE.BufferGeometry();
      const points = new Float32Array(360 * 3);
      for (let index = 0; index < 360; index += 1) {
        points[index * 3] = (Math.random() - 0.5) * 15;
        points[index * 3 + 1] = (Math.random() - 0.5) * 9;
        points[index * 3 + 2] = (Math.random() - 0.5) * 7;
      }
      rainGeometry.setAttribute("position", new THREE.BufferAttribute(points, 3));
      const rain = new THREE.Points(rainGeometry, new THREE.PointsMaterial({ color: 0xd5d8cf, size: 0.018, transparent: true, opacity: 0.28 }));
      scene.add(rain);

      let frame = 0;
      const resize = () => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        renderer.setSize(width, height, false);
        camera.aspect = width / Math.max(height, 1);
        camera.updateProjectionMatrix();
      };
      const render = () => {
        if (!reducedMotion) {
          rain.position.y -= 0.006;
          rain.position.x -= 0.0015;
          if (rain.position.y < -1) rain.position.y = 1;
          terrain.rotation.z = Math.sin(performance.now() / 14000) * 0.012;
        }
        renderer.render(scene, camera);
        frame = requestAnimationFrame(render);
      };
      resize();
      render();
      window.addEventListener("resize", resize);
      cleanup = () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("resize", resize);
        geometry.dispose();
        material.dispose();
        rainGeometry.dispose();
        (rain.material as import("three").Material).dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();
    return () => {
      disposed = true;
      cleanup();
    };
  }, [reducedMotion]);

  return <div className="three-backdrop" ref={host} aria-hidden="true" />;
}
