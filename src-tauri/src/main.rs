#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod cmd;
mod config;
mod event_handle;
mod global;
mod hotkey;
mod lang_detect;
mod tray;
mod window;

#[cfg(target_os = "windows")]
mod ahk;
#[cfg(target_os = "windows")]
mod ahk_worker;
#[cfg(target_os = "windows")]
mod get_selected_text;
#[cfg(target_os = "windows")]
mod hook;

use log::{debug, info};
use tauri::Manager;

fn main() {
    #[cfg(target_os = "windows")]
    {
        if !global::wirte_ahk_dll() {
            println!("write dll error");
            std::process::exit(1);
        }
        let args: Vec<String> = std::env::args().collect();
        if args.contains(&"--hook".to_string()) {
            // run ahk script
            let last_arg = args.last().unwrap();
            ahk_worker::run_ahk(
                std::env::current_dir().unwrap(),
                std::path::PathBuf::from(last_arg),
            );
            std::process::exit(1);
        }
    }
    tauri::Builder::default()
        .plugin(tauri_plugin_context_menu::init())
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_single_instance::init(|app, _, _cwd| {
            let win = app.get_window(global::TRANSLATOR_LABEL).unwrap();
            win.show().unwrap();
            win.set_focus().unwrap();
        }))
        .plugin(
            tauri_plugin_log::Builder::default()
                .targets([
                    tauri_plugin_log::LogTarget::LogDir,
                    tauri_plugin_log::LogTarget::Stdout,
                ])
                .build(),
        )
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))
        .system_tray(tauri::SystemTray::new())
        .setup(|app| {
            global::APP.get_or_init(|| app.handle());
            let base_path = dirs::config_dir()
                .unwrap()
                .join(app.config().tauri.bundle.identifier.clone());
            global::BASE_PATH.get_or_init(|| base_path);

            info!("init config store");
            config::init_config();

            #[cfg(target_os = "windows")]
            {
                if !config::is_first_run() && config::get_or_bool("enable_ahk", false) {
                    debug!("Run start ahk worker");
                    std::thread::spawn(move || {
                        ahk::start_worker_ahk();
                    });
                }
            }
            tray::generate_tray(app.app_handle());
            hotkey::init_hotkey();

            std::thread::spawn(move || {
                window::create_trans_window();
                 window::create_screenshot_window();
                //window::create_mini_trans_window();
                //window::show_mini_trans_window();

                if config::is_first_run() {
                    info!("First Run, opening config window");
                    window::create_setting_window();
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            cmd::set_proxy,
            cmd::unset_proxy,
            cmd::cut,
            cmd::active_window_is_self,
            config::get_config,
            config::set_config_by_key,
            ahk::read_script,
            ahk::write_script,
            ahk::start_autohotkey,
            ahk::kill_autohotkey,
            ahk::is_autohotkey_running,
            lang_detect::lang_detect,
            window::show_trans_win,
            window::show_setting_window,
            event_handle::get_image_base64,
            hook::selection_start,
            hook::selection_stop,
            hook::selection_state,
        ])
        .on_system_tray_event(event_handle::tray_event_handler)
        .build(tauri::generate_context!())
        .expect("error while running application")
        .run(|app, event| match event {
            tauri::RunEvent::Ready => {
                #[cfg(target_os = "windows")]
                {
                    if config::get_or_bool("enable_selection_assistant", false) {
                        let _ = hook::selection_start();
                    }
                }
            }
            tauri::RunEvent::Exit => {
                #[cfg(target_os = "windows")]
                {
                    hook::selection_stop();
                    let _ = ahk::kill_autohotkey();
                }
            }
            tauri::RunEvent::WindowEvent {
                label,
                event: tauri::WindowEvent::CloseRequested { api, .. },
                ..
            } => {
                if label != global::TRANSLATOR_LABEL {
                    return;
                }
                #[cfg(target_os = "macos")]
                {
                    tauri::AppHandle::hide(&app.app_handle()).unwrap();
                }
                #[cfg(not(target_os = "macos"))]
                {
                    let window = app.get_window(label.as_str()).unwrap();
                    window.hide().unwrap();
                }
                api.prevent_close();
            }
            _ => {}
        })
}
