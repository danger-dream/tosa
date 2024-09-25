use crate::{
    config::get_or_bool, get_selected_text::get_selected_text, global::*, hotkey, window::*,
};
use base64::{engine::general_purpose, Engine as _};
use log::debug;
use mouse_position::mouse_position::Mouse;
use screenshots::{Compression, Screen};
use tauri::menu::MenuEvent;
use tauri::tray::TrayIcon;
use tauri::AppHandle;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, Runtime,
};

fn handlle_hotkey_name_event(name: &str) {
    debug!("hotkey event: {}", name);
    match name {
        SHOW_TRANSLATOR => {
            show_trans_win(true);
        }
        SCREENSHOT_TRANSLATE | SCREENSHOT_RECOGNIZER => {
            debug!("{}", name);
            screenshot(name);
        }
        SELECTION_TRANSLATE => {
            std::thread::spawn(move || {
                let selected_text = get_selected_text(true).unwrap_or_default();
                if selected_text.len() < 3 {
                    return;
                }
                emit_to(TRANSLATOR_LABEL, "translator://text", selected_text);
            });
        }
        _ => {}
    }
}

pub fn screenshot(name: &str) {
    debug!("screenshot: {}", name);
    if let Some(w) = get_window(TRANSLATOR_LABEL) {
        w.hide().unwrap();
    }
    if let Some(w) = get_window(SCREEN_CAPTURE_LABEL) {
        if w.is_visible().unwrap() {
            return;
        }
    }
    let start = std::time::Instant::now();
    let (x, y) = match Mouse::get_mouse_position() {
        Mouse::Position { x, y } => (x, y),
        Mouse::Error => (0, 0),
    };
    let ocr_err_tip = get_or_bool("ocr_err_tip", false);
    let screen = match Screen::from_point(x, y) {
        Ok(s) => s,
        Err(_) => {
            debug!("无法获取鼠标所在屏幕");
            if ocr_err_tip {
                message_box("错误", "无法获取鼠标所在屏幕");
            }
            return;
        }
    };
    let image = match screen.capture() {
        Ok(i) => i,
        Err(e) => {
            debug!("截图失败: {}", e);
            if ocr_err_tip {
                message_box("错误", format!("截图失败: {}", e).as_str());
            }
            return;
        }
    };
    let bytes = image.to_png(Compression::Fast).unwrap();
    let base64 = general_purpose::STANDARD.encode(&bytes);
    debug!("screenshot: {:?}", start.elapsed());
    emit_to(
        SCREEN_CAPTURE_LABEL,
        "screenshot://capture",
        serde_json::json!({
            "name": name,
            "base64": base64,
        }),
    );
}

#[tauri::command]
pub fn get_image_base64() -> Result<String, ()> {
    let mut base64_guard = OCR_BASE64.lock().unwrap();
    let base64 = base64_guard.clone();
    *base64_guard = String::new();
    Ok(base64)
}

pub fn tray_event_tray_handler<R: Runtime>(app: &TrayIcon<R>, event: TrayIconEvent) {
    match event {
        TrayIconEvent::DoubleClick { position: _, .. } => {
            show_trans_win(true);
        }
        TrayIconEvent::Click { id, .. } => match id.0.as_str() {
            "setting" => {
                show_setting_window();
            }
            "relaunch" => {
                app.app_handle().restart();
                //app.restart();
            }
            "quit" => {
                std::process::exit(0);
            }
            name => {
                handlle_hotkey_name_event(name);
            }
        },
        _ => {}
    }
}
pub fn tray_event_menu_handler<R: Runtime>(app: &AppHandle<R>, event: MenuEvent) {
    match event.id.as_ref() {
        "setting" => {
            show_setting_window();
        }
        "relaunch" => {
            app.app_handle().restart();
            //app.restart();
        }
        "quit" => {
            std::process::exit(0);
        }
        name => {
            handlle_hotkey_name_event(name);
        }
    }
}
pub fn handle_hotkey(name: String, key: String) {
    debug!("hotkey {} callback", key.clone());
    handlle_hotkey_name_event(name.as_str());
}

pub fn handle_ahk_event(line: String) {
    if let Ok(v) = serde_json::from_str::<serde_json::Value>(&line.clone()) {
        if let Some(action) = v.get("action") {
            let action = action.as_str().unwrap();
            if action == "not_running" {
                AHK_STATE.store(false, std::sync::atomic::Ordering::SeqCst);
                return;
            }
            if action == "running" {
                AHK_STATE.store(true, std::sync::atomic::Ordering::SeqCst);
                return;
            }
            handlle_hotkey_name_event(action);
        }
    }
    debug!("ahk event: {}", line.clone());
    emit_to(SETTING_LABEL, "ahk://event", line);
}

pub fn handle_config_change(key: String, value: serde_json::Value) {
    match key.as_str() {
        SHOW_TRANSLATOR | SCREENSHOT_TRANSLATE | SELECTION_TRANSLATE | SCREENSHOT_RECOGNIZER => {
            hotkey::init_hotkey();
        }
        _ => {}
    }

    debug!("config change: {} {:?}", key, value);
}
