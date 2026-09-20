import 'dart:async';
import 'dart:convert';
import 'dart:ui' as ui;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
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

class _DisplayEngineState extends State<DisplayEngine> with SingleTickerProviderStateMixin {
  ResolvedConfig? _config;
  int _currentIndex = 0;
  Timer? _itemTimer;
  Timer? _pollTimer;
  Timer? _snapshotTimer;
  Timer? _emergencyAutoDismissTimer;
  String _serverBaseUrl = '';

  // Controllers
  WebViewController? _webViewController;
  VideoPlayerController? _videoController;
  String? _loadedQueueUrl;

  bool _isShowingAd = false;
  bool _isPowerOff = false;
  String? _testMessage;
  Timer? _testMessageTimer;

  // Global key for real-time CCTV snapshot capture
  final GlobalKey _previewContainerKey = GlobalKey();

  // Pulse animation controller for emergency highlights
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _config = widget.initialConfig;
    _isPowerOff = _config?.settings['powerState'] == 'off';

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 0.85, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _initEngine();
  }

  @override
  void dispose() {
    _itemTimer?.cancel();
    _pollTimer?.cancel();
    _snapshotTimer?.cancel();
    _emergencyAutoDismissTimer?.cancel();
    _testMessageTimer?.cancel();
    _videoController?.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  /// Resolves relative URLs (/uploads/...) to absolute server URLs
  /// and maps 'localhost' to the actual server IP on real Android TV devices
  String _resolveMediaUrl(String? rawUrl) {
    if (rawUrl == null || rawUrl.isEmpty) return '';
    String url = rawUrl.trim();

    if (url.startsWith('/')) {
      if (_serverBaseUrl.isNotEmpty) {
        url = '$_serverBaseUrl$url';
      }
    }

    if (!kIsWeb && _serverBaseUrl.isNotEmpty && url.contains('localhost')) {
      final serverUri = Uri.tryParse(_serverBaseUrl);
      if (serverUri != null && serverUri.host.isNotEmpty && serverUri.host != 'localhost') {
        url = url.replaceAll('localhost', serverUri.host);
      }
    }

    return url;
  }

  /// Captures the current TV screen widget and sends base64 image over WebSocket
  Future<void> _captureAndSendSnapshot() async {
    try {
      final boundary = _previewContainerKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary != null) {
        final image = await boundary.toImage(pixelRatio: 0.5);
        final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
        if (byteData != null) {
          final bytes = byteData.buffer.asUint8List();
          final base64String = 'data:image/png;base64,${base64Encode(bytes)}';
          SocketService.sendSnapshot(base64String);
        }
      }
    } catch (_) {}
  }

  Future<void> _initEngine() async {
    // 0. Cache base server URL for media resolution
    _serverBaseUrl = await ApiService.getBaseUrl();

    // 1. Fetch fresh config or use initial/cache
    _config ??= await ApiService.fetchDisplayConfig(widget.screenId);

    if (_config != null) {
      _isPowerOff = _config!.settings['powerState'] == 'off';
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
        final wasPaused = _config?.settings['isPaused'] == true;
        final isNowPaused = newConfig.settings['isPaused'] == true;
        final isNowPowerOff = newConfig.settings['powerState'] == 'off';

        setState(() {
          _config = newConfig;
          _isPowerOff = isNowPowerOff;
          if (isNowPaused || isNowPowerOff) {
            _isShowingAd = false;
          }
        });

        // Check if queue URL changed
        if (_loadedQueueUrl != newConfig.queueUrl) {
          _setupWebView(newConfig.queueUrl);
        }

        // Handle pause / power state transitions
        if (isNowPaused || isNowPowerOff) {
          _videoController?.pause();
          _videoController?.dispose();
          _videoController = null;
          _itemTimer?.cancel();
          SocketService.updateCurrentContent('queue');
        } else if (wasPaused && !isNowPaused) {
          _startPlayback();
        }
      }
    };

    // Instant real-time playback pause / resume (Queue-Only vs Rotating Ads)
    SocketService.onPlaybackCommand = (bool isPaused) {
      if (mounted) {
        setState(() {
          if (_config != null) {
            _config!.settings['isPaused'] = isPaused;
          }
          if (isPaused) {
            _isShowingAd = false;
          }
        });
        if (isPaused) {
          _videoController?.pause();
          _videoController?.dispose();
          _videoController = null;
          _itemTimer?.cancel();
          SocketService.updateCurrentContent('queue');
        } else {
          _startPlayback();
        }
      }
    };

    // Instant real-time remote power (Standby on / off)
    SocketService.onPowerCommand = (bool isPowerOn) {
      if (mounted) {
        setState(() {
          _isPowerOff = !isPowerOn;
          if (_config != null) {
            _config!.settings['powerState'] = isPowerOn ? 'on' : 'off';
          }
          if (!isPowerOn) {
            _isShowingAd = false;
          }
        });
        if (!isPowerOn) {
          _videoController?.pause();
          _videoController?.dispose();
          _videoController = null;
          _itemTimer?.cancel();
        } else {
          _startPlayback();
        }
      }
    };

    // Snapshot on-demand trigger
    SocketService.onRequestSnapshot = () {
      _captureAndSendSnapshot();
    };

    // Instant real-time emergency announcement push / dismiss with auto-dismiss duration
    SocketService.onEmergencyUpdate = (Map<String, dynamic>? announcement) {
      _emergencyAutoDismissTimer?.cancel();
      _emergencyAutoDismissTimer = null;

      if (mounted) {
        setState(() {
          if (_config != null) {
            _config!.settings['emergencyAnnouncement'] = announcement;
          }
        });

        if (announcement != null) {
          final durationVal = announcement['durationSeconds'] ?? announcement['duration'];
          if (durationVal != null) {
            final sec = int.tryParse(durationVal.toString()) ?? 0;
            if (sec > 0) {
              _emergencyAutoDismissTimer = Timer(Duration(seconds: sec), () {
                if (mounted) {
                  setState(() {
                    if (_config != null) {
                      _config!.settings['emergencyAnnouncement'] = null;
                    }
                  });
                }
              });
            }
          }
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

    // 3. Periodic fallback polling (every 60s)
    _pollTimer = Timer.periodic(const Duration(seconds: 60), (_) async {
      final updated = await ApiService.fetchDisplayConfig(widget.screenId);
      if (updated != null && mounted) {
        setState(() => _config = updated);
      }
    });

    // 4. Periodic lightweight CCTV snapshot emission (every 30s)
    _snapshotTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      _captureAndSendSnapshot();
    });

    // 5. Start Playlist loop
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

    final isPaused = _config?.settings['isPaused'] == true;
    if (isPaused || _isPowerOff) {
      setState(() {
        _isShowingAd = false;
      });
      SocketService.updateCurrentContent('queue');
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

    // Only set timer to advance if NOT paused and NOT in standby and there is more than 1 item
    if (!isPaused && !_isPowerOff && _config!.playlist.length > 1) {
      _itemTimer = Timer(Duration(seconds: durationSeconds), () {
        _nextItem();
      });
    }
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

  void _playVideo(String rawUrl) {
    _videoController?.dispose();
    final url = _resolveMediaUrl(rawUrl);
    if (url.isEmpty) {
      _nextItem();
      return;
    }

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

    final mediaUrl = _resolveMediaUrl(currentItem?.mediaUrl);
    final isPaused = _config?.settings['isPaused'] == true;

    final dynamic emergencyData = _config?.settings['emergencyAnnouncement'];
    final Map<String, dynamic>? emergency = (emergencyData is Map)
        ? Map<String, dynamic>.from(emergencyData)
        : null;
    final bool isEmergencyActive = emergency != null &&
        (emergency['active'] == true ||
         emergency['isActive'] == true ||
         emergency['status'] == 'active');
    final String emergencyMode = emergency?['displayMode']?.toString() ?? 'takeover';

    return Scaffold(
      backgroundColor: const Color(0xFF0B1329),
      body: RepaintBoundary(
        key: _previewContainerKey,
        child: Stack(
          fit: StackFit.expand,
          children: [
            // LAYER 1: The Live Doctor Queue Display (Always alive in background)
            if (!kIsWeb && _webViewController != null)
              WebViewWidget(controller: _webViewController!)
            else
              _buildWebFallbackQueue(),

            // LAYER 2: Advertisement Layer (Smooth fade overlay on top of queue)
            // Fully hidden if ads are paused (showing only queue) or display is powered off
            AnimatedOpacity(
              opacity: (_isShowingAd && !isPaused && !_isPowerOff && (!isEmergencyActive || emergencyMode == 'banner')) ? 1.0 : 0.0,
              duration: const Duration(milliseconds: 600),
              child: IgnorePointer(
                ignoring: !_isShowingAd || isPaused || _isPowerOff || (isEmergencyActive && emergencyMode == 'takeover'),
                child: _buildAdOverlay(currentItem, mediaUrl),
              ),
            ),

            // LAYER 3: Emergency Announcement Layer
            if (isEmergencyActive && !_isPowerOff)
              (emergencyMode == 'takeover' || emergencyMode == 'both')
                  ? _buildEmergencyTakeover(emergency)
                  : _buildEmergencyBanner(emergency)
            else if (_config?.announcementTicker != null && !_isPowerOff)
              _buildLegacyTicker(_config!.announcementTicker!),

            // LAYER 4: Paused Ads (Queue-Only Mode) Indicator Pill
            if (isPaused && !_isPowerOff)
              Positioned(
                top: 18,
                right: 20,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A).withValues(alpha: 0.90),
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.45),
                        blurRadius: 12,
                        offset: const Offset(0, 3),
                      ),
                    ],
                    border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.6), width: 1.5),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: Color(0xFF10B981),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        "ADS PAUSED • QUEUE ONLY",
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.8,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            // LAYER 5: Remote Test Notification Banner
            if (_testMessage != null && !_isPowerOff)
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

            // LAYER 6: Deep Sleep / Remote Screen OFF (Standby Mode)
            if (_isPowerOff)
              Positioned.fill(
                child: Container(
                  color: Colors.black,
                  alignment: Alignment.center,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.power_settings_new, color: Colors.white.withValues(alpha: 0.08), size: 52),
                      const SizedBox(height: 12),
                      Text(
                        "TV DISPLAY STANDBY",
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.18),
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 2.0,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        "Screen turned off remotely • Ready for Wake",
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.12),
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
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

  /// Responsive Ad Overlay:
  /// Uses BoxFit.contain within FittedBox + ambient dark blurred background
  /// to ensure posters/videos never get cut off on phones, tablets, laptops, or TV displays.
  Widget _buildAdOverlay(PlaylistItem? item, String mediaUrl) {
    if (item == null) return const SizedBox.shrink();

    if (item.type == 'video' && _videoController != null && _videoController!.value.isInitialized) {
      return Container(
        color: Colors.black,
        child: Center(
          child: FittedBox(
            fit: BoxFit.contain,
            child: SizedBox(
              width: _videoController!.value.size.width,
              height: _videoController!.value.size.height,
              child: VideoPlayer(_videoController!),
            ),
          ),
        ),
      );
    }

    if (item.type == 'image' && mediaUrl.isNotEmpty) {
      return Container(
        color: const Color(0xFF070A12),
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Ambient darkened background blur
            Positioned.fill(
              child: Opacity(
                opacity: 0.18,
                child: CachedNetworkImage(
                  imageUrl: mediaUrl,
                  fit: BoxFit.cover,
                  errorWidget: (_, __, ___) => const SizedBox.shrink(),
                ),
              ),
            ),
            // Perfectly responsive ad image without ANY cutting on any screen size
            Center(
              child: FittedBox(
                fit: BoxFit.contain,
                child: CachedNetworkImage(
                  imageUrl: mediaUrl,
                  fit: BoxFit.contain,
                  placeholder: (context, url) => Container(
                    padding: const EdgeInsets.all(40),
                    child: const CircularProgressIndicator(color: Color(0xFF9D6BBA)),
                  ),
                  errorWidget: (context, url, error) => Container(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.broken_image_rounded, color: Color(0xFFE11D48), size: 48),
                        const SizedBox(height: 12),
                        Text(
                          item.title,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
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
          const Icon(Icons.campaign_rounded, color: Color(0xFF9D6BBA), size: 72),
          const SizedBox(height: 20),
          Text(
            item.title,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white, fontSize: 34, fontWeight: FontWeight.w900),
          ),
        ],
      ),
    );
  }

  /// Emergency Full-Screen Takeover with hospital logo, name, heading, and screen highlight
  Widget _buildEmergencyTakeover(Map<String, dynamic> emergency) {
    final severity = emergency['severity']?.toString() ?? 'critical';
    final title = emergency['title']?.toString().isNotEmpty == true
        ? emergency['title']
        : 'IMPORTANT HOSPITAL ANNOUNCEMENT';
    final message = emergency['message']?.toString() ?? '';
    final screenHighlight = emergency['screenHighlight'] == true ||
        emergency['highlightScreen'] == true ||
        emergency['highlight'] == true;

    Color bgTop;
    Color bgBottom;
    Color accentColor;
    String badgeLabel;
    IconData icon;

    if (severity == 'critical') {
      bgTop = const Color(0xFF881337);
      bgBottom = const Color(0xFF4C0519);
      accentColor = const Color(0xFFF43F5E);
      badgeLabel = 'CRITICAL EMERGENCY CODE RED / आपातकालीन चेतावनी';
      icon = Icons.warning_rounded;
    } else if (severity == 'warning') {
      bgTop = const Color(0xFF78350F);
      bgBottom = const Color(0xFF451A03);
      accentColor = const Color(0xFFF59E0B);
      badgeLabel = 'IMPORTANT HOSPITAL NOTICE / महत्वपूर्ण सूचना';
      icon = Icons.notification_important_rounded;
    } else {
      bgTop = const Color(0xFF4C1D95);
      bgBottom = const Color(0xFF2E1065);
      accentColor = const Color(0xFFA855F7);
      badgeLabel = 'OFFICIAL HOSPITAL ANNOUNCEMENT / जनहित सूचना';
      icon = Icons.campaign_rounded;
    }

    return AnimatedBuilder(
      animation: _pulseAnimation,
      builder: (context, child) {
        final highlightScale = screenHighlight ? _pulseAnimation.value : 1.0;

        return Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [bgTop, bgBottom],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
            border: Border.all(
              color: screenHighlight ? accentColor.withValues(alpha: highlightScale) : accentColor,
              width: screenHighlight ? 8 : 4,
            ),
            boxShadow: screenHighlight
                ? [
                    BoxShadow(
                      color: accentColor.withValues(alpha: 0.5 * highlightScale),
                      blurRadius: 36,
                      spreadRadius: 8,
                    ),
                  ]
                : null,
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 28),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Top Hospital Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Hospital Branding
                      Row(
                        children: [
                          Container(
                            width: 52,
                            height: 52,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              boxShadow: const [
                                BoxShadow(color: Colors.black26, blurRadius: 10),
                              ],
                            ),
                            child: const Center(
                              child: Icon(
                                Icons.local_hospital_rounded,
                                color: Color(0xFF6B3A8A),
                                size: 34,
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: const [
                              Text(
                                "JJM HOSPITAL KASHIPUR",
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 24,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 1.5,
                                ),
                              ),
                              Text(
                                "ADVANCED MULTISPECIALITY & EMERGENCY TRAUMA CENTRE",
                                style: TextStyle(
                                  color: Color(0xFFFDE047),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 1.1,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),

                      // Live Emergency Badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                        decoration: BoxDecoration(
                          color: accentColor,
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: [
                            BoxShadow(
                              color: accentColor.withValues(alpha: 0.6),
                              blurRadius: 16,
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(icon, color: Colors.white, size: 20),
                            const SizedBox(width: 8),
                            Text(
                              badgeLabel,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.6,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  // Center Announcement Card
                  Expanded(
                    child: Center(
                      child: Container(
                        margin: const EdgeInsets.symmetric(vertical: 24),
                        padding: const EdgeInsets.symmetric(horizontal: 48, vertical: 36),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.45),
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.25),
                            width: 2,
                          ),
                          boxShadow: const [
                            BoxShadow(color: Colors.black45, blurRadius: 25),
                          ],
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              title.toUpperCase(),
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                color: Color(0xFFFDE047),
                                fontSize: 32,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 1.2,
                              ),
                            ),
                            const SizedBox(height: 20),
                            Container(
                              height: 3,
                              width: 140,
                              decoration: BoxDecoration(
                                color: accentColor,
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                            const SizedBox(height: 24),
                            Text(
                              message,
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 24,
                                fontWeight: FontWeight.w600,
                                height: 1.45,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  // Bottom Authorized Footer
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.35),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: const [
                        Text(
                          "Direct Central Broadcast • JJM Hospital Administration & Emergency Operations",
                          style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                        Text(
                          "All Displays Active • 24x7 Emergency Services",
                          style: TextStyle(color: Color(0xFFFDE047), fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  /// Emergency Bottom Banner Overlay
  Widget _buildEmergencyBanner(Map<String, dynamic> emergency) {
    final severity = emergency['severity']?.toString() ?? 'critical';
    final title = emergency['title']?.toString() ?? 'IMPORTANT ANNOUNCEMENT';
    final message = emergency['message']?.toString() ?? '';
    final screenHighlight = emergency['screenHighlight'] == true ||
        emergency['highlightScreen'] == true ||
        emergency['highlight'] == true;

    Color bannerBg = severity == 'critical'
        ? const Color(0xFFDC2626)
        : severity == 'warning'
            ? const Color(0xFFD97706)
            : const Color(0xFF6B3A8A);

    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: AnimatedBuilder(
        animation: _pulseAnimation,
        builder: (context, child) {
          return Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            decoration: BoxDecoration(
              color: bannerBg,
              border: screenHighlight
                  ? Border(
                      top: BorderSide(
                        color: Colors.yellowAccent.withValues(alpha: _pulseAnimation.value),
                        width: 4,
                      ),
                    )
                  : null,
              boxShadow: const [
                BoxShadow(color: Colors.black45, blurRadius: 16, offset: Offset(0, -3)),
              ],
            ),
            child: Row(
              children: [
                // Hospital Logo Badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: const [
                      Icon(Icons.local_hospital_rounded, color: Color(0xFF6B3A8A), size: 16),
                      SizedBox(width: 4),
                      Text(
                        "JJM HOSPITAL",
                        style: TextStyle(
                          color: Color(0xFF6B3A8A),
                          fontWeight: FontWeight.w900,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 14),
                // Heading
                Text(
                  "[$title]: ",
                  style: const TextStyle(
                    color: Color(0xFFFDE047),
                    fontSize: 15,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(width: 6),
                // Message
                Expanded(
                  child: Text(
                    message,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildLegacyTicker(String tickerText) {
    return Positioned(
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
                tickerText,
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
    );
  }
}
