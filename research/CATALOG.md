# Insta360 Studio — recovered protobuf capability catalog

Recovered from the FileDescriptorProto blobs embedded in `studio_worker.dll` (Studio 6.0.8).

- descriptor files: **124**
- messages: **569**
- fields: **3204**
- enums: **64** (375 values)
- services: **5**

## Services

| proto | service | methods |
| --- | --- | --- |
| ExportModule.proto | `Export` | `StartExporting`, `ExporterCancel`, `SendHeartBeatPackage` |
| ExportModule2.proto | `Export2` | `StartExporting`, `ExporterCancel`, `SendHeartBeatPackage` |
| NetWorkModule.proto | `NetworkService` | `StartDownload`, `SendEventTrack`, `SendHeartBeatPackage`, `StartDownloadMusic`, `DownloadFile`, `CancelDownloadMusic`, `UnzipFile`, `StartDownloadCloudTask`, `PauseDownloadCloudTask`, `ResumeDownloadCloudTask`, `CancelDownloadCloudTask`, `DownloadSingleFile`, `TopDownloadTasks`, `CancelDownloadSingleFile`, `CancelAllTask`, `UploadLogToOss` |
| ThumbnailModule.proto | `ThumbnailService` | `SendRequest`, `SendSceneDetectRequest`, `SendHeartBeatPackage`, `Remove` |
| envoy/service/load_stats/v3/lrs.proto | `LoadReportingService` | `StreamLoadStats` |

### Export  (ExportModule.proto)

- `StartExporting(service.Export.ExportRequest) -> service.Export.ExportReply`
- `ExporterCancel(service.Export.CancelInfo) -> service.Export.CancelInfo`
- `SendHeartBeatPackage(service.Export.HeartBeat) -> service.Export.HeartBeat`

### Export2  (ExportModule2.proto)

- `StartExporting(service.Export2.ExportParams) -> service.Export2.ExportReply`
- `ExporterCancel(service.Export2.CancelInfo) -> service.Export2.CancelInfo`
- `SendHeartBeatPackage(service.Export2.HeartBeat) -> service.Export2.HeartBeat`

### NetworkService  (NetWorkModule.proto)

- `StartDownload(service.Network.DownloadRequest) -> service.Network.DownloadReply`
- `SendEventTrack(service.Network.EventTrackData) -> service.Network.DownloadReply`
- `SendHeartBeatPackage(service.Network.HeartBeat) -> service.Network.HeartBeat`
- `StartDownloadMusic(service.Network.MusicDownloadRequest) -> service.Network.MusicDownloadReply`
- `DownloadFile(service.Network.FileDownloadRequest) -> service.Network.FileDownloadReply`
- `CancelDownloadMusic(service.Network.CancelRequest) -> service.Network.CancelReply`
- `UnzipFile(service.Network.FileUnzipRequest) -> service.Network.FileUnzipReply`
- `StartDownloadCloudTask(service.Network.CloudMediaDownloadRequest) -> service.Network.CloudMediaDownloadReply`
- `PauseDownloadCloudTask(service.Network.CloudMediaDownLoadPauseRequest) -> service.Network.CloudMediaDownLoadPauseReply`
- `ResumeDownloadCloudTask(service.Network.CloudMediaDownLoadPauseRequest) -> service.Network.CloudMediaDownloadReply`
- `CancelDownloadCloudTask(service.Network.CloudMediaDownLoadCancelRequest) -> service.Network.CloudMediaDownLoadCancelReply`
- `DownloadSingleFile(service.Network.SingleFileDownloadRequest) -> service.Network.SingleFileDownloadReply`
- `TopDownloadTasks(service.Network.CloudMediaDownLoadToppingRequest) -> service.Network.CloudMediaDownloadReply`
- `CancelDownloadSingleFile(service.Network.CancelDownloadSingleFileRequest) -> service.Network.CancelDownloadSingleFileReply`
- `CancelAllTask(service.Network.CancelAllRequest) -> service.Network.CancelAllReply`
- `UploadLogToOss(service.Network.UploadLogTaskInfo) -> service.Network.UploadLogTaskReply`

### ThumbnailService  (ThumbnailModule.proto)

- `SendRequest(service.Thumbnail.ThumbnailRequest) -> service.Thumbnail.ThumbnailReply`
- `SendSceneDetectRequest(service.Thumbnail.SceneDetectRequest) -> service.Thumbnail.SceneDetectReply`
- `SendHeartBeatPackage(service.Thumbnail.HeartBeat) -> service.Thumbnail.HeartBeat`
- `Remove(service.Thumbnail.SourceGroup) -> service.Thumbnail.SourceGroup`

### LoadReportingService  (envoy/service/load_stats/v3/lrs.proto)

- `StreamLoadStats(envoy.service.load_stats.v3.LoadStatsRequest) -> envoy.service.load_stats.v3.LoadStatsResponse`

## Enums

### ViewDataType  (ExportModule.proto)

KeyFramePoint=0, DeepTrack=1, ViewFinder=2, VirtualPtz=3, MovementTemplate=4

### SourceFileType  (ExportModule.proto)

kPhoto=0, kVideo=1, kEmptyVideo=2

### InterpolationType  (ExportModule.proto)

kOpticalFlowFrame=0, kRepeatFrame=1, kDefault=2

### EncodeType  (ExportModule.proto)

kH264=0, kH265=1, kProres422=2, kProres422LT=3

### ImageProcessingAccel  (ExportModule.proto)

kAuto=0, kCPU=1

### StabilizationType  (ExportModule.proto)

kFlowState=0, kFPV=1

### StarTailType  (ExportModule.proto)

kLong=0, kMedium=1, kShort=2

### DewarpTypeMode  (ExportModule.proto)

kDistortionReserved=0, kDistortionRemoved=1

### LongitudeDirection  (ExportModule.proto)

kDirectionEast=0, kDirectionWest=1

### LatitudeDirection  (ExportModule.proto)

kDirectionSouth=0, kDirectionNorth=1

### ExportType  (ExportParams.proto)

PHOTO=0, DNG_TO_DNG=1, DNG_TO_JPG=2, DNG_WITH_JPG=3, NO_EXTRA_INFO_DNG_EXPORT=4, JPG_SEQUENCE=5, DNG_SEQUENCE_DNG=6, DNG_SEQUENCE_JPG=7, DNG_SEQUENCE_DNG_WITH_JPG=8, VIDEO=9, VIDEO_CLIP=10, DEMUX_TO_JPEG=11, SEQUENCE=12, MUX_TO_VIDEO=13, MUX_TO_PURESHOT_VIDEO=14, MERGED_MIX=15, MERGED_ONLY=16, DNG_MERGED_JPG=17, DNG_MERGED_DNG=18, DNG_MERGED_EXR=19, JPG_MERGED=20, JPG_MERGED_GROUP=21, DNG_MERGED_GROUP=22, DNG_MERGED_GROUP_DNG=23, SOURCE_CLIP=24, PANO_PIC_ANIMATION=25, PANO_PIC_ANIMATION_PRESET=26, STAR_TRAIL_VIDEO=27, STAR_TRAIL_PHOTO=28, VIDEO_TO_JPEG_SEQUENCE=29, PROJECT_COVER_PHOTO=30, PANO_VIDEO=31, INVALID_EXPORT_TYPE=32, PLACE_HOLDER_TYPE=33

### StarTrailType  (ExportParams.proto)

LONG=0, MEDIUM=1, SHORT=2

### DewarpTypeMode  (ExportParams.proto)

kDistortionReserved=0, kDistortionRemoved=1

### StabilizationType  (ExportParams.proto)

kFlowState=0, kFPV=1

### StitchType  (ExportParams.proto)

STITCH_TEMPLATE=0, STITCH_DYNAMIC=1, STITCH_OPTICAL=2, STITCH_AI=3

### FileType  (NetWorkModule.proto)

kSplashImage=0, kTranslationFile=1

### DownloadState  (NetWorkModule.proto)

kSuccessful=0, kDisconnected=1, kUnknown=2, kError=3, kTimeout=4, kProgress=5, kStartDownload=6, kCancelDownload=7, kInsufficientStorage=8

### FileUnzipState  (NetWorkModule.proto)

kFailToOpen=0, kFailToUnzip=1, kUnzipSuccessfully=2

### PBGyroDataType  (PBExtraData.proto)

PBGyroDataType_nano=0, PBGyroDataType_nano2=1, PBGyroDataType_air=2, PBGyroDataType_air2=3

### ThumbnailTaskType  (ThumbnailModule.proto)

kFootageCover=0, kSingleTask=1, kQuickSeekTask=2

### ThumbnailRenderType  (ThumbnailModule.proto)

kPlane=0, kPlaneSphere=1, kSphere=2, kDewarp=3, kStereo=4

### DataSource  (appExportData.proto)

Android=0, IOS=1

### StabType  (appExportData.proto)

Still=0, DirectionLock=1

### ProjectSegmentType  (appExportData.proto)

Edit=0, Snap=1

### ViewDataType  (appExportData.proto)

KeyFramePoint=0, DeepTrack=1, ViewFinder=2

### ResultIndex  (commands/editinfo_list.proto)

RESULT_INDEX_UNSPECIFIED=0, RESULT_INDEX_APEI=1, RESULT_INDEX_CLIP=2, RESULT_INDEX_PLANE=3

### StorageLocation  (commands/editinfo_list.proto)

STORAGE_LOCATION_UNSPECIFIED=0, STORAGE_LOCATION_INTERNAL=1, STORAGE_LOCATION_EXTERNAL=2

### FinishState  (commands/editinfo_list.proto)

FINISH_STATE_UNSPECIFIED=0, FINISH_STATE_DONE=1, FINISH_STATE_EMPTY=2, FINISH_STATE_FILEERROR=3

### CustomFilmBatchState  (commands/editinfo_list.proto)

CUSTOM_FILM_BATCH_STATE_UNSPECIFIED=0, CUSTOM_FILM_BATCH_STATE_PENDING=1, CUSTOM_FILM_BATCH_STATE_PROCESSING=2, CUSTOM_FILM_BATCH_STATE_COMMITTED=3, CUSTOM_FILM_BATCH_STATE_FAILED=4

### FilmGroupRule  (commands/editinfo_list.proto)

FILM_GROUP_RULE_UNSPECIFIED=0, FILM_GROUP_RULE_INTRADAY=1, FILM_GROUP_RULE_FULLDAY=2, FILM_GROUP_RULE_CUSTOM_MULTIDAY=4

### RoutingPriority  (envoy/config/core/v3/base.proto)

DEFAULT=0, HIGH=1

### RequestMethod  (envoy/config/core/v3/base.proto)

METHOD_UNSPECIFIED=0, GET=1, HEAD=2, POST=3, PUT=4, DELETE=5, CONNECT=6, OPTIONS=7, TRACE=8, PATCH=9

### TrafficDirection  (envoy/config/core/v3/base.proto)

UNSPECIFIED=0, INBOUND=1, OUTBOUND=2

### ApiVersion  (envoy/config/core/v3/config_source.proto)

AUTO=0, V2=1, V3=2

### HealthStatus  (envoy/config/core/v3/health_check.proto)

UNKNOWN=0, HEALTHY=1, UNHEALTHY=2, DRAINING=3, TIMEOUT=4, DEGRADED=5

### AccessLogType  (envoy/data/accesslog/v3/accesslog.proto)

NotSet=0, TcpUpstreamConnected=1, TcpPeriodic=2, TcpConnectionEnd=3, DownstreamStart=4, DownstreamPeriodic=5, DownstreamEnd=6, UpstreamPoolReady=7, UpstreamPeriodic=8, UpstreamEnd=9, DownstreamTunnelSuccessfullyEstablished=10, UdpTunnelUpstreamConnected=11, UdpPeriodic=12, UdpSessionEnd=13

### CodecClientType  (envoy/type/v3/http.proto)

HTTP1=0, HTTP2=1, HTTP3=2

### VideoType  (extraMediaData.proto)

VIDEOTYPE_ORIGINAL=0, VIDEOTYPE_AGENT=1, VIDEOTYPE_STITCHED_PANO=2, VIDEOTYPE_EACUBEMAP=3, VIDEOTYPE_CLOUD_SINGLE_FISHEYE=4

### ExtraType  (extra_info.proto)

EXTRA_TYPE_ALL=0, EXTRA_TYPE_METADATA=1, EXTRA_TYPE_THUMBNAIL=2, EXTRA_TYPE_GYRO=3, EXTRA_TYPE_EXPOSURE=4, EXTRA_TYPE_EXT_THUMBNAIL=5, EXTRA_TYPE_FRAME_PTS=6, EXTRA_TYPE_GPS=7, EXTRA_TYPE_STAR_NUM=8, EXTRA_TYPE_AAA_DATA=9, EXTRA_TYPE_HIGHLIGHT=10, EXTRA_TYPE_AAA_SIM=11, EXTRA_TYPE_EXPOTIME_VIN1=12, EXTRA_TYPE_MAGNETIC=13, EXTRA_TYPE_EULER=14, EXTRA_TYPE_SECGYRO=15, EXTRA_TYPE_SPEED=16, EXTRA_TYPE_TBOX=17, EXTRA_TYPE_EDITOR=18, EXTRA_TYPE_HEARTRATE=19, EXTRA_TYPE_FORWARD_DIRECTION=20, EXTRA_TYPE_UPVIEW=21, EXTRA_TYPE_SHELL_RECOGNITION_DATA=22, EXTRA_TYPE_POS=23, EXTRA_TYPE_TIMELAPSE_QUAT=24, EXTRA_TYPE_QUATERNION=25, EXTRA_TYPE_APEI=26, EXTRA_TYPE_BEISP_DYNAMICDATA=27, EXTRA_TYPE_BEISP_STATICDATA=28, EXTRA_TYPE_AEFLICKER=29, EXTRA_TYPE_VEHICAL_INFO=30, EXTRA_TYPE_TRAJECTORYSEGMENT=31, EXTRA_TYPE_PLANEVIEW=32, EXTRA_TYPE_AUTOEDIT_META=33, EXTRA_TYPE_ADVANCEFUNC_META=34, EXTRA_TYPE_DGMAG_DATA=35, EXTRA_TYPE_TM_DATA=36, EXTRA_TYPE_UAV_QUAT_VEL=37, EXTRA_TYPE_TEMP_COMPENSATION=38, EXTRA_TYPE_3A_DESCRIPTION=39, EXTRA_TYPE_TRACK_INFO=40, EXTRA_TYPE_EISSUBTITLE=41, EXTRA_TYPE_RECIPE=42, EXTRA_TYPE_UAV_TRACK_STAT=48, EXTRA_TYPE_UAV_STATUS=49, EXTRA_TYPE_TRACK_BOX=50, EXTRA_TYPE_ONLINE_QUATERNION=51, EXTRA_TYPE_SUB_STREAM_EXPOSURE=52, EXTRA_TYPE_SENSOR_MODULE_TEMPER=53, EXTRA_TYPE_SUB_STREAM_EXPOTIME_VIN1=54, EXTRA_TYPE_PANO_EDITOR_RESULT=55, EXTRA_TYPE_PLANEVIEW_V2=56, EXTRA_TYPE_PANO_STILL_ROT=57, EXTRA_TYPE_TM01_DATA=58, EXTRA_TYPE_FLIGHT_INFO=59, EXTRA_TYPE_THUMBNAIL_SMALL=60, EXTRA_TYPE_TRIM_EXPOSURE_OFFSET=61

### Edition  (google/protobuf/descriptor.proto)

EDITION_UNKNOWN=0, EDITION_PROTO2=998, EDITION_PROTO3=999, EDITION_2023=1000, EDITION_1_TEST_ONLY=1, EDITION_2_TEST_ONLY=2, EDITION_99997_TEST_ONLY=99997, EDITION_99998_TEST_ONLY=99998, EDITION_99999_TEST_ONLY=99999

### NullValue  (google/protobuf/struct.proto)

NULL_VALUE=0

### Syntax  (google/protobuf/type.proto)

SYNTAX_PROTO2=0, SYNTAX_PROTO3=1

### ItemIndex  (ins_cloud_export_dashboard.proto)

kWorkout=0, kDistance=10, kSteps=11, kEnergyConsumption=20, kPowerInWatts=21, kRoute=30, kHeartRate=40, kPace=50, kSpeed=51, kAcceleration=52, kGear=53, kAccelerator=54, kBrake=55, kElevation=60, kSlope=61, kDirection=62, kCadence=70, kDateTime=80, kBendingAngle=90, kGravity=91, kModelCode=100

### DashBoardDataSource  (ins_cloud_export_dashboard.proto)

kNaitve=0, kGarmin=1, kTbox=2, kAppleHealth=3, kIGPSport=4, kGaoChi=5, kInsGPS=6, kGpsTrack=7, kWahoo=8, kHuawei=9, kStrava=10, kMagene=11, kCfMoto=12, kSuunto=13, kPiscisea=14

### CutsceneType  (ins_cloud_export_data.proto)

CUTSCENE_NONE=0, CUTSCENE_LOTTIE=1, CUTSCENE_PANO=2, CUTSCENE_MEISHE=3, CUTSCENE_OTHERS=4

### ExporterTimeScaleType  (ins_cloud_export_data.proto)

kDefaultValue=0, kInterpolateFinalFrame=1, kInterpolateFinalFrameAI=2, kInterpolateSourceFrame=3, kRepeatSingleSourceFrame=4

### ClipAudioMode  (ins_cloud_export_data.proto)

kNone=0, kDirectionFocus=1, kSpatialAudio360=3, kInsDirectionFocus=7

### RenderModelType  (ins_cloud_export_data.proto)

AUTO=0, SPHERE_AUTO=1, SPHERE_STITCH=2, SPHERE_EQUIRECTANGULAR=3, SPHERE_FISHEYE_DEWARP=4, CUBE_TILE_PROJECTION=5, SPHERE_CUBEMAP=6, PLANE_CUBEMAP2EQUI=7, PLANE_AUTO=10, PLANE_STITCH=11, PLANE_EQUIRECTANGULAR=12, PLANE_FISHEYE_DEWARP=13, PLANE_STITCH_MERCATOR=14, PLANE_MERCATOR=15, PLANE=20, PLANE_REMAP_UV=21, MONO_SINGLE_FISHEYE=34

### ProjectionType  (ins_cloud_export_data.proto)

OMNI=0, PANINI=1

### CropContainMode  (ins_cloud_export_filter.proto)

CONTAIN=0, COVER=1

### CropOutAspectMode  (ins_cloud_export_filter.proto)

UNKNOWN=0, EqualScreen=1, EqualCrop=2

### VideoType  (ins_export_information.proto)

NORMALMP4=0, FRAGMENTMP4=1

### CodecId  (ins_export_information.proto)

NONECODEC=0, H264=27, H265=173, PRORES=147

### ChannelLayout  (ins_export_information.proto)

NONE=0, MONO=1, STEREO=2, SURROUND4POINT0=3

### ExMatColorType  (ins_export_information.proto)

RGBA=0, YUV_I420=1

### DataSource  (ins_player_edit_data.proto)

Unknow=0, Android=1, IOS=2, PC=3

### StabType  (ins_player_edit_data.proto)

Still=0, DirectionLock=1

### ProjectSegmentType  (ins_player_edit_data.proto)

Edit=0, Snap=1

### ViewDataType  (ins_player_edit_data.proto)

KeyFramePoint=0, DeepTrack=1, ViewFinder=2

### OffsetState  (offset_state.proto)

Common=0, SphereProtect=1, DivingWater=2, DivingWater23=3, Protect_A=4, Protect_S=5, Protect_Auto=6, Filter_ND16=7, Filter_ND32=8, Filter_ND64=9, DivingWaterPro=10, DivingAirPro=11, Filter_ND128=12, Filter_Joystick=13, G01Protect=14

### OffsetDetectedType  (offset_state.proto)

Unkown=0, Auto_A=1, Auto_S=2, Auto_off=3, Auto_AS=4, Auto_ND16=5, Auto_ND32=6, Auto_ND64=7, Auto_ND128=8

### PackageVersionStatus  (udpa/annotations/status.proto)

UNKNOWN=0, FROZEN=1, ACTIVE=2, NEXT_MAJOR_VERSION_CANDIDATE=3

### KnownRegex  (validate/validate.proto)

UNKNOWN=0, HTTP_HEADER_NAME=1, HTTP_HEADER_VALUE=2

### PackageVersionStatus  (xds/annotations/v3/status.proto)

UNKNOWN=0, FROZEN=1, ACTIVE=2, NEXT_MAJOR_VERSION_CANDIDATE=3

## Messages

### AVRational  (CubePlaylist.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `num` |
| 2 | optional | int32 | `den` |

### DynsVideoLayerTiled  (CubePlaylist.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `resizeRate` |
| 2 | optional | int32 | `sliceGridCol` |
| 3 | optional | int32 | `sliceGridRow` |
| 4 | optional | int64 | `bitrate` |

### DynsVideoLayerNormal  (CubePlaylist.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `projectionType` |
| 2 | optional | int32 | `width` |
| 3 | optional | int32 | `height` |
| 4 | optional | int64 | `bitrate` |

### BaseVideoConfig  (CubePlaylist.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `enableEac` |
| 2 | optional | int32 | `cubeWidthExtend` |
| 3 | optional | bool | `hasAudio` |
| 4 | optional | int32 | `panoWidth` |
| 5 | optional | double | `durationMs` |
| 6 | optional | message bmg.AVRational | `framerate` |

### TiledVideoConfig  (CubePlaylist.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `sliceOverlap` |
| 2 | optional | int32 | `sliceWidth` |
| 3 | repeated | message bmg.DynsVideoLayerTiled | `pyramidLayers` |

### BackgroundVideoConfig  (CubePlaylist.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message bmg.DynsVideoLayerNormal | `layers` |

### PlayConfig  (CubePlaylist.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message bmg.BaseVideoConfig | `baseVideoConfig` |
| 2 | optional | message bmg.TiledVideoConfig | `tileVideoConfig` |
| 3 | optional | message bmg.BackgroundVideoConfig | `backgroundVideoConfig` |

### CubePlaylist  (CubePlaylist.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bytes | `serverUrls` |
| 2 | optional | message bmg.PlayConfig | `playConfig` |

### DownloadRequest  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `task_id` |
| 2 | repeated | string | `source_url` |
| 3 | repeated | string | `dest_path` |
| 4 | optional | double | `start_time_ms` |
| 5 | optional | double | `end_time_ms` |
| 6 | optional | bool | `need_decode_key_frame` |
| 7 | optional | uint32 | `video_tracks_count` |

### DownloadReply  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `task_id` |
| 2 | optional | float | `download_progress` |
| 3 | optional | int32 | `state_code` |
| 4 | optional | int32 | `err_code` |
| 5 | optional | string | `err_info` |

### TaskList  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | string | `task_ids` |

### OperStatus  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `result` |

### HeartBeat  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int64 | `count` |
| 2 | optional | bool | `exit_app` |

### LoopVideoInfo  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `is_loop_video` |
| 2 | optional | bool | `is_loop_video_group` |
| 3 | optional | bool | `is_57k_loop_video_group` |

### SourceGroup  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | string | `sourceFile` |
| 2 | repeated | string | `fileName` |
| 3 | optional | bool | `is_dng_group` |
| 4 | optional | int32 | `source_group_type` |
| 5 | optional | string | `group_identifier` |
| 6 | optional | string | `group_name` |
| 7 | optional | int32 | `group_start_index` |
| 8 | optional | message service.Export.LoopVideoInfo | `loop_video_info` |
| 9 | repeated | string | `associated_files` |
| 10 | optional | string | `pano_fpv_data_path` |
| 11 | optional | string | `still_quat_file_path` |
| 12 | optional | string | `immersion_quat_file_path` |

### BgmClip  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `url` |
| 2 | optional | double | `position_in_media_time_ms` |
| 3 | optional | double | `start_src_time_ms` |
| 4 | optional | double | `end_src_time_ms` |
| 5 | optional | double | `volume` |
| 6 | optional | double | `afade_in_duration_ms` |
| 7 | optional | double | `afade_out_duration_ms` |
| 8 | optional | double | `total_src_duration_ms` |
| 9 | optional | string | `music_id` |

### TextParam  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `text` |
| 2 | optional | string | `color` |
| 3 | optional | string | `font` |
| 4 | optional | int64 | `font_size` |
| 5 | optional | bool | `strokeable` |
| 6 | optional | string | `stroke_color` |
| 7 | optional | int64 | `stroke_size` |

### PositionParam  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | double | `x` |
| 2 | optional | double | `y` |
| 3 | optional | double | `rotation` |
| 4 | optional | double | `scale` |
| 5 | optional | double | `canvas_ratio` |

### TextClip  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message service.Export.TextParam | `text_params` |
| 2 | optional | message service.Export.PositionParam | `position_param` |
| 3 | optional | string | `url` |
| 4 | optional | double | `start_ms` |
| 5 | optional | double | `duration_ms` |
| 6 | optional | string | `id` |
| 7 | optional | string | `effect_id` |

### StickerClip  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message service.Export.PositionParam | `position_param` |
| 2 | optional | string | `url` |
| 3 | optional | double | `start_ms` |
| 4 | optional | double | `duration_ms` |
| 5 | optional | string | `id` |
| 6 | optional | string | `effect_id` |
| 7 | optional | bool | `horizontal_flip` |
| 8 | optional | bool | `vertical_flip` |
| 9 | optional | string | `in_animation_id` |
| 10 | optional | int32 | `in_animation_duration_ms` |
| 11 | optional | string | `out_animation_id` |
| 12 | optional | int32 | `out_animation_duration_ms` |
| 13 | optional | string | `period_animation_id` |
| 14 | optional | int32 | `period_animation_duration_ms` |

### AudioSettings  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | enum service.Export.AudioSettings.ClipAudioMode | `clipAudioMode` |

### BulletTimeViewParam  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | float | `fov` |
| 2 | optional | float | `distance` |

### FrameRate  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `den` |
| 2 | optional | int32 | `num` |

### TimeWaterMark  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `enable` |
| 2 | optional | int32 | `format` |
| 3 | optional | int32 | `transparency` |

### Resolution  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `width` |
| 2 | optional | int32 | `height` |

### EulerAngle  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | float | `yaw` |
| 2 | optional | float | `pitch` |
| 3 | optional | float | `roll` |

### ViewData  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | float | `yaw` |
| 2 | optional | float | `pitch` |
| 3 | optional | float | `roll` |
| 4 | optional | float | `fov` |
| 5 | optional | float | `distance` |
| 6 | optional | double | `src_time` |
| 7 | optional | enum service.Export.ViewData.KeyFrameType | `key_frame_type` |
| 8 | optional | float | `alpha` |
| 9 | optional | bool | `original_eulers_handled` |
| 10 | optional | message service.Export.EulerAngle | `original_euler` |

### PlayRateSegment  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | double | `trim_start` |
| 2 | optional | double | `trim_end` |
| 3 | optional | double | `factor` |

### BezierControlPoint  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | double | `x` |
| 2 | optional | double | `y` |

### TransitionSegment  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `startKeyFrameId` |
| 2 | optional | string | `endKeyFrameId` |
| 3 | optional | int32 | `funcType` |
| 4 | optional | message service.Export.BezierControlPoint | `p1` |
| 5 | optional | message service.Export.BezierControlPoint | `p2` |

### MovementTemplateData  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `movement_id` |
| 2 | repeated | message service.Export.ViewData | `key_points` |
| 3 | repeated | message service.Export.TransitionSegment | `transitions` |
| 4 | optional | int64 | `start_time` |
| 5 | optional | int64 | `end_time` |
| 6 | optional | string | `movement_name` |

### ViewSegment  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 2 | optional | string | `id` |
| 1 | optional | enum service.Export.ViewDataType | `type` |
| 3 | repeated | message service.Export.ViewData | `key_points` |
| 4 | optional | bool | `need_report` |
| 5 | optional | message service.Export.MovementTemplateData | `movement_data` |

### CameraMovementSegment  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | float | `yaw` |
| 2 | optional | float | `pitch` |
| 3 | optional | float | `roll` |
| 4 | optional | float | `fov` |
| 5 | optional | float | `distance` |
| 6 | optional | bool | `visible` |
| 7 | optional | int32 | `view_mode` |

### AppDataInfo  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `app_data_id` |
| 2 | optional | string | `app_data_source` |
| 3 | optional | string | `app_data_mode` |
| 4 | optional | string | `app_data_ratio` |
| 5 | repeated | string | `app_data_types` |

### TimelineSetting  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 6 | optional | double | `duration_ms` |
| 1 | optional | double | `trim_start` |
| 2 | optional | double | `trim_end` |
| 8 | optional | double | `media_trim_start` |
| 7 | optional | double | `media_trim_end` |
| 9 | optional | double | `audio_fade_in` |
| 10 | optional | double | `audio_fade_out` |
| 11 | optional | message service.Export.AppDataInfo | `app_data_info` |
| 3 | repeated | message service.Export.ViewSegment | `view_segments` |
| 4 | repeated | message service.Export.PlayRateSegment | `play_rate_segments` |
| 5 | repeated | message service.Export.TransitionSegment | `transition_segment` |
| 12 | repeated | message service.Export.CameraMovementSegment | `camera_movement_segment` |

### LogoInfo  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `logo_path` |
| 2 | optional | float | `logo_size` |
| 3 | optional | int32 | `logo_location` |
| 4 | optional | int32 | `logo_corner_radius` |
| 5 | optional | int32 | `logo_feather` |
| 6 | optional | int32 | `logo_rotate` |

### FlatLogoInfo  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `flat_logo_path` |
| 2 | optional | int32 | `flat_logo_transparency` |
| 3 | optional | int32 | `flat_logo_location` |
| 4 | optional | bool | `is_cn` |

### AspectRatio  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `width_ratio` |
| 2 | optional | int32 | `height_ratio` |

### ColorAdjustSetting  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `enable_adjustment` |
| 2 | optional | int32 | `exposure` |
| 3 | optional | int32 | `highlights` |
| 4 | optional | int32 | `shadows` |
| 5 | optional | int32 | `brightness` |
| 6 | optional | int32 | `blackpoint` |
| 7 | optional | int32 | `saturation` |
| 8 | optional | int32 | `vibrance` |
| 9 | optional | int32 | `warmth` |
| 10 | optional | int32 | `tint` |
| 11 | optional | int32 | `definition` |
| 12 | optional | int32 | `contrast` |

