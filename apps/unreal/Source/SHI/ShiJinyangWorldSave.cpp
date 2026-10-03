#include "ShiJinyangWorldSave.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"

bool FShiJinyangWorldSave::Read(const FString& Text,const TSet<FString>& KnownPlaces,FShiJinyangWorldSave& Out)
{
    if (Text.Len()>16384) return false;
    TSharedPtr<FJsonObject> J;
    if (!FJsonSerializer::Deserialize(TJsonReaderFactory<>::Create(Text),J) || !J) return false;
    double Revision=0;
    if (!J->HasTypedField<EJson::Number>(TEXT("revision")) || !J->TryGetNumberField(TEXT("revision"),Revision) || Revision!=1) return false;
    const TArray<TSharedPtr<FJsonValue>>* P=nullptr;
    if (!J->TryGetArrayField(TEXT("position"),P) || P->Num()!=3) return false;
    double X,Y,Z;
    for(const auto& N:*P)if(!N.IsValid() || N->Type!=EJson::Number)return false;
    if (!(*P)[0]->TryGetNumber(X) || !(*P)[1]->TryGetNumber(Y) || !(*P)[2]->TryGetNumber(Z)) return false;
    FVector Position(X,Y,Z);
    if (Position.ContainsNaN() || X < -2500 || X > 2300 || Y < -1450 || Y > 1380 || Z < 80 || Z > 700) return false;
    FShiJinyangWorldSave Candidate;Candidate.Position=Position;
    const TArray<TSharedPtr<FJsonValue>>* R=nullptr;
    if (J->TryGetArrayField(TEXT("look"),R))
    {
        double Pitch,Yaw;
        if (R->Num()!=2 || (*R)[0]->Type!=EJson::Number || (*R)[1]->Type!=EJson::Number || !(*R)[0]->TryGetNumber(Pitch) || !(*R)[1]->TryGetNumber(Yaw)
            || !FMath::IsFinite(Pitch) || !FMath::IsFinite(Yaw)) return false;
        Candidate.Look=FRotator(FMath::Clamp(Pitch,-50.,12.),FRotator::NormalizeAxis(Yaw),0);
    }
    J->TryGetBoolField(TEXT("eyeLevel"),Candidate.bEyeLevel);
    const TArray<TSharedPtr<FJsonValue>>* V=nullptr;
    if (J->TryGetArrayField(TEXT("visited"),V)) for (const auto& Value:*V)
    {
        FString Id;
        if (Value->TryGetString(Id) && KnownPlaces.Contains(Id)) Candidate.Visited.Add(Id);
    }
    Out=MoveTemp(Candidate);return true;
}
FString FShiJinyangWorldSave::Write() const
{
    auto J=MakeShared<FJsonObject>();J->SetNumberField(TEXT("revision"),1);
    J->SetArrayField(TEXT("position"),{MakeShared<FJsonValueNumber>(Position.X),MakeShared<FJsonValueNumber>(Position.Y),MakeShared<FJsonValueNumber>(Position.Z)});
    J->SetArrayField(TEXT("look"),{MakeShared<FJsonValueNumber>(Look.Pitch),MakeShared<FJsonValueNumber>(Look.Yaw)});
    J->SetBoolField(TEXT("eyeLevel"),bEyeLevel);
    TArray<TSharedPtr<FJsonValue>> V;TArray<FString> Names=Visited.Array();Names.Sort();
    for (const auto& N:Names)V.Add(MakeShared<FJsonValueString>(N));J->SetArrayField(TEXT("visited"),V);
    FString Data;FJsonSerializer::Serialize(J,TJsonWriterFactory<>::Create(&Data));return Data;
}
