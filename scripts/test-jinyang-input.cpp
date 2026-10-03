#include "../apps/unreal/Source/SHI/ShiJinyangInput.h"
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
    std::puts("Jinyang native input: dead zone, bounded diagonal/mixed input, 30/60/120 fps look, mouse, resume clamp and invalid values pass.");
}
