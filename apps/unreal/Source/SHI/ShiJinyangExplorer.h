#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "ShiJinyangExplorer.generated.h"
class AShiJinyangFigure;
class UCameraComponent;
class USpringArmComponent;

/** Walking presentation of the command viewpoint; exploration never spends a campaign order. */
UCLASS()
class SHI_API AShiJinyangExplorer : public ACharacter
{
    GENERATED_BODY()
public:
    AShiJinyangExplorer();
    virtual void BeginPlay() override;
    virtual void Tick(float DeltaSeconds) override;
    void Drive(float Forward, float Side, float Yaw, float Pitch, bool Sprint, float Dt);
    void SetWalkingEnabled(bool Enabled);
    void SetEyeLevel(bool Enabled);
    bool IsEyeLevel() const { return bEyeLevel; }
    void SetReducedMotion(bool Enabled);
    UPROPERTY() TObjectPtr<UCameraComponent> View;
private:
    UPROPERTY() TObjectPtr<USpringArmComponent> Boom;
    TWeakObjectPtr<AShiJinyangFigure> Body;
    FVector LastDryPosition;
    bool bWalkingEnabled = true;
    bool bEyeLevel = false;
};
