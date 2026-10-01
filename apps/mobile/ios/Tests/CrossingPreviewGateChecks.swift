import Foundation

@main enum CrossingPreviewGateChecks {
    static func main() {
        for id in [nil, "art.lazying.shi", "art.lazying.shi.aftermathqa", "another.app"] {
            precondition(!CrossingPreviewContent.isEligible(bundleIdentifier: id))
        }
        #if SHI_CROSSING_PREVIEW
        precondition(CrossingPreviewContent.isEligible(bundleIdentifier: "art.lazying.shi.crossingqa"))
        #else
        precondition(!CrossingPreviewContent.isEligible(bundleIdentifier: "art.lazying.shi.crossingqa"))
        #endif
        print("PASS: crossing preview requires both the compilation flag and exact isolated QA identity.")
    }
}