### StitchingSetting  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `enableStab` |
| 2 | optional | bool | `enableDirectionalLock` |
| 3 | optional | bool | `enableDynamicStitching` |
| 4 | optional | bool | `enableOpticalFlowStitching` |
| 5 | optional | bool | `enableImageFusion` |
| 6 | optional | bool | `enableColorPlus` |
| 7 | optional | bool | `enableUnderWaterCorrection` |
| 8 | optional | bool | `enableLocalToneMap` |
| 9 | optional | bool | `enableMotionBlur` |
| 10 | optional | bool | `enableAudioDirectFocus` |
| 11 | optional | bool | `enableDroneFlag` |
| 12 | optional | bool | `enable_top_mounted_gyro` |
| 13 | optional | bool | `enableColdShoe` |
| 14 | optional | bool | `enableLogo` |
| 15 | optional | bool | `enableRemoveGrain` |
| 16 | optional | float | `custom_blend_angle` |
| 17 | optional | string | `optimizedOffset` |
| 18 | optional | int32 | `colorPlusStrength` |
| 19 | optional | int32 | `ltmStrength` |
| 20 | optional | int32 | `underWaterBalance` |
| 21 | optional | int32 | `underWaterStrength` |
| 22 | optional | int32 | `motion_blur_strength` |
| 23 | optional | int32 | `motion_blur_threshold` |
| 24 | optional | enum service.Export.StabilizationType | `stabilizationType` |
| 25 | optional | int32 | `shellType` |
| 26 | optional | int32 | `fovType` |
| 27 | optional | int32 | `queryFovType` |
| 28 | optional | int32 | `audioDenoiseType` |
| 29 | optional | int32 | `user_rotate_degree` |
| 30 | optional | message service.Export.LogoInfo | `logo_info` |
| 31 | optional | message service.Export.BulletTimeViewParam | `bulletTimeViewParam` |
| 32 | optional | uint32 | `projection_layout` |
| 33 | optional | message service.Export.AspectRatio | `aspect_ratio` |
| 34 | optional | enum service.Export.DewarpTypeMode | `dewarp_type` |
| 35 | optional | int32 | `stabIlization_level` |
| 36 | optional | int32 | `star_tail_type` |
| 37 | optional | bool | `enable_ai_stitching` |
| 38 | optional | bool | `enable_cooling_shell` |
| 39 | optional | bool | `enable_horizontal_correct` |
| 40 | optional | float | `horizontal_correct_angle` |
| 41 | optional | bool | `enable_lut` |
| 42 | optional | bool | `support_lut` |
| 43 | optional | bool | `enable_time_logo` |
| 44 | optional | int32 | `time_logo_format` |
| 45 | optional | int32 | `time_logo_transparency` |
| 46 | optional | bool | `enable_deghost` |
| 47 | optional | bool | `enable_pano_fpv` |
| 48 | optional | bool | `pano_fpv_horizontal_on` |
| 49 | optional | int32 | `underWaterFilterIndex` |
| 50 | optional | bool | `enable_immersive_stab` |
| 51 | optional | string | `de_version` |
| 52 | optional | int32 | `stab_input_data_type` |
| 53 | optional | int32 | `view_direction` |
| 54 | optional | bool | `enable_head_track` |
| 55 | optional | bool | `enable_camera_movement` |
| 56 | optional | int32 | `propeller_guard_status` |
| 57 | optional | bool | `enable_beauty_mode` |
| 58 | optional | bool | `has_head_track_keyframe` |
| 59 | optional | bool | `enableFlatLogo` |
| 60 | optional | message service.Export.FlatLogoInfo | `flat_logo_info` |
| 61 | optional | string | `extern_filter_resource_path` |
| 62 | optional | float | `extern_filter_opacity` |
| 63 | optional | bool | `enable_main_window` |
| 64 | optional | int32 | `view_category_filter` |

### DashBoardSetting  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `style_uuid` |
| 2 | optional | string | `dashboard_xml_data` |

### SrcTimeMsISOPair  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | float | `src_time_ms` |
| 2 | optional | float | `iso` |

### UserSettings  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `is_free_capture` |
| 3 | optional | bool | `remove_grain_enabled` |
| 4 | optional | bool | `remove_grain_block_enabled` |
| 5 | optional | bool | `enable_dashboard` |
| 6 | optional | float | `noise_level` |
| 7 | repeated | message service.Export.SrcTimeMsISOPair | `src_time_ms_iso_pairs` |
| 8 | optional | bool | `is_silent` |
| 9 | optional | bool | `ai_raw_enable` |
| 10 | optional | message service.Export.ViewData | `custom_transform_param` |
| 11 | optional | float | `audio_volume` |
| 12 | optional | enum service.Export.InterpolationType | `interpolation_type` |
| 13 | optional | bool | `dolby_vision_enabled` |
| 14 | optional | bool | `enable_audio_mixing` |
| 15 | optional | double | `audio_mixing_weight` |
| 16 | optional | int32 | `audio_tracks_delay` |
| 17 | optional | int32 | `audio_trasks_default_delay` |
| 18 | optional | message service.Export.ViewData | `extra_transform` |
| 19 | optional | bool | `show_dashboard_real_distance` |

### Quaternion  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | float | `w` |
| 2 | optional | float | `x` |
| 3 | optional | float | `y` |
| 4 | optional | float | `z` |

### ImageExportParam  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `view_mode` |
| 2 | optional | enum service.Export.ImageExportParam.IntervalMergeStabType | `interval_merge_stab_type` |
| 3 | optional | double | `duration` |
| 4 | optional | double | `start_in_second` |
| 5 | optional | int64 | `video_clip_id` |
| 6 | repeated | message service.Export.Quaternion | `quaternions` |

### ObjectState  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int64 | `timestamp_ms` |
| 6 | optional | message service.Export.Quaternion | `bigboom_quaternions` |

### DetectedObject  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `target_id` |
| 2 | optional | string | `target_name` |
| 3 | optional | int32 | `target_show_count` |
| 4 | optional | int64 | `first_show_ms` |
| 5 | optional | int64 | `last_show_ms` |
| 6 | repeated | message service.Export.ObjectState | `object_states` |

### GpsData  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int64 | `real_timestamp` |
| 2 | optional | double | `real_speed` |
| 3 | optional | double | `real_altitude` |
| 4 | optional | double | `current_distance` |
| 5 | optional | double | `real_slope` |
| 6 | optional | double | `real_longitude` |
| 7 | optional | double | `real_latitude` |
| 8 | optional | double | `real_course` |
| 9 | optional | enum service.Export.LongitudeDirection | `longitude_direction` |
| 10 | optional | enum service.Export.LatitudeDirection | `latitude_direction` |

### GpsInfo  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `export_gps` |
| 2 | repeated | message service.Export.GpsData | `gps_data` |
| 3 | optional | double | `max_latitude` |
| 4 | optional | double | `min_latitude` |
| 5 | optional | double | `max_longitude` |
| 6 | optional | double | `min_longitude` |
| 7 | optional | int64 | `first_gps_time_stamp` |

### CutSceneSetting  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `has_cut_scene` |
| 2 | optional | int64 | `end_cut_duration_ms` |
| 3 | optional | string | `transition_file_path` |
| 4 | optional | int64 | `end_cut_source_duration_ms` |
| 5 | optional | bool | `is_meishe` |
| 6 | optional | message service.Export.ViewData | `start_view_data` |
| 7 | optional | message service.Export.ViewData | `end_view_data` |
| 8 | optional | string | `effect_id` |

### ClipInfo  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message service.Export.SourceGroup | `sourceGroup` |
| 2 | optional | message service.Export.TimelineSetting | `timelineSetting` |
| 3 | optional | message service.Export.StitchingSetting | `stitchingSetting` |
| 4 | optional | message service.Export.DashBoardSetting | `dashBoardSetting` |
| 5 | optional | message service.Export.AudioSettings | `AudioSettings` |
| 6 | optional | message service.Export.UserSettings | `user_settings` |
| 7 | optional | message service.Export.ImageExportParam | `image_export_param` |
| 8 | optional | enum service.Export.SourceFileType | `file_type` |
| 9 | optional | message service.Export.DetectedObject | `bigboom_object` |
| 10 | optional | message service.Export.GpsInfo | `gps_info` |
| 11 | optional | message service.Export.CutSceneSetting | `cut_scene_setting` |
| 12 | optional | bool | `is_cloud_footage` |
| 13 | optional | string | `file_tail_url` |
| 14 | optional | string | `video_info_json` |
| 15 | optional | string | `cloud_preview_url` |
| 16 | optional | string | `source_file_name` |
| 17 | optional | message service.Export.AdditionInfo | `addition_info` |
| 18 | optional | string | `clip_model_url` |
| 19 | optional | bool | `is_pano_source` |
| 20 | optional | message service.Export.ColorAdjustSetting | `color_adjust_setting` |
| 21 | optional | message service.Export.TimeWaterMark | `time_water_mark` |
| 22 | optional | bool | `is_rough_trimmed` |
| 23 | optional | string | `time_code` |
| 24 | optional | string | `dashboard_id` |
| 25 | repeated | int64 | `loop_video_segment_durations_ms` |
| 26 | optional | string | `media_info_json` |

### ExportClipInfo  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message service.Export.ClipInfo | `clipInfos` |
| 2 | repeated | message service.Export.BgmClip | `bgm_clip` |
| 3 | repeated | message service.Export.TextClip | `text_clips` |
| 4 | repeated | message service.Export.StickerClip | `sticker_clips` |

### HardWareInfo  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `is_amd_graphics_card` |
| 2 | optional | bool | `amd_card_support_h264_full_range` |
| 3 | optional | bool | `amd_card_support_h265_full_range` |

### ExportParam  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `path` |
| 2 | optional | string | `dest_dir` |
| 3 | optional | int32 | `export_type` |
| 4 | optional | message service.Export.Resolution | `res` |
| 5 | optional | message service.Export.FrameRate | `frame_rate` |
| 6 | optional | enum service.Export.EncodeType | `encode_type` |
| 7 | optional | int64 | `encode_bitrate` |
| 8 | optional | string | `meta_data_make` |
| 9 | optional | string | `meta_data_model` |
| 10 | optional | string | `meta_data_comment` |
| 11 | optional | bool | `is_spherical` |
| 12 | optional | bool | `request_from_multiple_clip` |
| 13 | optional | bool | `enable_video_denoise` |
| 14 | optional | bool | `has_audio` |
| 15 | optional | bool | `support_audio` |
| 16 | optional | enum service.Export.ImageProcessingAccel | `image_processing_accel` |
| 17 | optional | message service.Export.HardWareInfo | `hardware_info` |
| 18 | optional | string | `proxy_type` |
| 19 | optional | string | `project_id` |
| 20 | optional | bool | `enable_dolby_vision` |
| 21 | optional | bool | `is_export_pano` |
| 22 | optional | bool | `is_cloud_media` |
| 23 | optional | int32 | `star_trail_length_type` |
| 24 | optional | bool | `enable_deflicker` |
| 25 | optional | string | `upload_platform_id` |
| 26 | optional | int64 | `clip_count` |
| 27 | optional | bool | `enable_apmp` |
| 28 | optional | bool | `report_apmp_visable` |
| 29 | optional | bool | `is_screenshot_export` |
| 30 | optional | double | `screenshot_target_time_ms` |
| 31 | optional | int32 | `color_setting` |
| 32 | optional | bool | `enable_ai_stitching_3_0` |

### AdditionalUiParam  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `thumbnailPath` |
| 2 | optional | string | `sourceFileName` |
| 3 | optional | string | `createdDate` |
| 4 | optional | string | `cameraType` |
| 5 | optional | float | `resultDurationS` |
| 6 | optional | float | `TargetFileMb` |
| 7 | optional | int32 | `sourceFileType` |
| 9 | optional | string | `groupDisplayName` |

### ExportRequest  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `uuid` |
| 2 | optional | message service.Export.ExportClipInfo | `exportInfo` |
| 3 | optional | message service.Export.ExportParam | `exportParam` |
| 4 | optional | string | `jsonSetting` |
| 5 | optional | message service.Export.AdditionalUiParam | `uiParam` |
| 6 | optional | bool | `mark_trim` |
| 7 | optional | string | `group_uuid` |
| 8 | optional | int32 | `base_view_count` |

### ExportReplyInfo  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | float | `defringe_rate_list` |
| 2 | optional | string | `export_perf_et` |
| 3 | optional | int32 | `clip_index` |
| 4 | optional | string | `thumbnail_path` |

### ExportReply  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `uuid` |
| 2 | optional | float | `export_progress` |
| 3 | optional | int32 | `state_code` |
| 4 | optional | int32 | `err_code` |
| 5 | optional | string | `err_info` |
| 6 | optional | string | `log_path` |
| 7 | optional | message service.Export.ExportReplyInfo | `reply_info` |

### CancelInfo  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `uuid` |

### AdditionInfo  (ExportModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `firm_ware_version` |
| 2 | optional | int32 | `shoot_mode` |
| 3 | optional | string | `camera_type` |
| 4 | optional | int32 | `arvrender_media_type` |
| 5 | optional | message service.Export.Resolution | `source_resolution` |
| 7 | optional | int64 | `bitrate` |
| 8 | optional | double | `fps` |
| 9 | optional | string | `camera_serial_num` |
| 10 | optional | int32 | `offset_state` |
| 11 | optional | int32 | `guard_detected_file` |
| 12 | optional | int32 | `audio_track_number` |

### HeartBeat  (ExportModule2.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int64 | `count` |
| 2 | optional | bool | `exit_app` |

### ExportReplyInfo  (ExportModule2.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | float | `defringe_rate_list` |
| 2 | optional | string | `export_perf_et` |
| 3 | optional | int32 | `clip_index` |
| 4 | optional | string | `thumbnail_path` |

### ExportReply  (ExportModule2.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `uuid` |
| 2 | optional | float | `export_progress` |
| 3 | optional | int32 | `state_code` |
| 4 | optional | int32 | `err_code` |
| 5 | optional | string | `err_info` |
| 6 | optional | string | `log_path` |
| 7 | optional | message service.Export2.ExportReplyInfo | `reply_info` |

### CancelInfo  (ExportModule2.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `uuid` |

### LocalVideoExportParam  (ExportParams.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `enableDeflicker` |
| 2 | optional | bool | `enableApmp` |
| 3 | optional | string | `timeCode` |
| 4 | optional | bool | `isCloudFootage` |
| 5 | optional | string | `cloudMediaInfoJson` |
| 6 | optional | string | `cloudPreviewUrl` |
| 7 | optional | int32 | `clipIndex` |
| 8 | repeated | string | `loopVideoJsonContent` |
| 9 | optional | double | `srcTotalDurationMs` |
| 10 | optional | enum service.Export2.StitchType | `stitch_type` |
| 11 | optional | bool | `enable_image_fusion` |
| 12 | optional | bool | `enable_gpx_export` |
| 13 | optional | message insta360.cloud.message.ExportInfoLogoInfo | `logo_info` |
| 14 | optional | message google.protobuf.Int32Value | `dewarp_type` |
| 15 | optional | message google.protobuf.Int32Value | `stab_level` |
| 16 | optional | enum service.Export2.StabilizationType | `stab_type` |
| 17 | optional | bool | `enable_direction_lock` |
| 18 | optional | bool | `enable_pano_fpv` |
| 19 | optional | bool | `enable_immersion` |
| 20 | optional | bool | `enable_head_track` |
| 21 | optional | bool | `enable_camera_move` |
| 22 | optional | bool | `enable_stab` |
| 23 | optional | message service.Export2.DashboardExtra | `dashboard_extra` |
| 24 | optional | bool | `enable_flat_logo` |
| 25 | optional | message service.Export2.FlatLogoInfo | `flat_logo_info` |
| 26 | optional | int32 | `real_userrotationdegree` |
| 27 | optional | int32 | `propeller_guard_status` |
| 28 | optional | bool | `enable_cold_shoe` |
| 29 | optional | bool | `enable_cooling_shell` |
| 30 | optional | string | `cloud_still_quat_path` |
| 31 | optional | string | `cloud_immersion_quat_path` |
| 32 | optional | double | `screenshot_target_time_ms` |
| 33 | optional | int32 | `photo_group_type` |
| 34 | optional | bool | `enable_bottom_stitching_optimize` |
| 35 | optional | int32 | `accessory_type` |
| 36 | optional | float | `custom_blend_angle` |

### SourceGroup  (ExportParams.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | string | `sourceFile` |
| 2 | optional | int32 | `source_group_type` |
| 3 | optional | string | `group_identifier` |
| 4 | optional | int32 | `group_start_index` |
| 5 | repeated | string | `dest_file_name` |

### LogoInfo  (ExportParams.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `logo_path` |
| 2 | optional | float | `logo_size` |
| 3 | optional | int32 | `logo_location` |
| 4 | optional | int32 | `logo_corner_radius` |
| 5 | optional | int32 | `logo_feather` |
| 6 | optional | int32 | `logo_rotate` |

### FlatLogoInfo  (ExportParams.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `flat_logo_path` |
| 2 | optional | int32 | `flat_logo_transparency` |
| 3 | optional | int32 | `flat_logo_location` |
| 4 | optional | bool | `is_cn` |

### DashboardExtraFrame  (ExportParams.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | double | `timestampMs` |
| 2 | optional | double | `horizontalSpeed` |
| 3 | optional | double | `aboveGroundHeight` |

### DashboardExtra  (ExportParams.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message service.Export2.DashboardExtraFrame | `frames` |
| 2 | optional | double | `accelerationMin` |
| 3 | optional | double | `verticalSpeedMin` |
| 4 | optional | double | `horizontalSpeedMax` |
| 5 | optional | double | `horizontalSpeedMin` |
| 6 | optional | double | `aboveGroundHeightMax` |

### Quaternion  (ExportParams.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | float | `w` |
| 2 | optional | float | `x` |
| 3 | optional | float | `y` |
| 4 | optional | float | `z` |

### StitchingSetting  (ExportParams.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `stabilization_level` |
| 2 | optional | int32 | `shelltype` |
| 3 | optional | string | `optimizedoffset` |
| 4 | optional | bool | `enableimagefusion` |
| 5 | optional | bool | `enable_ai_stitching` |
| 6 | optional | bool | `enable_dynamic_stitching` |
| 7 | optional | bool | `enable_optical_flowstitching` |
| 8 | optional | bool | `enable_coldshoe` |
| 9 | optional | bool | `enable_cooling_shell` |
| 10 | optional | float | `custom_blend_angle` |
| 11 | optional | string | `de_version` |
| 12 | optional | bool | `enable_logo` |
| 13 | optional | bool | `enable_remove_grain` |
| 14 | optional | int32 | `stab_input_data_type` |
| 15 | optional | uint32 | `projection_layout` |
| 16 | optional | message service.Export2.LogoInfo | `logo_info` |
| 17 | optional | enum service.Export2.StabilizationType | `stabilizationType` |
| 18 | optional | bool | `enable_bottom_stitching_optimize` |
| 19 | optional | bool | `enable_ai_stitching_3_0` |

### LocalImageExportParam  (ExportParams.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | enum service.Export2.StarTrailType | `starTrailType` |
| 2 | optional | message service.Export2.SourceGroup | `sourceGroup` |
| 3 | optional | int32 | `view_mode` |
| 4 | optional | enum service.Export2.LocalImageExportParam.IntervalMergeStabType | `interval_merge_stab_type` |
| 5 | optional | message service.Export2.StitchingSetting | `stitching` |
| 6 | optional | double | `start_in_second` |
| 7 | optional | int64 | `video_clip_id` |
| 8 | repeated | message service.Export2.Quaternion | `quaternions` |
| 9 | optional | bool | `ai_raw_enable` |
| 10 | repeated | int32 | `pano_animation_transitions` |

### LocalVideoFxZOrder  (ExportParams.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `positionZ` |

### LocalExtraParams  (ExportParams.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | enum service.Export2.ExportType | `exportType` |
| 2 | repeated | message service.Export2.LocalVideoExportParam | `videoExportParam` |
| 3 | optional | message service.Export2.LocalImageExportParam | `imageExportParam` |
| 4 | repeated | message service.Export2.LocalVideoFxZOrder | `videoFxZOrder` |

### ExtraDataReqItem  (ExportParams.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `extraType` |
| 2 | optional | string | `valueType` |
| 3 | optional | string | `value` |
| 4 | optional | string | `fileName` |
| 5 | optional | string | `businessSource` |
| 6 | optional | string | `source` |
| 7 | optional | string | `transitionType` |
| 8 | optional | string | `localFilePath` |

### MaterialItem  (ExportParams.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `index` |
| 2 | optional | string | `type` |
| 3 | optional | string | `value` |

### ExportHeader  (ExportParams.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `taskId` |
| 2 | optional | string | `exportName` |
| 3 | optional | string | `savePath` |
| 4 | optional | string | `protoMd5` |
| 5 | optional | string | `protoName` |
| 6 | optional | int64 | `videoDuration` |
| 7 | optional | string | `framerate` |
| 8 | optional | string | `bitrate` |
| 9 | optional | int32 | `width` |
| 10 | optional | int32 | `height` |
| 11 | repeated | message service.Export2.ExtraDataReqItem | `extraDataReqList` |
| 12 | repeated | message service.Export2.MaterialItem | `materialList` |

### ExportParams  (ExportParams.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message service.Export2.ExportHeader | `exportHeader` |
| 2 | optional | message insta360.cloud.message.CloudExportData | `mainParams` |
| 3 | optional | message service.Export2.LocalExtraParams | `localExtraParams` |

### UploadLogTaskInfo  (NetWorkModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `host_id` |
| 2 | optional | int64 | `error_code` |
| 3 | optional | string | `log_path` |
| 4 | optional | string | `error_desc` |
| 5 | optional | bool | `user_upload` |

### UploadLogTaskReply  (NetWorkModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `success` |
| 2 | optional | string | `download_url` |
| 3 | optional | string | `host_id` |
| 4 | optional | int64 | `error_code` |

### FileUnzipRequest  (NetWorkModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `task_id` |
| 2 | optional | message service.Network.FileDownloadUrl | `file_url` |

### FileUnzipReply  (NetWorkModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `task_id` |
| 2 | optional | enum service.Network.FileUnzipState | `state` |

### FileDownloadRequest  (NetWorkModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message service.Network.FileDownloadUrl | `file_url` |
| 2 | optional | string | `task_id` |
| 3 | optional | int32 | `timeout_ms` |
| 4 | optional | bool | `fast_fail` |

### FileDownloadUrl  (NetWorkModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `remote_url` |
| 2 | optional | string | `save_path` |

### FileDownloadReply  (NetWorkModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `task_id` |
| 2 | optional | double | `download_progress` |
| 3 | repeated | message service.Network.FileDownloadSliceInfo | `reply_slice_info` |
| 4 | optional | enum service.Network.FileDownloadReply.FileDownloadReplyType | `reply_type` |

### FileDownloadSliceInfo  (NetWorkModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `task_index` |
| 2 | optional | enum service.Network.DownloadState | `download_state` |
| 3 | optional | string | `error_description` |

### CloudMediaDownloadTask  (NetWorkModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `task_id` |
| 2 | optional | string | `file_name` |
| 3 | optional | string | `download_path` |
| 4 | optional | int64 | `file_size` |
| 5 | optional | string | `url` |
| 6 | optional | float | `weight` |
| 7 | optional | int32 | `priority` |
| 8 | optional | int32 | `download_type` |
| 9 | optional | message service.Network.CloudMediaDownloadTask.Range | `range` |
| 10 | optional | string | `cubemap_url` |
| 11 | optional | string | `cloud_asset_url` |
| 12 | optional | string | `video_info_json` |
| 13 | repeated | string | `file_items` |
| 14 | optional | string | `preview_video_info_json` |
| 15 | optional | bool | `is_file_dual_stream` |
| 16 | optional | int64 | `original_size` |

### CloudMediaDownloadRequest  (NetWorkModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message service.Network.CloudMediaDownloadTask | `tasks` |

### CloudMediaDownLoadToppingRequest  (NetWorkModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | string | `task_id` |

### CloudMediaDownloadReply  (NetWorkModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | enum service.Network.DownloadState | `download_state` |
| 2 | optional | string | `task_id` |
| 3 | optional | string | `file_name` |
| 4 | optional | float | `progress` |
| 5 | optional | float | `speed` |
| 6 | optional | float | `remainder` |
| 7 | optional | bool | `is_progress` |
| 8 | optional | int32 | `error` |

### CloudMediaDownLoadPauseRequest  (NetWorkModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | string | `task_id` |

### CloudMediaDownLoadPauseReply  (NetWorkModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | string | `task_id` |

### CloudMediaDownLoadCancelRequest  (NetWorkModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | string | `task_id` |

### CloudMediaDownLoadCancelReply  (NetWorkModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | string | `task_id` |

### MusicDownloadRequest  (NetWorkModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message service.Network.MusicUrlPackage | `remote_url` |
| 2 | optional | message service.Network.MusicUrlPackage | `save_path` |
| 3 | optional | int32 | `timeout_ms` |
| 4 | optional | string | `task_id` |

### MusicUrlPackage  (NetWorkModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `music_url` |
| 2 | optional | string | `waveform_url` |
| 3 | optional | string | `cover_url` |

### HeartBeat  (NetWorkModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int64 | `count` |
| 2 | optional | bool | `exit_app` |

### DownloadRequest  (NetWorkModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message service.Network.FileSource | `file_source` |
| 2 | optional | enum service.Network.FileType | `file_type` |

### FileSource  (NetWorkModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `remote_url` |
| 2 | optional | string | `save_path` |

### DownloadReply  (NetWorkModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | enum service.Network.DownloadState | `download_state` |

### MusicDownloadReply  (NetWorkModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | enum service.Network.DownloadState | `download_state` |
| 2 | optional | int64 | `current_size` |
| 3 | optional | int64 | `total_size` |
| 4 | optional | string | `task_id` |
| 5 | optional | string | `error_description` |

### EventTrackData  (NetWorkModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `data_in_json` |

### CancelRequest  (NetWorkModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `task_id` |

### CancelReply  (NetWorkModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `task_id` |
| 2 | optional | int32 | `error_code` |
| 3 | optional | string | `error_description` |

### SingleFileDownloadRequest  (NetWorkModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message service.Network.FileDownloadUrl | `file_url` |
| 2 | optional | string | `task_id` |
| 3 | optional | int32 | `timeout_ms` |
| 4 | optional | int64 | `start_offset` |

### SingleFileDownloadReply  (NetWorkModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `task_id` |
| 3 | optional | double | `download_progress` |
| 4 | optional | string | `error_description` |
| 5 | optional | enum service.Network.SingleFileDownloadReply.FileDownloadReplyType | `reply_type` |
| 6 | optional | int64 | `downloaded_bytes` |
| 7 | optional | int64 | `total_bytes` |

### CancelDownloadSingleFileRequest  (NetWorkModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `task_id` |

### CancelDownloadSingleFileReply  (NetWorkModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `task_id` |

### CancelAllRequest  (NetWorkModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |

### CancelAllReply  (NetWorkModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |

### PBGyroData  (PBExtraData.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int64 | `timeoffset` |
| 2 | optional | bool | `isApply` |
| 3 | optional | int32 | `count` |
| 4 | optional | enum PBGyroDataType | `type` |
| 7 | optional | bytes | `gyroData` |

### PBExtraData  (PBExtraData.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message PBGyroData | `gyrodata` |

### PwTimestampRange  (PwCacheMeta.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int64 | `start` |
| 2 | optional | int64 | `end` |

### PwRational  (PwCacheMeta.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `num` |
| 2 | optional | int32 | `den` |

### PwDashFragmentMeta  (PwCacheMeta.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `file_cache_meta` |
| 2 | repeated | message bmg.PwTimestampRange | `cached_dts_ranges` |
| 3 | optional | message bmg.PwTimestampRange | `file_dts_range` |
| 4 | optional | message bmg.PwRational | `time_base` |
| 5 | optional | int64 | `file_dts_offset` |

### PwDashStreamMeta  (PwCacheMeta.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bytes | `init_section_data` |
| 2 | repeated | message bmg.PwDashStreamMeta.FragmentCacheMetasEntry | `fragment_cache_metas` |

### PwDashCacheMeta  (PwCacheMeta.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `mpd_content` |
| 2 | repeated | message bmg.PwDashCacheMeta.VideoMetasEntry | `video_metas` |
| 3 | repeated | message bmg.PwDashCacheMeta.AudioMetasEntry | `audio_metas` |

### PwMp4CacheMeta  (PwCacheMeta.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `file_cache_meta` |
| 2 | optional | message bmg.PwTimestampRange | `vstream_dts_range` |
| 3 | optional | message bmg.PwTimestampRange | `astream_dts_range` |
| 4 | repeated | message bmg.PwTimestampRange | `cached_vdts_ranges` |
| 5 | repeated | message bmg.PwTimestampRange | `cached_adts_ranges` |
| 6 | optional | message bmg.PwRational | `vtime_base` |
| 7 | optional | message bmg.PwRational | `atime_base` |
| 8 | optional | int64 | `vstream_dts_offset` |
| 9 | optional | int64 | `astream_dts_offset` |

### HeartBeat  (ThumbnailModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int64 | `count` |
| 2 | optional | bool | `exit_app` |

### SourceGroup  (ThumbnailModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | string | `sourceFile` |

### ThumbnailRequest  (ThumbnailModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int64 | `id` |
| 2 | optional | message service.Thumbnail.SourceGroup | `sourceGroup` |
| 3 | optional | int32 | `width` |
| 4 | optional | int32 | `height` |
| 5 | optional | int64 | `frameIndex` |
| 6 | optional | enum service.Thumbnail.ThumbnailRenderType | `renderType` |
| 7 | optional | enum service.Thumbnail.ThumbnailTaskType | `task_type` |
| 8 | optional | bool | `onlyUseKeyframe` |
| 9 | optional | int32 | `taskPriority` |
| 10 | optional | int32 | `clipId` |
| 11 | optional | int64 | `frameTimeMs` |
| 12 | optional | bool | `isCloud` |
| 13 | optional | string | `mediaId` |
| 14 | optional | string | `cloudMediaInfoJson` |
| 15 | optional | string | `thumbalPath` |
| 16 | optional | bool | `is_pano_export` |
| 17 | optional | bool | `is_pano_media` |
| 18 | optional | int32 | `export_type` |
| 19 | optional | int32 | `aspect_ratio` |

### ThumbnailInfo  (ThumbnailModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `thumbnailPath` |
| 2 | optional | int64 | `frameIndex` |
| 3 | optional | int64 | `timeStampMs` |

### ThumbnailReply  (ThumbnailModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int64 | `id` |
| 2 | repeated | message service.Thumbnail.ThumbnailInfo | `thumbnailInfos` |
| 3 | optional | int32 | `errCode` |
| 4 | optional | string | `errInfo` |

### SceneDetectRequest  (ThumbnailModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `source_group_name` |
| 2 | optional | message service.Thumbnail.SourceGroup | `source_group` |

### SceneDetectReply  (ThumbnailModule.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `source_group_name` |
| 2 | optional | int32 | `err_code` |

### AFLensInfo  (af_lens_info.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `range_near` |
| 2 | optional | int32 | `range_far` |

### AspectRatio  (appExportData.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `width` |
| 2 | optional | int32 | `height` |

### ViewData  (appExportData.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | float | `yaw` |
| 2 | optional | float | `pitch` |
| 3 | optional | float | `roll` |
| 4 | optional | float | `fov` |
| 5 | optional | float | `distance` |
| 6 | optional | double | `srcTime` |

### ViewSegment  (appExportData.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | enum insta360.message.ViewDataType | `type` |
| 2 | optional | message insta360.message.AspectRatio | `aspectRatio` |
| 3 | repeated | message insta360.message.ViewData | `keyPoints` |

### ProjectSegment  (appExportData.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `id` |
| 2 | optional | enum insta360.message.ProjectSegmentType | `dataType` |
| 3 | optional | message insta360.message.AspectRatio | `aspectRatio` |
| 4 | optional | enum insta360.message.StabType | `stabType` |
| 5 | repeated | message insta360.message.ViewSegment | `segments` |

### Project  (appExportData.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int64 | `version` |
| 2 | optional | enum insta360.message.DataSource | `source` |
| 3 | optional | string | `projectName` |
| 4 | repeated | message insta360.message.ProjectSegment | `segments` |

### LayerInfo  (auto_find_info.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `version` |
| 2 | repeated | string | `order_of_targets` |
| 3 | repeated | message insta360.messages.LayerInfo.MapTargetsEntry | `map_targets` |
| 4 | repeated | message insta360.messages.LayerInfo.StateInfo | `states` |
| 5 | repeated | message insta360.messages.LayerInfo.TransitionInfo | `transitions` |
| 6 | optional | double | `start_timestamp_ms` |
| 7 | optional | double | `end_timestamp_ms` |

### ObjectInfo  (basic_info.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | float | `time_ratio` |
| 2 | optional | string | `frame_id` |
| 3 | optional | float | `yaw` |
| 4 | optional | float | `pitch` |
| 5 | optional | float | `roll` |

### CameraInfo  (basic_info.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | float | `fov` |
| 2 | optional | float | `distance` |
| 3 | optional | message insta360.messages.ObjectInfo | `object_info` |

### TransitionInfo  (basic_info.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `func` |
| 2 | optional | string | `from_state_id` |
| 3 | optional | string | `to_state_id` |

### BezierCubic  (basic_info.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `from_state_id` |
| 2 | optional | string | `to_state_id` |
| 3 | optional | double | `bazier_ctrl_x1` |
| 4 | optional | double | `bazier_ctrl_y1` |
| 5 | optional | double | `bazier_ctrl_x2` |
| 6 | optional | double | `bazier_ctrl_y2` |

