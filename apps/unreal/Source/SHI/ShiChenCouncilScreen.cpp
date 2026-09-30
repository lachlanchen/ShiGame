#include "ShiChenCouncilScreen.h"
#include "Dom/JsonObject.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"
#include "Widgets/Input/SButton.h"
#include "Widgets/Layout/SBorder.h"
#include "Widgets/Layout/SScrollBox.h"
#include "Widgets/SBoxPanel.h"
#include "Widgets/Text/STextBlock.h"
#include "Styling/CoreStyle.h"

void SShiChenCouncilScreen::Construct(const FArguments& Args)
{
    Locale = Args._Locale;
    Close = Args._OnClose;
    FString Json, Bound;
    FShiChenCouncilModel Entry;
    TSharedPtr<FJsonObject> Binding;
    if (!Args._Chapter || !FFileHelper::LoadFileToString(Json, *(FPaths::ProjectContentDir() / TEXT("StreamingAssets/chen-council.v1.json")))
        || !FJsonSerializer::Deserialize(TJsonReaderFactory<>::Create(Json), Definition)
        || !Entry.InitializeFromChapter(Json, *Args._Chapter, Error) || !Entry.ExportSaveJson(Bound, Error)
        || !FJsonSerializer::Deserialize(TJsonReaderFactory<>::Create(Bound), Binding))
    { if (Error.IsEmpty()) Error = TEXT("Council content is unavailable"); }
    else
    {
        // Separate chronicles retain their own council; never replace another run.
        FString Key = Binding->GetStringField(TEXT("entryId"));
        Arrival = Binding->GetStringField(TEXT("arrival"));
        Key.ReplaceInline(TEXT(":"), TEXT("-"));
        Session.Open(Json, *Args._Chapter, FPaths::ProjectSavedDir() / TEXT("SaveGames/ChenCouncil") / (Key + TEXT(".json")), Error);
        bResponse = !Session.GetModel().GetHistory().IsEmpty();
    }
    Refresh();
}

FString SShiChenCouncilScreen::Text(const TSharedPtr<FJsonObject>& Object, const TCHAR* Field) const
{
    const TSharedPtr<FJsonObject>* Localized = nullptr;
    FString Result;
    if (Object && Object->TryGetObjectField(Field, Localized) && Localized && *Localized)
        if (!(*Localized)->TryGetStringField(Locale, Result)) (*Localized)->TryGetStringField(TEXT("en"), Result);
    return Result;
}

TSharedPtr<FJsonObject> SShiChenCouncilScreen::Choice(const FString& Id) const
{
    if (Definition) for (const auto& Round : Definition->GetArrayField(TEXT("rounds")))
        for (const auto& Value : Round->AsObject()->GetArrayField(TEXT("choices")))
            if (Value->AsObject()->GetStringField(TEXT("id")) == Id) return Value->AsObject();
    return nullptr;
}

FString SShiChenCouncilScreen::Metrics(const TMap<FString, int32>& Values) const
{
    TArray<FString> Parts;
    for (const TCHAR* Key : {TEXT("grain"), TEXT("tempo"), TEXT("city"), TEXT("allies"), TEXT("veterans")})
        Parts.Add(FString::Printf(TEXT("%s: %d / 10"), *Text(Definition->GetObjectField(TEXT("metrics"))->GetObjectField(Key), TEXT("title")), Values.FindRef(Key)));
    return FString::Join(Parts, TEXT("   ·   "));
}

