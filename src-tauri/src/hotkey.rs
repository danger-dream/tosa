use crate::{config::get_or_string, event_handle, global::*};
use log::debug;
use tauri::GlobalShortcutManager;

pub fn init_hotkey() {
    let app_handle = APP.get().unwrap();

    let mut shortcut_manager = app_handle.global_shortcut_manager();
    // clear all hotkeys
    shortcut_manager.unregister_all().unwrap();

    for &config_prop in [
        SHOW_TRANSLATOR,
        SCREENSHOT_TRANSLATE,
        SELECTION_TRANSLATE,
        SCREENSHOT_RECOGNIZER,
    ]
    .iter()
    {
        let key = get_or_string(config_prop, String::new());
        if key.is_empty() {
            debug!("hotkey {} is empty skip", config_prop);
            continue;
        }
        let key_clone = key.clone();
        let res = shortcut_manager.register(key.as_str(), move || {
            event_handle::handle_hotkey(config_prop.to_string(), key_clone.clone());
        });
        let register_ok = res.is_ok();
        debug!("register global hotkey {} {}", key, register_ok);
    }
}
