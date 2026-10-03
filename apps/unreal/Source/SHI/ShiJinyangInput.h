#pragma once
#include <algorithm>
#include <cmath>

/** Engine-independent walking input; the native client and small CPU test use this exact code. */
namespace ShiJinyangInput
{
struct FStick { float X=0, Y=0; };
struct FAxes { float Forward=0, Side=0, Yaw=0, Pitch=0; };

inline float Finite(float Value) { return std::isfinite(Value) ? Value : 0.f; }
inline FStick UnitDisk(float X, float Y)
{
    X=std::clamp(Finite(X),-1.f,1.f);Y=std::clamp(Finite(Y),-1.f,1.f);
    const float Length=std::hypot(X,Y);
    const float Scale=Length>1.f ? 1.f/Length : 1.f;
    return {X*Scale,Y*Scale};
}
inline FStick DeadZone(float X, float Y)
{
    const FStick S=UnitDisk(X,Y);
    const float Length=std::hypot(S.X,S.Y);
    constexpr float Threshold=.15f;
    if(Length<=Threshold)return {};
    const float Scale=(Length-Threshold)/(1.f-Threshold)/Length;
    return {S.X*Scale,S.Y*Scale};
}
inline FAxes Resolve(float KeyForward,float KeySide,float KeyTurn,float KeyTilt,
    float MoveX,float MoveY,float LookX,float LookY,float MouseX,float MouseY,float Dt)
{
    const auto Move=DeadZone(MoveX,MoveY),Look=DeadZone(LookX,LookY);
    const auto Walk=UnitDisk(Finite(KeySide)+Move.X,Finite(KeyForward)+Move.Y);
    // A suspended frame must not become a sudden camera turn on return.
    const float Step=std::clamp(Finite(Dt),0.f,.05f);
    return {Walk.Y,Walk.X,
        std::clamp(Finite(MouseX),-200.f,200.f)*.18f
            +std::clamp(Finite(KeyTurn)+Look.X,-1.f,1.f)*65.f*Step,
        // SceneViewport and the engine joystick both report upward motion as positive Y.
        // Positive Unreal pitch looks up; keep all three devices in that convention.
        std::clamp(Finite(MouseY),-200.f,200.f)*.16f
            +std::clamp(Finite(KeyTilt)+Look.Y,-1.f,1.f)*45.f*Step};
}
}
