use crate::{
    config::{get_or_array, get_or_bool},
    get_selected_text::get_selected_text,
    global::*,
    window::*,
};
use active_win_pos_rs::get_active_window;
use log::debug;
use serde_json::{json, Value};
use std::{
    os::raw::{c_int, c_long, c_uint, c_ulong},
    sync::{
        atomic::{AtomicBool, AtomicU8, Ordering},
        Arc, Mutex,
    },
    thread,
    time::Duration,
};

enum Hhook__ {}
type HHook = *mut Hhook__;

lazy_static::lazy_static! {
    pub static ref MOUSE_HOOK_ENABLE: Arc<AtomicBool> = Arc::new(AtomicBool::new(false));
    pub static ref MOUSE_HISTORY: Mutex<Vec<(u128, i32, i32)>> = Mutex::new(Vec::new());
}
static mut HOOK: *mut Hhook__ = std::ptr::null_mut();

#[tauri::command]
pub fn selection_start() -> Result<bool, &'static str> {
    if MOUSE_HOOK_ENABLE.load(Ordering::SeqCst) {
        debug!("selection is running");
        return Err("划词功能已开启");
    }
    debug!("starting selection");
    thread::spawn(move || {
        debug!("creating selection window...");
        if get_window(SELECTION_TRANSLATOR_LABEL).is_some() {
            debug!("selection window exist skip create");
            return;
        }
        let win = create_window(SELECTION_TRANSLATOR_LABEL);
        win.set_skip_taskbar(true).unwrap();
        win.set_always_on_top(true).unwrap();
        debug!("create selection window succes");
    });
    MOUSE_HOOK_ENABLE.store(true, Ordering::SeqCst);
    Ok(mouse_hook())
}

#[tauri::command]
pub fn selection_state() -> Result<bool, ()> {
    unsafe { Ok(!HOOK.is_null()) }
}

#[tauri::command]
pub fn selection_stop() {
    MOUSE_HOOK_ENABLE.store(false, Ordering::SeqCst);
    unsafe {
        if !HOOK.is_null() {
            UnhookWindowsHookEx(HOOK);
            HOOK = std::ptr::null_mut();
        }
    }
    MOUSE_HISTORY.lock().unwrap().clear();
    if let Some(w) = get_window(SELECTION_TRANSLATOR_LABEL) {
        w.close().unwrap();
    }
}

fn hide_window() {
    if let Some(w) = get_window(SELECTION_TRANSLATOR_LABEL) {
        if !w.is_visible().unwrap() {
            return;
        }
        emit_to(SELECTION_TRANSLATOR_LABEL, "selection://hide-window", "");
    }
}

fn clear_mouse_history() {
    MOUSE_HISTORY.lock().unwrap().clear();
    hide_window();
}

fn contains_text_or_regex_ignore_case(text: &str, pattern: &str) -> bool {
    let pattern_with_ignore_case = format!("(?i){}", pattern);
    match regex::Regex::new(&pattern_with_ignore_case) {
        Ok(regex) => regex.is_match(text),
        Err(_) => text.to_lowercase().contains(&pattern.to_lowercase()),
    }
}

fn send_mouse_event(value: Value) {
    emit_to(SETTING_LABEL, "selection://mouse-event", value);
}

fn handle_mouse_left_down(x: i32, y: i32) {
    let time = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis();
    let mut history = MOUSE_HISTORY.lock().unwrap();
    history.push((time, x, y));
}

