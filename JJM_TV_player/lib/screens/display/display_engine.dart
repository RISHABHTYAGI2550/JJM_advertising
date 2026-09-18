import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:video_player/video_player.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/network/api_service.dart';
import '../../core/storage/storage_service.dart';
import '../../core/websocket/socket_service.dart';
import '../../models/display_models.dart';
import '../pairing/pairing_view.dart';

class DisplayEngine extends StatefulWidget {
  final String screenId;
  final ResolvedConfig? initialConfig;

  const DisplayEngine({
    super.key,
    required this.screenId,
    this.initialConfig,
  });

  @override
  State<DisplayEngine> createState() => _DisplayEngineState();
}

class _DisplayEngineState extends State<DisplayEngine> {
  ResolvedConfig? _config;
  int _currentIndex = 0;
  Timer? _itemTimer;
  Timer? _pollTimer;

  // Controllers
  WebViewController? _webViewController;
  VideoPlayerController? _videoController;
  String? _loadedQueueUrl;

  bool _isShowingAd = false;
  String? _testMessage;
  Timer? _testMessageTimer;

  @override
  void initState() {
    super.initState();
    _config = widget.initialConfig;
    _initEngine();
  }

  @override
  void dispose() {
    _itemTimer?.cancel();
    _pollTimer?.cancel();
    _testMessageTimer?.cancel();
    _videoController?.dispose();
    super.dispose();
  }

