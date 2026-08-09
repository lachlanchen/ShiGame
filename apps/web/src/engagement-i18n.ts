import type { EngagementMetricKey, EngagementOrder, Locale } from "@shi/game-core";

type EngagementUiKey =
  | "commandBoard"
  | "referenceStatus"
  | "boundary"
  | "openBoard"
  | "plan"
  | "condition"
  | "localState"
  | "pulse"
  | "objective"
  | "chooseCommand"
  | "issueCommand"
  | "fieldAnswer"
  | "commandRecord"
  | "outcome"
  | "campaignPreview"
  | "returnToCouncil"
  | "completed";

const en = {
  commandBoard: "Command board",
  referenceStatus: "Validated Web reference",
  boundary: "This exercise does not change the campaign. It becomes authoritative only after native Unreal replay parity.",
  openBoard: "Open command board",
  plan: "Plan",
  condition: "Field condition",
  localState: "Local command state",
  pulse: "Command pulse",
  objective: "Objective",
  chooseCommand: "Choose one legal command",
  issueCommand: "Issue command",
  fieldAnswer: "The field answers",
  commandRecord: "Command record",
  outcome: "Engagement outcome",
  campaignPreview: "Campaign effect preview",
  returnToCouncil: "Return to council",
  completed: "Exercise complete",
} as const satisfies Record<EngagementUiKey, string>;