fn handle_mouse_left_up(x: i32, y: i32) {
    let last_x;
    let last_y;
    let last_time;
    {
        let history = MOUSE_HISTORY.lock().unwrap();
        if history.is_empty() {
            return;
        }
        let (time, x, y) = history.last().unwrap().clone();
        last_time = time;
        last_x = x;
        last_y = y;
    }
    let time = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis();

    //let position = Mouse::get_mouse_position();
    //	默认为单击
    let mut action = "click";
    //	默认鼠标双击间隔
    let double_click_time: u128;
    //	如果是windows系统，获取系统双击间隔
    if cfg!(target_os = "windows") {
        use windows::Win32::UI::Input::KeyboardAndMouse::GetDoubleClickTime;
        double_click_time = unsafe { GetDoubleClickTime() as u128 };
    } else {
        double_click_time = 700;
    }
    //getDoubleClickTime
    //	如果鼠标按下和释放时间间隔小于双击间隔
    if time - last_time < double_click_time {
        //	获取是否有上上次的鼠标按下事件
        let history = MOUSE_HISTORY.lock().unwrap();
        if history.len() >= 2 {
            let (p_time, p_x, p_y) = history.get(history.len() - 2).unwrap().clone();
            if time - p_time < double_click_time && (p_x - x).abs() < 3 && (p_y - y).abs() < 3 {
                action = "double-click";
            }
        }
    } else {
        // 释放时间间隔大于双击间隔，则认为是长按拖动
        action = "long-click";
        //	清空鼠标事件历史，事件历史主要用于判断双击事件。
        let mut history = MOUSE_HISTORY.lock().unwrap();
        history.clear();
    }
    //	如果鼠标释放时的位置离上次的距离小于10，则认为距离不足
    if (x - last_x).abs() < 10 && (y - last_y).abs() < 10 {
        if action != "double-click" {
            {
                let mut history = MOUSE_HISTORY.lock().unwrap();
                history.clear();
                history.push((time, x, y));
            }
            send_mouse_event(json!({
                "type": "distance_insufficient",
                "action": action,
                "x": x,
                "y": y,
                "last_x": last_x,
                "last_y": last_y,
            }));
            //	如果不是双击，则不进行处理
            hide_window();
            return;
        }
    }

    if let Ok(info) = get_active_window() {
        let is_self = std::process::id() as u64 == info.process_id;
        send_mouse_event(json!({
            "type": if is_self {"process_info_self"} else {"process_info"},
            "action": action,
            "x": x,
            "y": y,
            "title": info.title,
            "pid": info.process_id,
            "path": info.process_path.to_str().unwrap(),
            "app_name": info.app_name,
        }));
        if is_self {
            hide_window();
            return;
        }
        //  是否启用过滤规则
        if get_or_bool("enable_rule", false) {
            let taskword_skip = get_or_array("assistant_rules");
            if !taskword_skip.is_empty() {
                let info_str = format!(
                    "{}{}{}",
                    info.title,
                    info.process_path.to_str().unwrap(),
                    info.app_name
                );
                for skip in taskword_skip {
                    if contains_text_or_regex_ignore_case(&info_str.clone(), &skip) {
                        send_mouse_event(json!({
                            "type": "hit_rule",
                            "action": action,
                            "x": x,
                            "y": y,
                            "rule": skip
                        }));
                        hide_window();
                        return;
                    }
                }
            }
        }
    } else {
        send_mouse_event(json!({
            "type": "process_info_error",
            "action": action,
            "x": x,
            "y": y,
        }));
    }
    thread::spawn(move || {
        let selected_text = get_selected_text(false).unwrap_or_default();
        let short = selected_text.len() < 3;
        send_mouse_event(json!({
            "type": if short {"text_short"} else {"text"},
            "action": action,
            "x": x,
            "y": y,
            "text": selected_text
        }));

        if short {
            clear_mouse_history();
        } else {
            emit_to(
                SELECTION_TRANSLATOR_LABEL,
                "selection://mouse-selected_text",
                json!({
                    "x": x,
                    "y": y,
                    "text": selected_text
                }),
            );
        }
    });
}

