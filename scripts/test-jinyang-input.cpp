#include "../apps/unreal/Source/SHI/ShiJinyangInput.h"
#include "../apps/unreal/Source/SHI/ShiJinyangLayout.h"
#include "../apps/unreal/Source/SHI/ShiJinyangCamera.h"
#include <cassert>
#include <cstdio>
#include <limits>

using namespace ShiJinyangInput;
bool Near(float A,float B) { return std::abs(A-B)<.002f; }
int main()
{
    assert(DeadZone(.1f,0).X==0);
    assert(DeadZone(.15f,0).X==0);
    assert(DeadZone(.16f,0).X>0);
    assert(Near(DeadZone(1,0).X,1));
    assert(Near(std::hypot(DeadZone(1,1).X,DeadZone(1,1).Y),1));
    const auto Diagonal=Resolve(1,1,0,0,0,0,0,0,0,0,1.f/60);
    assert(Near(std::hypot(Diagonal.Forward,Diagonal.Side),1));
    const auto Both=Resolve(1,1,0,0,1,1,0,0,0,0,1.f/60);
    assert(Near(std::hypot(Both.Forward,Both.Side),1));
    const auto Opposed=Resolve(-1,0,0,0,0,1,0,0,0,0,1.f/60);
    assert(Near(Opposed.Forward,0));
    for(int Rate:{30,60,120})
    {
        float Yaw=0,Pitch=0;
        for(int Frame=0;Frame<Rate;++Frame)
        {
            const auto A=Resolve(0,0,0,0,0,0,1,0,0,0,1.f/Rate);
            Yaw+=A.Yaw;
            Pitch+=Resolve(0,0,0,0,0,0,0,1,0,0,1.f/Rate).Pitch;
        }
        assert(Near(Yaw,65));assert(Near(Pitch,45));
    }
    const auto Mouse=Resolve(0,0,0,0,0,0,0,0,10,10,1.f/60);
    assert(Near(Mouse.Yaw,1.8f));assert(Near(Mouse.Pitch,1.6f));
    assert(Resolve(0,0,0,1,0,0,0,0,0,0,1.f/60).Pitch>0);
    assert(Resolve(0,0,0,-1,0,0,0,0,0,0,1.f/60).Pitch<0);
    assert(Resolve(0,0,0,0,0,0,1,0,0,0,20).Yaw<=3.25f);
    const float Bad=std::numeric_limits<float>::quiet_NaN();
    const auto Invalid=Resolve(Bad,Bad,Bad,Bad,Bad,Bad,Bad,Bad,Bad,Bad,Bad);
    assert(Invalid.Forward==0 && Invalid.Side==0 && Invalid.Yaw==0 && Invalid.Pitch==0);
    assert(Resolve(0,0,0,0,0,0,1,0,0,0,-1).Yaw==0);
    // A 48-unit control must remain 48 logical units after the engine's DPI curve.
    for(float Platform:{1.f,2.f,3.f})for(float Game:{.444f,.667f,1.f,2.f})
    {
        const float Compensation=ShiJinyangLayout::TouchCompensation(Game,Platform);
        assert(Near(48.f*Game/Platform*Compensation,48.f));
        assert(Near(48.f*Game*Compensation,48.f*Platform));
    }
    assert(ShiJinyangLayout::TouchCompensation(Bad,Bad)==1.f);
    assert(ShiJinyangLayout::TouchCompensation(0,-1)==1.f);
    for(auto View:{FStick{844,390},FStick{390,844},FStick{320,568},FStick{1280,720}})
    {
        const auto Layout=ShiJinyangLayout::Resolve(View.X,View.Y);
        assert(Layout.CardWidth<=View.X-32 && Layout.CardHeight<=View.Y-32);
        assert(Layout.CommandWidth<=View.X-32 && Layout.CommandHeight+214<=View.Y);
        assert(Layout.NavigationWidth==View.X-32);
    }
    assert(std::isfinite(ShiJinyangLayout::Resolve(Bad,Bad).CardWidth));
    using namespace ShiJinyangCamera;
    assert(SubjectIndex("brace")==16 && SubjectIndex("diversion")==17 && SubjectIndex("escape")==12);
    for(auto Id:{"quiet-han","quiet-wei","escort-han","escort-wei","relay"})assert(SubjectIndex(Id)==18);
    for(auto Id:{"wait","execute","withdraw","early-date","aligned-date","open-water","invented-han"})
        assert(SubjectIndex(Id)==-1);
    for(int Mask=0;Mask<32;++Mask)
        assert(ShouldTrack(Mask&1,Mask&2,Mask&4,Mask&8,Mask&16)==(Mask==17));
    for(float Aspect:{320.f/568,4.f/3,16.f/9,844.f/390,4.f})
    {
        const float Radius=900, Distance=RouteDistance(Radius,60,Aspect);
        const float AngularRadius=std::asin(Radius/Distance);
        assert(AngularRadius < 60.f*.00872664626f);
        assert(AngularRadius < std::atan(std::tan(60.f*.00872664626f)/Aspect));
    }
    assert(RouteDistance(900,60,844.f/390)>RouteDistance(900,60,4.f/3));
    assert(std::isfinite(RouteDistance(Bad,Bad,Bad)) && RouteDistance(-1,0,0)>0);
    std::puts("Jinyang input/layout/camera: input rates and bounds, density compensation, action subjects, manual/reduced-motion policy and route framing pass.");
}