export const engagementUi: Record<Locale, Record<EngagementUiKey, string>> = {
  en,
  ar: { commandBoard: "لوحة القيادة", referenceStatus: "مرجع ويب مُتحقَّق منه", boundary: "هذا التمرين لا يغيّر الحملة. يصبح معتمدًا فقط بعد تطابق إعادة التشغيل في Unreal الأصلي.", openBoard: "افتح لوحة القيادة", plan: "الخطة", condition: "حالة الميدان", localState: "حالة القيادة المحلية", pulse: "نبضة القيادة", objective: "الهدف", chooseCommand: "اختر أمرًا قانونيًا واحدًا", issueCommand: "أصدر الأمر", fieldAnswer: "الميدان يجيب", commandRecord: "سجل الأوامر", outcome: "نتيجة الاشتباك", campaignPreview: "معاينة أثر الحملة", returnToCouncil: "العودة إلى المجلس", completed: "اكتمل التمرين" },
  de: { commandBoard: "Befehlstafel", referenceStatus: "Validierte Web-Referenz", boundary: "Diese Übung verändert die Kampagne nicht. Sie wird erst nach identischer nativer Unreal-Wiedergabe verbindlich.", openBoard: "Befehlstafel öffnen", plan: "Plan", condition: "Feldlage", localState: "Lokale Befehlslage", pulse: "Befehlsphase", objective: "Ziel", chooseCommand: "Einen zulässigen Befehl wählen", issueCommand: "Befehl erteilen", fieldAnswer: "Das Feld antwortet", commandRecord: "Befehlsprotokoll", outcome: "Ausgang des Gefechts", campaignPreview: "Vorschau der Kampagnenwirkung", returnToCouncil: "Zum Rat zurückkehren", completed: "Übung abgeschlossen" },
  es: { commandBoard: "Mesa de mando", referenceStatus: "Referencia web validada", boundary: "Este ejercicio no cambia la campaña. Solo será autoritativo tras reproducirse igual en Unreal nativo.", openBoard: "Abrir mesa de mando", plan: "Plan", condition: "Condición del campo", localState: "Estado de mando local", pulse: "Pulso de mando", objective: "Objetivo", chooseCommand: "Elige una orden válida", issueCommand: "Dar la orden", fieldAnswer: "El campo responde", commandRecord: "Registro de órdenes", outcome: "Resultado del encuentro", campaignPreview: "Vista previa del efecto en campaña", returnToCouncil: "Volver al consejo", completed: "Ejercicio completado" },
  fr: { commandBoard: "Table de commandement", referenceStatus: "Référence Web validée", boundary: "Cet exercice ne modifie pas la campagne. Il ne fera autorité qu’après une relecture identique dans Unreal natif.", openBoard: "Ouvrir la table de commandement", plan: "Plan", condition: "Condition du terrain", localState: "État de commandement local", pulse: "Temps de commandement", objective: "Objectif", chooseCommand: "Choisir un ordre autorisé", issueCommand: "Donner l’ordre", fieldAnswer: "Le terrain répond", commandRecord: "Journal de commandement", outcome: "Issue de l’engagement", campaignPreview: "Aperçu de l’effet de campagne", returnToCouncil: "Retourner au conseil", completed: "Exercice terminé" },
  ja: { commandBoard: "指揮盤", referenceStatus: "検証済みWeb参照実装", boundary: "この演習は戦役を変更しません。Unrealネイティブ版と同一再生を確認した後にのみ正式化します。", openBoard: "指揮盤を開く", plan: "作戦案", condition: "現地状況", localState: "局地指揮状態", pulse: "指揮局面", objective: "目標", chooseCommand: "実行可能な命令を一つ選ぶ", issueCommand: "命令を下す", fieldAnswer: "現場の応答", commandRecord: "命令記録", outcome: "遭遇結果", campaignPreview: "戦役効果の予告", returnToCouncil: "評議へ戻る", completed: "演習完了" },
  ko: { commandBoard: "지휘판", referenceStatus: "검증된 웹 참조 구현", boundary: "이 훈련은 캠페인을 바꾸지 않습니다. 네이티브 Unreal 재현이 일치한 뒤에만 권위 규칙이 됩니다.", openBoard: "지휘판 열기", plan: "계획", condition: "현장 조건", localState: "현지 지휘 상태", pulse: "지휘 단계", objective: "목표", chooseCommand: "가능한 명령 하나 선택", issueCommand: "명령 내리기", fieldAnswer: "현장의 대응", commandRecord: "명령 기록", outcome: "교전 결과", campaignPreview: "캠페인 영향 미리보기", returnToCouncil: "회의로 돌아가기", completed: "훈련 완료" },
  ru: { commandBoard: "Командный стол", referenceStatus: "Проверенная Web-версия", boundary: "Это упражнение не меняет кампанию. Оно станет основным только после идентичного повтора в нативном Unreal.", openBoard: "Открыть командный стол", plan: "План", condition: "Обстановка", localState: "Местное состояние", pulse: "Командный такт", objective: "Цель", chooseCommand: "Выберите один допустимый приказ", issueCommand: "Отдать приказ", fieldAnswer: "Ответ обстановки", commandRecord: "Журнал приказов", outcome: "Итог столкновения", campaignPreview: "Предпросмотр влияния на кампанию", returnToCouncil: "Вернуться к совету", completed: "Упражнение завершено" },
  vi: { commandBoard: "Bàn chỉ huy", referenceStatus: "Bản Web tham chiếu đã kiểm chứng", boundary: "Bài tập này không thay đổi chiến dịch. Nó chỉ có hiệu lực sau khi bản Unreal gốc tái hiện giống hệt.", openBoard: "Mở bàn chỉ huy", plan: "Kế hoạch", condition: "Điều kiện chiến trường", localState: "Trạng thái chỉ huy cục bộ", pulse: "Nhịp chỉ huy", objective: "Mục tiêu", chooseCommand: "Chọn một mệnh lệnh hợp lệ", issueCommand: "Ban lệnh", fieldAnswer: "Chiến trường đáp lại", commandRecord: "Biên bản mệnh lệnh", outcome: "Kết quả giao chiến", campaignPreview: "Xem trước tác động chiến dịch", returnToCouncil: "Trở lại hội nghị", completed: "Hoàn tất diễn tập" },
  "zh-Hans": { commandBoard: "指挥盘", referenceStatus: "已验证 Web 参考实现", boundary: "本次推演不会改变战役。只有原生 Unreal 逐条重放一致后，才会成为战役权威记录。", openBoard: "打开指挥盘", plan: "方略", condition: "现场态势", localState: "局地指挥态势", pulse: "指挥节拍", objective: "目标", chooseCommand: "选择一道可执行命令", issueCommand: "下达命令", fieldAnswer: "现场回应", commandRecord: "命令记录", outcome: "接触结果", campaignPreview: "战役影响预览", returnToCouncil: "返回军议", completed: "推演完成" },
  "zh-Hant": { commandBoard: "指揮盤", referenceStatus: "已驗證 Web 參考實作", boundary: "本次推演不會改變戰役。只有原生 Unreal 逐條重放一致後，才會成為戰役權威記錄。", openBoard: "打開指揮盤", plan: "方略", condition: "現場態勢", localState: "局地指揮態勢", pulse: "指揮節拍", objective: "目標", chooseCommand: "選擇一道可執行命令", issueCommand: "下達命令", fieldAnswer: "現場回應", commandRecord: "命令記錄", outcome: "接觸結果", campaignPreview: "戰役影響預覽", returnToCouncil: "返回軍議", completed: "推演完成" },
};

