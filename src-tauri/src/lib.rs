use serde::{ Deserialize, Serialize };
use std::collections::HashMap;
use tauri_plugin_store;

#[derive(Debug, Serialize, Deserialize)]
pub struct RequestHeader {
    pub name: String,
    pub value: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ResponseData {
    pub status: u16,
    pub status_text: String,
    pub headers: HashMap<String, String>,
    pub body: String,
    pub duration_ms: u128,
}

#[tauri::command]
async fn send_request(
    method: String,
    url: String,
    headers: Vec<RequestHeader>,
    body: Option<String>
) -> Result<ResponseData, String> {
    use reqwest::header::{ HeaderMap, HeaderName, HeaderValue };
    use std::time::Instant;

    let client = reqwest::Client::new();
    let mut header_map = HeaderMap::new();

    for h in headers {
        if h.name.trim().is_empty() {
            continue;
        }
        let name = HeaderName::from_bytes(h.name.trim().as_bytes()).map_err(|e|
            format!("Invalid header name {}: {}", h.name, e)
        )?;
        let value = HeaderValue::from_str(h.value.trim()).map_err(|e|
            format!("Invalid header value for {}: {}", h.name, e)
        )?;
        header_map.insert(name, value);
    }

    let mut request_builder = client.request(
        method.parse().map_err(|e| format!("Invalid HTTP method {}: {}", method, e))?,
        &url
    );

    request_builder = request_builder.headers(header_map);

    if let Some(b) = body {
        if !b.is_empty() {
            request_builder = request_builder.body(b);
        }
    }

    let start = Instant::now();
    let response = request_builder.send().await.map_err(|e| format!("Request error: {}", e))?;
    let duration_ms = start.elapsed().as_millis();

    let status = response.status();

    let mut headers_out = HashMap::new();
    for (name, value) in response.headers().iter() {
        headers_out.insert(name.to_string(), value.to_str().unwrap_or("<non-UTF8>").to_string());
    }

    let bytes = response.bytes().await.map_err(|e| format!("Read body error: {}", e))?;
    let body_text = String::from_utf8_lossy(&bytes).to_string();

    Ok(ResponseData {
        status: status.as_u16(),
        status_text: status.canonical_reason().unwrap_or("").to_string(),
        headers: headers_out,
        body: body_text,
        duration_ms,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder
        ::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app
                    .handle()
                    .plugin(
                        tauri_plugin_log::Builder::default().level(log::LevelFilter::Info).build()
                    )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![send_request])
        .plugin(tauri_plugin_store::Builder::new().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
