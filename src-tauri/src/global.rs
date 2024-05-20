use once_cell::sync::OnceCell;
use serde_json::Value;
use std::{
    collections::HashMap,
    path::PathBuf,
    process::Child,
    sync::{atomic::AtomicBool, Arc, Mutex, RwLock},
};

#[cfg(all(target_os = "windows", target_arch = "x86"))]
const DLL_BYTES: &'static [u8] = include_bytes!("../ahkh2x32.dll");

#[cfg(all(target_os = "windows", target_arch = "x86_64"))]
const DLL_BYTES: &'static [u8] = include_bytes!("../ahkh2x64.dll");

#[cfg(target_os = "windows")]
pub fn wirte_ahk_dll() -> bool {
    let dll_path = std::env::current_dir().unwrap().join("ahkh2.dll");
    if !dll_path.exists() {
        return match std::fs::write(dll_path, DLL_BYTES) {
            Ok(_) => true,
            Err(_) => false,
        };
    }
    true
}

pub static SCRIPT_FILE_NAME: &str = "script.ahk";
pub static DLL_FILE_NAME: &str = "ahkh2.dll";

pub const SHOW_TRANSLATOR: &str = "show_translator";
pub const SCREENSHOT_TRANSLATE: &str = "screenshot_translate";
pub const SELECTION_TRANSLATE: &str = "selection_translate";
pub const SCREENSHOT_RECOGNIZER: &str = "screenshot_recognizer";

pub const TRANSLATOR_LABEL: &str = "translator";
pub const SETTING_LABEL: &str = "setting";
pub const SELECTION_TRANSLATOR_LABEL: &str = "selection-translator";
pub const SCREEN_CAPTURE_LABEL: &str = "screen-capture";

pub static APP: OnceCell<tauri::AppHandle> = OnceCell::new();
pub static BASE_PATH: OnceCell<PathBuf> = OnceCell::new();

lazy_static::lazy_static! {
    // 截图后的base64
    pub static ref OCR_BASE64: Mutex<String> = Mutex::new(String::new());

    pub static ref WORKER: Mutex<Option<Child>> = Mutex::new(None);
    pub static ref AHK_STATE: Arc<AtomicBool> = Arc::new(AtomicBool::new(false));

    pub static ref STORE: RwLock<HashMap<String, Value>> = RwLock::new(HashMap::new());
    pub static ref JIEBA: Mutex<jieba_rs::Jieba> = Mutex::new(jieba_rs::Jieba::new());
}