export const engagementMetricLabels: Record<Locale, Record<EngagementMetricKey, string>> = {
  en: { crossingProgress: "Crossing", rearCohesion: "Rear cohesion", reserveReadiness: "Reserve", supplyLoads: "Loads", pursuitClosure: "Pursuit", signalIntegrity: "Signals" },
  ar: { crossingProgress: "العبور", rearCohesion: "تماسك المؤخرة", reserveReadiness: "الاحتياط", supplyLoads: "الحمولات", pursuitClosure: "المطاردة", signalIntegrity: "الإشارات" },
  de: { crossingProgress: "Übergang", rearCohesion: "Nachhut", reserveReadiness: "Reserve", supplyLoads: "Lasten", pursuitClosure: "Verfolgung", signalIntegrity: "Signale" },
  es: { crossingProgress: "Cruce", rearCohesion: "Cohesión trasera", reserveReadiness: "Reserva", supplyLoads: "Cargas", pursuitClosure: "Persecución", signalIntegrity: "Señales" },
  fr: { crossingProgress: "Traversée", rearCohesion: "Cohésion arrière", reserveReadiness: "Réserve", supplyLoads: "Charges", pursuitClosure: "Poursuite", signalIntegrity: "Signaux" },
  ja: { crossingProgress: "渡河", rearCohesion: "後衛結束", reserveReadiness: "予備", supplyLoads: "輸送物資", pursuitClosure: "追撃接近", signalIntegrity: "信号" },
  ko: { crossingProgress: "도하", rearCohesion: "후위 결속", reserveReadiness: "예비대", supplyLoads: "수송 물자", pursuitClosure: "추격 접근", signalIntegrity: "신호" },
  ru: { crossingProgress: "Переправа", rearCohesion: "Связность тыла", reserveReadiness: "Резерв", supplyLoads: "Грузы", pursuitClosure: "Преследование", signalIntegrity: "Сигналы" },
  vi: { crossingProgress: "Qua sông", rearCohesion: "Gắn kết hậu quân", reserveReadiness: "Dự bị", supplyLoads: "Hàng tải", pursuitClosure: "Truy kích", signalIntegrity: "Tín hiệu" },
  "zh-Hans": { crossingProgress: "渡河进度", rearCohesion: "后卫凝聚", reserveReadiness: "预备队", supplyLoads: "载荷", pursuitClosure: "追捕合拢", signalIntegrity: "信号完整" },
  "zh-Hant": { crossingProgress: "渡河進度", rearCohesion: "後衛凝聚", reserveReadiness: "預備隊", supplyLoads: "載荷", pursuitClosure: "追捕合攏", signalIntegrity: "信號完整" },
};

const englishOrders: Record<EngagementOrder, string> = { anchor: "Anchor", advance: "Advance", screen: "Screen", shift: "Shift", feint: "Feint", reserve: "Reserve", withdraw: "Withdraw" };
export const engagementOrderLabels: Record<Locale, Record<EngagementOrder, string>> = {
  en: englishOrders,
  ar: { anchor: "تثبيت", advance: "تقدم", screen: "ستر", shift: "نقل", feint: "خداع", reserve: "احتياط", withdraw: "انسحاب" },
  de: { anchor: "Halten", advance: "Vorrücken", screen: "Decken", shift: "Verlagern", feint: "Täuschen", reserve: "Reserve", withdraw: "Lösen" },
  es: { anchor: "Fijar", advance: "Avanzar", screen: "Cubrir", shift: "Desplazar", feint: "Fingir", reserve: "Reservar", withdraw: "Retirarse" },
  fr: { anchor: "Ancrer", advance: "Avancer", screen: "Masquer", shift: "Déplacer", feint: "Feindre", reserve: "Réserver", withdraw: "Se replier" },
  ja: { anchor: "固守", advance: "前進", screen: "遮蔽", shift: "転進", feint: "陽動", reserve: "予備", withdraw: "離脱" },
  ko: { anchor: "고정", advance: "전진", screen: "엄호", shift: "전환", feint: "기만", reserve: "예비", withdraw: "철수" },
  ru: { anchor: "Закрепиться", advance: "Наступать", screen: "Прикрыть", shift: "Сместить", feint: "Отвлечь", reserve: "Резерв", withdraw: "Отойти" },
  vi: { anchor: "Trụ giữ", advance: "Tiến", screen: "Che chắn", shift: "Chuyển hướng", feint: "Nghi binh", reserve: "Dự bị", withdraw: "Rút lui" },
  "zh-Hans": { anchor: "固守", advance: "推进", screen: "掩护", shift: "转移", feint: "佯动", reserve: "预备", withdraw: "撤离" },
  "zh-Hant": { anchor: "固守", advance: "推進", screen: "掩護", shift: "轉移", feint: "佯動", reserve: "預備", withdraw: "撤離" },
};

export const translateEngagement = (locale: Locale, key: EngagementUiKey): string => engagementUi[locale][key];
