using UnrealBuildTool;
using System.Collections.Generic;

public class SHIEditorTarget : TargetRules
{
    public SHIEditorTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Editor;
        DefaultBuildSettings = BuildSettingsVersion.V7;
        IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
        ExtraModuleNames.Add("SHI");
    }
}