### AlphaTransition  (basic_info.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | double | `duration` |
| 2 | optional | string | `transitionFile` |

### CaptureBeautyParams  (capture_beauty_info.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | float | `skin_care_strength` |
| 2 | optional | float | `blemish_removal_strength` |
| 3 | repeated | uint32 | `rsv` |
| 4 | optional | bool | `one_click_beauty_switch` |

### FavoriteInfo  (commands/editinfo_list.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `playback_is_favorite` |
| 2 | optional | int64 | `modify_timestamp` |

### AnalyzeInfo  (commands/editinfo_list.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | enum insta360.messages.ResultIndex | `algo_type` |
| 2 | optional | bool | `is_finish` |
| 3 | optional | enum insta360.messages.FinishState | `finish_status` |

### AlgoAnalyzeSubFileInfo  (commands/editinfo_list.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `analyze_file_path` |
| 2 | optional | int64 | `last_valid_analyze_size` |
| 3 | repeated | message insta360.messages.AnalyzeInfo | `analysis_result` |
| 4 | repeated | string | `segment_file_paths` |

### FileMeta  (commands/editinfo_list.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int64 | `creation_time_ms` |
| 2 | optional | uint32 | `duration_ms` |
| 3 | optional | enum insta360.messages.FileMeta.SubMediaType | `sub_media_type` |
| 4 | optional | enum insta360.messages.FileMeta.FileCategory | `file_category` |
| 5 | optional | uint32 | `file_scene_info_type` |

### EditFileInfo  (commands/editinfo_list.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `file_path` |
| 2 | optional | message insta360.messages.FavoriteInfo | `favorite_info` |
| 3 | repeated | message insta360.messages.AlgoAnalyzeSubFileInfo | `algo_infos` |
| 4 | optional | enum insta360.messages.StorageLocation | `storage_location` |
| 5 | optional | message insta360.messages.FileMeta | `file_meta` |
| 6 | optional | bool | `needs_idle_analysis` |

### CustomFilmDate  (commands/editinfo_list.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int64 | `day_key` |
| 2 | optional | bool | `analyzed` |
| 3 | optional | uint32 | `rule_mask` |

### EditFileInfoList  (commands/editinfo_list.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message insta360.messages.EditFileInfo | `edit_file_info_list` |
| 2 | optional | string | `device_sn` |
| 3 | optional | string | `device_model_name` |
| 4 | repeated | message insta360.messages.HighlightCard | `cards` |
| 5 | repeated | message insta360.messages.CustomFilmDate | `custom_film_dates` |
| 6 | optional | string | `custom_batch_id` |
| 7 | optional | uint64 | `custom_batch_generation` |
| 8 | optional | enum insta360.messages.CustomFilmBatchState | `custom_batch_state` |
| 9 | optional | string | `custom_batch_card_id` |

### CardMemberRef  (commands/editinfo_list.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `file_path` |

### HighlightCard  (commands/editinfo_list.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `card_id` |
| 2 | optional | int64 | `day_timestamp` |
| 3 | repeated | message insta360.messages.CardMemberRef | `members` |
| 4 | optional | int64 | `last_video_timestamp` |
| 5 | optional | string | `cover_page_path` |
| 6 | optional | uint32 | `rule_mask` |
| 7 | optional | uint32 | `sequence_in_day` |
| 8 | optional | int64 | `card_update_time` |
| 9 | optional | uint32 | `custom_trigger_reason` |
| 10 | repeated | int64 | `selected_day_keys` |
| 11 | optional | string | `batch_id` |

### DataTuple  (data_tuple.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `str_value` |
| 2 | repeated | float | `vector_values` |
| 3 | optional | int32 | `int_value` |

### AccessLog  (envoy/config/accesslog/v3/accesslog.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 2 | optional | message envoy.config.accesslog.v3.AccessLogFilter | `filter` |
| 4 | optional | message google.protobuf.Any | `typed_config` |

### AccessLogFilter  (envoy/config/accesslog/v3/accesslog.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.accesslog.v3.StatusCodeFilter | `status_code_filter` |
| 2 | optional | message envoy.config.accesslog.v3.DurationFilter | `duration_filter` |
| 3 | optional | message envoy.config.accesslog.v3.NotHealthCheckFilter | `not_health_check_filter` |
| 4 | optional | message envoy.config.accesslog.v3.TraceableFilter | `traceable_filter` |
| 5 | optional | message envoy.config.accesslog.v3.RuntimeFilter | `runtime_filter` |
| 6 | optional | message envoy.config.accesslog.v3.AndFilter | `and_filter` |
| 7 | optional | message envoy.config.accesslog.v3.OrFilter | `or_filter` |
| 8 | optional | message envoy.config.accesslog.v3.HeaderFilter | `header_filter` |
| 9 | optional | message envoy.config.accesslog.v3.ResponseFlagFilter | `response_flag_filter` |
| 10 | optional | message envoy.config.accesslog.v3.GrpcStatusFilter | `grpc_status_filter` |
| 11 | optional | message envoy.config.accesslog.v3.ExtensionFilter | `extension_filter` |
| 12 | optional | message envoy.config.accesslog.v3.MetadataFilter | `metadata_filter` |
| 13 | optional | message envoy.config.accesslog.v3.LogTypeFilter | `log_type_filter` |

### ComparisonFilter  (envoy/config/accesslog/v3/accesslog.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | enum envoy.config.accesslog.v3.ComparisonFilter.Op | `op` |
| 2 | optional | message envoy.config.core.v3.RuntimeUInt32 | `value` |

### StatusCodeFilter  (envoy/config/accesslog/v3/accesslog.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.accesslog.v3.ComparisonFilter | `comparison` |

### DurationFilter  (envoy/config/accesslog/v3/accesslog.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.accesslog.v3.ComparisonFilter | `comparison` |

### NotHealthCheckFilter  (envoy/config/accesslog/v3/accesslog.proto)

| # | label | type | name |
| --- | --- | --- | --- |

### TraceableFilter  (envoy/config/accesslog/v3/accesslog.proto)

| # | label | type | name |
| --- | --- | --- | --- |

### RuntimeFilter  (envoy/config/accesslog/v3/accesslog.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `runtime_key` |
| 2 | optional | message envoy.type.v3.FractionalPercent | `percent_sampled` |
| 3 | optional | bool | `use_independent_randomness` |

### AndFilter  (envoy/config/accesslog/v3/accesslog.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message envoy.config.accesslog.v3.AccessLogFilter | `filters` |

### OrFilter  (envoy/config/accesslog/v3/accesslog.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 2 | repeated | message envoy.config.accesslog.v3.AccessLogFilter | `filters` |

### HeaderFilter  (envoy/config/accesslog/v3/accesslog.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.route.v3.HeaderMatcher | `header` |

### ResponseFlagFilter  (envoy/config/accesslog/v3/accesslog.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | string | `flags` |

### GrpcStatusFilter  (envoy/config/accesslog/v3/accesslog.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | enum envoy.config.accesslog.v3.GrpcStatusFilter.Status | `statuses` |
| 2 | optional | bool | `exclude` |

### MetadataFilter  (envoy/config/accesslog/v3/accesslog.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.type.matcher.v3.MetadataMatcher | `matcher` |
| 2 | optional | message google.protobuf.BoolValue | `match_if_key_not_found` |

### LogTypeFilter  (envoy/config/accesslog/v3/accesslog.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | enum envoy.data.accesslog.v3.AccessLogType | `types` |
| 2 | optional | bool | `exclude` |

### ExtensionFilter  (envoy/config/accesslog/v3/accesslog.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 3 | optional | message google.protobuf.Any | `typed_config` |

### CircuitBreakers  (envoy/config/cluster/v3/circuit_breaker.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message envoy.config.cluster.v3.CircuitBreakers.Thresholds | `thresholds` |
| 2 | repeated | message envoy.config.cluster.v3.CircuitBreakers.Thresholds | `per_host_thresholds` |

### ClusterCollection  (envoy/config/cluster/v3/cluster.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message xds.core.v3.CollectionEntry | `entries` |

### Cluster  (envoy/config/cluster/v3/cluster.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 43 | repeated | message envoy.config.cluster.v3.Cluster.TransportSocketMatch | `transport_socket_matches` |
| 1 | optional | string | `name` |
| 28 | optional | string | `alt_stat_name` |
| 2 | optional | enum envoy.config.cluster.v3.Cluster.DiscoveryType | `type` |
| 38 | optional | message envoy.config.cluster.v3.Cluster.CustomClusterType | `cluster_type` |
| 3 | optional | message envoy.config.cluster.v3.Cluster.EdsClusterConfig | `eds_cluster_config` |
| 4 | optional | message google.protobuf.Duration | `connect_timeout` |
| 5 | optional | message google.protobuf.UInt32Value | `per_connection_buffer_limit_bytes` |
| 6 | optional | enum envoy.config.cluster.v3.Cluster.LbPolicy | `lb_policy` |
| 33 | optional | message envoy.config.endpoint.v3.ClusterLoadAssignment | `load_assignment` |
| 8 | repeated | message envoy.config.core.v3.HealthCheck | `health_checks` |
| 9 | optional | message google.protobuf.UInt32Value | `max_requests_per_connection` |
| 10 | optional | message envoy.config.cluster.v3.CircuitBreakers | `circuit_breakers` |
| 46 | optional | message envoy.config.core.v3.UpstreamHttpProtocolOptions | `upstream_http_protocol_options` |
| 29 | optional | message envoy.config.core.v3.HttpProtocolOptions | `common_http_protocol_options` |
| 13 | optional | message envoy.config.core.v3.Http1ProtocolOptions | `http_protocol_options` |
| 14 | optional | message envoy.config.core.v3.Http2ProtocolOptions | `http2_protocol_options` |
| 36 | repeated | message envoy.config.cluster.v3.Cluster.TypedExtensionProtocolOptionsEntry | `typed_extension_protocol_options` |
| 16 | optional | message google.protobuf.Duration | `dns_refresh_rate` |
| 44 | optional | message envoy.config.cluster.v3.Cluster.RefreshRate | `dns_failure_refresh_rate` |
| 39 | optional | bool | `respect_dns_ttl` |
| 17 | optional | enum envoy.config.cluster.v3.Cluster.DnsLookupFamily | `dns_lookup_family` |
| 18 | repeated | message envoy.config.core.v3.Address | `dns_resolvers` |
| 45 | optional | bool | `use_tcp_for_dns_lookups` |
| 53 | optional | message envoy.config.core.v3.DnsResolutionConfig | `dns_resolution_config` |
| 55 | optional | message envoy.config.core.v3.TypedExtensionConfig | `typed_dns_resolver_config` |
| 54 | optional | message google.protobuf.BoolValue | `wait_for_warm_on_init` |
| 19 | optional | message envoy.config.cluster.v3.OutlierDetection | `outlier_detection` |
| 20 | optional | message google.protobuf.Duration | `cleanup_interval` |
| 21 | optional | message envoy.config.core.v3.BindConfig | `upstream_bind_config` |
| 22 | optional | message envoy.config.cluster.v3.Cluster.LbSubsetConfig | `lb_subset_config` |
| 23 | optional | message envoy.config.cluster.v3.Cluster.RingHashLbConfig | `ring_hash_lb_config` |
| 52 | optional | message envoy.config.cluster.v3.Cluster.MaglevLbConfig | `maglev_lb_config` |
| 34 | optional | message envoy.config.cluster.v3.Cluster.OriginalDstLbConfig | `original_dst_lb_config` |
| 37 | optional | message envoy.config.cluster.v3.Cluster.LeastRequestLbConfig | `least_request_lb_config` |
| 56 | optional | message envoy.config.cluster.v3.Cluster.RoundRobinLbConfig | `round_robin_lb_config` |
| 27 | optional | message envoy.config.cluster.v3.Cluster.CommonLbConfig | `common_lb_config` |
| 24 | optional | message envoy.config.core.v3.TransportSocket | `transport_socket` |
| 25 | optional | message envoy.config.core.v3.Metadata | `metadata` |
| 26 | optional | enum envoy.config.cluster.v3.Cluster.ClusterProtocolSelection | `protocol_selection` |
| 30 | optional | message envoy.config.cluster.v3.UpstreamConnectionOptions | `upstream_connection_options` |
| 31 | optional | bool | `close_connections_on_host_health_failure` |
| 32 | optional | bool | `ignore_health_on_host_removal` |
| 40 | repeated | message envoy.config.cluster.v3.Filter | `filters` |
| 41 | optional | message envoy.config.cluster.v3.LoadBalancingPolicy | `load_balancing_policy` |
| 42 | optional | message envoy.config.core.v3.ConfigSource | `lrs_server` |
| 47 | optional | bool | `track_timeout_budgets` |
| 48 | optional | message envoy.config.core.v3.TypedExtensionConfig | `upstream_config` |
| 49 | optional | message envoy.config.cluster.v3.TrackClusterStats | `track_cluster_stats` |
| 50 | optional | message envoy.config.cluster.v3.Cluster.PreconnectPolicy | `preconnect_policy` |
| 51 | optional | bool | `connection_pool_per_downstream_connection` |

### LoadBalancingPolicy  (envoy/config/cluster/v3/cluster.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message envoy.config.cluster.v3.LoadBalancingPolicy.Policy | `policies` |

### UpstreamConnectionOptions  (envoy/config/cluster/v3/cluster.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.core.v3.TcpKeepalive | `tcp_keepalive` |
| 2 | optional | bool | `set_local_interface_name_on_upstream_connections` |

### TrackClusterStats  (envoy/config/cluster/v3/cluster.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `timeout_budgets` |
| 2 | optional | bool | `request_response_sizes` |
| 3 | optional | bool | `per_endpoint_stats` |

### Filter  (envoy/config/cluster/v3/filter.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 2 | optional | message google.protobuf.Any | `typed_config` |
| 3 | optional | message envoy.config.core.v3.ExtensionConfigSource | `config_discovery` |

### OutlierDetection  (envoy/config/cluster/v3/outlier_detection.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message google.protobuf.UInt32Value | `consecutive_5xx` |
| 2 | optional | message google.protobuf.Duration | `interval` |
| 3 | optional | message google.protobuf.Duration | `base_ejection_time` |
| 4 | optional | message google.protobuf.UInt32Value | `max_ejection_percent` |
| 5 | optional | message google.protobuf.UInt32Value | `enforcing_consecutive_5xx` |
| 6 | optional | message google.protobuf.UInt32Value | `enforcing_success_rate` |
| 7 | optional | message google.protobuf.UInt32Value | `success_rate_minimum_hosts` |
| 8 | optional | message google.protobuf.UInt32Value | `success_rate_request_volume` |
| 9 | optional | message google.protobuf.UInt32Value | `success_rate_stdev_factor` |
| 10 | optional | message google.protobuf.UInt32Value | `consecutive_gateway_failure` |
| 11 | optional | message google.protobuf.UInt32Value | `enforcing_consecutive_gateway_failure` |
| 12 | optional | bool | `split_external_local_origin_errors` |
| 13 | optional | message google.protobuf.UInt32Value | `consecutive_local_origin_failure` |
| 14 | optional | message google.protobuf.UInt32Value | `enforcing_consecutive_local_origin_failure` |
| 15 | optional | message google.protobuf.UInt32Value | `enforcing_local_origin_success_rate` |
| 16 | optional | message google.protobuf.UInt32Value | `failure_percentage_threshold` |
| 17 | optional | message google.protobuf.UInt32Value | `enforcing_failure_percentage` |
| 18 | optional | message google.protobuf.UInt32Value | `enforcing_failure_percentage_local_origin` |
| 19 | optional | message google.protobuf.UInt32Value | `failure_percentage_minimum_hosts` |
| 20 | optional | message google.protobuf.UInt32Value | `failure_percentage_request_volume` |
| 21 | optional | message google.protobuf.Duration | `max_ejection_time` |
| 22 | optional | message google.protobuf.Duration | `max_ejection_time_jitter` |
| 23 | optional | message google.protobuf.BoolValue | `successful_active_health_check_uneject_host` |

### Pipe  (envoy/config/core/v3/address.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `path` |
| 2 | optional | uint32 | `mode` |

### EnvoyInternalAddress  (envoy/config/core/v3/address.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `server_listener_name` |
| 2 | optional | string | `endpoint_id` |

### SocketAddress  (envoy/config/core/v3/address.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | enum envoy.config.core.v3.SocketAddress.Protocol | `protocol` |
| 2 | optional | string | `address` |
| 3 | optional | uint32 | `port_value` |
| 4 | optional | string | `named_port` |
| 5 | optional | string | `resolver_name` |
| 6 | optional | bool | `ipv4_compat` |

### TcpKeepalive  (envoy/config/core/v3/address.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message google.protobuf.UInt32Value | `keepalive_probes` |
| 2 | optional | message google.protobuf.UInt32Value | `keepalive_time` |
| 3 | optional | message google.protobuf.UInt32Value | `keepalive_interval` |

### ExtraSourceAddress  (envoy/config/core/v3/address.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.core.v3.SocketAddress | `address` |
| 2 | optional | message envoy.config.core.v3.SocketOptionsOverride | `socket_options` |

### BindConfig  (envoy/config/core/v3/address.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.core.v3.SocketAddress | `source_address` |
| 2 | optional | message google.protobuf.BoolValue | `freebind` |
| 3 | repeated | message envoy.config.core.v3.SocketOption | `socket_options` |
| 5 | repeated | message envoy.config.core.v3.ExtraSourceAddress | `extra_source_addresses` |
| 4 | repeated | message envoy.config.core.v3.SocketAddress | `additional_source_addresses` |
| 6 | optional | message envoy.config.core.v3.TypedExtensionConfig | `local_address_selector` |

### Address  (envoy/config/core/v3/address.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.core.v3.SocketAddress | `socket_address` |
| 2 | optional | message envoy.config.core.v3.Pipe | `pipe` |
| 3 | optional | message envoy.config.core.v3.EnvoyInternalAddress | `envoy_internal_address` |

### CidrRange  (envoy/config/core/v3/address.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `address_prefix` |
| 2 | optional | message google.protobuf.UInt32Value | `prefix_len` |

### BackoffStrategy  (envoy/config/core/v3/backoff.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message google.protobuf.Duration | `base_interval` |
| 2 | optional | message google.protobuf.Duration | `max_interval` |

### Locality  (envoy/config/core/v3/base.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `region` |
| 2 | optional | string | `zone` |
| 3 | optional | string | `sub_zone` |

### BuildVersion  (envoy/config/core/v3/base.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.type.v3.SemanticVersion | `version` |
| 2 | optional | message google.protobuf.Struct | `metadata` |

### Extension  (envoy/config/core/v3/base.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 2 | optional | string | `category` |
| 3 | optional | string | `type_descriptor` |
| 4 | optional | message envoy.config.core.v3.BuildVersion | `version` |
| 5 | optional | bool | `disabled` |
| 6 | repeated | string | `type_urls` |

### Node  (envoy/config/core/v3/base.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `id` |
| 2 | optional | string | `cluster` |
| 3 | optional | message google.protobuf.Struct | `metadata` |
| 12 | repeated | message envoy.config.core.v3.Node.DynamicParametersEntry | `dynamic_parameters` |
| 4 | optional | message envoy.config.core.v3.Locality | `locality` |
| 6 | optional | string | `user_agent_name` |
| 7 | optional | string | `user_agent_version` |
| 8 | optional | message envoy.config.core.v3.BuildVersion | `user_agent_build_version` |
| 9 | repeated | message envoy.config.core.v3.Extension | `extensions` |
| 10 | repeated | string | `client_features` |
| 11 | repeated | message envoy.config.core.v3.Address | `listening_addresses` |

### Metadata  (envoy/config/core/v3/base.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message envoy.config.core.v3.Metadata.FilterMetadataEntry | `filter_metadata` |
| 2 | repeated | message envoy.config.core.v3.Metadata.TypedFilterMetadataEntry | `typed_filter_metadata` |

### RuntimeUInt32  (envoy/config/core/v3/base.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 2 | optional | uint32 | `default_value` |
| 3 | optional | string | `runtime_key` |

### RuntimePercent  (envoy/config/core/v3/base.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.type.v3.Percent | `default_value` |
| 2 | optional | string | `runtime_key` |

### RuntimeDouble  (envoy/config/core/v3/base.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | double | `default_value` |
| 2 | optional | string | `runtime_key` |

### RuntimeFeatureFlag  (envoy/config/core/v3/base.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message google.protobuf.BoolValue | `default_value` |
| 2 | optional | string | `runtime_key` |

### QueryParameter  (envoy/config/core/v3/base.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `key` |
| 2 | optional | string | `value` |

### HeaderValue  (envoy/config/core/v3/base.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `key` |
| 2 | optional | string | `value` |
| 3 | optional | bytes | `raw_value` |

### HeaderValueOption  (envoy/config/core/v3/base.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.core.v3.HeaderValue | `header` |
| 2 | optional | message google.protobuf.BoolValue | `append` |
| 3 | optional | enum envoy.config.core.v3.HeaderValueOption.HeaderAppendAction | `append_action` |
| 4 | optional | bool | `keep_empty_value` |

### HeaderMap  (envoy/config/core/v3/base.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message envoy.config.core.v3.HeaderValue | `headers` |

### WatchedDirectory  (envoy/config/core/v3/base.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `path` |

### DataSource  (envoy/config/core/v3/base.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `filename` |
| 2 | optional | bytes | `inline_bytes` |
| 3 | optional | string | `inline_string` |
| 4 | optional | string | `environment_variable` |

### RetryPolicy  (envoy/config/core/v3/base.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.core.v3.BackoffStrategy | `retry_back_off` |
| 2 | optional | message google.protobuf.UInt32Value | `num_retries` |

### RemoteDataSource  (envoy/config/core/v3/base.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.core.v3.HttpUri | `http_uri` |
| 2 | optional | string | `sha256` |
| 3 | optional | message envoy.config.core.v3.RetryPolicy | `retry_policy` |

### AsyncDataSource  (envoy/config/core/v3/base.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.core.v3.DataSource | `local` |
| 2 | optional | message envoy.config.core.v3.RemoteDataSource | `remote` |

### TransportSocket  (envoy/config/core/v3/base.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 3 | optional | message google.protobuf.Any | `typed_config` |

### RuntimeFractionalPercent  (envoy/config/core/v3/base.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.type.v3.FractionalPercent | `default_value` |
| 2 | optional | string | `runtime_key` |

### ControlPlane  (envoy/config/core/v3/base.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `identifier` |

### ApiConfigSource  (envoy/config/core/v3/config_source.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | enum envoy.config.core.v3.ApiConfigSource.ApiType | `api_type` |
| 8 | optional | enum envoy.config.core.v3.ApiVersion | `transport_api_version` |
| 2 | repeated | string | `cluster_names` |
| 4 | repeated | message envoy.config.core.v3.GrpcService | `grpc_services` |
| 3 | optional | message google.protobuf.Duration | `refresh_delay` |
| 5 | optional | message google.protobuf.Duration | `request_timeout` |
| 6 | optional | message envoy.config.core.v3.RateLimitSettings | `rate_limit_settings` |
| 7 | optional | bool | `set_node_on_first_message_only` |
| 9 | repeated | message envoy.config.core.v3.TypedExtensionConfig | `config_validators` |

### AggregatedConfigSource  (envoy/config/core/v3/config_source.proto)

| # | label | type | name |
| --- | --- | --- | --- |

### SelfConfigSource  (envoy/config/core/v3/config_source.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | enum envoy.config.core.v3.ApiVersion | `transport_api_version` |

### RateLimitSettings  (envoy/config/core/v3/config_source.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message google.protobuf.UInt32Value | `max_tokens` |
| 2 | optional | message google.protobuf.DoubleValue | `fill_rate` |

### PathConfigSource  (envoy/config/core/v3/config_source.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `path` |
| 2 | optional | message envoy.config.core.v3.WatchedDirectory | `watched_directory` |

### ConfigSource  (envoy/config/core/v3/config_source.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 7 | repeated | message xds.core.v3.Authority | `authorities` |
| 1 | optional | string | `path` |
| 8 | optional | message envoy.config.core.v3.PathConfigSource | `path_config_source` |
| 2 | optional | message envoy.config.core.v3.ApiConfigSource | `api_config_source` |
| 3 | optional | message envoy.config.core.v3.AggregatedConfigSource | `ads` |
| 5 | optional | message envoy.config.core.v3.SelfConfigSource | `self` |
| 4 | optional | message google.protobuf.Duration | `initial_fetch_timeout` |
| 6 | optional | enum envoy.config.core.v3.ApiVersion | `resource_api_version` |

### ExtensionConfigSource  (envoy/config/core/v3/config_source.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.core.v3.ConfigSource | `config_source` |
| 2 | optional | message google.protobuf.Any | `default_config` |
| 3 | optional | bool | `apply_default_config_without_warming` |
| 4 | repeated | string | `type_urls` |

### EventServiceConfig  (envoy/config/core/v3/event_service_config.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.core.v3.GrpcService | `grpc_service` |

### TypedExtensionConfig  (envoy/config/core/v3/extension.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 2 | optional | message google.protobuf.Any | `typed_config` |

### GrpcService  (envoy/config/core/v3/grpc_service.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.core.v3.GrpcService.EnvoyGrpc | `envoy_grpc` |
| 2 | optional | message envoy.config.core.v3.GrpcService.GoogleGrpc | `google_grpc` |
| 3 | optional | message google.protobuf.Duration | `timeout` |
| 5 | repeated | message envoy.config.core.v3.HeaderValue | `initial_metadata` |

### HealthStatusSet  (envoy/config/core/v3/health_check.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | enum envoy.config.core.v3.HealthStatus | `statuses` |

### HealthCheck  (envoy/config/core/v3/health_check.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message google.protobuf.Duration | `timeout` |
| 2 | optional | message google.protobuf.Duration | `interval` |
| 20 | optional | message google.protobuf.Duration | `initial_jitter` |
| 3 | optional | message google.protobuf.Duration | `interval_jitter` |
| 18 | optional | uint32 | `interval_jitter_percent` |
| 4 | optional | message google.protobuf.UInt32Value | `unhealthy_threshold` |
| 5 | optional | message google.protobuf.UInt32Value | `healthy_threshold` |
| 6 | optional | message google.protobuf.UInt32Value | `alt_port` |
| 7 | optional | message google.protobuf.BoolValue | `reuse_connection` |
| 8 | optional | message envoy.config.core.v3.HealthCheck.HttpHealthCheck | `http_health_check` |
| 9 | optional | message envoy.config.core.v3.HealthCheck.TcpHealthCheck | `tcp_health_check` |
| 11 | optional | message envoy.config.core.v3.HealthCheck.GrpcHealthCheck | `grpc_health_check` |
| 13 | optional | message envoy.config.core.v3.HealthCheck.CustomHealthCheck | `custom_health_check` |
| 12 | optional | message google.protobuf.Duration | `no_traffic_interval` |
| 24 | optional | message google.protobuf.Duration | `no_traffic_healthy_interval` |
| 14 | optional | message google.protobuf.Duration | `unhealthy_interval` |
| 15 | optional | message google.protobuf.Duration | `unhealthy_edge_interval` |
| 16 | optional | message google.protobuf.Duration | `healthy_edge_interval` |
| 17 | optional | string | `event_log_path` |
| 25 | repeated | message envoy.config.core.v3.TypedExtensionConfig | `event_logger` |
| 22 | optional | message envoy.config.core.v3.EventServiceConfig | `event_service` |
| 19 | optional | bool | `always_log_health_check_failures` |
| 21 | optional | message envoy.config.core.v3.HealthCheck.TlsOptions | `tls_options` |
| 23 | optional | message google.protobuf.Struct | `transport_socket_match_criteria` |

### HttpUri  (envoy/config/core/v3/http_uri.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `uri` |
| 2 | optional | string | `cluster` |
| 3 | optional | message google.protobuf.Duration | `timeout` |

### TcpProtocolOptions  (envoy/config/core/v3/protocol.proto)

| # | label | type | name |
| --- | --- | --- | --- |

### QuicKeepAliveSettings  (envoy/config/core/v3/protocol.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message google.protobuf.Duration | `max_interval` |
| 2 | optional | message google.protobuf.Duration | `initial_interval` |

### QuicProtocolOptions  (envoy/config/core/v3/protocol.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message google.protobuf.UInt32Value | `max_concurrent_streams` |
| 2 | optional | message google.protobuf.UInt32Value | `initial_stream_window_size` |
| 3 | optional | message google.protobuf.UInt32Value | `initial_connection_window_size` |
| 4 | optional | message google.protobuf.UInt32Value | `num_timeouts_to_trigger_port_migration` |
| 5 | optional | message envoy.config.core.v3.QuicKeepAliveSettings | `connection_keepalive` |
| 6 | optional | string | `connection_options` |
| 7 | optional | string | `client_connection_options` |

### UpstreamHttpProtocolOptions  (envoy/config/core/v3/protocol.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `auto_sni` |
| 2 | optional | bool | `auto_san_validation` |
| 3 | optional | string | `override_auto_sni_header` |

### AlternateProtocolsCacheOptions  (envoy/config/core/v3/protocol.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 2 | optional | message google.protobuf.UInt32Value | `max_entries` |
| 3 | optional | message envoy.config.core.v3.TypedExtensionConfig | `key_value_store_config` |
| 4 | repeated | message envoy.config.core.v3.AlternateProtocolsCacheOptions.AlternateProtocolsCacheEntry | `prepopulated_entries` |
| 5 | repeated | string | `canonical_suffixes` |

### HttpProtocolOptions  (envoy/config/core/v3/protocol.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message google.protobuf.Duration | `idle_timeout` |
| 3 | optional | message google.protobuf.Duration | `max_connection_duration` |
| 2 | optional | message google.protobuf.UInt32Value | `max_headers_count` |
| 4 | optional | message google.protobuf.Duration | `max_stream_duration` |
| 5 | optional | enum envoy.config.core.v3.HttpProtocolOptions.HeadersWithUnderscoresAction | `headers_with_underscores_action` |
| 6 | optional | message google.protobuf.UInt32Value | `max_requests_per_connection` |

### Http1ProtocolOptions  (envoy/config/core/v3/protocol.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message google.protobuf.BoolValue | `allow_absolute_url` |
| 2 | optional | bool | `accept_http_10` |
| 3 | optional | string | `default_host_for_http_10` |
| 4 | optional | message envoy.config.core.v3.Http1ProtocolOptions.HeaderKeyFormat | `header_key_format` |
| 5 | optional | bool | `enable_trailers` |
| 6 | optional | bool | `allow_chunked_length` |
| 7 | optional | message google.protobuf.BoolValue | `override_stream_error_on_invalid_http_message` |
| 8 | optional | bool | `send_fully_qualified_url` |
| 9 | optional | message google.protobuf.BoolValue | `use_balsa_parser` |
| 10 | optional | bool | `allow_custom_methods` |

### KeepaliveSettings  (envoy/config/core/v3/protocol.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message google.protobuf.Duration | `interval` |
| 2 | optional | message google.protobuf.Duration | `timeout` |
| 3 | optional | message envoy.type.v3.Percent | `interval_jitter` |
| 4 | optional | message google.protobuf.Duration | `connection_idle_interval` |

### Http2ProtocolOptions  (envoy/config/core/v3/protocol.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message google.protobuf.UInt32Value | `hpack_table_size` |
| 2 | optional | message google.protobuf.UInt32Value | `max_concurrent_streams` |
| 3 | optional | message google.protobuf.UInt32Value | `initial_stream_window_size` |
| 4 | optional | message google.protobuf.UInt32Value | `initial_connection_window_size` |
| 5 | optional | bool | `allow_connect` |
| 6 | optional | bool | `allow_metadata` |
| 7 | optional | message google.protobuf.UInt32Value | `max_outbound_frames` |
| 8 | optional | message google.protobuf.UInt32Value | `max_outbound_control_frames` |
| 9 | optional | message google.protobuf.UInt32Value | `max_consecutive_inbound_frames_with_empty_payload` |
| 10 | optional | message google.protobuf.UInt32Value | `max_inbound_priority_frames_per_stream` |
| 11 | optional | message google.protobuf.UInt32Value | `max_inbound_window_update_frames_per_data_frame_sent` |
| 12 | optional | bool | `stream_error_on_invalid_http_messaging` |
| 14 | optional | message google.protobuf.BoolValue | `override_stream_error_on_invalid_http_message` |
| 13 | repeated | message envoy.config.core.v3.Http2ProtocolOptions.SettingsParameter | `custom_settings_parameters` |
| 15 | optional | message envoy.config.core.v3.KeepaliveSettings | `connection_keepalive` |
| 16 | optional | message google.protobuf.BoolValue | `use_oghttp2_codec` |

