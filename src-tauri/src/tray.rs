use crate::event_handle::{tray_event_menu_handler, tray_event_tray_handler};
use crate::global::*;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, Runtime,
};

pub fn generate_tray<R: Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<()> {
    let translator_i = MenuItem::with_id(app, SHOW_TRANSLATOR, "打开翻译窗口", true, None::<&str>)?;
    let screen_translate =
        MenuItem::with_id(app, SCREENSHOT_TRANSLATE, "截图翻译", true, None::<&str>)?;
    let screenshot_i =
        MenuItem::with_id(app, SCREENSHOT_RECOGNIZER, "图片识别", true, None::<&str>)?;
    let setting_i = MenuItem::with_id(app, "setting", "设置", true, None::<&str>)?;
    let relaunch_i = MenuItem::with_id(app, "relaunch", "重启", true, None::<&str>)?;
    let quit_i = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[
            &translator_i,
            &screen_translate,
            &screenshot_i,
            &setting_i,
            &relaunch_i,
            &quit_i,
        ],
    )?;
    let _ = TrayIconBuilder::with_id("tray")
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .menu_on_left_click(false)
        .on_menu_event(move |app, event| {
            tray_event_menu_handler(app, event);
            /*"quit" => {
                app.exit(0);
            }*/
            // Add more events here
        })
        .on_tray_icon_event(|tray, event| {
            tray_event_tray_handler(tray, event);
            /*if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }*/
        })
        .build(app);
    Ok(())
    /*let tray_handle = app_handle.tray_handle();
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
        .unwrap();*/
}
