#pragma once
#include <algorithm>
#include <cmath>
#include <string_view>

// Presentation only: never reads or changes campaign state or saved orders.
namespace ShiJinyangCamera
{
inline int SubjectIndex(std::string_view Order)
{
    // Matches the explicit role order in CreateFigures, not container iteration.
    if (Order == "brace") return 16;
    if (Order == "diversion") return 17;
    if (Order == "escape") return 12;
    if (Order == "quiet-han" || Order == "quiet-wei" || Order == "escort-han"
        || Order == "escort-wei" || Order == "relay") return 18;
    return -1; // Operations and outcomes retain their authored formation views.
}
inline bool ShouldTrack(bool Following, bool Paused, bool Reduced, bool Exploring, bool Moving)
{
    return Following && !Paused && !Reduced && !Exploring && Moving;
}
inline float RouteDistance(float Radius, float HorizontalFov, float Aspect)
{
    if (!std::isfinite(Radius) || Radius < 1.f) Radius = 150.f;
    if (!std::isfinite(HorizontalFov)) HorizontalFov = 60.f;
    if (!std::isfinite(Aspect) || Aspect <= 0.f) Aspect = 16.f / 9.f;
    const float HalfHorizontal = std::clamp(HorizontalFov, 20.f, 120.f) * .00872664626f;
    const float HalfVertical = std::atan(std::tan(HalfHorizontal) / std::clamp(Aspect, .25f, 4.f));
    // Fit a bounding sphere in BOTH axes with headroom, including wide phones.
    return Radius * 1.15f / std::sin(std::min(HalfHorizontal, HalfVertical));
}
}