### GrpcProtocolOptions  (envoy/config/core/v3/protocol.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.core.v3.Http2ProtocolOptions | `http2_protocol_options` |

### Http3ProtocolOptions  (envoy/config/core/v3/protocol.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.core.v3.QuicProtocolOptions | `quic_protocol_options` |
| 2 | optional | message google.protobuf.BoolValue | `override_stream_error_on_invalid_http_message` |
| 5 | optional | bool | `allow_extended_connect` |

### SchemeHeaderTransformation  (envoy/config/core/v3/protocol.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `scheme_to_overwrite` |

### ProxyProtocolPassThroughTLVs  (envoy/config/core/v3/proxy_protocol.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | enum envoy.config.core.v3.ProxyProtocolPassThroughTLVs.PassTLVsMatchType | `match_type` |
| 2 | repeated | uint32 | `tlv_type` |

### ProxyProtocolConfig  (envoy/config/core/v3/proxy_protocol.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | enum envoy.config.core.v3.ProxyProtocolConfig.Version | `version` |
| 2 | optional | message envoy.config.core.v3.ProxyProtocolPassThroughTLVs | `pass_through_tlvs` |

### DnsResolverOptions  (envoy/config/core/v3/resolver.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `use_tcp_for_dns_lookups` |
| 2 | optional | bool | `no_default_search_domain` |

### DnsResolutionConfig  (envoy/config/core/v3/resolver.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message envoy.config.core.v3.Address | `resolvers` |
| 2 | optional | message envoy.config.core.v3.DnsResolverOptions | `dns_resolver_options` |

### SocketOption  (envoy/config/core/v3/socket_option.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `description` |
| 2 | optional | int64 | `level` |
| 3 | optional | int64 | `name` |
| 4 | optional | int64 | `int_value` |
| 5 | optional | bytes | `buf_value` |
| 6 | optional | enum envoy.config.core.v3.SocketOption.SocketState | `state` |

### SocketOptionsOverride  (envoy/config/core/v3/socket_option.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message envoy.config.core.v3.SocketOption | `socket_options` |

### JsonFormatOptions  (envoy/config/core/v3/substitution_format_string.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `sort_properties` |

### SubstitutionFormatString  (envoy/config/core/v3/substitution_format_string.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `text_format` |
| 2 | optional | message google.protobuf.Struct | `json_format` |
| 5 | optional | message envoy.config.core.v3.DataSource | `text_format_source` |
| 3 | optional | bool | `omit_empty_values` |
| 4 | optional | string | `content_type` |
| 6 | repeated | message envoy.config.core.v3.TypedExtensionConfig | `formatters` |
| 7 | optional | message envoy.config.core.v3.JsonFormatOptions | `json_format_options` |

### UdpSocketConfig  (envoy/config/core/v3/udp_socket_config.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message google.protobuf.UInt64Value | `max_rx_datagram_size` |
| 2 | optional | message google.protobuf.BoolValue | `prefer_gro` |

### ClusterLoadAssignment  (envoy/config/endpoint/v3/endpoint.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `cluster_name` |
| 2 | repeated | message envoy.config.endpoint.v3.LocalityLbEndpoints | `endpoints` |
| 5 | repeated | message envoy.config.endpoint.v3.ClusterLoadAssignment.NamedEndpointsEntry | `named_endpoints` |
| 4 | optional | message envoy.config.endpoint.v3.ClusterLoadAssignment.Policy | `policy` |

### Endpoint  (envoy/config/endpoint/v3/endpoint_components.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.core.v3.Address | `address` |
| 2 | optional | message envoy.config.endpoint.v3.Endpoint.HealthCheckConfig | `health_check_config` |
| 3 | optional | string | `hostname` |
| 4 | repeated | message envoy.config.endpoint.v3.Endpoint.AdditionalAddress | `additional_addresses` |

### LbEndpoint  (envoy/config/endpoint/v3/endpoint_components.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.endpoint.v3.Endpoint | `endpoint` |
| 5 | optional | string | `endpoint_name` |
| 2 | optional | enum envoy.config.core.v3.HealthStatus | `health_status` |
| 3 | optional | message envoy.config.core.v3.Metadata | `metadata` |
| 4 | optional | message google.protobuf.UInt32Value | `load_balancing_weight` |

### LedsClusterLocalityConfig  (envoy/config/endpoint/v3/endpoint_components.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.core.v3.ConfigSource | `leds_config` |
| 2 | optional | string | `leds_collection_name` |

### LocalityLbEndpoints  (envoy/config/endpoint/v3/endpoint_components.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.core.v3.Locality | `locality` |
| 2 | repeated | message envoy.config.endpoint.v3.LbEndpoint | `lb_endpoints` |
| 7 | optional | message envoy.config.endpoint.v3.LocalityLbEndpoints.LbEndpointList | `load_balancer_endpoints` |
| 8 | optional | message envoy.config.endpoint.v3.LedsClusterLocalityConfig | `leds_cluster_locality_config` |
| 3 | optional | message google.protobuf.UInt32Value | `load_balancing_weight` |
| 5 | optional | uint32 | `priority` |
| 6 | optional | message google.protobuf.UInt32Value | `proximity` |

### UpstreamLocalityStats  (envoy/config/endpoint/v3/load_report.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.core.v3.Locality | `locality` |
| 2 | optional | uint64 | `total_successful_requests` |
| 3 | optional | uint64 | `total_requests_in_progress` |
| 4 | optional | uint64 | `total_error_requests` |
| 8 | optional | uint64 | `total_issued_requests` |
| 5 | repeated | message envoy.config.endpoint.v3.EndpointLoadMetricStats | `load_metric_stats` |
| 7 | repeated | message envoy.config.endpoint.v3.UpstreamEndpointStats | `upstream_endpoint_stats` |
| 6 | optional | uint32 | `priority` |

### UpstreamEndpointStats  (envoy/config/endpoint/v3/load_report.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.core.v3.Address | `address` |
| 6 | optional | message google.protobuf.Struct | `metadata` |
| 2 | optional | uint64 | `total_successful_requests` |
| 3 | optional | uint64 | `total_requests_in_progress` |
| 4 | optional | uint64 | `total_error_requests` |
| 7 | optional | uint64 | `total_issued_requests` |
| 5 | repeated | message envoy.config.endpoint.v3.EndpointLoadMetricStats | `load_metric_stats` |

### EndpointLoadMetricStats  (envoy/config/endpoint/v3/load_report.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `metric_name` |
| 2 | optional | uint64 | `num_requests_finished_with_metric` |
| 3 | optional | double | `total_metric_value` |

### ClusterStats  (envoy/config/endpoint/v3/load_report.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `cluster_name` |
| 6 | optional | string | `cluster_service_name` |
| 2 | repeated | message envoy.config.endpoint.v3.UpstreamLocalityStats | `upstream_locality_stats` |
| 3 | optional | uint64 | `total_dropped_requests` |
| 5 | repeated | message envoy.config.endpoint.v3.ClusterStats.DroppedRequests | `dropped_requests` |
| 4 | optional | message google.protobuf.Duration | `load_report_interval` |

### ApiListener  (envoy/config/listener/v3/api_listener.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message google.protobuf.Any | `api_listener` |

### AdditionalAddress  (envoy/config/listener/v3/listener.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.core.v3.Address | `address` |
| 2 | optional | message envoy.config.core.v3.SocketOptionsOverride | `socket_options` |

### ListenerCollection  (envoy/config/listener/v3/listener.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message xds.core.v3.CollectionEntry | `entries` |

### Listener  (envoy/config/listener/v3/listener.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 2 | optional | message envoy.config.core.v3.Address | `address` |
| 33 | repeated | message envoy.config.listener.v3.AdditionalAddress | `additional_addresses` |
| 28 | optional | string | `stat_prefix` |
| 3 | repeated | message envoy.config.listener.v3.FilterChain | `filter_chains` |
| 32 | optional | message xds.type.matcher.v3.Matcher | `filter_chain_matcher` |
| 4 | optional | message google.protobuf.BoolValue | `use_original_dst` |
| 25 | optional | message envoy.config.listener.v3.FilterChain | `default_filter_chain` |
| 5 | optional | message google.protobuf.UInt32Value | `per_connection_buffer_limit_bytes` |
| 6 | optional | message envoy.config.core.v3.Metadata | `metadata` |
| 7 | optional | message envoy.config.listener.v3.Listener.DeprecatedV1 | `deprecated_v1` |
| 8 | optional | enum envoy.config.listener.v3.Listener.DrainType | `drain_type` |
| 9 | repeated | message envoy.config.listener.v3.ListenerFilter | `listener_filters` |
| 15 | optional | message google.protobuf.Duration | `listener_filters_timeout` |
| 17 | optional | bool | `continue_on_listener_filters_timeout` |
| 10 | optional | message google.protobuf.BoolValue | `transparent` |
| 11 | optional | message google.protobuf.BoolValue | `freebind` |
| 13 | repeated | message envoy.config.core.v3.SocketOption | `socket_options` |
| 12 | optional | message google.protobuf.UInt32Value | `tcp_fast_open_queue_length` |
| 16 | optional | enum envoy.config.core.v3.TrafficDirection | `traffic_direction` |
| 18 | optional | message envoy.config.listener.v3.UdpListenerConfig | `udp_listener_config` |
| 19 | optional | message envoy.config.listener.v3.ApiListener | `api_listener` |
| 20 | optional | message envoy.config.listener.v3.Listener.ConnectionBalanceConfig | `connection_balance_config` |
| 21 | optional | bool | `reuse_port` |
| 29 | optional | message google.protobuf.BoolValue | `enable_reuse_port` |
| 22 | repeated | message envoy.config.accesslog.v3.AccessLog | `access_log` |
| 24 | optional | message google.protobuf.UInt32Value | `tcp_backlog_size` |
| 34 | optional | message google.protobuf.UInt32Value | `max_connections_to_accept_per_socket_event` |
| 26 | optional | message google.protobuf.BoolValue | `bind_to_port` |
| 27 | optional | message envoy.config.listener.v3.Listener.InternalListenerConfig | `internal_listener` |
| 30 | optional | bool | `enable_mptcp` |
| 31 | optional | bool | `ignore_global_conn_limit` |

### ListenerManager  (envoy/config/listener/v3/listener.proto)

| # | label | type | name |
| --- | --- | --- | --- |

### ValidationListenerManager  (envoy/config/listener/v3/listener.proto)

| # | label | type | name |
| --- | --- | --- | --- |

### ApiListenerManager  (envoy/config/listener/v3/listener.proto)

| # | label | type | name |
| --- | --- | --- | --- |

### Filter  (envoy/config/listener/v3/listener_components.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 4 | optional | message google.protobuf.Any | `typed_config` |
| 5 | optional | message envoy.config.core.v3.ExtensionConfigSource | `config_discovery` |

### FilterChainMatch  (envoy/config/listener/v3/listener_components.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 8 | optional | message google.protobuf.UInt32Value | `destination_port` |
| 3 | repeated | message envoy.config.core.v3.CidrRange | `prefix_ranges` |
| 4 | optional | string | `address_suffix` |
| 5 | optional | message google.protobuf.UInt32Value | `suffix_len` |
| 13 | repeated | message envoy.config.core.v3.CidrRange | `direct_source_prefix_ranges` |
| 12 | optional | enum envoy.config.listener.v3.FilterChainMatch.ConnectionSourceType | `source_type` |
| 6 | repeated | message envoy.config.core.v3.CidrRange | `source_prefix_ranges` |
| 7 | repeated | uint32 | `source_ports` |
| 11 | repeated | string | `server_names` |
| 9 | optional | string | `transport_protocol` |
| 10 | repeated | string | `application_protocols` |

### FilterChain  (envoy/config/listener/v3/listener_components.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.listener.v3.FilterChainMatch | `filter_chain_match` |
| 3 | repeated | message envoy.config.listener.v3.Filter | `filters` |
| 4 | optional | message google.protobuf.BoolValue | `use_proxy_proto` |
| 5 | optional | message envoy.config.core.v3.Metadata | `metadata` |
| 6 | optional | message envoy.config.core.v3.TransportSocket | `transport_socket` |
| 9 | optional | message google.protobuf.Duration | `transport_socket_connect_timeout` |
| 7 | optional | string | `name` |
| 8 | optional | message envoy.config.listener.v3.FilterChain.OnDemandConfiguration | `on_demand_configuration` |

### ListenerFilterChainMatchPredicate  (envoy/config/listener/v3/listener_components.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.listener.v3.ListenerFilterChainMatchPredicate.MatchSet | `or_match` |
| 2 | optional | message envoy.config.listener.v3.ListenerFilterChainMatchPredicate.MatchSet | `and_match` |
| 3 | optional | message envoy.config.listener.v3.ListenerFilterChainMatchPredicate | `not_match` |
| 4 | optional | bool | `any_match` |
| 5 | optional | message envoy.type.v3.Int32Range | `destination_port_range` |

### ListenerFilter  (envoy/config/listener/v3/listener_components.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 3 | optional | message google.protobuf.Any | `typed_config` |
| 5 | optional | message envoy.config.core.v3.ExtensionConfigSource | `config_discovery` |
| 4 | optional | message envoy.config.listener.v3.ListenerFilterChainMatchPredicate | `filter_disabled` |

### QuicProtocolOptions  (envoy/config/listener/v3/quic_config.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.core.v3.QuicProtocolOptions | `quic_protocol_options` |
| 2 | optional | message google.protobuf.Duration | `idle_timeout` |
| 3 | optional | message google.protobuf.Duration | `crypto_handshake_timeout` |
| 4 | optional | message envoy.config.core.v3.RuntimeFeatureFlag | `enabled` |
| 5 | optional | message google.protobuf.UInt32Value | `packets_to_read_to_connection_count_ratio` |
| 6 | optional | message envoy.config.core.v3.TypedExtensionConfig | `crypto_stream_config` |
| 7 | optional | message envoy.config.core.v3.TypedExtensionConfig | `proof_source_config` |
| 8 | optional | message envoy.config.core.v3.TypedExtensionConfig | `connection_id_generator_config` |
| 9 | optional | message envoy.config.core.v3.TypedExtensionConfig | `server_preferred_address_config` |

### UdpListenerConfig  (envoy/config/listener/v3/udp_listener_config.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 5 | optional | message envoy.config.core.v3.UdpSocketConfig | `downstream_socket_config` |
| 7 | optional | message envoy.config.listener.v3.QuicProtocolOptions | `quic_options` |
| 8 | optional | message envoy.config.core.v3.TypedExtensionConfig | `udp_packet_packet_writer_config` |

### ActiveRawUdpListenerConfig  (envoy/config/listener/v3/udp_listener_config.proto)

| # | label | type | name |
| --- | --- | --- | --- |

### RBAC  (envoy/config/rbac/v3/rbac.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | enum envoy.config.rbac.v3.RBAC.Action | `action` |
| 2 | repeated | message envoy.config.rbac.v3.RBAC.PoliciesEntry | `policies` |
| 3 | optional | message envoy.config.rbac.v3.RBAC.AuditLoggingOptions | `audit_logging_options` |

### Policy  (envoy/config/rbac/v3/rbac.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message envoy.config.rbac.v3.Permission | `permissions` |
| 2 | repeated | message envoy.config.rbac.v3.Principal | `principals` |
| 3 | optional | message google.api.expr.v1alpha1.Expr | `condition` |
| 4 | optional | message google.api.expr.v1alpha1.CheckedExpr | `checked_condition` |

### Permission  (envoy/config/rbac/v3/rbac.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.rbac.v3.Permission.Set | `and_rules` |
| 2 | optional | message envoy.config.rbac.v3.Permission.Set | `or_rules` |
| 3 | optional | bool | `any` |
| 4 | optional | message envoy.config.route.v3.HeaderMatcher | `header` |
| 10 | optional | message envoy.type.matcher.v3.PathMatcher | `url_path` |
| 5 | optional | message envoy.config.core.v3.CidrRange | `destination_ip` |
| 6 | optional | uint32 | `destination_port` |
| 11 | optional | message envoy.type.v3.Int32Range | `destination_port_range` |
| 7 | optional | message envoy.type.matcher.v3.MetadataMatcher | `metadata` |
| 8 | optional | message envoy.config.rbac.v3.Permission | `not_rule` |
| 9 | optional | message envoy.type.matcher.v3.StringMatcher | `requested_server_name` |
| 12 | optional | message envoy.config.core.v3.TypedExtensionConfig | `matcher` |

### Principal  (envoy/config/rbac/v3/rbac.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.rbac.v3.Principal.Set | `and_ids` |
| 2 | optional | message envoy.config.rbac.v3.Principal.Set | `or_ids` |
| 3 | optional | bool | `any` |
| 4 | optional | message envoy.config.rbac.v3.Principal.Authenticated | `authenticated` |
| 5 | optional | message envoy.config.core.v3.CidrRange | `source_ip` |
| 10 | optional | message envoy.config.core.v3.CidrRange | `direct_remote_ip` |
| 11 | optional | message envoy.config.core.v3.CidrRange | `remote_ip` |
| 6 | optional | message envoy.config.route.v3.HeaderMatcher | `header` |
| 9 | optional | message envoy.type.matcher.v3.PathMatcher | `url_path` |
| 7 | optional | message envoy.type.matcher.v3.MetadataMatcher | `metadata` |
| 12 | optional | message envoy.type.matcher.v3.FilterStateMatcher | `filter_state` |
| 8 | optional | message envoy.config.rbac.v3.Principal | `not_id` |

### Action  (envoy/config/rbac/v3/rbac.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 2 | optional | enum envoy.config.rbac.v3.RBAC.Action | `action` |

### RouteConfiguration  (envoy/config/route/v3/route.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 2 | repeated | message envoy.config.route.v3.VirtualHost | `virtual_hosts` |
| 9 | optional | message envoy.config.route.v3.Vhds | `vhds` |
| 3 | repeated | string | `internal_only_headers` |
| 4 | repeated | message envoy.config.core.v3.HeaderValueOption | `response_headers_to_add` |
| 5 | repeated | string | `response_headers_to_remove` |
| 6 | repeated | message envoy.config.core.v3.HeaderValueOption | `request_headers_to_add` |
| 8 | repeated | string | `request_headers_to_remove` |
| 10 | optional | bool | `most_specific_header_mutations_wins` |
| 7 | optional | message google.protobuf.BoolValue | `validate_clusters` |
| 11 | optional | message google.protobuf.UInt32Value | `max_direct_response_body_size_bytes` |
| 12 | repeated | message envoy.config.route.v3.ClusterSpecifierPlugin | `cluster_specifier_plugins` |
| 13 | repeated | message envoy.config.route.v3.RouteAction.RequestMirrorPolicy | `request_mirror_policies` |
| 14 | optional | bool | `ignore_port_in_host_matching` |
| 15 | optional | bool | `ignore_path_parameters_in_path_matching` |
| 16 | repeated | message envoy.config.route.v3.RouteConfiguration.TypedPerFilterConfigEntry | `typed_per_filter_config` |
| 17 | optional | message envoy.config.core.v3.Metadata | `metadata` |

### Vhds  (envoy/config/route/v3/route.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.core.v3.ConfigSource | `config_source` |

### VirtualHost  (envoy/config/route/v3/route_components.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 2 | repeated | string | `domains` |
| 3 | repeated | message envoy.config.route.v3.Route | `routes` |
| 21 | optional | message xds.type.matcher.v3.Matcher | `matcher` |
| 4 | optional | enum envoy.config.route.v3.VirtualHost.TlsRequirementType | `require_tls` |
| 5 | repeated | message envoy.config.route.v3.VirtualCluster | `virtual_clusters` |
| 6 | repeated | message envoy.config.route.v3.RateLimit | `rate_limits` |
| 7 | repeated | message envoy.config.core.v3.HeaderValueOption | `request_headers_to_add` |
| 13 | repeated | string | `request_headers_to_remove` |
| 10 | repeated | message envoy.config.core.v3.HeaderValueOption | `response_headers_to_add` |
| 11 | repeated | string | `response_headers_to_remove` |
| 8 | optional | message envoy.config.route.v3.CorsPolicy | `cors` |
| 15 | repeated | message envoy.config.route.v3.VirtualHost.TypedPerFilterConfigEntry | `typed_per_filter_config` |
| 14 | optional | bool | `include_request_attempt_count` |
| 19 | optional | bool | `include_attempt_count_in_response` |
| 16 | optional | message envoy.config.route.v3.RetryPolicy | `retry_policy` |
| 20 | optional | message google.protobuf.Any | `retry_policy_typed_config` |
| 17 | optional | message envoy.config.route.v3.HedgePolicy | `hedge_policy` |
| 23 | optional | bool | `include_is_timeout_retry_header` |
| 18 | optional | message google.protobuf.UInt32Value | `per_request_buffer_limit_bytes` |
| 22 | repeated | message envoy.config.route.v3.RouteAction.RequestMirrorPolicy | `request_mirror_policies` |
| 24 | optional | message envoy.config.core.v3.Metadata | `metadata` |

### FilterAction  (envoy/config/route/v3/route_components.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message google.protobuf.Any | `action` |

### RouteList  (envoy/config/route/v3/route_components.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message envoy.config.route.v3.Route | `routes` |

### Route  (envoy/config/route/v3/route_components.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 14 | optional | string | `name` |
| 1 | optional | message envoy.config.route.v3.RouteMatch | `match` |
| 2 | optional | message envoy.config.route.v3.RouteAction | `route` |
| 3 | optional | message envoy.config.route.v3.RedirectAction | `redirect` |
| 7 | optional | message envoy.config.route.v3.DirectResponseAction | `direct_response` |
| 17 | optional | message envoy.config.route.v3.FilterAction | `filter_action` |
| 18 | optional | message envoy.config.route.v3.NonForwardingAction | `non_forwarding_action` |
| 4 | optional | message envoy.config.core.v3.Metadata | `metadata` |
| 5 | optional | message envoy.config.route.v3.Decorator | `decorator` |
| 13 | repeated | message envoy.config.route.v3.Route.TypedPerFilterConfigEntry | `typed_per_filter_config` |
| 9 | repeated | message envoy.config.core.v3.HeaderValueOption | `request_headers_to_add` |
| 12 | repeated | string | `request_headers_to_remove` |
| 10 | repeated | message envoy.config.core.v3.HeaderValueOption | `response_headers_to_add` |
| 11 | repeated | string | `response_headers_to_remove` |
| 15 | optional | message envoy.config.route.v3.Tracing | `tracing` |
| 16 | optional | message google.protobuf.UInt32Value | `per_request_buffer_limit_bytes` |
| 19 | optional | string | `stat_prefix` |

### WeightedCluster  (envoy/config/route/v3/route_components.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message envoy.config.route.v3.WeightedCluster.ClusterWeight | `clusters` |
| 3 | optional | message google.protobuf.UInt32Value | `total_weight` |
| 2 | optional | string | `runtime_key_prefix` |
| 4 | optional | string | `header_name` |

### ClusterSpecifierPlugin  (envoy/config/route/v3/route_components.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.core.v3.TypedExtensionConfig | `extension` |
| 2 | optional | bool | `is_optional` |

### RouteMatch  (envoy/config/route/v3/route_components.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `prefix` |
| 2 | optional | string | `path` |
| 10 | optional | message envoy.type.matcher.v3.RegexMatcher | `safe_regex` |
| 12 | optional | message envoy.config.route.v3.RouteMatch.ConnectMatcher | `connect_matcher` |
| 14 | optional | string | `path_separated_prefix` |
| 15 | optional | message envoy.config.core.v3.TypedExtensionConfig | `path_match_policy` |
| 4 | optional | message google.protobuf.BoolValue | `case_sensitive` |
| 9 | optional | message envoy.config.core.v3.RuntimeFractionalPercent | `runtime_fraction` |
| 6 | repeated | message envoy.config.route.v3.HeaderMatcher | `headers` |
| 7 | repeated | message envoy.config.route.v3.QueryParameterMatcher | `query_parameters` |
| 8 | optional | message envoy.config.route.v3.RouteMatch.GrpcRouteMatchOptions | `grpc` |
| 11 | optional | message envoy.config.route.v3.RouteMatch.TlsContextMatchOptions | `tls_context` |
| 13 | repeated | message envoy.type.matcher.v3.MetadataMatcher | `dynamic_metadata` |

### CorsPolicy  (envoy/config/route/v3/route_components.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 11 | repeated | message envoy.type.matcher.v3.StringMatcher | `allow_origin_string_match` |
| 2 | optional | string | `allow_methods` |
| 3 | optional | string | `allow_headers` |
| 4 | optional | string | `expose_headers` |
| 5 | optional | string | `max_age` |
| 6 | optional | message google.protobuf.BoolValue | `allow_credentials` |
| 9 | optional | message envoy.config.core.v3.RuntimeFractionalPercent | `filter_enabled` |
| 10 | optional | message envoy.config.core.v3.RuntimeFractionalPercent | `shadow_enabled` |
| 12 | optional | message google.protobuf.BoolValue | `allow_private_network_access` |

### RouteAction  (envoy/config/route/v3/route_components.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `cluster` |
| 2 | optional | string | `cluster_header` |
| 3 | optional | message envoy.config.route.v3.WeightedCluster | `weighted_clusters` |
| 37 | optional | string | `cluster_specifier_plugin` |
| 39 | optional | message envoy.config.route.v3.ClusterSpecifierPlugin | `inline_cluster_specifier_plugin` |
| 20 | optional | enum envoy.config.route.v3.RouteAction.ClusterNotFoundResponseCode | `cluster_not_found_response_code` |
| 4 | optional | message envoy.config.core.v3.Metadata | `metadata_match` |
| 5 | optional | string | `prefix_rewrite` |
| 32 | optional | message envoy.type.matcher.v3.RegexMatchAndSubstitute | `regex_rewrite` |
| 41 | optional | message envoy.config.core.v3.TypedExtensionConfig | `path_rewrite_policy` |
| 6 | optional | string | `host_rewrite_literal` |
| 7 | optional | message google.protobuf.BoolValue | `auto_host_rewrite` |
| 29 | optional | string | `host_rewrite_header` |
| 35 | optional | message envoy.type.matcher.v3.RegexMatchAndSubstitute | `host_rewrite_path_regex` |
| 38 | optional | bool | `append_x_forwarded_host` |
| 8 | optional | message google.protobuf.Duration | `timeout` |
| 24 | optional | message google.protobuf.Duration | `idle_timeout` |
| 40 | optional | message envoy.config.core.v3.TypedExtensionConfig | `early_data_policy` |
| 9 | optional | message envoy.config.route.v3.RetryPolicy | `retry_policy` |
| 33 | optional | message google.protobuf.Any | `retry_policy_typed_config` |
| 30 | repeated | message envoy.config.route.v3.RouteAction.RequestMirrorPolicy | `request_mirror_policies` |
| 11 | optional | enum envoy.config.core.v3.RoutingPriority | `priority` |
| 13 | repeated | message envoy.config.route.v3.RateLimit | `rate_limits` |
| 14 | optional | message google.protobuf.BoolValue | `include_vh_rate_limits` |
| 15 | repeated | message envoy.config.route.v3.RouteAction.HashPolicy | `hash_policy` |
| 17 | optional | message envoy.config.route.v3.CorsPolicy | `cors` |
| 23 | optional | message google.protobuf.Duration | `max_grpc_timeout` |
| 28 | optional | message google.protobuf.Duration | `grpc_timeout_offset` |
| 25 | repeated | message envoy.config.route.v3.RouteAction.UpgradeConfig | `upgrade_configs` |
| 34 | optional | message envoy.config.route.v3.InternalRedirectPolicy | `internal_redirect_policy` |
| 26 | optional | enum envoy.config.route.v3.RouteAction.InternalRedirectAction | `internal_redirect_action` |
| 31 | optional | message google.protobuf.UInt32Value | `max_internal_redirects` |
| 27 | optional | message envoy.config.route.v3.HedgePolicy | `hedge_policy` |
| 36 | optional | message envoy.config.route.v3.RouteAction.MaxStreamDuration | `max_stream_duration` |

### RetryPolicy  (envoy/config/route/v3/route_components.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `retry_on` |
| 2 | optional | message google.protobuf.UInt32Value | `num_retries` |
| 3 | optional | message google.protobuf.Duration | `per_try_timeout` |
| 13 | optional | message google.protobuf.Duration | `per_try_idle_timeout` |
| 4 | optional | message envoy.config.route.v3.RetryPolicy.RetryPriority | `retry_priority` |
| 5 | repeated | message envoy.config.route.v3.RetryPolicy.RetryHostPredicate | `retry_host_predicate` |
| 12 | repeated | message envoy.config.core.v3.TypedExtensionConfig | `retry_options_predicates` |
| 6 | optional | int64 | `host_selection_retry_max_attempts` |
| 7 | repeated | uint32 | `retriable_status_codes` |
| 8 | optional | message envoy.config.route.v3.RetryPolicy.RetryBackOff | `retry_back_off` |
| 11 | optional | message envoy.config.route.v3.RetryPolicy.RateLimitedRetryBackOff | `rate_limited_retry_back_off` |
| 9 | repeated | message envoy.config.route.v3.HeaderMatcher | `retriable_headers` |
| 10 | repeated | message envoy.config.route.v3.HeaderMatcher | `retriable_request_headers` |

### HedgePolicy  (envoy/config/route/v3/route_components.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message google.protobuf.UInt32Value | `initial_requests` |
| 2 | optional | message envoy.type.v3.FractionalPercent | `additional_request_chance` |
| 3 | optional | bool | `hedge_on_per_try_timeout` |

### RedirectAction  (envoy/config/route/v3/route_components.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 4 | optional | bool | `https_redirect` |
| 7 | optional | string | `scheme_redirect` |
| 1 | optional | string | `host_redirect` |
| 8 | optional | uint32 | `port_redirect` |
| 2 | optional | string | `path_redirect` |
| 5 | optional | string | `prefix_rewrite` |
| 9 | optional | message envoy.type.matcher.v3.RegexMatchAndSubstitute | `regex_rewrite` |
| 3 | optional | enum envoy.config.route.v3.RedirectAction.RedirectResponseCode | `response_code` |
| 6 | optional | bool | `strip_query` |

### DirectResponseAction  (envoy/config/route/v3/route_components.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | uint32 | `status` |
| 2 | optional | message envoy.config.core.v3.DataSource | `body` |

### NonForwardingAction  (envoy/config/route/v3/route_components.proto)

| # | label | type | name |
| --- | --- | --- | --- |

### Decorator  (envoy/config/route/v3/route_components.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `operation` |
| 2 | optional | message google.protobuf.BoolValue | `propagate` |

### Tracing  (envoy/config/route/v3/route_components.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.type.v3.FractionalPercent | `client_sampling` |
| 2 | optional | message envoy.type.v3.FractionalPercent | `random_sampling` |
| 3 | optional | message envoy.type.v3.FractionalPercent | `overall_sampling` |
| 4 | repeated | message envoy.type.tracing.v3.CustomTag | `custom_tags` |

### VirtualCluster  (envoy/config/route/v3/route_components.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 4 | repeated | message envoy.config.route.v3.HeaderMatcher | `headers` |
| 2 | optional | string | `name` |

### RateLimit  (envoy/config/route/v3/route_components.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message google.protobuf.UInt32Value | `stage` |
| 2 | optional | string | `disable_key` |
| 3 | repeated | message envoy.config.route.v3.RateLimit.Action | `actions` |
| 4 | optional | message envoy.config.route.v3.RateLimit.Override | `limit` |