  Future<void> _initEngine() async {
    // 1. Fetch fresh config or use initial/cache
    _config ??= await ApiService.fetchDisplayConfig(widget.screenId);

    if (_config != null) {
      _setupWebView(_config!.queueUrl);
    }

    // 2. Connect WebSocket for live updates
    final creds = await StorageService.getCredentials();
    SocketService.init(
      screenId: widget.screenId,
      deviceToken: creds?['deviceToken'],
    );

    SocketService.onConfigUpdate = (newConfig) {
      if (mounted) {
        setState(() {
          _config = newConfig;
        });
        // Check if queue URL changed
        if (_loadedQueueUrl != newConfig.queueUrl) {
          _setupWebView(newConfig.queueUrl);
        }
      }
    };

    SocketService.onTestCommand = (msg) {
      if (mounted) {
        setState(() {
          _testMessage = msg;
        });
        _testMessageTimer?.cancel();
        _testMessageTimer = Timer(const Duration(seconds: 10), () {
          if (mounted) setState(() => _testMessage = null);
        });
      }
    };

    SocketService.onUnpaired = () async {
      await StorageService.clearCredentials();
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const PairingView()),
        );
      }
    };

    // 3. Fallback periodic config polling (every 60s)
    _pollTimer = Timer.periodic(const Duration(seconds: 60), (_) async {
      final updated = await ApiService.fetchDisplayConfig(widget.screenId);
      if (updated != null && mounted) {
        setState(() => _config = updated);
      }
    });

    // 4. Start Playlist loop
    _startPlayback();
  }

  void _setupWebView(String url) {
    if (url.isEmpty) return;
    _loadedQueueUrl = url;

    // In web platform or unsupported environments webview behaves gracefully
    if (!kIsWeb) {
      try {
        final controller = WebViewController()
          ..setJavaScriptMode(JavaScriptMode.unrestricted)
          ..setBackgroundColor(const Color(0xFF0B1329))
          ..setNavigationDelegate(
            NavigationDelegate(
              onWebResourceError: (error) {
                // Log and silently retry or preserve state
              },
            ),
          )
          ..loadRequest(Uri.parse(url));

        setState(() {
          _webViewController = controller;
        });
      } catch (_) {}
    }
  }

  void _startPlayback() {
    _itemTimer?.cancel();
    if (_config == null || _config!.playlist.isEmpty) {
      // Fallback: stay on queue
      setState(() => _isShowingAd = false);
      return;
    }

    final currentItem = _config!.playlist[_currentIndex];
    final durationSeconds = currentItem.duration > 0 ? currentItem.duration : 15;

    if (currentItem.type == 'queue') {
      setState(() {
        _isShowingAd = false;
      });
      SocketService.updateCurrentContent('queue');
    } else {
      setState(() {
        _isShowingAd = true;
      });
      SocketService.updateCurrentContent(currentItem.type);

      if (currentItem.type == 'video' && currentItem.mediaUrl != null && currentItem.mediaUrl!.isNotEmpty) {
        _playVideo(currentItem.mediaUrl!);
      }
    }

    _itemTimer = Timer(Duration(seconds: durationSeconds), () {
      _nextItem();
    });
  }

  void _nextItem() {
    if (_config == null || _config!.playlist.isEmpty) return;

    _videoController?.pause();
    _videoController?.dispose();
    _videoController = null;

    setState(() {
      _currentIndex = (_currentIndex + 1) % _config!.playlist.length;
    });

    _startPlayback();
  }

  void _playVideo(String url) {
    _videoController?.dispose();
    try {
      final controller = VideoPlayerController.networkUrl(Uri.parse(url));
      controller.initialize().then((_) {
        if (mounted) {
          setState(() {
            _videoController = controller;
          });
          controller.play();
        }
      }).catchError((_) {
        // If video fails, quickly skip to next item to avoid blank screen
        _nextItem();
      });
    } catch (_) {
      _nextItem();
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentItem = (_config != null && _config!.playlist.isNotEmpty)
        ? _config!.playlist[_currentIndex]
        : null;

    final mediaUrl = currentItem?.mediaUrl ?? '';

    return Scaffold(
      backgroundColor: const Color(0xFF0B1329),
      body: Stack(
        fit: StackFit.expand,
        children: [
          // LAYER 1: The Live Doctor Queue Display (Always alive in background)
          if (!kIsWeb && _webViewController != null)
            WebViewWidget(controller: _webViewController!)
          else
            _buildWebFallbackQueue(),

          // LAYER 2: Advertisement Layer (Smooth fade overlay on top of queue)
          AnimatedOpacity(
            opacity: _isShowingAd ? 1.0 : 0.0,
            duration: const Duration(milliseconds: 600),
            child: IgnorePointer(
              ignoring: !_isShowingAd,
              child: _buildAdOverlay(currentItem, mediaUrl),
            ),
          ),

          // LAYER 3: Emergency / Hospital Announcement Bottom Ticker
          if (_config?.announcementTicker != null)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                color: const Color(0xFFDC2626),
                child: Row(
                  children: [
                    const Icon(Icons.warning_amber_rounded, color: Colors.white, size: 22),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _config!.announcementTicker!,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // LAYER 4: Remote Test Notification Banner
          if (_testMessage != null)
            Positioned(
              top: 20,
              left: 30,
              right: 30,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                decoration: BoxDecoration(
                  color: const Color(0xFF0284C7),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.4),
                      blurRadius: 15,
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline, color: Colors.white),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _testMessage!,
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildWebFallbackQueue() {
    return Container(
      color: const Color(0xFF0F172A),
      alignment: Alignment.center,
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.tv_rounded, color: Color(0xFF38BDF8), size: 64),
          const SizedBox(height: 16),
          Text(
            _config?.screenName ?? "JJM Hospital TV Display",
            style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            "Live Doctor Queue: ${_config?.queueUrl ?? 'Connecting...'}",
            style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 16, fontFamily: 'monospace'),
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: const [
                SizedBox(
                  width: 12,
                  height: 12,
                  child: CircularProgressIndicator(color: Color(0xFF10B981), strokeWidth: 2),
                ),
                SizedBox(width: 8),
                Text(
                  "HMS Sync Active • Ready for Android TV Kiosk",
                  style: TextStyle(color: Color(0xFF10B981), fontSize: 13, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAdOverlay(PlaylistItem? item, String mediaUrl) {
    if (item == null) return const SizedBox.shrink();

    if (item.type == 'video' && _videoController != null && _videoController!.value.isInitialized) {
      return Container(
        color: Colors.black,
        child: Center(
          child: AspectRatio(
            aspectRatio: _videoController!.value.aspectRatio,
            child: VideoPlayer(_videoController!),
          ),
        ),
      );
    }

    if (item.type == 'image' && mediaUrl.isNotEmpty) {
      return Container(
        color: Colors.black,
        child: CachedNetworkImage(
          imageUrl: mediaUrl,
          fit: BoxFit.cover,
          placeholder: (context, url) => Container(
            color: const Color(0xFF0F172A),
            child: const Center(
              child: CircularProgressIndicator(color: Color(0xFF38BDF8)),
            ),
          ),
          errorWidget: (context, url, error) => Container(
            color: const Color(0xFF0F172A),
            child: Center(
              child: Text(
                item.title,
                style: const TextStyle(color: Colors.white, fontSize: 24),
              ),
            ),
          ),
        ),
      );
    }

    // Text Announcement or Generic Ad
    return Container(
      color: const Color(0xFF0F172A),
      padding: const EdgeInsets.all(40),
      alignment: Alignment.center,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.campaign_rounded, color: Color(0xFF38BDF8), size: 72),
          const SizedBox(height: 20),
          Text(
            item.title,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w900),
          ),
        ],
      ),
    );
  }
}
