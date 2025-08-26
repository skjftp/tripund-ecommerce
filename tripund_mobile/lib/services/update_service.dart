import 'dart:io';
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:open_file/open_file.dart';
import '../utils/constants.dart';

class UpdateService {
  static final UpdateService _instance = UpdateService._internal();
  factory UpdateService() => _instance;
  UpdateService._internal();

  final Dio _dio = Dio();
  
  // GitHub releases URL for your APK
  static const String _githubReleasesUrl = 
      'https://api.github.com/repos/skjftp/tripund-ecommerce/releases/latest';
  
  // Direct APK download URL (you'll host this on your server)
  static const String _apkDownloadUrl = 
      'https://tripund-backend-665685012221.asia-south1.run.app/api/v1/app/latest-apk';

  Future<void> checkForUpdate(BuildContext context) async {
    try {
      // Get current app version
      final PackageInfo packageInfo = await PackageInfo.fromPlatform();
      final currentVersion = packageInfo.version;
      final currentBuildNumber = int.parse(packageInfo.buildNumber);

      // Check latest version from backend
      final response = await _dio.get('${Constants.apiUrl}/app/version');
      
      if (response.statusCode == 200) {
        final latestVersion = response.data['version'];
        final latestBuildNumber = response.data['build_number'];
        final downloadUrl = response.data['download_url'] ?? _apkDownloadUrl;
        final releaseNotes = response.data['release_notes'] ?? 'New features and improvements';
        final isForceUpdate = response.data['force_update'] ?? false;

        // Compare versions
        if (latestBuildNumber > currentBuildNumber) {
          if (context.mounted) {
            _showUpdateDialog(
              context,
              currentVersion: currentVersion,
              latestVersion: latestVersion,
              releaseNotes: releaseNotes,
              downloadUrl: downloadUrl,
              isForceUpdate: isForceUpdate,
            );
          }
        }
      }
    } catch (e) {
      debugPrint('Error checking for update: $e');
    }
  }

  void _showUpdateDialog(
    BuildContext context, {
    required String currentVersion,
    required String latestVersion,
    required String releaseNotes,
    required String downloadUrl,
    required bool isForceUpdate,
  }) {
    showDialog(
      context: context,
      barrierDismissible: !isForceUpdate,
      builder: (BuildContext context) {
        return WillPopScope(
          onWillPop: () async => !isForceUpdate,
          child: _UpdateDialog(
            currentVersion: currentVersion,
            latestVersion: latestVersion,
            releaseNotes: releaseNotes,
            downloadUrl: downloadUrl,
            isForceUpdate: isForceUpdate,
          ),
        );
      },
    );
  }
}

class _UpdateDialog extends StatefulWidget {
  final String currentVersion;
  final String latestVersion;
  final String releaseNotes;
  final String downloadUrl;
  final bool isForceUpdate;

  const _UpdateDialog({
    required this.currentVersion,
    required this.latestVersion,
    required this.releaseNotes,
    required this.downloadUrl,
    required this.isForceUpdate,
  });

  @override
  State<_UpdateDialog> createState() => _UpdateDialogState();
}

class _UpdateDialogState extends State<_UpdateDialog> {
  bool _isDownloading = false;
  double _downloadProgress = 0.0;
  final Dio _dio = Dio();

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.blue.shade400, Colors.blue.shade600],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.system_update,
              color: Colors.white,
              size: 40,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Update Available!',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: RichText(
                textAlign: TextAlign.center,
                text: TextSpan(
                  style: Theme.of(context).textTheme.bodyMedium,
                  children: [
                    TextSpan(
                      text: 'Version ${widget.currentVersion}',
                      style: const TextStyle(color: Colors.grey),
                    ),
                    const TextSpan(text: ' → '),
                    TextSpan(
                      text: 'Version ${widget.latestVersion}',
                      style: TextStyle(
                        color: Colors.green.shade600,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'What\'s New:',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                widget.releaseNotes,
                style: const TextStyle(fontSize: 14),
              ),
            ),
            if (_isDownloading) ...[
              const SizedBox(height: 20),
              Column(
                children: [
                  LinearProgressIndicator(
                    value: _downloadProgress,
                    backgroundColor: Colors.grey.shade300,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      Colors.blue.shade600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Downloading... ${(_downloadProgress * 100).toStringAsFixed(0)}%',
                    style: const TextStyle(fontSize: 12),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
      actions: [
        if (!widget.isForceUpdate && !_isDownloading)
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Later'),
          ),
        ElevatedButton(
          onPressed: _isDownloading ? null : _downloadAndInstall,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.blue.shade600,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          child: Text(
            _isDownloading ? 'Downloading...' : 'Update Now',
            style: const TextStyle(color: Colors.white),
          ),
        ),
      ],
    );
  }

  Future<void> _downloadAndInstall() async {
    // Request storage permission
    if (Platform.isAndroid) {
      final status = await Permission.storage.request();
      if (!status.isGranted) {
        // For Android 11+, we might need manage external storage
        final manageStatus = await Permission.manageExternalStorage.request();
        if (!manageStatus.isGranted) {
          _showErrorSnackBar('Storage permission required to download update');
          return;
        }
      }
    }

    setState(() {
      _isDownloading = true;
      _downloadProgress = 0.0;
    });

    try {
      // Get download directory
      final Directory appDocDir = await getApplicationDocumentsDirectory();
      final String savePath = '${appDocDir.path}/tripund_update.apk';

      // Download APK
      await _dio.download(
        widget.downloadUrl,
        savePath,
        onReceiveProgress: (received, total) {
          if (total != -1) {
            setState(() {
              _downloadProgress = received / total;
            });
          }
        },
        options: Options(
          headers: {
            'Accept': 'application/vnd.android.package-archive',
          },
        ),
      );

      setState(() {
        _isDownloading = false;
      });

      // Install APK
      final result = await OpenFile.open(savePath);
      if (result.type != ResultType.done) {
        _showErrorSnackBar('Failed to open APK installer');
      }
    } catch (e) {
      setState(() {
        _isDownloading = false;
      });
      _showErrorSnackBar('Download failed: ${e.toString()}');
    }
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }
}