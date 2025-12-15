// main.rs
use std::net::TcpListener;
use std::io::{Read, Write};
use std::str;

fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").expect("Failed to bind to address");
    println!("Cosmic Server running on port 7878");

    for stream in listener.incoming() {
        let mut stream = match stream {
            Ok(stream) => stream,
            Err(e) => {
                eprintln!("Connection failed: {}", e);
                continue;
            }
        };
        
        // Read request data
        let mut buffer = [0; 1024];
        match stream.read(&mut buffer) {
            Ok(bytes_read) => {
                let request = match str::from_utf8(&buffer[..bytes_read]) {
                    Ok(request) => request,
                    Err(_) => {
                        eprintln!("Invalid UTF-8 in request");
                        continue;
                    }
                };

                // Parse request path
                let request_line = request.lines().next().unwrap_or("");
                let parts: Vec<&str> = request_line.split_whitespace().collect();
                
                if parts.len() >= 2 {
                    let path = parts[1];
                    
                    let (status, content_type, body) = match path {
                        "/" => {
                            let html = r#"<!DOCTYPE html>
<html>
<head><title>Cosmic IDE</title></head>
<body><h1>Welcome to Cosmic IDE</h1></body>
</html>"#;
                            ("200 OK", "text/html", html.to_string())
                        }
                        "/api/health" => {
                            let json = r#"{"status": "healthy", "message": "Cosmic Server is running!"}"#;
                            ("200 OK", "application/json", json.to_string())
                        }
                        _ => {
                            let html = r#"<!DOCTYPE html>
<html><head><title>404</title></head>
<body><h1>404 - Page Not Found</h1></body>
</html>"#;
                            ("404 Not Found", "text/html", html.to_string())
                        }
                    };

                    // Send response
                    let response = format!("HTTP/1.1 {}\r\nContent-Type: {}\r\nContent-Length: {}\r\n\r\n{}",
                                         status, content_type, body.len(), body);
                    match stream.write(response.as_bytes()) {
                        Ok(_) => {
                            stream.flush().expect("Failed to flush stream");
                            println!("Request to {} processed successfully", path);
                        }
                        Err(e) => eprintln!("Failed to write response: {}", e),
                    }
                }
            }
            Err(e) => eprintln!("Failed to read from stream: {}", e),
        }
    }
}