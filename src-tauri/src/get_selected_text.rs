#[cfg(not(target_os = "macos"))]
pub fn get_selected_text(enable_copy: bool) -> Result<String, Box<dyn std::error::Error>> {
    if cfg!(target_os = "windows") {
        let selected_text;
        let pickword_type = crate::config::get_or_string("pickword_type", "auto".into());
        if pickword_type == "auto" || enable_copy {
            let mut text = get_selected_text_by_automation().unwrap_or_default();
            if text.is_empty() {
                text = get_selected_text_by_clipboard().unwrap_or_default();
            }
            selected_text = text;
        } else if pickword_type == "copy" {
            selected_text = get_selected_text_by_clipboard().unwrap_or_default();
        } else {
            selected_text = get_selected_text_by_automation().unwrap_or_default();
        }
        Ok(selected_text)
    } else {
        get_selected_text_by_clipboard()
    }
}

#[cfg(target_os = "windows")]
fn get_selected_text_by_automation() -> Result<String, Box<dyn std::error::Error>> {
    use windows::Win32::System::Com::{CoCreateInstance, CoInitialize, CLSCTX_ALL};
    use windows::Win32::UI::Accessibility::{
        CUIAutomation, IUIAutomation, IUIAutomationTextChildPattern, IUIAutomationTextPattern,
        UIA_TextChildPatternId, UIA_TextPatternId,
    };
    unsafe {
        CoInitialize(None)?;
        let auto: IUIAutomation = CoCreateInstance(&CUIAutomation, None, CLSCTX_ALL)?;
        let tree_walker = auto.RawViewWalker()?;
        let mut focused_element = auto.GetFocusedElement()?;
        loop {
            let mut text_pattern_res: Result<IUIAutomationTextPattern, windows::core::Error> =
                focused_element.GetCurrentPatternAs(UIA_TextPatternId);

            if text_pattern_res.is_err() {
                let text_child_pattern: Result<
                    IUIAutomationTextChildPattern,
                    windows::core::Error,
                > = focused_element.GetCurrentPatternAs(UIA_TextChildPatternId);

                if text_child_pattern.is_err() {
                    focused_element = tree_walker.GetParentElement(&focused_element)?;
                    continue;
                }

                let container_el = text_child_pattern.unwrap().TextContainer()?;
                text_pattern_res = container_el.GetCurrentPatternAs(UIA_TextPatternId);
                if text_pattern_res.is_err() {
                    return Ok(String::new());
                }
            }
            let text_pattern = text_pattern_res.unwrap();
            let text_ranges = text_pattern.GetSelection()?;
            let length = text_ranges.Length()?;
            let mut target = String::new();
            for i in 0..length {
                if let Ok(text_range) = text_ranges.GetElement(i) {
                    if let Ok(text) = text_range.GetText(-1) {
                        let str = text.to_string();
                        target.push_str(&str);
                    }
                }
            }
            return Ok(target.trim().to_string());
        }
    }
}

#[cfg(not(target_os = "macos"))]
fn get_selected_text_by_clipboard() -> Result<String, Box<dyn std::error::Error>> {
    use arboard::Clipboard;

    let old_clipboard = (Clipboard::new()?.get_text(), Clipboard::new()?.get_image());
    let mut write_clipboard = Clipboard::new()?;
    let not_selected_placeholder = "";
    write_clipboard.set_text(not_selected_placeholder)?;

    if !copy() {
        return Ok(String::new());
    }

    let new_text = Clipboard::new()?.get_text();

    match old_clipboard {
        (Ok(v), _) => {
            write_clipboard.set_text(v.clone())?;
        }
        (_, Ok(image)) => {
            write_clipboard.set_image(image)?;
        }
        _ => {
            write_clipboard.clear()?;
        }
    }
    if let Ok(new) = new_text {
        if new.trim() == not_selected_placeholder.trim() {
            Ok(String::new())
        } else {
            Ok(new)
        }
    } else {
        Ok(String::new())
    }
}

lazy_static::lazy_static! {
    static ref COPY_LOCK: std::sync::Mutex<()> = std::sync::Mutex::new(());
}

#[allow(dead_code)]
#[cfg(not(target_os = "macos"))]
fn copy() -> bool {
    use enigo::*;
    use std::{thread, time::Duration};
    use windows::Win32::System::DataExchange::GetClipboardSequenceNumber;

    let _guard = COPY_LOCK.lock();
    let mut enigo = Enigo::new();
    let num_before = unsafe { GetClipboardSequenceNumber() };

    enigo.key_up(Key::Control);
    enigo.key_up(Key::Alt);
    enigo.key_up(Key::Shift);
    enigo.key_up(Key::Space);
    enigo.key_up(Key::Tab);
    enigo.key_up(Key::Escape);
    enigo.key_up(Key::CapsLock);
    enigo.key_up(Key::C);
    enigo.key_up(Key::LWin);

    // enigo.key_sequence_parse("{+CTRL}c{-CTRL}");
    enigo.key_down(Key::Control);
    thread::sleep(Duration::from_millis(50));
    enigo.key_click(Key::Layout('c'));
    thread::sleep(Duration::from_millis(50));
    enigo.key_up(Key::Control);
    thread::sleep(Duration::from_millis(100));
    let num_after = unsafe { GetClipboardSequenceNumber() };
    num_after != num_before
}

