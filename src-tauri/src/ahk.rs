use crate::{event_handle, global::*};
use log::debug;
use std::io::{BufRead, BufReader};
use std::{
    env,
    process::{Command, Stdio},
    sync::atomic::Ordering,
    thread,
};

pub fn start_worker_ahk() -> bool {
    let mut worker_guard = WORKER.lock().unwrap();
    if worker_guard.is_some() {
        debug!("worker is running");
        return false;
    }
    let cur_path = env::current_dir().unwrap();
    if !cur_path.join(DLL_FILE_NAME).exists() {
        debug!("dll not found: {:?}", cur_path.join(DLL_FILE_NAME));
        return false;
    }
    let script_path = BASE_PATH.get().unwrap().join(SCRIPT_FILE_NAME);
    if !script_path.exists() {
        debug!("script not found: {:?}", script_path);
        return false;
    }
    // 启动 worker 进程
    let child = match Command::new(env::args().next().unwrap())
        .args(["--hook", script_path.to_str().unwrap()])
        .stdout(Stdio::piped())
        .spawn()
    {
        Ok(c) => c,
        Err(e) => {
            debug!("start worker error: {:?}", e);
            return false;
        }
    };
    *worker_guard = Some(child);
    // 新线程监听worker进程的输出
    thread::spawn(move || {
        let stdout;
        {
            let mut worker_guard = WORKER.lock().unwrap();
            stdout = worker_guard
                .as_mut()
                .unwrap()
                .stdout
                .take()
                .expect("Failed to open stdout");
        }
        let reader = BufReader::new(stdout);
        let mut n = 0;
        for line in reader.lines() {
            match line {
                Ok(l) => {
                    n = 0;
                    event_handle::handle_ahk_event(l.clone());
                }
                Err(_) => {
                    debug!("read line error");
                    n += 1;
                }
            };
            if n > 10 {
                break;
            }
        }
        {
            let mut worker_guard = WORKER.lock().unwrap();
            *worker_guard = None;
        }
        debug!("worker exit");
        AHK_STATE.store(false, Ordering::SeqCst);
    });
    true
}

fn kill_worker_ahk() {
    debug!("kill worker starting...");
    let mut worker_guard = WORKER.lock().unwrap();
    if worker_guard.is_none() {
        debug!("worker is not running");
        return;
    }
    if let Some(mut worker) = worker_guard.take() {
        debug!("kill worker");
        worker.kill().unwrap();
    }
    debug!("kill worker done");
    *worker_guard = None;
}

#[tauri::command]
pub fn read_script() -> Result<String, String> {
    let script_path = BASE_PATH.get().unwrap().join(SCRIPT_FILE_NAME);
    if script_path.exists() {
        match std::fs::read_to_string(script_path) {
            Ok(script) => Ok(script),
            Err(e) => Err(e.to_string()),
        }
    } else {
        Err("script file not found".to_string())
    }
}

#[tauri::command]
pub fn write_script(script: String) -> Result<bool, String> {
    if script.is_empty() {
        return Err("script content is empty".to_string());
    }
    let script_path = BASE_PATH.get().unwrap().join(SCRIPT_FILE_NAME);
    match std::fs::write(script_path, script) {
        Ok(_) => Ok(true),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn start_autohotkey() -> Result<bool, ()> {
    if cfg!(target_os = "windows") {
        Ok(start_worker_ahk())
    } else {
        Ok(false)
    }
}

#[tauri::command]
pub fn kill_autohotkey() -> Result<(), ()> {
    if cfg!(target_os = "windows") {
        kill_worker_ahk()
    }
    Ok(())
}

#[tauri::command]
pub fn is_autohotkey_running() -> Result<bool, ()> {
    if cfg!(target_os = "windows") {
        Ok(AHK_STATE.load(Ordering::SeqCst))
    } else {
        Ok(false)
    }
}