### HeaderMatcher  (envoy/config/route/v3/route_components.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 4 | optional | string | `exact_match` |
| 11 | optional | message envoy.type.matcher.v3.RegexMatcher | `safe_regex_match` |
| 6 | optional | message envoy.type.v3.Int64Range | `range_match` |
| 7 | optional | bool | `present_match` |
| 9 | optional | string | `prefix_match` |
| 10 | optional | string | `suffix_match` |
| 12 | optional | string | `contains_match` |
| 13 | optional | message envoy.type.matcher.v3.StringMatcher | `string_match` |
| 8 | optional | bool | `invert_match` |
| 14 | optional | bool | `treat_missing_header_as_empty` |

### QueryParameterMatcher  (envoy/config/route/v3/route_components.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 5 | optional | message envoy.type.matcher.v3.StringMatcher | `string_match` |
| 6 | optional | bool | `present_match` |

### InternalRedirectPolicy  (envoy/config/route/v3/route_components.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message google.protobuf.UInt32Value | `max_internal_redirects` |
| 2 | repeated | uint32 | `redirect_response_codes` |
| 3 | repeated | message envoy.config.core.v3.TypedExtensionConfig | `predicates` |
| 4 | optional | bool | `allow_cross_scheme_redirect` |
| 5 | repeated | string | `response_headers_to_copy` |

### FilterConfig  (envoy/config/route/v3/route_components.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message google.protobuf.Any | `config` |
| 2 | optional | bool | `is_optional` |
| 3 | optional | bool | `disabled` |

### ScopedRouteConfiguration  (envoy/config/route/v3/scoped_route.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 4 | optional | bool | `on_demand` |
| 1 | optional | string | `name` |
| 2 | optional | string | `route_configuration_name` |
| 5 | optional | message envoy.config.route.v3.RouteConfiguration | `route_configuration` |
| 3 | optional | message envoy.config.route.v3.ScopedRouteConfiguration.Key | `key` |

### Tracing  (envoy/config/trace/v3/http_tracer.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.trace.v3.Tracing.Http | `http` |

### TCPAccessLogEntry  (envoy/data/accesslog/v3/accesslog.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.data.accesslog.v3.AccessLogCommon | `common_properties` |
| 2 | optional | message envoy.data.accesslog.v3.ConnectionProperties | `connection_properties` |

### HTTPAccessLogEntry  (envoy/data/accesslog/v3/accesslog.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.data.accesslog.v3.AccessLogCommon | `common_properties` |
| 2 | optional | enum envoy.data.accesslog.v3.HTTPAccessLogEntry.HTTPVersion | `protocol_version` |
| 3 | optional | message envoy.data.accesslog.v3.HTTPRequestProperties | `request` |
| 4 | optional | message envoy.data.accesslog.v3.HTTPResponseProperties | `response` |

### ConnectionProperties  (envoy/data/accesslog/v3/accesslog.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | uint64 | `received_bytes` |
| 2 | optional | uint64 | `sent_bytes` |

### AccessLogCommon  (envoy/data/accesslog/v3/accesslog.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | double | `sample_rate` |
| 2 | optional | message envoy.config.core.v3.Address | `downstream_remote_address` |
| 3 | optional | message envoy.config.core.v3.Address | `downstream_local_address` |
| 4 | optional | message envoy.data.accesslog.v3.TLSProperties | `tls_properties` |
| 5 | optional | message google.protobuf.Timestamp | `start_time` |
| 6 | optional | message google.protobuf.Duration | `time_to_last_rx_byte` |
| 7 | optional | message google.protobuf.Duration | `time_to_first_upstream_tx_byte` |
| 8 | optional | message google.protobuf.Duration | `time_to_last_upstream_tx_byte` |
| 9 | optional | message google.protobuf.Duration | `time_to_first_upstream_rx_byte` |
| 10 | optional | message google.protobuf.Duration | `time_to_last_upstream_rx_byte` |
| 11 | optional | message google.protobuf.Duration | `time_to_first_downstream_tx_byte` |
| 12 | optional | message google.protobuf.Duration | `time_to_last_downstream_tx_byte` |
| 13 | optional | message envoy.config.core.v3.Address | `upstream_remote_address` |
| 14 | optional | message envoy.config.core.v3.Address | `upstream_local_address` |
| 15 | optional | string | `upstream_cluster` |
| 16 | optional | message envoy.data.accesslog.v3.ResponseFlags | `response_flags` |
| 17 | optional | message envoy.config.core.v3.Metadata | `metadata` |
| 18 | optional | string | `upstream_transport_failure_reason` |
| 19 | optional | string | `route_name` |
| 20 | optional | message envoy.config.core.v3.Address | `downstream_direct_remote_address` |
| 21 | repeated | message envoy.data.accesslog.v3.AccessLogCommon.FilterStateObjectsEntry | `filter_state_objects` |
| 22 | repeated | message envoy.data.accesslog.v3.AccessLogCommon.CustomTagsEntry | `custom_tags` |
| 23 | optional | message google.protobuf.Duration | `duration` |
| 24 | optional | uint32 | `upstream_request_attempt_count` |
| 25 | optional | string | `connection_termination_details` |
| 26 | optional | string | `stream_id` |
| 27 | optional | bool | `intermediate_log_entry` |
| 28 | optional | string | `downstream_transport_failure_reason` |
| 29 | optional | uint64 | `downstream_wire_bytes_sent` |
| 30 | optional | uint64 | `downstream_wire_bytes_received` |
| 31 | optional | uint64 | `upstream_wire_bytes_sent` |
| 32 | optional | uint64 | `upstream_wire_bytes_received` |
| 33 | optional | enum envoy.data.accesslog.v3.AccessLogType | `access_log_type` |

### ResponseFlags  (envoy/data/accesslog/v3/accesslog.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `failed_local_healthcheck` |
| 2 | optional | bool | `no_healthy_upstream` |
| 3 | optional | bool | `upstream_request_timeout` |
| 4 | optional | bool | `local_reset` |
| 5 | optional | bool | `upstream_remote_reset` |
| 6 | optional | bool | `upstream_connection_failure` |
| 7 | optional | bool | `upstream_connection_termination` |
| 8 | optional | bool | `upstream_overflow` |
| 9 | optional | bool | `no_route_found` |
| 10 | optional | bool | `delay_injected` |
| 11 | optional | bool | `fault_injected` |
| 12 | optional | bool | `rate_limited` |
| 13 | optional | message envoy.data.accesslog.v3.ResponseFlags.Unauthorized | `unauthorized_details` |
| 14 | optional | bool | `rate_limit_service_error` |
| 15 | optional | bool | `downstream_connection_termination` |
| 16 | optional | bool | `upstream_retry_limit_exceeded` |
| 17 | optional | bool | `stream_idle_timeout` |
| 18 | optional | bool | `invalid_envoy_request_headers` |
| 19 | optional | bool | `downstream_protocol_error` |
| 20 | optional | bool | `upstream_max_stream_duration_reached` |
| 21 | optional | bool | `response_from_cache_filter` |
| 22 | optional | bool | `no_filter_config_found` |
| 23 | optional | bool | `duration_timeout` |
| 24 | optional | bool | `upstream_protocol_error` |
| 25 | optional | bool | `no_cluster_found` |
| 26 | optional | bool | `overload_manager` |
| 27 | optional | bool | `dns_resolution_failure` |

### TLSProperties  (envoy/data/accesslog/v3/accesslog.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | enum envoy.data.accesslog.v3.TLSProperties.TLSVersion | `tls_version` |
| 2 | optional | message google.protobuf.UInt32Value | `tls_cipher_suite` |
| 3 | optional | string | `tls_sni_hostname` |
| 4 | optional | message envoy.data.accesslog.v3.TLSProperties.CertificateProperties | `local_certificate_properties` |
| 5 | optional | message envoy.data.accesslog.v3.TLSProperties.CertificateProperties | `peer_certificate_properties` |
| 6 | optional | string | `tls_session_id` |
| 7 | optional | string | `ja3_fingerprint` |

### HTTPRequestProperties  (envoy/data/accesslog/v3/accesslog.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | enum envoy.config.core.v3.RequestMethod | `request_method` |
| 2 | optional | string | `scheme` |
| 3 | optional | string | `authority` |
| 4 | optional | message google.protobuf.UInt32Value | `port` |
| 5 | optional | string | `path` |
| 6 | optional | string | `user_agent` |
| 7 | optional | string | `referer` |
| 8 | optional | string | `forwarded_for` |
| 9 | optional | string | `request_id` |
| 10 | optional | string | `original_path` |
| 11 | optional | uint64 | `request_headers_bytes` |
| 12 | optional | uint64 | `request_body_bytes` |
| 13 | repeated | message envoy.data.accesslog.v3.HTTPRequestProperties.RequestHeadersEntry | `request_headers` |
| 14 | optional | uint64 | `upstream_header_bytes_sent` |
| 15 | optional | uint64 | `downstream_header_bytes_received` |

### HTTPResponseProperties  (envoy/data/accesslog/v3/accesslog.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message google.protobuf.UInt32Value | `response_code` |
| 2 | optional | uint64 | `response_headers_bytes` |
| 3 | optional | uint64 | `response_body_bytes` |
| 4 | repeated | message envoy.data.accesslog.v3.HTTPResponseProperties.ResponseHeadersEntry | `response_headers` |
| 5 | repeated | message envoy.data.accesslog.v3.HTTPResponseProperties.ResponseTrailersEntry | `response_trailers` |
| 6 | optional | string | `response_code_details` |
| 7 | optional | uint64 | `upstream_header_bytes_received` |
| 8 | optional | uint64 | `downstream_header_bytes_sent` |

### ClusterConfig  (envoy/extensions/clusters/aggregate/v3/cluster.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | string | `clusters` |

### FaultDelay  (envoy/extensions/filters/common/fault/v3/fault.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 3 | optional | message google.protobuf.Duration | `fixed_delay` |
| 5 | optional | message envoy.extensions.filters.common.fault.v3.FaultDelay.HeaderDelay | `header_delay` |
| 4 | optional | message envoy.type.v3.FractionalPercent | `percentage` |

### FaultRateLimit  (envoy/extensions/filters/common/fault/v3/fault.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.extensions.filters.common.fault.v3.FaultRateLimit.FixedLimit | `fixed_limit` |
| 3 | optional | message envoy.extensions.filters.common.fault.v3.FaultRateLimit.HeaderLimit | `header_limit` |
| 2 | optional | message envoy.type.v3.FractionalPercent | `percentage` |

### FaultAbort  (envoy/extensions/filters/http/fault/v3/fault.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 2 | optional | uint32 | `http_status` |
| 5 | optional | uint32 | `grpc_status` |
| 4 | optional | message envoy.extensions.filters.http.fault.v3.FaultAbort.HeaderAbort | `header_abort` |
| 3 | optional | message envoy.type.v3.FractionalPercent | `percentage` |

### HTTPFault  (envoy/extensions/filters/http/fault/v3/fault.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.extensions.filters.common.fault.v3.FaultDelay | `delay` |
| 2 | optional | message envoy.extensions.filters.http.fault.v3.FaultAbort | `abort` |
| 3 | optional | string | `upstream_cluster` |
| 4 | repeated | message envoy.config.route.v3.HeaderMatcher | `headers` |
| 5 | repeated | string | `downstream_nodes` |
| 6 | optional | message google.protobuf.UInt32Value | `max_active_faults` |
| 7 | optional | message envoy.extensions.filters.common.fault.v3.FaultRateLimit | `response_rate_limit` |
| 8 | optional | string | `delay_percent_runtime` |
| 9 | optional | string | `abort_percent_runtime` |
| 10 | optional | string | `delay_duration_runtime` |
| 11 | optional | string | `abort_http_status_runtime` |
| 12 | optional | string | `max_active_faults_runtime` |
| 13 | optional | string | `response_rate_limit_percent_runtime` |
| 14 | optional | string | `abort_grpc_status_runtime` |
| 15 | optional | bool | `disable_downstream_cluster_stats` |
| 16 | optional | message google.protobuf.Struct | `filter_metadata` |

### RBAC  (envoy/extensions/filters/http/rbac/v3/rbac.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.rbac.v3.RBAC | `rules` |
| 4 | optional | message xds.type.matcher.v3.Matcher | `matcher` |
| 2 | optional | message envoy.config.rbac.v3.RBAC | `shadow_rules` |
| 5 | optional | message xds.type.matcher.v3.Matcher | `shadow_matcher` |
| 3 | optional | string | `shadow_rules_stat_prefix` |

### RBACPerRoute  (envoy/extensions/filters/http/rbac/v3/rbac.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 2 | optional | message envoy.extensions.filters.http.rbac.v3.RBAC | `rbac` |

### Router  (envoy/extensions/filters/http/router/v3/router.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message google.protobuf.BoolValue | `dynamic_stats` |
| 2 | optional | bool | `start_child_span` |
| 3 | repeated | message envoy.config.accesslog.v3.AccessLog | `upstream_log` |
| 9 | optional | message envoy.extensions.filters.http.router.v3.Router.UpstreamAccessLogOptions | `upstream_log_options` |
| 4 | optional | bool | `suppress_envoy_headers` |
| 5 | repeated | string | `strict_check_headers` |
| 6 | optional | bool | `respect_expected_rq_timeout` |
| 7 | optional | bool | `suppress_grpc_request_failure_code_stats` |
| 8 | repeated | message envoy.extensions.filters.network.http_connection_manager.v3.HttpFilter | `upstream_http_filters` |

### CookieBasedSessionState  (envoy/extensions/http/stateful_session/cookie/v3/cookie.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.type.http.v3.Cookie | `cookie` |

### TlsParameters  (envoy/extensions/transport_sockets/tls/v3/common.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | enum envoy.extensions.transport_sockets.tls.v3.TlsParameters.TlsProtocol | `tls_minimum_protocol_version` |
| 2 | optional | enum envoy.extensions.transport_sockets.tls.v3.TlsParameters.TlsProtocol | `tls_maximum_protocol_version` |
| 3 | repeated | string | `cipher_suites` |
| 4 | repeated | string | `ecdh_curves` |
| 5 | repeated | string | `signature_algorithms` |

### PrivateKeyProvider  (envoy/extensions/transport_sockets/tls/v3/common.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `provider_name` |
| 3 | optional | message google.protobuf.Any | `typed_config` |
| 4 | optional | bool | `fallback` |

### TlsCertificate  (envoy/extensions/transport_sockets/tls/v3/common.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.core.v3.DataSource | `certificate_chain` |
| 2 | optional | message envoy.config.core.v3.DataSource | `private_key` |
| 8 | optional | message envoy.config.core.v3.DataSource | `pkcs12` |
| 7 | optional | message envoy.config.core.v3.WatchedDirectory | `watched_directory` |
| 6 | optional | message envoy.extensions.transport_sockets.tls.v3.PrivateKeyProvider | `private_key_provider` |
| 3 | optional | message envoy.config.core.v3.DataSource | `password` |
| 4 | optional | message envoy.config.core.v3.DataSource | `ocsp_staple` |
| 5 | repeated | message envoy.config.core.v3.DataSource | `signed_certificate_timestamp` |

### TlsSessionTicketKeys  (envoy/extensions/transport_sockets/tls/v3/common.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message envoy.config.core.v3.DataSource | `keys` |

### CertificateProviderPluginInstance  (envoy/extensions/transport_sockets/tls/v3/common.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `instance_name` |
| 2 | optional | string | `certificate_name` |

### SubjectAltNameMatcher  (envoy/extensions/transport_sockets/tls/v3/common.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | enum envoy.extensions.transport_sockets.tls.v3.SubjectAltNameMatcher.SanType | `san_type` |
| 2 | optional | message envoy.type.matcher.v3.StringMatcher | `matcher` |

### CertificateValidationContext  (envoy/extensions/transport_sockets/tls/v3/common.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.core.v3.DataSource | `trusted_ca` |
| 13 | optional | message envoy.extensions.transport_sockets.tls.v3.CertificateProviderPluginInstance | `ca_certificate_provider_instance` |
| 11 | optional | message envoy.config.core.v3.WatchedDirectory | `watched_directory` |
| 3 | repeated | string | `verify_certificate_spki` |
| 2 | repeated | string | `verify_certificate_hash` |
| 15 | repeated | message envoy.extensions.transport_sockets.tls.v3.SubjectAltNameMatcher | `match_typed_subject_alt_names` |
| 9 | repeated | message envoy.type.matcher.v3.StringMatcher | `match_subject_alt_names` |
| 6 | optional | message google.protobuf.BoolValue | `require_signed_certificate_timestamp` |
| 7 | optional | message envoy.config.core.v3.DataSource | `crl` |
| 8 | optional | bool | `allow_expired_certificate` |
| 10 | optional | enum envoy.extensions.transport_sockets.tls.v3.CertificateValidationContext.TrustChainVerification | `trust_chain_verification` |
| 12 | optional | message envoy.config.core.v3.TypedExtensionConfig | `custom_validator_config` |
| 14 | optional | bool | `only_verify_leaf_cert_crl` |
| 16 | optional | message google.protobuf.UInt32Value | `max_verify_depth` |

### GenericSecret  (envoy/extensions/transport_sockets/tls/v3/secret.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.core.v3.DataSource | `secret` |

### SdsSecretConfig  (envoy/extensions/transport_sockets/tls/v3/secret.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 2 | optional | message envoy.config.core.v3.ConfigSource | `sds_config` |

### Secret  (envoy/extensions/transport_sockets/tls/v3/secret.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 2 | optional | message envoy.extensions.transport_sockets.tls.v3.TlsCertificate | `tls_certificate` |
| 3 | optional | message envoy.extensions.transport_sockets.tls.v3.TlsSessionTicketKeys | `session_ticket_keys` |
| 4 | optional | message envoy.extensions.transport_sockets.tls.v3.CertificateValidationContext | `validation_context` |
| 5 | optional | message envoy.extensions.transport_sockets.tls.v3.GenericSecret | `generic_secret` |

### UpstreamTlsContext  (envoy/extensions/transport_sockets/tls/v3/tls.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.extensions.transport_sockets.tls.v3.CommonTlsContext | `common_tls_context` |
| 2 | optional | string | `sni` |
| 3 | optional | bool | `allow_renegotiation` |
| 4 | optional | message google.protobuf.UInt32Value | `max_session_keys` |
| 5 | optional | message google.protobuf.BoolValue | `enforce_rsa_key_usage` |

### DownstreamTlsContext  (envoy/extensions/transport_sockets/tls/v3/tls.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.extensions.transport_sockets.tls.v3.CommonTlsContext | `common_tls_context` |
| 2 | optional | message google.protobuf.BoolValue | `require_client_certificate` |
| 3 | optional | message google.protobuf.BoolValue | `require_sni` |
| 4 | optional | message envoy.extensions.transport_sockets.tls.v3.TlsSessionTicketKeys | `session_ticket_keys` |
| 5 | optional | message envoy.extensions.transport_sockets.tls.v3.SdsSecretConfig | `session_ticket_keys_sds_secret_config` |
| 7 | optional | bool | `disable_stateless_session_resumption` |
| 10 | optional | bool | `disable_stateful_session_resumption` |
| 6 | optional | message google.protobuf.Duration | `session_timeout` |
| 8 | optional | enum envoy.extensions.transport_sockets.tls.v3.DownstreamTlsContext.OcspStaplePolicy | `ocsp_staple_policy` |
| 9 | optional | message google.protobuf.BoolValue | `full_scan_certs_on_sni_mismatch` |

### TlsKeyLog  (envoy/extensions/transport_sockets/tls/v3/tls.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `path` |
| 2 | repeated | message envoy.config.core.v3.CidrRange | `local_address_range` |
| 3 | repeated | message envoy.config.core.v3.CidrRange | `remote_address_range` |

### CommonTlsContext  (envoy/extensions/transport_sockets/tls/v3/tls.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.extensions.transport_sockets.tls.v3.TlsParameters | `tls_params` |
| 2 | repeated | message envoy.extensions.transport_sockets.tls.v3.TlsCertificate | `tls_certificates` |
| 6 | repeated | message envoy.extensions.transport_sockets.tls.v3.SdsSecretConfig | `tls_certificate_sds_secret_configs` |
| 14 | optional | message envoy.extensions.transport_sockets.tls.v3.CertificateProviderPluginInstance | `tls_certificate_provider_instance` |
| 9 | optional | message envoy.extensions.transport_sockets.tls.v3.CommonTlsContext.CertificateProvider | `tls_certificate_certificate_provider` |
| 11 | optional | message envoy.extensions.transport_sockets.tls.v3.CommonTlsContext.CertificateProviderInstance | `tls_certificate_certificate_provider_instance` |
| 3 | optional | message envoy.extensions.transport_sockets.tls.v3.CertificateValidationContext | `validation_context` |
| 7 | optional | message envoy.extensions.transport_sockets.tls.v3.SdsSecretConfig | `validation_context_sds_secret_config` |
| 8 | optional | message envoy.extensions.transport_sockets.tls.v3.CommonTlsContext.CombinedCertificateValidationContext | `combined_validation_context` |
| 10 | optional | message envoy.extensions.transport_sockets.tls.v3.CommonTlsContext.CertificateProvider | `validation_context_certificate_provider` |
| 12 | optional | message envoy.extensions.transport_sockets.tls.v3.CommonTlsContext.CertificateProviderInstance | `validation_context_certificate_provider_instance` |
| 4 | repeated | string | `alpn_protocols` |
| 13 | optional | message envoy.config.core.v3.TypedExtensionConfig | `custom_handshaker` |
| 15 | optional | message envoy.extensions.transport_sockets.tls.v3.TlsKeyLog | `key_log` |

### HttpProtocolOptions  (envoy/extensions/upstreams/http/v3/http_protocol_options.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.core.v3.HttpProtocolOptions | `common_http_protocol_options` |
| 2 | optional | message envoy.config.core.v3.UpstreamHttpProtocolOptions | `upstream_http_protocol_options` |
| 3 | optional | message envoy.extensions.upstreams.http.v3.HttpProtocolOptions.ExplicitHttpConfig | `explicit_http_config` |
| 4 | optional | message envoy.extensions.upstreams.http.v3.HttpProtocolOptions.UseDownstreamHttpConfig | `use_downstream_protocol_config` |
| 5 | optional | message envoy.extensions.upstreams.http.v3.HttpProtocolOptions.AutoHttpConfig | `auto_config` |
| 6 | repeated | message envoy.extensions.filters.network.http_connection_manager.v3.HttpFilter | `http_filters` |
| 7 | optional | message envoy.config.core.v3.TypedExtensionConfig | `header_validation_config` |

### ResourceLocator  (envoy/service/discovery/v3/discovery.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 2 | repeated | message envoy.service.discovery.v3.ResourceLocator.DynamicParametersEntry | `dynamic_parameters` |

### ResourceName  (envoy/service/discovery/v3/discovery.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 2 | optional | message envoy.service.discovery.v3.DynamicParameterConstraints | `dynamic_parameter_constraints` |

### DiscoveryRequest  (envoy/service/discovery/v3/discovery.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `version_info` |
| 2 | optional | message envoy.config.core.v3.Node | `node` |
| 3 | repeated | string | `resource_names` |
| 7 | repeated | message envoy.service.discovery.v3.ResourceLocator | `resource_locators` |
| 4 | optional | string | `type_url` |
| 5 | optional | string | `response_nonce` |
| 6 | optional | message google.rpc.Status | `error_detail` |

### DiscoveryResponse  (envoy/service/discovery/v3/discovery.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `version_info` |
| 2 | repeated | message google.protobuf.Any | `resources` |
| 3 | optional | bool | `canary` |
| 4 | optional | string | `type_url` |
| 5 | optional | string | `nonce` |
| 6 | optional | message envoy.config.core.v3.ControlPlane | `control_plane` |

### DeltaDiscoveryRequest  (envoy/service/discovery/v3/discovery.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.core.v3.Node | `node` |
| 2 | optional | string | `type_url` |
| 3 | repeated | string | `resource_names_subscribe` |
| 4 | repeated | string | `resource_names_unsubscribe` |
| 8 | repeated | message envoy.service.discovery.v3.ResourceLocator | `resource_locators_subscribe` |
| 9 | repeated | message envoy.service.discovery.v3.ResourceLocator | `resource_locators_unsubscribe` |
| 5 | repeated | message envoy.service.discovery.v3.DeltaDiscoveryRequest.InitialResourceVersionsEntry | `initial_resource_versions` |
| 6 | optional | string | `response_nonce` |
| 7 | optional | message google.rpc.Status | `error_detail` |

### DeltaDiscoveryResponse  (envoy/service/discovery/v3/discovery.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `system_version_info` |
| 2 | repeated | message envoy.service.discovery.v3.Resource | `resources` |
| 4 | optional | string | `type_url` |
| 6 | repeated | string | `removed_resources` |
| 8 | repeated | message envoy.service.discovery.v3.ResourceName | `removed_resource_names` |
| 5 | optional | string | `nonce` |
| 7 | optional | message envoy.config.core.v3.ControlPlane | `control_plane` |

### DynamicParameterConstraints  (envoy/service/discovery/v3/discovery.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.service.discovery.v3.DynamicParameterConstraints.SingleConstraint | `constraint` |
| 2 | optional | message envoy.service.discovery.v3.DynamicParameterConstraints.ConstraintList | `or_constraints` |
| 3 | optional | message envoy.service.discovery.v3.DynamicParameterConstraints.ConstraintList | `and_constraints` |
| 4 | optional | message envoy.service.discovery.v3.DynamicParameterConstraints | `not_constraints` |

### Resource  (envoy/service/discovery/v3/discovery.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 3 | optional | string | `name` |
| 8 | optional | message envoy.service.discovery.v3.ResourceName | `resource_name` |
| 4 | repeated | string | `aliases` |
| 1 | optional | string | `version` |
| 2 | optional | message google.protobuf.Any | `resource` |
| 6 | optional | message google.protobuf.Duration | `ttl` |
| 7 | optional | message envoy.service.discovery.v3.Resource.CacheControl | `cache_control` |
| 9 | optional | message envoy.config.core.v3.Metadata | `metadata` |

### LoadStatsRequest  (envoy/service/load_stats/v3/lrs.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.config.core.v3.Node | `node` |
| 2 | repeated | message envoy.config.endpoint.v3.ClusterStats | `cluster_stats` |

### LoadStatsResponse  (envoy/service/load_stats/v3/lrs.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | string | `clusters` |
| 4 | optional | bool | `send_all_clusters` |
| 2 | optional | message google.protobuf.Duration | `load_reporting_interval` |
| 3 | optional | bool | `report_endpoint_granularity` |

### Cookie  (envoy/type/http/v3/cookie.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 2 | optional | message google.protobuf.Duration | `ttl` |
| 3 | optional | string | `path` |

### PathTransformation  (envoy/type/http/v3/path_transformation.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message envoy.type.http.v3.PathTransformation.Operation | `operations` |

### FilterStateMatcher  (envoy/type/matcher/v3/filter_state.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `key` |
| 2 | optional | message envoy.type.matcher.v3.StringMatcher | `string_match` |

### MetadataMatcher  (envoy/type/matcher/v3/metadata.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `filter` |
| 2 | repeated | message envoy.type.matcher.v3.MetadataMatcher.PathSegment | `path` |
| 3 | optional | message envoy.type.matcher.v3.ValueMatcher | `value` |
| 4 | optional | bool | `invert` |

### DoubleMatcher  (envoy/type/matcher/v3/number.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.type.v3.DoubleRange | `range` |
| 2 | optional | double | `exact` |

### PathMatcher  (envoy/type/matcher/v3/path.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.type.matcher.v3.StringMatcher | `path` |

### RegexMatcher  (envoy/type/matcher/v3/regex.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.type.matcher.v3.RegexMatcher.GoogleRE2 | `google_re2` |
| 2 | optional | string | `regex` |

### RegexMatchAndSubstitute  (envoy/type/matcher/v3/regex.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.type.matcher.v3.RegexMatcher | `pattern` |
| 2 | optional | string | `substitution` |

### StringMatcher  (envoy/type/matcher/v3/string.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `exact` |
| 2 | optional | string | `prefix` |
| 3 | optional | string | `suffix` |
| 5 | optional | message envoy.type.matcher.v3.RegexMatcher | `safe_regex` |
| 7 | optional | string | `contains` |
| 6 | optional | bool | `ignore_case` |

### ListStringMatcher  (envoy/type/matcher/v3/string.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message envoy.type.matcher.v3.StringMatcher | `patterns` |

### ValueMatcher  (envoy/type/matcher/v3/value.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.type.matcher.v3.ValueMatcher.NullMatch | `null_match` |
| 2 | optional | message envoy.type.matcher.v3.DoubleMatcher | `double_match` |
| 3 | optional | message envoy.type.matcher.v3.StringMatcher | `string_match` |
| 4 | optional | bool | `bool_match` |
| 5 | optional | bool | `present_match` |
| 6 | optional | message envoy.type.matcher.v3.ListMatcher | `list_match` |
| 7 | optional | message envoy.type.matcher.v3.OrMatcher | `or_match` |

### ListMatcher  (envoy/type/matcher/v3/value.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.type.matcher.v3.ValueMatcher | `one_of` |

### OrMatcher  (envoy/type/matcher/v3/value.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message envoy.type.matcher.v3.ValueMatcher | `value_matchers` |

### MetadataKey  (envoy/type/metadata/v3/metadata.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `key` |
| 2 | repeated | message envoy.type.metadata.v3.MetadataKey.PathSegment | `path` |

### MetadataKind  (envoy/type/metadata/v3/metadata.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message envoy.type.metadata.v3.MetadataKind.Request | `request` |
| 2 | optional | message envoy.type.metadata.v3.MetadataKind.Route | `route` |
| 3 | optional | message envoy.type.metadata.v3.MetadataKind.Cluster | `cluster` |
| 4 | optional | message envoy.type.metadata.v3.MetadataKind.Host | `host` |

### CustomTag  (envoy/type/tracing/v3/custom_tag.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `tag` |
| 2 | optional | message envoy.type.tracing.v3.CustomTag.Literal | `literal` |
| 3 | optional | message envoy.type.tracing.v3.CustomTag.Environment | `environment` |
| 4 | optional | message envoy.type.tracing.v3.CustomTag.Header | `request_header` |
| 5 | optional | message envoy.type.tracing.v3.CustomTag.Metadata | `metadata` |

### Percent  (envoy/type/v3/percent.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | double | `value` |

### FractionalPercent  (envoy/type/v3/percent.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | uint32 | `numerator` |
| 2 | optional | enum envoy.type.v3.FractionalPercent.DenominatorType | `denominator` |

### Int64Range  (envoy/type/v3/range.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int64 | `start` |
| 2 | optional | int64 | `end` |

### Int32Range  (envoy/type/v3/range.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `start` |
| 2 | optional | int32 | `end` |

### DoubleRange  (envoy/type/v3/range.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | double | `start` |
| 2 | optional | double | `end` |

### SemanticVersion  (envoy/type/v3/semantic_version.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | uint32 | `major_number` |
| 2 | optional | uint32 | `minor_number` |
| 3 | optional | uint32 | `patch` |

### CubemapProjectionDesc  (extraMediaData.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `projectType` |
| 2 | optional | int32 | `panoWidth` |
| 3 | optional | int32 | `cubeWidthExtend` |
| 4 | optional | int32 | `width` |

### WideAngleParam  (extraMediaData.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | double | `fov` |

### ExtraMediaDataProto  (extraMediaData.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message bmg.CubemapProjectionDesc | `projectionDesc` |
| 2 | optional | message bmg.WideAngleParam | `wideAngleParam` |
| 3 | optional | bool | `isCompressed` |
| 4 | repeated | message bmg.ExtraMediaDataProto.AdditionalDataEntry | `additionalData` |
| 5 | optional | enum bmg.VideoType | `videoType` |

