using UnrealBuildTool;

public class SHI : ModuleRules
{
    public SHI(ReadOnlyTargetRules Target) : base(Target)
    {
        PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;
        PublicDependencyModuleNames.AddRange(new[]
        {
            "Core", "CoreUObject", "Engine", "InputCore", "Json", "JsonUtilities", "AudioMixer",
            "Slate", "SlateCore"
        });
    }
}
