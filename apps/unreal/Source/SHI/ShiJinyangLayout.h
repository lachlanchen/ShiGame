#pragma once
#include <algorithm>
#include <cmath>

/** Touch dimensions are Slate/platform logical units, not a scaled-down 1080p HUD. */
namespace ShiJinyangLayout
{
inline float Positive(float Value,float Fallback)
{ return std::isfinite(Value) && Value>0.f ? Value : Fallback; }
inline float TouchCompensation(float GameDpi,float PlatformDpi)
{
    // SGameLayerManager already divides GameDpi by platform geometry scale.
    // Undo only that game curve; retain the operating system's density scaling.
    return Positive(PlatformDpi,1.f)/Positive(GameDpi,1.f);
}
struct FTouchLayout { float CardWidth,CardHeight,CommandWidth,CommandHeight,NavigationWidth; };
inline FTouchLayout Resolve(float Width,float Height)
{
    Width=Positive(Width,844.f);Height=Positive(Height,390.f);
    return {std::max(160.f,std::min(560.f,Width-32.f)),
        std::max(120.f,std::min(640.f,Height-32.f)),
        std::max(160.f,std::min(400.f,Width-32.f)),
        std::max(90.f,std::min(520.f,Height-214.f)),
        std::max(160.f,Width-32.f)};
}
}
