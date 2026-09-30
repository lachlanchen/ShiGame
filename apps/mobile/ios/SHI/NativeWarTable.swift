import SwiftUI
import SceneKit

private final class WarTableView: SCNView {
    override func layoutSubviews() {
        super.layoutSubviews()
        if bounds.height > 0 {
            pointOfView?.camera?.orthographicScale = max(3.2, 6.8 / Double(bounds.width / bounds.height))
        }
    }
}

/// A native schematic war table, not a claim of surveyed historical geography.
struct NativeWarTable: UIViewRepresentable {
    let sites: [Record]
    let activeSite: String
    let reducedMotion: Bool

    func makeUIView(context: Context) -> SCNView {
        let view = WarTableView()
        view.backgroundColor = UIColor(red: 0.08, green: 0.095, blue: 0.085, alpha: 1)
        view.antialiasingMode = .multisampling2X
        view.preferredFramesPerSecond = 30
        view.isUserInteractionEnabled = false
        let scene = SCNScene()
        scene.background.contents = view.backgroundColor
        let camera = SCNNode()
        camera.camera = SCNCamera()
        camera.camera?.usesOrthographicProjection = true
        camera.camera?.orthographicScale = 7.5
        camera.position = SCNVector3(0, 11, 10)
        camera.look(at: SCNVector3(0, 0, 0))
        scene.rootNode.addChildNode(camera)
        view.pointOfView = camera
        let key = SCNNode()
        key.light = SCNLight(); key.light?.type = .directional; key.light?.intensity = 1200
        key.light?.color = UIColor(red: 1, green: 0.88, blue: 0.63, alpha: 1)
        key.position = SCNVector3(-4, 10, 5); key.look(at: SCNVector3Zero)
        scene.rootNode.addChildNode(key)
        let fill = SCNNode(); fill.light = SCNLight(); fill.light?.type = .ambient; fill.light?.intensity = 350
        fill.light?.color = UIColor(red: 0.55, green: 0.68, blue: 0.72, alpha: 1)
        scene.rootNode.addChildNode(fill)
        let earth = SCNBox(width: 12, height: 0.25, length: 6.5, chamferRadius: 0.18)
        earth.firstMaterial?.diffuse.contents = UIColor(red: 0.20, green: 0.23, blue: 0.17, alpha: 1)
        scene.rootNode.addChildNode(SCNNode(geometry: earth))
        for index in 0..<28 {
            let hill = SCNSphere(radius: CGFloat(0.28 + Double(index % 4) * 0.14))
            hill.segmentCount = 12
            hill.firstMaterial?.diffuse.contents = UIColor(red: 0.22, green: 0.27, blue: 0.20, alpha: 1)
            let node = SCNNode(geometry: hill)
            node.scale = SCNVector3(1.8, 0.6, 1)
            node.position = SCNVector3(Float(index % 9) * 1.2 - 5, -0.1, Float((index * 7) % 13) * 0.4 - 2.4)
            scene.rootNode.addChildNode(node)
        }
        for index in 0..<38 {
            let water = SCNSphere(radius: 0.16); water.segmentCount = 8
            water.firstMaterial?.diffuse.contents = UIColor(red: 0.23, green: 0.41, blue: 0.45, alpha: 1)
            let tile = SCNNode(geometry: water)
            tile.scale = SCNVector3(1.5, 0.1, 1.5)
            let x = Float(index) / 3.5 - 5.4
            tile.position = SCNVector3(x, 0.17, sin(x * 0.7) * 1.0)
            scene.rootNode.addChildNode(tile)
        }
        for site in sites {
            let marker = SCNNode(); marker.name = site.text("id")
            marker.position = SCNVector3(Float((site["x"] as? Double ?? 50) - 50) / 8, 0.35, Float((site["z"] as? Double ?? 50) - 45) / 8)
            let post = SCNCylinder(radius: 0.08, height: 0.8)
            post.firstMaterial?.diffuse.contents = UIColor(red: 0.8, green: 0.66, blue: 0.4, alpha: 1)
            marker.addChildNode(SCNNode(geometry: post))
            let banner = SCNBox(width: 0.45, height: 0.3, length: 0.035, chamferRadius: 0.015)
            banner.firstMaterial?.diffuse.contents = UIColor(red: 0.48, green: 0.17, blue: 0.12, alpha: 1)
            let flag = SCNNode(geometry: banner); flag.position = SCNVector3(0.22, 0.3, 0)
            marker.addChildNode(flag)
            scene.rootNode.addChildNode(marker)
        }
        let army = SCNNode(); army.name = "army"
        for index in 0..<12 {
            let pawn = SCNCapsule(capRadius: 0.08, height: 0.32)
            pawn.radialSegmentCount = 8
            pawn.firstMaterial?.diffuse.contents = UIColor(red: 0.8, green: 0.69, blue: 0.48, alpha: 1)
            let token = SCNNode(geometry: pawn)
            token.position = SCNVector3(Float(index % 4) * 0.22 - 0.33, 0, Float(index / 4) * 0.22)
            army.addChildNode(token)
        }
        scene.rootNode.addChildNode(army)
        view.scene = scene
        return view
    }
    func updateUIView(_ view: SCNView, context: Context) {
        guard let scene = view.scene, let marker = scene.rootNode.childNode(withName: activeSite, recursively: false),
              let army = scene.rootNode.childNode(withName: "army", recursively: false) else { return }
        let target = SCNVector3(marker.position.x, 0.35, marker.position.z + 0.5)
        if army.position.x != target.x || army.position.z != target.z {
            SCNTransaction.begin(); SCNTransaction.animationDuration = reducedMotion ? 0 : 0.6
            army.position = target; SCNTransaction.commit()
        }
        view.isPlaying = false // Render on demand; no hidden background simulation.
    }
}