### ExtraMetadata  (extra_info.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `serial_number` |
| 2 | optional | string | `camera_type` |
| 3 | optional | string | `fw_version` |
| 4 | optional | string | `file_type` |
| 5 | optional | string | `offset` |
| 6 | optional | string | `ip` |
| 7 | optional | uint64 | `creation_time` |
| 8 | optional | uint64 | `export_time` |
| 9 | optional | uint64 | `file_size` |
| 10 | optional | uint32 | `total_time` |
| 11 | optional | bytes | `gps` |
| 12 | optional | bytes | `orientation` |
| 13 | optional | message insta360.messages.ExtraMetadata.ExtraUserOptions | `user_options` |
| 14 | optional | bytes | `gyro` |
| 15 | optional | enum insta360.messages.ExtraMetadata.HDR_STATE | `hdr_state` |
| 16 | optional | string | `hdr_identifier` |
| 17 | optional | string | `original_offset` |
| 18 | optional | enum insta360.messages.ExtraMetadata.TriggerSource | `trigger_source` |
| 19 | optional | message insta360.messages.ExtraMetadata.Vector2 | `dimension` |
| 20 | optional | int32 | `frame_rate` |
| 21 | optional | message insta360.messages.ExtraMetadata.Vector2 | `image_translate` |
| 22 | optional | string | `gamma_mode` |
| 23 | optional | message insta360.messages.ExtraMetadata.GyroIndex | `thumbnail_gyro_index` |
| 24 | optional | int64 | `first_frame_timestamp` |
| 25 | optional | double | `rolling_shutter_time` |
| 26 | optional | message insta360.messages.ExtraMetadata.FileGroupInfo | `file_group_info` |
| 27 | optional | message insta360.messages.WindowCropInfo | `window_crop_info` |
| 28 | optional | double | `gyro_timestamp` |
| 29 | optional | bool | `is_has_gyro_timestamp` |
| 30 | optional | uint32 | `timelapse_interval` |
| 31 | optional | bytes | `gyro_calib` |
| 32 | optional | enum insta360.messages.ExtraMetadata.EvoStatusMode | `evo_status_mode` |
| 33 | optional | string | `evo_status_id` |
| 34 | optional | string | `original_offset_3d` |
| 35 | repeated | enum insta360.messages.ExtraMetadata.GpsSource | `gps_sources` |
| 36 | optional | int64 | `first_gps_timestamp` |
| 37 | optional | bytes | `orientation_calib` |
| 38 | optional | bool | `is_collected` |
| 39 | optional | uint64 | `recycle_time` |
| 40 | optional | uint32 | `total_frames` |
| 41 | optional | bool | `is_selfie` |
| 42 | optional | bool | `is_flowstate_online` |
| 43 | optional | bool | `is_dewarp` |
| 44 | optional | message insta360.messages.ExtraMetadata.Vector2 | `resolution_size` |
| 45 | optional | enum insta360.messages.ExtraMetadata.Battery_type | `battery_type` |
| 46 | optional | enum insta360.messages.ExtraMetadata.Camera_Posture | `cam_posture` |
| 47 | optional | enum insta360.messages.ExtraMetadata.Image_FovType | `fov_type` |
| 48 | optional | double | `distance` |
| 49 | optional | double | `fov` |
| 50 | optional | enum insta360.messages.ExtraMetadata.Gyro_FilterType | `gyro_filter_type` |
| 51 | optional | enum insta360.messages.ExtraMetadata.GyroType | `gyro_type` |
| 52 | optional | enum insta360.messages.ExtraMetadata.VideoMediaDataRotateAngle | `media_data_rotate_angel` |
| 53 | optional | string | `offset_v2` |
| 54 | optional | string | `offset_v3` |
| 55 | optional | string | `original_offset_v2` |
| 56 | optional | string | `original_offset_v3` |
| 57 | optional | enum insta360.messages.ExtraMetadata.SensorDevice | `focusSensor` |
| 58 | optional | enum insta360.messages.ExtraMetadata.ExpectOutputType | `expectOutputType` |
| 59 | optional | bool | `timelapse_interval_in_millisecond` |
| 60 | repeated | float | `photo_rot` |
| 61 | optional | enum insta360.messages.ExtraMetadata.AudioModeType | `audio_mode` |
| 62 | optional | bool | `is_raw_gyro` |
| 63 | optional | enum insta360.messages.ExtraMetadata.RawCaptureType | `raw_capture_type` |
| 64 | optional | enum insta360.messages.ExtraMetadata.VideoPtsType | `pts_type` |
| 65 | optional | message insta360.messages.ExtraMetadata.GyroConfigInfo | `gyro_cfg_info` |
| 66 | optional | enum insta360.messages.ExtraMetadata.Lens283MType | `lens_283M_type1` |
| 67 | optional | enum insta360.messages.ExtraMetadata.Lens283MType | `lens_283M_type2` |
| 68 | optional | enum insta360.messages.OffsetState | `offset_states` |
| 69 | repeated | float | `q_i_uav` |
| 70 | repeated | float | `r_uav_i` |
| 71 | optional | message insta360.messages.ExtraMetadata.AutoClipParam | `auto_clip_para` |
| 72 | optional | message insta360.messages.ExtraMetadata.MetaTrackParam | `meta_track_para` |
| 73 | optional | enum insta360.messages.ExtraMetadata.TimeScale | `time_scale` |
| 74 | optional | enum insta360.messages.ExtraMetadata.HdrProcessType | `hdr_process_type` |
| 75 | optional | enum insta360.messages.ExtraMetadata.ThumbnailType | `thumbnail_type` |
| 76 | optional | enum insta360.messages.ExtraMetadata.PureShotProcessType | `pureshot_process_type` |
| 77 | optional | bool | `pre_rec_time_flag` |
| 78 | optional | message insta360.messages.ExtraMetadata.FrameRateAVRational | `frame_rate_av_rational` |
| 79 | optional | enum insta360.messages.ExtraMetadata.PanoRecordType | `pano_record_type` |
| 80 | optional | enum insta360.messages.ExtraMetadata.PanoRecordMultiTrackOrder | `pano_record_multi_track_order` |
| 81 | optional | enum insta360.messages.ExtraMetadata.ThumbnailStitchType | `thumbnail_stitch_type` |
| 82 | optional | enum insta360.messages.ExtraMetadata.ImageStitchType | `image_stitch_type` |
| 83 | optional | enum insta360.messages.ExtraMetadata.SceneType | `scene_type` |
| 84 | optional | bool | `Is_Cutting_Thumbnail` |
| 85 | optional | enum insta360.messages.ExtraMetadata.ReprocessingType | `reprocessing_type` |
| 86 | optional | enum insta360.messages.ExtraMetadata.OnlineFlowstateLevel | `online_flowstate_level` |
| 87 | optional | bool | `bHighLightEidted` |
| 88 | optional | enum insta360.messages.ExtraMetadata.FileSplitType | `file_split_type` |
| 89 | optional | bool | `bFavorite` |
| 90 | optional | uint32 | `edit_version` |
| 91 | repeated | double | `q_i_wnew` |
| 92 | optional | bool | `bInsideEditorExport` |
| 93 | optional | uint32 | `total_time_ms` |
| 94 | optional | bool | `bContinueRecord` |
| 95 | optional | bool | `bPausedRecord` |
| 96 | optional | bool | `bTorchmode` |
| 97 | optional | enum insta360.messages.ExtraMetadata.HdrModeType | `hdr_mode_type` |
| 98 | repeated | message insta360.messages.ExtraMetadata.ContinueRecordInfo | `continue_record_info` |
| 99 | optional | bool | `bDropFrameOccur` |
| 100 | optional | uint32 | `photoGroupNum` |
| 101 | optional | bool | `recovery` |
| 102 | optional | bool | `has_pb_resolution` |
| 103 | optional | message insta360.messages.ExtraMetadata.Vector2 | `pb_resolution_size` |
| 104 | optional | enum insta360.messages.ExtraMetadata.GuardDetectedType | `guard_detected_type` |
| 105 | optional | enum insta360.messages.ExtraMetadata.CoolingShellSelectedState | `cooling_shell_selected_state` |
| 106 | optional | enum insta360.messages.ExtraMetadata.CoolingShellAlgoDetectedState | `cooling_shell_algo_state` |
| 107 | optional | enum insta360.messages.ExtraMetadata.AISwitchState | `ai_switch_state` |
| 108 | optional | string | `pureshot_image_debug` |
| 109 | optional | message insta360.messages.ExtraMetadata.Material3AInfo | `material_3a_info` |
| 110 | optional | enum insta360.messages.ExtraMetadata.ResolutiuonType | `resolution_type` |
| 111 | optional | string | `offset_v6` |
| 112 | optional | string | `original_offset_v6` |
| 113 | optional | uint32 | `interval_photo_interval_time` |
| 114 | optional | uint32 | `flowstate_level` |
| 115 | optional | message insta360.messages.ExtraMetadata.FolderInfo | `folder_info` |
| 116 | optional | bool | `horizon_enable` |
| 117 | optional | int32 | `time_zone_seconds_from_GMT` |
| 118 | optional | enum insta360.messages.ExtraMetadata.UnderWaterModeType | `underwater_mode_type` |
| 119 | optional | enum insta360.messages.ExtraMetadata.WaterMarkType | `water_mark_type` |
| 120 | optional | uint32 | `audio_track_num` |
| 121 | repeated | message insta360.messages.ExtraMetadata.AudioTrackInfo | `audio_track_info` |
| 122 | optional | enum insta360.messages.ExtraMetadata.CloudVideoType | `cloud_video_type` |
| 123 | optional | enum insta360.messages.ExtraMetadata.ExtremeLowPowerModeType | `extreme_lowpower_mode_type` |
| 124 | optional | enum insta360.messages.ExtraMetadata.LowLightStabilizationModeType | `lowlight_stabilization_mode_type` |
| 125 | optional | bytes | `cloud_video_info` |
| 126 | optional | enum insta360.messages.ExtraMetadata.LensModuleType | `lens_module_type` |
| 127 | optional | int32 | `file_duration_tailor_time` |
| 128 | optional | int32 | `blend_Angle` |
| 129 | optional | enum insta360.messages.ExtraMetadata.FileCategory | `file_category` |
| 130 | optional | enum insta360.messages.ExtraMetadata.FileRotate | `file_rotate` |
| 131 | optional | enum insta360.messages.ExtraMetadata.StreamType | `stream_type` |
| 132 | optional | enum insta360.messages.ExtraMetadata.CodecType | `codec_type` |
| 133 | optional | uint64 | `timelapse_interval_ms` |
| 134 | optional | bool | `is_pre_record` |
| 135 | optional | uint64 | `file_expect_bitrate` |
| 136 | optional | enum insta360.messages.ExtraMetadata.OffsetVersion | `capture_offset_version` |
| 148 | optional | message insta360.messages.ExtraMetadata.Vector2 | `expected_pano_ratio` |
| 149 | optional | enum insta360.messages.ExtraMetadata.MCTFProcessType | `mctf_process_type` |
| 150 | optional | enum insta360.messages.ExtraMetadata.TimelapsStorageType | `timelaps_storage_type` |
| 151 | optional | enum insta360.messages.ExtraMetadata.DirectionLockType | `direction_lock_type` |
| 152 | optional | enum insta360.messages.ExtraMetadata.DeWarpType | `dewarp_type` |
| 153 | optional | enum insta360.messages.ExtraMetadata.UavCameraMode | `uav_camera_mode` |
| 154 | optional | uint32 | `trim_start` |
| 155 | optional | uint32 | `trim_end` |
| 156 | optional | enum insta360.messages.ExtraMetadata.RemovePurpleFringing | `remove_purple_fringing` |
| 157 | optional | enum insta360.messages.ExtraMetadata.CaptureRecommendStitchType | `capture_recommend_stitch_type` |
| 158 | optional | message insta360.messages.ExtraMetadata.IntervaRecTakeoverInfo | `takeover_info` |
| 159 | optional | enum insta360.messages.ExtraMetadata.PrsestType | `preset_type` |
| 160 | optional | message insta360.messages.ExtraMetadata.FileSceneInfo | `file_scene_info` |
| 161 | optional | enum insta360.messages.ExtraMetadata.EvMapLevel | `evmap_level` |
| 162 | optional | uint32 | `ae_state` |
| 163 | optional | enum insta360.messages.ExtraMetadata.SharpenState | `sharpen_state` |
| 164 | optional | enum insta360.messages.ExtraMetadata.AeFlickerType | `aeflicker_type` |
| 165 | optional | uint32 | `uav_pos_data_version` |
| 166 | optional | message insta360.messages.ExtraMetadata.MagCalib | `mag_calib_dongle` |
| 167 | optional | message insta360.messages.ExtraMetadata.MagCalib | `mag_calib_tm` |
| 168 | optional | message insta360.messages.ExtraMetadata.MagQI | `q_i_mag_dongle` |
| 169 | optional | message insta360.messages.ExtraMetadata.MagQI | `q_i_mag_tm` |
| 170 | optional | message insta360.messages.ExtraMetadata.MagQI | `q_b_tm` |
| 171 | optional | uint32 | `uav_datatype_version` |
| 172 | optional | uint32 | `pre_rec_frano_sec` |
| 173 | optional | bool | `bPlaybackCache` |
| 174 | optional | bool | `is_horizontal_state` |
| 175 | optional | enum insta360.messages.ExtraMetadata.PropellerGuardStatusType | `propeller_guard_status` |
| 176 | optional | bool | `is_af_lens` |
| 177 | optional | message insta360.messages.AFLensInfo | `af_lens_info` |
| 178 | optional | message insta360.messages.ExtraMetadata.CameraCalibAdditionalInfo | `camera_calib_additional_info` |
| 179 | optional | enum insta360.messages.ExtraMetadata.HighLightSource | `high_light_source` |
| 180 | optional | bool | `is_capture_beauty_mode_on` |
| 181 | optional | message insta360.messages.CaptureBeautyParams | `beauty_info` |
| 182 | optional | enum insta360.messages.ExtraMetadata.ColorCorrectionType | `color_correction` |
| 183 | optional | message insta360.messages.ExtraMetadata.CaptureImageQualityInfo | `capture_image_quality_info` |
| 184 | optional | bool | `is_capture_beauty_support` |
| 185 | optional | int64 | `record_start_timestamp_ms` |
| 186 | optional | enum insta360.messages.ExtraMetadata.LensAccessoryType | `lens_accessory_type` |
| 187 | optional | string | `lens_accessory_offset` |
| 188 | optional | enum insta360.messages.ExtraMetadata.Camera_Screen_Orientation | `screen_orientation` |
| 189 | optional | enum insta360.messages.ExtraMetadata.CaptureFilpType | `filp_type` |
| 190 | optional | enum insta360.messages.ExtraMetadata.ShootingAccessoriesType | `shooting_accessories` |
| 191 | optional | enum insta360.messages.ExtraMetadata.StreetPhotoHorizCorrection | `street_photo_horizon_correction` |
| 192 | optional | message insta360.messages.ExtraMetadata.CameraOffsetCalib | `offset_calib` |
| 193 | optional | bool | `P3_fake_on` |
| 194 | optional | enum insta360.messages.ExtraMetadata.WaterMarkStyle | `watermark_style` |
| 195 | optional | message insta360.messages.ExtraMetadata.FrameRateAVRational | `origin_framerate` |
| 196 | optional | message insta360.messages.ExtraMetadata.FrameRateAVRational | `final_framerate` |
| 197 | optional | string | `offset_v8` |
| 198 | optional | uint64 | `first_tracking_frame_number` |
| 199 | optional | enum insta360.messages.ExtraMetadata.RepairedType | `repaired_type` |
| 200 | optional | string | `aperture_value` |
| 201 | optional | string | `extern_filter` |
| 202 | optional | bool | `is_3a_description_supported` |
| 203 | optional | enum insta360.messages.ExtraMetadata.VideoBitDepth | `main_video_bitdepth` |
| 204 | optional | enum insta360.messages.ExtraMetadata.VideoBitDepth | `optional_video_bitdepth` |
| 205 | optional | enum insta360.messages.ExtraMetadata.VideoColorSpace | `video_color_space` |
| 206 | repeated | message insta360.messages.OffsetInfo | `offset_info` |
| 207 | optional | float | `sensor_module_temper` |
| 208 | optional | bool | `is_ultra_hdr_on` |
| 209 | repeated | message insta360.messages.ExtraMetadata.BigboomTracks | `views` |
| 210 | repeated | float | `photo_still_rot` |
| 211 | optional | message insta360.messages.ExtraMetadata.AIGCInfo | `aigc_info` |
| 212 | optional | message insta360.messages.ExtraMetadata.ShootingParamInfo | `shooting_param_info` |
| 213 | optional | message insta360.messages.ExtraMetadata.ThumbnailHeroRotQuatData | `thumbnail_hero_rot_quat` |
| 214 | optional | float | `fac_calib_temper` |
| 215 | optional | bool | `is_vfr_record` |
| 216 | optional | enum insta360.messages.ExtraMetadata.UavControlType | `uav_control_type` |
| 217 | optional | enum insta360.messages.ExtraMetadata.UavDisplayType | `uav_display_type` |
| 218 | optional | enum insta360.messages.ExtraMetadata.AvSynthStatus | `av_synth_status` |
| 219 | optional | string | `simulation_path` |
| 220 | optional | enum insta360.messages.ExtraMetadata.AudioConcertSceneType | `audio_concert_scene` |
| 221 | optional | enum insta360.messages.ExtraMetadata.ThumbnailType | `small_thumbnail_type` |

### FileExtraMetadataResp  (extra_info.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | string | `uri` |
| 2 | repeated | message insta360.messages.ExtraMetadata | `mediaData` |
| 3 | optional | uint32 | `total_count` |
| 4 | optional | uint32 | `start` |
| 5 | optional | uint32 | `end` |
| 6 | repeated | message insta360.messages.FavoriteInfo | `favorite_info` |
| 7 | repeated | uint32 | `map_index_list` |

### ExtraRecipe  (extra_recipe.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `beauty_auto_enable` |
| 2 | optional | int32 | `beauty_skin_level` |
| 3 | optional | uint32 | `beauty_retouch_level` |
| 4 | optional | sint32 | `ev_bias_x10` |
| 5 | optional | uint32 | `iso_mode` |
| 6 | optional | uint32 | `iso_value` |
| 7 | optional | uint32 | `shutter_mode` |
| 8 | optional | sint32 | `shutter_value` |
| 9 | optional | uint32 | `awb_mode` |
| 10 | optional | uint32 | `wb_temp` |
| 11 | optional | uint32 | `wb_bias` |
| 12 | optional | uint32 | `contrast` |
| 13 | optional | uint32 | `saturation` |
| 14 | optional | uint32 | `noise` |
| 15 | optional | uint32 | `blue` |
| 16 | optional | uint32 | `sharpness` |
| 17 | optional | uint32 | `af_mode` |
| 18 | optional | uint32 | `af_speed` |
| 19 | optional | uint32 | `af_sensitivity` |
| 20 | optional | uint32 | `lut_type` |
| 21 | optional | uint32 | `lut_level` |
| 22 | optional | uint32 | `meter_mode` |
| 23 | optional | uint32 | `fovc_flag` |
| 24 | optional | uint32 | `color_mode` |
| 25 | optional | uint32 | `auto_switch_3a` |
| 127 | optional | uint32 | `recipe_schema_version` |

### Pb_KeyFrameData  (fpv_keyframe.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `frame_index` |
| 2 | optional | double | `timestamp` |
| 3 | optional | double | `yaw` |
| 4 | optional | double | `pitch` |
| 5 | optional | double | `roll` |

### Pb_KeyFrameResults  (fpv_keyframe.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message Pb_KeyFrameData | `keyframe_datas` |
| 2 | optional | double | `score` |
| 3 | optional | int32 | `iter` |

### Pb_RepeatedKeyFrameResults  (fpv_keyframe.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message Pb_KeyFrameResults | `results` |

### CheckedExpr  (google/api/expr/v1alpha1/checked.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 2 | repeated | message google.api.expr.v1alpha1.CheckedExpr.ReferenceMapEntry | `reference_map` |
| 3 | repeated | message google.api.expr.v1alpha1.CheckedExpr.TypeMapEntry | `type_map` |
| 5 | optional | message google.api.expr.v1alpha1.SourceInfo | `source_info` |
| 4 | optional | message google.api.expr.v1alpha1.Expr | `expr` |

### Type  (google/api/expr/v1alpha1/checked.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message google.protobuf.Empty | `dyn` |
| 2 | optional | enum google.protobuf.NullValue | `null` |
| 3 | optional | enum google.api.expr.v1alpha1.Type.PrimitiveType | `primitive` |
| 4 | optional | enum google.api.expr.v1alpha1.Type.PrimitiveType | `wrapper` |
| 5 | optional | enum google.api.expr.v1alpha1.Type.WellKnownType | `well_known` |
| 6 | optional | message google.api.expr.v1alpha1.Type.ListType | `list_type` |
| 7 | optional | message google.api.expr.v1alpha1.Type.MapType | `map_type` |
| 8 | optional | message google.api.expr.v1alpha1.Type.FunctionType | `function` |
| 9 | optional | string | `message_type` |
| 10 | optional | string | `type_param` |
| 11 | optional | message google.api.expr.v1alpha1.Type | `type` |
| 12 | optional | message google.protobuf.Empty | `error` |
| 14 | optional | message google.api.expr.v1alpha1.Type.AbstractType | `abstract_type` |

### Decl  (google/api/expr/v1alpha1/checked.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 2 | optional | message google.api.expr.v1alpha1.Decl.IdentDecl | `ident` |
| 3 | optional | message google.api.expr.v1alpha1.Decl.FunctionDecl | `function` |

### Reference  (google/api/expr/v1alpha1/checked.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 3 | repeated | string | `overload_id` |
| 4 | optional | message google.api.expr.v1alpha1.Constant | `value` |

### ParsedExpr  (google/api/expr/v1alpha1/syntax.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 2 | optional | message google.api.expr.v1alpha1.Expr | `expr` |
| 3 | optional | message google.api.expr.v1alpha1.SourceInfo | `source_info` |

### Expr  (google/api/expr/v1alpha1/syntax.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 2 | optional | int64 | `id` |
| 3 | optional | message google.api.expr.v1alpha1.Constant | `const_expr` |
| 4 | optional | message google.api.expr.v1alpha1.Expr.Ident | `ident_expr` |
| 5 | optional | message google.api.expr.v1alpha1.Expr.Select | `select_expr` |
| 6 | optional | message google.api.expr.v1alpha1.Expr.Call | `call_expr` |
| 7 | optional | message google.api.expr.v1alpha1.Expr.CreateList | `list_expr` |
| 8 | optional | message google.api.expr.v1alpha1.Expr.CreateStruct | `struct_expr` |
| 9 | optional | message google.api.expr.v1alpha1.Expr.Comprehension | `comprehension_expr` |

### Constant  (google/api/expr/v1alpha1/syntax.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | enum google.protobuf.NullValue | `null_value` |
| 2 | optional | bool | `bool_value` |
| 3 | optional | int64 | `int64_value` |
| 4 | optional | uint64 | `uint64_value` |
| 5 | optional | double | `double_value` |
| 6 | optional | string | `string_value` |
| 7 | optional | bytes | `bytes_value` |
| 8 | optional | message google.protobuf.Duration | `duration_value` |
| 9 | optional | message google.protobuf.Timestamp | `timestamp_value` |

### SourceInfo  (google/api/expr/v1alpha1/syntax.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `syntax_version` |
| 2 | optional | string | `location` |
| 3 | repeated | int32 | `line_offsets` |
| 4 | repeated | message google.api.expr.v1alpha1.SourceInfo.PositionsEntry | `positions` |
| 5 | repeated | message google.api.expr.v1alpha1.SourceInfo.MacroCallsEntry | `macro_calls` |

### SourcePosition  (google/api/expr/v1alpha1/syntax.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `location` |
| 2 | optional | int32 | `offset` |
| 3 | optional | int32 | `line` |
| 4 | optional | int32 | `column` |

### Any  (google/protobuf/any.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `type_url` |
| 2 | optional | bytes | `value` |

### FileDescriptorSet  (google/protobuf/descriptor.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message google.protobuf.FileDescriptorProto | `file` |

### FileDescriptorProto  (google/protobuf/descriptor.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 2 | optional | string | `package` |
| 3 | repeated | string | `dependency` |
| 10 | repeated | int32 | `public_dependency` |
| 11 | repeated | int32 | `weak_dependency` |
| 4 | repeated | message google.protobuf.DescriptorProto | `message_type` |
| 5 | repeated | message google.protobuf.EnumDescriptorProto | `enum_type` |
| 6 | repeated | message google.protobuf.ServiceDescriptorProto | `service` |
| 7 | repeated | message google.protobuf.FieldDescriptorProto | `extension` |
| 8 | optional | message google.protobuf.FileOptions | `options` |
| 9 | optional | message google.protobuf.SourceCodeInfo | `source_code_info` |
| 12 | optional | string | `syntax` |
| 14 | optional | enum google.protobuf.Edition | `edition` |

### DescriptorProto  (google/protobuf/descriptor.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 2 | repeated | message google.protobuf.FieldDescriptorProto | `field` |
| 6 | repeated | message google.protobuf.FieldDescriptorProto | `extension` |
| 3 | repeated | message google.protobuf.DescriptorProto | `nested_type` |
| 4 | repeated | message google.protobuf.EnumDescriptorProto | `enum_type` |
| 5 | repeated | message google.protobuf.DescriptorProto.ExtensionRange | `extension_range` |
| 8 | repeated | message google.protobuf.OneofDescriptorProto | `oneof_decl` |
| 7 | optional | message google.protobuf.MessageOptions | `options` |
| 9 | repeated | message google.protobuf.DescriptorProto.ReservedRange | `reserved_range` |
| 10 | repeated | string | `reserved_name` |

### ExtensionRangeOptions  (google/protobuf/descriptor.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 999 | repeated | message google.protobuf.UninterpretedOption | `uninterpreted_option` |
| 2 | repeated | message google.protobuf.ExtensionRangeOptions.Declaration | `declaration` |
| 50 | optional | message google.protobuf.FeatureSet | `features` |
| 3 | optional | enum google.protobuf.ExtensionRangeOptions.VerificationState | `verification` |

### FieldDescriptorProto  (google/protobuf/descriptor.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 3 | optional | int32 | `number` |
| 4 | optional | enum google.protobuf.FieldDescriptorProto.Label | `label` |
| 5 | optional | enum google.protobuf.FieldDescriptorProto.Type | `type` |
| 6 | optional | string | `type_name` |
| 2 | optional | string | `extendee` |
| 7 | optional | string | `default_value` |
| 9 | optional | int32 | `oneof_index` |
| 10 | optional | string | `json_name` |
| 8 | optional | message google.protobuf.FieldOptions | `options` |
| 17 | optional | bool | `proto3_optional` |

### OneofDescriptorProto  (google/protobuf/descriptor.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 2 | optional | message google.protobuf.OneofOptions | `options` |

### EnumDescriptorProto  (google/protobuf/descriptor.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 2 | repeated | message google.protobuf.EnumValueDescriptorProto | `value` |
| 3 | optional | message google.protobuf.EnumOptions | `options` |
| 4 | repeated | message google.protobuf.EnumDescriptorProto.EnumReservedRange | `reserved_range` |
| 5 | repeated | string | `reserved_name` |

### EnumValueDescriptorProto  (google/protobuf/descriptor.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 2 | optional | int32 | `number` |
| 3 | optional | message google.protobuf.EnumValueOptions | `options` |

### ServiceDescriptorProto  (google/protobuf/descriptor.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 2 | repeated | message google.protobuf.MethodDescriptorProto | `method` |
| 3 | optional | message google.protobuf.ServiceOptions | `options` |

### MethodDescriptorProto  (google/protobuf/descriptor.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 2 | optional | string | `input_type` |
| 3 | optional | string | `output_type` |
| 4 | optional | message google.protobuf.MethodOptions | `options` |
| 5 | optional | bool | `client_streaming` |
| 6 | optional | bool | `server_streaming` |

### FileOptions  (google/protobuf/descriptor.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `java_package` |
| 8 | optional | string | `java_outer_classname` |
| 10 | optional | bool | `java_multiple_files` |
| 20 | optional | bool | `java_generate_equals_and_hash` |
| 27 | optional | bool | `java_string_check_utf8` |
| 9 | optional | enum google.protobuf.FileOptions.OptimizeMode | `optimize_for` |
| 11 | optional | string | `go_package` |
| 16 | optional | bool | `cc_generic_services` |
| 17 | optional | bool | `java_generic_services` |
| 18 | optional | bool | `py_generic_services` |
| 42 | optional | bool | `php_generic_services` |
| 23 | optional | bool | `deprecated` |
| 31 | optional | bool | `cc_enable_arenas` |
| 36 | optional | string | `objc_class_prefix` |
| 37 | optional | string | `csharp_namespace` |
| 39 | optional | string | `swift_prefix` |
| 40 | optional | string | `php_class_prefix` |
| 41 | optional | string | `php_namespace` |
| 44 | optional | string | `php_metadata_namespace` |
| 45 | optional | string | `ruby_package` |
| 50 | optional | message google.protobuf.FeatureSet | `features` |
| 999 | repeated | message google.protobuf.UninterpretedOption | `uninterpreted_option` |

### MessageOptions  (google/protobuf/descriptor.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `message_set_wire_format` |
| 2 | optional | bool | `no_standard_descriptor_accessor` |
| 3 | optional | bool | `deprecated` |
| 7 | optional | bool | `map_entry` |
| 11 | optional | bool | `deprecated_legacy_json_field_conflicts` |
| 12 | optional | message google.protobuf.FeatureSet | `features` |
| 999 | repeated | message google.protobuf.UninterpretedOption | `uninterpreted_option` |

### FieldOptions  (google/protobuf/descriptor.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | enum google.protobuf.FieldOptions.CType | `ctype` |
| 2 | optional | bool | `packed` |
| 6 | optional | enum google.protobuf.FieldOptions.JSType | `jstype` |
| 5 | optional | bool | `lazy` |
| 15 | optional | bool | `unverified_lazy` |
| 3 | optional | bool | `deprecated` |
| 10 | optional | bool | `weak` |
| 16 | optional | bool | `debug_redact` |
| 17 | optional | enum google.protobuf.FieldOptions.OptionRetention | `retention` |
| 19 | repeated | enum google.protobuf.FieldOptions.OptionTargetType | `targets` |
| 20 | repeated | message google.protobuf.FieldOptions.EditionDefault | `edition_defaults` |
| 21 | optional | message google.protobuf.FeatureSet | `features` |
| 999 | repeated | message google.protobuf.UninterpretedOption | `uninterpreted_option` |

### OneofOptions  (google/protobuf/descriptor.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message google.protobuf.FeatureSet | `features` |
| 999 | repeated | message google.protobuf.UninterpretedOption | `uninterpreted_option` |

### EnumOptions  (google/protobuf/descriptor.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 2 | optional | bool | `allow_alias` |
| 3 | optional | bool | `deprecated` |
| 6 | optional | bool | `deprecated_legacy_json_field_conflicts` |
| 7 | optional | message google.protobuf.FeatureSet | `features` |
| 999 | repeated | message google.protobuf.UninterpretedOption | `uninterpreted_option` |

### EnumValueOptions  (google/protobuf/descriptor.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `deprecated` |
| 2 | optional | message google.protobuf.FeatureSet | `features` |
| 3 | optional | bool | `debug_redact` |
| 999 | repeated | message google.protobuf.UninterpretedOption | `uninterpreted_option` |

### ServiceOptions  (google/protobuf/descriptor.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 34 | optional | message google.protobuf.FeatureSet | `features` |
| 33 | optional | bool | `deprecated` |
| 999 | repeated | message google.protobuf.UninterpretedOption | `uninterpreted_option` |

### MethodOptions  (google/protobuf/descriptor.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 33 | optional | bool | `deprecated` |
| 34 | optional | enum google.protobuf.MethodOptions.IdempotencyLevel | `idempotency_level` |
| 35 | optional | message google.protobuf.FeatureSet | `features` |
| 999 | repeated | message google.protobuf.UninterpretedOption | `uninterpreted_option` |

