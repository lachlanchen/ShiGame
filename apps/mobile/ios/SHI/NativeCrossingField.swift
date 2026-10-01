import SwiftUI

/// Native, render-on-change counterpart of the Web schematic. No game callbacks.
struct NativeCrossingField: View {
    let definition: CrossingFieldPresentation
    let metrics: Resources
    let labels: Record
    let locale: String
    let reducedMotion: Bool
    private let keys = ["crossingProgress", "rearCohesion", "pursuitClosure"]
    private func color(_ key: String) -> Color {
        let hex = definition.palette[key, default: "#ffffff"].dropFirst()
        let value = UInt32(hex, radix: 16) ?? 0xffffff
        return Color(red: Double((value >> 16) & 255) / 255, green: Double((value >> 8) & 255) / 255, blue: Double(value & 255) / 255)
    }
    var body: some View {
        let projected = definition.project(metrics)
        VStack(alignment: .leading, spacing: 12) {
            Text(definition.text("title", locale: locale)).font(.headline).accessibilityAddTraits(.isHeader)
                .accessibilityIdentifier("crossing-field-title")
            HStack(alignment: .top) {
                Text(definition.text("nearBank", locale: locale))
                Spacer(minLength: 24)
                Text(definition.text("farBank", locale: locale)).multilineTextAlignment(.trailing)
            }.font(.caption).foregroundStyle(parchment.opacity(0.85))
            GeometryReader { geometry in
                let sx = geometry.size.width / definition.canvas.width
                let sy = geometry.size.height / definition.canvas.height
                ZStack(alignment: .topLeading) {
                    Canvas { context, _ in
                        func point(_ x: Double, _ y: Double) -> CGPoint { CGPoint(x: x * sx, y: y * sy) }
                        func rectangle(_ x: Double, _ y: Double, _ w: Double, _ h: Double, _ tone: String) {
                            context.fill(Path(CGRect(x: x * sx, y: y * sy, width: w * sx, height: h * sy)), with: .color(color(tone)))
                        }
                        rectangle(0, 0, 100, 60, "ground")
                        var banks = Path()
                        banks.move(to: point(4, 6)); banks.addQuadCurve(to: point(42, 8), control: point(22, 0))
                        banks.addLine(to: point(40, 54)); banks.addQuadCurve(to: point(4, 52), control: point(20, 61)); banks.closeSubpath()
                        banks.move(to: point(62, 6)); banks.addQuadCurve(to: point(96, 8), control: point(82, 0))
                        banks.addLine(to: point(96, 53)); banks.addQuadCurve(to: point(62, 51), control: point(76, 61)); banks.closeSubpath()
                        context.fill(banks, with: .color(color("bank")))
                        rectangle(definition.river.left, 0, definition.river.right - definition.river.left, 60, "water")
                        for y in [10.0, 19, 40, 49] {
                            var flow = Path(); flow.move(to: point(47, y)); flow.addQuadCurve(to: point(56, y), control: point(51, y + 2))
                            context.stroke(flow, with: .color(color("flow")), lineWidth: 0.35 * sx)
                        }
                        var route = Path(); route.move(to: point(definition.route.startX, definition.route.y)); route.addLine(to: point(definition.route.endX, definition.route.y))
                        context.stroke(route, with: .color(color("route")), style: StrokeStyle(lineWidth: 0.5 * sx, dash: [sx, 1.5 * sx]))
                        for column in [-1.0, 0, 1] {
                            for row in [-1.0, 1] {
                                rectangle(definition.rear.x + column * projected.rearSpread - 1, definition.rear.y + row * projected.rearSpread / 2 - 1, 2, 2, "rear")
                            }
                        }
                    }
                    Circle().fill(color("route")).frame(width: 8.4 * sx, height: 8.4 * sx)
                        .overlay(Text("1").font(.system(size: 5 * sx, weight: .bold)).foregroundStyle(color("ink")))
                        .position(x: projected.progressX * sx, y: definition.route.y * sy)
                        .animation(reducedMotion ? nil : .easeOut(duration: 0.45), value: projected.progressX)
                    Text("2").font(.system(size: 5 * sx, weight: .bold)).foregroundStyle(color("rear"))
                        .position(x: definition.rear.x * sx, y: 55 * sy)
                    VStack(spacing: 0) {
                        Image(systemName: "arrowtriangle.right.fill").font(.system(size: 7 * sx))
                        Text("3").font(.system(size: 5 * sx, weight: .bold))
                    }.foregroundStyle(color("pursuit"))
                        .position(x: projected.pursuitX * sx, y: (definition.pursuit.y + 2.5) * sy)
                        .animation(reducedMotion ? nil : .easeOut(duration: 0.45), value: projected.pursuitX)
                }.clipShape(RoundedRectangle(cornerRadius: 10))
            }.aspectRatio(5.0 / 3.0, contentMode: .fit).accessibilityHidden(true)
            ForEach(Array(keys.enumerated()), id: \.element) { index, key in
                let name = labels.object("engagementMetrics").object(locale).text(key)
                Text("\(index + 1) · \(name)  \(metrics[key, default: 0])/100")
                    .font(.subheadline).accessibilityIdentifier("crossing-field-" + key)
            }
            Text(definition.text("boundary", locale: locale)).font(.footnote).lineSpacing(4)
        }.padding(16).background(color("ink"), in: RoundedRectangle(cornerRadius: 12))
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(parchment.opacity(0.35), lineWidth: 1))
    }
}
