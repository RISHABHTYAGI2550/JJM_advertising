import 'dart:io';
import 'package:flutter/foundation.dart';

class AppConfig {
  static const String appVersion = "1.0.0";
  static const String defaultFallbackQueue = "https://hms.jjmhospitalkashipur.com/qd";

  // Production Render live backend URL
  static const String productionBackendUrl = "https://jjm-advertising.onrender.com";

  // Candidate hosts for behind-the-scenes auto discovery
  static const List<String> candidateUrls = [
    productionBackendUrl,          // Render Cloud Live Server
    "http://192.168.43.251:5000", // Host PC LAN IP on local Wi-Fi
    "http://localhost:5000",       // Windows / Web / Localhost
    "http://10.0.2.2:5000",        // Android Emulator Loopback
    "http://127.0.0.1:5000",
  ];

  static String get defaultBackendUrl {
    return productionBackendUrl;
  }
}