### UninterpretedOption  (google/protobuf/descriptor.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 2 | repeated | message google.protobuf.UninterpretedOption.NamePart | `name` |
| 3 | optional | string | `identifier_value` |
| 4 | optional | uint64 | `positive_int_value` |
| 5 | optional | int64 | `negative_int_value` |
| 6 | optional | double | `double_value` |
| 7 | optional | bytes | `string_value` |
| 8 | optional | string | `aggregate_value` |

### FeatureSet  (google/protobuf/descriptor.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | enum google.protobuf.FeatureSet.FieldPresence | `field_presence` |
| 2 | optional | enum google.protobuf.FeatureSet.EnumType | `enum_type` |
| 3 | optional | enum google.protobuf.FeatureSet.RepeatedFieldEncoding | `repeated_field_encoding` |
| 4 | optional | enum google.protobuf.FeatureSet.Utf8Validation | `utf8_validation` |
| 5 | optional | enum google.protobuf.FeatureSet.MessageEncoding | `message_encoding` |
| 6 | optional | enum google.protobuf.FeatureSet.JsonFormat | `json_format` |

### FeatureSetDefaults  (google/protobuf/descriptor.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message google.protobuf.FeatureSetDefaults.FeatureSetEditionDefault | `defaults` |
| 4 | optional | enum google.protobuf.Edition | `minimum_edition` |
| 5 | optional | enum google.protobuf.Edition | `maximum_edition` |

### SourceCodeInfo  (google/protobuf/descriptor.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message google.protobuf.SourceCodeInfo.Location | `location` |

### GeneratedCodeInfo  (google/protobuf/descriptor.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message google.protobuf.GeneratedCodeInfo.Annotation | `annotation` |

### Duration  (google/protobuf/duration.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int64 | `seconds` |
| 2 | optional | int32 | `nanos` |

### Empty  (google/protobuf/empty.proto)

| # | label | type | name |
| --- | --- | --- | --- |

### SourceContext  (google/protobuf/source_context.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `file_name` |

### Struct  (google/protobuf/struct.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message google.protobuf.Struct.FieldsEntry | `fields` |

### Value  (google/protobuf/struct.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | enum google.protobuf.NullValue | `null_value` |
| 2 | optional | double | `number_value` |
| 3 | optional | string | `string_value` |
| 4 | optional | bool | `bool_value` |
| 5 | optional | message google.protobuf.Struct | `struct_value` |
| 6 | optional | message google.protobuf.ListValue | `list_value` |

### ListValue  (google/protobuf/struct.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message google.protobuf.Value | `values` |

### Timestamp  (google/protobuf/timestamp.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int64 | `seconds` |
| 2 | optional | int32 | `nanos` |

### Type  (google/protobuf/type.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 2 | repeated | message google.protobuf.Field | `fields` |
| 3 | repeated | string | `oneofs` |
| 4 | repeated | message google.protobuf.Option | `options` |
| 5 | optional | message google.protobuf.SourceContext | `source_context` |
| 6 | optional | enum google.protobuf.Syntax | `syntax` |

### Field  (google/protobuf/type.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | enum google.protobuf.Field.Kind | `kind` |
| 2 | optional | enum google.protobuf.Field.Cardinality | `cardinality` |
| 3 | optional | int32 | `number` |
| 4 | optional | string | `name` |
| 6 | optional | string | `type_url` |
| 7 | optional | int32 | `oneof_index` |
| 8 | optional | bool | `packed` |
| 9 | repeated | message google.protobuf.Option | `options` |
| 10 | optional | string | `json_name` |
| 11 | optional | string | `default_value` |

### Enum  (google/protobuf/type.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 2 | repeated | message google.protobuf.EnumValue | `enumvalue` |
| 3 | repeated | message google.protobuf.Option | `options` |
| 4 | optional | message google.protobuf.SourceContext | `source_context` |
| 5 | optional | enum google.protobuf.Syntax | `syntax` |

### EnumValue  (google/protobuf/type.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 2 | optional | int32 | `number` |
| 3 | repeated | message google.protobuf.Option | `options` |

### Option  (google/protobuf/type.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 2 | optional | message google.protobuf.Any | `value` |

### DoubleValue  (google/protobuf/wrappers.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | double | `value` |

### FloatValue  (google/protobuf/wrappers.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | float | `value` |

### Int64Value  (google/protobuf/wrappers.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int64 | `value` |

### UInt64Value  (google/protobuf/wrappers.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | uint64 | `value` |

### Int32Value  (google/protobuf/wrappers.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `value` |

### UInt32Value  (google/protobuf/wrappers.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | uint32 | `value` |

### BoolValue  (google/protobuf/wrappers.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `value` |

### StringValue  (google/protobuf/wrappers.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `value` |

### BytesValue  (google/protobuf/wrappers.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bytes | `value` |

### Status  (google/rpc/status.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `code` |
| 2 | optional | string | `message` |
| 3 | repeated | message google.protobuf.Any | `details` |

### DashboardUrlParam  (ins_cloud_export_dashboard.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `type` |
| 2 | optional | string | `items` |
| 3 | optional | bool | `watermark` |
| 4 | optional | string | `language` |

### DashboardRefreshDataParam  (ins_cloud_export_dashboard.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message google.protobuf.Int32Value | `energyConsumption` |
| 2 | optional | message google.protobuf.DoubleValue | `powerInWatts` |
| 3 | optional | message google.protobuf.DoubleValue | `speed` |
| 4 | optional | message google.protobuf.DoubleValue | `slope` |
| 5 | optional | message google.protobuf.DoubleValue | `distance` |
| 6 | optional | message google.protobuf.DoubleValue | `elevation` |
| 7 | optional | message google.protobuf.DoubleValue | `acceleration` |
| 8 | optional | message google.protobuf.DoubleValue | `pace` |
| 9 | optional | message google.protobuf.Int32Value | `steps` |
| 10 | optional | message google.protobuf.Int32Value | `heartRate` |
| 11 | optional | message google.protobuf.DoubleValue | `cadence` |
| 12 | optional | message google.protobuf.Int32Value | `bendingAngle` |
| 13 | optional | message google.protobuf.Int64Value | `dateTime` |
| 14 | optional | message google.protobuf.Int32Value | `dateTimeZone` |
| 15 | optional | message google.protobuf.Int32Value | `drivingPathIndex` |
| 16 | optional | message google.protobuf.DoubleValue | `accelerator` |
| 17 | optional | message google.protobuf.Int32Value | `brake` |
| 18 | optional | message google.protobuf.DoubleValue | `engineSpeed` |
| 19 | optional | message google.protobuf.Int32Value | `gear` |
| 20 | optional | message google.protobuf.DoubleValue | `longitude` |
| 21 | optional | message google.protobuf.StringValue | `longitude_text` |
| 22 | optional | message google.protobuf.DoubleValue | `latitude` |
| 23 | optional | message google.protobuf.StringValue | `latitude_text` |
| 24 | optional | message google.protobuf.Int32Value | `vehicle_type` |
| 25 | optional | message google.protobuf.DoubleValue | `altitude` |
| 26 | optional | message google.protobuf.DoubleValue | `direction` |
| 27 | optional | message google.protobuf.DoubleValue | `gpsTime` |
| 28 | optional | message google.protobuf.BoolValue | `isInHasGpsDataSection` |
| 29 | optional | message google.protobuf.DoubleValue | `verticalSpeed` |
| 30 | optional | message google.protobuf.StringValue | `vehicleTypeStr` |
| 31 | optional | message google.protobuf.Int32Value | `diveProfileIndex` |
| 32 | optional | message google.protobuf.DoubleValue | `depth` |
| 33 | optional | message google.protobuf.DoubleValue | `duration` |
| 34 | optional | message google.protobuf.DoubleValue | `temperature` |
| 35 | optional | message google.protobuf.DoubleValue | `pressure` |
| 36 | optional | message google.protobuf.StringValue | `logo` |
| 37 | optional | message google.protobuf.StringValue | `frameType` |
| 38 | optional | message google.protobuf.DoubleValue | `bendingAngleDouble` |
| 39 | optional | message google.protobuf.Int64Value | `fishingDuration` |
| 40 | optional | message google.protobuf.DoubleValue | `lineLength` |
| 41 | optional | message google.protobuf.DoubleValue | `wireSpeed` |
| 42 | optional | message google.protobuf.DoubleValue | `manualStrength` |
| 43 | optional | message google.protobuf.DoubleValue | `machineStrength` |
| 44 | optional | message google.protobuf.StringValue | `fishingControlMode` |
| 45 | optional | message google.protobuf.DoubleValue | `offsetX` |
| 46 | optional | message google.protobuf.DoubleValue | `offsetY` |
| 47 | optional | message google.protobuf.DoubleValue | `offsetZ` |
| 48 | optional | message google.protobuf.DoubleValue | `eulerRotationX` |
| 49 | optional | message google.protobuf.DoubleValue | `eulerRotationY` |
| 50 | optional | message google.protobuf.BoolValue | `highSpeedMode` |
| 51 | optional | message google.protobuf.StringValue | `currentFrame` |
| 100 | optional | message google.protobuf.DoubleValue | `acceleratorMax` |
| 101 | optional | message google.protobuf.Int32Value | `energyConsumptionMax` |
| 102 | optional | message google.protobuf.DoubleValue | `speedMax` |
| 103 | optional | message google.protobuf.DoubleValue | `elevationMax` |
| 104 | optional | message google.protobuf.Int32Value | `bendingAngleMax` |
| 105 | optional | message google.protobuf.DoubleValue | `cadenceMax` |
| 106 | optional | message google.protobuf.Int32Value | `heartRateMax` |
| 107 | optional | message google.protobuf.Int32Value | `stepsMax` |
| 108 | optional | message google.protobuf.DoubleValue | `paceMax` |
| 109 | optional | message google.protobuf.DoubleValue | `accelerationMax` |
| 110 | optional | message google.protobuf.DoubleValue | `distanceMax` |
| 111 | optional | message google.protobuf.DoubleValue | `slopeMax` |
| 112 | optional | message google.protobuf.DoubleValue | `powerInWattsMax` |
| 113 | optional | message google.protobuf.DoubleValue | `verticalSpeedMax` |
| 114 | optional | message google.protobuf.DoubleValue | `depthMax` |
| 115 | optional | message google.protobuf.DoubleValue | `durationMax` |
| 116 | optional | message google.protobuf.DoubleValue | `temperatureMax` |
| 117 | optional | message google.protobuf.DoubleValue | `pressureMax` |
| 118 | optional | message google.protobuf.DoubleValue | `engineSpeedMax` |
| 119 | optional | message google.protobuf.DoubleValue | `lineLengthMax` |
| 120 | optional | message google.protobuf.DoubleValue | `wireSpeedMax` |
| 121 | optional | message google.protobuf.DoubleValue | `manualStrengthMax` |
| 122 | optional | message google.protobuf.DoubleValue | `machineStrengthMax` |

### DashboardRefreshData  (ins_cloud_export_dashboard.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | double | `timestamp` |
| 2 | optional | string | `data` |
| 3 | optional | message insta360.cloud.message.DashboardRefreshDataParam | `keydata` |

### DashboardInfo  (ins_cloud_export_dashboard.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message insta360.cloud.message.DashboardUrlParam | `urlParam` |
| 2 | optional | string | `location` |
| 3 | optional | string | `updateConfig` |
| 4 | repeated | message insta360.cloud.message.DashboardRefreshData | `refreshData` |
| 5 | optional | enum insta360.cloud.message.DashBoardDataSource | `source` |
| 6 | optional | int32 | `clipindex` |
| 7 | optional | message google.protobuf.StringValue | `passThroughUrlParam` |
| 8 | optional | message google.protobuf.StringValue | `diveProfile` |
| 9 | optional | message google.protobuf.StringValue | `initChatData` |
| 10 | optional | message google.protobuf.StringValue | `initData` |
| 11 | optional | message google.protobuf.StringValue | `initPccFishingPower` |

### CutsceneInfo  (ins_cloud_export_data.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | double | `startTimeMs` |
| 2 | optional | double | `durationMs` |
| 3 | optional | enum insta360.cloud.message.CutsceneType | `cutsceneType` |
| 4 | optional | string | `uuid` |

### ExporterTimeScale  (ins_cloud_export_data.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | double | `factor` |
| 2 | optional | double | `startTimeMs` |
| 3 | optional | double | `endTimeMs` |
| 4 | optional | double | `clipCutsceneDurationMediaMs` |
| 5 | optional | int32 | `motionBlurNum` |
| 6 | optional | double | `repeatToFps` |
| 7 | optional | bool | `videoKeyframeOnly` |
| 8 | optional | enum insta360.cloud.message.ExporterTimeScaleType | `scaleType` |
| 9 | optional | message google.protobuf.DoubleValue | `beginFactor` |
| 10 | optional | message google.protobuf.DoubleValue | `endFactor` |

### CaptureBeautyInfo  (ins_cloud_export_data.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | float | `skinCareStrength` |
| 2 | optional | float | `blemishRemovalStrength` |

### SourceFileClipsInfo  (ins_cloud_export_data.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `clipindex` |
| 2 | optional | double | `startTimeMs` |
| 3 | optional | double | `endTimeMs` |
| 4 | optional | double | `endCutDurationMs` |
| 5 | optional | bool | `videoSilent` |
| 6 | optional | double | `useFrameCount` |
| 7 | optional | double | `audioVolume` |
| 8 | optional | enum insta360.cloud.message.ClipAudioMode | `clipAudioMode` |
| 9 | repeated | message insta360.cloud.message.ExporterTimeScale | `exporterTimeScales` |
| 10 | optional | message google.protobuf.BoolValue | `enableAudioDenoise` |
| 11 | optional | message google.protobuf.DoubleValue | `audioDenoiseBgmWeight` |
| 12 | optional | message google.protobuf.DoubleValue | `audioDenoiseVoiceWeight` |
| 13 | optional | message insta360.cloud.message.CutsceneInfo | `cutsceneInfo` |
| 14 | optional | message google.protobuf.DoubleValue | `videoDurationMs` |
| 15 | optional | int32 | `audioTrackCount` |
| 16 | optional | message google.protobuf.DoubleValue | `firstAudioMixWeight` |
| 17 | optional | message google.protobuf.Int32Value | `firstAudioTrackDelay` |
| 18 | optional | bool | `isAmbisonicOn` |
| 19 | optional | int32 | `audioAmbisonicNum` |
| 20 | optional | bool | `enableAiDenoiseWind` |
| 21 | optional | bool | `enableVoiceEnhance` |
| 22 | optional | bool | `enableAEFilter` |
| 23 | optional | bool | `enablePostSharpenFilter` |
| 24 | optional | double | `originAudioAfadeInMs` |
| 25 | optional | double | `originAudioAfadeOutMs` |
| 26 | optional | bool | `enableCaptureBeautyMode` |
| 27 | optional | message insta360.cloud.message.CaptureBeautyInfo | `captureBeautyInfo` |

### SourceImageClipsInfo  (ins_cloud_export_data.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `clipindex` |
| 2 | optional | string | `resouceid` |
| 3 | optional | double | `durationMs` |
| 4 | optional | double | `endCutDurationMs` |
| 5 | optional | int32 | `useFrameCount` |

### SourceAudioEffectClipInfo  (ins_cloud_export_data.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `resouceid` |
| 2 | optional | double | `positionInMediaTimeMs` |
| 3 | optional | double | `startSrcTimeMs` |
| 4 | optional | double | `endSrcTimeMs` |
| 5 | optional | double | `totalSrcDurationMs` |
| 6 | optional | double | `volume` |
| 7 | optional | double | `afadeInDurationMs` |
| 8 | optional | double | `afadeOutDurationMs` |
| 9 | optional | double | `weight` |

### SourceBGMClipsInfo  (ins_cloud_export_data.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `resouceid` |
| 2 | optional | double | `positionInMediaTimeMs` |
| 3 | optional | double | `startSrcTimeMs` |
| 4 | optional | double | `endSrcTimeMs` |
| 5 | optional | double | `totalSrcDurationMs` |
| 6 | optional | double | `volume` |
| 7 | optional | double | `afadeInDurationMs` |
| 8 | optional | double | `afadeOutDurationMs` |
| 9 | optional | bool | `loop` |

### HorizontalCorrectorInfo  (ins_cloud_export_data.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `srcWidth` |
| 2 | optional | int32 | `srcHeight` |
| 3 | optional | float | `maxCorrectAngle` |
| 4 | optional | float | `dstAspectRatio` |
| 5 | optional | double | `rollAngle` |
| 6 | optional | double | `scaleRate` |

### ClipRenderInfo  (ins_cloud_export_data.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `clipindex` |
| 2 | optional | message google.protobuf.Int32Value | `stabType` |
| 3 | optional | enum insta360.cloud.message.RenderModelType | `renderModelType` |
| 4 | optional | message google.protobuf.DoubleValue | `autoFovRange` |
| 5 | optional | message google.protobuf.BoolValue | `useMianOrientationWhileStabOff` |
| 6 | optional | message google.protobuf.StringValue | `offset` |
| 7 | optional | message google.protobuf.BoolValue | `useGravityCalib` |
| 8 | optional | message google.protobuf.Int32Value | `povMode` |
| 9 | optional | message google.protobuf.Int32Value | `userRotationDegree` |
| 10 | optional | message insta360.cloud.message.HorizontalCorrectorInfo | `horizontalCorrectorInfo` |
| 11 | optional | message google.protobuf.Int32Value | `contentMode` |
| 12 | optional | message google.protobuf.Int32Value | `cameraFacing` |
| 13 | optional | message google.protobuf.Int32Value | `stabProjectType` |
| 14 | optional | message google.protobuf.DoubleValue | `stabBoundaryRedundancyRate` |
| 15 | optional | message google.protobuf.DoubleValue | `relativeHorizonThreshold` |

### ClipDefaultViewData  (ins_cloud_export_data.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `clipindex` |
| 2 | optional | message insta360.cloud.message.ViewData | `defaultViewData` |
| 3 | optional | message insta360.cloud.message.AspectRatio | `defaultAspect` |

### MultiViewInfo  (ins_cloud_export_data.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message insta360.cloud.message.MultiViewInfo.RectInfo | `mainView` |
| 2 | optional | message insta360.cloud.message.MultiViewInfo.RectInfo | `subView` |
| 3 | optional | double | `startTimeMs` |
| 4 | optional | double | `endTimeMs` |
| 5 | repeated | message insta360.cloud.message.ViewData | `subViewData` |
| 6 | optional | message google.protobuf.Int32Value | `smoothWinLen` |
| 7 | repeated | message insta360.cloud.message.MultiViewInfo.SubViewInfo | `subViewInfo` |
| 8 | optional | message google.protobuf.Int32Value | `mode` |
| 9 | repeated | float | `radiusRatio` |
| 10 | optional | double | `featherRatio` |

### MultiViewData  (ins_cloud_export_data.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `clipIndex` |
| 2 | repeated | message insta360.cloud.message.MultiViewInfo | `multiViewInfo` |
| 3 | optional | message insta360.cloud.message.ViewData | `defaultSubView` |

### BigBoomInfo  (ins_cloud_export_data.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `clipIndex` |
| 2 | optional | string | `jsonfilm` |
| 3 | optional | string | `jsonadj` |

### ShareExtraInfo  (ins_cloud_export_data.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `viewData` |

### BaseSegment  (ins_cloud_export_data.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message insta360.cloud.message.ClipDefaultViewData | `clipDefaultViewData` |
| 2 | repeated | message insta360.cloud.message.ProjectSegment | `projectSegment` |
| 3 | repeated | message insta360.cloud.message.ClipRenderInfo | `clipRenderInfo` |
| 4 | repeated | message insta360.cloud.message.FilterInfoList | `filterInfoList` |
| 5 | repeated | message insta360.cloud.message.MultiViewData | `multiViewData` |
| 6 | repeated | message insta360.cloud.message.BigBoomInfo | `bigboominfo` |
| 7 | repeated | bool | `forceSrcAnimationClips` |
| 8 | repeated | message insta360.cloud.message.ClipProjectiveInfo | `clipProjectiveInfo` |
| 9 | optional | message insta360.cloud.message.ShareExtraInfo | `shareExtraInfo` |
| 10 | repeated | message insta360.cloud.message.ClipProjectiveInfoV2 | `clipProjectiveInfoV2` |

### SourceBGMConfig  (ins_cloud_export_data.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message insta360.cloud.message.SourceBGMClipsInfo | `bgmclipsinfo` |
| 2 | optional | message google.protobuf.DoubleValue | `bgmWeight` |

### ProjectiveReqParam  (ins_cloud_export_data.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | enum insta360.cloud.message.ProjectionType | `type` |
| 2 | optional | bool | `useCustomParam` |
| 3 | optional | float | `startXFovDeg` |
| 4 | optional | float | `startDistance` |
| 5 | optional | float | `endXFovDeg` |
| 6 | optional | float | `endDistance` |

### ClipProjectiveInfo  (ins_cloud_export_data.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `clipindex` |
| 2 | optional | message insta360.cloud.message.ProjectiveReqParam | `param` |

### EyePointInfo  (ins_cloud_export_data.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | float | `fov` |
| 2 | optional | float | `distance` |
| 3 | optional | float | `ratio` |
| 4 | optional | float | `modelAlpha` |

### EyePointfovType  (ins_cloud_export_data.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `type` |

### ProjectiveReqParamV2  (ins_cloud_export_data.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `useInterpCurve` |
| 2 | optional | float | `aspect` |
| 3 | optional | double | `startRealYFovDegree` |
| 4 | optional | double | `endRealYFovDegree` |
| 5 | repeated | message insta360.cloud.message.EyePointInfo | `eyePoints` |
| 6 | optional | bool | `isDewarp` |
| 7 | optional | message insta360.cloud.message.EyePointfovType | `fovtype` |

### ClipProjectiveInfoV2  (ins_cloud_export_data.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `clipindex` |
| 2 | optional | message insta360.cloud.message.ProjectiveReqParamV2 | `param` |

### TemplateInfo  (ins_cloud_export_data.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `templateId` |

### CloudExportData  (ins_cloud_export_data.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `version` |
| 2 | optional | enum insta360.cloud.message.DataSource | `source` |
| 3 | optional | string | `projectName` |
| 4 | optional | message insta360.cloud.message.ExportInformation | `exportinfo` |
| 5 | repeated | message insta360.cloud.message.SourceFileClipsInfo | `fileclipinfo` |
| 6 | repeated | message insta360.cloud.message.SourceImageClipsInfo | `imageclipinfo` |
| 7 | repeated | message insta360.cloud.message.SourceAudioEffectClipInfo | `audioclipinfo` |
| 8 | optional | message insta360.cloud.message.SourceBGMConfig | `bgmclipsconfig` |
| 9 | optional | message insta360.cloud.message.BaseSegment | `baseSegment` |
| 10 | optional | message insta360.cloud.message.SpecialEffectList | `specialEffectList` |
| 11 | optional | message insta360.cloud.message.TemplateInfo | `templateInfo` |
| 12 | optional | string | `clientVersion` |

### LtmFilterInfo  (ins_cloud_export_filter.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `isPanorama` |
| 2 | optional | float | `strength` |

### ColorPlus3FilterInfo  (ins_cloud_export_filter.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `isPanorama` |
| 2 | optional | float | `intensity` |
| 3 | optional | uint32 | `frameInterval` |

### ColorPlusLutFilterInfo  (ins_cloud_export_filter.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | float | `intensity` |
| 2 | optional | uint32 | `frameInterval` |
| 3 | optional | message google.protobuf.FloatValue | `movingRatio` |

### ColorPlusPostFilterInfo  (ins_cloud_export_filter.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message google.protobuf.Int32Value | `frameInterval` |
| 2 | optional | uint32 | `width` |
| 3 | optional | uint32 | `height` |
| 4 | optional | enum insta360.cloud.message.ColorPlusPostFilterInfo.LtmMode | `ltmMode` |
| 5 | optional | message google.protobuf.Int32Value | `paddingRatio` |

### CartoonFilterInfo  (ins_cloud_export_filter.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | uint32 | `width` |
| 2 | optional | uint32 | `height` |

### LutStyleFilterInfo  (ins_cloud_export_filter.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | enum insta360.cloud.message.LutStyleFilterInfo.Type | `type` |
| 2 | optional | float | `intensity` |
| 3 | optional | string | `uuid` |

### LutFilterInfo  (ins_cloud_export_filter.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | enum insta360.cloud.message.LutFilterInfo.Type | `type` |

### ImageContrastFilterInfo  (ins_cloud_export_filter.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | float | `value` |

### ImageSaturationFilterInfo  (ins_cloud_export_filter.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | float | `value` |

### ImageHighLightFilterInfo  (ins_cloud_export_filter.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | float | `value` |

### ImageShadowFilterInfo  (ins_cloud_export_filter.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | float | `value` |

### ImageColorTemperatureFilterInfo  (ins_cloud_export_filter.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | float | `value` |

### ImageToneFilterInfo  (ins_cloud_export_filter.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | float | `value` |

### ImageSharpnessFilterInfo  (ins_cloud_export_filter.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | float | `value` |

### ImageExposureFilterInfo  (ins_cloud_export_filter.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | float | `value` |

### UnderwaterColourRestorationFilterInfo  (ins_cloud_export_filter.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `isPanorama` |
| 2 | optional | float | `strength` |
| 3 | optional | float | `balance` |

### MeisheBeautyFilterInfo  (ins_cloud_export_filter.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | float | `whiten` |
| 2 | optional | float | `smooth` |
| 3 | optional | float | `face` |
| 4 | optional | float | `eye` |
| 5 | optional | float | `nose` |

### StrengthTimeMap  (ins_cloud_export_filter.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int64 | `timeS` |
| 2 | optional | float | `strength` |

### RealSmartMotionBlurFilterInfo  (ins_cloud_export_filter.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `isPanorama` |
| 2 | optional | float | `blurStrength` |
| 3 | optional | float | `blurThreshold` |
| 4 | repeated | message insta360.cloud.message.StrengthTimeMap | `strengthTimeMap` |

### Transform3DFilterInfo  (ins_cloud_export_filter.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | float | `transform` |

### TiltShiftBlurFilterInfo  (ins_cloud_export_filter.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | uint32 | `blurLevel` |

### ColorAdjustFilterInfo  (ins_cloud_export_filter.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `caMode` |
| 2 | optional | int32 | `caMediaType` |
| 3 | optional | message google.protobuf.Int32Value | `autoAdjust` |
| 4 | optional | message google.protobuf.Int32Value | `exposure` |
| 5 | optional | message google.protobuf.Int32Value | `brilliance` |
| 6 | optional | message google.protobuf.Int32Value | `highlights` |
| 7 | optional | message google.protobuf.Int32Value | `shadows` |
| 8 | optional | message google.protobuf.Int32Value | `contrast` |
| 9 | optional | message google.protobuf.Int32Value | `brightness` |
| 10 | optional | message google.protobuf.Int32Value | `blackpoint` |
| 11 | optional | message google.protobuf.Int32Value | `saturation` |
| 12 | optional | message google.protobuf.Int32Value | `vibrance` |
| 13 | optional | message google.protobuf.Int32Value | `warmth` |
| 14 | optional | message google.protobuf.Int32Value | `tint` |
| 15 | optional | message google.protobuf.Int32Value | `definition` |

### SDRToHDR10FilterInfo  (ins_cloud_export_filter.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message google.protobuf.BoolValue | `useForPreviewRender` |

### BlurBackgroundFilterInfo  (ins_cloud_export_filter.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message google.protobuf.Int32Value | `blurLevel` |
| 2 | optional | message google.protobuf.FloatValue | `blurSize` |
| 3 | optional | message google.protobuf.FloatValue | `downSamplingFactor` |
| 4 | optional | message google.protobuf.Int32Value | `iterationCount` |

### NumberPlateFilterInfo  (ins_cloud_export_filter.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `detectGapFrames` |

### Transform2DFilterInfo  (ins_cloud_export_filter.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | float | `contentAspect` |
| 2 | optional | float | `rollDegree` |
| 3 | optional | float | `scaleRate` |

### Transform2DParam  (ins_cloud_export_filter.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | float | `offsetX` |
| 2 | optional | float | `offsetY` |
| 3 | optional | float | `scaleRateX` |
| 4 | optional | float | `scaleRateY` |
| 5 | optional | float | `rotateDegree` |

### CropTransform2DFilterInfo  (ins_cloud_export_filter.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message insta360.cloud.message.Transform2DParam | `transformParams` |
| 2 | repeated | float | `cropInfo` |
| 3 | optional | message insta360.cloud.message.Transform2DParam | `extraTransformParam` |
| 4 | repeated | float | `clearColor` |
| 5 | optional | enum insta360.cloud.message.CropContainMode | `containMode` |
| 6 | optional | enum insta360.cloud.message.CropOutAspectMode | `outAspectMode` |

### CanvasEditFilterInfo  (ins_cloud_export_filter.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message insta360.cloud.message.Transform2DParam | `transformParams` |
| 2 | optional | bool | `isNeedBlur` |
| 3 | optional | bool | `transformAllScreen` |

### PlaneAffineTransformFilterInfo  (ins_cloud_export_filter.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | float | `startMediaTimeMs` |
| 2 | optional | float | `endMediaTimeMs` |
| 3 | optional | enum insta360.cloud.message.PlaneAffineTransformFilterInfo.MotionLapseEnum | `motionLapseType` |

### UnderWaterColor3FilterInfo  (ins_cloud_export_filter.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `topK` |
| 2 | optional | float | `lutUpdateRatio` |
| 3 | optional | float | `totalStrength` |
| 4 | optional | float | `luminanceStrength` |
| 5 | optional | float | `searchInterval` |
| 6 | optional | float | `inferenceInterval` |
| 7 | optional | bytes | `styleResultBin` |

### FilterInfo  (ins_cloud_export_filter.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | enum insta360.cloud.message.FilterInfo.Type | `type` |
| 2 | optional | message insta360.cloud.message.LtmFilterInfo | `ltmFilterInfo` |
| 3 | optional | message insta360.cloud.message.ColorPlus3FilterInfo | `colorplus3FilterInfo` |
| 4 | optional | message insta360.cloud.message.CartoonFilterInfo | `cartoonFilterInfo` |
| 5 | optional | message insta360.cloud.message.LutStyleFilterInfo | `lutStyleFilterInfo` |
| 6 | optional | message insta360.cloud.message.UnderwaterColourRestorationFilterInfo | `underWaterFilterInfo` |
| 7 | optional | message insta360.cloud.message.ImageContrastFilterInfo | `imageContrastFilterInfo` |
| 8 | optional | message insta360.cloud.message.ImageSaturationFilterInfo | `imageSaturationFilterInfo` |
| 9 | optional | message insta360.cloud.message.ImageHighLightFilterInfo | `imageHighLightFilterInfo` |
| 10 | optional | message insta360.cloud.message.ImageShadowFilterInfo | `imageShadowFilterInfo` |
| 11 | optional | message insta360.cloud.message.ImageColorTemperatureFilterInfo | `imageColorTemperatureFilterInfo` |
| 12 | optional | message insta360.cloud.message.ImageToneFilterInfo | `imageToneFilterInfo` |
| 13 | optional | message insta360.cloud.message.ImageSharpnessFilterInfo | `imageSharpnessFilterInfo` |
| 14 | optional | message insta360.cloud.message.ImageExposureFilterInfo | `imageExposureFilterInfo` |
| 15 | optional | message insta360.cloud.message.MeisheBeautyFilterInfo | `meisheBeautyFilterInfo` |
| 16 | optional | message insta360.cloud.message.LutFilterInfo | `lutFilterInfo` |
| 17 | optional | message insta360.cloud.message.RealSmartMotionBlurFilterInfo | `realSmartMotionBlurFilterInfo` |
| 18 | optional | message insta360.cloud.message.Transform3DFilterInfo | `transform3DFilterInfo` |
| 19 | optional | message insta360.cloud.message.TiltShiftBlurFilterInfo | `tiltShiftBlurFilterInfo` |
| 20 | optional | message insta360.cloud.message.ColorAdjustFilterInfo | `colorAdjustFilterInfo` |
| 21 | optional | message insta360.cloud.message.SDRToHDR10FilterInfo | `sdrToHdr10FilterInfo` |
| 22 | optional | message insta360.cloud.message.BlurBackgroundFilterInfo | `blurBackgroundFilterInfo` |
| 23 | optional | message insta360.cloud.message.NumberPlateFilterInfo | `numberPlateFilterInfo` |
| 24 | optional | message insta360.cloud.message.ColorPlusPostFilterInfo | `colorPlusPostFilterInfo` |
| 25 | optional | message insta360.cloud.message.Transform2DFilterInfo | `transform2DFilterInfo` |
| 26 | optional | message insta360.cloud.message.PlaneAffineTransformFilterInfo | `planeAffineTransformFilterInfo` |
| 27 | optional | message insta360.cloud.message.UnderWaterColor3FilterInfo | `underWaterColor3FilterInfo` |
| 28 | optional | message insta360.cloud.message.CropTransform2DFilterInfo | `cropTransform2DFilterInfo` |
| 29 | optional | message insta360.cloud.message.CanvasEditFilterInfo | `canvasEditFilterInfo` |
| 30 | optional | message insta360.cloud.message.ColorPlusLutFilterInfo | `colorPlusLutFilterInfo` |