#[cfg(target_os = "macos")]
pub fn get_selected_text() -> Result<String, Box<dyn std::error::Error>> {
    match get_selected_text_by_ax() {
        Ok(text) => Ok(text),
        Err(err) => get_selected_text_by_clipboard_using_applescript(),
    }
}

#[cfg(target_os = "macos")]
fn get_selected_text_by_ax() -> Result<String, Box<dyn std::error::Error>> {
    match std::process::Command::new("osascript")
        .arg(APPLE_SELECTED_TEXT_AX)
        .output()
    {
        Ok(output) => {
            if output.status.success() {
                let content = String::from_utf8(output.stdout).expect("failed to parse output");
                let content = content.trim();
                Ok(content.to_string())
            } else {
                let err = output
                    .stderr
                    .into_iter()
                    .map(|c| c as char)
                    .collect::<String>()
                    .into();
                Err(err)
            }
        }
        Err(e) => Err(Box::new(e)),
    }
}

#[cfg(target_os = "macos")]
fn get_selected_text_by_clipboard_using_applescript() -> Result<String, Box<dyn std::error::Error>>
{
    let _guard = COPY_LOCK.lock();
    match std::process::Command::new("osascript")
        .arg(APPLE_SELECTED_TEXT)
        .output()
    {
        Ok(output) => {
            if output.status.success() {
                let content = String::from_utf8(output.stdout).expect("failed to parse output");
                let content = content.trim();
                Ok(content.to_string())
            } else {
                let err = output
                    .stderr
                    .into_iter()
                    .map(|c| c as char)
                    .collect::<String>()
                    .into();
                Err(err)
            }
        }
        Err(e) => Err(Box::new(e)),
    }
}

#[cfg(target_os = "macos")]
const APPLE_COPY_SCRIPT: &str = r#"
tell application "System Events"
    set frontmostProcess to first process whose frontmost is true
    set appName to name of frontmostProcess
end tell

tell application "System Events" to keystroke "c" using {command down}
"#;

#[cfg(target_os = "macos")]
const APPLE_SELECTED_TEXT_AX: &str = r#"
use sys : application "System Events"
set P to the first application process whose frontmost is true

set appName to name of P

if appName is equal to "Mail" then
	error "not support " & appName
end

if appName is equal to "Safari" then
	try
		tell application "Safari"
			set theText to (do JavaScript "getSelection().toString()" in document 1)
		end tell
		return theText
	end try
	error "not support Safari"
end

set _W to a reference to the first window of P

set _U to a reference to ¬
	(UI elements of P whose ¬
		name of attributes contains "AXSelectedText" and ¬
		value of attribute "AXSelectedText" is not "" and ¬
		class of value of attribute "AXSelectedText" is not class)

tell sys to if (count _U) ≠ 0 then ¬
	return the value of ¬
		attribute "AXSelectedText" of ¬
		_U's contents's first item

set _U to a reference to UI elements of _W

with timeout of 1 seconds
	tell sys to repeat while (_U exists)
		tell (a reference to ¬
			(_U whose ¬
				name of attributes contains "AXSelectedText" and ¬
				value of attribute "AXSelectedText" is not "" and ¬
				class of value of attribute "AXSelectedText" is not class)) ¬
			to if (count) ≠ 0 then return the value of ¬
			attribute "AXSelectedText" of its contents's first item

		set _U to a reference to (UI elements of _U)
	end repeat
end timeout

error "not found AXSelectedText"
"#;

#[cfg(target_os = "macos")]
const APPLE_SELECTED_TEXT: &str = r#"
use AppleScript version "2.4"
use scripting additions
use framework "Foundation"
use framework "AppKit"

tell application "System Events"
    set frontmostProcess to first process whose frontmost is true
    set appName to name of frontmostProcess
end tell

set savedClipboard to the clipboard

set thePasteboard to current application's NSPasteboard's generalPasteboard()
set theCount to thePasteboard's changeCount()

tell application "System Events" to keystroke "c" using {command down}
delay 0.1 -- Without this, the clipboard may have stale data.

if thePasteboard's changeCount() is theCount then
    return ""
end if

set theSelectedText to the clipboard

set the clipboard to savedClipboard

theSelectedText
"#;
