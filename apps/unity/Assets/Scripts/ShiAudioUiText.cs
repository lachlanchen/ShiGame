using System;
using System.Collections.Generic;

namespace SHI
{
    public static class ShiAudioUiText
    {
        private static readonly string[] Keys = { "sound", "soundOn", "soundOff", "audioTitle", "audioIntro", "enableSound", "ambience", "effects", "preview", "audioReview" };
        private static readonly Dictionary<string, string[]> Values = new()
        {
            ["en"] = new[] { "Sound", "Sound on", "Sound off", "Soundscape", "Rain and decision cues. Sound never carries exclusive information.", "Enable sound", "Rain ambience", "Decision cues", "Preview cue", "Engineering preview · human listening review pending" },
            ["ar"] = new[] { "الصوت", "الصوت مفعّل", "الصوت متوقف", "المشهد الصوتي", "مطر وإشارات للقرارات. لا ينقل الصوت أي معلومة حصرية.", "تفعيل الصوت", "أجواء المطر", "إشارات القرارات", "معاينة الإشارة", "معاينة هندسية · المراجعة البشرية للاستماع معلّقة" },
            ["de"] = new[] { "Ton", "Ton an", "Ton aus", "Klangbild", "Regen und Entscheidungssignale. Ton vermittelt nie exklusive Informationen.", "Ton einschalten", "Regenatmosphäre", "Entscheidungssignale", "Signal anhören", "Technische Vorschau · menschliche Hörprüfung ausstehend" },
            ["es"] = new[] { "Sonido", "Sonido activo", "Sonido desactivado", "Paisaje sonoro", "Lluvia y señales de decisión. El sonido nunca contiene información exclusiva.", "Activar sonido", "Ambiente de lluvia", "Señales de decisión", "Probar señal", "Vista previa técnica · revisión auditiva humana pendiente" },
            ["fr"] = new[] { "Son", "Son activé", "Son coupé", "Paysage sonore", "Pluie et signaux de décision. Le son ne porte jamais d’information exclusive.", "Activer le son", "Ambiance de pluie", "Signaux de décision", "Écouter le signal", "Aperçu technique · écoute humaine en attente" },
            ["ja"] = new[] { "サウンド", "サウンド オン", "サウンド オフ", "サウンドスケープ", "雨音と決断の合図。音だけで伝える情報はありません。", "サウンドを有効にする", "雨の環境音", "決断の合図", "合図を試聴", "技術プレビュー · 人による試聴確認待ち" },
            ["ko"] = new[] { "사운드", "사운드 켜짐", "사운드 꺼짐", "사운드스케이프", "빗소리와 결단 신호입니다. 소리만으로 전달되는 정보는 없습니다.", "사운드 켜기", "빗소리 환경음", "결단 신호", "신호 미리 듣기", "엔지니어링 미리보기 · 사람의 청취 검토 대기" },
            ["ru"] = new[] { "Звук", "Звук включён", "Звук выключен", "Звуковая среда", "Дождь и сигналы решений. Звук никогда не передаёт уникальную информацию.", "Включить звук", "Шум дождя", "Сигналы решений", "Проверить сигнал", "Инженерная версия · требуется прослушивание человеком" },
            ["vi"] = new[] { "Âm thanh", "Đã bật âm thanh", "Đã tắt âm thanh", "Không gian âm thanh", "Tiếng mưa và tín hiệu quyết định. Âm thanh không bao giờ chứa thông tin riêng biệt.", "Bật âm thanh", "Không khí mưa", "Tín hiệu quyết định", "Nghe thử tín hiệu", "Bản xem trước kỹ thuật · đang chờ người nghe đánh giá" },
            ["zh-Hans"] = new[] { "声音", "声音已开", "声音已关", "声音景观", "雨声与决策提示音。声音不承载任何独占信息。", "启用声音", "雨夜环境声", "决策提示音", "试听提示音", "工程预览 · 等待真人听审" },
            ["zh-Hant"] = new[] { "聲音", "聲音已開", "聲音已關", "聲音景觀", "雨聲與決策提示音。聲音不承載任何獨佔資訊。", "啟用聲音", "雨夜環境聲", "決策提示音", "試聽提示音", "工程預覽 · 等待真人聽審" },
        };

        public static string? Get(string locale, string key)
        {
            var index = Array.IndexOf(Keys, key);
            if (index < 0) return null;
            var values = Values.TryGetValue(locale, out var localized) ? localized : Values["en"];
            return values[index];
        }
    }
}