fn mouse_hook() -> bool {
    debug!("start hook mouse");
    let state: Arc<AtomicU8> = Arc::new(AtomicU8::new(0));
    let state_clone = Arc::clone(&state);
    thread::spawn(move || {
        unsafe extern "system" fn handler(code: c_int, param: WParam, lpdata: LParam) -> LResult {
            if code >= 0 {
                let w_param = param as u32;
                let data = lpdata as *mut MSLLHOOKSTRUCT;
                let x = (*data).pt.x;
                let y = (*data).pt.y;
                match w_param {
                    WM_LBUTTONDOWN => {
                        thread::spawn(move || handle_mouse_left_down(x, y));
                    }
                    WM_LBUTTONUP => {
                        thread::spawn(move || handle_mouse_left_up(x, y));
                    }
                    WM_RBUTTONDOWN => clear_mouse_history(),
                    WM_MBUTTONDOWN => clear_mouse_history(),
                    _ => {}
                };
            }
            CallNextHookEx(HOOK, code, param, lpdata)
        }
        unsafe {
            HOOK = SetWindowsHookExA(WH_MOUSE_LL, Some(handler), std::ptr::null_mut(), 0);
            if HOOK.is_null() {
                state_clone.store(1, Ordering::SeqCst);
                MOUSE_HOOK_ENABLE.store(false, Ordering::SeqCst);
                return;
            }
            debug!("mouse hook is running");
            state_clone.store(2, Ordering::SeqCst);
            let mut msg: Msg = std::mem::zeroed();
            while MOUSE_HOOK_ENABLE.load(Ordering::SeqCst) {
                if PeekMessageA(&mut msg as *mut Msg, std::ptr::null_mut(), 0, 0, 0x0001) {
                    TranslateMessage(&msg as *const Msg);
                    DispatchMessageA(&msg as *const Msg);
                } else {
                    thread::sleep(std::time::Duration::from_millis(10));
                }
            }
            HOOK = std::ptr::null_mut();
        }
    });
    loop {
        let n = state.load(Ordering::SeqCst);
        if n == 1 {
            return true;
        }
        if n == 2 {
            return false;
        }
        thread::sleep(Duration::from_millis(100));
    }
}

const WM_LBUTTONDOWN: c_uint = 0x0201;
const WM_LBUTTONUP: c_uint = 0x0202;
const WM_MBUTTONDOWN: c_uint = 0x0207;
const WM_RBUTTONDOWN: c_uint = 0x0204;
const WH_MOUSE_LL: c_int = 14;
type LParam = *mut c_long;
type WParam = usize;
type LResult = *mut c_int;
type HookProc =
    Option<unsafe extern "system" fn(code: c_int, w_param: WParam, l_param: LParam) -> LResult>;

enum HWND__ {}
type HWND = *mut HWND__;
#[repr(C)]
struct Msg {
    hwnd: HWND,
    message: c_uint,
    w_param: usize,
    l_param: *mut c_long,
    time: c_ulong,
    pt: Point,
}

#[repr(C)]
#[derive(Clone, Copy)]
struct Point {
    x: c_long,
    y: c_long,
}

#[repr(C)]
#[derive(Clone, Copy)]
struct MSLLHOOKSTRUCT {
    pt: Point,
    mouse_data: c_ulong,
    flags: c_ulong,
    time: c_ulong,
    dw_extra_info: *mut c_long,
}

#[link(name = "user32")]
extern "system" {
    fn SetWindowsHookExA(
        id_hook: c_int,
        lpfn: HookProc,
        hmod: *mut i32,
        dw_thread_id: c_ulong,
    ) -> HHook;
    fn CallNextHookEx(
        hhk: HHook,
        n_code: c_int,
        w_param: usize,
        l_param: *mut c_long,
    ) -> *mut c_int;
    fn PeekMessageA(
        lp_msg: *mut Msg,
        h_wnd: HWND,
        w_msg_filter_min: c_uint,
        w_msg_filter_max: c_uint,
        w_remove_msg: c_uint,
    ) -> bool;
    fn TranslateMessage(lp_msg: *const Msg) -> bool;
    fn DispatchMessageA(lp_msg: *const Msg) -> c_long;
    fn UnhookWindowsHookEx(hhk: HHook) -> bool;
}
