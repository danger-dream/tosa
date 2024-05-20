use crate::global::DLL_FILE_NAME;
use libloading::{Library, Symbol};
use std::ffi::c_void;
use std::path::PathBuf;
use std::thread;
use std::time::Duration;
use widestring::U16CString;

type NewThread = unsafe extern "C" fn(*const u16, *const u16, *const u16) -> *mut c_void;
type AhkReady = unsafe extern "C" fn(*mut c_void) -> i32;
//type AddScript = unsafe extern "C" fn(*const u16, i32, *mut c_void) -> *mut c_void;

struct ThreadHandle(*mut c_void);

unsafe impl Send for ThreadHandle {}

fn print_action(action: &str) {
    println!(
        "{}",
        serde_json::json!({
            "action": action
        })
    );
}

extern "C" fn rust_callback(action: *const u16) {
    unsafe {
        let action_str = U16CString::from_ptr_str(action);
        match action_str.to_string() {
            Ok(s) => print_action(s.as_str()),
            Err(e) => println!("Error converting string: {:?}", e),
        }
    }
}

pub fn run_ahk(cur_path: PathBuf, script_path: PathBuf) {
    println!("start autohotkey worker");
    let dll_path = cur_path.join(DLL_FILE_NAME);
    if !dll_path.exists() || !script_path.exists() {
        println!("dll or script not found: {:?}, {:?}", dll_path, script_path);
        std::process::exit(1);
    }
    let file_script = match std::fs::read_to_string(script_path) {
        Ok(script) => script,
        Err(e) => {
            println!("read script Error: {:?}", e);
            std::process::exit(1);
        }
    };
    unsafe {
        let lib = Library::new(dll_path).unwrap();

        let ahk_ready: Symbol<AhkReady> = lib.get(b"ahkReady").unwrap();
        //let add_script: Symbol<AddScript> = lib.get(b"addScript").unwrap();
        let new_thread: Symbol<NewThread> = lib.get(b"NewThread").unwrap();

        let function_pointer: usize = rust_callback as *const () as usize;
        let script = format!(
            "#NoTrayIcon\nPersistent True\n__jsfncb(action) {{\nDllCall({}, 'Str', action)\n}}\nrust_callback(action) {{\n__jsfncb(action)\n}}\n\n{}", 
            function_pointer.to_string(),
            file_script
        );

        let thread_id = new_thread(
            U16CString::from_str(script).unwrap().as_ptr(),
            U16CString::from_str("asd").unwrap().as_ptr(),
            U16CString::from_str("ahk").unwrap().as_ptr(),
        );

        let mut num = 0;
        while num < 10 {
            if ahk_ready(thread_id) == 0 {
                print_action("not_running");
                num += 1;
            } else {
                print_action("running");
                num = 0;
            }
            thread::sleep(Duration::from_secs(1));
        }
    }
}
