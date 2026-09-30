import Foundation

@main struct RetreatPreviewGateChecks {
    static func main() {
        for bundle in [nil, "art.lazying.shi", "art.lazying.shi.tests", "art.lazying.shi.aftermathqa.extra", "another.app"] as [String?] {
            precondition(!RetreatPreviewContent.isEligible(bundleIdentifier: bundle))
        }
        #if SHI_RETREAT_PREVIEW
        precondition(RetreatPreviewContent.isEligible(bundleIdentifier: "art.lazying.shi.aftermathqa"))
        print("QA condition: exact QA bundle accepted; production, missing and foreign identities rejected.")
        #else
        precondition(!RetreatPreviewContent.isEligible(bundleIdentifier: "art.lazying.shi.aftermathqa"))
        print("Production condition: all bundle identities rejected.")
        #endif
        // A command-line executable is not the QA app, even with the flag.
        precondition(RetreatPreviewContent.rules == nil && RetreatPreviewContent.story == nil)
    }
}
