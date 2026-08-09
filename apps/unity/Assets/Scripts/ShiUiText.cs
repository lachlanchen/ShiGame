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
            "guideReplyTitle", "guideReplyText", "controllerReady", "controllerOptional", "controllerHint", "guideContinue",
            "newGame", "fieldSignal", "chronicleSeed", "fieldApplied", "recordEmpty",
        };

        private static readonly Dictionary<string, string[]> GuideValues = new()
        {
            ["en"] = new[] { "Field guide", "Before the first order", "Every order resolves in five visible layers: your move, authored pressure, pursuit posture, Qin’s method read, and the disclosed field condition.", "Read the field", "Grain, trust, momentum, people, and exposure are different forms of power. No single meter is victory.", "Make your move", "A card shows exact immediate effects, its strategic method, and whether Qin’s current read will hit it.", "Expect an answer", "Pursuit reads Exposure; Qin’s method read punishes only the disclosed repeated method. Changing method makes that read miss. Every delta is recorded separately.", "Controller ready", "Controller supported", "D-pad/stick select · A/Cross commit · B/Circle close · shoulders open ledgers · Start guide", "Read the position", "New chronicle", "Field signal", "Chronicle seed", "Field condition resolves", "Your decisions will be impressed here like marks in wet clay." },
            ["ar"] = new[] { "دليل الميدان", "قبل إصدار الأمر الأول", "يُحسم كل أمر في خمس طبقات ظاهرة: حركتك، والضغط المؤلَّف، ووضع المطاردة، وقراءة تشين للأسلوب، وظرف الميدان المعلن.", "اقرأ الميدان", "المؤن والثقة والزخم والناس والانكشاف أشكال مختلفة للقوة. لا يعني مقياس واحد النصر.", "اصنع حركتك", "تعرض البطاقة الآثار الفورية الدقيقة وأسلوبها الاستراتيجي وهل ستصيبه قراءة تشين الحالية.", "توقّع الرد", "تقرأ المطاردة الانكشاف، ولا تعاقب قراءة تشين إلا الأسلوب المتكرر المعلن. تغيير الأسلوب يجعل القراءة تخطئ، وتُسجل كل التغيرات منفصلة.", "وحدة التحكم جاهزة", "وحدة التحكم مدعومة", "العصا/الأسهم: اختيار · A/×: تأكيد · B/○: إغلاق · الكتفان للسجلات · Start للدليل", "اقرأ الموقف", "سجل جديد", "إشارة الميدان", "بذرة السجل", "يُحسم ظرف الميدان", "ستُطبع قراراتك هنا كعلامات في طين مبتل." },
            ["de"] = new[] { "Feldführer", "Vor dem ersten Befehl", "Jeder Befehl wird in fünf sichtbaren Ebenen aufgelöst: dein Zug, verfasster Druck, Verfolgungslage, Qins Methodenanalyse und die angekündigte Feldbedingung.", "Lies das Feld", "Getreide, Vertrauen, Dynamik, Menschen und Entdeckung sind verschiedene Formen von Macht. Kein einzelner Wert bedeutet Sieg.", "Setze deinen Zug", "Eine Karte zeigt Sofortwirkungen, strategische Methode und ob Qins aktuelle Analyse trifft.", "Erwarte eine Antwort", "Die Verfolgung liest Entdeckung; Qins Analyse bestraft nur die offengelegte wiederholte Methode. Ein Methodenwechsel lässt sie verfehlen. Jede Änderung wird getrennt notiert.", "Controller bereit", "Controller unterstützt", "Steuerkreuz/Stick wählen · A/Kreuz bestätigen · B/Kreis schließen · Schultertasten öffnen Register · Start öffnet den Führer", "Lage lesen", "Neue Chronik", "Feldsignal", "Chronik-Seed", "Feldlage wirkt", "Deine Entscheidungen werden hier wie Spuren in nassem Ton geprägt." },
            ["es"] = new[] { "Guía de campo", "Antes de la primera orden", "Cada orden se resuelve en cinco capas visibles: tu movimiento, la presión escrita, la postura de persecución, la lectura de método de Qin y la condición anunciada del terreno.", "Lee el campo", "Grano, confianza, impulso, pueblo y exposición son formas distintas de poder. Ningún indicador por sí solo es la victoria.", "Haz tu movimiento", "Una carta muestra efectos inmediatos, método estratégico y si la lectura actual de Qin acertará.", "Espera una respuesta", "La persecución lee la Exposición; Qin solo castiga el método repetido que anuncia. Cambiar de método hace fallar la lectura. Cada cambio queda registrado aparte.", "Mando listo", "Compatible con mando", "Cruceta/palanca para elegir · A/Cruz confirma · B/Círculo cierra · botones superiores abren registros · Start abre la guía", "Leer la posición", "Nueva crónica", "Señal del terreno", "Semilla de crónica", "Se resuelve la condición del terreno", "Tus decisiones quedarán aquí como marcas en arcilla húmeda." },
            ["fr"] = new[] { "Guide de terrain", "Avant le premier ordre", "Chaque ordre se résout en cinq couches visibles : votre coup, la pression écrite, le dispositif de poursuite, la lecture de méthode des Qin et la condition annoncée du terrain.", "Lisez le terrain", "Grain, confiance, élan, peuple et exposition sont des formes distinctes de pouvoir. Une seule jauge ne signifie jamais la victoire.", "Jouez votre coup", "Une carte montre les effets immédiats, la méthode stratégique et si la lecture actuelle des Qin la visera.", "Attendez une réponse", "La poursuite lit l’Exposition ; la lecture des Qin ne punit que la méthode répétée annoncée. Changer de méthode la fait échouer. Chaque écart est consigné séparément.", "Manette prête", "Manette prise en charge", "Croix/stick pour choisir · A/Croix confirme · B/Rond ferme · boutons supérieurs ouvrent les registres · Start ouvre le guide", "Lire la position", "Nouvelle chronique", "Signal du terrain", "Graine de chronique", "La condition du terrain s'applique", "Vos décisions s'imprimeront ici comme des marques dans l'argile humide." },
            ["ja"] = new[] { "戦場案内", "最初の命令の前に", "一つの命令は五つの可視層で決着する。自分の一手、既定の圧力、追撃態勢、秦の手筋読み、そして予告された戦場条件だ。", "場を読む", "兵糧、信頼、勢い、民衆、露見はそれぞれ異なる力の形だ。一つの値だけで勝利は決まらない。", "一手を打つ", "札には即時効果、戦略的手筋、秦の現在の読みが当たるかが示される。", "応手を待つ", "追撃は露見を読む。秦の手筋読みが罰するのは予告された反復手筋だけだ。手筋を変えれば読みは外れ、変化はすべて別に記録される。", "コントローラー準備完了", "コントローラー対応", "十字/スティックで選択 · A/×で決定 · B/○で閉じる · 肩ボタンで台帳 · Startで案内", "局面を読む", "新しい記録", "戦場の兆し", "記録シード", "戦場条件の反映", "決断は濡れた粘土の跡のようにここへ刻まれます。" },
            ["ko"] = new[] { "전장 안내", "첫 명령을 내리기 전에", "하나의 명령은 다섯 개의 보이는 층으로 결산된다. 나의 수, 서술된 압력, 추격 태세, 진의 수법 판독, 그리고 예고된 전장 조건이다.", "판을 읽어라", "군량, 신뢰, 기세, 민심, 노출은 서로 다른 힘의 형태다. 하나의 수치만으로 승리할 수 없다.", "수를 두어라", "선택지는 즉시 효과와 전략 수법, 진의 현재 판독이 적중하는지를 보여 준다.", "응수를 예상하라", "추격은 노출을 읽고, 진의 판독은 공개된 반복 수법만 압박한다. 수법을 바꾸면 판독이 빗나가며 모든 변화는 따로 기록된다.", "컨트롤러 준비됨", "컨트롤러 지원", "십자/스틱 선택 · A/× 결정 · B/○ 닫기 · 숄더 버튼으로 장부 · Start로 안내", "국면 읽기", "새 기록", "전장 신호", "기록 시드", "전장 조건 반영", "결정은 젖은 진흙 자국처럼 이곳에 새겨집니다." },
            ["ru"] = new[] { "Полевое руководство", "Перед первым приказом", "Каждый приказ разрешается в пяти видимых слоях: ваш ход, заданное давление, состояние погони, разбор метода Цинь и объявленное условие поля.", "Прочтите поле", "Зерно, доверие, порыв, люди и раскрытие — разные формы власти. Ни один показатель сам по себе не означает победу.", "Сделайте ход", "Карточка показывает немедленные эффекты, стратегический метод и попадёт ли текущий расчёт Цинь.", "Ждите ответа", "Погоня читает Раскрытие; расчёт Цинь наказывает только объявленный повторяемый метод. Смена метода рушит расчёт. Все изменения записываются отдельно.", "Геймпад готов", "Геймпад поддерживается", "Крестовина/стик — выбор · A/Крест — решение · B/Круг — закрыть · бамперы открывают записи · Start открывает руководство", "Прочесть позицию", "Новая хроника", "Сигнал поля", "Код хроники", "Условие поля разрешается", "Решения отпечатаются здесь, как знаки на сырой глине." },
            ["vi"] = new[] { "Cẩm nang chiến trường", "Trước mệnh lệnh đầu tiên", "Mỗi mệnh lệnh được kết toán qua năm lớp hiển thị: nước đi, áp lực soạn sẵn, thế truy đuổi, cách Tần đọc thủ pháp và điều kiện bàn thế đã báo.", "Đọc bàn thế", "Lương, tín, thế, dân và bại lộ là những dạng quyền lực khác nhau. Không một chỉ số nào tự nó là chiến thắng.", "Đi nước của bạn", "Mỗi thẻ cho biết hiệu ứng tức thời, thủ pháp chiến lược và cách đọc hiện tại của Tần có trúng hay không.", "Chờ thế cục đáp lại", "Truy đuổi đọc Bại lộ; Tần chỉ phạt thủ pháp lặp lại đã công bố. Đổi thủ pháp khiến cách đọc trượt. Mọi thay đổi được ghi riêng.", "Tay cầm đã sẵn sàng", "Có hỗ trợ tay cầm", "D-pad/cần để chọn · A/Dấu chéo xác nhận · B/Vòng tròn đóng · nút vai mở sổ · Start mở hướng dẫn", "Đọc thế cục", "Biên niên mới", "Tín hiệu bàn thế", "Hạt giống biên niên", "Điều kiện bàn thế được áp dụng", "Quyết định sẽ in tại đây như dấu trên đất sét ướt." },
            ["zh-Hans"] = new[] { "观势入门", "第一道命令之前", "每道命令分五层明示结算：你的落子、既定压力、追捕态势、秦吏手法识势，以及预先公开的局势条件。", "先读全局", "粮、信、势、民、险是五种不同的力量。任何一个数值都不等于胜利。", "再落一子", "选择牌会显示即时变化、战略手法，以及秦吏当前识势是否命中。", "预判应手", "追捕读取险，秦吏识势只惩罚明示的重复手法。改变手法即可让识势落空；每层变化都会单独记录。", "手柄已就绪", "支持手柄", "方向键/摇杆选择 · A/叉确认 · B/圈关闭 · 肩键打开简牍 · Start打开入门", "开始观势", "重开一卷", "局势信号", "本局种子", "局势条件结算", "你的选择会像湿泥上的刻痕一样留在这里。" },
            ["zh-Hant"] = new[] { "觀勢入門", "第一道命令之前", "每道命令分五層明示結算：你的落子、既定壓力、追捕態勢、秦吏手法識勢，以及預先公開的局勢條件。", "先讀全局", "糧、信、勢、民、險是五種不同的力量。任何一個數值都不等於勝利。", "再落一子", "選擇牌會顯示即時變化、戰略手法，以及秦吏當前識勢是否命中。", "預判應手", "追捕讀取險，秦吏識勢只懲罰明示的重複手法。改變手法即可讓識勢落空；每層變化都會單獨記錄。", "手把已就緒", "支援手把", "方向鍵/搖桿選擇 · A/叉確認 · B/圈關閉 · 肩鍵打開簡牘 · Start打開入門", "開始觀勢", "重開一卷", "局勢信號", "本局種子", "局勢條件結算", "你的選擇會像濕泥上的刻痕一樣留在這裡。" },
        };

        // These three instructions describe the current six-layer contract.
        // They override the retained legacy guide arrays so older localization
        // entries cannot silently teach pre-commitment rules.
        private static readonly string[] CommitmentGuideKeys = { "guideIntro", "guideMoveText", "guideReplyText" };
        private static readonly Dictionary<string, string[]> CommitmentGuideValues = new()
        {
            ["en"] = new[] { "Every order resolves in six visible layers: your move, a commitment answer when due, authored pressure, pursuit posture, Qin’s method read, and the disclosed field condition.", "A card shows exact immediate effects, its strategic method, any commitment it establishes or answers, and whether Qin’s current read will hit it.", "Promises name their stakeholder and exact cost. Pursuit reads Exposure; changing a repeated method makes Qin’s disclosed read miss. Every delta is recorded separately." },
            ["ar"] = new[] { "يُحسم كل أمر في ست طبقات ظاهرة: حركتك، وجواب الالتزام عند استحقاقه، والضغط المؤلَّف، ووضع المطاردة، وقراءة تشين للأسلوب، وظرف الميدان المعلن.", "تعرض البطاقة الآثار الفورية الدقيقة، وأسلوبها الاستراتيجي، وأي التزام تنشئه أو تجيب عنه، وهل ستصيبه قراءة تشين الحالية.", "تسمّي الوعود صاحب المصلحة وكلفتها الدقيقة. تقرأ المطاردة الانكشاف، وتغيير الأسلوب المتكرر يجعل قراءة تشين المعلنة تخطئ. تُسجل كل التغيرات منفصلة." },
            ["de"] = new[] { "Jeder Befehl wird in sechs sichtbaren Ebenen aufgelöst: dein Zug, eine fällige Antwort auf das Versprechen, verfasster Druck, Verfolgungslage, Qins Methodenanalyse und die angekündigte Feldbedingung.", "Eine Karte zeigt Sofortwirkungen, strategische Methode, ein begründetes oder beantwortetes Versprechen und ob Qins aktuelle Analyse trifft.", "Versprechen nennen Anspruchsträger und genaue Kosten. Die Verfolgung liest Entdeckung; ein Methodenwechsel lässt Qins offengelegte Analyse verfehlen. Jede Änderung wird getrennt notiert." },
            ["es"] = new[] { "Cada orden se resuelve en seis capas visibles: tu movimiento, la respuesta a un compromiso cuando corresponda, la presión escrita, la postura de persecución, la lectura de método de Qin y la condición anunciada del terreno.", "Una carta muestra efectos inmediatos, método estratégico, cualquier compromiso que establezca o responda y si la lectura actual de Qin acertará.", "Las promesas nombran a la parte interesada y su coste exacto. La persecución lee la Exposición; cambiar el método repetido hace fallar la lectura anunciada de Qin. Cada cambio queda registrado aparte." },
            ["fr"] = new[] { "Chaque ordre se résout en six couches visibles : votre coup, la réponse à un engagement lorsqu’elle est due, la pression écrite, le dispositif de poursuite, la lecture de méthode des Qin et la condition annoncée du terrain.", "Une carte montre les effets immédiats, la méthode stratégique, tout engagement établi ou tranché et si la lecture actuelle des Qin la visera.", "Les promesses nomment leur partie prenante et leur coût exact. La poursuite lit l’Exposition ; changer de méthode répétée fait échouer la lecture annoncée des Qin. Chaque écart est consigné séparément." },
            ["ja"] = new[] { "一つの命令は六つの可視層で決着する。自分の一手、必要な時の約束への応答、既定の圧力、追撃態勢、秦の手筋読み、そして予告された戦場条件だ。", "札には即時効果、戦略的手筋、立てる／応える約束、秦の現在の読みが当たるかが示される。", "約束には当事者と正確な代価が示される。追撃は露見を読み、反復手筋を変えれば秦の公開された読みは外れる。変化はすべて別に記録される。" },
            ["ko"] = new[] { "하나의 명령은 여섯 개의 보이는 층으로 결산된다. 나의 수, 때가 된 약속의 응답, 서술된 압력, 추격 태세, 진의 수법 판독, 그리고 예고된 전장 조건이다.", "선택지는 즉시 효과와 전략 수법, 세우거나 응답할 약속, 진의 현재 판독이 적중하는지를 보여 준다.", "약속에는 당사자와 정확한 대가가 표시된다. 추격은 노출을 읽으며 반복 수법을 바꾸면 진이 공개한 판독이 빗나간다. 모든 변화는 따로 기록된다." },
            ["ru"] = new[] { "Каждый приказ разрешается в шести видимых слоях: ваш ход, ответ на обязательство, когда он требуется, заданное давление, состояние погони, разбор метода Цинь и объявленное условие поля.", "Карточка показывает немедленные эффекты, стратегический метод, создаваемое или разрешаемое обязательство и попадёт ли текущий расчёт Цинь.", "Обещания называют заинтересованную сторону и точную цену. Погоня читает Раскрытие; смена повторяемого метода рушит объявленный расчёт Цинь. Все изменения записываются отдельно." },
            ["vi"] = new[] { "Mỗi mệnh lệnh được kết toán qua sáu lớp hiển thị: nước đi, cách đáp cam kết khi đến hạn, áp lực soạn sẵn, thế truy đuổi, cách Tần đọc thủ pháp và điều kiện bàn thế đã báo.", "Mỗi thẻ cho biết hiệu ứng tức thời, thủ pháp chiến lược, cam kết được lập hay được đáp và cách đọc hiện tại của Tần có trúng hay không.", "Lời hứa nêu rõ bên liên quan và cái giá chính xác. Truy đuổi đọc Bại lộ; đổi thủ pháp lặp lại khiến cách đọc công khai của Tần trượt. Mọi thay đổi được ghi riêng." },
            ["zh-Hans"] = new[] { "每道命令分六层明示结算：你的落子、到期的应诺、既定压力、追捕态势、秦吏手法识势，以及预先公开的局势条件。", "选择牌会显示即时变化、战略手法、将立下或回应的承诺，以及秦吏当前识势是否命中。", "承诺会写明关系人和确切代价。追捕读取险；改变重复手法即可让秦吏公开的识势落空。每层变化都会单独记录。" },
            ["zh-Hant"] = new[] { "每道命令分六層明示結算：你的落子、到期的應諾、既定壓力、追捕態勢、秦吏手法識勢，以及預先公開的局勢條件。", "選擇牌會顯示即時變化、戰略手法、將立下或回應的承諾，以及秦吏當前識勢是否命中。", "承諾會寫明關係人和確切代價。追捕讀取險；改變重複手法即可讓秦吏公開的識勢落空。每層變化都會單獨記錄。" },
        };

        private static readonly string[] EvidenceKeys =
        {
            "reconstruction", "later", "strategicText", "received", "claimRegister", "evidenceLocated",
            "specialistReview", "authoredClaim", "openEdition", "publicSource",
        };

        private static readonly Dictionary<string, string[]> EvidenceValues = new()
        {
            ["en"] = new[] { "Dramatic reconstruction", "Later compilation", "Classical strategy text", "Received historical account", "Claim register", "Evidence located", "Specialist review required", "Authored reconstruction", "Open public edition", "Evidence & uncertainty" },
            ["ar"] = new[] { "بناء درامي", "مصنّف لاحق", "نص استراتيجي كلاسيكي", "رواية تاريخية منقولة", "سجل الادعاءات", "تم تحديد الدليل", "مراجعة مختص مطلوبة", "إعادة بناء مؤلفة", "فتح الطبعة العامة", "الأدلة وعدم اليقين" },
            ["de"] = new[] { "Dramatische Rekonstruktion", "Spätere Kompilation", "Klassischer Strategietext", "Überlieferter Bericht", "Aussagenregister", "Belegstelle gefunden", "Fachprüfung erforderlich", "Verfasste Rekonstruktion", "Öffentliche Ausgabe öffnen", "Belege & Unsicherheit" },
            ["es"] = new[] { "Reconstrucción dramática", "Compilación posterior", "Texto estratégico clásico", "Relato histórico transmitido", "Registro de afirmaciones", "Evidencia localizada", "Revisión especialista requerida", "Reconstrucción de autor", "Abrir edición pública", "Evidencia e incertidumbre" },
            ["fr"] = new[] { "Reconstruction dramatique", "Compilation tardive", "Texte stratégique classique", "Récit historique transmis", "Registre des affirmations", "Preuve localisée", "Examen spécialiste requis", "Reconstruction d’auteur", "Ouvrir l’édition publique", "Preuves et incertitude" },
            ["ja"] = new[] { "劇的再構成", "後世の編纂", "古典戦略書", "伝世史料", "史実主張台帳", "根拠箇所確認済み", "専門家の確認が必要", "創作再構成", "公開版を開く", "根拠と不確実性" },
            ["ko"] = new[] { "극적 재구성", "후대 편찬", "고전 전략서", "전승 사료", "역사 주장 장부", "근거 위치 확인", "전문가 검토 필요", "창작 재구성", "공개 판본 열기", "근거와 불확실성" },
            ["ru"] = new[] { "Художественная реконструкция", "Поздняя компиляция", "Классический трактат", "Переданный исторический рассказ", "Реестр утверждений", "Источник найден", "Нужна проверка специалиста", "Авторская реконструкция", "Открыть публичное издание", "Свидетельства и неопределённость" },
            ["vi"] = new[] { "Tái dựng kịch tính", "Biên soạn đời sau", "Binh thư cổ điển", "Sử liệu lưu truyền", "Sổ luận điểm", "Đã xác định chứng cứ", "Cần chuyên gia thẩm định", "Tái dựng do tác giả", "Mở bản công khai", "Chứng cứ và bất định" },
            ["zh-Hans"] = new[] { "戏剧性重构", "后世编纂", "古典兵学文本", "传世史籍记载", "史实主张簿", "已定位证据", "需要专家审阅", "原创重构", "打开公开版本", "证据与不确定性" },
            ["zh-Hant"] = new[] { "戲劇性重構", "後世編纂", "古典兵學文本", "傳世史籍記載", "史實主張簿", "已定位證據", "需要專家審閱", "原創重構", "打開公開版本", "證據與不確定性" },
        };

        private static readonly string[] MapKeys =
        {
            "mapIntel", "inspectMap", "knownGround", "reportedGround", "referenceOnly", "uncertainty",
        };

        private static readonly string[] OppositionKeys =
        {
            "opponentPosture", "opponentResponse", "counterplay", "noAddedPressure", "methodRead", "method", "observedMethods", "readHits", "readMisses",
        };

        private static readonly Dictionary<string, string[]> OppositionValues = new()
        {
            ["en"] = new[] { "Pursuit posture", "Pursuit acts", "Counterplay", "No added pressure", "Method read", "Method", "Observed methods", "Read hits", "Read misses" },
            ["ar"] = new[] { "وضع المطاردة", "المطاردة تتحرك", "إجراء مضاد", "لا ضغط إضافي", "قراءة الأسلوب", "الأسلوب", "الأساليب المرصودة", "القراءة تصيب", "القراءة تخطئ" },
            ["de"] = new[] { "Verfolgungslage", "Die Verfolgung reagiert", "Gegenmittel", "Kein Zusatzdruck", "Methodenanalyse", "Methode", "Beobachtete Methoden", "Analyse trifft", "Analyse verfehlt" },
            ["es"] = new[] { "Postura de persecución", "La persecución responde", "Contrajuego", "Sin presión añadida", "Lectura del método", "Método", "Métodos observados", "La lectura acierta", "La lectura falla" },
            ["fr"] = new[] { "Dispositif de poursuite", "La poursuite agit", "Contre-jeu", "Aucune pression ajoutée", "Lecture de méthode", "Méthode", "Méthodes observées", "La lecture vise juste", "La lecture échoue" },
            ["ja"] = new[] { "追撃態勢", "追撃の応手", "対抗策", "追加圧力なし", "手筋の読み", "手筋", "観測した手筋", "読みが的中", "読みが外れる" },
            ["ko"] = new[] { "추격 태세", "추격의 응수", "대응책", "추가 압박 없음", "수법 판독", "수법", "관측한 수법", "판독 적중", "판독 빗나감" },
            ["ru"] = new[] { "Состояние погони", "Погоня действует", "Контрмера", "Без дополнительного давления", "Разбор метода", "Метод", "Замеченные методы", "Расчёт верен", "Расчёт неверен" },
            ["vi"] = new[] { "Thế truy đuổi", "Truy đuổi đáp trả", "Cách hóa giải", "Không thêm áp lực", "Đọc thủ pháp", "Thủ pháp", "Thủ pháp đã thấy", "Đọc trúng", "Đọc trượt" },
            ["zh-Hans"] = new[] { "追捕态势", "追捕应手", "反制", "无追加压力", "手法识势", "手法", "已见手法", "识势命中", "识势落空" },
            ["zh-Hant"] = new[] { "追捕態勢", "追捕應手", "反制", "無追加壓力", "手法識勢", "手法", "已見手法", "識勢命中", "識勢落空" },
        };

        private static readonly string[] CommitmentKeys =
        {
            "commitmentEstablishes", "commitmentCarried", "commitmentAnswer", "commitmentKept", "commitmentStrained", "commitmentBroken", "chapterCommitment",
        };

        private static readonly Dictionary<string, string[]> CommitmentValues = new()
        {
            ["en"] = new[] { "Establishes commitment", "Commitment carried", "Commitment answer", "Kept", "Strained", "Broken", "Chapter commitment" },
            ["ar"] = new[] { "ينشئ التزامًا", "التزام مستمر", "جواب الالتزام", "تم الوفاء به", "تعرّض للضغط", "نُقض", "التزام الفصل" },
            ["de"] = new[] { "Begründet ein Versprechen", "Mitgeführte Verpflichtung", "Antwort auf das Versprechen", "Gehalten", "Beansprucht", "Gebrochen", "Kapitelversprechen" },
            ["es"] = new[] { "Establece un compromiso", "Compromiso vigente", "Respuesta al compromiso", "Cumplido", "Tensionado", "Roto", "Compromiso del capítulo" },
            ["fr"] = new[] { "Établit un engagement", "Engagement en cours", "Réponse à l’engagement", "Tenu", "Mis à l’épreuve", "Rompu", "Engagement du chapitre" },
            ["ja"] = new[] { "約束を立てる", "持ち越された約束", "約束への応答", "守った", "揺らいだ", "破った", "章の約束" },
            ["ko"] = new[] { "약속을 세움", "이어지는 약속", "약속에 대한 응답", "지킴", "흔들림", "어김", "장의 약속" },
            ["ru"] = new[] { "Создаёт обязательство", "Действующее обязательство", "Ответ на обязательство", "Исполнено", "Под напряжением", "Нарушено", "Обязательство главы" },
            ["vi"] = new[] { "Lập một cam kết", "Cam kết đang mang theo", "Cách đáp lại cam kết", "Giữ lời", "Bị thử thách", "Thất hứa", "Cam kết của chương" },
            ["zh-Hans"] = new[] { "立下承诺", "随行承诺", "应诺", "兑现", "承压", "背弃", "本章承诺" },
            ["zh-Hant"] = new[] { "立下承諾", "隨行承諾", "應諾", "兌現", "承壓", "背棄", "本章承諾" },
        };

        private static readonly Dictionary<string, string[]> MapValues = new()
        {
            ["en"] = new[] { "Strategic intelligence map", "Inspect map", "Known ground", "Reported network", "Reference only", "Uncertainty" },
            ["ar"] = new[] { "خريطة الاستخبارات الاستراتيجية", "تفحّص الخريطة", "أرض معروفة", "شبكة منقولة", "مرجع فقط", "موضع الشك" },
            ["de"] = new[] { "Strategische Lagekarte", "Karte prüfen", "Bekanntes Gebiet", "Gemeldetes Netzwerk", "Nur Orientierung", "Unsicherheit" },
            ["es"] = new[] { "Mapa de inteligencia estratégica", "Examinar mapa", "Terreno conocido", "Red informada", "Solo referencia", "Incertidumbre" },
            ["fr"] = new[] { "Carte de renseignement stratégique", "Examiner la carte", "Terrain connu", "Réseau signalé", "Repère seulement", "Incertitude" },
            ["ja"] = new[] { "戦略情報図", "地図を調べる", "既知の地", "伝聞の勢力", "参照のみ", "不確実性" },
            ["ko"] = new[] { "전략 정보 지도", "지도 살피기", "알려진 땅", "전해진 세력망", "참조 전용", "불확실성" },
            ["ru"] = new[] { "Карта стратегических сведений", "Изучить карту", "Известная местность", "Сеть по донесениям", "Только ориентир", "Неопределённость" },
            ["vi"] = new[] { "Bản đồ tình báo chiến lược", "Xem xét bản đồ", "Địa bàn đã biết", "Mạng lưới được báo", "Chỉ để tham chiếu", "Điều chưa chắc" },
            ["zh-Hans"] = new[] { "战略情报图", "查看地图", "已知地点", "传闻网络", "仅作参照", "不确定之处" },
            ["zh-Hant"] = new[] { "戰略情報圖", "查看地圖", "已知地點", "傳聞網絡", "僅作參照", "不確定之處" },
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
            index = Array.IndexOf(CommitmentGuideKeys, key);
            if (index >= 0)
            {
                var guideValues = CommitmentGuideValues.TryGetValue(locale, out var localizedCommitmentGuide) ? localizedCommitmentGuide : CommitmentGuideValues["en"];
                return guideValues[index];
            }
            index = Array.IndexOf(GuideKeys, key);
            if (index >= 0)
            {
                var guideValues = GuideValues.TryGetValue(locale, out var localizedGuide) ? localizedGuide : GuideValues["en"];
                return guideValues[index];
            }
            index = Array.IndexOf(EvidenceKeys, key);
            if (index >= 0)
            {
                var evidenceValues = EvidenceValues.TryGetValue(locale, out var localizedEvidence) ? localizedEvidence : EvidenceValues["en"];
                return evidenceValues[index];
            }
            index = Array.IndexOf(OppositionKeys, key);
            if (index >= 0)
            {
                var oppositionValues = OppositionValues.TryGetValue(locale, out var localizedOpposition) ? localizedOpposition : OppositionValues["en"];
                return oppositionValues[index];
            }
            index = Array.IndexOf(CommitmentKeys, key);
            if (index >= 0)
            {
                var commitmentValues = CommitmentValues.TryGetValue(locale, out var localizedCommitment) ? localizedCommitment : CommitmentValues["en"];
                return commitmentValues[index];
            }
            index = Array.IndexOf(MapKeys, key);
            if (index < 0) return key;
            var mapValues = MapValues.TryGetValue(locale, out var localizedMap) ? localizedMap : MapValues["en"];
            return mapValues[index];
        }

        public static string LocaleName(string locale) => LocaleNames.TryGetValue(locale, out var name) ? name : locale;
    }
}
