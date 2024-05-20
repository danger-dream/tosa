use crate::{config::get_or_string, global::*};
use log::debug;
use mouse_position::mouse_position::Mouse;
use tauri::{
    api::dialog, Manager, PhysicalPosition, PhysicalSize, Window, WindowBuilder, WindowUrl,
};
use tauri_plugin_positioner::{Position, WindowExt};
use window_shadows::set_shadow;

pub fn message_box(title: &str, message: &str) {
    if let Some(w) = get_window(TRANSLATOR_LABEL) {
        dialog::message(Some(&w), title, message);
    }
}

pub fn get_window(label: &str) -> Option<Window> {
    if let Some(app) = APP.get() {
        app.get_window(label)
    } else {
        None
    }
}

pub fn emit_to<S: serde::Serialize + Clone>(label: &str, event: &str, payload: S) {
    if let Some(app) = APP.get() {
        let _ = app.emit_to(label, event, payload);
    }
}

pub fn emit_win<S: serde::Serialize + Clone>(win: Window, event: &str, payload: S) {
    if let Some(app) = APP.get() {
        app.windows().iter().for_each(|(label, _w)| {
            if label != win.label() {
                let _ = app.emit_to(label, event, payload.clone());
            }
        });
    }
}

pub fn create_window(label: &str) -> Window {
    match get_window(label) {
        Some(w) => {
            debug!("window {} exist, skip create", label);
            w
        }
        None => {
            let app_handle = APP.get().unwrap();
            let builder =
                WindowBuilder::new(app_handle, label, WindowUrl::App("index.html".into()))
                    .focused(true)
                    .visible(false)
                    .transparent(true)
                    .decorations(false)
                    .skip_taskbar(true)
                    .resizable(false);
            builder.build().unwrap()
        }
    }
}

pub fn create_trans_window() {
    debug!("creating translate window...");

    let win = create_window(TRANSLATOR_LABEL);
    let monitor = win.current_monitor().unwrap().unwrap();
    let dpi = monitor.scale_factor();
    win.set_size(PhysicalSize::new((450 as f64) * dpi, (230 as f64) * dpi))
        .unwrap();
    //win.open_devtools();
    debug!("create translate window succes");
}

#[tauri::command]
pub fn show_trans_win(focus: bool) {
    let win = match get_window(TRANSLATOR_LABEL) {
        Some(w) => w,
        None => {
            return;
        }
    };
    let position_type = get_or_string("win_position", "right-top".into());

    if position_type == "last" {
    } else if position_type == "center" {
        win.move_window(Position::Center).unwrap();
    } else {
        let (mut x, mut y) = match Mouse::get_mouse_position() {
            Mouse::Position { x, y } => (x, y),
            Mouse::Error => (0, 0),
        };
        debug!("mouse_position x:{}, y: {}", x, y);

        if position_type == "right-top" {
            let mouse_monitor = match win.available_monitors().unwrap().iter().find(|m| {
                let size = m.size();
                let position = m.position();
                x >= position.x
                    && x <= (position.x + size.width as i32)
                    && y >= position.y
                    && y <= (position.y + size.height as i32)
            }) {
                Some(m) => m.clone(),
                None => win.current_monitor().unwrap().unwrap(),
            };
            let pos = mouse_monitor.position();
            let size = mouse_monitor.size();
            let window_size = win.outer_size().unwrap();
            x = pos.x + size.width as i32 - window_size.width as i32 - 50;
            y = pos.y + 50;
            debug!("right top position: x: {}, y: {}", x, y);
        }
        win.set_position(PhysicalPosition::new(x as f64, y as f64))
            .unwrap();
    }
    win.show().unwrap();
    win.set_always_on_top(true).unwrap();
    if focus {
        win.set_focus().unwrap();
        emit_to(TRANSLATOR_LABEL, "translator://focus", "");
    }
}

pub fn create_setting_window() {
    debug!("creating setting window...");

    let win = create_window(SETTING_LABEL);
    win.set_skip_taskbar(false).unwrap();
    win.set_resizable(true).unwrap();
    let monitor = win.current_monitor().unwrap().unwrap();
    let dpi = monitor.scale_factor();
    let width = 1024;
    let height = 768;
    win.set_size(PhysicalSize::new(
        (width as f64) * dpi,
        (height as f64) * dpi,
    ))
    .unwrap();
    win.move_window(Position::Center).unwrap();
    set_shadow(&win, true).unwrap();
    win.show().unwrap();
    win.set_focus().unwrap();
    debug!("create setting window succes");
}

#[tauri::command]
pub fn show_setting_window() {
    debug!("show setting window...");

    if let Some(w) = get_window(SETTING_LABEL) {
        debug!("setting window exist， focus window");
        w.show().unwrap();
        w.set_focus().unwrap();
    } else {
        std::thread::spawn(move || {
            create_setting_window();
        });
    }
}

pub fn create_screenshot_window() -> Window {
    debug!("create screenshot window");
    create_window(SCREEN_CAPTURE_LABEL)
}
