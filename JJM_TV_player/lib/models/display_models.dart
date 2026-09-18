class PlaylistItem {
  final String id;
  final String type; // 'queue', 'image', 'video', 'announcement'
  final String? mediaId;
  final String? mediaUrl;
  final String title;
  final int duration; // seconds
  final int order;

  PlaylistItem({
    required this.id,
    required this.type,
    this.mediaId,
    this.mediaUrl,
    required this.title,
    required this.duration,
    required this.order,
  });

  factory PlaylistItem.fromJson(Map<String, dynamic> json) {
    return PlaylistItem(
      id: json['id'] ?? '',
      type: json['type'] ?? 'queue',
      mediaId: json['mediaId'],
      mediaUrl: json['mediaUrl'],
      title: json['title'] ?? '',
      duration: json['duration'] is int ? json['duration'] : int.tryParse(json['duration']?.toString() ?? '15') ?? 15,
      order: json['order'] is int ? json['order'] : int.tryParse(json['order']?.toString() ?? '1') ?? 1,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'mediaId': mediaId,
      'mediaUrl': mediaUrl,
      'title': title,
      'duration': duration,
      'order': order,
    };
  }
}

class ResolvedConfig {
  final String screenId;
  final String screenName;
  final String departmentId;
  final String departmentName;
  final String queueUrl;
  final List<PlaylistItem> playlist;
  final Map<String, dynamic> settings;
  final String? announcementTicker;

  ResolvedConfig({
    required this.screenId,
    required this.screenName,
    required this.departmentId,
    required this.departmentName,
    required this.queueUrl,
    required this.playlist,
    required this.settings,
    this.announcementTicker,
  });

  factory ResolvedConfig.fromJson(Map<String, dynamic> json) {
    var rawPlaylist = json['playlist'] as List<dynamic>? ?? [];
    List<PlaylistItem> items = rawPlaylist.map((i) => PlaylistItem.fromJson(i as Map<String, dynamic>)).toList();

    return ResolvedConfig(
      screenId: json['screenId'] ?? '',
      screenName: json['screenName'] ?? '',
      departmentId: json['departmentId'] ?? '',
      departmentName: json['departmentName'] ?? '',
      queueUrl: json['queueUrl'] ?? '',
      playlist: items,
      settings: json['settings'] as Map<String, dynamic>? ?? {},
      announcementTicker: json['settings']?['announcementTicker'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'screenId': screenId,
      'screenName': screenName,
      'departmentId': departmentId,
      'departmentName': departmentName,
      'queueUrl': queueUrl,
      'playlist': playlist.map((i) => i.toJson()).toList(),
      'settings': settings,
    };
  }
}
