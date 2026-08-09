import type { Locale } from "@shi/game-core";

interface GuideDetails {
  intro: string;
  move: string;
  reply: string;
}

export const guideDetails: Record<Locale, GuideDetails> = {
  en: { intro: "Every order resolves in five visible layers: your move, authored pressure, pursuit posture, Qin’s method read, and the disclosed field condition.", move: "A card shows exact immediate effects, its strategic method, and whether Qin’s current read will hit it.", reply: "Pursuit reads Exposure; Qin’s method read punishes only the disclosed repeated method. Changing method makes that read miss. Every delta is recorded separately." },
  ar: { intro: "يُحسم كل أمر في خمس طبقات ظاهرة: حركتك، والضغط المؤلَّف، ووضع المطاردة، وقراءة تشين للأسلوب، وظرف الميدان المعلن.", move: "تعرض البطاقة الآثار الفورية الدقيقة وأسلوبها الاستراتيجي وهل ستصيبه قراءة تشين الحالية.", reply: "تقرأ المطاردة الانكشاف، ولا تعاقب قراءة تشين إلا الأسلوب المتكرر المعلن. تغيير الأسلوب يجعل القراءة تخطئ، وتُسجل كل التغيرات منفصلة." },
  de: { intro: "Jeder Befehl wird in fünf sichtbaren Ebenen aufgelöst: dein Zug, verfasster Druck, Verfolgungslage, Qins Methodenanalyse und die angekündigte Feldbedingung.", move: "Eine Karte zeigt Sofortwirkungen, strategische Methode und ob Qins aktuelle Analyse trifft.", reply: "Die Verfolgung liest Entdeckung; Qins Analyse bestraft nur die offengelegte wiederholte Methode. Ein Methodenwechsel lässt sie verfehlen. Jede Änderung wird getrennt notiert." },
  es: { intro: "Cada orden se resuelve en cinco capas visibles: tu movimiento, la presión escrita, la postura de persecución, la lectura de método de Qin y la condición anunciada del terreno.", move: "Una carta muestra efectos inmediatos, método estratégico y si la lectura actual de Qin acertará.", reply: "La persecución lee la Exposición; Qin solo castiga el método repetido que anuncia. Cambiar de método hace fallar la lectura. Cada cambio queda registrado aparte." },
  fr: { intro: "Chaque ordre se résout en cinq couches visibles : votre coup, la pression écrite, le dispositif de poursuite, la lecture de méthode des Qin et la condition annoncée du terrain.", move: "Une carte montre les effets immédiats, la méthode stratégique et si la lecture actuelle des Qin la visera.", reply: "La poursuite lit l’Exposition ; la lecture des Qin ne punit que la méthode répétée annoncée. Changer de méthode la fait échouer. Chaque écart est consigné séparément." },
  ja: { intro: "一つの命令は五つの可視層で決着する。自分の一手、既定の圧力、追撃態勢、秦の手筋読み、そして予告された戦場条件だ。", move: "札には即時効果、戦略的手筋、秦の現在の読みが当たるかが示される。", reply: "追撃は露見を読む。秦の手筋読みが罰するのは予告された反復手筋だけだ。手筋を変えれば読みは外れ、変化はすべて別に記録される。" },
  ko: { intro: "하나의 명령은 다섯 개의 보이는 층으로 결산된다. 나의 수, 서술된 압력, 추격 태세, 진의 수법 판독, 그리고 예고된 전장 조건이다.", move: "선택지는 즉시 효과와 전략 수법, 진의 현재 판독이 적중하는지를 보여 준다.", reply: "추격은 노출을 읽고, 진의 판독은 공개된 반복 수법만 압박한다. 수법을 바꾸면 판독이 빗나가며 모든 변화는 따로 기록된다." },
  ru: { intro: "Каждый приказ разрешается в пяти видимых слоях: ваш ход, заданное давление, состояние погони, разбор метода Цинь и объявленное условие поля.", move: "Карточка показывает немедленные эффекты, стратегический метод и попадёт ли текущий расчёт Цинь.", reply: "Погоня читает Раскрытие; расчёт Цинь наказывает только объявленный повторяемый метод. Смена метода рушит расчёт. Все изменения записываются отдельно." },
  vi: { intro: "Mỗi mệnh lệnh được kết toán qua năm lớp hiển thị: nước đi, áp lực soạn sẵn, thế truy đuổi, cách Tần đọc thủ pháp và điều kiện bàn thế đã báo.", move: "Mỗi thẻ cho biết hiệu ứng tức thời, thủ pháp chiến lược và cách đọc hiện tại của Tần có trúng hay không.", reply: "Truy đuổi đọc Bại lộ; Tần chỉ phạt thủ pháp lặp lại đã công bố. Đổi thủ pháp khiến cách đọc trượt. Mọi thay đổi được ghi riêng." },
  "zh-Hans": { intro: "每道命令分五层明示结算：你的落子、既定压力、追捕态势、秦吏手法识势，以及预先公开的局势条件。", move: "选择牌会显示即时变化、战略手法，以及秦吏当前识势是否命中。", reply: "追捕读取险，秦吏识势只惩罚明示的重复手法。改变手法即可让识势落空；每层变化都会单独记录。" },
  "zh-Hant": { intro: "每道命令分五層明示結算：你的落子、既定壓力、追捕態勢、秦吏手法識勢，以及預先公開的局勢條件。", move: "選擇牌會顯示即時變化、戰略手法，以及秦吏當前識勢是否命中。", reply: "追捕讀取險，秦吏識勢只懲罰明示的重複手法。改變手法即可讓識勢落空；每層變化都會單獨記錄。" },
};