void SShiChenCouncilScreen::Refresh()
{
    TSharedRef<SVerticalBox> Body = SNew(SVerticalBox);
    auto Paragraph = [&Body](const FString& Value, int32 Size = 19)
    {
        if (!Value.IsEmpty()) Body->AddSlot().AutoHeight().Padding(0, 8)[SNew(STextBlock).AutoWrapText(true)
            .ColorAndOpacity(FLinearColor(0.94f, 0.91f, 0.83f)).Font(FCoreStyle::GetDefaultFontStyle("Regular", Size)).Text(FText::FromString(Value))];
    };
    auto Button = [&Body](const FString& Value, FOnClicked Action, bool Enabled = true)
    {
        Body->AddSlot().AutoHeight().Padding(0, 7)[SNew(SButton).ContentPadding(14).IsEnabled(Enabled).OnClicked(Action)
            [SNew(STextBlock).AutoWrapText(true).Font(FCoreStyle::GetDefaultFontStyle("Regular", 18)).Text(FText::FromString(Value))]];
    };
    Paragraph(Text(Definition, TEXT("title")), 30);
    Paragraph(Text(Definition, TEXT("boundary")), 16);
    if (Locale != TEXT("en") && Locale != TEXT("zh-Hans")) Paragraph(TEXT("Council translation unavailable in this language; English text is shown."), 16);
    if (!Error.IsEmpty()) Paragraph(Error);
    if (Session.IsOpen())
    {
        const auto& Model = Session.GetModel();
        const auto Labels = Definition->GetObjectField(TEXT("labels"));
        Paragraph(Text(Definition->GetObjectField(TEXT("arrivals"))->GetObjectField(Arrival), TEXT("title")), 19);
        Paragraph(Metrics(Model.GetMetrics()));
        Paragraph(Text(Definition, TEXT("objective")), 16);
        if (Session.IsRestartArmed())
        {
            Paragraph(Text(Labels, TEXT("confirmRetry")), 25);
            Button(Text(Labels, TEXT("reset")), FOnClicked::CreateSP(this, &SShiChenCouncilScreen::ConfirmRestart));
            Button(Text(Labels, TEXT("cancel")), FOnClicked::CreateSP(this, &SShiChenCouncilScreen::CancelRestart));
        }
        else if (bResponse)
        {
            const auto& Turn = Model.GetHistory().Last();
            const auto Offer = Choice(Turn.ChoiceId);
            Paragraph(Text(Labels, TEXT("response")), 25);
            Paragraph(Text(Offer, TEXT("title")));
            Paragraph(Text(Offer, TEXT("response")));
            Paragraph(Metrics(Turn.Before) + TEXT("\n→ ") + Metrics(Turn.After), 16);
            const TArray<TSharedPtr<FJsonValue>>* Answers = nullptr;
            if (Offer->TryGetArrayField(TEXT("answers"), Answers)) for (const auto& Answer : *Answers)
                for (int32 I = 0; I + 1 < Model.GetHistory().Num(); ++I)
                    if (Model.GetHistory()[I].ChoiceId == Answer->AsObject()->GetStringField(TEXT("afterChoice")))
                        Paragraph(Text(Answer->AsObject(), TEXT("text")));
            Button(Text(Labels, Model.IsCompleted() ? TEXT("conclude") : TEXT("continue")), FOnClicked::CreateSP(this, &SShiChenCouncilScreen::Continue));
        }
        else if (Model.IsCompleted())
        {
            const auto Outcome = Definition->GetObjectField(TEXT("outcomes"))->GetObjectField(Model.GetOutcome());
            Paragraph(Text(Outcome, TEXT("title")), 25);
            Paragraph(Text(Outcome, TEXT("text")));
            Paragraph(Text(Labels, TEXT("journal")), 24);
            for (const auto& Turn : Model.GetHistory())
            {
                Paragraph(Text(Choice(Turn.ChoiceId), TEXT("title")));
                Paragraph(Text(Choice(Turn.ChoiceId), TEXT("response")));
                Paragraph(Metrics(Turn.Before) + TEXT("\n→ ") + Metrics(Turn.After), 16);
            }
            const auto History = Definition->GetObjectField(TEXT("history"));
            Paragraph(Text(History, TEXT("title")), 24);
            Paragraph(Text(History, TEXT("account")));
            Paragraph(Text(History, TEXT("distinction")), 16);
            for (const auto& Source : History->GetArrayField(TEXT("sources")))
                Paragraph(Source->AsObject()->GetStringField(TEXT("title")) + TEXT(" · ") + Source->AsObject()->GetStringField(TEXT("locator")), 16);
            Button(Text(Labels, TEXT("retry")), FOnClicked::CreateSP(this, &SShiChenCouncilScreen::ArmRestart));
        }
        else
        {
            if (Model.GetHistory().IsEmpty()) Paragraph(Text(Definition, TEXT("introduction")));
            Paragraph(FString::Printf(TEXT("%s %d / 3"), *Text(Labels, TEXT("round")), Model.GetHistory().Num() + 1), 16);
            const auto Round = Definition->GetArrayField(TEXT("rounds"))[Model.GetHistory().Num()]->AsObject();
            Paragraph(Text(Round, TEXT("title")), 25);
            Paragraph(Text(Round, TEXT("context")));
            for (const auto& Id : Model.GetChoices())
                Button(Text(Choice(Id), TEXT("title")), FOnClicked::CreateSP(this, &SShiChenCouncilScreen::Select, Id));
            if (!Selected.IsEmpty())
            {
                const auto Offer = Choice(Selected);
                Paragraph(Text(Offer, TEXT("intent")));
                Paragraph(Text(Offer, TEXT("pledge")));
                FShiChenTurn Preview;
                const bool Available = Model.Preview(Selected, Preview);
                if (Available) Paragraph(Text(Labels, TEXT("preview")) + TEXT("\n") + Metrics(Preview.After));
                else Paragraph(Locale == TEXT("zh-Hans") ? TEXT("目前不足以作出这项承诺。") : TEXT("You cannot afford this commitment."));
                Button(Text(Labels, TEXT("commit")), FOnClicked::CreateSP(this, &SShiChenCouncilScreen::Commit), Available);
            }
        }
    }
    Button(Locale == TEXT("zh-Hans") ? TEXT("返回第一章") : TEXT("Return to Chapter I"), FOnClicked::CreateLambda([this]() { Close.ExecuteIfBound(); return FReply::Handled(); }));
    ChildSlot[SNew(SBorder).Padding(32).BorderImage(FCoreStyle::Get().GetBrush("WhiteBrush"))
        .BorderBackgroundColor(FLinearColor(0.025f, 0.03f, 0.025f, 0.98f))
        [SNew(SScrollBox) + SScrollBox::Slot()[Body]]];
}

FReply SShiChenCouncilScreen::Select(FString Id)
{
    Selected = MoveTemp(Id); Refresh(); return FReply::Handled();
}
FReply SShiChenCouncilScreen::Commit()
{
    if (Session.Commit(Selected, Error)) { Selected.Reset(); bResponse = true; }
    Refresh(); return FReply::Handled();
}
FReply SShiChenCouncilScreen::Continue()
{
    bResponse = false; Refresh(); return FReply::Handled();
}

FReply SShiChenCouncilScreen::ArmRestart()
{
    Session.ArmRestart(); Error.Reset(); Refresh(); return FReply::Handled();
}
FReply SShiChenCouncilScreen::ConfirmRestart()
{
    if (Session.ConfirmRestart(Error)) { Selected.Reset(); bResponse = false; }
    Refresh(); return FReply::Handled();
}
FReply SShiChenCouncilScreen::CancelRestart()
{
    Session.CancelRestart(); Error.Reset(); Refresh(); return FReply::Handled();
}
