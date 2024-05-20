use crate::{event_handle, global::STORE, window};
use log::debug;
use serde_json::{json, Value};
use std::collections::HashMap;

fn get_config_path() -> std::path::PathBuf {
    crate::global::BASE_PATH.get().unwrap().join(".config.dat")
}

pub fn init_config() {
    let config_path = get_config_path();
    debug!("Load config from: {:?}", config_path);
    if !config_path.exists() {
        debug!("Config file not found");
        return;
    }
    let content = match std::fs::read_to_string(config_path) {
        Ok(c) => c,
        Err(e) => {
            debug!("Config load error: {:?}", e);
            return;
        }
    };
    let map: HashMap<String, Value> = serde_json::from_str(&content).unwrap_or(HashMap::new());
    if map.is_empty() {
        debug!("Config is null");
        return;
    }
    let mut store = STORE.write().unwrap();
    *store = map;
}

pub fn get_config_with_default<T, F>(key: &str, default: T, f: F) -> T
where
    F: FnOnce(&Value) -> Option<T>,
{
    if let Some(value) = STORE.read().unwrap().get(key) {
        f(value).unwrap_or(default)
    } else {
        default
    }
}

pub fn get_or_bool(key: &str, default_value: bool) -> bool {
    get_config_with_default(key, default_value, |v| v.as_bool())
}

pub fn get_or_string(key: &str, default_value: String) -> String {
    get_config_with_default(key, default_value.clone(), |v| {
        v.as_str().map(|s| s.to_string())
    })
}

pub fn get_or_array(key: &str) -> Vec<String> {
    get_config_with_default(key, Vec::new(), |v| {
        if let Some(array) = v.as_array() {
            // 将 Value 数组转换成 String 数组
            Some(
                array
                    .iter()
                    .filter_map(|item| item.as_str().map(String::from))
                    .collect(),
            )
        } else {
            None
        }
    })
}

pub fn is_first_run() -> bool {
    STORE.read().unwrap().is_empty()
}

#[tauri::command]
pub fn get_config() -> Result<HashMap<String, Value>, ()> {
    Ok(STORE.read().unwrap().clone())
}

#[tauri::command]
pub fn set_config_by_key(
    current_window: tauri::Window,
    key: String,
    value: Value,
) -> Result<bool, String> {
    let content;
    {
        let mut store = STORE.write().unwrap();

        let _ = store.insert(key.clone(), value.clone());
        content = match serde_json::to_string_pretty(&store.clone()) {
            Ok(v) => v,
            Err(e) => {
                return Err(format!("serialize error: {:?}", e));
            }
        };
    }
    let config_path = get_config_path();
    if let Err(e) = std::fs::write(config_path, content) {
        return Err(format!("write file error: {:?}", e));
    }
    debug!("write {} to config success", key);

    event_handle::handle_config_change(key.clone(), value.clone());
    // 发送给除了当前窗口的其他窗口，触发配置同步
    window::emit_win(
        current_window,
        "config://updated",
        json!({
            "key": key.clone(),
            "value": value.clone(),
        }),
    );
    Ok(true)
}