### FilterInfoList  (ins_cloud_export_filter.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | uint32 | `clipIndex` |
| 2 | repeated | message insta360.cloud.message.FilterInfo | `filterInfos` |

### CloudVideoInfo  (ins_cloud_proxy_info.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message insta360.cloud.message.CubeMapInfo | `cubeMapInfo` |
| 2 | repeated | message google.protobuf.StringValue | `fileItems` |
| 3 | optional | message insta360.cloud.message.OriginalVideoInfo | `originalVideoInfo` |
| 4 | optional | message google.protobuf.BoolValue | `trim` |

### CubeMapInfo  (ins_cloud_proxy_info.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message google.protobuf.Int32Value | `cubeWidthExtend` |
| 2 | optional | message google.protobuf.Int32Value | `panoWidth` |
| 3 | optional | message google.protobuf.Int32Value | `projectionType` |
| 4 | optional | message google.protobuf.Int32Value | `width` |

### OriginalVideoInfo  (ins_cloud_proxy_info.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message google.protobuf.DoubleValue | `bitrate` |
| 2 | optional | message google.protobuf.BoolValue | `hasAudio` |
| 3 | optional | message google.protobuf.Int32Value | `height` |
| 4 | optional | message google.protobuf.BoolValue | `isFileDualStream` |
| 5 | optional | message google.protobuf.BoolValue | `isPanoramaFormat` |
| 6 | optional | message google.protobuf.BoolValue | `isVideo` |
| 7 | optional | message google.protobuf.Int32Value | `planeRotationDegree` |
| 8 | optional | message google.protobuf.StringValue | `videoCodecName` |
| 9 | optional | message google.protobuf.DoubleValue | `videoDurationMs` |
| 10 | optional | message google.protobuf.DoubleValue | `videoFramerate` |
| 11 | optional | message google.protobuf.DoubleValue | `videoRotate` |
| 12 | optional | message google.protobuf.Int32Value | `width` |
| 13 | optional | message google.protobuf.Int64Value | `fileSize` |

### MeisheAnim  (ins_cloud_special_effect.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `uuid` |
| 2 | optional | double | `durationMs` |

### MeisheSticker  (ins_cloud_special_effect.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `uuid` |
| 2 | optional | double | `startTimeMs` |
| 3 | optional | double | `durationMs` |
| 4 | optional | int32 | `positionZ` |
| 5 | optional | float | `translationX` |
| 6 | optional | float | `translationY` |
| 7 | optional | message google.protobuf.FloatValue | `scaleX` |
| 8 | optional | message google.protobuf.FloatValue | `scaleY` |
| 9 | optional | bool | `isVerticalFlip` |
| 10 | optional | bool | `isHorizontalFlip` |
| 11 | optional | float | `rotate` |
| 12 | optional | message insta360.cloud.message.MeisheAnim | `inAnimation` |
| 13 | optional | message insta360.cloud.message.MeisheAnim | `outAnimation` |
| 14 | optional | message insta360.cloud.message.MeisheAnim | `periodAnimation` |
| 15 | optional | bool | `isCustom` |
| 16 | optional | string | `custom_uuid` |

### MeiSheTextInfo  (ins_cloud_special_effect.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `index` |
| 2 | repeated | float | `colorARGB` |
| 3 | optional | string | `text` |
| 4 | optional | string | `fontName` |
| 5 | optional | message google.protobuf.Int32Value | `weight` |
| 6 | optional | bool | `italic` |
| 7 | optional | string | `uuid` |

### MeisheTimeWaterMarkCaptionInfo  (ins_cloud_special_effect.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | enum insta360.cloud.message.MeisheTimeWaterMarkCaptionInfo.FormatType | `formatType` |
| 2 | optional | int64 | `createTimeStamp` |
| 3 | optional | int32 | `timeZone` |

### MeiSheCaption  (ins_cloud_special_effect.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `uuid` |
| 2 | optional | double | `startTimeMs` |
| 3 | optional | double | `durationMs` |
| 4 | repeated | message insta360.cloud.message.MeiSheTextInfo | `customTextInfoList` |
| 5 | optional | int32 | `positionZ` |
| 6 | optional | float | `rotate` |
| 7 | optional | float | `translationX` |
| 8 | optional | float | `translationY` |
| 9 | optional | message google.protobuf.FloatValue | `scaleX` |
| 10 | optional | message google.protobuf.FloatValue | `scaleY` |
| 11 | optional | message google.protobuf.FloatValue | `opacity` |
| 12 | optional | message insta360.cloud.message.MeisheTimeWaterMarkCaptionInfo | `meisheTimeWaterMarkCaptionInfo` |

### MeiSheEffect  (ins_cloud_special_effect.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `uuid` |
| 2 | optional | double | `startTimeMs` |
| 3 | optional | double | `durationMs` |

### SpecialEffectList  (ins_cloud_special_effect.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message insta360.cloud.message.MeiSheCaption | `meisheCaption` |
| 2 | repeated | message insta360.cloud.message.MeisheSticker | `meisheSticker` |
| 3 | repeated | message insta360.cloud.message.MeiSheEffect | `meisheEffect` |

### ExportInfox264EncodeOption  (ins_export_information.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `x264Preset` |
| 2 | optional | string | `videoEncoderProfile` |
| 3 | optional | string | `videoEncodeTune` |
| 4 | optional | int32 | `videoLevel` |

### EnumCodecIdValue  (ins_export_information.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | enum insta360.cloud.message.CodecId | `value` |

### ExportInfoVideoEncodeOption  (ins_export_information.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message google.protobuf.Int32Value | `encFormat` |
| 2 | optional | int32 | `width` |
| 3 | optional | int32 | `height` |
| 4 | optional | int32 | `bitrate` |
| 5 | optional | bool | `is3DLeftRight` |
| 6 | optional | bool | `isSpherical` |
| 7 | optional | enum insta360.cloud.message.VideoType | `videoType` |
| 8 | optional | int32 | `videoGopSize` |
| 9 | optional | double | `fps` |
| 10 | optional | string | `metadataMake` |
| 11 | optional | string | `metadataModel` |
| 12 | optional | string | `metadataComment` |
| 13 | optional | message insta360.cloud.message.ExportInfox264EncodeOption | `exportInfox264EncodeOption` |
| 14 | optional | message insta360.cloud.message.EnumCodecIdValue | `codecid` |
| 15 | optional | message google.protobuf.BoolValue | `enableSdrToHdr10` |
| 16 | optional | string | `creationTime` |
| 17 | optional | string | `metadataAIGC` |
| 18 | optional | message google.protobuf.BoolValue | `bitDepth10Export` |
| 19 | optional | message google.protobuf.BoolValue | `enableHLG` |
| 20 | optional | message google.protobuf.BoolValue | `enableDolbyVision` |
| 21 | optional | message google.protobuf.Int32Value | `colorRange` |
| 22 | optional | message google.protobuf.Int32Value | `colorSpace` |

### ExportInfoAudioEncodeOption  (ins_export_information.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `audioBitrate` |
| 2 | optional | int32 | `sampleRate` |
| 3 | optional | int32 | `nbSample` |
| 4 | optional | enum insta360.cloud.message.ChannelLayout | `channelLayout` |

### BlockDenoiseParamMapping  (ins_export_information.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | double | `iso` |
| 2 | optional | int32 | `refCount` |
| 3 | optional | int32 | `thresholdLum` |
| 4 | optional | int32 | `limit` |

### ChromaDenoiseParam  (ins_export_information.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | float | `applyISOValue` |
| 2 | optional | float | `exitISOValue` |

### BlockDenoiseParam  (ins_export_information.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `clipindex` |
| 2 | repeated | message insta360.cloud.message.BlockDenoiseParamMapping | `isoMaps` |
| 3 | optional | message insta360.cloud.message.ChromaDenoiseParam | `chromaDenoiseParam` |

### BlockDenoiseParamV2  (ins_export_information.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `clipindex` |
| 2 | optional | string | `denoiseTableType` |
| 3 | optional | message google.protobuf.BoolValue | `isFast` |
| 4 | optional | message google.protobuf.Int32Value | `overlap` |

### ExportInfoDenoiseSettings  (ins_export_information.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `enableDenoise` |
| 2 | optional | message google.protobuf.Int32Value | `denosieType` |
| 3 | repeated | message insta360.cloud.message.BlockDenoiseParam | `blockDenoiseParam` |
| 4 | repeated | message insta360.cloud.message.BlockDenoiseParamV2 | `blockDenoiseParamV2` |
| 5 | optional | message google.protobuf.BoolValue | `autoDenoise` |

### ExportInfoWaterMark  (ins_export_information.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `x` |
| 2 | optional | int32 | `y` |
| 3 | optional | int32 | `w` |
| 4 | optional | int32 | `h` |
| 5 | optional | double | `waterMarkEndTime` |
| 6 | optional | string | `resouceid` |

### ExportInfoLogoInfo  (ins_export_information.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | float | `x` |
| 2 | optional | float | `y` |
| 3 | optional | float | `z` |
| 4 | optional | float | `size` |
| 5 | optional | bool | `enableLogoFeature` |
| 6 | optional | string | `resouceid` |
| 7 | optional | float | `cornerRadius` |
| 8 | optional | float | `feather` |
| 9 | optional | float | `rotate` |

### ExportInfoEdgeInfo  (ins_export_information.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `edgeLeft` |
| 2 | optional | int32 | `edgeTop` |
| 3 | optional | int32 | `edgeRight` |
| 4 | optional | int32 | `edgeBottom` |

### ExportInfoClearColor  (ins_export_information.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | float | `r` |
| 2 | optional | float | `g` |
| 3 | optional | float | `b` |
| 4 | optional | float | `a` |

### ExportInfoOtherInfoOption  (ins_export_information.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `tailClear` |
| 2 | optional | bool | `enableStarrySky` |
| 3 | optional | bool | `enableDashboard` |
| 4 | optional | message google.protobuf.Int32Value | `renderFormat` |
| 5 | repeated | message insta360.cloud.message.DashboardInfo | `dashBoardInfo` |

### ExportInformation  (ins_export_information.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `isTurnBack` |
| 2 | optional | bool | `enableX264Decoder` |
| 3 | optional | enum insta360.cloud.message.ExMatColorType | `convertType` |
| 4 | optional | bool | `isProject` |
| 5 | optional | double | `outputAudioAfadeOutDuration` |
| 6 | optional | message insta360.cloud.message.ExportInfoVideoEncodeOption | `videoEncodeOption` |
| 7 | optional | message insta360.cloud.message.ExportInfoAudioEncodeOption | `audioEncodeOption` |
| 8 | optional | message insta360.cloud.message.ExportInfoDenoiseSettings | `denoiseSettings` |
| 9 | optional | message insta360.cloud.message.ExportInfoWaterMark | `waterMark` |
| 10 | optional | message insta360.cloud.message.ExportInfoLogoInfo | `logo` |
| 11 | optional | message insta360.cloud.message.ExportInfoEdgeInfo | `edgeInfo` |
| 12 | optional | message insta360.cloud.message.ExportInfoClearColor | `clearColor` |
| 13 | optional | message insta360.cloud.message.ExportInfoOtherInfoOption | `otherInfoOption` |
| 14 | optional | bool | `isUserChangeAspect` |
| 15 | repeated | message insta360.cloud.message.ExportInfoWaterMark | `waterMarks` |

### FaceInfo  (ins_one_shot_data.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | double | `centerPointX` |
| 2 | optional | double | `centerPointY` |
| 3 | optional | int32 | `width` |
| 4 | optional | int32 | `height` |
| 5 | optional | float | `confidence` |

### ViewData  (ins_one_shot_data.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | float | `yaw` |
| 2 | optional | float | `pitch` |
| 3 | optional | float | `xfov` |
| 4 | optional | float | `yfov` |
| 5 | optional | float | `distance` |
| 6 | optional | float | `roll` |
| 7 | optional | double | `srcTime` |
| 8 | repeated | double | `quat` |
| 9 | optional | int32 | `highlightType` |
| 10 | optional | bytes | `beISPDynamicData` |
| 11 | repeated | message insta360.cloud.algorithm.message.FaceInfo | `faceInfo` |
| 12 | optional | double | `mul_score` |
| 13 | optional | float | `confidence` |
| 14 | optional | int32 | `origin_id` |

### AspectRatio  (ins_one_shot_data.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `width` |
| 2 | optional | int32 | `height` |

### ViewSegment  (ins_one_shot_data.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message insta360.cloud.algorithm.message.AspectRatio | `aspectRatio` |
| 2 | repeated | message insta360.cloud.algorithm.message.ViewData | `keyPoints` |
| 3 | optional | bool | `horizon` |
| 4 | optional | bool | `directional` |
| 5 | optional | bool | `still` |
| 6 | optional | bool | `vir_ptz` |
| 7 | optional | bool | `immersion` |

### View  (ins_one_shot_data.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message insta360.cloud.algorithm.message.ViewSegment | `segments` |

### AspectRatio  (ins_player_edit_data.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `width` |
| 2 | optional | int32 | `height` |

### ViewData  (ins_player_edit_data.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | float | `yaw` |
| 2 | optional | float | `pitch` |
| 3 | optional | float | `roll` |
| 4 | optional | float | `fov` |
| 5 | optional | float | `distance` |
| 6 | optional | double | `srcTime` |

### ViewSegment  (ins_player_edit_data.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | enum insta360.cloud.message.ViewDataType | `type` |
| 2 | optional | message insta360.cloud.message.AspectRatio | `aspectRatio` |
| 3 | repeated | message insta360.cloud.message.ViewData | `keyPoints` |

### ProjectSegment  (ins_player_edit_data.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `id` |
| 2 | optional | enum insta360.cloud.message.ProjectSegmentType | `dataType` |
| 3 | optional | message insta360.cloud.message.AspectRatio | `aspectRatio` |
| 4 | optional | enum insta360.cloud.message.StabType | `stabType` |
| 5 | repeated | message insta360.cloud.message.ViewSegment | `segments` |
| 6 | optional | int32 | `clipindex` |

### Project  (ins_player_edit_data.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int64 | `version` |
| 2 | optional | enum insta360.cloud.message.DataSource | `source` |
| 3 | optional | string | `projectName` |
| 4 | repeated | message insta360.cloud.message.ProjectSegment | `segments` |

### ModelState  (model_state.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | enum insta360.messages.ModelState.ValueType | `type` |
| 2 | optional | double | `timeMs` |
| 3 | optional | float | `fov` |
| 4 | optional | float | `distance` |
| 5 | optional | bytes | `quat` |
| 6 | optional | bytes | `rect` |
| 7 | optional | float | `preRoll` |

### OffsetInfo  (offset_info.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `offset_version` |
| 2 | optional | string | `offset` |

### PanoTransPlus  (pano_trans_plus.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `isYFov` |
| 2 | optional | double | `aspect` |
| 3 | optional | message insta360.messages.TimePosition | `beginPosition` |
| 4 | optional | message insta360.messages.TimePosition | `endPosition` |
| 5 | optional | message insta360.messages.PanoTransPlus.LayerInfo | `layer_info` |

### Serializer  (serializer.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `version` |
| 2 | optional | string | `type` |
| 3 | optional | message google.protobuf.Any | `details` |

### NameMatcher  (src/proto/grpc/lookup/v1/rls_config.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `key` |
| 2 | repeated | string | `names` |
| 3 | optional | bool | `required_match` |

### GrpcKeyBuilder  (src/proto/grpc/lookup/v1/rls_config.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message grpc.lookup.v1.GrpcKeyBuilder.Name | `names` |
| 3 | optional | message grpc.lookup.v1.GrpcKeyBuilder.ExtraKeys | `extra_keys` |
| 2 | repeated | message grpc.lookup.v1.NameMatcher | `headers` |
| 4 | repeated | message grpc.lookup.v1.GrpcKeyBuilder.ConstantKeysEntry | `constant_keys` |

### HttpKeyBuilder  (src/proto/grpc/lookup/v1/rls_config.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | string | `host_patterns` |
| 2 | repeated | string | `path_patterns` |
| 3 | repeated | message grpc.lookup.v1.NameMatcher | `query_parameters` |
| 4 | repeated | message grpc.lookup.v1.NameMatcher | `headers` |
| 5 | repeated | message grpc.lookup.v1.HttpKeyBuilder.ConstantKeysEntry | `constant_keys` |

### RouteLookupConfig  (src/proto/grpc/lookup/v1/rls_config.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message grpc.lookup.v1.HttpKeyBuilder | `http_keybuilders` |
| 2 | repeated | message grpc.lookup.v1.GrpcKeyBuilder | `grpc_keybuilders` |
| 3 | optional | string | `lookup_service` |
| 4 | optional | message google.protobuf.Duration | `lookup_service_timeout` |
| 5 | optional | message google.protobuf.Duration | `max_age` |
| 6 | optional | message google.protobuf.Duration | `stale_age` |
| 7 | optional | int64 | `cache_size_bytes` |
| 8 | repeated | string | `valid_targets` |
| 9 | optional | string | `default_target` |

### RouteLookupClusterSpecifier  (src/proto/grpc/lookup/v1/rls_config.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message grpc.lookup.v1.RouteLookupConfig | `route_lookup_config` |

### TimePosition  (time_position.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | double | `srcTimeMs` |
| 2 | optional | double | `srcRepeatTimeMs` |
| 3 | optional | double | `mediaTimeMs` |

### MigrateAnnotation  (udpa/annotations/migrate.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `rename` |

### FieldMigrateAnnotation  (udpa/annotations/migrate.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `rename` |
| 2 | optional | string | `oneof_promotion` |

### FileMigrateAnnotation  (udpa/annotations/migrate.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 2 | optional | string | `move_to_package` |

### FieldSecurityAnnotation  (udpa/annotations/security.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `configure_for_untrusted_downstream` |
| 2 | optional | bool | `configure_for_untrusted_upstream` |

### StatusAnnotation  (udpa/annotations/status.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `work_in_progress` |
| 2 | optional | enum udpa.annotations.PackageVersionStatus | `package_version_status` |

### VersioningAnnotation  (udpa/annotations/versioning.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `previous_message_type` |

### FieldRules  (validate/validate.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 17 | optional | message validate.MessageRules | `message` |
| 1 | optional | message validate.FloatRules | `float` |
| 2 | optional | message validate.DoubleRules | `double` |
| 3 | optional | message validate.Int32Rules | `int32` |
| 4 | optional | message validate.Int64Rules | `int64` |
| 5 | optional | message validate.UInt32Rules | `uint32` |
| 6 | optional | message validate.UInt64Rules | `uint64` |
| 7 | optional | message validate.SInt32Rules | `sint32` |
| 8 | optional | message validate.SInt64Rules | `sint64` |
| 9 | optional | message validate.Fixed32Rules | `fixed32` |
| 10 | optional | message validate.Fixed64Rules | `fixed64` |
| 11 | optional | message validate.SFixed32Rules | `sfixed32` |
| 12 | optional | message validate.SFixed64Rules | `sfixed64` |
| 13 | optional | message validate.BoolRules | `bool` |
| 14 | optional | message validate.StringRules | `string` |
| 15 | optional | message validate.BytesRules | `bytes` |
| 16 | optional | message validate.EnumRules | `enum` |
| 18 | optional | message validate.RepeatedRules | `repeated` |
| 19 | optional | message validate.MapRules | `map` |
| 20 | optional | message validate.AnyRules | `any` |
| 21 | optional | message validate.DurationRules | `duration` |
| 22 | optional | message validate.TimestampRules | `timestamp` |

### FloatRules  (validate/validate.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | float | `const` |
| 2 | optional | float | `lt` |
| 3 | optional | float | `lte` |
| 4 | optional | float | `gt` |
| 5 | optional | float | `gte` |
| 6 | repeated | float | `in` |
| 7 | repeated | float | `not_in` |
| 8 | optional | bool | `ignore_empty` |

### DoubleRules  (validate/validate.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | double | `const` |
| 2 | optional | double | `lt` |
| 3 | optional | double | `lte` |
| 4 | optional | double | `gt` |
| 5 | optional | double | `gte` |
| 6 | repeated | double | `in` |
| 7 | repeated | double | `not_in` |
| 8 | optional | bool | `ignore_empty` |

### Int32Rules  (validate/validate.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `const` |
| 2 | optional | int32 | `lt` |
| 3 | optional | int32 | `lte` |
| 4 | optional | int32 | `gt` |
| 5 | optional | int32 | `gte` |
| 6 | repeated | int32 | `in` |
| 7 | repeated | int32 | `not_in` |
| 8 | optional | bool | `ignore_empty` |

### Int64Rules  (validate/validate.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int64 | `const` |
| 2 | optional | int64 | `lt` |
| 3 | optional | int64 | `lte` |
| 4 | optional | int64 | `gt` |
| 5 | optional | int64 | `gte` |
| 6 | repeated | int64 | `in` |
| 7 | repeated | int64 | `not_in` |
| 8 | optional | bool | `ignore_empty` |

### UInt32Rules  (validate/validate.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | uint32 | `const` |
| 2 | optional | uint32 | `lt` |
| 3 | optional | uint32 | `lte` |
| 4 | optional | uint32 | `gt` |
| 5 | optional | uint32 | `gte` |
| 6 | repeated | uint32 | `in` |
| 7 | repeated | uint32 | `not_in` |
| 8 | optional | bool | `ignore_empty` |

### UInt64Rules  (validate/validate.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | uint64 | `const` |
| 2 | optional | uint64 | `lt` |
| 3 | optional | uint64 | `lte` |
| 4 | optional | uint64 | `gt` |
| 5 | optional | uint64 | `gte` |
| 6 | repeated | uint64 | `in` |
| 7 | repeated | uint64 | `not_in` |
| 8 | optional | bool | `ignore_empty` |

### SInt32Rules  (validate/validate.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | sint32 | `const` |
| 2 | optional | sint32 | `lt` |
| 3 | optional | sint32 | `lte` |
| 4 | optional | sint32 | `gt` |
| 5 | optional | sint32 | `gte` |
| 6 | repeated | sint32 | `in` |
| 7 | repeated | sint32 | `not_in` |
| 8 | optional | bool | `ignore_empty` |

### SInt64Rules  (validate/validate.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | sint64 | `const` |
| 2 | optional | sint64 | `lt` |
| 3 | optional | sint64 | `lte` |
| 4 | optional | sint64 | `gt` |
| 5 | optional | sint64 | `gte` |
| 6 | repeated | sint64 | `in` |
| 7 | repeated | sint64 | `not_in` |
| 8 | optional | bool | `ignore_empty` |

### Fixed32Rules  (validate/validate.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | fixed32 | `const` |
| 2 | optional | fixed32 | `lt` |
| 3 | optional | fixed32 | `lte` |
| 4 | optional | fixed32 | `gt` |
| 5 | optional | fixed32 | `gte` |
| 6 | repeated | fixed32 | `in` |
| 7 | repeated | fixed32 | `not_in` |
| 8 | optional | bool | `ignore_empty` |

### Fixed64Rules  (validate/validate.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | fixed64 | `const` |
| 2 | optional | fixed64 | `lt` |
| 3 | optional | fixed64 | `lte` |
| 4 | optional | fixed64 | `gt` |
| 5 | optional | fixed64 | `gte` |
| 6 | repeated | fixed64 | `in` |
| 7 | repeated | fixed64 | `not_in` |
| 8 | optional | bool | `ignore_empty` |

### SFixed32Rules  (validate/validate.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | sfixed32 | `const` |
| 2 | optional | sfixed32 | `lt` |
| 3 | optional | sfixed32 | `lte` |
| 4 | optional | sfixed32 | `gt` |
| 5 | optional | sfixed32 | `gte` |
| 6 | repeated | sfixed32 | `in` |
| 7 | repeated | sfixed32 | `not_in` |
| 8 | optional | bool | `ignore_empty` |

### SFixed64Rules  (validate/validate.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | sfixed64 | `const` |
| 2 | optional | sfixed64 | `lt` |
| 3 | optional | sfixed64 | `lte` |
| 4 | optional | sfixed64 | `gt` |
| 5 | optional | sfixed64 | `gte` |
| 6 | repeated | sfixed64 | `in` |
| 7 | repeated | sfixed64 | `not_in` |
| 8 | optional | bool | `ignore_empty` |

### BoolRules  (validate/validate.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `const` |

### StringRules  (validate/validate.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `const` |
| 19 | optional | uint64 | `len` |
| 2 | optional | uint64 | `min_len` |
| 3 | optional | uint64 | `max_len` |
| 20 | optional | uint64 | `len_bytes` |
| 4 | optional | uint64 | `min_bytes` |
| 5 | optional | uint64 | `max_bytes` |
| 6 | optional | string | `pattern` |
| 7 | optional | string | `prefix` |
| 8 | optional | string | `suffix` |
| 9 | optional | string | `contains` |
| 23 | optional | string | `not_contains` |
| 10 | repeated | string | `in` |
| 11 | repeated | string | `not_in` |
| 12 | optional | bool | `email` |
| 13 | optional | bool | `hostname` |
| 14 | optional | bool | `ip` |
| 15 | optional | bool | `ipv4` |
| 16 | optional | bool | `ipv6` |
| 17 | optional | bool | `uri` |
| 18 | optional | bool | `uri_ref` |
| 21 | optional | bool | `address` |
| 22 | optional | bool | `uuid` |
| 24 | optional | enum validate.KnownRegex | `well_known_regex` |
| 25 | optional | bool | `strict` |
| 26 | optional | bool | `ignore_empty` |

### BytesRules  (validate/validate.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bytes | `const` |
| 13 | optional | uint64 | `len` |
| 2 | optional | uint64 | `min_len` |
| 3 | optional | uint64 | `max_len` |
| 4 | optional | string | `pattern` |
| 5 | optional | bytes | `prefix` |
| 6 | optional | bytes | `suffix` |
| 7 | optional | bytes | `contains` |
| 8 | repeated | bytes | `in` |
| 9 | repeated | bytes | `not_in` |
| 10 | optional | bool | `ip` |
| 11 | optional | bool | `ipv4` |
| 12 | optional | bool | `ipv6` |
| 14 | optional | bool | `ignore_empty` |

### EnumRules  (validate/validate.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | int32 | `const` |
| 2 | optional | bool | `defined_only` |
| 3 | repeated | int32 | `in` |
| 4 | repeated | int32 | `not_in` |

### MessageRules  (validate/validate.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `skip` |
| 2 | optional | bool | `required` |

### RepeatedRules  (validate/validate.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | uint64 | `min_items` |
| 2 | optional | uint64 | `max_items` |
| 3 | optional | bool | `unique` |
| 4 | optional | message validate.FieldRules | `items` |
| 5 | optional | bool | `ignore_empty` |

### MapRules  (validate/validate.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | uint64 | `min_pairs` |
| 2 | optional | uint64 | `max_pairs` |
| 3 | optional | bool | `no_sparse` |
| 4 | optional | message validate.FieldRules | `keys` |
| 5 | optional | message validate.FieldRules | `values` |
| 6 | optional | bool | `ignore_empty` |

### AnyRules  (validate/validate.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `required` |
| 2 | repeated | string | `in` |
| 3 | repeated | string | `not_in` |

### DurationRules  (validate/validate.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `required` |
| 2 | optional | message google.protobuf.Duration | `const` |
| 3 | optional | message google.protobuf.Duration | `lt` |
| 4 | optional | message google.protobuf.Duration | `lte` |
| 5 | optional | message google.protobuf.Duration | `gt` |
| 6 | optional | message google.protobuf.Duration | `gte` |
| 7 | repeated | message google.protobuf.Duration | `in` |
| 8 | repeated | message google.protobuf.Duration | `not_in` |

### TimestampRules  (validate/validate.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `required` |
| 2 | optional | message google.protobuf.Timestamp | `const` |
| 3 | optional | message google.protobuf.Timestamp | `lt` |
| 4 | optional | message google.protobuf.Timestamp | `lte` |
| 5 | optional | message google.protobuf.Timestamp | `gt` |
| 6 | optional | message google.protobuf.Timestamp | `gte` |
| 7 | optional | bool | `lt_now` |
| 8 | optional | bool | `gt_now` |
| 9 | optional | message google.protobuf.Duration | `within` |

### WindowCropInfo  (window_crop_info.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | uint32 | `src_width` |
| 2 | optional | uint32 | `src_height` |
| 3 | optional | uint32 | `dst_width` |
| 4 | optional | uint32 | `dst_height` |
| 5 | optional | int32 | `crop_offset_x` |
| 6 | optional | int32 | `crop_offset_y` |

### FileStatusAnnotation  (xds/annotations/v3/status.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `work_in_progress` |

### MessageStatusAnnotation  (xds/annotations/v3/status.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `work_in_progress` |

### FieldStatusAnnotation  (xds/annotations/v3/status.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `work_in_progress` |

### StatusAnnotation  (xds/annotations/v3/status.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | bool | `work_in_progress` |
| 2 | optional | enum xds.annotations.v3.PackageVersionStatus | `package_version_status` |

### Authority  (xds/core/v3/authority.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |

### CollectionEntry  (xds/core/v3/collection_entry.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message xds.core.v3.ResourceLocator | `locator` |
| 2 | optional | message xds.core.v3.CollectionEntry.InlineEntry | `inline_entry` |

### ContextParams  (xds/core/v3/context_params.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message xds.core.v3.ContextParams.ParamsEntry | `params` |

### TypedExtensionConfig  (xds/core/v3/extension.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `name` |
| 2 | optional | message google.protobuf.Any | `typed_config` |

### ResourceLocator  (xds/core/v3/resource_locator.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | enum xds.core.v3.ResourceLocator.Scheme | `scheme` |
| 2 | optional | string | `id` |
| 3 | optional | string | `authority` |
| 4 | optional | string | `resource_type` |
| 5 | optional | message xds.core.v3.ContextParams | `exact_context` |
| 6 | repeated | message xds.core.v3.ResourceLocator.Directive | `directives` |

### Matcher  (xds/type/matcher/v3/matcher.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message xds.type.matcher.v3.Matcher.MatcherList | `matcher_list` |
| 2 | optional | message xds.type.matcher.v3.Matcher.MatcherTree | `matcher_tree` |
| 3 | optional | message xds.type.matcher.v3.Matcher.OnMatch | `on_no_match` |

### RegexMatcher  (xds/type/matcher/v3/regex.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | message xds.type.matcher.v3.RegexMatcher.GoogleRE2 | `google_re2` |
| 2 | optional | string | `regex` |

### StringMatcher  (xds/type/matcher/v3/string.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | optional | string | `exact` |
| 2 | optional | string | `prefix` |
| 3 | optional | string | `suffix` |
| 5 | optional | message xds.type.matcher.v3.RegexMatcher | `safe_regex` |
| 7 | optional | string | `contains` |
| 6 | optional | bool | `ignore_case` |

### ListStringMatcher  (xds/type/matcher/v3/string.proto)

| # | label | type | name |
| --- | --- | --- | --- |
| 1 | repeated | message xds.type.matcher.v3.StringMatcher | `patterns` |
