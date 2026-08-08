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
            "consequence", "pressureForecast", "pressureResponse", "failed", "captured", "scattered",
        };

        private static readonly Dictionary<string, string[]> Values = new()
        {
            ["en"] = new[] { "Enter the rain", "Continue", "Language", "Sources", "Restart chapter", "Grain", "Trust", "Momentum", "People", "Exposure", "Wildfire", "Deep Roots", "Watchful Strategist", "Power is not a possession. It is the shape made by people, terrain, time, and belief.", "Consequence", "Pressure forecast", "The position answers", "The network broke", "State pursuit closed around the column.", "The movement lost the people needed to continue." },
            ["ar"] = new[] { "ادخل المطر", "متابعة", "اللغة", "المصادر", "إعادة الفصل", "المؤن", "الثقة", "الزخم", "الناس", "الانكشاف", "نار البراري", "جذور عميقة", "الاستراتيجي المترقّب", "القوة ليست ملكية؛ إنها الهيئة التي يصنعها الناس والأرض والوقت والاعتقاد.", "النتيجة", "توقّع الضغط", "الموقف يجيب", "انكسرت الشبكة", "أطبق مطاردو الدولة على القافلة.", "فقدت الحركة من تحتاج إليهم للاستمرار." },
            ["de"] = new[] { "In den Regen", "Fortsetzen", "Sprache", "Quellen", "Kapitel neu starten", "Getreide", "Vertrauen", "Dynamik", "Menschen", "Entdeckung", "Lauffeuer", "Tiefe Wurzeln", "Wachsamer Stratege", "Macht ist kein Besitz. Sie ist die Form, die Menschen, Gelände, Zeit und Glaube bilden.", "Folge", "Druckanzeichen", "Die Lage antwortet", "Das Netz zerbrach", "Die Verfolger des Staates schlossen den Zug ein.", "Der Bewegung fehlten die Menschen zum Weitermachen." },
            ["es"] = new[] { "Entrar en la lluvia", "Continuar", "Idioma", "Fuentes", "Reiniciar capítulo", "Grano", "Confianza", "Impulso", "Pueblo", "Exposición", "Incendio", "Raíces profundas", "Estratega vigilante", "El poder no se posee. Es la forma creada por personas, terreno, tiempo y creencias.", "Consecuencia", "Señal de presión", "La posición responde", "La red se quebró", "La persecución estatal cercó a la columna.", "El movimiento perdió a la gente necesaria para continuar." },
            ["fr"] = new[] { "Entrer dans la pluie", "Continuer", "Langue", "Sources", "Recommencer", "Grain", "Confiance", "Élan", "Peuple", "Exposition", "Feu de brousse", "Racines profondes", "Stratège vigilant", "Le pouvoir n'est pas un bien. C'est la forme créée par les êtres, le terrain, le temps et la croyance.", "Conséquence", "Signe de pression", "La position répond", "Le réseau s'est rompu", "La poursuite de l'État a encerclé la colonne.", "Le mouvement a perdu les personnes nécessaires pour continuer." },
            ["ja"] = new[] { "雨の中へ", "続ける", "言語", "史料", "章をやり直す", "兵糧", "信頼", "勢い", "民衆", "露見", "野火", "深い根", "観勢の策士", "力は所有物ではない。人・地形・時・信が織りなす形である。", "結果", "圧力の兆し", "局面の応手", "網が崩れた", "国家の追手が隊列を包囲した。", "運動を続けるための人々を失った。" },
            ["ko"] = new[] { "빗속으로", "계속", "언어", "사료", "장 다시 시작", "군량", "신뢰", "기세", "민심", "노출", "들불", "깊은 뿌리", "관망하는 전략가", "힘은 소유물이 아니다. 사람과 지형, 시간과 믿음이 만드는 형세다.", "결과", "압력 예고", "국면의 응수", "연결망 붕괴", "국가의 추격대가 행렬을 포위했다.", "운동을 이어갈 사람들을 잃었다." },
            ["ru"] = new[] { "Войти под дождь", "Продолжить", "Язык", "Источники", "Начать главу заново", "Зерно", "Доверие", "Порыв", "Люди", "Раскрытие", "Степной пожар", "Глубокие корни", "Бдительный стратег", "Власть — не вещь. Это форма, созданная людьми, местностью, временем и верой.", "Следствие", "Признак давления", "Позиция отвечает", "Сеть распалась", "Государственная погоня окружила колонну.", "Движение потеряло людей, нужных для продолжения." },
            ["vi"] = new[] { "Bước vào mưa", "Tiếp tục", "Ngôn ngữ", "Nguồn", "Chơi lại chương", "Lương", "Tín", "Thế", "Dân", "Bại lộ", "Lửa đồng", "Rễ sâu", "Người quan thế", "Quyền lực không phải vật sở hữu. Nó là thế do người, đất, thời và lòng tin tạo nên.", "Hệ quả", "Dấu hiệu áp lực", "Thế cục đáp lại", "Mạng lưới tan vỡ", "Quân truy đuổi đã khép vòng quanh đoàn người.", "Phong trào mất những người cần để tiếp tục." },
            ["zh-Hans"] = new[] { "走入这场雨", "继续旧局", "语言", "史料", "重开本章", "粮", "信", "势", "民", "险", "野火", "深根", "观势者", "势不是可以占有的东西。它是人、地、时与信念共同形成的形。", "后果", "压力预兆", "局势应手", "网络已断", "秦吏追捕合围了队伍。", "队伍失去了继续行动所需的人。" },
            ["zh-Hant"] = new[] { "走入這場雨", "繼續舊局", "語言", "史料", "重開本章", "糧", "信", "勢", "民", "險", "野火", "深根", "觀勢者", "勢不是可以佔有的東西。它是人、地、時與信念共同形成的形。", "後果", "壓力預兆", "局勢應手", "網絡已斷", "秦吏追捕合圍了隊伍。", "隊伍失去了繼續行動所需的人。" },
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
