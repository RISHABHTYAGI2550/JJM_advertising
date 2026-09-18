import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../storage/storage_service.dart';
import '../../models/display_models.dart';

class ApiService {
  static String? _resolvedBaseUrl;

  static Future<String> getBaseUrl() async {
    if (_resolvedBaseUrl != null) return _resolvedBaseUrl!;

    final saved = await StorageService.getBackendUrl();
    if (saved != null && saved.isNotEmpty) {
      if (await _testHealth(saved)) {
        _resolvedBaseUrl = saved;
        return saved;
      }
    }

    // Auto-discover candidate behind the scenes
    final candidates = [
      AppConfig.defaultBackendUrl,
      ...AppConfig.candidateUrls,
    ];

    for (final candidate in candidates) {
      if (await _testHealth(candidate)) {
        _resolvedBaseUrl = candidate;
        await StorageService.saveBackendUrl(candidate);
        return candidate;
      }
    }

    return AppConfig.defaultBackendUrl;
  }

  static Future<bool> _testHealth(String base) async {
    try {
      final res = await http.get(Uri.parse('$base/api/health')).timeout(const Duration(milliseconds: 1800));
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  // Request new pairing session from backend with auto discovery
  static Future<Map<String, dynamic>?> requestPairingSession({
    String? socketId,
    Map<String, dynamic>? metadata,
  }) async {
    final candidates = <String>[
      if (_resolvedBaseUrl != null) _resolvedBaseUrl!,
      await StorageService.getBackendUrl() ?? '',
      AppConfig.defaultBackendUrl,
      ...AppConfig.candidateUrls,
    ].where((u) => u.isNotEmpty).toSet().toList();

    for (final baseUrl in candidates) {
      try {
        final url = Uri.parse('$baseUrl/api/screens/pair-session');
        final res = await http.post(
          url,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'socketId': socketId,
            'deviceMetadata': metadata ?? {'platform': 'Android TV', 'version': AppConfig.appVersion},
          }),
        ).timeout(const Duration(seconds: 3));

        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          if (data != null && data['session'] != null) {
            _resolvedBaseUrl = baseUrl;
            await StorageService.saveBackendUrl(baseUrl);
            return data['session'];
          }
        }
      } catch (_) {
        // Try next candidate seamlessly in the background
      }
    }
    return null;
  }

  // Fetch resolved display configuration for registered screen
  static Future<ResolvedConfig?> fetchDisplayConfig(String screenId) async {
    try {
      final baseUrl = await getBaseUrl();
      final url = Uri.parse('$baseUrl/api/display/$screenId/config');
      final res = await http.get(url).timeout(const Duration(seconds: 8));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && data['config'] != null) {
          final config = ResolvedConfig.fromJson(data['config']);
          await StorageService.saveCachedConfig(config);
          return config;
        }
      }
    } catch (e) {
      // Failed to reach backend, return cached config
    }
    return await StorageService.getCachedConfig();
  }

  // HTTP Fallback Heartbeat
  static Future<void> sendHeartbeat({
    required String screenId,
    required String currentContent,
  }) async {
    try {
      final baseUrl = await getBaseUrl();
      final url = Uri.parse('$baseUrl/api/display/$screenId/heartbeat');
      await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'currentContent': currentContent,
          'playerVersion': AppConfig.appVersion,
        }),
      ).timeout(const Duration(seconds: 5));
    } catch (_) {}
  }
}
