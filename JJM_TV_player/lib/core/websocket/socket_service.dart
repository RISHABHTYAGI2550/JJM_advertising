import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../config/app_config.dart';
import '../storage/storage_service.dart';
import '../network/api_service.dart';
import '../../models/display_models.dart';

class SocketService {
  static io.Socket? _socket;
  static Timer? _heartbeatTimer;
  static String? _currentScreenId;
  static String? _currentContent = 'queue';

  static Function(ResolvedConfig)? onConfigUpdate;
  static Function(String)? onTestCommand;
  static Function()? onUnpaired;
  static Function(bool isConnected)? onConnectionChanged;

  static Future<void> init({
    String? screenId,
    String? deviceToken,
    String? pairingCode,
    Function(Map<String, dynamic>)? onPaired,
  }) async {
    _currentScreenId = screenId;
    final baseUrl = await ApiService.getBaseUrl();

    disconnect();

    try {
      _socket = io.io(
        baseUrl,
        io.OptionBuilder()
            .setTransports(['websocket', 'polling'])
            .enableAutoConnect()
            .enableReconnection()
            .setReconnectionDelay(2000)
            .setReconnectionAttempts(999)
            .build(),
      );

      _socket!.onConnect((_) {
        onConnectionChanged?.call(true);

        if (_currentScreenId != null) {
          _socket!.emit('screen:register', {
            'screenId': _currentScreenId,
            'deviceToken': deviceToken,
          });
          _startHeartbeat();
        }
      });

      _socket!.onDisconnect((_) {
        onConnectionChanged?.call(false);
      });

      // Listen for pairing event if code provided
      if (pairingCode != null && onPaired != null) {
        _socket!.on('pair:$pairingCode', (data) {
          if (data is Map<String, dynamic>) {
            onPaired(data);
          }
        });
      }

      // Listen for live display configuration updates
      _socket!.on('config:update', (data) {
        if (data != null && data['config'] != null && onConfigUpdate != null) {
          final config = ResolvedConfig.fromJson(data['config']);
          StorageService.saveCachedConfig(config);
          onConfigUpdate!(config);
        }
      });

      // Listen for refresh command
      _socket!.on('command:refresh', (data) {
        if (data != null && data['config'] != null && onConfigUpdate != null) {
          final config = ResolvedConfig.fromJson(data['config']);
          onConfigUpdate!(config);
        }
      });

      // Listen for test display command
      _socket!.on('command:test', (data) {
        if (data != null && data['message'] != null && onTestCommand != null) {
          onTestCommand!(data['message']);
        }
      });

      // Listen for unpair/revoke
      _socket!.on('screen:unpaired', (_) {
        onUnpaired?.call();
      });

    } catch (_) {}
  }

  static void updateCurrentContent(String content) {
    _currentContent = content;
  }

  static void _startHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = Timer.periodic(const Duration(seconds: 20), (_) {
      if (_socket != null && _socket!.connected && _currentScreenId != null) {
        _socket!.emit('screen:heartbeat', {
          'screenId': _currentScreenId,
          'currentContent': _currentContent,
          'playerVersion': AppConfig.appVersion,
        });
      }
    });
  }

  static void disconnect() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
    _socket?.dispose();
    _socket = null;
  }
}
