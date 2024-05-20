#[tauri::command]
pub fn lang_detect(text: &str) -> Result<&str, ()> {
    // whichlang更快，本地检测不需要多高的准确率，快就行了
    match whichlang::detect_language(text) {
        whichlang::Lang::Cmn => Ok("zh_cn"),
        whichlang::Lang::Jpn => Ok("ja"),
        whichlang::Lang::Eng => Ok("en"),
        whichlang::Lang::Kor => Ok("ko"),
        whichlang::Lang::Fra => Ok("fr"),
        whichlang::Lang::Spa => Ok("es"),
        whichlang::Lang::Deu => Ok("de"),
        whichlang::Lang::Rus => Ok("ru"),
        whichlang::Lang::Nld => Ok("nl"),
        whichlang::Lang::Swe => Ok("sv"),
        whichlang::Lang::Ita => Ok("it"),
        whichlang::Lang::Por => Ok("pt_pt"),
        whichlang::Lang::Tur => Ok("tr"),
        whichlang::Lang::Ara => Ok("ar"),
        whichlang::Lang::Vie => Ok("vi"),
        whichlang::Lang::Hin => Ok("hi"),
    }
}

/*
lingua = { version = "1.6.2", default-features = false, features = [
    "chinese",
    "japanese",
    "english",
    "korean",
    "french",
    "spanish",
    "german",
    "russian",
    "italian",
    "portuguese",
    "turkish",
    "arabic",
    "vietnamese",
    "thai",
    "indonesian",
    "malay",
    "hindi",
    "mongolian",
    "persian",
    "nynorsk",
    "bokmal",
] }

#[tauri::command]
pub fn lang_detect(text: &str) -> Result<&str, ()> {
    use lingua::{Language, LanguageDetectorBuilder};
    let languages = vec![
        Language::Chinese,
        Language::Japanese,
        Language::English,
        Language::Korean,
        Language::French,
        Language::Spanish,
        Language::German,
        Language::Russian,
        Language::Italian,
        Language::Portuguese,
        Language::Turkish,
        Language::Arabic,
        Language::Vietnamese,
        Language::Thai,
        Language::Indonesian,
        Language::Malay,
        Language::Hindi,
        Language::Mongolian,
        Language::Bokmal,
        Language::Nynorsk,
        Language::Persian,
    ];
    let detector = LanguageDetectorBuilder::from_languages(&languages).build();
    if let Some(lang) = detector.detect_language_of(text) {
        match lang {
            Language::Chinese => Ok("zh_cn"),
            Language::Japanese => Ok("ja"),
            Language::English => Ok("en"),
            Language::Korean => Ok("ko"),
            Language::French => Ok("fr"),
            Language::Spanish => Ok("es"),
            Language::German => Ok("de"),
            Language::Russian => Ok("ru"),
            Language::Italian => Ok("it"),
            Language::Portuguese => Ok("pt_pt"),
            Language::Turkish => Ok("tr"),
            Language::Arabic => Ok("ar"),
            Language::Vietnamese => Ok("vi"),
            Language::Thai => Ok("th"),
            Language::Indonesian => Ok("id"),
            Language::Malay => Ok("ms"),
            Language::Hindi => Ok("hi"),
            Language::Mongolian => Ok("mn_cy"),
            Language::Bokmal => Ok("nb_no"),
            Language::Nynorsk => Ok("nn_no"),
            Language::Persian => Ok("fa"),
        }
    } else {
        return Ok("en");
    }
} */
