using System;
using System.Collections.Generic;

namespace SHI
{
    public static class ShiUiText
    {
        private static readonly string[] Keys =
        {
            "begin", "continue", "language", "sources", "restart",
            "grain", "trust", "momentum", "people", "danger",
            "endingWildfire", "endingRoots", "endingWatchful", "opening",
        };

        private static readonly Dictionary<string, string[]> Values = new()
        {
            ["en"] = new[] { "Enter the rain", "Continue", "Language", "Sources", "Restart chapter", "Grain", "Trust", "Momentum", "People", "Exposure", "Wildfire", "Deep Roots", "Watchful Strategist", "Power is not a possession. It is the shape made by people, terrain, time, and belief." },
            ["ar"] = new[] { "ادخل المطر", "متابعة", "اللغة", "المصادر", "إعادة الفصل", "المؤن", "الثقة", "الزخم", "الناس", "الانكشاف", "نار البراري", "جذور عميقة", "الاستراتيجي المترقّب", "القوة ليست ملكية؛ إنها الهيئة التي يصنعها الناس والأرض والوقت والاعتقاد." },
            ["de"] = new[] { "In den Regen", "Fortsetzen", "Sprache", "Quellen", "Kapitel neu starten", "Getreide", "Vertrauen", "Dynamik", "Menschen", "Entdeckung", "Lauffeuer", "Tiefe Wurzeln", "Wachsamer Stratege", "Macht ist kein Besitz. Sie ist die Form, die Menschen, Gelände, Zeit und Glaube bilden." },
            ["es"] = new[] { "Entrar en la lluvia", "Continuar", "Idioma", "Fuentes", "Reiniciar capítulo", "Grano", "Confianza", "Impulso", "Pueblo", "Exposición", "Incendio", "Raíces profundas", "Estratega vigilante", "El poder no se posee. Es la forma creada por personas, terreno, tiempo y creencias." },
            ["fr"] = new[] { "Entrer dans la pluie", "Continuer", "Langue", "Sources", "Recommencer", "Grain", "Confiance", "Élan", "Peuple", "Exposition", "Feu de brousse", "Racines profondes", "Stratège vigilant", "Le pouvoir n'est pas un bien. C'est la forme créée par les êtres, le terrain, le temps et la croyance." },
            ["ja"] = new[] { "雨の中へ", "続ける", "言語", "史料", "章をやり直す", "兵糧", "信頼", "勢い", "民衆", "露見", "野火", "深い根", "観勢の策士", "力は所有物ではない。人・地形・時・信が織りなす形である。" },
            ["ko"] = new[] { "빗속으로", "계속", "언어", "사료", "장 다시 시작", "군량", "신뢰", "기세", "민심", "노출", "들불", "깊은 뿌리", "관망하는 전략가", "힘은 소유물이 아니다. 사람과 지형, 시간과 믿음이 만드는 형세다." },
            ["ru"] = new[] { "Войти под дождь", "Продолжить", "Язык", "Источники", "Начать главу заново", "Зерно", "Доверие", "Порыв", "Люди", "Раскрытие", "Степной пожар", "Глубокие корни", "Бдительный стратег", "Власть — не вещь. Это форма, созданная людьми, местностью, временем и верой." },
            ["vi"] = new[] { "Bước vào mưa", "Tiếp tục", "Ngôn ngữ", "Nguồn", "Chơi lại chương", "Lương", "Tín", "Thế", "Dân", "Bại lộ", "Lửa đồng", "Rễ sâu", "Người quan thế", "Quyền lực không phải vật sở hữu. Nó là thế do người, đất, thời và lòng tin tạo nên." },
            ["zh-Hans"] = new[] { "走入这场雨", "继续旧局", "语言", "史料", "重开本章", "粮", "信", "势", "民", "险", "野火", "深根", "观势者", "势不是可以占有的东西。它是人、地、时与信念共同形成的形。" },
            ["zh-Hant"] = new[] { "走入這場雨", "繼續舊局", "語言", "史料", "重開本章", "糧", "信", "勢", "民", "險", "野火", "深根", "觀勢者", "勢不是可以佔有的東西。它是人、地、時與信念共同形成的形。" },
        };

        private static readonly Dictionary<string, string> LocaleNames = new()
        {
            ["en"] = "English", ["ar"] = "العربية", ["de"] = "Deutsch", ["es"] = "Español",
            ["fr"] = "Français", ["ja"] = "日本語", ["ko"] = "한국어", ["ru"] = "Русский",
            ["vi"] = "Tiếng Việt", ["zh-Hans"] = "简体中文", ["zh-Hant"] = "繁體中文",
        };

        public static string Get(string locale, string key)
        {
            var index = Array.IndexOf(Keys, key);
            if (index < 0) return key;
            var values = Values.TryGetValue(locale, out var localized) ? localized : Values["en"];
            return values[index];
        }

        public static string LocaleName(string locale) => LocaleNames.TryGetValue(locale, out var name) ? name : locale;
    }
}
