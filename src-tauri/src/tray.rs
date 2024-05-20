use tauri::{AppHandle, CustomMenuItem, SystemTrayMenu, SystemTrayMenuItem};

use crate::global::*;

pub fn generate_tray(app_handle: AppHandle) {
    let tray_handle = app_handle.tray_handle();
    let tray_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new(
            SHOW_TRANSLATOR.to_string(),
            "打开翻译窗口",
        ))
        .add_item(CustomMenuItem::new(
            SCREENSHOT_TRANSLATE.to_string(),
            "截图翻译",
        ))
        .add_item(CustomMenuItem::new(
            SCREENSHOT_RECOGNIZER.to_string(),
            "图片识别",
        ))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("setting".to_string(), "设置"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("relaunch".to_string(), "重启"))
        .add_item(CustomMenuItem::new("quit".to_string(), "退出"));

    tray_handle.set_menu(tray_menu).unwrap();
    #[cfg(not(target_os = "linux"))]
    tray_handle
        .set_tooltip(&format!("Tosa {}", app_handle.package_info().version))
        .unwrap();
}
