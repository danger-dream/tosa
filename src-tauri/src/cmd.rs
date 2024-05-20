use crate::global::JIEBA;

#[tauri::command]
pub fn set_proxy(proxy: &str, no_proxy: &str) -> Result<bool, ()> {
    std::env::set_var("http_proxy", &proxy);
    std::env::set_var("https_proxy", &proxy);
    std::env::set_var("all_proxy", &proxy);
    std::env::set_var("no_proxy", &no_proxy);
    Ok(true)
}

#[tauri::command]
pub fn unset_proxy() -> Result<bool, ()> {
    std::env::remove_var("http_proxy");
    std::env::remove_var("https_proxy");
    std::env::remove_var("all_proxy");
    std::env::remove_var("no_proxy");
    Ok(true)
}

#[tauri::command]
pub fn cut(text: &str) -> Result<Vec<&str>, ()> {
    let jieba = JIEBA.lock().unwrap();
    let words = jieba.cut(text.trim(), false);
    Ok(words
        .iter()
        .filter(|x| x.trim().len() > 1)
        .map(|x| *x)
        .collect::<Vec<&str>>())
}

#[tauri::command]
pub fn active_window_is_self() -> Result<bool, ()> {
    if let Ok(w) = active_win_pos_rs::get_active_window() {
        Ok(w.process_id == std::process::id() as u64)
    } else {
        Err(())
    }
}
