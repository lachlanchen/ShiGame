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

        private static readonly string[] GuideKeys =
        {
            "guide", "guideTitle", "guideIntro", "guideFieldTitle", "guideFieldText", "guideMoveTitle", "guideMoveText",
            "guideReplyTitle", "guideReplyText", "controllerReady", "controllerOptional", "controllerHint", "guideContinue", "recordEmpty",
        };

        private static readonly Dictionary<string, string[]> GuideValues = new()
        {
            ["en"] = new[] { "Field guide", "Before the first order", "Every order changes the position twice. Read what you shape—and what can answer.", "Read the field", "Grain, trust, momentum, people, and exposure are different forms of power. No single meter is victory.", "Make your move", "A card shows exact immediate effects and the strategic form you are trying to create.", "Expect an answer", "The forecast warns what you expose. After commitment, the position answers and its deltas are recorded separately.", "Controller ready", "Controller supported", "D-pad/stick select · A/Cross commit · B/Circle close · shoulders open ledgers · Start guide", "Read the position", "Your decisions will be impressed here like marks in wet clay." },
            ["ar"] = new[] { "دليل الميدان", "قبل إصدار الأمر الأول", "كل أمر يغيّر الموقف مرتين. اقرأ ما تصوغه وما قد يرد عليك.", "اقرأ الميدان", "المؤن والثقة والزخم والناس والانكشاف أشكال مختلفة للقوة. لا يعني مقياس واحد النصر.", "اصنع حركتك", "تعرض البطاقة الآثار الفورية الدقيقة والشكل الاستراتيجي الذي تحاول صنعه.", "توقّع الرد", "ينبهك التوقع إلى ما تكشفه. بعد الالتزام يرد الموقف وتُسجل تغيراته منفصلة.", "وحدة التحكم جاهزة", "وحدة التحكم مدعومة", "العصا/الأسهم: اختيار · A/×: تأكيد · B/○: إغلاق · الكتفان للسجلات · Start للدليل", "اقرأ الموقف", "ستُطبع قراراتك هنا كعلامات في طين مبتل." },
            ["de"] = new[] { "Feldführer", "Vor dem ersten Befehl", "Jeder Befehl verändert die Lage zweimal. Lies, was du formst – und was antworten kann.", "Lies das Feld", "Getreide, Vertrauen, Dynamik, Menschen und Entdeckung sind verschiedene Formen von Macht. Kein einzelner Wert bedeutet Sieg.", "Setze deinen Zug", "Eine Karte zeigt die genauen Sofortwirkungen und die strategische Form, die du schaffen willst.", "Erwarte eine Antwort", "Die Prognose warnt vor deiner offenen Flanke. Nach der Bindung antwortet die Lage; ihre Änderungen werden getrennt notiert.", "Controller bereit", "Controller unterstützt", "Steuerkreuz/Stick wählen · A/Kreuz bestätigen · B/Kreis schließen · Schultertasten öffnen Register · Start öffnet den Führer", "Lage lesen", "Deine Entscheidungen werden hier wie Spuren in nassem Ton geprägt." },
            ["es"] = new[] { "Guía de campo", "Antes de la primera orden", "Cada orden cambia la posición dos veces. Lee lo que formas y lo que puede responder.", "Lee el campo", "Grano, confianza, impulso, pueblo y exposición son formas distintas de poder. Ningún indicador por sí solo es la victoria.", "Haz tu movimiento", "Una carta muestra los efectos inmediatos exactos y la forma estratégica que intentas crear.", "Espera una respuesta", "El pronóstico advierte qué dejas expuesto. Tras comprometerte, la posición responde y sus cambios quedan registrados aparte.", "Mando listo", "Compatible con mando", "Cruceta/palanca para elegir · A/Cruz confirma · B/Círculo cierra · botones superiores abren registros · Start abre la guía", "Leer la posición", "Tus decisiones quedarán aquí como marcas en arcilla húmeda." },
            ["fr"] = new[] { "Guide de terrain", "Avant le premier ordre", "Chaque ordre change deux fois la position. Lisez ce que vous formez — et ce qui peut répondre.", "Lisez le terrain", "Grain, confiance, élan, peuple et exposition sont des formes distinctes de pouvoir. Une seule jauge ne signifie jamais la victoire.", "Jouez votre coup", "Une carte montre les effets immédiats exacts et la forme stratégique que vous tentez de créer.", "Attendez une réponse", "La prévision signale ce que vous exposez. Après l'engagement, la position répond et ses écarts sont consignés séparément.", "Manette prête", "Manette prise en charge", "Croix/stick pour choisir · A/Croix confirme · B/Rond ferme · boutons supérieurs ouvrent les registres · Start ouvre le guide", "Lire la position", "Vos décisions s'imprimeront ici comme des marques dans l'argile humide." },
            ["ja"] = new[] { "戦場案内", "最初の命令の前に", "一つの命令は局面を二度変える。自分が作る形と、それに応じる力を読もう。", "場を読む", "兵糧、信頼、勢い、民衆、露見はそれぞれ異なる力の形だ。一つの値だけで勝利は決まらない。", "一手を打つ", "札には即時の正確な変化と、作ろうとする戦略的な形が示される。", "応手を待つ", "予兆は露出する弱みを告げる。決断後、局面が応じ、その変化は別に記録される。", "コントローラー準備完了", "コントローラー対応", "十字/スティックで選択 · A/×で決定 · B/○で閉じる · 肩ボタンで台帳 · Startで案内", "局面を読む", "決断は濡れた粘土の跡のようにここへ刻まれます。" },
            ["ko"] = new[] { "전장 안내", "첫 명령을 내리기 전에", "하나의 명령은 국면을 두 번 바꾼다. 내가 만드는 형세와 되돌아올 응수를 읽어라.", "판을 읽어라", "군량, 신뢰, 기세, 민심, 노출은 서로 다른 힘의 형태다. 하나의 수치만으로 승리할 수 없다.", "수를 두어라", "선택지는 즉시 일어나는 정확한 변화와 만들려는 전략적 형세를 보여 준다.", "응수를 예상하라", "예고는 드러나는 약점을 알린다. 결단 뒤 국면이 응수하며 그 변화는 따로 기록된다.", "컨트롤러 준비됨", "컨트롤러 지원", "십자/스틱 선택 · A/× 결정 · B/○ 닫기 · 숄더 버튼으로 장부 · Start로 안내", "국면 읽기", "결정은 젖은 진흙 자국처럼 이곳에 새겨집니다." },
            ["ru"] = new[] { "Полевое руководство", "Перед первым приказом", "Каждый приказ дважды меняет позицию. Читайте, что вы создаёте — и что может ответить.", "Прочтите поле", "Зерно, доверие, порыв, люди и раскрытие — разные формы власти. Ни один показатель сам по себе не означает победу.", "Сделайте ход", "Карточка показывает точные немедленные эффекты и стратегическую форму, которую вы пытаетесь создать.", "Ждите ответа", "Прогноз предупреждает, что вы открываете. После решения позиция отвечает, а её изменения записываются отдельно.", "Геймпад готов", "Геймпад поддерживается", "Крестовина/стик — выбор · A/Крест — решение · B/Круг — закрыть · бамперы открывают записи · Start открывает руководство", "Прочесть позицию", "Решения отпечатаются здесь, как знаки на сырой глине." },
            ["vi"] = new[] { "Cẩm nang chiến trường", "Trước mệnh lệnh đầu tiên", "Mỗi mệnh lệnh đổi thế cục hai lần. Hãy đọc điều bạn tạo ra và điều có thể đáp lại.", "Đọc bàn thế", "Lương, tín, thế, dân và bại lộ là những dạng quyền lực khác nhau. Không một chỉ số nào tự nó là chiến thắng.", "Đi nước của bạn", "Mỗi thẻ cho biết thay đổi tức thời chính xác và thế chiến lược bạn muốn tạo.", "Chờ thế cục đáp lại", "Dự báo chỉ ra điểm bạn để lộ. Sau khi cam kết, thế cục đáp lại và biến đổi của nó được ghi riêng.", "Tay cầm đã sẵn sàng", "Có hỗ trợ tay cầm", "D-pad/cần để chọn · A/Dấu chéo xác nhận · B/Vòng tròn đóng · nút vai mở sổ · Start mở hướng dẫn", "Đọc thế cục", "Quyết định sẽ in tại đây như dấu trên đất sét ướt." },
            ["zh-Hans"] = new[] { "观势入门", "第一道命令之前", "每一道命令都会让局势变化两次。看清你塑造的形，也看清可能到来的应手。", "先读全局", "粮、信、势、民、险是五种不同的力量。任何一个数值都不等于胜利。", "再落一子", "选择牌会显示准确的即时变化，以及你试图塑造的战略形势。", "预判应手", "压力预兆指出你暴露的弱点。承诺之后，局势会应手，其变化会被单独记录。", "手柄已就绪", "支持手柄", "方向键/摇杆选择 · A/叉确认 · B/圈关闭 · 肩键打开简牍 · Start打开入门", "开始观势", "你的选择会像湿泥上的刻痕一样留在这里。" },
            ["zh-Hant"] = new[] { "觀勢入門", "第一道命令之前", "每一道命令都會讓局勢變化兩次。看清你塑造的形，也看清可能到來的應手。", "先讀全局", "糧、信、勢、民、險是五種不同的力量。任何一個數值都不等於勝利。", "再落一子", "選擇牌會顯示準確的即時變化，以及你試圖塑造的戰略形勢。", "預判應手", "壓力預兆指出你暴露的弱點。承諾之後，局勢會應手，其變化會被單獨記錄。", "手把已就緒", "支援手把", "方向鍵/搖桿選擇 · A/叉確認 · B/圈關閉 · 肩鍵打開簡牘 · Start打開入門", "開始觀勢", "你的選擇會像濕泥上的刻痕一樣留在這裡。" },
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
            if (index >= 0)
            {
                var values = Values.TryGetValue(locale, out var localized) ? localized : Values["en"];
                return values[index];
            }
            index = Array.IndexOf(GuideKeys, key);
            if (index < 0) return key;
            var guideValues = GuideValues.TryGetValue(locale, out var localizedGuide) ? localizedGuide : GuideValues["en"];
            return guideValues[index];
        }

        public static string LocaleName(string locale) => LocaleNames.TryGetValue(locale, out var name) ? name : locale;
    }
}
