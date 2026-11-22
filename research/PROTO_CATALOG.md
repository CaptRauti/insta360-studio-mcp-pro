# Protobuf-Schema-Katalog (aus studio_worker.dll)

124 Descriptor-Dateien, extrahiert aus den eingebetteten FileDescriptorProto-Blobs.

**Summe:** 569 Messages, 64 Enums, 5 Services

## `CubePlaylist.proto`
package `bmg` · syntax `proto3`

### Message `AVRational`
- 1: `num` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `den` TYPE_INT32 [LABEL_OPTIONAL]

### Message `DynsVideoLayerTiled`
- 1: `resizeRate` TYPE_STRING [LABEL_OPTIONAL]
- 2: `sliceGridCol` TYPE_INT32 [LABEL_OPTIONAL]
- 3: `sliceGridRow` TYPE_INT32 [LABEL_OPTIONAL]
- 4: `bitrate` TYPE_INT64 [LABEL_OPTIONAL]

### Message `DynsVideoLayerNormal`
- 1: `projectionType` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `width` TYPE_INT32 [LABEL_OPTIONAL]
- 3: `height` TYPE_INT32 [LABEL_OPTIONAL]
- 4: `bitrate` TYPE_INT64 [LABEL_OPTIONAL]

### Message `BaseVideoConfig`
- 1: `enableEac` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `cubeWidthExtend` TYPE_INT32 [LABEL_OPTIONAL]
- 3: `hasAudio` TYPE_BOOL [LABEL_OPTIONAL]
- 4: `panoWidth` TYPE_INT32 [LABEL_OPTIONAL]
- 5: `durationMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 6: `framerate` TYPE_MESSAGE (bmg.AVRational) [LABEL_OPTIONAL]

### Message `TiledVideoConfig`
- 1: `sliceOverlap` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `sliceWidth` TYPE_INT32 [LABEL_OPTIONAL]
- 3: `pyramidLayers` TYPE_MESSAGE (bmg.DynsVideoLayerTiled) [LABEL_REPEATED]

### Message `BackgroundVideoConfig`
- 1: `layers` TYPE_MESSAGE (bmg.DynsVideoLayerNormal) [LABEL_REPEATED]

### Message `PlayConfig`
- 1: `baseVideoConfig` TYPE_MESSAGE (bmg.BaseVideoConfig) [LABEL_OPTIONAL]
- 2: `tileVideoConfig` TYPE_MESSAGE (bmg.TiledVideoConfig) [LABEL_OPTIONAL]
- 3: `backgroundVideoConfig` TYPE_MESSAGE (bmg.BackgroundVideoConfig) [LABEL_OPTIONAL]

### Message `CubePlaylist`
- 1: `serverUrls` TYPE_BYTES [LABEL_OPTIONAL]
- 2: `playConfig` TYPE_MESSAGE (bmg.PlayConfig) [LABEL_OPTIONAL]

## `ExportModule.proto`
package `service.Export` · syntax `proto3`

### Service `Export`
- `StartExporting`(service.Export.ExportRequest) → service.Export.ExportReply
- `ExporterCancel`(service.Export.CancelInfo) → service.Export.CancelInfo
- `SendHeartBeatPackage`(service.Export.HeartBeat) → service.Export.HeartBeat

### Message `DownloadRequest`
- 1: `task_id` TYPE_STRING [LABEL_OPTIONAL]
- 2: `source_url` TYPE_STRING [LABEL_REPEATED]
- 3: `dest_path` TYPE_STRING [LABEL_REPEATED]
- 4: `start_time_ms` TYPE_DOUBLE [LABEL_OPTIONAL]
- 5: `end_time_ms` TYPE_DOUBLE [LABEL_OPTIONAL]
- 6: `need_decode_key_frame` TYPE_BOOL [LABEL_OPTIONAL]
- 7: `video_tracks_count` TYPE_UINT32 [LABEL_OPTIONAL]

### Message `DownloadReply`
- 1: `task_id` TYPE_STRING [LABEL_OPTIONAL]
- 2: `download_progress` TYPE_FLOAT [LABEL_OPTIONAL]
- 3: `state_code` TYPE_INT32 [LABEL_OPTIONAL]
- 4: `err_code` TYPE_INT32 [LABEL_OPTIONAL]
- 5: `err_info` TYPE_STRING [LABEL_OPTIONAL]

### Message `TaskList`
- 1: `task_ids` TYPE_STRING [LABEL_REPEATED]

### Message `OperStatus`
- 1: `result` TYPE_BOOL [LABEL_OPTIONAL]

### Message `HeartBeat`
- 1: `count` TYPE_INT64 [LABEL_OPTIONAL]
- 2: `exit_app` TYPE_BOOL [LABEL_OPTIONAL]

### Message `LoopVideoInfo`
- 1: `is_loop_video` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `is_loop_video_group` TYPE_BOOL [LABEL_OPTIONAL]
- 3: `is_57k_loop_video_group` TYPE_BOOL [LABEL_OPTIONAL]

### Message `SourceGroup`
- 1: `sourceFile` TYPE_STRING [LABEL_REPEATED]
- 2: `fileName` TYPE_STRING [LABEL_REPEATED]
- 3: `is_dng_group` TYPE_BOOL [LABEL_OPTIONAL]
- 4: `source_group_type` TYPE_INT32 [LABEL_OPTIONAL]
- 5: `group_identifier` TYPE_STRING [LABEL_OPTIONAL]
- 6: `group_name` TYPE_STRING [LABEL_OPTIONAL]
- 7: `group_start_index` TYPE_INT32 [LABEL_OPTIONAL]
- 8: `loop_video_info` TYPE_MESSAGE (service.Export.LoopVideoInfo) [LABEL_OPTIONAL]
- 9: `associated_files` TYPE_STRING [LABEL_REPEATED]
- 10: `pano_fpv_data_path` TYPE_STRING [LABEL_OPTIONAL]
- 11: `still_quat_file_path` TYPE_STRING [LABEL_OPTIONAL]
- 12: `immersion_quat_file_path` TYPE_STRING [LABEL_OPTIONAL]

### Message `BgmClip`
- 1: `url` TYPE_STRING [LABEL_OPTIONAL]
- 2: `position_in_media_time_ms` TYPE_DOUBLE [LABEL_OPTIONAL]
- 3: `start_src_time_ms` TYPE_DOUBLE [LABEL_OPTIONAL]
- 4: `end_src_time_ms` TYPE_DOUBLE [LABEL_OPTIONAL]
- 5: `volume` TYPE_DOUBLE [LABEL_OPTIONAL]
- 6: `afade_in_duration_ms` TYPE_DOUBLE [LABEL_OPTIONAL]
- 7: `afade_out_duration_ms` TYPE_DOUBLE [LABEL_OPTIONAL]
- 8: `total_src_duration_ms` TYPE_DOUBLE [LABEL_OPTIONAL]
- 9: `music_id` TYPE_STRING [LABEL_OPTIONAL]

### Message `TextParam`
- 1: `text` TYPE_STRING [LABEL_OPTIONAL]
- 2: `color` TYPE_STRING [LABEL_OPTIONAL]
- 3: `font` TYPE_STRING [LABEL_OPTIONAL]
- 4: `font_size` TYPE_INT64 [LABEL_OPTIONAL]
- 5: `strokeable` TYPE_BOOL [LABEL_OPTIONAL]
- 6: `stroke_color` TYPE_STRING [LABEL_OPTIONAL]
- 7: `stroke_size` TYPE_INT64 [LABEL_OPTIONAL]

### Message `PositionParam`
- 1: `x` TYPE_DOUBLE [LABEL_OPTIONAL]
- 2: `y` TYPE_DOUBLE [LABEL_OPTIONAL]
- 3: `rotation` TYPE_DOUBLE [LABEL_OPTIONAL]
- 4: `scale` TYPE_DOUBLE [LABEL_OPTIONAL]
- 5: `canvas_ratio` TYPE_DOUBLE [LABEL_OPTIONAL]

### Message `TextClip`
- 1: `text_params` TYPE_MESSAGE (service.Export.TextParam) [LABEL_REPEATED]
- 2: `position_param` TYPE_MESSAGE (service.Export.PositionParam) [LABEL_OPTIONAL]
- 3: `url` TYPE_STRING [LABEL_OPTIONAL]
- 4: `start_ms` TYPE_DOUBLE [LABEL_OPTIONAL]
- 5: `duration_ms` TYPE_DOUBLE [LABEL_OPTIONAL]
- 6: `id` TYPE_STRING [LABEL_OPTIONAL]
- 7: `effect_id` TYPE_STRING [LABEL_OPTIONAL]

### Message `StickerClip`
- 1: `position_param` TYPE_MESSAGE (service.Export.PositionParam) [LABEL_OPTIONAL]
- 2: `url` TYPE_STRING [LABEL_OPTIONAL]
- 3: `start_ms` TYPE_DOUBLE [LABEL_OPTIONAL]
- 4: `duration_ms` TYPE_DOUBLE [LABEL_OPTIONAL]
- 5: `id` TYPE_STRING [LABEL_OPTIONAL]
- 6: `effect_id` TYPE_STRING [LABEL_OPTIONAL]
- 7: `horizontal_flip` TYPE_BOOL [LABEL_OPTIONAL]
- 8: `vertical_flip` TYPE_BOOL [LABEL_OPTIONAL]
- 9: `in_animation_id` TYPE_STRING [LABEL_OPTIONAL]
- 10: `in_animation_duration_ms` TYPE_INT32 [LABEL_OPTIONAL]
- 11: `out_animation_id` TYPE_STRING [LABEL_OPTIONAL]
- 12: `out_animation_duration_ms` TYPE_INT32 [LABEL_OPTIONAL]
- 13: `period_animation_id` TYPE_STRING [LABEL_OPTIONAL]
- 14: `period_animation_duration_ms` TYPE_INT32 [LABEL_OPTIONAL]

### Message `AudioSettings`
- 1: `clipAudioMode` TYPE_ENUM (service.Export.AudioSettings.ClipAudioMode) [LABEL_OPTIONAL]

### Message `BulletTimeViewParam`
- 1: `fov` TYPE_FLOAT [LABEL_OPTIONAL]
- 2: `distance` TYPE_FLOAT [LABEL_OPTIONAL]

### Message `FrameRate`
- 1: `den` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `num` TYPE_INT32 [LABEL_OPTIONAL]

### Message `TimeWaterMark`
- 1: `enable` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `format` TYPE_INT32 [LABEL_OPTIONAL]
- 3: `transparency` TYPE_INT32 [LABEL_OPTIONAL]

### Message `Resolution`
- 1: `width` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `height` TYPE_INT32 [LABEL_OPTIONAL]

### Message `EulerAngle`
- 1: `yaw` TYPE_FLOAT [LABEL_OPTIONAL]
- 2: `pitch` TYPE_FLOAT [LABEL_OPTIONAL]
- 3: `roll` TYPE_FLOAT [LABEL_OPTIONAL]

### Message `ViewData`
- 1: `yaw` TYPE_FLOAT [LABEL_OPTIONAL]
- 2: `pitch` TYPE_FLOAT [LABEL_OPTIONAL]
- 3: `roll` TYPE_FLOAT [LABEL_OPTIONAL]
- 4: `fov` TYPE_FLOAT [LABEL_OPTIONAL]
- 5: `distance` TYPE_FLOAT [LABEL_OPTIONAL]
- 6: `src_time` TYPE_DOUBLE [LABEL_OPTIONAL]
- 7: `key_frame_type` TYPE_ENUM (service.Export.ViewData.KeyFrameType) [LABEL_OPTIONAL]
- 8: `alpha` TYPE_FLOAT [LABEL_OPTIONAL]
- 9: `original_eulers_handled` TYPE_BOOL [LABEL_OPTIONAL]
- 10: `original_euler` TYPE_MESSAGE (service.Export.EulerAngle) [LABEL_OPTIONAL]

### Message `PlayRateSegment`
- 1: `trim_start` TYPE_DOUBLE [LABEL_OPTIONAL]
- 2: `trim_end` TYPE_DOUBLE [LABEL_OPTIONAL]
- 3: `factor` TYPE_DOUBLE [LABEL_OPTIONAL]

### Message `BezierControlPoint`
- 1: `x` TYPE_DOUBLE [LABEL_OPTIONAL]
- 2: `y` TYPE_DOUBLE [LABEL_OPTIONAL]

### Message `TransitionSegment`
- 1: `startKeyFrameId` TYPE_STRING [LABEL_OPTIONAL]
- 2: `endKeyFrameId` TYPE_STRING [LABEL_OPTIONAL]
- 3: `funcType` TYPE_INT32 [LABEL_OPTIONAL]
- 4: `p1` TYPE_MESSAGE (service.Export.BezierControlPoint) [LABEL_OPTIONAL]
- 5: `p2` TYPE_MESSAGE (service.Export.BezierControlPoint) [LABEL_OPTIONAL]

### Message `MovementTemplateData`
- 1: `movement_id` TYPE_STRING [LABEL_OPTIONAL]
- 2: `key_points` TYPE_MESSAGE (service.Export.ViewData) [LABEL_REPEATED]
- 3: `transitions` TYPE_MESSAGE (service.Export.TransitionSegment) [LABEL_REPEATED]
- 4: `start_time` TYPE_INT64 [LABEL_OPTIONAL]
- 5: `end_time` TYPE_INT64 [LABEL_OPTIONAL]
- 6: `movement_name` TYPE_STRING [LABEL_OPTIONAL]

### Message `ViewSegment`
- 2: `id` TYPE_STRING [LABEL_OPTIONAL]
- 1: `type` TYPE_ENUM (service.Export.ViewDataType) [LABEL_OPTIONAL]
- 3: `key_points` TYPE_MESSAGE (service.Export.ViewData) [LABEL_REPEATED]
- 4: `need_report` TYPE_BOOL [LABEL_OPTIONAL]
- 5: `movement_data` TYPE_MESSAGE (service.Export.MovementTemplateData) [LABEL_OPTIONAL]

### Message `CameraMovementSegment`
- 1: `yaw` TYPE_FLOAT [LABEL_OPTIONAL]
- 2: `pitch` TYPE_FLOAT [LABEL_OPTIONAL]
- 3: `roll` TYPE_FLOAT [LABEL_OPTIONAL]
- 4: `fov` TYPE_FLOAT [LABEL_OPTIONAL]
- 5: `distance` TYPE_FLOAT [LABEL_OPTIONAL]
- 6: `visible` TYPE_BOOL [LABEL_OPTIONAL]
- 7: `view_mode` TYPE_INT32 [LABEL_OPTIONAL]

### Message `AppDataInfo`
- 1: `app_data_id` TYPE_STRING [LABEL_OPTIONAL]
- 2: `app_data_source` TYPE_STRING [LABEL_OPTIONAL]
- 3: `app_data_mode` TYPE_STRING [LABEL_OPTIONAL]
- 4: `app_data_ratio` TYPE_STRING [LABEL_OPTIONAL]
- 5: `app_data_types` TYPE_STRING [LABEL_REPEATED]

### Message `TimelineSetting`
- 6: `duration_ms` TYPE_DOUBLE [LABEL_OPTIONAL]
- 1: `trim_start` TYPE_DOUBLE [LABEL_OPTIONAL]
- 2: `trim_end` TYPE_DOUBLE [LABEL_OPTIONAL]
- 8: `media_trim_start` TYPE_DOUBLE [LABEL_OPTIONAL]
- 7: `media_trim_end` TYPE_DOUBLE [LABEL_OPTIONAL]
- 9: `audio_fade_in` TYPE_DOUBLE [LABEL_OPTIONAL]
- 10: `audio_fade_out` TYPE_DOUBLE [LABEL_OPTIONAL]
- 11: `app_data_info` TYPE_MESSAGE (service.Export.AppDataInfo) [LABEL_OPTIONAL]
- 3: `view_segments` TYPE_MESSAGE (service.Export.ViewSegment) [LABEL_REPEATED]
- 4: `play_rate_segments` TYPE_MESSAGE (service.Export.PlayRateSegment) [LABEL_REPEATED]
- 5: `transition_segment` TYPE_MESSAGE (service.Export.TransitionSegment) [LABEL_REPEATED]
- 12: `camera_movement_segment` TYPE_MESSAGE (service.Export.CameraMovementSegment) [LABEL_REPEATED]

### Message `LogoInfo`
- 1: `logo_path` TYPE_STRING [LABEL_OPTIONAL]
- 2: `logo_size` TYPE_FLOAT [LABEL_OPTIONAL]
- 3: `logo_location` TYPE_INT32 [LABEL_OPTIONAL]
- 4: `logo_corner_radius` TYPE_INT32 [LABEL_OPTIONAL]
- 5: `logo_feather` TYPE_INT32 [LABEL_OPTIONAL]
- 6: `logo_rotate` TYPE_INT32 [LABEL_OPTIONAL]

### Message `FlatLogoInfo`
- 1: `flat_logo_path` TYPE_STRING [LABEL_OPTIONAL]
- 2: `flat_logo_transparency` TYPE_INT32 [LABEL_OPTIONAL]
- 3: `flat_logo_location` TYPE_INT32 [LABEL_OPTIONAL]
- 4: `is_cn` TYPE_BOOL [LABEL_OPTIONAL]

### Message `AspectRatio`
- 1: `width_ratio` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `height_ratio` TYPE_INT32 [LABEL_OPTIONAL]

### Message `ColorAdjustSetting`
- 1: `enable_adjustment` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `exposure` TYPE_INT32 [LABEL_OPTIONAL]
- 3: `highlights` TYPE_INT32 [LABEL_OPTIONAL]
- 4: `shadows` TYPE_INT32 [LABEL_OPTIONAL]
- 5: `brightness` TYPE_INT32 [LABEL_OPTIONAL]
- 6: `blackpoint` TYPE_INT32 [LABEL_OPTIONAL]
- 7: `saturation` TYPE_INT32 [LABEL_OPTIONAL]
- 8: `vibrance` TYPE_INT32 [LABEL_OPTIONAL]
- 9: `warmth` TYPE_INT32 [LABEL_OPTIONAL]
- 10: `tint` TYPE_INT32 [LABEL_OPTIONAL]
- 11: `definition` TYPE_INT32 [LABEL_OPTIONAL]
- 12: `contrast` TYPE_INT32 [LABEL_OPTIONAL]

### Message `StitchingSetting`
- 1: `enableStab` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `enableDirectionalLock` TYPE_BOOL [LABEL_OPTIONAL]
- 3: `enableDynamicStitching` TYPE_BOOL [LABEL_OPTIONAL]
- 4: `enableOpticalFlowStitching` TYPE_BOOL [LABEL_OPTIONAL]
- 5: `enableImageFusion` TYPE_BOOL [LABEL_OPTIONAL]
- 6: `enableColorPlus` TYPE_BOOL [LABEL_OPTIONAL]
- 7: `enableUnderWaterCorrection` TYPE_BOOL [LABEL_OPTIONAL]
- 8: `enableLocalToneMap` TYPE_BOOL [LABEL_OPTIONAL]
- 9: `enableMotionBlur` TYPE_BOOL [LABEL_OPTIONAL]
- 10: `enableAudioDirectFocus` TYPE_BOOL [LABEL_OPTIONAL]
- 11: `enableDroneFlag` TYPE_BOOL [LABEL_OPTIONAL]
- 12: `enable_top_mounted_gyro` TYPE_BOOL [LABEL_OPTIONAL]
- 13: `enableColdShoe` TYPE_BOOL [LABEL_OPTIONAL]
- 14: `enableLogo` TYPE_BOOL [LABEL_OPTIONAL]
- 15: `enableRemoveGrain` TYPE_BOOL [LABEL_OPTIONAL]
- 16: `custom_blend_angle` TYPE_FLOAT [LABEL_OPTIONAL]
- 17: `optimizedOffset` TYPE_STRING [LABEL_OPTIONAL]
- 18: `colorPlusStrength` TYPE_INT32 [LABEL_OPTIONAL]
- 19: `ltmStrength` TYPE_INT32 [LABEL_OPTIONAL]
- 20: `underWaterBalance` TYPE_INT32 [LABEL_OPTIONAL]
- 21: `underWaterStrength` TYPE_INT32 [LABEL_OPTIONAL]
- 22: `motion_blur_strength` TYPE_INT32 [LABEL_OPTIONAL]
- 23: `motion_blur_threshold` TYPE_INT32 [LABEL_OPTIONAL]
- 24: `stabilizationType` TYPE_ENUM (service.Export.StabilizationType) [LABEL_OPTIONAL]
- 25: `shellType` TYPE_INT32 [LABEL_OPTIONAL]
- 26: `fovType` TYPE_INT32 [LABEL_OPTIONAL]
- 27: `queryFovType` TYPE_INT32 [LABEL_OPTIONAL]
- 28: `audioDenoiseType` TYPE_INT32 [LABEL_OPTIONAL]
- 29: `user_rotate_degree` TYPE_INT32 [LABEL_OPTIONAL]
- 30: `logo_info` TYPE_MESSAGE (service.Export.LogoInfo) [LABEL_OPTIONAL]
- 31: `bulletTimeViewParam` TYPE_MESSAGE (service.Export.BulletTimeViewParam) [LABEL_OPTIONAL]
- 32: `projection_layout` TYPE_UINT32 [LABEL_OPTIONAL]
- 33: `aspect_ratio` TYPE_MESSAGE (service.Export.AspectRatio) [LABEL_OPTIONAL]
- 34: `dewarp_type` TYPE_ENUM (service.Export.DewarpTypeMode) [LABEL_OPTIONAL]
- 35: `stabIlization_level` TYPE_INT32 [LABEL_OPTIONAL]
- 36: `star_tail_type` TYPE_INT32 [LABEL_OPTIONAL]
- 37: `enable_ai_stitching` TYPE_BOOL [LABEL_OPTIONAL]
- 38: `enable_cooling_shell` TYPE_BOOL [LABEL_OPTIONAL]
- 39: `enable_horizontal_correct` TYPE_BOOL [LABEL_OPTIONAL]
- 40: `horizontal_correct_angle` TYPE_FLOAT [LABEL_OPTIONAL]
- 41: `enable_lut` TYPE_BOOL [LABEL_OPTIONAL]
- 42: `support_lut` TYPE_BOOL [LABEL_OPTIONAL]
- 43: `enable_time_logo` TYPE_BOOL [LABEL_OPTIONAL]
- 44: `time_logo_format` TYPE_INT32 [LABEL_OPTIONAL]
- 45: `time_logo_transparency` TYPE_INT32 [LABEL_OPTIONAL]
- 46: `enable_deghost` TYPE_BOOL [LABEL_OPTIONAL]
- 47: `enable_pano_fpv` TYPE_BOOL [LABEL_OPTIONAL]
- 48: `pano_fpv_horizontal_on` TYPE_BOOL [LABEL_OPTIONAL]
- 49: `underWaterFilterIndex` TYPE_INT32 [LABEL_OPTIONAL]
- 50: `enable_immersive_stab` TYPE_BOOL [LABEL_OPTIONAL]
- 51: `de_version` TYPE_STRING [LABEL_OPTIONAL]
- 52: `stab_input_data_type` TYPE_INT32 [LABEL_OPTIONAL]
- 53: `view_direction` TYPE_INT32 [LABEL_OPTIONAL]
- 54: `enable_head_track` TYPE_BOOL [LABEL_OPTIONAL]
- 55: `enable_camera_movement` TYPE_BOOL [LABEL_OPTIONAL]
- 56: `propeller_guard_status` TYPE_INT32 [LABEL_OPTIONAL]
- 57: `enable_beauty_mode` TYPE_BOOL [LABEL_OPTIONAL]
- 58: `has_head_track_keyframe` TYPE_BOOL [LABEL_OPTIONAL]
- 59: `enableFlatLogo` TYPE_BOOL [LABEL_OPTIONAL]
- 60: `flat_logo_info` TYPE_MESSAGE (service.Export.FlatLogoInfo) [LABEL_OPTIONAL]
- 61: `extern_filter_resource_path` TYPE_STRING [LABEL_OPTIONAL]
- 62: `extern_filter_opacity` TYPE_FLOAT [LABEL_OPTIONAL]
- 63: `enable_main_window` TYPE_BOOL [LABEL_OPTIONAL]
- 64: `view_category_filter` TYPE_INT32 [LABEL_OPTIONAL]

### Message `DashBoardSetting`
- 1: `style_uuid` TYPE_STRING [LABEL_OPTIONAL]
- 2: `dashboard_xml_data` TYPE_STRING [LABEL_OPTIONAL]

### Message `SrcTimeMsISOPair`
- 1: `src_time_ms` TYPE_FLOAT [LABEL_OPTIONAL]
- 2: `iso` TYPE_FLOAT [LABEL_OPTIONAL]

### Message `UserSettings`
- 1: `is_free_capture` TYPE_BOOL [LABEL_OPTIONAL]
- 3: `remove_grain_enabled` TYPE_BOOL [LABEL_OPTIONAL]
- 4: `remove_grain_block_enabled` TYPE_BOOL [LABEL_OPTIONAL]
- 5: `enable_dashboard` TYPE_BOOL [LABEL_OPTIONAL]
- 6: `noise_level` TYPE_FLOAT [LABEL_OPTIONAL]
- 7: `src_time_ms_iso_pairs` TYPE_MESSAGE (service.Export.SrcTimeMsISOPair) [LABEL_REPEATED]
- 8: `is_silent` TYPE_BOOL [LABEL_OPTIONAL]
- 9: `ai_raw_enable` TYPE_BOOL [LABEL_OPTIONAL]
- 10: `custom_transform_param` TYPE_MESSAGE (service.Export.ViewData) [LABEL_OPTIONAL]
- 11: `audio_volume` TYPE_FLOAT [LABEL_OPTIONAL]
- 12: `interpolation_type` TYPE_ENUM (service.Export.InterpolationType) [LABEL_OPTIONAL]
- 13: `dolby_vision_enabled` TYPE_BOOL [LABEL_OPTIONAL]
- 14: `enable_audio_mixing` TYPE_BOOL [LABEL_OPTIONAL]
- 15: `audio_mixing_weight` TYPE_DOUBLE [LABEL_OPTIONAL]
- 16: `audio_tracks_delay` TYPE_INT32 [LABEL_OPTIONAL]
- 17: `audio_trasks_default_delay` TYPE_INT32 [LABEL_OPTIONAL]
- 18: `extra_transform` TYPE_MESSAGE (service.Export.ViewData) [LABEL_OPTIONAL]
- 19: `show_dashboard_real_distance` TYPE_BOOL [LABEL_OPTIONAL]

### Message `Quaternion`
- 1: `w` TYPE_FLOAT [LABEL_OPTIONAL]
- 2: `x` TYPE_FLOAT [LABEL_OPTIONAL]
- 3: `y` TYPE_FLOAT [LABEL_OPTIONAL]
- 4: `z` TYPE_FLOAT [LABEL_OPTIONAL]

### Message `ImageExportParam`
- 1: `view_mode` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `interval_merge_stab_type` TYPE_ENUM (service.Export.ImageExportParam.IntervalMergeStabType) [LABEL_OPTIONAL]
- 3: `duration` TYPE_DOUBLE [LABEL_OPTIONAL]
- 4: `start_in_second` TYPE_DOUBLE [LABEL_OPTIONAL]
- 5: `video_clip_id` TYPE_INT64 [LABEL_OPTIONAL]
- 6: `quaternions` TYPE_MESSAGE (service.Export.Quaternion) [LABEL_REPEATED]

### Message `ObjectState`
- 1: `timestamp_ms` TYPE_INT64 [LABEL_OPTIONAL]
- 6: `bigboom_quaternions` TYPE_MESSAGE (service.Export.Quaternion) [LABEL_OPTIONAL]

### Message `DetectedObject`
- 1: `target_id` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `target_name` TYPE_STRING [LABEL_OPTIONAL]
- 3: `target_show_count` TYPE_INT32 [LABEL_OPTIONAL]
- 4: `first_show_ms` TYPE_INT64 [LABEL_OPTIONAL]
- 5: `last_show_ms` TYPE_INT64 [LABEL_OPTIONAL]
- 6: `object_states` TYPE_MESSAGE (service.Export.ObjectState) [LABEL_REPEATED]

### Message `GpsData`
- 1: `real_timestamp` TYPE_INT64 [LABEL_OPTIONAL]
- 2: `real_speed` TYPE_DOUBLE [LABEL_OPTIONAL]
- 3: `real_altitude` TYPE_DOUBLE [LABEL_OPTIONAL]
- 4: `current_distance` TYPE_DOUBLE [LABEL_OPTIONAL]
- 5: `real_slope` TYPE_DOUBLE [LABEL_OPTIONAL]
- 6: `real_longitude` TYPE_DOUBLE [LABEL_OPTIONAL]
- 7: `real_latitude` TYPE_DOUBLE [LABEL_OPTIONAL]
- 8: `real_course` TYPE_DOUBLE [LABEL_OPTIONAL]
- 9: `longitude_direction` TYPE_ENUM (service.Export.LongitudeDirection) [LABEL_OPTIONAL]
- 10: `latitude_direction` TYPE_ENUM (service.Export.LatitudeDirection) [LABEL_OPTIONAL]

### Message `GpsInfo`
- 1: `export_gps` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `gps_data` TYPE_MESSAGE (service.Export.GpsData) [LABEL_REPEATED]
- 3: `max_latitude` TYPE_DOUBLE [LABEL_OPTIONAL]
- 4: `min_latitude` TYPE_DOUBLE [LABEL_OPTIONAL]
- 5: `max_longitude` TYPE_DOUBLE [LABEL_OPTIONAL]
- 6: `min_longitude` TYPE_DOUBLE [LABEL_OPTIONAL]
- 7: `first_gps_time_stamp` TYPE_INT64 [LABEL_OPTIONAL]

### Message `CutSceneSetting`
- 1: `has_cut_scene` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `end_cut_duration_ms` TYPE_INT64 [LABEL_OPTIONAL]
- 3: `transition_file_path` TYPE_STRING [LABEL_OPTIONAL]
- 4: `end_cut_source_duration_ms` TYPE_INT64 [LABEL_OPTIONAL]
- 5: `is_meishe` TYPE_BOOL [LABEL_OPTIONAL]
- 6: `start_view_data` TYPE_MESSAGE (service.Export.ViewData) [LABEL_OPTIONAL]
- 7: `end_view_data` TYPE_MESSAGE (service.Export.ViewData) [LABEL_OPTIONAL]
- 8: `effect_id` TYPE_STRING [LABEL_OPTIONAL]

### Message `ClipInfo`
- 1: `sourceGroup` TYPE_MESSAGE (service.Export.SourceGroup) [LABEL_OPTIONAL]
- 2: `timelineSetting` TYPE_MESSAGE (service.Export.TimelineSetting) [LABEL_OPTIONAL]
- 3: `stitchingSetting` TYPE_MESSAGE (service.Export.StitchingSetting) [LABEL_OPTIONAL]
- 4: `dashBoardSetting` TYPE_MESSAGE (service.Export.DashBoardSetting) [LABEL_OPTIONAL]
- 5: `AudioSettings` TYPE_MESSAGE (service.Export.AudioSettings) [LABEL_OPTIONAL]
- 6: `user_settings` TYPE_MESSAGE (service.Export.UserSettings) [LABEL_OPTIONAL]
- 7: `image_export_param` TYPE_MESSAGE (service.Export.ImageExportParam) [LABEL_OPTIONAL]
- 8: `file_type` TYPE_ENUM (service.Export.SourceFileType) [LABEL_OPTIONAL]
- 9: `bigboom_object` TYPE_MESSAGE (service.Export.DetectedObject) [LABEL_OPTIONAL]
- 10: `gps_info` TYPE_MESSAGE (service.Export.GpsInfo) [LABEL_OPTIONAL]
- 11: `cut_scene_setting` TYPE_MESSAGE (service.Export.CutSceneSetting) [LABEL_OPTIONAL]
- 12: `is_cloud_footage` TYPE_BOOL [LABEL_OPTIONAL]
- 13: `file_tail_url` TYPE_STRING [LABEL_OPTIONAL]
- 14: `video_info_json` TYPE_STRING [LABEL_OPTIONAL]
- 15: `cloud_preview_url` TYPE_STRING [LABEL_OPTIONAL]
- 16: `source_file_name` TYPE_STRING [LABEL_OPTIONAL]
- 17: `addition_info` TYPE_MESSAGE (service.Export.AdditionInfo) [LABEL_OPTIONAL]
- 18: `clip_model_url` TYPE_STRING [LABEL_OPTIONAL]
- 19: `is_pano_source` TYPE_BOOL [LABEL_OPTIONAL]
- 20: `color_adjust_setting` TYPE_MESSAGE (service.Export.ColorAdjustSetting) [LABEL_OPTIONAL]
- 21: `time_water_mark` TYPE_MESSAGE (service.Export.TimeWaterMark) [LABEL_OPTIONAL]
- 22: `is_rough_trimmed` TYPE_BOOL [LABEL_OPTIONAL]
- 23: `time_code` TYPE_STRING [LABEL_OPTIONAL]
- 24: `dashboard_id` TYPE_STRING [LABEL_OPTIONAL]
- 25: `loop_video_segment_durations_ms` TYPE_INT64 [LABEL_REPEATED]
- 26: `media_info_json` TYPE_STRING [LABEL_OPTIONAL]

### Message `ExportClipInfo`
- 1: `clipInfos` TYPE_MESSAGE (service.Export.ClipInfo) [LABEL_REPEATED]
- 2: `bgm_clip` TYPE_MESSAGE (service.Export.BgmClip) [LABEL_REPEATED]
- 3: `text_clips` TYPE_MESSAGE (service.Export.TextClip) [LABEL_REPEATED]
- 4: `sticker_clips` TYPE_MESSAGE (service.Export.StickerClip) [LABEL_REPEATED]

### Message `HardWareInfo`
- 1: `is_amd_graphics_card` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `amd_card_support_h264_full_range` TYPE_BOOL [LABEL_OPTIONAL]
- 3: `amd_card_support_h265_full_range` TYPE_BOOL [LABEL_OPTIONAL]

### Message `ExportParam`
- 1: `path` TYPE_STRING [LABEL_OPTIONAL]
- 2: `dest_dir` TYPE_STRING [LABEL_OPTIONAL]
- 3: `export_type` TYPE_INT32 [LABEL_OPTIONAL]
- 4: `res` TYPE_MESSAGE (service.Export.Resolution) [LABEL_OPTIONAL]
- 5: `frame_rate` TYPE_MESSAGE (service.Export.FrameRate) [LABEL_OPTIONAL]
- 6: `encode_type` TYPE_ENUM (service.Export.EncodeType) [LABEL_OPTIONAL]
- 7: `encode_bitrate` TYPE_INT64 [LABEL_OPTIONAL]
- 8: `meta_data_make` TYPE_STRING [LABEL_OPTIONAL]
- 9: `meta_data_model` TYPE_STRING [LABEL_OPTIONAL]
- 10: `meta_data_comment` TYPE_STRING [LABEL_OPTIONAL]
- 11: `is_spherical` TYPE_BOOL [LABEL_OPTIONAL]
- 12: `request_from_multiple_clip` TYPE_BOOL [LABEL_OPTIONAL]
- 13: `enable_video_denoise` TYPE_BOOL [LABEL_OPTIONAL]
- 14: `has_audio` TYPE_BOOL [LABEL_OPTIONAL]
- 15: `support_audio` TYPE_BOOL [LABEL_OPTIONAL]
- 16: `image_processing_accel` TYPE_ENUM (service.Export.ImageProcessingAccel) [LABEL_OPTIONAL]
- 17: `hardware_info` TYPE_MESSAGE (service.Export.HardWareInfo) [LABEL_OPTIONAL]
- 18: `proxy_type` TYPE_STRING [LABEL_OPTIONAL]
- 19: `project_id` TYPE_STRING [LABEL_OPTIONAL]
- 20: `enable_dolby_vision` TYPE_BOOL [LABEL_OPTIONAL]
- 21: `is_export_pano` TYPE_BOOL [LABEL_OPTIONAL]
- 22: `is_cloud_media` TYPE_BOOL [LABEL_OPTIONAL]
- 23: `star_trail_length_type` TYPE_INT32 [LABEL_OPTIONAL]
- 24: `enable_deflicker` TYPE_BOOL [LABEL_OPTIONAL]
- 25: `upload_platform_id` TYPE_STRING [LABEL_OPTIONAL]
- 26: `clip_count` TYPE_INT64 [LABEL_OPTIONAL]
- 27: `enable_apmp` TYPE_BOOL [LABEL_OPTIONAL]
- 28: `report_apmp_visable` TYPE_BOOL [LABEL_OPTIONAL]
- 29: `is_screenshot_export` TYPE_BOOL [LABEL_OPTIONAL]
- 30: `screenshot_target_time_ms` TYPE_DOUBLE [LABEL_OPTIONAL]
- 31: `color_setting` TYPE_INT32 [LABEL_OPTIONAL]
- 32: `enable_ai_stitching_3_0` TYPE_BOOL [LABEL_OPTIONAL]

### Message `AdditionalUiParam`
- 1: `thumbnailPath` TYPE_STRING [LABEL_OPTIONAL]
- 2: `sourceFileName` TYPE_STRING [LABEL_OPTIONAL]
- 3: `createdDate` TYPE_STRING [LABEL_OPTIONAL]
- 4: `cameraType` TYPE_STRING [LABEL_OPTIONAL]
- 5: `resultDurationS` TYPE_FLOAT [LABEL_OPTIONAL]
- 6: `TargetFileMb` TYPE_FLOAT [LABEL_OPTIONAL]
- 7: `sourceFileType` TYPE_INT32 [LABEL_OPTIONAL]
- 9: `groupDisplayName` TYPE_STRING [LABEL_OPTIONAL]

### Message `ExportRequest`
- 1: `uuid` TYPE_STRING [LABEL_OPTIONAL]
- 2: `exportInfo` TYPE_MESSAGE (service.Export.ExportClipInfo) [LABEL_OPTIONAL]
- 3: `exportParam` TYPE_MESSAGE (service.Export.ExportParam) [LABEL_OPTIONAL]
- 4: `jsonSetting` TYPE_STRING [LABEL_OPTIONAL]
- 5: `uiParam` TYPE_MESSAGE (service.Export.AdditionalUiParam) [LABEL_OPTIONAL]
- 6: `mark_trim` TYPE_BOOL [LABEL_OPTIONAL]
- 7: `group_uuid` TYPE_STRING [LABEL_OPTIONAL]
- 8: `base_view_count` TYPE_INT32 [LABEL_OPTIONAL]

### Message `ExportReplyInfo`
- 1: `defringe_rate_list` TYPE_FLOAT [LABEL_REPEATED]
- 2: `export_perf_et` TYPE_STRING [LABEL_OPTIONAL]
- 3: `clip_index` TYPE_INT32 [LABEL_OPTIONAL]
- 4: `thumbnail_path` TYPE_STRING [LABEL_OPTIONAL]

### Message `ExportReply`
- 1: `uuid` TYPE_STRING [LABEL_OPTIONAL]
- 2: `export_progress` TYPE_FLOAT [LABEL_OPTIONAL]
- 3: `state_code` TYPE_INT32 [LABEL_OPTIONAL]
- 4: `err_code` TYPE_INT32 [LABEL_OPTIONAL]
- 5: `err_info` TYPE_STRING [LABEL_OPTIONAL]
- 6: `log_path` TYPE_STRING [LABEL_OPTIONAL]
- 7: `reply_info` TYPE_MESSAGE (service.Export.ExportReplyInfo) [LABEL_OPTIONAL]

### Message `CancelInfo`
- 1: `uuid` TYPE_STRING [LABEL_OPTIONAL]

### Message `AdditionInfo`
- 1: `firm_ware_version` TYPE_STRING [LABEL_OPTIONAL]
- 2: `shoot_mode` TYPE_INT32 [LABEL_OPTIONAL]
- 3: `camera_type` TYPE_STRING [LABEL_OPTIONAL]
- 4: `arvrender_media_type` TYPE_INT32 [LABEL_OPTIONAL]
- 5: `source_resolution` TYPE_MESSAGE (service.Export.Resolution) [LABEL_OPTIONAL]
- 7: `bitrate` TYPE_INT64 [LABEL_OPTIONAL]
- 8: `fps` TYPE_DOUBLE [LABEL_OPTIONAL]
- 9: `camera_serial_num` TYPE_STRING [LABEL_OPTIONAL]
- 10: `offset_state` TYPE_INT32 [LABEL_OPTIONAL]
- 11: `guard_detected_file` TYPE_INT32 [LABEL_OPTIONAL]
- 12: `audio_track_number` TYPE_INT32 [LABEL_OPTIONAL]

### Enum `ViewDataType`
- 0 = `KeyFramePoint`
- 1 = `DeepTrack`
- 2 = `ViewFinder`
- 3 = `VirtualPtz`
- 4 = `MovementTemplate`

### Enum `SourceFileType`
- 0 = `kPhoto`
- 1 = `kVideo`
- 2 = `kEmptyVideo`

### Enum `InterpolationType`
- 0 = `kOpticalFlowFrame`
- 1 = `kRepeatFrame`
- 2 = `kDefault`

### Enum `EncodeType`
- 0 = `kH264`
- 1 = `kH265`
- 2 = `kProres422`
- 3 = `kProres422LT`

### Enum `ImageProcessingAccel`
- 0 = `kAuto`
- 1 = `kCPU`

### Enum `StabilizationType`
- 0 = `kFlowState`
- 1 = `kFPV`

### Enum `StarTailType`
- 0 = `kLong`
- 1 = `kMedium`
- 2 = `kShort`

### Enum `DewarpTypeMode`
- 0 = `kDistortionReserved`
- 1 = `kDistortionRemoved`

### Enum `LongitudeDirection`
- 0 = `kDirectionEast`
- 1 = `kDirectionWest`

### Enum `LatitudeDirection`
- 0 = `kDirectionSouth`
- 1 = `kDirectionNorth`

## `ExportModule2.proto`
package `service.Export2` · syntax `proto3`
deps: `ExportParams.proto`

### Service `Export2`
- `StartExporting`(service.Export2.ExportParams) → service.Export2.ExportReply
- `ExporterCancel`(service.Export2.CancelInfo) → service.Export2.CancelInfo
- `SendHeartBeatPackage`(service.Export2.HeartBeat) → service.Export2.HeartBeat

### Message `HeartBeat`
- 1: `count` TYPE_INT64 [LABEL_OPTIONAL]
- 2: `exit_app` TYPE_BOOL [LABEL_OPTIONAL]

### Message `ExportReplyInfo`
- 1: `defringe_rate_list` TYPE_FLOAT [LABEL_REPEATED]
- 2: `export_perf_et` TYPE_STRING [LABEL_OPTIONAL]
- 3: `clip_index` TYPE_INT32 [LABEL_OPTIONAL]
- 4: `thumbnail_path` TYPE_STRING [LABEL_OPTIONAL]

### Message `ExportReply`
- 1: `uuid` TYPE_STRING [LABEL_OPTIONAL]
- 2: `export_progress` TYPE_FLOAT [LABEL_OPTIONAL]
- 3: `state_code` TYPE_INT32 [LABEL_OPTIONAL]
- 4: `err_code` TYPE_INT32 [LABEL_OPTIONAL]
- 5: `err_info` TYPE_STRING [LABEL_OPTIONAL]
- 6: `log_path` TYPE_STRING [LABEL_OPTIONAL]
- 7: `reply_info` TYPE_MESSAGE (service.Export2.ExportReplyInfo) [LABEL_OPTIONAL]

### Message `CancelInfo`
- 1: `uuid` TYPE_STRING [LABEL_OPTIONAL]

## `ExportParams.proto`
package `service.Export2` · syntax `proto3`
deps: `ins_cloud_export_data.proto`, `ins_export_information.proto`, `google/protobuf/wrappers.proto`

### Message `LocalVideoExportParam`
- 1: `enableDeflicker` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `enableApmp` TYPE_BOOL [LABEL_OPTIONAL]
- 3: `timeCode` TYPE_STRING [LABEL_OPTIONAL]
- 4: `isCloudFootage` TYPE_BOOL [LABEL_OPTIONAL]
- 5: `cloudMediaInfoJson` TYPE_STRING [LABEL_OPTIONAL]
- 6: `cloudPreviewUrl` TYPE_STRING [LABEL_OPTIONAL]
- 7: `clipIndex` TYPE_INT32 [LABEL_OPTIONAL]
- 8: `loopVideoJsonContent` TYPE_STRING [LABEL_REPEATED]
- 9: `srcTotalDurationMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 10: `stitch_type` TYPE_ENUM (service.Export2.StitchType) [LABEL_OPTIONAL]
- 11: `enable_image_fusion` TYPE_BOOL [LABEL_OPTIONAL]
- 12: `enable_gpx_export` TYPE_BOOL [LABEL_OPTIONAL]
- 13: `logo_info` TYPE_MESSAGE (insta360.cloud.message.ExportInfoLogoInfo) [LABEL_OPTIONAL]
- 14: `dewarp_type` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 15: `stab_level` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 16: `stab_type` TYPE_ENUM (service.Export2.StabilizationType) [LABEL_OPTIONAL]
- 17: `enable_direction_lock` TYPE_BOOL [LABEL_OPTIONAL]
- 18: `enable_pano_fpv` TYPE_BOOL [LABEL_OPTIONAL]
- 19: `enable_immersion` TYPE_BOOL [LABEL_OPTIONAL]
- 20: `enable_head_track` TYPE_BOOL [LABEL_OPTIONAL]
- 21: `enable_camera_move` TYPE_BOOL [LABEL_OPTIONAL]
- 22: `enable_stab` TYPE_BOOL [LABEL_OPTIONAL]
- 23: `dashboard_extra` TYPE_MESSAGE (service.Export2.DashboardExtra) [LABEL_OPTIONAL]
- 24: `enable_flat_logo` TYPE_BOOL [LABEL_OPTIONAL]
- 25: `flat_logo_info` TYPE_MESSAGE (service.Export2.FlatLogoInfo) [LABEL_OPTIONAL]
- 26: `real_userrotationdegree` TYPE_INT32 [LABEL_OPTIONAL]
- 27: `propeller_guard_status` TYPE_INT32 [LABEL_OPTIONAL]
- 28: `enable_cold_shoe` TYPE_BOOL [LABEL_OPTIONAL]
- 29: `enable_cooling_shell` TYPE_BOOL [LABEL_OPTIONAL]
- 30: `cloud_still_quat_path` TYPE_STRING [LABEL_OPTIONAL]
- 31: `cloud_immersion_quat_path` TYPE_STRING [LABEL_OPTIONAL]
- 32: `screenshot_target_time_ms` TYPE_DOUBLE [LABEL_OPTIONAL]
- 33: `photo_group_type` TYPE_INT32 [LABEL_OPTIONAL]
- 34: `enable_bottom_stitching_optimize` TYPE_BOOL [LABEL_OPTIONAL]
- 35: `accessory_type` TYPE_INT32 [LABEL_OPTIONAL]
- 36: `custom_blend_angle` TYPE_FLOAT [LABEL_OPTIONAL]

### Message `SourceGroup`
- 1: `sourceFile` TYPE_STRING [LABEL_REPEATED]
- 2: `source_group_type` TYPE_INT32 [LABEL_OPTIONAL]
- 3: `group_identifier` TYPE_STRING [LABEL_OPTIONAL]
- 4: `group_start_index` TYPE_INT32 [LABEL_OPTIONAL]
- 5: `dest_file_name` TYPE_STRING [LABEL_REPEATED]

### Message `LogoInfo`
- 1: `logo_path` TYPE_STRING [LABEL_OPTIONAL]
- 2: `logo_size` TYPE_FLOAT [LABEL_OPTIONAL]
- 3: `logo_location` TYPE_INT32 [LABEL_OPTIONAL]
- 4: `logo_corner_radius` TYPE_INT32 [LABEL_OPTIONAL]
- 5: `logo_feather` TYPE_INT32 [LABEL_OPTIONAL]
- 6: `logo_rotate` TYPE_INT32 [LABEL_OPTIONAL]

### Message `FlatLogoInfo`
- 1: `flat_logo_path` TYPE_STRING [LABEL_OPTIONAL]
- 2: `flat_logo_transparency` TYPE_INT32 [LABEL_OPTIONAL]
- 3: `flat_logo_location` TYPE_INT32 [LABEL_OPTIONAL]
- 4: `is_cn` TYPE_BOOL [LABEL_OPTIONAL]

### Message `DashboardExtraFrame`
- 1: `timestampMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 2: `horizontalSpeed` TYPE_DOUBLE [LABEL_OPTIONAL]
- 3: `aboveGroundHeight` TYPE_DOUBLE [LABEL_OPTIONAL]

### Message `DashboardExtra`
- 1: `frames` TYPE_MESSAGE (service.Export2.DashboardExtraFrame) [LABEL_REPEATED]
- 2: `accelerationMin` TYPE_DOUBLE [LABEL_OPTIONAL]
- 3: `verticalSpeedMin` TYPE_DOUBLE [LABEL_OPTIONAL]
- 4: `horizontalSpeedMax` TYPE_DOUBLE [LABEL_OPTIONAL]
- 5: `horizontalSpeedMin` TYPE_DOUBLE [LABEL_OPTIONAL]
- 6: `aboveGroundHeightMax` TYPE_DOUBLE [LABEL_OPTIONAL]

### Message `Quaternion`
- 1: `w` TYPE_FLOAT [LABEL_OPTIONAL]
- 2: `x` TYPE_FLOAT [LABEL_OPTIONAL]
- 3: `y` TYPE_FLOAT [LABEL_OPTIONAL]
- 4: `z` TYPE_FLOAT [LABEL_OPTIONAL]

### Message `StitchingSetting`
- 1: `stabilization_level` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `shelltype` TYPE_INT32 [LABEL_OPTIONAL]
- 3: `optimizedoffset` TYPE_STRING [LABEL_OPTIONAL]
- 4: `enableimagefusion` TYPE_BOOL [LABEL_OPTIONAL]
- 5: `enable_ai_stitching` TYPE_BOOL [LABEL_OPTIONAL]
- 6: `enable_dynamic_stitching` TYPE_BOOL [LABEL_OPTIONAL]
- 7: `enable_optical_flowstitching` TYPE_BOOL [LABEL_OPTIONAL]
- 8: `enable_coldshoe` TYPE_BOOL [LABEL_OPTIONAL]
- 9: `enable_cooling_shell` TYPE_BOOL [LABEL_OPTIONAL]
- 10: `custom_blend_angle` TYPE_FLOAT [LABEL_OPTIONAL]
- 11: `de_version` TYPE_STRING [LABEL_OPTIONAL]
- 12: `enable_logo` TYPE_BOOL [LABEL_OPTIONAL]
- 13: `enable_remove_grain` TYPE_BOOL [LABEL_OPTIONAL]
- 14: `stab_input_data_type` TYPE_INT32 [LABEL_OPTIONAL]
- 15: `projection_layout` TYPE_UINT32 [LABEL_OPTIONAL]
- 16: `logo_info` TYPE_MESSAGE (service.Export2.LogoInfo) [LABEL_OPTIONAL]
- 17: `stabilizationType` TYPE_ENUM (service.Export2.StabilizationType) [LABEL_OPTIONAL]
- 18: `enable_bottom_stitching_optimize` TYPE_BOOL [LABEL_OPTIONAL]
- 19: `enable_ai_stitching_3_0` TYPE_BOOL [LABEL_OPTIONAL]

### Message `LocalImageExportParam`
- 1: `starTrailType` TYPE_ENUM (service.Export2.StarTrailType) [LABEL_OPTIONAL]
- 2: `sourceGroup` TYPE_MESSAGE (service.Export2.SourceGroup) [LABEL_OPTIONAL]
- 3: `view_mode` TYPE_INT32 [LABEL_OPTIONAL]
- 4: `interval_merge_stab_type` TYPE_ENUM (service.Export2.LocalImageExportParam.IntervalMergeStabType) [LABEL_OPTIONAL]
- 5: `stitching` TYPE_MESSAGE (service.Export2.StitchingSetting) [LABEL_OPTIONAL]
- 6: `start_in_second` TYPE_DOUBLE [LABEL_OPTIONAL]
- 7: `video_clip_id` TYPE_INT64 [LABEL_OPTIONAL]
- 8: `quaternions` TYPE_MESSAGE (service.Export2.Quaternion) [LABEL_REPEATED]
- 9: `ai_raw_enable` TYPE_BOOL [LABEL_OPTIONAL]
- 10: `pano_animation_transitions` TYPE_INT32 [LABEL_REPEATED]

### Message `LocalVideoFxZOrder`
- 1: `positionZ` TYPE_INT32 [LABEL_OPTIONAL]

### Message `LocalExtraParams`
- 1: `exportType` TYPE_ENUM (service.Export2.ExportType) [LABEL_OPTIONAL]
- 2: `videoExportParam` TYPE_MESSAGE (service.Export2.LocalVideoExportParam) [LABEL_REPEATED]
- 3: `imageExportParam` TYPE_MESSAGE (service.Export2.LocalImageExportParam) [LABEL_OPTIONAL]
- 4: `videoFxZOrder` TYPE_MESSAGE (service.Export2.LocalVideoFxZOrder) [LABEL_REPEATED]

### Message `ExtraDataReqItem`
- 1: `extraType` TYPE_STRING [LABEL_OPTIONAL]
- 2: `valueType` TYPE_STRING [LABEL_OPTIONAL]
- 3: `value` TYPE_STRING [LABEL_OPTIONAL]
- 4: `fileName` TYPE_STRING [LABEL_OPTIONAL]
- 5: `businessSource` TYPE_STRING [LABEL_OPTIONAL]
- 6: `source` TYPE_STRING [LABEL_OPTIONAL]
- 7: `transitionType` TYPE_STRING [LABEL_OPTIONAL]
- 8: `localFilePath` TYPE_STRING [LABEL_OPTIONAL]

### Message `MaterialItem`
- 1: `index` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `type` TYPE_STRING [LABEL_OPTIONAL]
- 3: `value` TYPE_STRING [LABEL_OPTIONAL]

### Message `ExportHeader`
- 1: `taskId` TYPE_STRING [LABEL_OPTIONAL]
- 2: `exportName` TYPE_STRING [LABEL_OPTIONAL]
- 3: `savePath` TYPE_STRING [LABEL_OPTIONAL]
- 4: `protoMd5` TYPE_STRING [LABEL_OPTIONAL]
- 5: `protoName` TYPE_STRING [LABEL_OPTIONAL]
- 6: `videoDuration` TYPE_INT64 [LABEL_OPTIONAL]
- 7: `framerate` TYPE_STRING [LABEL_OPTIONAL]
- 8: `bitrate` TYPE_STRING [LABEL_OPTIONAL]
- 9: `width` TYPE_INT32 [LABEL_OPTIONAL]
- 10: `height` TYPE_INT32 [LABEL_OPTIONAL]
- 11: `extraDataReqList` TYPE_MESSAGE (service.Export2.ExtraDataReqItem) [LABEL_REPEATED]
- 12: `materialList` TYPE_MESSAGE (service.Export2.MaterialItem) [LABEL_REPEATED]

### Message `ExportParams`
- 1: `exportHeader` TYPE_MESSAGE (service.Export2.ExportHeader) [LABEL_OPTIONAL]
- 2: `mainParams` TYPE_MESSAGE (insta360.cloud.message.CloudExportData) [LABEL_OPTIONAL]
- 3: `localExtraParams` TYPE_MESSAGE (service.Export2.LocalExtraParams) [LABEL_OPTIONAL]

### Enum `ExportType`
- 0 = `PHOTO`
- 1 = `DNG_TO_DNG`
- 2 = `DNG_TO_JPG`
- 3 = `DNG_WITH_JPG`
- 4 = `NO_EXTRA_INFO_DNG_EXPORT`
- 5 = `JPG_SEQUENCE`
- 6 = `DNG_SEQUENCE_DNG`
- 7 = `DNG_SEQUENCE_JPG`
- 8 = `DNG_SEQUENCE_DNG_WITH_JPG`
- 9 = `VIDEO`
- 10 = `VIDEO_CLIP`
- 11 = `DEMUX_TO_JPEG`
- 12 = `SEQUENCE`
- 13 = `MUX_TO_VIDEO`
- 14 = `MUX_TO_PURESHOT_VIDEO`
- 15 = `MERGED_MIX`
- 16 = `MERGED_ONLY`
- 17 = `DNG_MERGED_JPG`
- 18 = `DNG_MERGED_DNG`
- 19 = `DNG_MERGED_EXR`
- 20 = `JPG_MERGED`
- 21 = `JPG_MERGED_GROUP`
- 22 = `DNG_MERGED_GROUP`
- 23 = `DNG_MERGED_GROUP_DNG`
- 24 = `SOURCE_CLIP`
- 25 = `PANO_PIC_ANIMATION`
- 26 = `PANO_PIC_ANIMATION_PRESET`
- 27 = `STAR_TRAIL_VIDEO`
- 28 = `STAR_TRAIL_PHOTO`
- 29 = `VIDEO_TO_JPEG_SEQUENCE`
- 30 = `PROJECT_COVER_PHOTO`
- 31 = `PANO_VIDEO`
- 32 = `INVALID_EXPORT_TYPE`
- 33 = `PLACE_HOLDER_TYPE`

### Enum `StarTrailType`
- 0 = `LONG`
- 1 = `MEDIUM`
- 2 = `SHORT`

### Enum `DewarpTypeMode`
- 0 = `kDistortionReserved`
- 1 = `kDistortionRemoved`

### Enum `StabilizationType`
- 0 = `kFlowState`
- 1 = `kFPV`

### Enum `StitchType`
- 0 = `STITCH_TEMPLATE`
- 1 = `STITCH_DYNAMIC`
- 2 = `STITCH_OPTICAL`
- 3 = `STITCH_AI`

## `NetWorkModule.proto`
package `service.Network` · syntax `proto3`

### Service `NetworkService`
- `StartDownload`(service.Network.DownloadRequest) → service.Network.DownloadReply
- `SendEventTrack`(service.Network.EventTrackData) → service.Network.DownloadReply
- `SendHeartBeatPackage`(service.Network.HeartBeat) → service.Network.HeartBeat
- `StartDownloadMusic`(service.Network.MusicDownloadRequest) → service.Network.MusicDownloadReply
- `DownloadFile`(service.Network.FileDownloadRequest) → service.Network.FileDownloadReply
- `CancelDownloadMusic`(service.Network.CancelRequest) → service.Network.CancelReply
- `UnzipFile`(service.Network.FileUnzipRequest) → service.Network.FileUnzipReply
- `StartDownloadCloudTask`(service.Network.CloudMediaDownloadRequest) → service.Network.CloudMediaDownloadReply
- `PauseDownloadCloudTask`(service.Network.CloudMediaDownLoadPauseRequest) → service.Network.CloudMediaDownLoadPauseReply
- `ResumeDownloadCloudTask`(service.Network.CloudMediaDownLoadPauseRequest) → service.Network.CloudMediaDownloadReply
- `CancelDownloadCloudTask`(service.Network.CloudMediaDownLoadCancelRequest) → service.Network.CloudMediaDownLoadCancelReply
- `DownloadSingleFile`(service.Network.SingleFileDownloadRequest) → service.Network.SingleFileDownloadReply
- `TopDownloadTasks`(service.Network.CloudMediaDownLoadToppingRequest) → service.Network.CloudMediaDownloadReply
- `CancelDownloadSingleFile`(service.Network.CancelDownloadSingleFileRequest) → service.Network.CancelDownloadSingleFileReply
- `CancelAllTask`(service.Network.CancelAllRequest) → service.Network.CancelAllReply
- `UploadLogToOss`(service.Network.UploadLogTaskInfo) → service.Network.UploadLogTaskReply

### Message `UploadLogTaskInfo`
- 1: `host_id` TYPE_STRING [LABEL_OPTIONAL]
- 2: `error_code` TYPE_INT64 [LABEL_OPTIONAL]
- 3: `log_path` TYPE_STRING [LABEL_OPTIONAL]
- 4: `error_desc` TYPE_STRING [LABEL_OPTIONAL]
- 5: `user_upload` TYPE_BOOL [LABEL_OPTIONAL]

### Message `UploadLogTaskReply`
- 1: `success` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `download_url` TYPE_STRING [LABEL_OPTIONAL]
- 3: `host_id` TYPE_STRING [LABEL_OPTIONAL]
- 4: `error_code` TYPE_INT64 [LABEL_OPTIONAL]

### Message `FileUnzipRequest`
- 1: `task_id` TYPE_STRING [LABEL_OPTIONAL]
- 2: `file_url` TYPE_MESSAGE (service.Network.FileDownloadUrl) [LABEL_OPTIONAL]

### Message `FileUnzipReply`
- 1: `task_id` TYPE_STRING [LABEL_OPTIONAL]
- 2: `state` TYPE_ENUM (service.Network.FileUnzipState) [LABEL_OPTIONAL]

### Message `FileDownloadRequest`
- 1: `file_url` TYPE_MESSAGE (service.Network.FileDownloadUrl) [LABEL_REPEATED]
- 2: `task_id` TYPE_STRING [LABEL_OPTIONAL]
- 3: `timeout_ms` TYPE_INT32 [LABEL_OPTIONAL]
- 4: `fast_fail` TYPE_BOOL [LABEL_OPTIONAL]

### Message `FileDownloadUrl`
- 1: `remote_url` TYPE_STRING [LABEL_OPTIONAL]
- 2: `save_path` TYPE_STRING [LABEL_OPTIONAL]

### Message `FileDownloadReply`
- 1: `task_id` TYPE_STRING [LABEL_OPTIONAL]
- 2: `download_progress` TYPE_DOUBLE [LABEL_OPTIONAL]
- 3: `reply_slice_info` TYPE_MESSAGE (service.Network.FileDownloadSliceInfo) [LABEL_REPEATED]
- 4: `reply_type` TYPE_ENUM (service.Network.FileDownloadReply.FileDownloadReplyType) [LABEL_OPTIONAL]

### Message `FileDownloadSliceInfo`
- 1: `task_index` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `download_state` TYPE_ENUM (service.Network.DownloadState) [LABEL_OPTIONAL]
- 3: `error_description` TYPE_STRING [LABEL_OPTIONAL]

### Message `CloudMediaDownloadTask`
- 1: `task_id` TYPE_STRING [LABEL_OPTIONAL]
- 2: `file_name` TYPE_STRING [LABEL_OPTIONAL]
- 3: `download_path` TYPE_STRING [LABEL_OPTIONAL]
- 4: `file_size` TYPE_INT64 [LABEL_OPTIONAL]
- 5: `url` TYPE_STRING [LABEL_OPTIONAL]
- 6: `weight` TYPE_FLOAT [LABEL_OPTIONAL]
- 7: `priority` TYPE_INT32 [LABEL_OPTIONAL]
- 8: `download_type` TYPE_INT32 [LABEL_OPTIONAL]
- 9: `range` TYPE_MESSAGE (service.Network.CloudMediaDownloadTask.Range) [LABEL_OPTIONAL]
- 10: `cubemap_url` TYPE_STRING [LABEL_OPTIONAL]
- 11: `cloud_asset_url` TYPE_STRING [LABEL_OPTIONAL]
- 12: `video_info_json` TYPE_STRING [LABEL_OPTIONAL]
- 13: `file_items` TYPE_STRING [LABEL_REPEATED]
- 14: `preview_video_info_json` TYPE_STRING [LABEL_OPTIONAL]
- 15: `is_file_dual_stream` TYPE_BOOL [LABEL_OPTIONAL]
- 16: `original_size` TYPE_INT64 [LABEL_OPTIONAL]
- nested: Range

### Message `CloudMediaDownloadRequest`
- 1: `tasks` TYPE_MESSAGE (service.Network.CloudMediaDownloadTask) [LABEL_REPEATED]

### Message `CloudMediaDownLoadToppingRequest`
- 1: `task_id` TYPE_STRING [LABEL_REPEATED]

### Message `CloudMediaDownloadReply`
- 1: `download_state` TYPE_ENUM (service.Network.DownloadState) [LABEL_OPTIONAL]
- 2: `task_id` TYPE_STRING [LABEL_OPTIONAL]
- 3: `file_name` TYPE_STRING [LABEL_OPTIONAL]
- 4: `progress` TYPE_FLOAT [LABEL_OPTIONAL]
- 5: `speed` TYPE_FLOAT [LABEL_OPTIONAL]
- 6: `remainder` TYPE_FLOAT [LABEL_OPTIONAL]
- 7: `is_progress` TYPE_BOOL [LABEL_OPTIONAL]
- 8: `error` TYPE_INT32 [LABEL_OPTIONAL]

### Message `CloudMediaDownLoadPauseRequest`
- 1: `task_id` TYPE_STRING [LABEL_REPEATED]

### Message `CloudMediaDownLoadPauseReply`
- 1: `task_id` TYPE_STRING [LABEL_REPEATED]

### Message `CloudMediaDownLoadCancelRequest`
- 1: `task_id` TYPE_STRING [LABEL_REPEATED]

### Message `CloudMediaDownLoadCancelReply`
- 1: `task_id` TYPE_STRING [LABEL_REPEATED]

### Message `MusicDownloadRequest`
- 1: `remote_url` TYPE_MESSAGE (service.Network.MusicUrlPackage) [LABEL_OPTIONAL]
- 2: `save_path` TYPE_MESSAGE (service.Network.MusicUrlPackage) [LABEL_OPTIONAL]
- 3: `timeout_ms` TYPE_INT32 [LABEL_OPTIONAL]
- 4: `task_id` TYPE_STRING [LABEL_OPTIONAL]

### Message `MusicUrlPackage`
- 1: `music_url` TYPE_STRING [LABEL_OPTIONAL]
- 2: `waveform_url` TYPE_STRING [LABEL_OPTIONAL]
- 3: `cover_url` TYPE_STRING [LABEL_OPTIONAL]

### Message `HeartBeat`
- 1: `count` TYPE_INT64 [LABEL_OPTIONAL]
- 2: `exit_app` TYPE_BOOL [LABEL_OPTIONAL]

### Message `DownloadRequest`
- 1: `file_source` TYPE_MESSAGE (service.Network.FileSource) [LABEL_OPTIONAL]
- 2: `file_type` TYPE_ENUM (service.Network.FileType) [LABEL_OPTIONAL]

### Message `FileSource`
- 1: `remote_url` TYPE_STRING [LABEL_OPTIONAL]
- 2: `save_path` TYPE_STRING [LABEL_OPTIONAL]

### Message `DownloadReply`
- 1: `download_state` TYPE_ENUM (service.Network.DownloadState) [LABEL_OPTIONAL]

### Message `MusicDownloadReply`
- 1: `download_state` TYPE_ENUM (service.Network.DownloadState) [LABEL_OPTIONAL]
- 2: `current_size` TYPE_INT64 [LABEL_OPTIONAL]
- 3: `total_size` TYPE_INT64 [LABEL_OPTIONAL]
- 4: `task_id` TYPE_STRING [LABEL_OPTIONAL]
- 5: `error_description` TYPE_STRING [LABEL_OPTIONAL]

### Message `EventTrackData`
- 1: `data_in_json` TYPE_STRING [LABEL_OPTIONAL]

### Message `CancelRequest`
- 1: `task_id` TYPE_STRING [LABEL_OPTIONAL]

### Message `CancelReply`
- 1: `task_id` TYPE_STRING [LABEL_OPTIONAL]
- 2: `error_code` TYPE_INT32 [LABEL_OPTIONAL]
- 3: `error_description` TYPE_STRING [LABEL_OPTIONAL]

### Message `SingleFileDownloadRequest`
- 1: `file_url` TYPE_MESSAGE (service.Network.FileDownloadUrl) [LABEL_OPTIONAL]
- 2: `task_id` TYPE_STRING [LABEL_OPTIONAL]
- 3: `timeout_ms` TYPE_INT32 [LABEL_OPTIONAL]
- 4: `start_offset` TYPE_INT64 [LABEL_OPTIONAL]

### Message `SingleFileDownloadReply`
- 1: `task_id` TYPE_STRING [LABEL_OPTIONAL]
- 3: `download_progress` TYPE_DOUBLE [LABEL_OPTIONAL]
- 4: `error_description` TYPE_STRING [LABEL_OPTIONAL]
- 5: `reply_type` TYPE_ENUM (service.Network.SingleFileDownloadReply.FileDownloadReplyType) [LABEL_OPTIONAL]
- 6: `downloaded_bytes` TYPE_INT64 [LABEL_OPTIONAL]
- 7: `total_bytes` TYPE_INT64 [LABEL_OPTIONAL]

### Message `CancelDownloadSingleFileRequest`
- 1: `task_id` TYPE_STRING [LABEL_OPTIONAL]

### Message `CancelDownloadSingleFileReply`
- 1: `task_id` TYPE_STRING [LABEL_OPTIONAL]

### Message `CancelAllRequest`

### Message `CancelAllReply`

### Enum `FileType`
- 0 = `kSplashImage`
- 1 = `kTranslationFile`

### Enum `DownloadState`
- 0 = `kSuccessful`
- 1 = `kDisconnected`
- 2 = `kUnknown`
- 3 = `kError`
- 4 = `kTimeout`
- 5 = `kProgress`
- 6 = `kStartDownload`
- 7 = `kCancelDownload`
- 8 = `kInsufficientStorage`

### Enum `FileUnzipState`
- 0 = `kFailToOpen`
- 1 = `kFailToUnzip`
- 2 = `kUnzipSuccessfully`

## `PBExtraData.proto`
package `` · syntax `proto3`

### Message `PBGyroData`
- 1: `timeoffset` TYPE_INT64 [LABEL_OPTIONAL]
- 2: `isApply` TYPE_BOOL [LABEL_OPTIONAL]
- 3: `count` TYPE_INT32 [LABEL_OPTIONAL]
- 4: `type` TYPE_ENUM (PBGyroDataType) [LABEL_OPTIONAL]
- 7: `gyroData` TYPE_BYTES [LABEL_OPTIONAL]

### Message `PBExtraData`
- 1: `gyrodata` TYPE_MESSAGE (PBGyroData) [LABEL_OPTIONAL]

### Enum `PBGyroDataType`
- 0 = `PBGyroDataType_nano`
- 1 = `PBGyroDataType_nano2`
- 2 = `PBGyroDataType_air`
- 3 = `PBGyroDataType_air2`

## `PwCacheMeta.proto`
package `bmg` · syntax `proto3`

### Message `PwTimestampRange`
- 1: `start` TYPE_INT64 [LABEL_OPTIONAL]
- 2: `end` TYPE_INT64 [LABEL_OPTIONAL]

### Message `PwRational`
- 1: `num` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `den` TYPE_INT32 [LABEL_OPTIONAL]

### Message `PwDashFragmentMeta`
- 1: `file_cache_meta` TYPE_STRING [LABEL_OPTIONAL]
- 2: `cached_dts_ranges` TYPE_MESSAGE (bmg.PwTimestampRange) [LABEL_REPEATED]
- 3: `file_dts_range` TYPE_MESSAGE (bmg.PwTimestampRange) [LABEL_OPTIONAL]
- 4: `time_base` TYPE_MESSAGE (bmg.PwRational) [LABEL_OPTIONAL]
- 5: `file_dts_offset` TYPE_INT64 [LABEL_OPTIONAL]

### Message `PwDashStreamMeta`
- 1: `init_section_data` TYPE_BYTES [LABEL_OPTIONAL]
- 2: `fragment_cache_metas` TYPE_MESSAGE (bmg.PwDashStreamMeta.FragmentCacheMetasEntry) [LABEL_REPEATED]
- nested: FragmentCacheMetasEntry

### Message `PwDashCacheMeta`
- 1: `mpd_content` TYPE_STRING [LABEL_OPTIONAL]
- 2: `video_metas` TYPE_MESSAGE (bmg.PwDashCacheMeta.VideoMetasEntry) [LABEL_REPEATED]
- 3: `audio_metas` TYPE_MESSAGE (bmg.PwDashCacheMeta.AudioMetasEntry) [LABEL_REPEATED]
- nested: VideoMetasEntry, AudioMetasEntry

### Message `PwMp4CacheMeta`
- 1: `file_cache_meta` TYPE_STRING [LABEL_OPTIONAL]
- 2: `vstream_dts_range` TYPE_MESSAGE (bmg.PwTimestampRange) [LABEL_OPTIONAL]
- 3: `astream_dts_range` TYPE_MESSAGE (bmg.PwTimestampRange) [LABEL_OPTIONAL]
- 4: `cached_vdts_ranges` TYPE_MESSAGE (bmg.PwTimestampRange) [LABEL_REPEATED]
- 5: `cached_adts_ranges` TYPE_MESSAGE (bmg.PwTimestampRange) [LABEL_REPEATED]
- 6: `vtime_base` TYPE_MESSAGE (bmg.PwRational) [LABEL_OPTIONAL]
- 7: `atime_base` TYPE_MESSAGE (bmg.PwRational) [LABEL_OPTIONAL]
- 8: `vstream_dts_offset` TYPE_INT64 [LABEL_OPTIONAL]
- 9: `astream_dts_offset` TYPE_INT64 [LABEL_OPTIONAL]

## `ThumbnailModule.proto`
package `service.Thumbnail` · syntax `proto3`

### Service `ThumbnailService`
- `SendRequest`(service.Thumbnail.ThumbnailRequest) → service.Thumbnail.ThumbnailReply
- `SendSceneDetectRequest`(service.Thumbnail.SceneDetectRequest) → service.Thumbnail.SceneDetectReply
- `SendHeartBeatPackage`(service.Thumbnail.HeartBeat) → service.Thumbnail.HeartBeat
- `Remove`(service.Thumbnail.SourceGroup) → service.Thumbnail.SourceGroup

### Message `HeartBeat`
- 1: `count` TYPE_INT64 [LABEL_OPTIONAL]
- 2: `exit_app` TYPE_BOOL [LABEL_OPTIONAL]

### Message `SourceGroup`
- 1: `sourceFile` TYPE_STRING [LABEL_REPEATED]

### Message `ThumbnailRequest`
- 1: `id` TYPE_INT64 [LABEL_OPTIONAL]
- 2: `sourceGroup` TYPE_MESSAGE (service.Thumbnail.SourceGroup) [LABEL_OPTIONAL]
- 3: `width` TYPE_INT32 [LABEL_OPTIONAL]
- 4: `height` TYPE_INT32 [LABEL_OPTIONAL]
- 5: `frameIndex` TYPE_INT64 [LABEL_OPTIONAL]
- 6: `renderType` TYPE_ENUM (service.Thumbnail.ThumbnailRenderType) [LABEL_OPTIONAL]
- 7: `task_type` TYPE_ENUM (service.Thumbnail.ThumbnailTaskType) [LABEL_OPTIONAL]
- 8: `onlyUseKeyframe` TYPE_BOOL [LABEL_OPTIONAL]
- 9: `taskPriority` TYPE_INT32 [LABEL_OPTIONAL]
- 10: `clipId` TYPE_INT32 [LABEL_OPTIONAL]
- 11: `frameTimeMs` TYPE_INT64 [LABEL_OPTIONAL]
- 12: `isCloud` TYPE_BOOL [LABEL_OPTIONAL]
- 13: `mediaId` TYPE_STRING [LABEL_OPTIONAL]
- 14: `cloudMediaInfoJson` TYPE_STRING [LABEL_OPTIONAL]
- 15: `thumbalPath` TYPE_STRING [LABEL_OPTIONAL]
- 16: `is_pano_export` TYPE_BOOL [LABEL_OPTIONAL]
- 17: `is_pano_media` TYPE_BOOL [LABEL_OPTIONAL]
- 18: `export_type` TYPE_INT32 [LABEL_OPTIONAL]
- 19: `aspect_ratio` TYPE_INT32 [LABEL_OPTIONAL]

### Message `ThumbnailInfo`
- 1: `thumbnailPath` TYPE_STRING [LABEL_OPTIONAL]
- 2: `frameIndex` TYPE_INT64 [LABEL_OPTIONAL]
- 3: `timeStampMs` TYPE_INT64 [LABEL_OPTIONAL]

### Message `ThumbnailReply`
- 1: `id` TYPE_INT64 [LABEL_OPTIONAL]
- 2: `thumbnailInfos` TYPE_MESSAGE (service.Thumbnail.ThumbnailInfo) [LABEL_REPEATED]
- 3: `errCode` TYPE_INT32 [LABEL_OPTIONAL]
- 4: `errInfo` TYPE_STRING [LABEL_OPTIONAL]

### Message `SceneDetectRequest`
- 1: `source_group_name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `source_group` TYPE_MESSAGE (service.Thumbnail.SourceGroup) [LABEL_OPTIONAL]

### Message `SceneDetectReply`
- 1: `source_group_name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `err_code` TYPE_INT32 [LABEL_OPTIONAL]

### Enum `ThumbnailTaskType`
- 0 = `kFootageCover`
- 1 = `kSingleTask`
- 2 = `kQuickSeekTask`

### Enum `ThumbnailRenderType`
- 0 = `kPlane`
- 1 = `kPlaneSphere`
- 2 = `kSphere`
- 3 = `kDewarp`
- 4 = `kStereo`

## `af_lens_info.proto`
package `insta360.messages` · syntax `proto3`

### Message `AFLensInfo`
- 1: `range_near` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `range_far` TYPE_INT32 [LABEL_OPTIONAL]

## `appExportData.proto`
package `insta360.message` · syntax `proto3`

### Message `AspectRatio`
- 1: `width` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `height` TYPE_INT32 [LABEL_OPTIONAL]

### Message `ViewData`
- 1: `yaw` TYPE_FLOAT [LABEL_OPTIONAL]
- 2: `pitch` TYPE_FLOAT [LABEL_OPTIONAL]
- 3: `roll` TYPE_FLOAT [LABEL_OPTIONAL]
- 4: `fov` TYPE_FLOAT [LABEL_OPTIONAL]
- 5: `distance` TYPE_FLOAT [LABEL_OPTIONAL]
- 6: `srcTime` TYPE_DOUBLE [LABEL_OPTIONAL]

### Message `ViewSegment`
- 1: `type` TYPE_ENUM (insta360.message.ViewDataType) [LABEL_OPTIONAL]
- 2: `aspectRatio` TYPE_MESSAGE (insta360.message.AspectRatio) [LABEL_OPTIONAL]
- 3: `keyPoints` TYPE_MESSAGE (insta360.message.ViewData) [LABEL_REPEATED]

### Message `ProjectSegment`
- 1: `id` TYPE_STRING [LABEL_OPTIONAL]
- 2: `dataType` TYPE_ENUM (insta360.message.ProjectSegmentType) [LABEL_OPTIONAL]
- 3: `aspectRatio` TYPE_MESSAGE (insta360.message.AspectRatio) [LABEL_OPTIONAL]
- 4: `stabType` TYPE_ENUM (insta360.message.StabType) [LABEL_OPTIONAL]
- 5: `segments` TYPE_MESSAGE (insta360.message.ViewSegment) [LABEL_REPEATED]

### Message `Project`
- 1: `version` TYPE_INT64 [LABEL_OPTIONAL]
- 2: `source` TYPE_ENUM (insta360.message.DataSource) [LABEL_OPTIONAL]
- 3: `projectName` TYPE_STRING [LABEL_OPTIONAL]
- 4: `segments` TYPE_MESSAGE (insta360.message.ProjectSegment) [LABEL_REPEATED]

### Enum `DataSource`
- 0 = `Android`
- 1 = `IOS`

### Enum `StabType`
- 0 = `Still`
- 1 = `DirectionLock`

### Enum `ProjectSegmentType`
- 0 = `Edit`
- 1 = `Snap`

### Enum `ViewDataType`
- 0 = `KeyFramePoint`
- 1 = `DeepTrack`
- 2 = `ViewFinder`

## `auto_find_info.proto`
package `insta360.messages` · syntax `proto3`

### Message `LayerInfo`
- 1: `version` TYPE_STRING [LABEL_OPTIONAL]
- 2: `order_of_targets` TYPE_STRING [LABEL_REPEATED]
- 3: `map_targets` TYPE_MESSAGE (insta360.messages.LayerInfo.MapTargetsEntry) [LABEL_REPEATED]
- 4: `states` TYPE_MESSAGE (insta360.messages.LayerInfo.StateInfo) [LABEL_REPEATED]
- 5: `transitions` TYPE_MESSAGE (insta360.messages.LayerInfo.TransitionInfo) [LABEL_REPEATED]
- 6: `start_timestamp_ms` TYPE_DOUBLE [LABEL_OPTIONAL]
- 7: `end_timestamp_ms` TYPE_DOUBLE [LABEL_OPTIONAL]
- nested: TargetInfo, MapTargetsEntry, StateInfo, TransitionInfo

## `basic_info.proto`
package `insta360.messages` · syntax `proto3`

### Message `ObjectInfo`
- 1: `time_ratio` TYPE_FLOAT [LABEL_OPTIONAL]
- 2: `frame_id` TYPE_STRING [LABEL_OPTIONAL]
- 3: `yaw` TYPE_FLOAT [LABEL_OPTIONAL]
- 4: `pitch` TYPE_FLOAT [LABEL_OPTIONAL]
- 5: `roll` TYPE_FLOAT [LABEL_OPTIONAL]

### Message `CameraInfo`
- 1: `fov` TYPE_FLOAT [LABEL_OPTIONAL]
- 2: `distance` TYPE_FLOAT [LABEL_OPTIONAL]
- 3: `object_info` TYPE_MESSAGE (insta360.messages.ObjectInfo) [LABEL_OPTIONAL]

### Message `TransitionInfo`
- 1: `func` TYPE_STRING [LABEL_OPTIONAL]
- 2: `from_state_id` TYPE_STRING [LABEL_OPTIONAL]
- 3: `to_state_id` TYPE_STRING [LABEL_OPTIONAL]

### Message `BezierCubic`
- 1: `from_state_id` TYPE_STRING [LABEL_OPTIONAL]
- 2: `to_state_id` TYPE_STRING [LABEL_OPTIONAL]
- 3: `bazier_ctrl_x1` TYPE_DOUBLE [LABEL_OPTIONAL]
- 4: `bazier_ctrl_y1` TYPE_DOUBLE [LABEL_OPTIONAL]
- 5: `bazier_ctrl_x2` TYPE_DOUBLE [LABEL_OPTIONAL]
- 6: `bazier_ctrl_y2` TYPE_DOUBLE [LABEL_OPTIONAL]

### Message `AlphaTransition`
- 1: `duration` TYPE_DOUBLE [LABEL_OPTIONAL]
- 2: `transitionFile` TYPE_STRING [LABEL_OPTIONAL]

## `capture_beauty_info.proto`
package `insta360.messages` · syntax `proto3`

### Message `CaptureBeautyParams`
- 1: `skin_care_strength` TYPE_FLOAT [LABEL_OPTIONAL]
- 2: `blemish_removal_strength` TYPE_FLOAT [LABEL_OPTIONAL]
- 3: `rsv` TYPE_UINT32 [LABEL_REPEATED]
- 4: `one_click_beauty_switch` TYPE_BOOL [LABEL_OPTIONAL]

## `commands/editinfo_list.proto`
package `insta360.messages` · syntax `proto3`

### Message `FavoriteInfo`
- 1: `playback_is_favorite` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `modify_timestamp` TYPE_INT64 [LABEL_OPTIONAL]

### Message `AnalyzeInfo`
- 1: `algo_type` TYPE_ENUM (insta360.messages.ResultIndex) [LABEL_OPTIONAL]
- 2: `is_finish` TYPE_BOOL [LABEL_OPTIONAL]
- 3: `finish_status` TYPE_ENUM (insta360.messages.FinishState) [LABEL_OPTIONAL]

### Message `AlgoAnalyzeSubFileInfo`
- 1: `analyze_file_path` TYPE_STRING [LABEL_OPTIONAL]
- 2: `last_valid_analyze_size` TYPE_INT64 [LABEL_OPTIONAL]
- 3: `analysis_result` TYPE_MESSAGE (insta360.messages.AnalyzeInfo) [LABEL_REPEATED]
- 4: `segment_file_paths` TYPE_STRING [LABEL_REPEATED]

### Message `FileMeta`
- 1: `creation_time_ms` TYPE_INT64 [LABEL_OPTIONAL]
- 2: `duration_ms` TYPE_UINT32 [LABEL_OPTIONAL]
- 3: `sub_media_type` TYPE_ENUM (insta360.messages.FileMeta.SubMediaType) [LABEL_OPTIONAL]
- 4: `file_category` TYPE_ENUM (insta360.messages.FileMeta.FileCategory) [LABEL_OPTIONAL]
- 5: `file_scene_info_type` TYPE_UINT32 [LABEL_OPTIONAL]

### Message `EditFileInfo`
- 1: `file_path` TYPE_STRING [LABEL_OPTIONAL]
- 2: `favorite_info` TYPE_MESSAGE (insta360.messages.FavoriteInfo) [LABEL_OPTIONAL]
- 3: `algo_infos` TYPE_MESSAGE (insta360.messages.AlgoAnalyzeSubFileInfo) [LABEL_REPEATED]
- 4: `storage_location` TYPE_ENUM (insta360.messages.StorageLocation) [LABEL_OPTIONAL]
- 5: `file_meta` TYPE_MESSAGE (insta360.messages.FileMeta) [LABEL_OPTIONAL]
- 6: `needs_idle_analysis` TYPE_BOOL [LABEL_OPTIONAL]

### Message `CustomFilmDate`
- 1: `day_key` TYPE_INT64 [LABEL_OPTIONAL]
- 2: `analyzed` TYPE_BOOL [LABEL_OPTIONAL]
- 3: `rule_mask` TYPE_UINT32 [LABEL_OPTIONAL]

### Message `EditFileInfoList`
- 1: `edit_file_info_list` TYPE_MESSAGE (insta360.messages.EditFileInfo) [LABEL_REPEATED]
- 2: `device_sn` TYPE_STRING [LABEL_OPTIONAL]
- 3: `device_model_name` TYPE_STRING [LABEL_OPTIONAL]
- 4: `cards` TYPE_MESSAGE (insta360.messages.HighlightCard) [LABEL_REPEATED]
- 5: `custom_film_dates` TYPE_MESSAGE (insta360.messages.CustomFilmDate) [LABEL_REPEATED]
- 6: `custom_batch_id` TYPE_STRING [LABEL_OPTIONAL]
- 7: `custom_batch_generation` TYPE_UINT64 [LABEL_OPTIONAL]
- 8: `custom_batch_state` TYPE_ENUM (insta360.messages.CustomFilmBatchState) [LABEL_OPTIONAL]
- 9: `custom_batch_card_id` TYPE_STRING [LABEL_OPTIONAL]

### Message `CardMemberRef`
- 1: `file_path` TYPE_STRING [LABEL_OPTIONAL]

### Message `HighlightCard`
- 1: `card_id` TYPE_STRING [LABEL_OPTIONAL]
- 2: `day_timestamp` TYPE_INT64 [LABEL_OPTIONAL]
- 3: `members` TYPE_MESSAGE (insta360.messages.CardMemberRef) [LABEL_REPEATED]
- 4: `last_video_timestamp` TYPE_INT64 [LABEL_OPTIONAL]
- 5: `cover_page_path` TYPE_STRING [LABEL_OPTIONAL]
- 6: `rule_mask` TYPE_UINT32 [LABEL_OPTIONAL]
- 7: `sequence_in_day` TYPE_UINT32 [LABEL_OPTIONAL]
- 8: `card_update_time` TYPE_INT64 [LABEL_OPTIONAL]
- 9: `custom_trigger_reason` TYPE_UINT32 [LABEL_OPTIONAL]
- 10: `selected_day_keys` TYPE_INT64 [LABEL_REPEATED]
- 11: `batch_id` TYPE_STRING [LABEL_OPTIONAL]

### Enum `ResultIndex`
- 0 = `RESULT_INDEX_UNSPECIFIED`
- 1 = `RESULT_INDEX_APEI`
- 2 = `RESULT_INDEX_CLIP`
- 3 = `RESULT_INDEX_PLANE`

### Enum `StorageLocation`
- 0 = `STORAGE_LOCATION_UNSPECIFIED`
- 1 = `STORAGE_LOCATION_INTERNAL`
- 2 = `STORAGE_LOCATION_EXTERNAL`

### Enum `FinishState`
- 0 = `FINISH_STATE_UNSPECIFIED`
- 1 = `FINISH_STATE_DONE`
- 2 = `FINISH_STATE_EMPTY`
- 3 = `FINISH_STATE_FILEERROR`

### Enum `CustomFilmBatchState`
- 0 = `CUSTOM_FILM_BATCH_STATE_UNSPECIFIED`
- 1 = `CUSTOM_FILM_BATCH_STATE_PENDING`
- 2 = `CUSTOM_FILM_BATCH_STATE_PROCESSING`
- 3 = `CUSTOM_FILM_BATCH_STATE_COMMITTED`
- 4 = `CUSTOM_FILM_BATCH_STATE_FAILED`

### Enum `FilmGroupRule`
- 0 = `FILM_GROUP_RULE_UNSPECIFIED`
- 1 = `FILM_GROUP_RULE_INTRADAY`
- 2 = `FILM_GROUP_RULE_FULLDAY`
- 4 = `FILM_GROUP_RULE_CUSTOM_MULTIDAY`

## `data_tuple.proto`
package `com.arashivision.arvbmg.datatuple.proto` · syntax `proto3`

### Message `DataTuple`
- 1: `str_value` TYPE_STRING [LABEL_OPTIONAL]
- 2: `vector_values` TYPE_FLOAT [LABEL_REPEATED]
- 3: `int_value` TYPE_INT32 [LABEL_OPTIONAL]

## `envoy/annotations/deprecation.proto`
package `envoy.annotations` · syntax `proto3`
deps: `google/protobuf/descriptor.proto`

## `envoy/config/accesslog/v3/accesslog.proto`
package `envoy.config.accesslog.v3` · syntax `proto3`
deps: `envoy/config/core/v3/base.proto`, `envoy/config/route/v3/route_components.proto`, `envoy/data/accesslog/v3/accesslog.proto`, `envoy/type/matcher/v3/metadata.proto`, `envoy/type/v3/percent.proto`, `google/protobuf/any.proto`, `google/protobuf/wrappers.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `AccessLog`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `filter` TYPE_MESSAGE (envoy.config.accesslog.v3.AccessLogFilter) [LABEL_OPTIONAL]
- 4: `typed_config` TYPE_MESSAGE (google.protobuf.Any) [LABEL_OPTIONAL]

### Message `AccessLogFilter`
- 1: `status_code_filter` TYPE_MESSAGE (envoy.config.accesslog.v3.StatusCodeFilter) [LABEL_OPTIONAL]
- 2: `duration_filter` TYPE_MESSAGE (envoy.config.accesslog.v3.DurationFilter) [LABEL_OPTIONAL]
- 3: `not_health_check_filter` TYPE_MESSAGE (envoy.config.accesslog.v3.NotHealthCheckFilter) [LABEL_OPTIONAL]
- 4: `traceable_filter` TYPE_MESSAGE (envoy.config.accesslog.v3.TraceableFilter) [LABEL_OPTIONAL]
- 5: `runtime_filter` TYPE_MESSAGE (envoy.config.accesslog.v3.RuntimeFilter) [LABEL_OPTIONAL]
- 6: `and_filter` TYPE_MESSAGE (envoy.config.accesslog.v3.AndFilter) [LABEL_OPTIONAL]
- 7: `or_filter` TYPE_MESSAGE (envoy.config.accesslog.v3.OrFilter) [LABEL_OPTIONAL]
- 8: `header_filter` TYPE_MESSAGE (envoy.config.accesslog.v3.HeaderFilter) [LABEL_OPTIONAL]
- 9: `response_flag_filter` TYPE_MESSAGE (envoy.config.accesslog.v3.ResponseFlagFilter) [LABEL_OPTIONAL]
- 10: `grpc_status_filter` TYPE_MESSAGE (envoy.config.accesslog.v3.GrpcStatusFilter) [LABEL_OPTIONAL]
- 11: `extension_filter` TYPE_MESSAGE (envoy.config.accesslog.v3.ExtensionFilter) [LABEL_OPTIONAL]
- 12: `metadata_filter` TYPE_MESSAGE (envoy.config.accesslog.v3.MetadataFilter) [LABEL_OPTIONAL]
- 13: `log_type_filter` TYPE_MESSAGE (envoy.config.accesslog.v3.LogTypeFilter) [LABEL_OPTIONAL]

### Message `ComparisonFilter`
- 1: `op` TYPE_ENUM (envoy.config.accesslog.v3.ComparisonFilter.Op) [LABEL_OPTIONAL]
- 2: `value` TYPE_MESSAGE (envoy.config.core.v3.RuntimeUInt32) [LABEL_OPTIONAL]

### Message `StatusCodeFilter`
- 1: `comparison` TYPE_MESSAGE (envoy.config.accesslog.v3.ComparisonFilter) [LABEL_OPTIONAL]

### Message `DurationFilter`
- 1: `comparison` TYPE_MESSAGE (envoy.config.accesslog.v3.ComparisonFilter) [LABEL_OPTIONAL]

### Message `NotHealthCheckFilter`

### Message `TraceableFilter`

### Message `RuntimeFilter`
- 1: `runtime_key` TYPE_STRING [LABEL_OPTIONAL]
- 2: `percent_sampled` TYPE_MESSAGE (envoy.type.v3.FractionalPercent) [LABEL_OPTIONAL]
- 3: `use_independent_randomness` TYPE_BOOL [LABEL_OPTIONAL]

### Message `AndFilter`
- 1: `filters` TYPE_MESSAGE (envoy.config.accesslog.v3.AccessLogFilter) [LABEL_REPEATED]

### Message `OrFilter`
- 2: `filters` TYPE_MESSAGE (envoy.config.accesslog.v3.AccessLogFilter) [LABEL_REPEATED]

### Message `HeaderFilter`
- 1: `header` TYPE_MESSAGE (envoy.config.route.v3.HeaderMatcher) [LABEL_OPTIONAL]

### Message `ResponseFlagFilter`
- 1: `flags` TYPE_STRING [LABEL_REPEATED]

### Message `GrpcStatusFilter`
- 1: `statuses` TYPE_ENUM (envoy.config.accesslog.v3.GrpcStatusFilter.Status) [LABEL_REPEATED]
- 2: `exclude` TYPE_BOOL [LABEL_OPTIONAL]

### Message `MetadataFilter`
- 1: `matcher` TYPE_MESSAGE (envoy.type.matcher.v3.MetadataMatcher) [LABEL_OPTIONAL]
- 2: `match_if_key_not_found` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]

### Message `LogTypeFilter`
- 1: `types` TYPE_ENUM (envoy.data.accesslog.v3.AccessLogType) [LABEL_REPEATED]
- 2: `exclude` TYPE_BOOL [LABEL_OPTIONAL]

### Message `ExtensionFilter`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 3: `typed_config` TYPE_MESSAGE (google.protobuf.Any) [LABEL_OPTIONAL]

## `envoy/config/cluster/v3/circuit_breaker.proto`
package `envoy.config.cluster.v3` · syntax `proto3`
deps: `envoy/config/core/v3/base.proto`, `envoy/type/v3/percent.proto`, `google/protobuf/wrappers.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `CircuitBreakers`
- 1: `thresholds` TYPE_MESSAGE (envoy.config.cluster.v3.CircuitBreakers.Thresholds) [LABEL_REPEATED]
- 2: `per_host_thresholds` TYPE_MESSAGE (envoy.config.cluster.v3.CircuitBreakers.Thresholds) [LABEL_REPEATED]
- nested: Thresholds

## `envoy/config/cluster/v3/cluster.proto`
package `envoy.config.cluster.v3` · syntax `proto3`
deps: `envoy/config/cluster/v3/circuit_breaker.proto`, `envoy/config/cluster/v3/filter.proto`, `envoy/config/cluster/v3/outlier_detection.proto`, `envoy/config/core/v3/address.proto`, `envoy/config/core/v3/base.proto`, `envoy/config/core/v3/config_source.proto`, `envoy/config/core/v3/extension.proto`, `envoy/config/core/v3/health_check.proto`, `envoy/config/core/v3/protocol.proto`, `envoy/config/core/v3/resolver.proto`, `envoy/config/endpoint/v3/endpoint.proto`, `envoy/type/metadata/v3/metadata.proto`, `envoy/type/v3/percent.proto`, `google/protobuf/any.proto`, `google/protobuf/duration.proto`, `google/protobuf/struct.proto`, `google/protobuf/wrappers.proto`, `xds/core/v3/collection_entry.proto`, `envoy/annotations/deprecation.proto`, `udpa/annotations/migrate.proto`, `udpa/annotations/security.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `ClusterCollection`
- 1: `entries` TYPE_MESSAGE (xds.core.v3.CollectionEntry) [LABEL_OPTIONAL]

### Message `Cluster`
- 43: `transport_socket_matches` TYPE_MESSAGE (envoy.config.cluster.v3.Cluster.TransportSocketMatch) [LABEL_REPEATED]
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 28: `alt_stat_name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `type` TYPE_ENUM (envoy.config.cluster.v3.Cluster.DiscoveryType) [LABEL_OPTIONAL]
- 38: `cluster_type` TYPE_MESSAGE (envoy.config.cluster.v3.Cluster.CustomClusterType) [LABEL_OPTIONAL]
- 3: `eds_cluster_config` TYPE_MESSAGE (envoy.config.cluster.v3.Cluster.EdsClusterConfig) [LABEL_OPTIONAL]
- 4: `connect_timeout` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 5: `per_connection_buffer_limit_bytes` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 6: `lb_policy` TYPE_ENUM (envoy.config.cluster.v3.Cluster.LbPolicy) [LABEL_OPTIONAL]
- 33: `load_assignment` TYPE_MESSAGE (envoy.config.endpoint.v3.ClusterLoadAssignment) [LABEL_OPTIONAL]
- 8: `health_checks` TYPE_MESSAGE (envoy.config.core.v3.HealthCheck) [LABEL_REPEATED]
- 9: `max_requests_per_connection` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 10: `circuit_breakers` TYPE_MESSAGE (envoy.config.cluster.v3.CircuitBreakers) [LABEL_OPTIONAL]
- 46: `upstream_http_protocol_options` TYPE_MESSAGE (envoy.config.core.v3.UpstreamHttpProtocolOptions) [LABEL_OPTIONAL]
- 29: `common_http_protocol_options` TYPE_MESSAGE (envoy.config.core.v3.HttpProtocolOptions) [LABEL_OPTIONAL]
- 13: `http_protocol_options` TYPE_MESSAGE (envoy.config.core.v3.Http1ProtocolOptions) [LABEL_OPTIONAL]
- 14: `http2_protocol_options` TYPE_MESSAGE (envoy.config.core.v3.Http2ProtocolOptions) [LABEL_OPTIONAL]
- 36: `typed_extension_protocol_options` TYPE_MESSAGE (envoy.config.cluster.v3.Cluster.TypedExtensionProtocolOptionsEntry) [LABEL_REPEATED]
- 16: `dns_refresh_rate` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 44: `dns_failure_refresh_rate` TYPE_MESSAGE (envoy.config.cluster.v3.Cluster.RefreshRate) [LABEL_OPTIONAL]
- 39: `respect_dns_ttl` TYPE_BOOL [LABEL_OPTIONAL]
- 17: `dns_lookup_family` TYPE_ENUM (envoy.config.cluster.v3.Cluster.DnsLookupFamily) [LABEL_OPTIONAL]
- 18: `dns_resolvers` TYPE_MESSAGE (envoy.config.core.v3.Address) [LABEL_REPEATED]
- 45: `use_tcp_for_dns_lookups` TYPE_BOOL [LABEL_OPTIONAL]
- 53: `dns_resolution_config` TYPE_MESSAGE (envoy.config.core.v3.DnsResolutionConfig) [LABEL_OPTIONAL]
- 55: `typed_dns_resolver_config` TYPE_MESSAGE (envoy.config.core.v3.TypedExtensionConfig) [LABEL_OPTIONAL]
- 54: `wait_for_warm_on_init` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 19: `outlier_detection` TYPE_MESSAGE (envoy.config.cluster.v3.OutlierDetection) [LABEL_OPTIONAL]
- 20: `cleanup_interval` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 21: `upstream_bind_config` TYPE_MESSAGE (envoy.config.core.v3.BindConfig) [LABEL_OPTIONAL]
- 22: `lb_subset_config` TYPE_MESSAGE (envoy.config.cluster.v3.Cluster.LbSubsetConfig) [LABEL_OPTIONAL]
- 23: `ring_hash_lb_config` TYPE_MESSAGE (envoy.config.cluster.v3.Cluster.RingHashLbConfig) [LABEL_OPTIONAL]
- 52: `maglev_lb_config` TYPE_MESSAGE (envoy.config.cluster.v3.Cluster.MaglevLbConfig) [LABEL_OPTIONAL]
- 34: `original_dst_lb_config` TYPE_MESSAGE (envoy.config.cluster.v3.Cluster.OriginalDstLbConfig) [LABEL_OPTIONAL]
- 37: `least_request_lb_config` TYPE_MESSAGE (envoy.config.cluster.v3.Cluster.LeastRequestLbConfig) [LABEL_OPTIONAL]
- 56: `round_robin_lb_config` TYPE_MESSAGE (envoy.config.cluster.v3.Cluster.RoundRobinLbConfig) [LABEL_OPTIONAL]
- 27: `common_lb_config` TYPE_MESSAGE (envoy.config.cluster.v3.Cluster.CommonLbConfig) [LABEL_OPTIONAL]
- 24: `transport_socket` TYPE_MESSAGE (envoy.config.core.v3.TransportSocket) [LABEL_OPTIONAL]
- 25: `metadata` TYPE_MESSAGE (envoy.config.core.v3.Metadata) [LABEL_OPTIONAL]
- 26: `protocol_selection` TYPE_ENUM (envoy.config.cluster.v3.Cluster.ClusterProtocolSelection) [LABEL_OPTIONAL]
- 30: `upstream_connection_options` TYPE_MESSAGE (envoy.config.cluster.v3.UpstreamConnectionOptions) [LABEL_OPTIONAL]
- 31: `close_connections_on_host_health_failure` TYPE_BOOL [LABEL_OPTIONAL]
- 32: `ignore_health_on_host_removal` TYPE_BOOL [LABEL_OPTIONAL]
- 40: `filters` TYPE_MESSAGE (envoy.config.cluster.v3.Filter) [LABEL_REPEATED]
- 41: `load_balancing_policy` TYPE_MESSAGE (envoy.config.cluster.v3.LoadBalancingPolicy) [LABEL_OPTIONAL]
- 42: `lrs_server` TYPE_MESSAGE (envoy.config.core.v3.ConfigSource) [LABEL_OPTIONAL]
- 47: `track_timeout_budgets` TYPE_BOOL [LABEL_OPTIONAL]
- 48: `upstream_config` TYPE_MESSAGE (envoy.config.core.v3.TypedExtensionConfig) [LABEL_OPTIONAL]
- 49: `track_cluster_stats` TYPE_MESSAGE (envoy.config.cluster.v3.TrackClusterStats) [LABEL_OPTIONAL]
- 50: `preconnect_policy` TYPE_MESSAGE (envoy.config.cluster.v3.Cluster.PreconnectPolicy) [LABEL_OPTIONAL]
- 51: `connection_pool_per_downstream_connection` TYPE_BOOL [LABEL_OPTIONAL]
- nested: TransportSocketMatch, CustomClusterType, EdsClusterConfig, LbSubsetConfig, SlowStartConfig, RoundRobinLbConfig, LeastRequestLbConfig, RingHashLbConfig, MaglevLbConfig, OriginalDstLbConfig, CommonLbConfig, RefreshRate, PreconnectPolicy, TypedExtensionProtocolOptionsEntry

### Message `LoadBalancingPolicy`
- 1: `policies` TYPE_MESSAGE (envoy.config.cluster.v3.LoadBalancingPolicy.Policy) [LABEL_REPEATED]
- nested: Policy

### Message `UpstreamConnectionOptions`
- 1: `tcp_keepalive` TYPE_MESSAGE (envoy.config.core.v3.TcpKeepalive) [LABEL_OPTIONAL]
- 2: `set_local_interface_name_on_upstream_connections` TYPE_BOOL [LABEL_OPTIONAL]

### Message `TrackClusterStats`
- 1: `timeout_budgets` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `request_response_sizes` TYPE_BOOL [LABEL_OPTIONAL]
- 3: `per_endpoint_stats` TYPE_BOOL [LABEL_OPTIONAL]

## `envoy/config/cluster/v3/filter.proto`
package `envoy.config.cluster.v3` · syntax `proto3`
deps: `envoy/config/core/v3/config_source.proto`, `google/protobuf/any.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `Filter`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `typed_config` TYPE_MESSAGE (google.protobuf.Any) [LABEL_OPTIONAL]
- 3: `config_discovery` TYPE_MESSAGE (envoy.config.core.v3.ExtensionConfigSource) [LABEL_OPTIONAL]

## `envoy/config/cluster/v3/outlier_detection.proto`
package `envoy.config.cluster.v3` · syntax `proto3`
deps: `google/protobuf/duration.proto`, `google/protobuf/wrappers.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `OutlierDetection`
- 1: `consecutive_5xx` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 2: `interval` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 3: `base_ejection_time` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 4: `max_ejection_percent` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 5: `enforcing_consecutive_5xx` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 6: `enforcing_success_rate` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 7: `success_rate_minimum_hosts` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 8: `success_rate_request_volume` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 9: `success_rate_stdev_factor` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 10: `consecutive_gateway_failure` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 11: `enforcing_consecutive_gateway_failure` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 12: `split_external_local_origin_errors` TYPE_BOOL [LABEL_OPTIONAL]
- 13: `consecutive_local_origin_failure` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 14: `enforcing_consecutive_local_origin_failure` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 15: `enforcing_local_origin_success_rate` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 16: `failure_percentage_threshold` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 17: `enforcing_failure_percentage` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 18: `enforcing_failure_percentage_local_origin` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 19: `failure_percentage_minimum_hosts` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 20: `failure_percentage_request_volume` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 21: `max_ejection_time` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 22: `max_ejection_time_jitter` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 23: `successful_active_health_check_uneject_host` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]

## `envoy/config/core/v3/address.proto`
package `envoy.config.core.v3` · syntax `proto3`
deps: `envoy/config/core/v3/extension.proto`, `envoy/config/core/v3/socket_option.proto`, `google/protobuf/wrappers.proto`, `envoy/annotations/deprecation.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `Pipe`
- 1: `path` TYPE_STRING [LABEL_OPTIONAL]
- 2: `mode` TYPE_UINT32 [LABEL_OPTIONAL]

### Message `EnvoyInternalAddress`
- 1: `server_listener_name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `endpoint_id` TYPE_STRING [LABEL_OPTIONAL]

### Message `SocketAddress`
- 1: `protocol` TYPE_ENUM (envoy.config.core.v3.SocketAddress.Protocol) [LABEL_OPTIONAL]
- 2: `address` TYPE_STRING [LABEL_OPTIONAL]
- 3: `port_value` TYPE_UINT32 [LABEL_OPTIONAL]
- 4: `named_port` TYPE_STRING [LABEL_OPTIONAL]
- 5: `resolver_name` TYPE_STRING [LABEL_OPTIONAL]
- 6: `ipv4_compat` TYPE_BOOL [LABEL_OPTIONAL]

### Message `TcpKeepalive`
- 1: `keepalive_probes` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 2: `keepalive_time` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 3: `keepalive_interval` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]

### Message `ExtraSourceAddress`
- 1: `address` TYPE_MESSAGE (envoy.config.core.v3.SocketAddress) [LABEL_OPTIONAL]
- 2: `socket_options` TYPE_MESSAGE (envoy.config.core.v3.SocketOptionsOverride) [LABEL_OPTIONAL]

### Message `BindConfig`
- 1: `source_address` TYPE_MESSAGE (envoy.config.core.v3.SocketAddress) [LABEL_OPTIONAL]
- 2: `freebind` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 3: `socket_options` TYPE_MESSAGE (envoy.config.core.v3.SocketOption) [LABEL_REPEATED]
- 5: `extra_source_addresses` TYPE_MESSAGE (envoy.config.core.v3.ExtraSourceAddress) [LABEL_REPEATED]
- 4: `additional_source_addresses` TYPE_MESSAGE (envoy.config.core.v3.SocketAddress) [LABEL_REPEATED]
- 6: `local_address_selector` TYPE_MESSAGE (envoy.config.core.v3.TypedExtensionConfig) [LABEL_OPTIONAL]

### Message `Address`
- 1: `socket_address` TYPE_MESSAGE (envoy.config.core.v3.SocketAddress) [LABEL_OPTIONAL]
- 2: `pipe` TYPE_MESSAGE (envoy.config.core.v3.Pipe) [LABEL_OPTIONAL]
- 3: `envoy_internal_address` TYPE_MESSAGE (envoy.config.core.v3.EnvoyInternalAddress) [LABEL_OPTIONAL]

### Message `CidrRange`
- 1: `address_prefix` TYPE_STRING [LABEL_OPTIONAL]
- 2: `prefix_len` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]

## `envoy/config/core/v3/backoff.proto`
package `envoy.config.core.v3` · syntax `proto3`
deps: `google/protobuf/duration.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `BackoffStrategy`
- 1: `base_interval` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 2: `max_interval` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]

## `envoy/config/core/v3/base.proto`
package `envoy.config.core.v3` · syntax `proto3`
deps: `envoy/config/core/v3/address.proto`, `envoy/config/core/v3/backoff.proto`, `envoy/config/core/v3/http_uri.proto`, `envoy/type/v3/percent.proto`, `envoy/type/v3/semantic_version.proto`, `google/protobuf/any.proto`, `google/protobuf/struct.proto`, `google/protobuf/wrappers.proto`, `xds/core/v3/context_params.proto`, `envoy/annotations/deprecation.proto`, `udpa/annotations/migrate.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `Locality`
- 1: `region` TYPE_STRING [LABEL_OPTIONAL]
- 2: `zone` TYPE_STRING [LABEL_OPTIONAL]
- 3: `sub_zone` TYPE_STRING [LABEL_OPTIONAL]

### Message `BuildVersion`
- 1: `version` TYPE_MESSAGE (envoy.type.v3.SemanticVersion) [LABEL_OPTIONAL]
- 2: `metadata` TYPE_MESSAGE (google.protobuf.Struct) [LABEL_OPTIONAL]

### Message `Extension`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `category` TYPE_STRING [LABEL_OPTIONAL]
- 3: `type_descriptor` TYPE_STRING [LABEL_OPTIONAL]
- 4: `version` TYPE_MESSAGE (envoy.config.core.v3.BuildVersion) [LABEL_OPTIONAL]
- 5: `disabled` TYPE_BOOL [LABEL_OPTIONAL]
- 6: `type_urls` TYPE_STRING [LABEL_REPEATED]

### Message `Node`
- 1: `id` TYPE_STRING [LABEL_OPTIONAL]
- 2: `cluster` TYPE_STRING [LABEL_OPTIONAL]
- 3: `metadata` TYPE_MESSAGE (google.protobuf.Struct) [LABEL_OPTIONAL]
- 12: `dynamic_parameters` TYPE_MESSAGE (envoy.config.core.v3.Node.DynamicParametersEntry) [LABEL_REPEATED]
- 4: `locality` TYPE_MESSAGE (envoy.config.core.v3.Locality) [LABEL_OPTIONAL]
- 6: `user_agent_name` TYPE_STRING [LABEL_OPTIONAL]
- 7: `user_agent_version` TYPE_STRING [LABEL_OPTIONAL]
- 8: `user_agent_build_version` TYPE_MESSAGE (envoy.config.core.v3.BuildVersion) [LABEL_OPTIONAL]
- 9: `extensions` TYPE_MESSAGE (envoy.config.core.v3.Extension) [LABEL_REPEATED]
- 10: `client_features` TYPE_STRING [LABEL_REPEATED]
- 11: `listening_addresses` TYPE_MESSAGE (envoy.config.core.v3.Address) [LABEL_REPEATED]
- nested: DynamicParametersEntry

### Message `Metadata`
- 1: `filter_metadata` TYPE_MESSAGE (envoy.config.core.v3.Metadata.FilterMetadataEntry) [LABEL_REPEATED]
- 2: `typed_filter_metadata` TYPE_MESSAGE (envoy.config.core.v3.Metadata.TypedFilterMetadataEntry) [LABEL_REPEATED]
- nested: FilterMetadataEntry, TypedFilterMetadataEntry

### Message `RuntimeUInt32`
- 2: `default_value` TYPE_UINT32 [LABEL_OPTIONAL]
- 3: `runtime_key` TYPE_STRING [LABEL_OPTIONAL]

### Message `RuntimePercent`
- 1: `default_value` TYPE_MESSAGE (envoy.type.v3.Percent) [LABEL_OPTIONAL]
- 2: `runtime_key` TYPE_STRING [LABEL_OPTIONAL]

### Message `RuntimeDouble`
- 1: `default_value` TYPE_DOUBLE [LABEL_OPTIONAL]
- 2: `runtime_key` TYPE_STRING [LABEL_OPTIONAL]

### Message `RuntimeFeatureFlag`
- 1: `default_value` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 2: `runtime_key` TYPE_STRING [LABEL_OPTIONAL]

### Message `QueryParameter`
- 1: `key` TYPE_STRING [LABEL_OPTIONAL]
- 2: `value` TYPE_STRING [LABEL_OPTIONAL]

### Message `HeaderValue`
- 1: `key` TYPE_STRING [LABEL_OPTIONAL]
- 2: `value` TYPE_STRING [LABEL_OPTIONAL]
- 3: `raw_value` TYPE_BYTES [LABEL_OPTIONAL]

### Message `HeaderValueOption`
- 1: `header` TYPE_MESSAGE (envoy.config.core.v3.HeaderValue) [LABEL_OPTIONAL]
- 2: `append` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 3: `append_action` TYPE_ENUM (envoy.config.core.v3.HeaderValueOption.HeaderAppendAction) [LABEL_OPTIONAL]
- 4: `keep_empty_value` TYPE_BOOL [LABEL_OPTIONAL]

### Message `HeaderMap`
- 1: `headers` TYPE_MESSAGE (envoy.config.core.v3.HeaderValue) [LABEL_REPEATED]

### Message `WatchedDirectory`
- 1: `path` TYPE_STRING [LABEL_OPTIONAL]

### Message `DataSource`
- 1: `filename` TYPE_STRING [LABEL_OPTIONAL]
- 2: `inline_bytes` TYPE_BYTES [LABEL_OPTIONAL]
- 3: `inline_string` TYPE_STRING [LABEL_OPTIONAL]
- 4: `environment_variable` TYPE_STRING [LABEL_OPTIONAL]

### Message `RetryPolicy`
- 1: `retry_back_off` TYPE_MESSAGE (envoy.config.core.v3.BackoffStrategy) [LABEL_OPTIONAL]
- 2: `num_retries` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]

### Message `RemoteDataSource`
- 1: `http_uri` TYPE_MESSAGE (envoy.config.core.v3.HttpUri) [LABEL_OPTIONAL]
- 2: `sha256` TYPE_STRING [LABEL_OPTIONAL]
- 3: `retry_policy` TYPE_MESSAGE (envoy.config.core.v3.RetryPolicy) [LABEL_OPTIONAL]

### Message `AsyncDataSource`
- 1: `local` TYPE_MESSAGE (envoy.config.core.v3.DataSource) [LABEL_OPTIONAL]
- 2: `remote` TYPE_MESSAGE (envoy.config.core.v3.RemoteDataSource) [LABEL_OPTIONAL]

### Message `TransportSocket`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 3: `typed_config` TYPE_MESSAGE (google.protobuf.Any) [LABEL_OPTIONAL]

### Message `RuntimeFractionalPercent`
- 1: `default_value` TYPE_MESSAGE (envoy.type.v3.FractionalPercent) [LABEL_OPTIONAL]
- 2: `runtime_key` TYPE_STRING [LABEL_OPTIONAL]

### Message `ControlPlane`
- 1: `identifier` TYPE_STRING [LABEL_OPTIONAL]

### Enum `RoutingPriority`
- 0 = `DEFAULT`
- 1 = `HIGH`

### Enum `RequestMethod`
- 0 = `METHOD_UNSPECIFIED`
- 1 = `GET`
- 2 = `HEAD`
- 3 = `POST`
- 4 = `PUT`
- 5 = `DELETE`
- 6 = `CONNECT`
- 7 = `OPTIONS`
- 8 = `TRACE`
- 9 = `PATCH`

### Enum `TrafficDirection`
- 0 = `UNSPECIFIED`
- 1 = `INBOUND`
- 2 = `OUTBOUND`

## `envoy/config/core/v3/config_source.proto`
package `envoy.config.core.v3` · syntax `proto3`
deps: `envoy/config/core/v3/base.proto`, `envoy/config/core/v3/extension.proto`, `envoy/config/core/v3/grpc_service.proto`, `google/protobuf/any.proto`, `google/protobuf/duration.proto`, `google/protobuf/wrappers.proto`, `xds/core/v3/authority.proto`, `envoy/annotations/deprecation.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `ApiConfigSource`
- 1: `api_type` TYPE_ENUM (envoy.config.core.v3.ApiConfigSource.ApiType) [LABEL_OPTIONAL]
- 8: `transport_api_version` TYPE_ENUM (envoy.config.core.v3.ApiVersion) [LABEL_OPTIONAL]
- 2: `cluster_names` TYPE_STRING [LABEL_REPEATED]
- 4: `grpc_services` TYPE_MESSAGE (envoy.config.core.v3.GrpcService) [LABEL_REPEATED]
- 3: `refresh_delay` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 5: `request_timeout` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 6: `rate_limit_settings` TYPE_MESSAGE (envoy.config.core.v3.RateLimitSettings) [LABEL_OPTIONAL]
- 7: `set_node_on_first_message_only` TYPE_BOOL [LABEL_OPTIONAL]
- 9: `config_validators` TYPE_MESSAGE (envoy.config.core.v3.TypedExtensionConfig) [LABEL_REPEATED]

### Message `AggregatedConfigSource`

### Message `SelfConfigSource`
- 1: `transport_api_version` TYPE_ENUM (envoy.config.core.v3.ApiVersion) [LABEL_OPTIONAL]

### Message `RateLimitSettings`
- 1: `max_tokens` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 2: `fill_rate` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]

### Message `PathConfigSource`
- 1: `path` TYPE_STRING [LABEL_OPTIONAL]
- 2: `watched_directory` TYPE_MESSAGE (envoy.config.core.v3.WatchedDirectory) [LABEL_OPTIONAL]

### Message `ConfigSource`
- 7: `authorities` TYPE_MESSAGE (xds.core.v3.Authority) [LABEL_REPEATED]
- 1: `path` TYPE_STRING [LABEL_OPTIONAL]
- 8: `path_config_source` TYPE_MESSAGE (envoy.config.core.v3.PathConfigSource) [LABEL_OPTIONAL]
- 2: `api_config_source` TYPE_MESSAGE (envoy.config.core.v3.ApiConfigSource) [LABEL_OPTIONAL]
- 3: `ads` TYPE_MESSAGE (envoy.config.core.v3.AggregatedConfigSource) [LABEL_OPTIONAL]
- 5: `self` TYPE_MESSAGE (envoy.config.core.v3.SelfConfigSource) [LABEL_OPTIONAL]
- 4: `initial_fetch_timeout` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 6: `resource_api_version` TYPE_ENUM (envoy.config.core.v3.ApiVersion) [LABEL_OPTIONAL]

### Message `ExtensionConfigSource`
- 1: `config_source` TYPE_MESSAGE (envoy.config.core.v3.ConfigSource) [LABEL_OPTIONAL]
- 2: `default_config` TYPE_MESSAGE (google.protobuf.Any) [LABEL_OPTIONAL]
- 3: `apply_default_config_without_warming` TYPE_BOOL [LABEL_OPTIONAL]
- 4: `type_urls` TYPE_STRING [LABEL_REPEATED]

### Enum `ApiVersion`
- 0 = `AUTO`
- 1 = `V2`
- 2 = `V3`

## `envoy/config/core/v3/event_service_config.proto`
package `envoy.config.core.v3` · syntax `proto3`
deps: `envoy/config/core/v3/grpc_service.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `EventServiceConfig`
- 1: `grpc_service` TYPE_MESSAGE (envoy.config.core.v3.GrpcService) [LABEL_OPTIONAL]

## `envoy/config/core/v3/extension.proto`
package `envoy.config.core.v3` · syntax `proto3`
deps: `google/protobuf/any.proto`, `udpa/annotations/status.proto`, `validate/validate.proto`

### Message `TypedExtensionConfig`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `typed_config` TYPE_MESSAGE (google.protobuf.Any) [LABEL_OPTIONAL]

## `envoy/config/core/v3/grpc_service.proto`
package `envoy.config.core.v3` · syntax `proto3`
deps: `envoy/config/core/v3/base.proto`, `google/protobuf/any.proto`, `google/protobuf/duration.proto`, `google/protobuf/empty.proto`, `google/protobuf/struct.proto`, `google/protobuf/wrappers.proto`, `udpa/annotations/sensitive.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `GrpcService`
- 1: `envoy_grpc` TYPE_MESSAGE (envoy.config.core.v3.GrpcService.EnvoyGrpc) [LABEL_OPTIONAL]
- 2: `google_grpc` TYPE_MESSAGE (envoy.config.core.v3.GrpcService.GoogleGrpc) [LABEL_OPTIONAL]
- 3: `timeout` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 5: `initial_metadata` TYPE_MESSAGE (envoy.config.core.v3.HeaderValue) [LABEL_REPEATED]
- nested: EnvoyGrpc, GoogleGrpc

## `envoy/config/core/v3/health_check.proto`
package `envoy.config.core.v3` · syntax `proto3`
deps: `envoy/config/core/v3/base.proto`, `envoy/config/core/v3/event_service_config.proto`, `envoy/config/core/v3/extension.proto`, `envoy/type/matcher/v3/string.proto`, `envoy/type/v3/http.proto`, `envoy/type/v3/range.proto`, `google/protobuf/any.proto`, `google/protobuf/duration.proto`, `google/protobuf/struct.proto`, `google/protobuf/wrappers.proto`, `envoy/annotations/deprecation.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `HealthStatusSet`
- 1: `statuses` TYPE_ENUM (envoy.config.core.v3.HealthStatus) [LABEL_REPEATED]

### Message `HealthCheck`
- 1: `timeout` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 2: `interval` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 20: `initial_jitter` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 3: `interval_jitter` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 18: `interval_jitter_percent` TYPE_UINT32 [LABEL_OPTIONAL]
- 4: `unhealthy_threshold` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 5: `healthy_threshold` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 6: `alt_port` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 7: `reuse_connection` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 8: `http_health_check` TYPE_MESSAGE (envoy.config.core.v3.HealthCheck.HttpHealthCheck) [LABEL_OPTIONAL]
- 9: `tcp_health_check` TYPE_MESSAGE (envoy.config.core.v3.HealthCheck.TcpHealthCheck) [LABEL_OPTIONAL]
- 11: `grpc_health_check` TYPE_MESSAGE (envoy.config.core.v3.HealthCheck.GrpcHealthCheck) [LABEL_OPTIONAL]
- 13: `custom_health_check` TYPE_MESSAGE (envoy.config.core.v3.HealthCheck.CustomHealthCheck) [LABEL_OPTIONAL]
- 12: `no_traffic_interval` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 24: `no_traffic_healthy_interval` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 14: `unhealthy_interval` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 15: `unhealthy_edge_interval` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 16: `healthy_edge_interval` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 17: `event_log_path` TYPE_STRING [LABEL_OPTIONAL]
- 25: `event_logger` TYPE_MESSAGE (envoy.config.core.v3.TypedExtensionConfig) [LABEL_REPEATED]
- 22: `event_service` TYPE_MESSAGE (envoy.config.core.v3.EventServiceConfig) [LABEL_OPTIONAL]
- 19: `always_log_health_check_failures` TYPE_BOOL [LABEL_OPTIONAL]
- 21: `tls_options` TYPE_MESSAGE (envoy.config.core.v3.HealthCheck.TlsOptions) [LABEL_OPTIONAL]
- 23: `transport_socket_match_criteria` TYPE_MESSAGE (google.protobuf.Struct) [LABEL_OPTIONAL]
- nested: Payload, HttpHealthCheck, TcpHealthCheck, RedisHealthCheck, GrpcHealthCheck, CustomHealthCheck, TlsOptions

### Enum `HealthStatus`
- 0 = `UNKNOWN`
- 1 = `HEALTHY`
- 2 = `UNHEALTHY`
- 3 = `DRAINING`
- 4 = `TIMEOUT`
- 5 = `DEGRADED`

## `envoy/config/core/v3/http_uri.proto`
package `envoy.config.core.v3` · syntax `proto3`
deps: `google/protobuf/duration.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `HttpUri`
- 1: `uri` TYPE_STRING [LABEL_OPTIONAL]
- 2: `cluster` TYPE_STRING [LABEL_OPTIONAL]
- 3: `timeout` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]

## `envoy/config/core/v3/protocol.proto`
package `envoy.config.core.v3` · syntax `proto3`
deps: `envoy/config/core/v3/extension.proto`, `envoy/type/v3/percent.proto`, `google/protobuf/duration.proto`, `google/protobuf/wrappers.proto`, `xds/annotations/v3/status.proto`, `envoy/annotations/deprecation.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `TcpProtocolOptions`

### Message `QuicKeepAliveSettings`
- 1: `max_interval` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 2: `initial_interval` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]

### Message `QuicProtocolOptions`
- 1: `max_concurrent_streams` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 2: `initial_stream_window_size` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 3: `initial_connection_window_size` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 4: `num_timeouts_to_trigger_port_migration` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 5: `connection_keepalive` TYPE_MESSAGE (envoy.config.core.v3.QuicKeepAliveSettings) [LABEL_OPTIONAL]
- 6: `connection_options` TYPE_STRING [LABEL_OPTIONAL]
- 7: `client_connection_options` TYPE_STRING [LABEL_OPTIONAL]

### Message `UpstreamHttpProtocolOptions`
- 1: `auto_sni` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `auto_san_validation` TYPE_BOOL [LABEL_OPTIONAL]
- 3: `override_auto_sni_header` TYPE_STRING [LABEL_OPTIONAL]

### Message `AlternateProtocolsCacheOptions`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `max_entries` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 3: `key_value_store_config` TYPE_MESSAGE (envoy.config.core.v3.TypedExtensionConfig) [LABEL_OPTIONAL]
- 4: `prepopulated_entries` TYPE_MESSAGE (envoy.config.core.v3.AlternateProtocolsCacheOptions.AlternateProtocolsCacheEntry) [LABEL_REPEATED]
- 5: `canonical_suffixes` TYPE_STRING [LABEL_REPEATED]
- nested: AlternateProtocolsCacheEntry

### Message `HttpProtocolOptions`
- 1: `idle_timeout` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 3: `max_connection_duration` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 2: `max_headers_count` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 4: `max_stream_duration` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 5: `headers_with_underscores_action` TYPE_ENUM (envoy.config.core.v3.HttpProtocolOptions.HeadersWithUnderscoresAction) [LABEL_OPTIONAL]
- 6: `max_requests_per_connection` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]

### Message `Http1ProtocolOptions`
- 1: `allow_absolute_url` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 2: `accept_http_10` TYPE_BOOL [LABEL_OPTIONAL]
- 3: `default_host_for_http_10` TYPE_STRING [LABEL_OPTIONAL]
- 4: `header_key_format` TYPE_MESSAGE (envoy.config.core.v3.Http1ProtocolOptions.HeaderKeyFormat) [LABEL_OPTIONAL]
- 5: `enable_trailers` TYPE_BOOL [LABEL_OPTIONAL]
- 6: `allow_chunked_length` TYPE_BOOL [LABEL_OPTIONAL]
- 7: `override_stream_error_on_invalid_http_message` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 8: `send_fully_qualified_url` TYPE_BOOL [LABEL_OPTIONAL]
- 9: `use_balsa_parser` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 10: `allow_custom_methods` TYPE_BOOL [LABEL_OPTIONAL]
- nested: HeaderKeyFormat

### Message `KeepaliveSettings`
- 1: `interval` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 2: `timeout` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 3: `interval_jitter` TYPE_MESSAGE (envoy.type.v3.Percent) [LABEL_OPTIONAL]
- 4: `connection_idle_interval` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]

### Message `Http2ProtocolOptions`
- 1: `hpack_table_size` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 2: `max_concurrent_streams` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 3: `initial_stream_window_size` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 4: `initial_connection_window_size` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 5: `allow_connect` TYPE_BOOL [LABEL_OPTIONAL]
- 6: `allow_metadata` TYPE_BOOL [LABEL_OPTIONAL]
- 7: `max_outbound_frames` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 8: `max_outbound_control_frames` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 9: `max_consecutive_inbound_frames_with_empty_payload` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 10: `max_inbound_priority_frames_per_stream` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 11: `max_inbound_window_update_frames_per_data_frame_sent` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 12: `stream_error_on_invalid_http_messaging` TYPE_BOOL [LABEL_OPTIONAL]
- 14: `override_stream_error_on_invalid_http_message` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 13: `custom_settings_parameters` TYPE_MESSAGE (envoy.config.core.v3.Http2ProtocolOptions.SettingsParameter) [LABEL_REPEATED]
- 15: `connection_keepalive` TYPE_MESSAGE (envoy.config.core.v3.KeepaliveSettings) [LABEL_OPTIONAL]
- 16: `use_oghttp2_codec` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- nested: SettingsParameter

### Message `GrpcProtocolOptions`
- 1: `http2_protocol_options` TYPE_MESSAGE (envoy.config.core.v3.Http2ProtocolOptions) [LABEL_OPTIONAL]

### Message `Http3ProtocolOptions`
- 1: `quic_protocol_options` TYPE_MESSAGE (envoy.config.core.v3.QuicProtocolOptions) [LABEL_OPTIONAL]
- 2: `override_stream_error_on_invalid_http_message` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 5: `allow_extended_connect` TYPE_BOOL [LABEL_OPTIONAL]

### Message `SchemeHeaderTransformation`
- 1: `scheme_to_overwrite` TYPE_STRING [LABEL_OPTIONAL]

## `envoy/config/core/v3/proxy_protocol.proto`
package `envoy.config.core.v3` · syntax `proto3`
deps: `udpa/annotations/status.proto`, `validate/validate.proto`

### Message `ProxyProtocolPassThroughTLVs`
- 1: `match_type` TYPE_ENUM (envoy.config.core.v3.ProxyProtocolPassThroughTLVs.PassTLVsMatchType) [LABEL_OPTIONAL]
- 2: `tlv_type` TYPE_UINT32 [LABEL_REPEATED]

### Message `ProxyProtocolConfig`
- 1: `version` TYPE_ENUM (envoy.config.core.v3.ProxyProtocolConfig.Version) [LABEL_OPTIONAL]
- 2: `pass_through_tlvs` TYPE_MESSAGE (envoy.config.core.v3.ProxyProtocolPassThroughTLVs) [LABEL_OPTIONAL]

## `envoy/config/core/v3/resolver.proto`
package `envoy.config.core.v3` · syntax `proto3`
deps: `envoy/config/core/v3/address.proto`, `udpa/annotations/status.proto`, `validate/validate.proto`

### Message `DnsResolverOptions`
- 1: `use_tcp_for_dns_lookups` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `no_default_search_domain` TYPE_BOOL [LABEL_OPTIONAL]

### Message `DnsResolutionConfig`
- 1: `resolvers` TYPE_MESSAGE (envoy.config.core.v3.Address) [LABEL_REPEATED]
- 2: `dns_resolver_options` TYPE_MESSAGE (envoy.config.core.v3.DnsResolverOptions) [LABEL_OPTIONAL]

## `envoy/config/core/v3/socket_option.proto`
package `envoy.config.core.v3` · syntax `proto3`
deps: `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `SocketOption`
- 1: `description` TYPE_STRING [LABEL_OPTIONAL]
- 2: `level` TYPE_INT64 [LABEL_OPTIONAL]
- 3: `name` TYPE_INT64 [LABEL_OPTIONAL]
- 4: `int_value` TYPE_INT64 [LABEL_OPTIONAL]
- 5: `buf_value` TYPE_BYTES [LABEL_OPTIONAL]
- 6: `state` TYPE_ENUM (envoy.config.core.v3.SocketOption.SocketState) [LABEL_OPTIONAL]

### Message `SocketOptionsOverride`
- 1: `socket_options` TYPE_MESSAGE (envoy.config.core.v3.SocketOption) [LABEL_REPEATED]

## `envoy/config/core/v3/substitution_format_string.proto`
package `envoy.config.core.v3` · syntax `proto3`
deps: `envoy/config/core/v3/base.proto`, `envoy/config/core/v3/extension.proto`, `google/protobuf/struct.proto`, `envoy/annotations/deprecation.proto`, `udpa/annotations/status.proto`, `validate/validate.proto`

### Message `JsonFormatOptions`
- 1: `sort_properties` TYPE_BOOL [LABEL_OPTIONAL]

### Message `SubstitutionFormatString`
- 1: `text_format` TYPE_STRING [LABEL_OPTIONAL]
- 2: `json_format` TYPE_MESSAGE (google.protobuf.Struct) [LABEL_OPTIONAL]
- 5: `text_format_source` TYPE_MESSAGE (envoy.config.core.v3.DataSource) [LABEL_OPTIONAL]
- 3: `omit_empty_values` TYPE_BOOL [LABEL_OPTIONAL]
- 4: `content_type` TYPE_STRING [LABEL_OPTIONAL]
- 6: `formatters` TYPE_MESSAGE (envoy.config.core.v3.TypedExtensionConfig) [LABEL_REPEATED]
- 7: `json_format_options` TYPE_MESSAGE (envoy.config.core.v3.JsonFormatOptions) [LABEL_OPTIONAL]

## `envoy/config/core/v3/udp_socket_config.proto`
package `envoy.config.core.v3` · syntax `proto3`
deps: `google/protobuf/wrappers.proto`, `udpa/annotations/status.proto`, `validate/validate.proto`

### Message `UdpSocketConfig`
- 1: `max_rx_datagram_size` TYPE_MESSAGE (google.protobuf.UInt64Value) [LABEL_OPTIONAL]
- 2: `prefer_gro` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]

## `envoy/config/endpoint/v3/endpoint.proto`
package `envoy.config.endpoint.v3` · syntax `proto3`
deps: `envoy/config/endpoint/v3/endpoint_components.proto`, `envoy/type/v3/percent.proto`, `google/protobuf/duration.proto`, `google/protobuf/wrappers.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `ClusterLoadAssignment`
- 1: `cluster_name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `endpoints` TYPE_MESSAGE (envoy.config.endpoint.v3.LocalityLbEndpoints) [LABEL_REPEATED]
- 5: `named_endpoints` TYPE_MESSAGE (envoy.config.endpoint.v3.ClusterLoadAssignment.NamedEndpointsEntry) [LABEL_REPEATED]
- 4: `policy` TYPE_MESSAGE (envoy.config.endpoint.v3.ClusterLoadAssignment.Policy) [LABEL_OPTIONAL]
- nested: Policy, NamedEndpointsEntry

## `envoy/config/endpoint/v3/endpoint_components.proto`
package `envoy.config.endpoint.v3` · syntax `proto3`
deps: `envoy/config/core/v3/address.proto`, `envoy/config/core/v3/base.proto`, `envoy/config/core/v3/config_source.proto`, `envoy/config/core/v3/health_check.proto`, `google/protobuf/wrappers.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `Endpoint`
- 1: `address` TYPE_MESSAGE (envoy.config.core.v3.Address) [LABEL_OPTIONAL]
- 2: `health_check_config` TYPE_MESSAGE (envoy.config.endpoint.v3.Endpoint.HealthCheckConfig) [LABEL_OPTIONAL]
- 3: `hostname` TYPE_STRING [LABEL_OPTIONAL]
- 4: `additional_addresses` TYPE_MESSAGE (envoy.config.endpoint.v3.Endpoint.AdditionalAddress) [LABEL_REPEATED]
- nested: HealthCheckConfig, AdditionalAddress

### Message `LbEndpoint`
- 1: `endpoint` TYPE_MESSAGE (envoy.config.endpoint.v3.Endpoint) [LABEL_OPTIONAL]
- 5: `endpoint_name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `health_status` TYPE_ENUM (envoy.config.core.v3.HealthStatus) [LABEL_OPTIONAL]
- 3: `metadata` TYPE_MESSAGE (envoy.config.core.v3.Metadata) [LABEL_OPTIONAL]
- 4: `load_balancing_weight` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]

### Message `LedsClusterLocalityConfig`
- 1: `leds_config` TYPE_MESSAGE (envoy.config.core.v3.ConfigSource) [LABEL_OPTIONAL]
- 2: `leds_collection_name` TYPE_STRING [LABEL_OPTIONAL]

### Message `LocalityLbEndpoints`
- 1: `locality` TYPE_MESSAGE (envoy.config.core.v3.Locality) [LABEL_OPTIONAL]
- 2: `lb_endpoints` TYPE_MESSAGE (envoy.config.endpoint.v3.LbEndpoint) [LABEL_REPEATED]
- 7: `load_balancer_endpoints` TYPE_MESSAGE (envoy.config.endpoint.v3.LocalityLbEndpoints.LbEndpointList) [LABEL_OPTIONAL]
- 8: `leds_cluster_locality_config` TYPE_MESSAGE (envoy.config.endpoint.v3.LedsClusterLocalityConfig) [LABEL_OPTIONAL]
- 3: `load_balancing_weight` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 5: `priority` TYPE_UINT32 [LABEL_OPTIONAL]
- 6: `proximity` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- nested: LbEndpointList

## `envoy/config/endpoint/v3/load_report.proto`
package `envoy.config.endpoint.v3` · syntax `proto3`
deps: `envoy/config/core/v3/address.proto`, `envoy/config/core/v3/base.proto`, `google/protobuf/duration.proto`, `google/protobuf/struct.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `UpstreamLocalityStats`
- 1: `locality` TYPE_MESSAGE (envoy.config.core.v3.Locality) [LABEL_OPTIONAL]
- 2: `total_successful_requests` TYPE_UINT64 [LABEL_OPTIONAL]
- 3: `total_requests_in_progress` TYPE_UINT64 [LABEL_OPTIONAL]
- 4: `total_error_requests` TYPE_UINT64 [LABEL_OPTIONAL]
- 8: `total_issued_requests` TYPE_UINT64 [LABEL_OPTIONAL]
- 5: `load_metric_stats` TYPE_MESSAGE (envoy.config.endpoint.v3.EndpointLoadMetricStats) [LABEL_REPEATED]
- 7: `upstream_endpoint_stats` TYPE_MESSAGE (envoy.config.endpoint.v3.UpstreamEndpointStats) [LABEL_REPEATED]
- 6: `priority` TYPE_UINT32 [LABEL_OPTIONAL]

### Message `UpstreamEndpointStats`
- 1: `address` TYPE_MESSAGE (envoy.config.core.v3.Address) [LABEL_OPTIONAL]
- 6: `metadata` TYPE_MESSAGE (google.protobuf.Struct) [LABEL_OPTIONAL]
- 2: `total_successful_requests` TYPE_UINT64 [LABEL_OPTIONAL]
- 3: `total_requests_in_progress` TYPE_UINT64 [LABEL_OPTIONAL]
- 4: `total_error_requests` TYPE_UINT64 [LABEL_OPTIONAL]
- 7: `total_issued_requests` TYPE_UINT64 [LABEL_OPTIONAL]
- 5: `load_metric_stats` TYPE_MESSAGE (envoy.config.endpoint.v3.EndpointLoadMetricStats) [LABEL_REPEATED]

### Message `EndpointLoadMetricStats`
- 1: `metric_name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `num_requests_finished_with_metric` TYPE_UINT64 [LABEL_OPTIONAL]
- 3: `total_metric_value` TYPE_DOUBLE [LABEL_OPTIONAL]

### Message `ClusterStats`
- 1: `cluster_name` TYPE_STRING [LABEL_OPTIONAL]
- 6: `cluster_service_name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `upstream_locality_stats` TYPE_MESSAGE (envoy.config.endpoint.v3.UpstreamLocalityStats) [LABEL_REPEATED]
- 3: `total_dropped_requests` TYPE_UINT64 [LABEL_OPTIONAL]
- 5: `dropped_requests` TYPE_MESSAGE (envoy.config.endpoint.v3.ClusterStats.DroppedRequests) [LABEL_REPEATED]
- 4: `load_report_interval` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- nested: DroppedRequests

## `envoy/config/listener/v3/api_listener.proto`
package `envoy.config.listener.v3` · syntax `proto3`
deps: `google/protobuf/any.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`

### Message `ApiListener`
- 1: `api_listener` TYPE_MESSAGE (google.protobuf.Any) [LABEL_OPTIONAL]

## `envoy/config/listener/v3/listener.proto`
package `envoy.config.listener.v3` · syntax `proto3`
deps: `envoy/config/accesslog/v3/accesslog.proto`, `envoy/config/core/v3/address.proto`, `envoy/config/core/v3/base.proto`, `envoy/config/core/v3/extension.proto`, `envoy/config/core/v3/socket_option.proto`, `envoy/config/listener/v3/api_listener.proto`, `envoy/config/listener/v3/listener_components.proto`, `envoy/config/listener/v3/udp_listener_config.proto`, `google/protobuf/duration.proto`, `google/protobuf/wrappers.proto`, `xds/annotations/v3/status.proto`, `xds/core/v3/collection_entry.proto`, `xds/type/matcher/v3/matcher.proto`, `envoy/annotations/deprecation.proto`, `udpa/annotations/security.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `AdditionalAddress`
- 1: `address` TYPE_MESSAGE (envoy.config.core.v3.Address) [LABEL_OPTIONAL]
- 2: `socket_options` TYPE_MESSAGE (envoy.config.core.v3.SocketOptionsOverride) [LABEL_OPTIONAL]

### Message `ListenerCollection`
- 1: `entries` TYPE_MESSAGE (xds.core.v3.CollectionEntry) [LABEL_REPEATED]

### Message `Listener`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `address` TYPE_MESSAGE (envoy.config.core.v3.Address) [LABEL_OPTIONAL]
- 33: `additional_addresses` TYPE_MESSAGE (envoy.config.listener.v3.AdditionalAddress) [LABEL_REPEATED]
- 28: `stat_prefix` TYPE_STRING [LABEL_OPTIONAL]
- 3: `filter_chains` TYPE_MESSAGE (envoy.config.listener.v3.FilterChain) [LABEL_REPEATED]
- 32: `filter_chain_matcher` TYPE_MESSAGE (xds.type.matcher.v3.Matcher) [LABEL_OPTIONAL]
- 4: `use_original_dst` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 25: `default_filter_chain` TYPE_MESSAGE (envoy.config.listener.v3.FilterChain) [LABEL_OPTIONAL]
- 5: `per_connection_buffer_limit_bytes` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 6: `metadata` TYPE_MESSAGE (envoy.config.core.v3.Metadata) [LABEL_OPTIONAL]
- 7: `deprecated_v1` TYPE_MESSAGE (envoy.config.listener.v3.Listener.DeprecatedV1) [LABEL_OPTIONAL]
- 8: `drain_type` TYPE_ENUM (envoy.config.listener.v3.Listener.DrainType) [LABEL_OPTIONAL]
- 9: `listener_filters` TYPE_MESSAGE (envoy.config.listener.v3.ListenerFilter) [LABEL_REPEATED]
- 15: `listener_filters_timeout` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 17: `continue_on_listener_filters_timeout` TYPE_BOOL [LABEL_OPTIONAL]
- 10: `transparent` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 11: `freebind` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 13: `socket_options` TYPE_MESSAGE (envoy.config.core.v3.SocketOption) [LABEL_REPEATED]
- 12: `tcp_fast_open_queue_length` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 16: `traffic_direction` TYPE_ENUM (envoy.config.core.v3.TrafficDirection) [LABEL_OPTIONAL]
- 18: `udp_listener_config` TYPE_MESSAGE (envoy.config.listener.v3.UdpListenerConfig) [LABEL_OPTIONAL]
- 19: `api_listener` TYPE_MESSAGE (envoy.config.listener.v3.ApiListener) [LABEL_OPTIONAL]
- 20: `connection_balance_config` TYPE_MESSAGE (envoy.config.listener.v3.Listener.ConnectionBalanceConfig) [LABEL_OPTIONAL]
- 21: `reuse_port` TYPE_BOOL [LABEL_OPTIONAL]
- 29: `enable_reuse_port` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 22: `access_log` TYPE_MESSAGE (envoy.config.accesslog.v3.AccessLog) [LABEL_REPEATED]
- 24: `tcp_backlog_size` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 34: `max_connections_to_accept_per_socket_event` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 26: `bind_to_port` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 27: `internal_listener` TYPE_MESSAGE (envoy.config.listener.v3.Listener.InternalListenerConfig) [LABEL_OPTIONAL]
- 30: `enable_mptcp` TYPE_BOOL [LABEL_OPTIONAL]
- 31: `ignore_global_conn_limit` TYPE_BOOL [LABEL_OPTIONAL]
- nested: DeprecatedV1, ConnectionBalanceConfig, InternalListenerConfig

### Message `ListenerManager`

### Message `ValidationListenerManager`

### Message `ApiListenerManager`

## `envoy/config/listener/v3/listener_components.proto`
package `envoy.config.listener.v3` · syntax `proto3`
deps: `envoy/config/core/v3/address.proto`, `envoy/config/core/v3/base.proto`, `envoy/config/core/v3/config_source.proto`, `envoy/type/v3/range.proto`, `google/protobuf/any.proto`, `google/protobuf/duration.proto`, `google/protobuf/wrappers.proto`, `envoy/annotations/deprecation.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `Filter`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 4: `typed_config` TYPE_MESSAGE (google.protobuf.Any) [LABEL_OPTIONAL]
- 5: `config_discovery` TYPE_MESSAGE (envoy.config.core.v3.ExtensionConfigSource) [LABEL_OPTIONAL]

### Message `FilterChainMatch`
- 8: `destination_port` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 3: `prefix_ranges` TYPE_MESSAGE (envoy.config.core.v3.CidrRange) [LABEL_REPEATED]
- 4: `address_suffix` TYPE_STRING [LABEL_OPTIONAL]
- 5: `suffix_len` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 13: `direct_source_prefix_ranges` TYPE_MESSAGE (envoy.config.core.v3.CidrRange) [LABEL_REPEATED]
- 12: `source_type` TYPE_ENUM (envoy.config.listener.v3.FilterChainMatch.ConnectionSourceType) [LABEL_OPTIONAL]
- 6: `source_prefix_ranges` TYPE_MESSAGE (envoy.config.core.v3.CidrRange) [LABEL_REPEATED]
- 7: `source_ports` TYPE_UINT32 [LABEL_REPEATED]
- 11: `server_names` TYPE_STRING [LABEL_REPEATED]
- 9: `transport_protocol` TYPE_STRING [LABEL_OPTIONAL]
- 10: `application_protocols` TYPE_STRING [LABEL_REPEATED]

### Message `FilterChain`
- 1: `filter_chain_match` TYPE_MESSAGE (envoy.config.listener.v3.FilterChainMatch) [LABEL_OPTIONAL]
- 3: `filters` TYPE_MESSAGE (envoy.config.listener.v3.Filter) [LABEL_REPEATED]
- 4: `use_proxy_proto` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 5: `metadata` TYPE_MESSAGE (envoy.config.core.v3.Metadata) [LABEL_OPTIONAL]
- 6: `transport_socket` TYPE_MESSAGE (envoy.config.core.v3.TransportSocket) [LABEL_OPTIONAL]
- 9: `transport_socket_connect_timeout` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 7: `name` TYPE_STRING [LABEL_OPTIONAL]
- 8: `on_demand_configuration` TYPE_MESSAGE (envoy.config.listener.v3.FilterChain.OnDemandConfiguration) [LABEL_OPTIONAL]
- nested: OnDemandConfiguration

### Message `ListenerFilterChainMatchPredicate`
- 1: `or_match` TYPE_MESSAGE (envoy.config.listener.v3.ListenerFilterChainMatchPredicate.MatchSet) [LABEL_OPTIONAL]
- 2: `and_match` TYPE_MESSAGE (envoy.config.listener.v3.ListenerFilterChainMatchPredicate.MatchSet) [LABEL_OPTIONAL]
- 3: `not_match` TYPE_MESSAGE (envoy.config.listener.v3.ListenerFilterChainMatchPredicate) [LABEL_OPTIONAL]
- 4: `any_match` TYPE_BOOL [LABEL_OPTIONAL]
- 5: `destination_port_range` TYPE_MESSAGE (envoy.type.v3.Int32Range) [LABEL_OPTIONAL]
- nested: MatchSet

### Message `ListenerFilter`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 3: `typed_config` TYPE_MESSAGE (google.protobuf.Any) [LABEL_OPTIONAL]
- 5: `config_discovery` TYPE_MESSAGE (envoy.config.core.v3.ExtensionConfigSource) [LABEL_OPTIONAL]
- 4: `filter_disabled` TYPE_MESSAGE (envoy.config.listener.v3.ListenerFilterChainMatchPredicate) [LABEL_OPTIONAL]

## `envoy/config/listener/v3/quic_config.proto`
package `envoy.config.listener.v3` · syntax `proto3`
deps: `envoy/config/core/v3/base.proto`, `envoy/config/core/v3/extension.proto`, `envoy/config/core/v3/protocol.proto`, `google/protobuf/duration.proto`, `google/protobuf/wrappers.proto`, `xds/annotations/v3/status.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `QuicProtocolOptions`
- 1: `quic_protocol_options` TYPE_MESSAGE (envoy.config.core.v3.QuicProtocolOptions) [LABEL_OPTIONAL]
- 2: `idle_timeout` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 3: `crypto_handshake_timeout` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 4: `enabled` TYPE_MESSAGE (envoy.config.core.v3.RuntimeFeatureFlag) [LABEL_OPTIONAL]
- 5: `packets_to_read_to_connection_count_ratio` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 6: `crypto_stream_config` TYPE_MESSAGE (envoy.config.core.v3.TypedExtensionConfig) [LABEL_OPTIONAL]
- 7: `proof_source_config` TYPE_MESSAGE (envoy.config.core.v3.TypedExtensionConfig) [LABEL_OPTIONAL]
- 8: `connection_id_generator_config` TYPE_MESSAGE (envoy.config.core.v3.TypedExtensionConfig) [LABEL_OPTIONAL]
- 9: `server_preferred_address_config` TYPE_MESSAGE (envoy.config.core.v3.TypedExtensionConfig) [LABEL_OPTIONAL]

## `envoy/config/listener/v3/udp_listener_config.proto`
package `envoy.config.listener.v3` · syntax `proto3`
deps: `envoy/config/core/v3/extension.proto`, `envoy/config/core/v3/udp_socket_config.proto`, `envoy/config/listener/v3/quic_config.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`

### Message `UdpListenerConfig`
- 5: `downstream_socket_config` TYPE_MESSAGE (envoy.config.core.v3.UdpSocketConfig) [LABEL_OPTIONAL]
- 7: `quic_options` TYPE_MESSAGE (envoy.config.listener.v3.QuicProtocolOptions) [LABEL_OPTIONAL]
- 8: `udp_packet_packet_writer_config` TYPE_MESSAGE (envoy.config.core.v3.TypedExtensionConfig) [LABEL_OPTIONAL]

### Message `ActiveRawUdpListenerConfig`

## `envoy/config/rbac/v3/rbac.proto`
package `envoy.config.rbac.v3` · syntax `proto3`
deps: `envoy/config/core/v3/address.proto`, `envoy/config/core/v3/extension.proto`, `envoy/config/route/v3/route_components.proto`, `envoy/type/matcher/v3/filter_state.proto`, `envoy/type/matcher/v3/metadata.proto`, `envoy/type/matcher/v3/path.proto`, `envoy/type/matcher/v3/string.proto`, `envoy/type/v3/range.proto`, `google/api/expr/v1alpha1/checked.proto`, `google/api/expr/v1alpha1/syntax.proto`, `envoy/annotations/deprecation.proto`, `udpa/annotations/migrate.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `RBAC`
- 1: `action` TYPE_ENUM (envoy.config.rbac.v3.RBAC.Action) [LABEL_OPTIONAL]
- 2: `policies` TYPE_MESSAGE (envoy.config.rbac.v3.RBAC.PoliciesEntry) [LABEL_REPEATED]
- 3: `audit_logging_options` TYPE_MESSAGE (envoy.config.rbac.v3.RBAC.AuditLoggingOptions) [LABEL_OPTIONAL]
- nested: AuditLoggingOptions, PoliciesEntry

### Message `Policy`
- 1: `permissions` TYPE_MESSAGE (envoy.config.rbac.v3.Permission) [LABEL_REPEATED]
- 2: `principals` TYPE_MESSAGE (envoy.config.rbac.v3.Principal) [LABEL_REPEATED]
- 3: `condition` TYPE_MESSAGE (google.api.expr.v1alpha1.Expr) [LABEL_OPTIONAL]
- 4: `checked_condition` TYPE_MESSAGE (google.api.expr.v1alpha1.CheckedExpr) [LABEL_OPTIONAL]

### Message `Permission`
- 1: `and_rules` TYPE_MESSAGE (envoy.config.rbac.v3.Permission.Set) [LABEL_OPTIONAL]
- 2: `or_rules` TYPE_MESSAGE (envoy.config.rbac.v3.Permission.Set) [LABEL_OPTIONAL]
- 3: `any` TYPE_BOOL [LABEL_OPTIONAL]
- 4: `header` TYPE_MESSAGE (envoy.config.route.v3.HeaderMatcher) [LABEL_OPTIONAL]
- 10: `url_path` TYPE_MESSAGE (envoy.type.matcher.v3.PathMatcher) [LABEL_OPTIONAL]
- 5: `destination_ip` TYPE_MESSAGE (envoy.config.core.v3.CidrRange) [LABEL_OPTIONAL]
- 6: `destination_port` TYPE_UINT32 [LABEL_OPTIONAL]
- 11: `destination_port_range` TYPE_MESSAGE (envoy.type.v3.Int32Range) [LABEL_OPTIONAL]
- 7: `metadata` TYPE_MESSAGE (envoy.type.matcher.v3.MetadataMatcher) [LABEL_OPTIONAL]
- 8: `not_rule` TYPE_MESSAGE (envoy.config.rbac.v3.Permission) [LABEL_OPTIONAL]
- 9: `requested_server_name` TYPE_MESSAGE (envoy.type.matcher.v3.StringMatcher) [LABEL_OPTIONAL]
- 12: `matcher` TYPE_MESSAGE (envoy.config.core.v3.TypedExtensionConfig) [LABEL_OPTIONAL]
- nested: Set

### Message `Principal`
- 1: `and_ids` TYPE_MESSAGE (envoy.config.rbac.v3.Principal.Set) [LABEL_OPTIONAL]
- 2: `or_ids` TYPE_MESSAGE (envoy.config.rbac.v3.Principal.Set) [LABEL_OPTIONAL]
- 3: `any` TYPE_BOOL [LABEL_OPTIONAL]
- 4: `authenticated` TYPE_MESSAGE (envoy.config.rbac.v3.Principal.Authenticated) [LABEL_OPTIONAL]
- 5: `source_ip` TYPE_MESSAGE (envoy.config.core.v3.CidrRange) [LABEL_OPTIONAL]
- 10: `direct_remote_ip` TYPE_MESSAGE (envoy.config.core.v3.CidrRange) [LABEL_OPTIONAL]
- 11: `remote_ip` TYPE_MESSAGE (envoy.config.core.v3.CidrRange) [LABEL_OPTIONAL]
- 6: `header` TYPE_MESSAGE (envoy.config.route.v3.HeaderMatcher) [LABEL_OPTIONAL]
- 9: `url_path` TYPE_MESSAGE (envoy.type.matcher.v3.PathMatcher) [LABEL_OPTIONAL]
- 7: `metadata` TYPE_MESSAGE (envoy.type.matcher.v3.MetadataMatcher) [LABEL_OPTIONAL]
- 12: `filter_state` TYPE_MESSAGE (envoy.type.matcher.v3.FilterStateMatcher) [LABEL_OPTIONAL]
- 8: `not_id` TYPE_MESSAGE (envoy.config.rbac.v3.Principal) [LABEL_OPTIONAL]
- nested: Set, Authenticated

### Message `Action`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `action` TYPE_ENUM (envoy.config.rbac.v3.RBAC.Action) [LABEL_OPTIONAL]

## `envoy/config/route/v3/route.proto`
package `envoy.config.route.v3` · syntax `proto3`
deps: `envoy/config/core/v3/base.proto`, `envoy/config/core/v3/config_source.proto`, `envoy/config/route/v3/route_components.proto`, `google/protobuf/any.proto`, `google/protobuf/wrappers.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `RouteConfiguration`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `virtual_hosts` TYPE_MESSAGE (envoy.config.route.v3.VirtualHost) [LABEL_REPEATED]
- 9: `vhds` TYPE_MESSAGE (envoy.config.route.v3.Vhds) [LABEL_OPTIONAL]
- 3: `internal_only_headers` TYPE_STRING [LABEL_REPEATED]
- 4: `response_headers_to_add` TYPE_MESSAGE (envoy.config.core.v3.HeaderValueOption) [LABEL_REPEATED]
- 5: `response_headers_to_remove` TYPE_STRING [LABEL_REPEATED]
- 6: `request_headers_to_add` TYPE_MESSAGE (envoy.config.core.v3.HeaderValueOption) [LABEL_REPEATED]
- 8: `request_headers_to_remove` TYPE_STRING [LABEL_REPEATED]
- 10: `most_specific_header_mutations_wins` TYPE_BOOL [LABEL_OPTIONAL]
- 7: `validate_clusters` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 11: `max_direct_response_body_size_bytes` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 12: `cluster_specifier_plugins` TYPE_MESSAGE (envoy.config.route.v3.ClusterSpecifierPlugin) [LABEL_REPEATED]
- 13: `request_mirror_policies` TYPE_MESSAGE (envoy.config.route.v3.RouteAction.RequestMirrorPolicy) [LABEL_REPEATED]
- 14: `ignore_port_in_host_matching` TYPE_BOOL [LABEL_OPTIONAL]
- 15: `ignore_path_parameters_in_path_matching` TYPE_BOOL [LABEL_OPTIONAL]
- 16: `typed_per_filter_config` TYPE_MESSAGE (envoy.config.route.v3.RouteConfiguration.TypedPerFilterConfigEntry) [LABEL_REPEATED]
- 17: `metadata` TYPE_MESSAGE (envoy.config.core.v3.Metadata) [LABEL_OPTIONAL]
- nested: TypedPerFilterConfigEntry

### Message `Vhds`
- 1: `config_source` TYPE_MESSAGE (envoy.config.core.v3.ConfigSource) [LABEL_OPTIONAL]

## `envoy/config/route/v3/route_components.proto`
package `envoy.config.route.v3` · syntax `proto3`
deps: `envoy/config/core/v3/base.proto`, `envoy/config/core/v3/extension.proto`, `envoy/config/core/v3/proxy_protocol.proto`, `envoy/type/matcher/v3/metadata.proto`, `envoy/type/matcher/v3/regex.proto`, `envoy/type/matcher/v3/string.proto`, `envoy/type/metadata/v3/metadata.proto`, `envoy/type/tracing/v3/custom_tag.proto`, `envoy/type/v3/percent.proto`, `envoy/type/v3/range.proto`, `google/protobuf/any.proto`, `google/protobuf/duration.proto`, `google/protobuf/wrappers.proto`, `xds/annotations/v3/status.proto`, `xds/type/matcher/v3/matcher.proto`, `envoy/annotations/deprecation.proto`, `udpa/annotations/migrate.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `VirtualHost`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `domains` TYPE_STRING [LABEL_REPEATED]
- 3: `routes` TYPE_MESSAGE (envoy.config.route.v3.Route) [LABEL_REPEATED]
- 21: `matcher` TYPE_MESSAGE (xds.type.matcher.v3.Matcher) [LABEL_OPTIONAL]
- 4: `require_tls` TYPE_ENUM (envoy.config.route.v3.VirtualHost.TlsRequirementType) [LABEL_OPTIONAL]
- 5: `virtual_clusters` TYPE_MESSAGE (envoy.config.route.v3.VirtualCluster) [LABEL_REPEATED]
- 6: `rate_limits` TYPE_MESSAGE (envoy.config.route.v3.RateLimit) [LABEL_REPEATED]
- 7: `request_headers_to_add` TYPE_MESSAGE (envoy.config.core.v3.HeaderValueOption) [LABEL_REPEATED]
- 13: `request_headers_to_remove` TYPE_STRING [LABEL_REPEATED]
- 10: `response_headers_to_add` TYPE_MESSAGE (envoy.config.core.v3.HeaderValueOption) [LABEL_REPEATED]
- 11: `response_headers_to_remove` TYPE_STRING [LABEL_REPEATED]
- 8: `cors` TYPE_MESSAGE (envoy.config.route.v3.CorsPolicy) [LABEL_OPTIONAL]
- 15: `typed_per_filter_config` TYPE_MESSAGE (envoy.config.route.v3.VirtualHost.TypedPerFilterConfigEntry) [LABEL_REPEATED]
- 14: `include_request_attempt_count` TYPE_BOOL [LABEL_OPTIONAL]
- 19: `include_attempt_count_in_response` TYPE_BOOL [LABEL_OPTIONAL]
- 16: `retry_policy` TYPE_MESSAGE (envoy.config.route.v3.RetryPolicy) [LABEL_OPTIONAL]
- 20: `retry_policy_typed_config` TYPE_MESSAGE (google.protobuf.Any) [LABEL_OPTIONAL]
- 17: `hedge_policy` TYPE_MESSAGE (envoy.config.route.v3.HedgePolicy) [LABEL_OPTIONAL]
- 23: `include_is_timeout_retry_header` TYPE_BOOL [LABEL_OPTIONAL]
- 18: `per_request_buffer_limit_bytes` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 22: `request_mirror_policies` TYPE_MESSAGE (envoy.config.route.v3.RouteAction.RequestMirrorPolicy) [LABEL_REPEATED]
- 24: `metadata` TYPE_MESSAGE (envoy.config.core.v3.Metadata) [LABEL_OPTIONAL]
- nested: TypedPerFilterConfigEntry

### Message `FilterAction`
- 1: `action` TYPE_MESSAGE (google.protobuf.Any) [LABEL_OPTIONAL]

### Message `RouteList`
- 1: `routes` TYPE_MESSAGE (envoy.config.route.v3.Route) [LABEL_REPEATED]

### Message `Route`
- 14: `name` TYPE_STRING [LABEL_OPTIONAL]
- 1: `match` TYPE_MESSAGE (envoy.config.route.v3.RouteMatch) [LABEL_OPTIONAL]
- 2: `route` TYPE_MESSAGE (envoy.config.route.v3.RouteAction) [LABEL_OPTIONAL]
- 3: `redirect` TYPE_MESSAGE (envoy.config.route.v3.RedirectAction) [LABEL_OPTIONAL]
- 7: `direct_response` TYPE_MESSAGE (envoy.config.route.v3.DirectResponseAction) [LABEL_OPTIONAL]
- 17: `filter_action` TYPE_MESSAGE (envoy.config.route.v3.FilterAction) [LABEL_OPTIONAL]
- 18: `non_forwarding_action` TYPE_MESSAGE (envoy.config.route.v3.NonForwardingAction) [LABEL_OPTIONAL]
- 4: `metadata` TYPE_MESSAGE (envoy.config.core.v3.Metadata) [LABEL_OPTIONAL]
- 5: `decorator` TYPE_MESSAGE (envoy.config.route.v3.Decorator) [LABEL_OPTIONAL]
- 13: `typed_per_filter_config` TYPE_MESSAGE (envoy.config.route.v3.Route.TypedPerFilterConfigEntry) [LABEL_REPEATED]
- 9: `request_headers_to_add` TYPE_MESSAGE (envoy.config.core.v3.HeaderValueOption) [LABEL_REPEATED]
- 12: `request_headers_to_remove` TYPE_STRING [LABEL_REPEATED]
- 10: `response_headers_to_add` TYPE_MESSAGE (envoy.config.core.v3.HeaderValueOption) [LABEL_REPEATED]
- 11: `response_headers_to_remove` TYPE_STRING [LABEL_REPEATED]
- 15: `tracing` TYPE_MESSAGE (envoy.config.route.v3.Tracing) [LABEL_OPTIONAL]
- 16: `per_request_buffer_limit_bytes` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 19: `stat_prefix` TYPE_STRING [LABEL_OPTIONAL]
- nested: TypedPerFilterConfigEntry

### Message `WeightedCluster`
- 1: `clusters` TYPE_MESSAGE (envoy.config.route.v3.WeightedCluster.ClusterWeight) [LABEL_REPEATED]
- 3: `total_weight` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 2: `runtime_key_prefix` TYPE_STRING [LABEL_OPTIONAL]
- 4: `header_name` TYPE_STRING [LABEL_OPTIONAL]
- nested: ClusterWeight

### Message `ClusterSpecifierPlugin`
- 1: `extension` TYPE_MESSAGE (envoy.config.core.v3.TypedExtensionConfig) [LABEL_OPTIONAL]
- 2: `is_optional` TYPE_BOOL [LABEL_OPTIONAL]

### Message `RouteMatch`
- 1: `prefix` TYPE_STRING [LABEL_OPTIONAL]
- 2: `path` TYPE_STRING [LABEL_OPTIONAL]
- 10: `safe_regex` TYPE_MESSAGE (envoy.type.matcher.v3.RegexMatcher) [LABEL_OPTIONAL]
- 12: `connect_matcher` TYPE_MESSAGE (envoy.config.route.v3.RouteMatch.ConnectMatcher) [LABEL_OPTIONAL]
- 14: `path_separated_prefix` TYPE_STRING [LABEL_OPTIONAL]
- 15: `path_match_policy` TYPE_MESSAGE (envoy.config.core.v3.TypedExtensionConfig) [LABEL_OPTIONAL]
- 4: `case_sensitive` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 9: `runtime_fraction` TYPE_MESSAGE (envoy.config.core.v3.RuntimeFractionalPercent) [LABEL_OPTIONAL]
- 6: `headers` TYPE_MESSAGE (envoy.config.route.v3.HeaderMatcher) [LABEL_REPEATED]
- 7: `query_parameters` TYPE_MESSAGE (envoy.config.route.v3.QueryParameterMatcher) [LABEL_REPEATED]
- 8: `grpc` TYPE_MESSAGE (envoy.config.route.v3.RouteMatch.GrpcRouteMatchOptions) [LABEL_OPTIONAL]
- 11: `tls_context` TYPE_MESSAGE (envoy.config.route.v3.RouteMatch.TlsContextMatchOptions) [LABEL_OPTIONAL]
- 13: `dynamic_metadata` TYPE_MESSAGE (envoy.type.matcher.v3.MetadataMatcher) [LABEL_REPEATED]
- nested: GrpcRouteMatchOptions, TlsContextMatchOptions, ConnectMatcher

### Message `CorsPolicy`
- 11: `allow_origin_string_match` TYPE_MESSAGE (envoy.type.matcher.v3.StringMatcher) [LABEL_REPEATED]
- 2: `allow_methods` TYPE_STRING [LABEL_OPTIONAL]
- 3: `allow_headers` TYPE_STRING [LABEL_OPTIONAL]
- 4: `expose_headers` TYPE_STRING [LABEL_OPTIONAL]
- 5: `max_age` TYPE_STRING [LABEL_OPTIONAL]
- 6: `allow_credentials` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 9: `filter_enabled` TYPE_MESSAGE (envoy.config.core.v3.RuntimeFractionalPercent) [LABEL_OPTIONAL]
- 10: `shadow_enabled` TYPE_MESSAGE (envoy.config.core.v3.RuntimeFractionalPercent) [LABEL_OPTIONAL]
- 12: `allow_private_network_access` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]

### Message `RouteAction`
- 1: `cluster` TYPE_STRING [LABEL_OPTIONAL]
- 2: `cluster_header` TYPE_STRING [LABEL_OPTIONAL]
- 3: `weighted_clusters` TYPE_MESSAGE (envoy.config.route.v3.WeightedCluster) [LABEL_OPTIONAL]
- 37: `cluster_specifier_plugin` TYPE_STRING [LABEL_OPTIONAL]
- 39: `inline_cluster_specifier_plugin` TYPE_MESSAGE (envoy.config.route.v3.ClusterSpecifierPlugin) [LABEL_OPTIONAL]
- 20: `cluster_not_found_response_code` TYPE_ENUM (envoy.config.route.v3.RouteAction.ClusterNotFoundResponseCode) [LABEL_OPTIONAL]
- 4: `metadata_match` TYPE_MESSAGE (envoy.config.core.v3.Metadata) [LABEL_OPTIONAL]
- 5: `prefix_rewrite` TYPE_STRING [LABEL_OPTIONAL]
- 32: `regex_rewrite` TYPE_MESSAGE (envoy.type.matcher.v3.RegexMatchAndSubstitute) [LABEL_OPTIONAL]
- 41: `path_rewrite_policy` TYPE_MESSAGE (envoy.config.core.v3.TypedExtensionConfig) [LABEL_OPTIONAL]
- 6: `host_rewrite_literal` TYPE_STRING [LABEL_OPTIONAL]
- 7: `auto_host_rewrite` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 29: `host_rewrite_header` TYPE_STRING [LABEL_OPTIONAL]
- 35: `host_rewrite_path_regex` TYPE_MESSAGE (envoy.type.matcher.v3.RegexMatchAndSubstitute) [LABEL_OPTIONAL]
- 38: `append_x_forwarded_host` TYPE_BOOL [LABEL_OPTIONAL]
- 8: `timeout` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 24: `idle_timeout` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 40: `early_data_policy` TYPE_MESSAGE (envoy.config.core.v3.TypedExtensionConfig) [LABEL_OPTIONAL]
- 9: `retry_policy` TYPE_MESSAGE (envoy.config.route.v3.RetryPolicy) [LABEL_OPTIONAL]
- 33: `retry_policy_typed_config` TYPE_MESSAGE (google.protobuf.Any) [LABEL_OPTIONAL]
- 30: `request_mirror_policies` TYPE_MESSAGE (envoy.config.route.v3.RouteAction.RequestMirrorPolicy) [LABEL_REPEATED]
- 11: `priority` TYPE_ENUM (envoy.config.core.v3.RoutingPriority) [LABEL_OPTIONAL]
- 13: `rate_limits` TYPE_MESSAGE (envoy.config.route.v3.RateLimit) [LABEL_REPEATED]
- 14: `include_vh_rate_limits` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 15: `hash_policy` TYPE_MESSAGE (envoy.config.route.v3.RouteAction.HashPolicy) [LABEL_REPEATED]
- 17: `cors` TYPE_MESSAGE (envoy.config.route.v3.CorsPolicy) [LABEL_OPTIONAL]
- 23: `max_grpc_timeout` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 28: `grpc_timeout_offset` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 25: `upgrade_configs` TYPE_MESSAGE (envoy.config.route.v3.RouteAction.UpgradeConfig) [LABEL_REPEATED]
- 34: `internal_redirect_policy` TYPE_MESSAGE (envoy.config.route.v3.InternalRedirectPolicy) [LABEL_OPTIONAL]
- 26: `internal_redirect_action` TYPE_ENUM (envoy.config.route.v3.RouteAction.InternalRedirectAction) [LABEL_OPTIONAL]
- 31: `max_internal_redirects` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 27: `hedge_policy` TYPE_MESSAGE (envoy.config.route.v3.HedgePolicy) [LABEL_OPTIONAL]
- 36: `max_stream_duration` TYPE_MESSAGE (envoy.config.route.v3.RouteAction.MaxStreamDuration) [LABEL_OPTIONAL]
- nested: RequestMirrorPolicy, HashPolicy, UpgradeConfig, MaxStreamDuration

### Message `RetryPolicy`
- 1: `retry_on` TYPE_STRING [LABEL_OPTIONAL]
- 2: `num_retries` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 3: `per_try_timeout` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 13: `per_try_idle_timeout` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 4: `retry_priority` TYPE_MESSAGE (envoy.config.route.v3.RetryPolicy.RetryPriority) [LABEL_OPTIONAL]
- 5: `retry_host_predicate` TYPE_MESSAGE (envoy.config.route.v3.RetryPolicy.RetryHostPredicate) [LABEL_REPEATED]
- 12: `retry_options_predicates` TYPE_MESSAGE (envoy.config.core.v3.TypedExtensionConfig) [LABEL_REPEATED]
- 6: `host_selection_retry_max_attempts` TYPE_INT64 [LABEL_OPTIONAL]
- 7: `retriable_status_codes` TYPE_UINT32 [LABEL_REPEATED]
- 8: `retry_back_off` TYPE_MESSAGE (envoy.config.route.v3.RetryPolicy.RetryBackOff) [LABEL_OPTIONAL]
- 11: `rate_limited_retry_back_off` TYPE_MESSAGE (envoy.config.route.v3.RetryPolicy.RateLimitedRetryBackOff) [LABEL_OPTIONAL]
- 9: `retriable_headers` TYPE_MESSAGE (envoy.config.route.v3.HeaderMatcher) [LABEL_REPEATED]
- 10: `retriable_request_headers` TYPE_MESSAGE (envoy.config.route.v3.HeaderMatcher) [LABEL_REPEATED]
- nested: RetryPriority, RetryHostPredicate, RetryBackOff, ResetHeader, RateLimitedRetryBackOff

### Message `HedgePolicy`
- 1: `initial_requests` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 2: `additional_request_chance` TYPE_MESSAGE (envoy.type.v3.FractionalPercent) [LABEL_OPTIONAL]
- 3: `hedge_on_per_try_timeout` TYPE_BOOL [LABEL_OPTIONAL]

### Message `RedirectAction`
- 4: `https_redirect` TYPE_BOOL [LABEL_OPTIONAL]
- 7: `scheme_redirect` TYPE_STRING [LABEL_OPTIONAL]
- 1: `host_redirect` TYPE_STRING [LABEL_OPTIONAL]
- 8: `port_redirect` TYPE_UINT32 [LABEL_OPTIONAL]
- 2: `path_redirect` TYPE_STRING [LABEL_OPTIONAL]
- 5: `prefix_rewrite` TYPE_STRING [LABEL_OPTIONAL]
- 9: `regex_rewrite` TYPE_MESSAGE (envoy.type.matcher.v3.RegexMatchAndSubstitute) [LABEL_OPTIONAL]
- 3: `response_code` TYPE_ENUM (envoy.config.route.v3.RedirectAction.RedirectResponseCode) [LABEL_OPTIONAL]
- 6: `strip_query` TYPE_BOOL [LABEL_OPTIONAL]

### Message `DirectResponseAction`
- 1: `status` TYPE_UINT32 [LABEL_OPTIONAL]
- 2: `body` TYPE_MESSAGE (envoy.config.core.v3.DataSource) [LABEL_OPTIONAL]

### Message `NonForwardingAction`

### Message `Decorator`
- 1: `operation` TYPE_STRING [LABEL_OPTIONAL]
- 2: `propagate` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]

### Message `Tracing`
- 1: `client_sampling` TYPE_MESSAGE (envoy.type.v3.FractionalPercent) [LABEL_OPTIONAL]
- 2: `random_sampling` TYPE_MESSAGE (envoy.type.v3.FractionalPercent) [LABEL_OPTIONAL]
- 3: `overall_sampling` TYPE_MESSAGE (envoy.type.v3.FractionalPercent) [LABEL_OPTIONAL]
- 4: `custom_tags` TYPE_MESSAGE (envoy.type.tracing.v3.CustomTag) [LABEL_REPEATED]

### Message `VirtualCluster`
- 4: `headers` TYPE_MESSAGE (envoy.config.route.v3.HeaderMatcher) [LABEL_REPEATED]
- 2: `name` TYPE_STRING [LABEL_OPTIONAL]

### Message `RateLimit`
- 1: `stage` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 2: `disable_key` TYPE_STRING [LABEL_OPTIONAL]
- 3: `actions` TYPE_MESSAGE (envoy.config.route.v3.RateLimit.Action) [LABEL_REPEATED]
- 4: `limit` TYPE_MESSAGE (envoy.config.route.v3.RateLimit.Override) [LABEL_OPTIONAL]
- nested: Action, Override

### Message `HeaderMatcher`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 4: `exact_match` TYPE_STRING [LABEL_OPTIONAL]
- 11: `safe_regex_match` TYPE_MESSAGE (envoy.type.matcher.v3.RegexMatcher) [LABEL_OPTIONAL]
- 6: `range_match` TYPE_MESSAGE (envoy.type.v3.Int64Range) [LABEL_OPTIONAL]
- 7: `present_match` TYPE_BOOL [LABEL_OPTIONAL]
- 9: `prefix_match` TYPE_STRING [LABEL_OPTIONAL]
- 10: `suffix_match` TYPE_STRING [LABEL_OPTIONAL]
- 12: `contains_match` TYPE_STRING [LABEL_OPTIONAL]
- 13: `string_match` TYPE_MESSAGE (envoy.type.matcher.v3.StringMatcher) [LABEL_OPTIONAL]
- 8: `invert_match` TYPE_BOOL [LABEL_OPTIONAL]
- 14: `treat_missing_header_as_empty` TYPE_BOOL [LABEL_OPTIONAL]

### Message `QueryParameterMatcher`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 5: `string_match` TYPE_MESSAGE (envoy.type.matcher.v3.StringMatcher) [LABEL_OPTIONAL]
- 6: `present_match` TYPE_BOOL [LABEL_OPTIONAL]

### Message `InternalRedirectPolicy`
- 1: `max_internal_redirects` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 2: `redirect_response_codes` TYPE_UINT32 [LABEL_REPEATED]
- 3: `predicates` TYPE_MESSAGE (envoy.config.core.v3.TypedExtensionConfig) [LABEL_REPEATED]
- 4: `allow_cross_scheme_redirect` TYPE_BOOL [LABEL_OPTIONAL]
- 5: `response_headers_to_copy` TYPE_STRING [LABEL_REPEATED]

### Message `FilterConfig`
- 1: `config` TYPE_MESSAGE (google.protobuf.Any) [LABEL_OPTIONAL]
- 2: `is_optional` TYPE_BOOL [LABEL_OPTIONAL]
- 3: `disabled` TYPE_BOOL [LABEL_OPTIONAL]

## `envoy/config/route/v3/scoped_route.proto`
package `envoy.config.route.v3` · syntax `proto3`
deps: `envoy/config/route/v3/route.proto`, `udpa/annotations/migrate.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `ScopedRouteConfiguration`
- 4: `on_demand` TYPE_BOOL [LABEL_OPTIONAL]
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `route_configuration_name` TYPE_STRING [LABEL_OPTIONAL]
- 5: `route_configuration` TYPE_MESSAGE (envoy.config.route.v3.RouteConfiguration) [LABEL_OPTIONAL]
- 3: `key` TYPE_MESSAGE (envoy.config.route.v3.ScopedRouteConfiguration.Key) [LABEL_OPTIONAL]
- nested: Key

## `envoy/config/trace/v3/http_tracer.proto`
package `envoy.config.trace.v3` · syntax `proto3`
deps: `google/protobuf/any.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `Tracing`
- 1: `http` TYPE_MESSAGE (envoy.config.trace.v3.Tracing.Http) [LABEL_OPTIONAL]
- nested: Http

## `envoy/data/accesslog/v3/accesslog.proto`
package `envoy.data.accesslog.v3` · syntax `proto3`
deps: `envoy/config/core/v3/address.proto`, `envoy/config/core/v3/base.proto`, `google/protobuf/any.proto`, `google/protobuf/duration.proto`, `google/protobuf/timestamp.proto`, `google/protobuf/wrappers.proto`, `envoy/annotations/deprecation.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `TCPAccessLogEntry`
- 1: `common_properties` TYPE_MESSAGE (envoy.data.accesslog.v3.AccessLogCommon) [LABEL_OPTIONAL]
- 2: `connection_properties` TYPE_MESSAGE (envoy.data.accesslog.v3.ConnectionProperties) [LABEL_OPTIONAL]

### Message `HTTPAccessLogEntry`
- 1: `common_properties` TYPE_MESSAGE (envoy.data.accesslog.v3.AccessLogCommon) [LABEL_OPTIONAL]
- 2: `protocol_version` TYPE_ENUM (envoy.data.accesslog.v3.HTTPAccessLogEntry.HTTPVersion) [LABEL_OPTIONAL]
- 3: `request` TYPE_MESSAGE (envoy.data.accesslog.v3.HTTPRequestProperties) [LABEL_OPTIONAL]
- 4: `response` TYPE_MESSAGE (envoy.data.accesslog.v3.HTTPResponseProperties) [LABEL_OPTIONAL]

### Message `ConnectionProperties`
- 1: `received_bytes` TYPE_UINT64 [LABEL_OPTIONAL]
- 2: `sent_bytes` TYPE_UINT64 [LABEL_OPTIONAL]

### Message `AccessLogCommon`
- 1: `sample_rate` TYPE_DOUBLE [LABEL_OPTIONAL]
- 2: `downstream_remote_address` TYPE_MESSAGE (envoy.config.core.v3.Address) [LABEL_OPTIONAL]
- 3: `downstream_local_address` TYPE_MESSAGE (envoy.config.core.v3.Address) [LABEL_OPTIONAL]
- 4: `tls_properties` TYPE_MESSAGE (envoy.data.accesslog.v3.TLSProperties) [LABEL_OPTIONAL]
- 5: `start_time` TYPE_MESSAGE (google.protobuf.Timestamp) [LABEL_OPTIONAL]
- 6: `time_to_last_rx_byte` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 7: `time_to_first_upstream_tx_byte` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 8: `time_to_last_upstream_tx_byte` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 9: `time_to_first_upstream_rx_byte` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 10: `time_to_last_upstream_rx_byte` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 11: `time_to_first_downstream_tx_byte` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 12: `time_to_last_downstream_tx_byte` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 13: `upstream_remote_address` TYPE_MESSAGE (envoy.config.core.v3.Address) [LABEL_OPTIONAL]
- 14: `upstream_local_address` TYPE_MESSAGE (envoy.config.core.v3.Address) [LABEL_OPTIONAL]
- 15: `upstream_cluster` TYPE_STRING [LABEL_OPTIONAL]
- 16: `response_flags` TYPE_MESSAGE (envoy.data.accesslog.v3.ResponseFlags) [LABEL_OPTIONAL]
- 17: `metadata` TYPE_MESSAGE (envoy.config.core.v3.Metadata) [LABEL_OPTIONAL]
- 18: `upstream_transport_failure_reason` TYPE_STRING [LABEL_OPTIONAL]
- 19: `route_name` TYPE_STRING [LABEL_OPTIONAL]
- 20: `downstream_direct_remote_address` TYPE_MESSAGE (envoy.config.core.v3.Address) [LABEL_OPTIONAL]
- 21: `filter_state_objects` TYPE_MESSAGE (envoy.data.accesslog.v3.AccessLogCommon.FilterStateObjectsEntry) [LABEL_REPEATED]
- 22: `custom_tags` TYPE_MESSAGE (envoy.data.accesslog.v3.AccessLogCommon.CustomTagsEntry) [LABEL_REPEATED]
- 23: `duration` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 24: `upstream_request_attempt_count` TYPE_UINT32 [LABEL_OPTIONAL]
- 25: `connection_termination_details` TYPE_STRING [LABEL_OPTIONAL]
- 26: `stream_id` TYPE_STRING [LABEL_OPTIONAL]
- 27: `intermediate_log_entry` TYPE_BOOL [LABEL_OPTIONAL]
- 28: `downstream_transport_failure_reason` TYPE_STRING [LABEL_OPTIONAL]
- 29: `downstream_wire_bytes_sent` TYPE_UINT64 [LABEL_OPTIONAL]
- 30: `downstream_wire_bytes_received` TYPE_UINT64 [LABEL_OPTIONAL]
- 31: `upstream_wire_bytes_sent` TYPE_UINT64 [LABEL_OPTIONAL]
- 32: `upstream_wire_bytes_received` TYPE_UINT64 [LABEL_OPTIONAL]
- 33: `access_log_type` TYPE_ENUM (envoy.data.accesslog.v3.AccessLogType) [LABEL_OPTIONAL]
- nested: FilterStateObjectsEntry, CustomTagsEntry

### Message `ResponseFlags`
- 1: `failed_local_healthcheck` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `no_healthy_upstream` TYPE_BOOL [LABEL_OPTIONAL]
- 3: `upstream_request_timeout` TYPE_BOOL [LABEL_OPTIONAL]
- 4: `local_reset` TYPE_BOOL [LABEL_OPTIONAL]
- 5: `upstream_remote_reset` TYPE_BOOL [LABEL_OPTIONAL]
- 6: `upstream_connection_failure` TYPE_BOOL [LABEL_OPTIONAL]
- 7: `upstream_connection_termination` TYPE_BOOL [LABEL_OPTIONAL]
- 8: `upstream_overflow` TYPE_BOOL [LABEL_OPTIONAL]
- 9: `no_route_found` TYPE_BOOL [LABEL_OPTIONAL]
- 10: `delay_injected` TYPE_BOOL [LABEL_OPTIONAL]
- 11: `fault_injected` TYPE_BOOL [LABEL_OPTIONAL]
- 12: `rate_limited` TYPE_BOOL [LABEL_OPTIONAL]
- 13: `unauthorized_details` TYPE_MESSAGE (envoy.data.accesslog.v3.ResponseFlags.Unauthorized) [LABEL_OPTIONAL]
- 14: `rate_limit_service_error` TYPE_BOOL [LABEL_OPTIONAL]
- 15: `downstream_connection_termination` TYPE_BOOL [LABEL_OPTIONAL]
- 16: `upstream_retry_limit_exceeded` TYPE_BOOL [LABEL_OPTIONAL]
- 17: `stream_idle_timeout` TYPE_BOOL [LABEL_OPTIONAL]
- 18: `invalid_envoy_request_headers` TYPE_BOOL [LABEL_OPTIONAL]
- 19: `downstream_protocol_error` TYPE_BOOL [LABEL_OPTIONAL]
- 20: `upstream_max_stream_duration_reached` TYPE_BOOL [LABEL_OPTIONAL]
- 21: `response_from_cache_filter` TYPE_BOOL [LABEL_OPTIONAL]
- 22: `no_filter_config_found` TYPE_BOOL [LABEL_OPTIONAL]
- 23: `duration_timeout` TYPE_BOOL [LABEL_OPTIONAL]
- 24: `upstream_protocol_error` TYPE_BOOL [LABEL_OPTIONAL]
- 25: `no_cluster_found` TYPE_BOOL [LABEL_OPTIONAL]
- 26: `overload_manager` TYPE_BOOL [LABEL_OPTIONAL]
- 27: `dns_resolution_failure` TYPE_BOOL [LABEL_OPTIONAL]
- nested: Unauthorized

### Message `TLSProperties`
- 1: `tls_version` TYPE_ENUM (envoy.data.accesslog.v3.TLSProperties.TLSVersion) [LABEL_OPTIONAL]
- 2: `tls_cipher_suite` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 3: `tls_sni_hostname` TYPE_STRING [LABEL_OPTIONAL]
- 4: `local_certificate_properties` TYPE_MESSAGE (envoy.data.accesslog.v3.TLSProperties.CertificateProperties) [LABEL_OPTIONAL]
- 5: `peer_certificate_properties` TYPE_MESSAGE (envoy.data.accesslog.v3.TLSProperties.CertificateProperties) [LABEL_OPTIONAL]
- 6: `tls_session_id` TYPE_STRING [LABEL_OPTIONAL]
- 7: `ja3_fingerprint` TYPE_STRING [LABEL_OPTIONAL]
- nested: CertificateProperties

### Message `HTTPRequestProperties`
- 1: `request_method` TYPE_ENUM (envoy.config.core.v3.RequestMethod) [LABEL_OPTIONAL]
- 2: `scheme` TYPE_STRING [LABEL_OPTIONAL]
- 3: `authority` TYPE_STRING [LABEL_OPTIONAL]
- 4: `port` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 5: `path` TYPE_STRING [LABEL_OPTIONAL]
- 6: `user_agent` TYPE_STRING [LABEL_OPTIONAL]
- 7: `referer` TYPE_STRING [LABEL_OPTIONAL]
- 8: `forwarded_for` TYPE_STRING [LABEL_OPTIONAL]
- 9: `request_id` TYPE_STRING [LABEL_OPTIONAL]
- 10: `original_path` TYPE_STRING [LABEL_OPTIONAL]
- 11: `request_headers_bytes` TYPE_UINT64 [LABEL_OPTIONAL]
- 12: `request_body_bytes` TYPE_UINT64 [LABEL_OPTIONAL]
- 13: `request_headers` TYPE_MESSAGE (envoy.data.accesslog.v3.HTTPRequestProperties.RequestHeadersEntry) [LABEL_REPEATED]
- 14: `upstream_header_bytes_sent` TYPE_UINT64 [LABEL_OPTIONAL]
- 15: `downstream_header_bytes_received` TYPE_UINT64 [LABEL_OPTIONAL]
- nested: RequestHeadersEntry

### Message `HTTPResponseProperties`
- 1: `response_code` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 2: `response_headers_bytes` TYPE_UINT64 [LABEL_OPTIONAL]
- 3: `response_body_bytes` TYPE_UINT64 [LABEL_OPTIONAL]
- 4: `response_headers` TYPE_MESSAGE (envoy.data.accesslog.v3.HTTPResponseProperties.ResponseHeadersEntry) [LABEL_REPEATED]
- 5: `response_trailers` TYPE_MESSAGE (envoy.data.accesslog.v3.HTTPResponseProperties.ResponseTrailersEntry) [LABEL_REPEATED]
- 6: `response_code_details` TYPE_STRING [LABEL_OPTIONAL]
- 7: `upstream_header_bytes_received` TYPE_UINT64 [LABEL_OPTIONAL]
- 8: `downstream_header_bytes_sent` TYPE_UINT64 [LABEL_OPTIONAL]
- nested: ResponseHeadersEntry, ResponseTrailersEntry

### Enum `AccessLogType`
- 0 = `NotSet`
- 1 = `TcpUpstreamConnected`
- 2 = `TcpPeriodic`
- 3 = `TcpConnectionEnd`
- 4 = `DownstreamStart`
- 5 = `DownstreamPeriodic`
- 6 = `DownstreamEnd`
- 7 = `UpstreamPoolReady`
- 8 = `UpstreamPeriodic`
- 9 = `UpstreamEnd`
- 10 = `DownstreamTunnelSuccessfullyEstablished`
- 11 = `UdpTunnelUpstreamConnected`
- 12 = `UdpPeriodic`
- 13 = `UdpSessionEnd`

## `envoy/extensions/clusters/aggregate/v3/cluster.proto`
package `envoy.extensions.clusters.aggregate.v3` · syntax `proto3`
deps: `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `ClusterConfig`
- 1: `clusters` TYPE_STRING [LABEL_REPEATED]

## `envoy/extensions/filters/common/fault/v3/fault.proto`
package `envoy.extensions.filters.common.fault.v3` · syntax `proto3`
deps: `envoy/type/v3/percent.proto`, `google/protobuf/duration.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `FaultDelay`
- 3: `fixed_delay` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 5: `header_delay` TYPE_MESSAGE (envoy.extensions.filters.common.fault.v3.FaultDelay.HeaderDelay) [LABEL_OPTIONAL]
- 4: `percentage` TYPE_MESSAGE (envoy.type.v3.FractionalPercent) [LABEL_OPTIONAL]
- nested: HeaderDelay

### Message `FaultRateLimit`
- 1: `fixed_limit` TYPE_MESSAGE (envoy.extensions.filters.common.fault.v3.FaultRateLimit.FixedLimit) [LABEL_OPTIONAL]
- 3: `header_limit` TYPE_MESSAGE (envoy.extensions.filters.common.fault.v3.FaultRateLimit.HeaderLimit) [LABEL_OPTIONAL]
- 2: `percentage` TYPE_MESSAGE (envoy.type.v3.FractionalPercent) [LABEL_OPTIONAL]
- nested: FixedLimit, HeaderLimit

## `envoy/extensions/filters/http/fault/v3/fault.proto`
package `envoy.extensions.filters.http.fault.v3` · syntax `proto3`
deps: `envoy/config/route/v3/route_components.proto`, `envoy/extensions/filters/common/fault/v3/fault.proto`, `envoy/type/v3/percent.proto`, `google/protobuf/struct.proto`, `google/protobuf/wrappers.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `FaultAbort`
- 2: `http_status` TYPE_UINT32 [LABEL_OPTIONAL]
- 5: `grpc_status` TYPE_UINT32 [LABEL_OPTIONAL]
- 4: `header_abort` TYPE_MESSAGE (envoy.extensions.filters.http.fault.v3.FaultAbort.HeaderAbort) [LABEL_OPTIONAL]
- 3: `percentage` TYPE_MESSAGE (envoy.type.v3.FractionalPercent) [LABEL_OPTIONAL]
- nested: HeaderAbort

### Message `HTTPFault`
- 1: `delay` TYPE_MESSAGE (envoy.extensions.filters.common.fault.v3.FaultDelay) [LABEL_OPTIONAL]
- 2: `abort` TYPE_MESSAGE (envoy.extensions.filters.http.fault.v3.FaultAbort) [LABEL_OPTIONAL]
- 3: `upstream_cluster` TYPE_STRING [LABEL_OPTIONAL]
- 4: `headers` TYPE_MESSAGE (envoy.config.route.v3.HeaderMatcher) [LABEL_REPEATED]
- 5: `downstream_nodes` TYPE_STRING [LABEL_REPEATED]
- 6: `max_active_faults` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 7: `response_rate_limit` TYPE_MESSAGE (envoy.extensions.filters.common.fault.v3.FaultRateLimit) [LABEL_OPTIONAL]
- 8: `delay_percent_runtime` TYPE_STRING [LABEL_OPTIONAL]
- 9: `abort_percent_runtime` TYPE_STRING [LABEL_OPTIONAL]
- 10: `delay_duration_runtime` TYPE_STRING [LABEL_OPTIONAL]
- 11: `abort_http_status_runtime` TYPE_STRING [LABEL_OPTIONAL]
- 12: `max_active_faults_runtime` TYPE_STRING [LABEL_OPTIONAL]
- 13: `response_rate_limit_percent_runtime` TYPE_STRING [LABEL_OPTIONAL]
- 14: `abort_grpc_status_runtime` TYPE_STRING [LABEL_OPTIONAL]
- 15: `disable_downstream_cluster_stats` TYPE_BOOL [LABEL_OPTIONAL]
- 16: `filter_metadata` TYPE_MESSAGE (google.protobuf.Struct) [LABEL_OPTIONAL]

## `envoy/extensions/filters/http/rbac/v3/rbac.proto`
package `envoy.extensions.filters.http.rbac.v3` · syntax `proto3`
deps: `envoy/config/rbac/v3/rbac.proto`, `xds/annotations/v3/status.proto`, `xds/type/matcher/v3/matcher.proto`, `udpa/annotations/migrate.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`

### Message `RBAC`
- 1: `rules` TYPE_MESSAGE (envoy.config.rbac.v3.RBAC) [LABEL_OPTIONAL]
- 4: `matcher` TYPE_MESSAGE (xds.type.matcher.v3.Matcher) [LABEL_OPTIONAL]
- 2: `shadow_rules` TYPE_MESSAGE (envoy.config.rbac.v3.RBAC) [LABEL_OPTIONAL]
- 5: `shadow_matcher` TYPE_MESSAGE (xds.type.matcher.v3.Matcher) [LABEL_OPTIONAL]
- 3: `shadow_rules_stat_prefix` TYPE_STRING [LABEL_OPTIONAL]

### Message `RBACPerRoute`
- 2: `rbac` TYPE_MESSAGE (envoy.extensions.filters.http.rbac.v3.RBAC) [LABEL_OPTIONAL]

## `envoy/extensions/filters/http/router/v3/router.proto`
package `envoy.extensions.filters.http.router.v3` · syntax `proto3`
deps: `envoy/config/accesslog/v3/accesslog.proto`, `envoy/extensions/filters/network/http_connection_manager/v3/http_connection_manager.proto`, `google/protobuf/duration.proto`, `google/protobuf/wrappers.proto`, `envoy/annotations/deprecation.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `Router`
- 1: `dynamic_stats` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 2: `start_child_span` TYPE_BOOL [LABEL_OPTIONAL]
- 3: `upstream_log` TYPE_MESSAGE (envoy.config.accesslog.v3.AccessLog) [LABEL_REPEATED]
- 9: `upstream_log_options` TYPE_MESSAGE (envoy.extensions.filters.http.router.v3.Router.UpstreamAccessLogOptions) [LABEL_OPTIONAL]
- 4: `suppress_envoy_headers` TYPE_BOOL [LABEL_OPTIONAL]
- 5: `strict_check_headers` TYPE_STRING [LABEL_REPEATED]
- 6: `respect_expected_rq_timeout` TYPE_BOOL [LABEL_OPTIONAL]
- 7: `suppress_grpc_request_failure_code_stats` TYPE_BOOL [LABEL_OPTIONAL]
- 8: `upstream_http_filters` TYPE_MESSAGE (envoy.extensions.filters.network.http_connection_manager.v3.HttpFilter) [LABEL_REPEATED]
- nested: UpstreamAccessLogOptions

## `envoy/extensions/http/stateful_session/cookie/v3/cookie.proto`
package `envoy.extensions.http.stateful_session.cookie.v3` · syntax `proto3`
deps: `envoy/type/http/v3/cookie.proto`, `udpa/annotations/status.proto`, `validate/validate.proto`

### Message `CookieBasedSessionState`
- 1: `cookie` TYPE_MESSAGE (envoy.type.http.v3.Cookie) [LABEL_OPTIONAL]

## `envoy/extensions/transport_sockets/tls/v3/common.proto`
package `envoy.extensions.transport_sockets.tls.v3` · syntax `proto3`
deps: `envoy/config/core/v3/base.proto`, `envoy/config/core/v3/extension.proto`, `envoy/type/matcher/v3/string.proto`, `google/protobuf/any.proto`, `google/protobuf/wrappers.proto`, `envoy/annotations/deprecation.proto`, `udpa/annotations/migrate.proto`, `udpa/annotations/sensitive.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `TlsParameters`
- 1: `tls_minimum_protocol_version` TYPE_ENUM (envoy.extensions.transport_sockets.tls.v3.TlsParameters.TlsProtocol) [LABEL_OPTIONAL]
- 2: `tls_maximum_protocol_version` TYPE_ENUM (envoy.extensions.transport_sockets.tls.v3.TlsParameters.TlsProtocol) [LABEL_OPTIONAL]
- 3: `cipher_suites` TYPE_STRING [LABEL_REPEATED]
- 4: `ecdh_curves` TYPE_STRING [LABEL_REPEATED]
- 5: `signature_algorithms` TYPE_STRING [LABEL_REPEATED]

### Message `PrivateKeyProvider`
- 1: `provider_name` TYPE_STRING [LABEL_OPTIONAL]
- 3: `typed_config` TYPE_MESSAGE (google.protobuf.Any) [LABEL_OPTIONAL]
- 4: `fallback` TYPE_BOOL [LABEL_OPTIONAL]

### Message `TlsCertificate`
- 1: `certificate_chain` TYPE_MESSAGE (envoy.config.core.v3.DataSource) [LABEL_OPTIONAL]
- 2: `private_key` TYPE_MESSAGE (envoy.config.core.v3.DataSource) [LABEL_OPTIONAL]
- 8: `pkcs12` TYPE_MESSAGE (envoy.config.core.v3.DataSource) [LABEL_OPTIONAL]
- 7: `watched_directory` TYPE_MESSAGE (envoy.config.core.v3.WatchedDirectory) [LABEL_OPTIONAL]
- 6: `private_key_provider` TYPE_MESSAGE (envoy.extensions.transport_sockets.tls.v3.PrivateKeyProvider) [LABEL_OPTIONAL]
- 3: `password` TYPE_MESSAGE (envoy.config.core.v3.DataSource) [LABEL_OPTIONAL]
- 4: `ocsp_staple` TYPE_MESSAGE (envoy.config.core.v3.DataSource) [LABEL_OPTIONAL]
- 5: `signed_certificate_timestamp` TYPE_MESSAGE (envoy.config.core.v3.DataSource) [LABEL_REPEATED]

### Message `TlsSessionTicketKeys`
- 1: `keys` TYPE_MESSAGE (envoy.config.core.v3.DataSource) [LABEL_REPEATED]

### Message `CertificateProviderPluginInstance`
- 1: `instance_name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `certificate_name` TYPE_STRING [LABEL_OPTIONAL]

### Message `SubjectAltNameMatcher`
- 1: `san_type` TYPE_ENUM (envoy.extensions.transport_sockets.tls.v3.SubjectAltNameMatcher.SanType) [LABEL_OPTIONAL]
- 2: `matcher` TYPE_MESSAGE (envoy.type.matcher.v3.StringMatcher) [LABEL_OPTIONAL]

### Message `CertificateValidationContext`
- 1: `trusted_ca` TYPE_MESSAGE (envoy.config.core.v3.DataSource) [LABEL_OPTIONAL]
- 13: `ca_certificate_provider_instance` TYPE_MESSAGE (envoy.extensions.transport_sockets.tls.v3.CertificateProviderPluginInstance) [LABEL_OPTIONAL]
- 11: `watched_directory` TYPE_MESSAGE (envoy.config.core.v3.WatchedDirectory) [LABEL_OPTIONAL]
- 3: `verify_certificate_spki` TYPE_STRING [LABEL_REPEATED]
- 2: `verify_certificate_hash` TYPE_STRING [LABEL_REPEATED]
- 15: `match_typed_subject_alt_names` TYPE_MESSAGE (envoy.extensions.transport_sockets.tls.v3.SubjectAltNameMatcher) [LABEL_REPEATED]
- 9: `match_subject_alt_names` TYPE_MESSAGE (envoy.type.matcher.v3.StringMatcher) [LABEL_REPEATED]
- 6: `require_signed_certificate_timestamp` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 7: `crl` TYPE_MESSAGE (envoy.config.core.v3.DataSource) [LABEL_OPTIONAL]
- 8: `allow_expired_certificate` TYPE_BOOL [LABEL_OPTIONAL]
- 10: `trust_chain_verification` TYPE_ENUM (envoy.extensions.transport_sockets.tls.v3.CertificateValidationContext.TrustChainVerification) [LABEL_OPTIONAL]
- 12: `custom_validator_config` TYPE_MESSAGE (envoy.config.core.v3.TypedExtensionConfig) [LABEL_OPTIONAL]
- 14: `only_verify_leaf_cert_crl` TYPE_BOOL [LABEL_OPTIONAL]
- 16: `max_verify_depth` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]

## `envoy/extensions/transport_sockets/tls/v3/secret.proto`
package `envoy.extensions.transport_sockets.tls.v3` · syntax `proto3`
deps: `envoy/config/core/v3/base.proto`, `envoy/config/core/v3/config_source.proto`, `envoy/extensions/transport_sockets/tls/v3/common.proto`, `udpa/annotations/sensitive.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `GenericSecret`
- 1: `secret` TYPE_MESSAGE (envoy.config.core.v3.DataSource) [LABEL_OPTIONAL]

### Message `SdsSecretConfig`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `sds_config` TYPE_MESSAGE (envoy.config.core.v3.ConfigSource) [LABEL_OPTIONAL]

### Message `Secret`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `tls_certificate` TYPE_MESSAGE (envoy.extensions.transport_sockets.tls.v3.TlsCertificate) [LABEL_OPTIONAL]
- 3: `session_ticket_keys` TYPE_MESSAGE (envoy.extensions.transport_sockets.tls.v3.TlsSessionTicketKeys) [LABEL_OPTIONAL]
- 4: `validation_context` TYPE_MESSAGE (envoy.extensions.transport_sockets.tls.v3.CertificateValidationContext) [LABEL_OPTIONAL]
- 5: `generic_secret` TYPE_MESSAGE (envoy.extensions.transport_sockets.tls.v3.GenericSecret) [LABEL_OPTIONAL]

## `envoy/extensions/transport_sockets/tls/v3/tls.proto`
package `envoy.extensions.transport_sockets.tls.v3` · syntax `proto3`
deps: `envoy/config/core/v3/address.proto`, `envoy/config/core/v3/extension.proto`, `envoy/extensions/transport_sockets/tls/v3/common.proto`, `envoy/extensions/transport_sockets/tls/v3/secret.proto`, `google/protobuf/duration.proto`, `google/protobuf/wrappers.proto`, `envoy/annotations/deprecation.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `UpstreamTlsContext`
- 1: `common_tls_context` TYPE_MESSAGE (envoy.extensions.transport_sockets.tls.v3.CommonTlsContext) [LABEL_OPTIONAL]
- 2: `sni` TYPE_STRING [LABEL_OPTIONAL]
- 3: `allow_renegotiation` TYPE_BOOL [LABEL_OPTIONAL]
- 4: `max_session_keys` TYPE_MESSAGE (google.protobuf.UInt32Value) [LABEL_OPTIONAL]
- 5: `enforce_rsa_key_usage` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]

### Message `DownstreamTlsContext`
- 1: `common_tls_context` TYPE_MESSAGE (envoy.extensions.transport_sockets.tls.v3.CommonTlsContext) [LABEL_OPTIONAL]
- 2: `require_client_certificate` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 3: `require_sni` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 4: `session_ticket_keys` TYPE_MESSAGE (envoy.extensions.transport_sockets.tls.v3.TlsSessionTicketKeys) [LABEL_OPTIONAL]
- 5: `session_ticket_keys_sds_secret_config` TYPE_MESSAGE (envoy.extensions.transport_sockets.tls.v3.SdsSecretConfig) [LABEL_OPTIONAL]
- 7: `disable_stateless_session_resumption` TYPE_BOOL [LABEL_OPTIONAL]
- 10: `disable_stateful_session_resumption` TYPE_BOOL [LABEL_OPTIONAL]
- 6: `session_timeout` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 8: `ocsp_staple_policy` TYPE_ENUM (envoy.extensions.transport_sockets.tls.v3.DownstreamTlsContext.OcspStaplePolicy) [LABEL_OPTIONAL]
- 9: `full_scan_certs_on_sni_mismatch` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]

### Message `TlsKeyLog`
- 1: `path` TYPE_STRING [LABEL_OPTIONAL]
- 2: `local_address_range` TYPE_MESSAGE (envoy.config.core.v3.CidrRange) [LABEL_REPEATED]
- 3: `remote_address_range` TYPE_MESSAGE (envoy.config.core.v3.CidrRange) [LABEL_REPEATED]

### Message `CommonTlsContext`
- 1: `tls_params` TYPE_MESSAGE (envoy.extensions.transport_sockets.tls.v3.TlsParameters) [LABEL_OPTIONAL]
- 2: `tls_certificates` TYPE_MESSAGE (envoy.extensions.transport_sockets.tls.v3.TlsCertificate) [LABEL_REPEATED]
- 6: `tls_certificate_sds_secret_configs` TYPE_MESSAGE (envoy.extensions.transport_sockets.tls.v3.SdsSecretConfig) [LABEL_REPEATED]
- 14: `tls_certificate_provider_instance` TYPE_MESSAGE (envoy.extensions.transport_sockets.tls.v3.CertificateProviderPluginInstance) [LABEL_OPTIONAL]
- 9: `tls_certificate_certificate_provider` TYPE_MESSAGE (envoy.extensions.transport_sockets.tls.v3.CommonTlsContext.CertificateProvider) [LABEL_OPTIONAL]
- 11: `tls_certificate_certificate_provider_instance` TYPE_MESSAGE (envoy.extensions.transport_sockets.tls.v3.CommonTlsContext.CertificateProviderInstance) [LABEL_OPTIONAL]
- 3: `validation_context` TYPE_MESSAGE (envoy.extensions.transport_sockets.tls.v3.CertificateValidationContext) [LABEL_OPTIONAL]
- 7: `validation_context_sds_secret_config` TYPE_MESSAGE (envoy.extensions.transport_sockets.tls.v3.SdsSecretConfig) [LABEL_OPTIONAL]
- 8: `combined_validation_context` TYPE_MESSAGE (envoy.extensions.transport_sockets.tls.v3.CommonTlsContext.CombinedCertificateValidationContext) [LABEL_OPTIONAL]
- 10: `validation_context_certificate_provider` TYPE_MESSAGE (envoy.extensions.transport_sockets.tls.v3.CommonTlsContext.CertificateProvider) [LABEL_OPTIONAL]
- 12: `validation_context_certificate_provider_instance` TYPE_MESSAGE (envoy.extensions.transport_sockets.tls.v3.CommonTlsContext.CertificateProviderInstance) [LABEL_OPTIONAL]
- 4: `alpn_protocols` TYPE_STRING [LABEL_REPEATED]
- 13: `custom_handshaker` TYPE_MESSAGE (envoy.config.core.v3.TypedExtensionConfig) [LABEL_OPTIONAL]
- 15: `key_log` TYPE_MESSAGE (envoy.extensions.transport_sockets.tls.v3.TlsKeyLog) [LABEL_OPTIONAL]
- nested: CertificateProvider, CertificateProviderInstance, CombinedCertificateValidationContext

## `envoy/extensions/upstreams/http/v3/http_protocol_options.proto`
package `envoy.extensions.upstreams.http.v3` · syntax `proto3`
deps: `envoy/config/core/v3/extension.proto`, `envoy/config/core/v3/protocol.proto`, `envoy/extensions/filters/network/http_connection_manager/v3/http_connection_manager.proto`, `udpa/annotations/status.proto`, `validate/validate.proto`

### Message `HttpProtocolOptions`
- 1: `common_http_protocol_options` TYPE_MESSAGE (envoy.config.core.v3.HttpProtocolOptions) [LABEL_OPTIONAL]
- 2: `upstream_http_protocol_options` TYPE_MESSAGE (envoy.config.core.v3.UpstreamHttpProtocolOptions) [LABEL_OPTIONAL]
- 3: `explicit_http_config` TYPE_MESSAGE (envoy.extensions.upstreams.http.v3.HttpProtocolOptions.ExplicitHttpConfig) [LABEL_OPTIONAL]
- 4: `use_downstream_protocol_config` TYPE_MESSAGE (envoy.extensions.upstreams.http.v3.HttpProtocolOptions.UseDownstreamHttpConfig) [LABEL_OPTIONAL]
- 5: `auto_config` TYPE_MESSAGE (envoy.extensions.upstreams.http.v3.HttpProtocolOptions.AutoHttpConfig) [LABEL_OPTIONAL]
- 6: `http_filters` TYPE_MESSAGE (envoy.extensions.filters.network.http_connection_manager.v3.HttpFilter) [LABEL_REPEATED]
- 7: `header_validation_config` TYPE_MESSAGE (envoy.config.core.v3.TypedExtensionConfig) [LABEL_OPTIONAL]
- nested: ExplicitHttpConfig, UseDownstreamHttpConfig, AutoHttpConfig

## `envoy/service/discovery/v3/discovery.proto`
package `envoy.service.discovery.v3` · syntax `proto3`
deps: `envoy/config/core/v3/base.proto`, `google/protobuf/any.proto`, `google/protobuf/duration.proto`, `google/rpc/status.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `ResourceLocator`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `dynamic_parameters` TYPE_MESSAGE (envoy.service.discovery.v3.ResourceLocator.DynamicParametersEntry) [LABEL_REPEATED]
- nested: DynamicParametersEntry

### Message `ResourceName`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `dynamic_parameter_constraints` TYPE_MESSAGE (envoy.service.discovery.v3.DynamicParameterConstraints) [LABEL_OPTIONAL]

### Message `DiscoveryRequest`
- 1: `version_info` TYPE_STRING [LABEL_OPTIONAL]
- 2: `node` TYPE_MESSAGE (envoy.config.core.v3.Node) [LABEL_OPTIONAL]
- 3: `resource_names` TYPE_STRING [LABEL_REPEATED]
- 7: `resource_locators` TYPE_MESSAGE (envoy.service.discovery.v3.ResourceLocator) [LABEL_REPEATED]
- 4: `type_url` TYPE_STRING [LABEL_OPTIONAL]
- 5: `response_nonce` TYPE_STRING [LABEL_OPTIONAL]
- 6: `error_detail` TYPE_MESSAGE (google.rpc.Status) [LABEL_OPTIONAL]

### Message `DiscoveryResponse`
- 1: `version_info` TYPE_STRING [LABEL_OPTIONAL]
- 2: `resources` TYPE_MESSAGE (google.protobuf.Any) [LABEL_REPEATED]
- 3: `canary` TYPE_BOOL [LABEL_OPTIONAL]
- 4: `type_url` TYPE_STRING [LABEL_OPTIONAL]
- 5: `nonce` TYPE_STRING [LABEL_OPTIONAL]
- 6: `control_plane` TYPE_MESSAGE (envoy.config.core.v3.ControlPlane) [LABEL_OPTIONAL]

### Message `DeltaDiscoveryRequest`
- 1: `node` TYPE_MESSAGE (envoy.config.core.v3.Node) [LABEL_OPTIONAL]
- 2: `type_url` TYPE_STRING [LABEL_OPTIONAL]
- 3: `resource_names_subscribe` TYPE_STRING [LABEL_REPEATED]
- 4: `resource_names_unsubscribe` TYPE_STRING [LABEL_REPEATED]
- 8: `resource_locators_subscribe` TYPE_MESSAGE (envoy.service.discovery.v3.ResourceLocator) [LABEL_REPEATED]
- 9: `resource_locators_unsubscribe` TYPE_MESSAGE (envoy.service.discovery.v3.ResourceLocator) [LABEL_REPEATED]
- 5: `initial_resource_versions` TYPE_MESSAGE (envoy.service.discovery.v3.DeltaDiscoveryRequest.InitialResourceVersionsEntry) [LABEL_REPEATED]
- 6: `response_nonce` TYPE_STRING [LABEL_OPTIONAL]
- 7: `error_detail` TYPE_MESSAGE (google.rpc.Status) [LABEL_OPTIONAL]
- nested: InitialResourceVersionsEntry

### Message `DeltaDiscoveryResponse`
- 1: `system_version_info` TYPE_STRING [LABEL_OPTIONAL]
- 2: `resources` TYPE_MESSAGE (envoy.service.discovery.v3.Resource) [LABEL_REPEATED]
- 4: `type_url` TYPE_STRING [LABEL_OPTIONAL]
- 6: `removed_resources` TYPE_STRING [LABEL_REPEATED]
- 8: `removed_resource_names` TYPE_MESSAGE (envoy.service.discovery.v3.ResourceName) [LABEL_REPEATED]
- 5: `nonce` TYPE_STRING [LABEL_OPTIONAL]
- 7: `control_plane` TYPE_MESSAGE (envoy.config.core.v3.ControlPlane) [LABEL_OPTIONAL]

### Message `DynamicParameterConstraints`
- 1: `constraint` TYPE_MESSAGE (envoy.service.discovery.v3.DynamicParameterConstraints.SingleConstraint) [LABEL_OPTIONAL]
- 2: `or_constraints` TYPE_MESSAGE (envoy.service.discovery.v3.DynamicParameterConstraints.ConstraintList) [LABEL_OPTIONAL]
- 3: `and_constraints` TYPE_MESSAGE (envoy.service.discovery.v3.DynamicParameterConstraints.ConstraintList) [LABEL_OPTIONAL]
- 4: `not_constraints` TYPE_MESSAGE (envoy.service.discovery.v3.DynamicParameterConstraints) [LABEL_OPTIONAL]
- nested: SingleConstraint, ConstraintList

### Message `Resource`
- 3: `name` TYPE_STRING [LABEL_OPTIONAL]
- 8: `resource_name` TYPE_MESSAGE (envoy.service.discovery.v3.ResourceName) [LABEL_OPTIONAL]
- 4: `aliases` TYPE_STRING [LABEL_REPEATED]
- 1: `version` TYPE_STRING [LABEL_OPTIONAL]
- 2: `resource` TYPE_MESSAGE (google.protobuf.Any) [LABEL_OPTIONAL]
- 6: `ttl` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 7: `cache_control` TYPE_MESSAGE (envoy.service.discovery.v3.Resource.CacheControl) [LABEL_OPTIONAL]
- 9: `metadata` TYPE_MESSAGE (envoy.config.core.v3.Metadata) [LABEL_OPTIONAL]
- nested: CacheControl

## `envoy/service/load_stats/v3/lrs.proto`
package `envoy.service.load_stats.v3` · syntax `proto3`
deps: `envoy/config/core/v3/base.proto`, `envoy/config/endpoint/v3/load_report.proto`, `google/protobuf/duration.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`

### Service `LoadReportingService`
- `StreamLoadStats`(envoy.service.load_stats.v3.LoadStatsRequest) → envoy.service.load_stats.v3.LoadStatsResponse

### Message `LoadStatsRequest`
- 1: `node` TYPE_MESSAGE (envoy.config.core.v3.Node) [LABEL_OPTIONAL]
- 2: `cluster_stats` TYPE_MESSAGE (envoy.config.endpoint.v3.ClusterStats) [LABEL_REPEATED]

### Message `LoadStatsResponse`
- 1: `clusters` TYPE_STRING [LABEL_REPEATED]
- 4: `send_all_clusters` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `load_reporting_interval` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 3: `report_endpoint_granularity` TYPE_BOOL [LABEL_OPTIONAL]

## `envoy/type/http/v3/cookie.proto`
package `envoy.type.http.v3` · syntax `proto3`
deps: `google/protobuf/duration.proto`, `udpa/annotations/status.proto`, `validate/validate.proto`

### Message `Cookie`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `ttl` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 3: `path` TYPE_STRING [LABEL_OPTIONAL]

## `envoy/type/http/v3/path_transformation.proto`
package `envoy.type.http.v3` · syntax `proto3`
deps: `udpa/annotations/status.proto`, `validate/validate.proto`

### Message `PathTransformation`
- 1: `operations` TYPE_MESSAGE (envoy.type.http.v3.PathTransformation.Operation) [LABEL_REPEATED]
- nested: Operation

## `envoy/type/matcher/v3/filter_state.proto`
package `envoy.type.matcher.v3` · syntax `proto3`
deps: `envoy/type/matcher/v3/string.proto`, `udpa/annotations/status.proto`, `validate/validate.proto`

### Message `FilterStateMatcher`
- 1: `key` TYPE_STRING [LABEL_OPTIONAL]
- 2: `string_match` TYPE_MESSAGE (envoy.type.matcher.v3.StringMatcher) [LABEL_OPTIONAL]

## `envoy/type/matcher/v3/metadata.proto`
package `envoy.type.matcher.v3` · syntax `proto3`
deps: `envoy/type/matcher/v3/value.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `MetadataMatcher`
- 1: `filter` TYPE_STRING [LABEL_OPTIONAL]
- 2: `path` TYPE_MESSAGE (envoy.type.matcher.v3.MetadataMatcher.PathSegment) [LABEL_REPEATED]
- 3: `value` TYPE_MESSAGE (envoy.type.matcher.v3.ValueMatcher) [LABEL_OPTIONAL]
- 4: `invert` TYPE_BOOL [LABEL_OPTIONAL]
- nested: PathSegment

## `envoy/type/matcher/v3/number.proto`
package `envoy.type.matcher.v3` · syntax `proto3`
deps: `envoy/type/v3/range.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `DoubleMatcher`
- 1: `range` TYPE_MESSAGE (envoy.type.v3.DoubleRange) [LABEL_OPTIONAL]
- 2: `exact` TYPE_DOUBLE [LABEL_OPTIONAL]

## `envoy/type/matcher/v3/path.proto`
package `envoy.type.matcher.v3` · syntax `proto3`
deps: `envoy/type/matcher/v3/string.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `PathMatcher`
- 1: `path` TYPE_MESSAGE (envoy.type.matcher.v3.StringMatcher) [LABEL_OPTIONAL]

## `envoy/type/matcher/v3/regex.proto`
package `envoy.type.matcher.v3` · syntax `proto3`
deps: `google/protobuf/wrappers.proto`, `envoy/annotations/deprecation.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `RegexMatcher`
- 1: `google_re2` TYPE_MESSAGE (envoy.type.matcher.v3.RegexMatcher.GoogleRE2) [LABEL_OPTIONAL]
- 2: `regex` TYPE_STRING [LABEL_OPTIONAL]
- nested: GoogleRE2

### Message `RegexMatchAndSubstitute`
- 1: `pattern` TYPE_MESSAGE (envoy.type.matcher.v3.RegexMatcher) [LABEL_OPTIONAL]
- 2: `substitution` TYPE_STRING [LABEL_OPTIONAL]

## `envoy/type/matcher/v3/string.proto`
package `envoy.type.matcher.v3` · syntax `proto3`
deps: `envoy/type/matcher/v3/regex.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `StringMatcher`
- 1: `exact` TYPE_STRING [LABEL_OPTIONAL]
- 2: `prefix` TYPE_STRING [LABEL_OPTIONAL]
- 3: `suffix` TYPE_STRING [LABEL_OPTIONAL]
- 5: `safe_regex` TYPE_MESSAGE (envoy.type.matcher.v3.RegexMatcher) [LABEL_OPTIONAL]
- 7: `contains` TYPE_STRING [LABEL_OPTIONAL]
- 6: `ignore_case` TYPE_BOOL [LABEL_OPTIONAL]

### Message `ListStringMatcher`
- 1: `patterns` TYPE_MESSAGE (envoy.type.matcher.v3.StringMatcher) [LABEL_REPEATED]

## `envoy/type/matcher/v3/value.proto`
package `envoy.type.matcher.v3` · syntax `proto3`
deps: `envoy/type/matcher/v3/number.proto`, `envoy/type/matcher/v3/string.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `ValueMatcher`
- 1: `null_match` TYPE_MESSAGE (envoy.type.matcher.v3.ValueMatcher.NullMatch) [LABEL_OPTIONAL]
- 2: `double_match` TYPE_MESSAGE (envoy.type.matcher.v3.DoubleMatcher) [LABEL_OPTIONAL]
- 3: `string_match` TYPE_MESSAGE (envoy.type.matcher.v3.StringMatcher) [LABEL_OPTIONAL]
- 4: `bool_match` TYPE_BOOL [LABEL_OPTIONAL]
- 5: `present_match` TYPE_BOOL [LABEL_OPTIONAL]
- 6: `list_match` TYPE_MESSAGE (envoy.type.matcher.v3.ListMatcher) [LABEL_OPTIONAL]
- 7: `or_match` TYPE_MESSAGE (envoy.type.matcher.v3.OrMatcher) [LABEL_OPTIONAL]
- nested: NullMatch

### Message `ListMatcher`
- 1: `one_of` TYPE_MESSAGE (envoy.type.matcher.v3.ValueMatcher) [LABEL_OPTIONAL]

### Message `OrMatcher`
- 1: `value_matchers` TYPE_MESSAGE (envoy.type.matcher.v3.ValueMatcher) [LABEL_REPEATED]

## `envoy/type/metadata/v3/metadata.proto`
package `envoy.type.metadata.v3` · syntax `proto3`
deps: `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `MetadataKey`
- 1: `key` TYPE_STRING [LABEL_OPTIONAL]
- 2: `path` TYPE_MESSAGE (envoy.type.metadata.v3.MetadataKey.PathSegment) [LABEL_REPEATED]
- nested: PathSegment

### Message `MetadataKind`
- 1: `request` TYPE_MESSAGE (envoy.type.metadata.v3.MetadataKind.Request) [LABEL_OPTIONAL]
- 2: `route` TYPE_MESSAGE (envoy.type.metadata.v3.MetadataKind.Route) [LABEL_OPTIONAL]
- 3: `cluster` TYPE_MESSAGE (envoy.type.metadata.v3.MetadataKind.Cluster) [LABEL_OPTIONAL]
- 4: `host` TYPE_MESSAGE (envoy.type.metadata.v3.MetadataKind.Host) [LABEL_OPTIONAL]
- nested: Request, Route, Cluster, Host

## `envoy/type/tracing/v3/custom_tag.proto`
package `envoy.type.tracing.v3` · syntax `proto3`
deps: `envoy/type/metadata/v3/metadata.proto`, `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `CustomTag`
- 1: `tag` TYPE_STRING [LABEL_OPTIONAL]
- 2: `literal` TYPE_MESSAGE (envoy.type.tracing.v3.CustomTag.Literal) [LABEL_OPTIONAL]
- 3: `environment` TYPE_MESSAGE (envoy.type.tracing.v3.CustomTag.Environment) [LABEL_OPTIONAL]
- 4: `request_header` TYPE_MESSAGE (envoy.type.tracing.v3.CustomTag.Header) [LABEL_OPTIONAL]
- 5: `metadata` TYPE_MESSAGE (envoy.type.tracing.v3.CustomTag.Metadata) [LABEL_OPTIONAL]
- nested: Literal, Environment, Header, Metadata

## `envoy/type/v3/http.proto`
package `envoy.type.v3` · syntax `proto3`
deps: `udpa/annotations/status.proto`

### Enum `CodecClientType`
- 0 = `HTTP1`
- 1 = `HTTP2`
- 2 = `HTTP3`

## `envoy/type/v3/percent.proto`
package `envoy.type.v3` · syntax `proto3`
deps: `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`, `validate/validate.proto`

### Message `Percent`
- 1: `value` TYPE_DOUBLE [LABEL_OPTIONAL]

### Message `FractionalPercent`
- 1: `numerator` TYPE_UINT32 [LABEL_OPTIONAL]
- 2: `denominator` TYPE_ENUM (envoy.type.v3.FractionalPercent.DenominatorType) [LABEL_OPTIONAL]

## `envoy/type/v3/range.proto`
package `envoy.type.v3` · syntax `proto3`
deps: `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`

### Message `Int64Range`
- 1: `start` TYPE_INT64 [LABEL_OPTIONAL]
- 2: `end` TYPE_INT64 [LABEL_OPTIONAL]

### Message `Int32Range`
- 1: `start` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `end` TYPE_INT32 [LABEL_OPTIONAL]

### Message `DoubleRange`
- 1: `start` TYPE_DOUBLE [LABEL_OPTIONAL]
- 2: `end` TYPE_DOUBLE [LABEL_OPTIONAL]

## `envoy/type/v3/semantic_version.proto`
package `envoy.type.v3` · syntax `proto3`
deps: `udpa/annotations/status.proto`, `udpa/annotations/versioning.proto`

### Message `SemanticVersion`
- 1: `major_number` TYPE_UINT32 [LABEL_OPTIONAL]
- 2: `minor_number` TYPE_UINT32 [LABEL_OPTIONAL]
- 3: `patch` TYPE_UINT32 [LABEL_OPTIONAL]

## `extraMediaData.proto`
package `bmg` · syntax `proto3`

### Message `CubemapProjectionDesc`
- 1: `projectType` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `panoWidth` TYPE_INT32 [LABEL_OPTIONAL]
- 3: `cubeWidthExtend` TYPE_INT32 [LABEL_OPTIONAL]
- 4: `width` TYPE_INT32 [LABEL_OPTIONAL]

### Message `WideAngleParam`
- 1: `fov` TYPE_DOUBLE [LABEL_OPTIONAL]

### Message `ExtraMediaDataProto`
- 1: `projectionDesc` TYPE_MESSAGE (bmg.CubemapProjectionDesc) [LABEL_OPTIONAL]
- 2: `wideAngleParam` TYPE_MESSAGE (bmg.WideAngleParam) [LABEL_OPTIONAL]
- 3: `isCompressed` TYPE_BOOL [LABEL_OPTIONAL]
- 4: `additionalData` TYPE_MESSAGE (bmg.ExtraMediaDataProto.AdditionalDataEntry) [LABEL_REPEATED]
- 5: `videoType` TYPE_ENUM (bmg.VideoType) [LABEL_OPTIONAL]
- nested: AdditionalDataEntry

### Enum `VideoType`
- 0 = `VIDEOTYPE_ORIGINAL`
- 1 = `VIDEOTYPE_AGENT`
- 2 = `VIDEOTYPE_STITCHED_PANO`
- 3 = `VIDEOTYPE_EACUBEMAP`
- 4 = `VIDEOTYPE_CLOUD_SINGLE_FISHEYE`

## `extra_info.proto`
package `insta360.messages` · syntax `proto3`
deps: `offset_state.proto`, `window_crop_info.proto`, `commands/editinfo_list.proto`, `capture_beauty_info.proto`, `extra_recipe.proto`, `offset_info.proto`, `af_lens_info.proto`

### Message `ExtraMetadata`
- 1: `serial_number` TYPE_STRING [LABEL_OPTIONAL]
- 2: `camera_type` TYPE_STRING [LABEL_OPTIONAL]
- 3: `fw_version` TYPE_STRING [LABEL_OPTIONAL]
- 4: `file_type` TYPE_STRING [LABEL_OPTIONAL]
- 5: `offset` TYPE_STRING [LABEL_OPTIONAL]
- 6: `ip` TYPE_STRING [LABEL_OPTIONAL]
- 7: `creation_time` TYPE_UINT64 [LABEL_OPTIONAL]
- 8: `export_time` TYPE_UINT64 [LABEL_OPTIONAL]
- 9: `file_size` TYPE_UINT64 [LABEL_OPTIONAL]
- 10: `total_time` TYPE_UINT32 [LABEL_OPTIONAL]
- 11: `gps` TYPE_BYTES [LABEL_OPTIONAL]
- 12: `orientation` TYPE_BYTES [LABEL_OPTIONAL]
- 13: `user_options` TYPE_MESSAGE (insta360.messages.ExtraMetadata.ExtraUserOptions) [LABEL_OPTIONAL]
- 14: `gyro` TYPE_BYTES [LABEL_OPTIONAL]
- 15: `hdr_state` TYPE_ENUM (insta360.messages.ExtraMetadata.HDR_STATE) [LABEL_OPTIONAL]
- 16: `hdr_identifier` TYPE_STRING [LABEL_OPTIONAL]
- 17: `original_offset` TYPE_STRING [LABEL_OPTIONAL]
- 18: `trigger_source` TYPE_ENUM (insta360.messages.ExtraMetadata.TriggerSource) [LABEL_OPTIONAL]
- 19: `dimension` TYPE_MESSAGE (insta360.messages.ExtraMetadata.Vector2) [LABEL_OPTIONAL]
- 20: `frame_rate` TYPE_INT32 [LABEL_OPTIONAL]
- 21: `image_translate` TYPE_MESSAGE (insta360.messages.ExtraMetadata.Vector2) [LABEL_OPTIONAL]
- 22: `gamma_mode` TYPE_STRING [LABEL_OPTIONAL]
- 23: `thumbnail_gyro_index` TYPE_MESSAGE (insta360.messages.ExtraMetadata.GyroIndex) [LABEL_OPTIONAL]
- 24: `first_frame_timestamp` TYPE_INT64 [LABEL_OPTIONAL]
- 25: `rolling_shutter_time` TYPE_DOUBLE [LABEL_OPTIONAL]
- 26: `file_group_info` TYPE_MESSAGE (insta360.messages.ExtraMetadata.FileGroupInfo) [LABEL_OPTIONAL]
- 27: `window_crop_info` TYPE_MESSAGE (insta360.messages.WindowCropInfo) [LABEL_OPTIONAL]
- 28: `gyro_timestamp` TYPE_DOUBLE [LABEL_OPTIONAL]
- 29: `is_has_gyro_timestamp` TYPE_BOOL [LABEL_OPTIONAL]
- 30: `timelapse_interval` TYPE_UINT32 [LABEL_OPTIONAL]
- 31: `gyro_calib` TYPE_BYTES [LABEL_OPTIONAL]
- 32: `evo_status_mode` TYPE_ENUM (insta360.messages.ExtraMetadata.EvoStatusMode) [LABEL_OPTIONAL]
- 33: `evo_status_id` TYPE_STRING [LABEL_OPTIONAL]
- 34: `original_offset_3d` TYPE_STRING [LABEL_OPTIONAL]
- 35: `gps_sources` TYPE_ENUM (insta360.messages.ExtraMetadata.GpsSource) [LABEL_REPEATED]
- 36: `first_gps_timestamp` TYPE_INT64 [LABEL_OPTIONAL]
- 37: `orientation_calib` TYPE_BYTES [LABEL_OPTIONAL]
- 38: `is_collected` TYPE_BOOL [LABEL_OPTIONAL]
- 39: `recycle_time` TYPE_UINT64 [LABEL_OPTIONAL]
- 40: `total_frames` TYPE_UINT32 [LABEL_OPTIONAL]
- 41: `is_selfie` TYPE_BOOL [LABEL_OPTIONAL]
- 42: `is_flowstate_online` TYPE_BOOL [LABEL_OPTIONAL]
- 43: `is_dewarp` TYPE_BOOL [LABEL_OPTIONAL]
- 44: `resolution_size` TYPE_MESSAGE (insta360.messages.ExtraMetadata.Vector2) [LABEL_OPTIONAL]
- 45: `battery_type` TYPE_ENUM (insta360.messages.ExtraMetadata.Battery_type) [LABEL_OPTIONAL]
- 46: `cam_posture` TYPE_ENUM (insta360.messages.ExtraMetadata.Camera_Posture) [LABEL_OPTIONAL]
- 47: `fov_type` TYPE_ENUM (insta360.messages.ExtraMetadata.Image_FovType) [LABEL_OPTIONAL]
- 48: `distance` TYPE_DOUBLE [LABEL_OPTIONAL]
- 49: `fov` TYPE_DOUBLE [LABEL_OPTIONAL]
- 50: `gyro_filter_type` TYPE_ENUM (insta360.messages.ExtraMetadata.Gyro_FilterType) [LABEL_OPTIONAL]
- 51: `gyro_type` TYPE_ENUM (insta360.messages.ExtraMetadata.GyroType) [LABEL_OPTIONAL]
- 52: `media_data_rotate_angel` TYPE_ENUM (insta360.messages.ExtraMetadata.VideoMediaDataRotateAngle) [LABEL_OPTIONAL]
- 53: `offset_v2` TYPE_STRING [LABEL_OPTIONAL]
- 54: `offset_v3` TYPE_STRING [LABEL_OPTIONAL]
- 55: `original_offset_v2` TYPE_STRING [LABEL_OPTIONAL]
- 56: `original_offset_v3` TYPE_STRING [LABEL_OPTIONAL]
- 57: `focusSensor` TYPE_ENUM (insta360.messages.ExtraMetadata.SensorDevice) [LABEL_OPTIONAL]
- 58: `expectOutputType` TYPE_ENUM (insta360.messages.ExtraMetadata.ExpectOutputType) [LABEL_OPTIONAL]
- 59: `timelapse_interval_in_millisecond` TYPE_BOOL [LABEL_OPTIONAL]
- 60: `photo_rot` TYPE_FLOAT [LABEL_REPEATED]
- 61: `audio_mode` TYPE_ENUM (insta360.messages.ExtraMetadata.AudioModeType) [LABEL_OPTIONAL]
- 62: `is_raw_gyro` TYPE_BOOL [LABEL_OPTIONAL]
- 63: `raw_capture_type` TYPE_ENUM (insta360.messages.ExtraMetadata.RawCaptureType) [LABEL_OPTIONAL]
- 64: `pts_type` TYPE_ENUM (insta360.messages.ExtraMetadata.VideoPtsType) [LABEL_OPTIONAL]
- 65: `gyro_cfg_info` TYPE_MESSAGE (insta360.messages.ExtraMetadata.GyroConfigInfo) [LABEL_OPTIONAL]
- 66: `lens_283M_type1` TYPE_ENUM (insta360.messages.ExtraMetadata.Lens283MType) [LABEL_OPTIONAL]
- 67: `lens_283M_type2` TYPE_ENUM (insta360.messages.ExtraMetadata.Lens283MType) [LABEL_OPTIONAL]
- 68: `offset_states` TYPE_ENUM (insta360.messages.OffsetState) [LABEL_OPTIONAL]
- 69: `q_i_uav` TYPE_FLOAT [LABEL_REPEATED]
- 70: `r_uav_i` TYPE_FLOAT [LABEL_REPEATED]
- 71: `auto_clip_para` TYPE_MESSAGE (insta360.messages.ExtraMetadata.AutoClipParam) [LABEL_OPTIONAL]
- 72: `meta_track_para` TYPE_MESSAGE (insta360.messages.ExtraMetadata.MetaTrackParam) [LABEL_OPTIONAL]
- 73: `time_scale` TYPE_ENUM (insta360.messages.ExtraMetadata.TimeScale) [LABEL_OPTIONAL]
- 74: `hdr_process_type` TYPE_ENUM (insta360.messages.ExtraMetadata.HdrProcessType) [LABEL_OPTIONAL]
- 75: `thumbnail_type` TYPE_ENUM (insta360.messages.ExtraMetadata.ThumbnailType) [LABEL_OPTIONAL]
- 76: `pureshot_process_type` TYPE_ENUM (insta360.messages.ExtraMetadata.PureShotProcessType) [LABEL_OPTIONAL]
- 77: `pre_rec_time_flag` TYPE_BOOL [LABEL_OPTIONAL]
- 78: `frame_rate_av_rational` TYPE_MESSAGE (insta360.messages.ExtraMetadata.FrameRateAVRational) [LABEL_OPTIONAL]
- 79: `pano_record_type` TYPE_ENUM (insta360.messages.ExtraMetadata.PanoRecordType) [LABEL_OPTIONAL]
- 80: `pano_record_multi_track_order` TYPE_ENUM (insta360.messages.ExtraMetadata.PanoRecordMultiTrackOrder) [LABEL_OPTIONAL]
- 81: `thumbnail_stitch_type` TYPE_ENUM (insta360.messages.ExtraMetadata.ThumbnailStitchType) [LABEL_OPTIONAL]
- 82: `image_stitch_type` TYPE_ENUM (insta360.messages.ExtraMetadata.ImageStitchType) [LABEL_OPTIONAL]
- 83: `scene_type` TYPE_ENUM (insta360.messages.ExtraMetadata.SceneType) [LABEL_OPTIONAL]
- 84: `Is_Cutting_Thumbnail` TYPE_BOOL [LABEL_OPTIONAL]
- 85: `reprocessing_type` TYPE_ENUM (insta360.messages.ExtraMetadata.ReprocessingType) [LABEL_OPTIONAL]
- 86: `online_flowstate_level` TYPE_ENUM (insta360.messages.ExtraMetadata.OnlineFlowstateLevel) [LABEL_OPTIONAL]
- 87: `bHighLightEidted` TYPE_BOOL [LABEL_OPTIONAL]
- 88: `file_split_type` TYPE_ENUM (insta360.messages.ExtraMetadata.FileSplitType) [LABEL_OPTIONAL]
- 89: `bFavorite` TYPE_BOOL [LABEL_OPTIONAL]
- 90: `edit_version` TYPE_UINT32 [LABEL_OPTIONAL]
- 91: `q_i_wnew` TYPE_DOUBLE [LABEL_REPEATED]
- 92: `bInsideEditorExport` TYPE_BOOL [LABEL_OPTIONAL]
- 93: `total_time_ms` TYPE_UINT32 [LABEL_OPTIONAL]
- 94: `bContinueRecord` TYPE_BOOL [LABEL_OPTIONAL]
- 95: `bPausedRecord` TYPE_BOOL [LABEL_OPTIONAL]
- 96: `bTorchmode` TYPE_BOOL [LABEL_OPTIONAL]
- 97: `hdr_mode_type` TYPE_ENUM (insta360.messages.ExtraMetadata.HdrModeType) [LABEL_OPTIONAL]
- 98: `continue_record_info` TYPE_MESSAGE (insta360.messages.ExtraMetadata.ContinueRecordInfo) [LABEL_REPEATED]
- 99: `bDropFrameOccur` TYPE_BOOL [LABEL_OPTIONAL]
- 100: `photoGroupNum` TYPE_UINT32 [LABEL_OPTIONAL]
- 101: `recovery` TYPE_BOOL [LABEL_OPTIONAL]
- 102: `has_pb_resolution` TYPE_BOOL [LABEL_OPTIONAL]
- 103: `pb_resolution_size` TYPE_MESSAGE (insta360.messages.ExtraMetadata.Vector2) [LABEL_OPTIONAL]
- 104: `guard_detected_type` TYPE_ENUM (insta360.messages.ExtraMetadata.GuardDetectedType) [LABEL_OPTIONAL]
- 105: `cooling_shell_selected_state` TYPE_ENUM (insta360.messages.ExtraMetadata.CoolingShellSelectedState) [LABEL_OPTIONAL]
- 106: `cooling_shell_algo_state` TYPE_ENUM (insta360.messages.ExtraMetadata.CoolingShellAlgoDetectedState) [LABEL_OPTIONAL]
- 107: `ai_switch_state` TYPE_ENUM (insta360.messages.ExtraMetadata.AISwitchState) [LABEL_OPTIONAL]
- 108: `pureshot_image_debug` TYPE_STRING [LABEL_OPTIONAL]
- 109: `material_3a_info` TYPE_MESSAGE (insta360.messages.ExtraMetadata.Material3AInfo) [LABEL_OPTIONAL]
- 110: `resolution_type` TYPE_ENUM (insta360.messages.ExtraMetadata.ResolutiuonType) [LABEL_OPTIONAL]
- 111: `offset_v6` TYPE_STRING [LABEL_OPTIONAL]
- 112: `original_offset_v6` TYPE_STRING [LABEL_OPTIONAL]
- 113: `interval_photo_interval_time` TYPE_UINT32 [LABEL_OPTIONAL]
- 114: `flowstate_level` TYPE_UINT32 [LABEL_OPTIONAL]
- 115: `folder_info` TYPE_MESSAGE (insta360.messages.ExtraMetadata.FolderInfo) [LABEL_OPTIONAL]
- 116: `horizon_enable` TYPE_BOOL [LABEL_OPTIONAL]
- 117: `time_zone_seconds_from_GMT` TYPE_INT32 [LABEL_OPTIONAL]
- 118: `underwater_mode_type` TYPE_ENUM (insta360.messages.ExtraMetadata.UnderWaterModeType) [LABEL_OPTIONAL]
- 119: `water_mark_type` TYPE_ENUM (insta360.messages.ExtraMetadata.WaterMarkType) [LABEL_OPTIONAL]
- 120: `audio_track_num` TYPE_UINT32 [LABEL_OPTIONAL]
- 121: `audio_track_info` TYPE_MESSAGE (insta360.messages.ExtraMetadata.AudioTrackInfo) [LABEL_REPEATED]
- 122: `cloud_video_type` TYPE_ENUM (insta360.messages.ExtraMetadata.CloudVideoType) [LABEL_OPTIONAL]
- 123: `extreme_lowpower_mode_type` TYPE_ENUM (insta360.messages.ExtraMetadata.ExtremeLowPowerModeType) [LABEL_OPTIONAL]
- 124: `lowlight_stabilization_mode_type` TYPE_ENUM (insta360.messages.ExtraMetadata.LowLightStabilizationModeType) [LABEL_OPTIONAL]
- 125: `cloud_video_info` TYPE_BYTES [LABEL_OPTIONAL]
- 126: `lens_module_type` TYPE_ENUM (insta360.messages.ExtraMetadata.LensModuleType) [LABEL_OPTIONAL]
- 127: `file_duration_tailor_time` TYPE_INT32 [LABEL_OPTIONAL]
- 128: `blend_Angle` TYPE_INT32 [LABEL_OPTIONAL]
- 129: `file_category` TYPE_ENUM (insta360.messages.ExtraMetadata.FileCategory) [LABEL_OPTIONAL]
- 130: `file_rotate` TYPE_ENUM (insta360.messages.ExtraMetadata.FileRotate) [LABEL_OPTIONAL]
- 131: `stream_type` TYPE_ENUM (insta360.messages.ExtraMetadata.StreamType) [LABEL_OPTIONAL]
- 132: `codec_type` TYPE_ENUM (insta360.messages.ExtraMetadata.CodecType) [LABEL_OPTIONAL]
- 133: `timelapse_interval_ms` TYPE_UINT64 [LABEL_OPTIONAL]
- 134: `is_pre_record` TYPE_BOOL [LABEL_OPTIONAL]
- 135: `file_expect_bitrate` TYPE_UINT64 [LABEL_OPTIONAL]
- 136: `capture_offset_version` TYPE_ENUM (insta360.messages.ExtraMetadata.OffsetVersion) [LABEL_OPTIONAL]
- 148: `expected_pano_ratio` TYPE_MESSAGE (insta360.messages.ExtraMetadata.Vector2) [LABEL_OPTIONAL]
- 149: `mctf_process_type` TYPE_ENUM (insta360.messages.ExtraMetadata.MCTFProcessType) [LABEL_OPTIONAL]
- 150: `timelaps_storage_type` TYPE_ENUM (insta360.messages.ExtraMetadata.TimelapsStorageType) [LABEL_OPTIONAL]
- 151: `direction_lock_type` TYPE_ENUM (insta360.messages.ExtraMetadata.DirectionLockType) [LABEL_OPTIONAL]
- 152: `dewarp_type` TYPE_ENUM (insta360.messages.ExtraMetadata.DeWarpType) [LABEL_OPTIONAL]
- 153: `uav_camera_mode` TYPE_ENUM (insta360.messages.ExtraMetadata.UavCameraMode) [LABEL_OPTIONAL]
- 154: `trim_start` TYPE_UINT32 [LABEL_OPTIONAL]
- 155: `trim_end` TYPE_UINT32 [LABEL_OPTIONAL]
- 156: `remove_purple_fringing` TYPE_ENUM (insta360.messages.ExtraMetadata.RemovePurpleFringing) [LABEL_OPTIONAL]
- 157: `capture_recommend_stitch_type` TYPE_ENUM (insta360.messages.ExtraMetadata.CaptureRecommendStitchType) [LABEL_OPTIONAL]
- 158: `takeover_info` TYPE_MESSAGE (insta360.messages.ExtraMetadata.IntervaRecTakeoverInfo) [LABEL_OPTIONAL]
- 159: `preset_type` TYPE_ENUM (insta360.messages.ExtraMetadata.PrsestType) [LABEL_OPTIONAL]
- 160: `file_scene_info` TYPE_MESSAGE (insta360.messages.ExtraMetadata.FileSceneInfo) [LABEL_OPTIONAL]
- 161: `evmap_level` TYPE_ENUM (insta360.messages.ExtraMetadata.EvMapLevel) [LABEL_OPTIONAL]
- 162: `ae_state` TYPE_UINT32 [LABEL_OPTIONAL]
- 163: `sharpen_state` TYPE_ENUM (insta360.messages.ExtraMetadata.SharpenState) [LABEL_OPTIONAL]
- 164: `aeflicker_type` TYPE_ENUM (insta360.messages.ExtraMetadata.AeFlickerType) [LABEL_OPTIONAL]
- 165: `uav_pos_data_version` TYPE_UINT32 [LABEL_OPTIONAL]
- 166: `mag_calib_dongle` TYPE_MESSAGE (insta360.messages.ExtraMetadata.MagCalib) [LABEL_OPTIONAL]
- 167: `mag_calib_tm` TYPE_MESSAGE (insta360.messages.ExtraMetadata.MagCalib) [LABEL_OPTIONAL]
- 168: `q_i_mag_dongle` TYPE_MESSAGE (insta360.messages.ExtraMetadata.MagQI) [LABEL_OPTIONAL]
- 169: `q_i_mag_tm` TYPE_MESSAGE (insta360.messages.ExtraMetadata.MagQI) [LABEL_OPTIONAL]
- 170: `q_b_tm` TYPE_MESSAGE (insta360.messages.ExtraMetadata.MagQI) [LABEL_OPTIONAL]
- 171: `uav_datatype_version` TYPE_UINT32 [LABEL_OPTIONAL]
- 172: `pre_rec_frano_sec` TYPE_UINT32 [LABEL_OPTIONAL]
- 173: `bPlaybackCache` TYPE_BOOL [LABEL_OPTIONAL]
- 174: `is_horizontal_state` TYPE_BOOL [LABEL_OPTIONAL]
- 175: `propeller_guard_status` TYPE_ENUM (insta360.messages.ExtraMetadata.PropellerGuardStatusType) [LABEL_OPTIONAL]
- 176: `is_af_lens` TYPE_BOOL [LABEL_OPTIONAL]
- 177: `af_lens_info` TYPE_MESSAGE (insta360.messages.AFLensInfo) [LABEL_OPTIONAL]
- 178: `camera_calib_additional_info` TYPE_MESSAGE (insta360.messages.ExtraMetadata.CameraCalibAdditionalInfo) [LABEL_OPTIONAL]
- 179: `high_light_source` TYPE_ENUM (insta360.messages.ExtraMetadata.HighLightSource) [LABEL_OPTIONAL]
- 180: `is_capture_beauty_mode_on` TYPE_BOOL [LABEL_OPTIONAL]
- 181: `beauty_info` TYPE_MESSAGE (insta360.messages.CaptureBeautyParams) [LABEL_OPTIONAL]
- 182: `color_correction` TYPE_ENUM (insta360.messages.ExtraMetadata.ColorCorrectionType) [LABEL_OPTIONAL]
- 183: `capture_image_quality_info` TYPE_MESSAGE (insta360.messages.ExtraMetadata.CaptureImageQualityInfo) [LABEL_OPTIONAL]
- 184: `is_capture_beauty_support` TYPE_BOOL [LABEL_OPTIONAL]
- 185: `record_start_timestamp_ms` TYPE_INT64 [LABEL_OPTIONAL]
- 186: `lens_accessory_type` TYPE_ENUM (insta360.messages.ExtraMetadata.LensAccessoryType) [LABEL_OPTIONAL]
- 187: `lens_accessory_offset` TYPE_STRING [LABEL_OPTIONAL]
- 188: `screen_orientation` TYPE_ENUM (insta360.messages.ExtraMetadata.Camera_Screen_Orientation) [LABEL_OPTIONAL]
- 189: `filp_type` TYPE_ENUM (insta360.messages.ExtraMetadata.CaptureFilpType) [LABEL_OPTIONAL]
- 190: `shooting_accessories` TYPE_ENUM (insta360.messages.ExtraMetadata.ShootingAccessoriesType) [LABEL_OPTIONAL]
- 191: `street_photo_horizon_correction` TYPE_ENUM (insta360.messages.ExtraMetadata.StreetPhotoHorizCorrection) [LABEL_OPTIONAL]
- 192: `offset_calib` TYPE_MESSAGE (insta360.messages.ExtraMetadata.CameraOffsetCalib) [LABEL_OPTIONAL]
- 193: `P3_fake_on` TYPE_BOOL [LABEL_OPTIONAL]
- 194: `watermark_style` TYPE_ENUM (insta360.messages.ExtraMetadata.WaterMarkStyle) [LABEL_OPTIONAL]
- 195: `origin_framerate` TYPE_MESSAGE (insta360.messages.ExtraMetadata.FrameRateAVRational) [LABEL_OPTIONAL]
- 196: `final_framerate` TYPE_MESSAGE (insta360.messages.ExtraMetadata.FrameRateAVRational) [LABEL_OPTIONAL]
- 197: `offset_v8` TYPE_STRING [LABEL_OPTIONAL]
- 198: `first_tracking_frame_number` TYPE_UINT64 [LABEL_OPTIONAL]
- 199: `repaired_type` TYPE_ENUM (insta360.messages.ExtraMetadata.RepairedType) [LABEL_OPTIONAL]
- 200: `aperture_value` TYPE_STRING [LABEL_OPTIONAL]
- 201: `extern_filter` TYPE_STRING [LABEL_OPTIONAL]
- 202: `is_3a_description_supported` TYPE_BOOL [LABEL_OPTIONAL]
- 203: `main_video_bitdepth` TYPE_ENUM (insta360.messages.ExtraMetadata.VideoBitDepth) [LABEL_OPTIONAL]
- 204: `optional_video_bitdepth` TYPE_ENUM (insta360.messages.ExtraMetadata.VideoBitDepth) [LABEL_OPTIONAL]
- 205: `video_color_space` TYPE_ENUM (insta360.messages.ExtraMetadata.VideoColorSpace) [LABEL_OPTIONAL]
- 206: `offset_info` TYPE_MESSAGE (insta360.messages.OffsetInfo) [LABEL_REPEATED]
- 207: `sensor_module_temper` TYPE_FLOAT [LABEL_OPTIONAL]
- 208: `is_ultra_hdr_on` TYPE_BOOL [LABEL_OPTIONAL]
- 209: `views` TYPE_MESSAGE (insta360.messages.ExtraMetadata.BigboomTracks) [LABEL_REPEATED]
- 210: `photo_still_rot` TYPE_FLOAT [LABEL_REPEATED]
- 211: `aigc_info` TYPE_MESSAGE (insta360.messages.ExtraMetadata.AIGCInfo) [LABEL_OPTIONAL]
- 212: `shooting_param_info` TYPE_MESSAGE (insta360.messages.ExtraMetadata.ShootingParamInfo) [LABEL_OPTIONAL]
- 213: `thumbnail_hero_rot_quat` TYPE_MESSAGE (insta360.messages.ExtraMetadata.ThumbnailHeroRotQuatData) [LABEL_OPTIONAL]
- 214: `fac_calib_temper` TYPE_FLOAT [LABEL_OPTIONAL]
- 215: `is_vfr_record` TYPE_BOOL [LABEL_OPTIONAL]
- 216: `uav_control_type` TYPE_ENUM (insta360.messages.ExtraMetadata.UavControlType) [LABEL_OPTIONAL]
- 217: `uav_display_type` TYPE_ENUM (insta360.messages.ExtraMetadata.UavDisplayType) [LABEL_OPTIONAL]
- 218: `av_synth_status` TYPE_ENUM (insta360.messages.ExtraMetadata.AvSynthStatus) [LABEL_OPTIONAL]
- 219: `simulation_path` TYPE_STRING [LABEL_OPTIONAL]
- 220: `audio_concert_scene` TYPE_ENUM (insta360.messages.ExtraMetadata.AudioConcertSceneType) [LABEL_OPTIONAL]
- 221: `small_thumbnail_type` TYPE_ENUM (insta360.messages.ExtraMetadata.ThumbnailType) [LABEL_OPTIONAL]
- nested: ExtraUserOptions, Vector2, GyroIndex, FileGroupInfo, GyroConfigInfo, AiLibVersion, AutoClipVersion, AutoClipParam, MetaTrackParam, FrameRateAVRational, ContinueRecordInfo, Material3AInfo, FolderInfo, AudioTrackInfo, IntervaRecTakeoverInfo, FileSceneInfo, MagCalib, MagQI, CameraCalibAdditionalInfo, CaptureImageQualityInfo, CameraOffsetCalib, BigboomTracks, AIGCInfo, ShootingParamInfo, ThumbnailRotQuat, ThumbnailHeroRotQuatData

### Message `FileExtraMetadataResp`
- 1: `uri` TYPE_STRING [LABEL_REPEATED]
- 2: `mediaData` TYPE_MESSAGE (insta360.messages.ExtraMetadata) [LABEL_REPEATED]
- 3: `total_count` TYPE_UINT32 [LABEL_OPTIONAL]
- 4: `start` TYPE_UINT32 [LABEL_OPTIONAL]
- 5: `end` TYPE_UINT32 [LABEL_OPTIONAL]
- 6: `favorite_info` TYPE_MESSAGE (insta360.messages.FavoriteInfo) [LABEL_REPEATED]
- 7: `map_index_list` TYPE_UINT32 [LABEL_REPEATED]

### Enum `ExtraType`
- 0 = `EXTRA_TYPE_ALL`
- 1 = `EXTRA_TYPE_METADATA`
- 2 = `EXTRA_TYPE_THUMBNAIL`
- 3 = `EXTRA_TYPE_GYRO`
- 4 = `EXTRA_TYPE_EXPOSURE`
- 5 = `EXTRA_TYPE_EXT_THUMBNAIL`
- 6 = `EXTRA_TYPE_FRAME_PTS`
- 7 = `EXTRA_TYPE_GPS`
- 8 = `EXTRA_TYPE_STAR_NUM`
- 9 = `EXTRA_TYPE_AAA_DATA`
- 10 = `EXTRA_TYPE_HIGHLIGHT`
- 11 = `EXTRA_TYPE_AAA_SIM`
- 12 = `EXTRA_TYPE_EXPOTIME_VIN1`
- 13 = `EXTRA_TYPE_MAGNETIC`
- 14 = `EXTRA_TYPE_EULER`
- 15 = `EXTRA_TYPE_SECGYRO`
- 16 = `EXTRA_TYPE_SPEED`
- 17 = `EXTRA_TYPE_TBOX`
- 18 = `EXTRA_TYPE_EDITOR`
- 19 = `EXTRA_TYPE_HEARTRATE`
- 20 = `EXTRA_TYPE_FORWARD_DIRECTION`
- 21 = `EXTRA_TYPE_UPVIEW`
- 22 = `EXTRA_TYPE_SHELL_RECOGNITION_DATA`
- 23 = `EXTRA_TYPE_POS`
- 24 = `EXTRA_TYPE_TIMELAPSE_QUAT`
- 25 = `EXTRA_TYPE_QUATERNION`
- 26 = `EXTRA_TYPE_APEI`
- 27 = `EXTRA_TYPE_BEISP_DYNAMICDATA`
- 28 = `EXTRA_TYPE_BEISP_STATICDATA`
- 29 = `EXTRA_TYPE_AEFLICKER`
- 30 = `EXTRA_TYPE_VEHICAL_INFO`
- 31 = `EXTRA_TYPE_TRAJECTORYSEGMENT`
- 32 = `EXTRA_TYPE_PLANEVIEW`
- 33 = `EXTRA_TYPE_AUTOEDIT_META`
- 34 = `EXTRA_TYPE_ADVANCEFUNC_META`
- 35 = `EXTRA_TYPE_DGMAG_DATA`
- 36 = `EXTRA_TYPE_TM_DATA`
- 37 = `EXTRA_TYPE_UAV_QUAT_VEL`
- 38 = `EXTRA_TYPE_TEMP_COMPENSATION`
- 39 = `EXTRA_TYPE_3A_DESCRIPTION`
- 40 = `EXTRA_TYPE_TRACK_INFO`
- 41 = `EXTRA_TYPE_EISSUBTITLE`
- 42 = `EXTRA_TYPE_RECIPE`
- 48 = `EXTRA_TYPE_UAV_TRACK_STAT`
- 49 = `EXTRA_TYPE_UAV_STATUS`
- 50 = `EXTRA_TYPE_TRACK_BOX`
- 51 = `EXTRA_TYPE_ONLINE_QUATERNION`
- 52 = `EXTRA_TYPE_SUB_STREAM_EXPOSURE`
- 53 = `EXTRA_TYPE_SENSOR_MODULE_TEMPER`
- 54 = `EXTRA_TYPE_SUB_STREAM_EXPOTIME_VIN1`
- 55 = `EXTRA_TYPE_PANO_EDITOR_RESULT`
- 56 = `EXTRA_TYPE_PLANEVIEW_V2`
- 57 = `EXTRA_TYPE_PANO_STILL_ROT`
- 58 = `EXTRA_TYPE_TM01_DATA`
- 59 = `EXTRA_TYPE_FLIGHT_INFO`
- 60 = `EXTRA_TYPE_THUMBNAIL_SMALL`
- 61 = `EXTRA_TYPE_TRIM_EXPOSURE_OFFSET`

## `extra_recipe.proto`
package `insta360.messages` · syntax `proto3`

### Message `ExtraRecipe`
- 1: `beauty_auto_enable` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `beauty_skin_level` TYPE_INT32 [LABEL_OPTIONAL]
- 3: `beauty_retouch_level` TYPE_UINT32 [LABEL_OPTIONAL]
- 4: `ev_bias_x10` TYPE_SINT32 [LABEL_OPTIONAL]
- 5: `iso_mode` TYPE_UINT32 [LABEL_OPTIONAL]
- 6: `iso_value` TYPE_UINT32 [LABEL_OPTIONAL]
- 7: `shutter_mode` TYPE_UINT32 [LABEL_OPTIONAL]
- 8: `shutter_value` TYPE_SINT32 [LABEL_OPTIONAL]
- 9: `awb_mode` TYPE_UINT32 [LABEL_OPTIONAL]
- 10: `wb_temp` TYPE_UINT32 [LABEL_OPTIONAL]
- 11: `wb_bias` TYPE_UINT32 [LABEL_OPTIONAL]
- 12: `contrast` TYPE_UINT32 [LABEL_OPTIONAL]
- 13: `saturation` TYPE_UINT32 [LABEL_OPTIONAL]
- 14: `noise` TYPE_UINT32 [LABEL_OPTIONAL]
- 15: `blue` TYPE_UINT32 [LABEL_OPTIONAL]
- 16: `sharpness` TYPE_UINT32 [LABEL_OPTIONAL]
- 17: `af_mode` TYPE_UINT32 [LABEL_OPTIONAL]
- 18: `af_speed` TYPE_UINT32 [LABEL_OPTIONAL]
- 19: `af_sensitivity` TYPE_UINT32 [LABEL_OPTIONAL]
- 20: `lut_type` TYPE_UINT32 [LABEL_OPTIONAL]
- 21: `lut_level` TYPE_UINT32 [LABEL_OPTIONAL]
- 22: `meter_mode` TYPE_UINT32 [LABEL_OPTIONAL]
- 23: `fovc_flag` TYPE_UINT32 [LABEL_OPTIONAL]
- 24: `color_mode` TYPE_UINT32 [LABEL_OPTIONAL]
- 25: `auto_switch_3a` TYPE_UINT32 [LABEL_OPTIONAL]
- 127: `recipe_schema_version` TYPE_UINT32 [LABEL_OPTIONAL]

## `fpv_keyframe.proto`
package `` · syntax `proto3`

### Message `Pb_KeyFrameData`
- 1: `frame_index` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `timestamp` TYPE_DOUBLE [LABEL_OPTIONAL]
- 3: `yaw` TYPE_DOUBLE [LABEL_OPTIONAL]
- 4: `pitch` TYPE_DOUBLE [LABEL_OPTIONAL]
- 5: `roll` TYPE_DOUBLE [LABEL_OPTIONAL]

### Message `Pb_KeyFrameResults`
- 1: `keyframe_datas` TYPE_MESSAGE (Pb_KeyFrameData) [LABEL_REPEATED]
- 2: `score` TYPE_DOUBLE [LABEL_OPTIONAL]
- 3: `iter` TYPE_INT32 [LABEL_OPTIONAL]

### Message `Pb_RepeatedKeyFrameResults`
- 1: `results` TYPE_MESSAGE (Pb_KeyFrameResults) [LABEL_REPEATED]

## `google/api/expr/v1alpha1/checked.proto`
package `google.api.expr.v1alpha1` · syntax `proto3`
deps: `google/api/expr/v1alpha1/syntax.proto`, `google/protobuf/empty.proto`, `google/protobuf/struct.proto`

### Message `CheckedExpr`
- 2: `reference_map` TYPE_MESSAGE (google.api.expr.v1alpha1.CheckedExpr.ReferenceMapEntry) [LABEL_REPEATED]
- 3: `type_map` TYPE_MESSAGE (google.api.expr.v1alpha1.CheckedExpr.TypeMapEntry) [LABEL_REPEATED]
- 5: `source_info` TYPE_MESSAGE (google.api.expr.v1alpha1.SourceInfo) [LABEL_OPTIONAL]
- 4: `expr` TYPE_MESSAGE (google.api.expr.v1alpha1.Expr) [LABEL_OPTIONAL]
- nested: ReferenceMapEntry, TypeMapEntry

### Message `Type`
- 1: `dyn` TYPE_MESSAGE (google.protobuf.Empty) [LABEL_OPTIONAL]
- 2: `null` TYPE_ENUM (google.protobuf.NullValue) [LABEL_OPTIONAL]
- 3: `primitive` TYPE_ENUM (google.api.expr.v1alpha1.Type.PrimitiveType) [LABEL_OPTIONAL]
- 4: `wrapper` TYPE_ENUM (google.api.expr.v1alpha1.Type.PrimitiveType) [LABEL_OPTIONAL]
- 5: `well_known` TYPE_ENUM (google.api.expr.v1alpha1.Type.WellKnownType) [LABEL_OPTIONAL]
- 6: `list_type` TYPE_MESSAGE (google.api.expr.v1alpha1.Type.ListType) [LABEL_OPTIONAL]
- 7: `map_type` TYPE_MESSAGE (google.api.expr.v1alpha1.Type.MapType) [LABEL_OPTIONAL]
- 8: `function` TYPE_MESSAGE (google.api.expr.v1alpha1.Type.FunctionType) [LABEL_OPTIONAL]
- 9: `message_type` TYPE_STRING [LABEL_OPTIONAL]
- 10: `type_param` TYPE_STRING [LABEL_OPTIONAL]
- 11: `type` TYPE_MESSAGE (google.api.expr.v1alpha1.Type) [LABEL_OPTIONAL]
- 12: `error` TYPE_MESSAGE (google.protobuf.Empty) [LABEL_OPTIONAL]
- 14: `abstract_type` TYPE_MESSAGE (google.api.expr.v1alpha1.Type.AbstractType) [LABEL_OPTIONAL]
- nested: ListType, MapType, FunctionType, AbstractType

### Message `Decl`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `ident` TYPE_MESSAGE (google.api.expr.v1alpha1.Decl.IdentDecl) [LABEL_OPTIONAL]
- 3: `function` TYPE_MESSAGE (google.api.expr.v1alpha1.Decl.FunctionDecl) [LABEL_OPTIONAL]
- nested: IdentDecl, FunctionDecl

### Message `Reference`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 3: `overload_id` TYPE_STRING [LABEL_REPEATED]
- 4: `value` TYPE_MESSAGE (google.api.expr.v1alpha1.Constant) [LABEL_OPTIONAL]

## `google/api/expr/v1alpha1/syntax.proto`
package `google.api.expr.v1alpha1` · syntax `proto3`
deps: `google/protobuf/duration.proto`, `google/protobuf/struct.proto`, `google/protobuf/timestamp.proto`

### Message `ParsedExpr`
- 2: `expr` TYPE_MESSAGE (google.api.expr.v1alpha1.Expr) [LABEL_OPTIONAL]
- 3: `source_info` TYPE_MESSAGE (google.api.expr.v1alpha1.SourceInfo) [LABEL_OPTIONAL]

### Message `Expr`
- 2: `id` TYPE_INT64 [LABEL_OPTIONAL]
- 3: `const_expr` TYPE_MESSAGE (google.api.expr.v1alpha1.Constant) [LABEL_OPTIONAL]
- 4: `ident_expr` TYPE_MESSAGE (google.api.expr.v1alpha1.Expr.Ident) [LABEL_OPTIONAL]
- 5: `select_expr` TYPE_MESSAGE (google.api.expr.v1alpha1.Expr.Select) [LABEL_OPTIONAL]
- 6: `call_expr` TYPE_MESSAGE (google.api.expr.v1alpha1.Expr.Call) [LABEL_OPTIONAL]
- 7: `list_expr` TYPE_MESSAGE (google.api.expr.v1alpha1.Expr.CreateList) [LABEL_OPTIONAL]
- 8: `struct_expr` TYPE_MESSAGE (google.api.expr.v1alpha1.Expr.CreateStruct) [LABEL_OPTIONAL]
- 9: `comprehension_expr` TYPE_MESSAGE (google.api.expr.v1alpha1.Expr.Comprehension) [LABEL_OPTIONAL]
- nested: Ident, Select, Call, CreateList, CreateStruct, Comprehension

### Message `Constant`
- 1: `null_value` TYPE_ENUM (google.protobuf.NullValue) [LABEL_OPTIONAL]
- 2: `bool_value` TYPE_BOOL [LABEL_OPTIONAL]
- 3: `int64_value` TYPE_INT64 [LABEL_OPTIONAL]
- 4: `uint64_value` TYPE_UINT64 [LABEL_OPTIONAL]
- 5: `double_value` TYPE_DOUBLE [LABEL_OPTIONAL]
- 6: `string_value` TYPE_STRING [LABEL_OPTIONAL]
- 7: `bytes_value` TYPE_BYTES [LABEL_OPTIONAL]
- 8: `duration_value` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 9: `timestamp_value` TYPE_MESSAGE (google.protobuf.Timestamp) [LABEL_OPTIONAL]

### Message `SourceInfo`
- 1: `syntax_version` TYPE_STRING [LABEL_OPTIONAL]
- 2: `location` TYPE_STRING [LABEL_OPTIONAL]
- 3: `line_offsets` TYPE_INT32 [LABEL_REPEATED]
- 4: `positions` TYPE_MESSAGE (google.api.expr.v1alpha1.SourceInfo.PositionsEntry) [LABEL_REPEATED]
- 5: `macro_calls` TYPE_MESSAGE (google.api.expr.v1alpha1.SourceInfo.MacroCallsEntry) [LABEL_REPEATED]
- nested: PositionsEntry, MacroCallsEntry

### Message `SourcePosition`
- 1: `location` TYPE_STRING [LABEL_OPTIONAL]
- 2: `offset` TYPE_INT32 [LABEL_OPTIONAL]
- 3: `line` TYPE_INT32 [LABEL_OPTIONAL]
- 4: `column` TYPE_INT32 [LABEL_OPTIONAL]

## `google/protobuf/any.proto`
package `google.protobuf` · syntax `proto3`

### Message `Any`
- 1: `type_url` TYPE_STRING [LABEL_OPTIONAL]
- 2: `value` TYPE_BYTES [LABEL_OPTIONAL]

## `google/protobuf/descriptor.proto`
package `google.protobuf` · syntax `proto2`

### Message `FileDescriptorSet`
- 1: `file` TYPE_MESSAGE (google.protobuf.FileDescriptorProto) [LABEL_REPEATED]

### Message `FileDescriptorProto`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `package` TYPE_STRING [LABEL_OPTIONAL]
- 3: `dependency` TYPE_STRING [LABEL_REPEATED]
- 10: `public_dependency` TYPE_INT32 [LABEL_REPEATED]
- 11: `weak_dependency` TYPE_INT32 [LABEL_REPEATED]
- 4: `message_type` TYPE_MESSAGE (google.protobuf.DescriptorProto) [LABEL_REPEATED]
- 5: `enum_type` TYPE_MESSAGE (google.protobuf.EnumDescriptorProto) [LABEL_REPEATED]
- 6: `service` TYPE_MESSAGE (google.protobuf.ServiceDescriptorProto) [LABEL_REPEATED]
- 7: `extension` TYPE_MESSAGE (google.protobuf.FieldDescriptorProto) [LABEL_REPEATED]
- 8: `options` TYPE_MESSAGE (google.protobuf.FileOptions) [LABEL_OPTIONAL]
- 9: `source_code_info` TYPE_MESSAGE (google.protobuf.SourceCodeInfo) [LABEL_OPTIONAL]
- 12: `syntax` TYPE_STRING [LABEL_OPTIONAL]
- 14: `edition` TYPE_ENUM (google.protobuf.Edition) [LABEL_OPTIONAL]

### Message `DescriptorProto`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `field` TYPE_MESSAGE (google.protobuf.FieldDescriptorProto) [LABEL_REPEATED]
- 6: `extension` TYPE_MESSAGE (google.protobuf.FieldDescriptorProto) [LABEL_REPEATED]
- 3: `nested_type` TYPE_MESSAGE (google.protobuf.DescriptorProto) [LABEL_REPEATED]
- 4: `enum_type` TYPE_MESSAGE (google.protobuf.EnumDescriptorProto) [LABEL_REPEATED]
- 5: `extension_range` TYPE_MESSAGE (google.protobuf.DescriptorProto.ExtensionRange) [LABEL_REPEATED]
- 8: `oneof_decl` TYPE_MESSAGE (google.protobuf.OneofDescriptorProto) [LABEL_REPEATED]
- 7: `options` TYPE_MESSAGE (google.protobuf.MessageOptions) [LABEL_OPTIONAL]
- 9: `reserved_range` TYPE_MESSAGE (google.protobuf.DescriptorProto.ReservedRange) [LABEL_REPEATED]
- 10: `reserved_name` TYPE_STRING [LABEL_REPEATED]
- nested: ExtensionRange, ReservedRange

### Message `ExtensionRangeOptions`
- 999: `uninterpreted_option` TYPE_MESSAGE (google.protobuf.UninterpretedOption) [LABEL_REPEATED]
- 2: `declaration` TYPE_MESSAGE (google.protobuf.ExtensionRangeOptions.Declaration) [LABEL_REPEATED]
- 50: `features` TYPE_MESSAGE (google.protobuf.FeatureSet) [LABEL_OPTIONAL]
- 3: `verification` TYPE_ENUM (google.protobuf.ExtensionRangeOptions.VerificationState) [LABEL_OPTIONAL]
- nested: Declaration

### Message `FieldDescriptorProto`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 3: `number` TYPE_INT32 [LABEL_OPTIONAL]
- 4: `label` TYPE_ENUM (google.protobuf.FieldDescriptorProto.Label) [LABEL_OPTIONAL]
- 5: `type` TYPE_ENUM (google.protobuf.FieldDescriptorProto.Type) [LABEL_OPTIONAL]
- 6: `type_name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `extendee` TYPE_STRING [LABEL_OPTIONAL]
- 7: `default_value` TYPE_STRING [LABEL_OPTIONAL]
- 9: `oneof_index` TYPE_INT32 [LABEL_OPTIONAL]
- 10: `json_name` TYPE_STRING [LABEL_OPTIONAL]
- 8: `options` TYPE_MESSAGE (google.protobuf.FieldOptions) [LABEL_OPTIONAL]
- 17: `proto3_optional` TYPE_BOOL [LABEL_OPTIONAL]

### Message `OneofDescriptorProto`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `options` TYPE_MESSAGE (google.protobuf.OneofOptions) [LABEL_OPTIONAL]

### Message `EnumDescriptorProto`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `value` TYPE_MESSAGE (google.protobuf.EnumValueDescriptorProto) [LABEL_REPEATED]
- 3: `options` TYPE_MESSAGE (google.protobuf.EnumOptions) [LABEL_OPTIONAL]
- 4: `reserved_range` TYPE_MESSAGE (google.protobuf.EnumDescriptorProto.EnumReservedRange) [LABEL_REPEATED]
- 5: `reserved_name` TYPE_STRING [LABEL_REPEATED]
- nested: EnumReservedRange

### Message `EnumValueDescriptorProto`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `number` TYPE_INT32 [LABEL_OPTIONAL]
- 3: `options` TYPE_MESSAGE (google.protobuf.EnumValueOptions) [LABEL_OPTIONAL]

### Message `ServiceDescriptorProto`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `method` TYPE_MESSAGE (google.protobuf.MethodDescriptorProto) [LABEL_REPEATED]
- 3: `options` TYPE_MESSAGE (google.protobuf.ServiceOptions) [LABEL_OPTIONAL]

### Message `MethodDescriptorProto`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `input_type` TYPE_STRING [LABEL_OPTIONAL]
- 3: `output_type` TYPE_STRING [LABEL_OPTIONAL]
- 4: `options` TYPE_MESSAGE (google.protobuf.MethodOptions) [LABEL_OPTIONAL]
- 5: `client_streaming` TYPE_BOOL [LABEL_OPTIONAL]
- 6: `server_streaming` TYPE_BOOL [LABEL_OPTIONAL]

### Message `FileOptions`
- 1: `java_package` TYPE_STRING [LABEL_OPTIONAL]
- 8: `java_outer_classname` TYPE_STRING [LABEL_OPTIONAL]
- 10: `java_multiple_files` TYPE_BOOL [LABEL_OPTIONAL]
- 20: `java_generate_equals_and_hash` TYPE_BOOL [LABEL_OPTIONAL]
- 27: `java_string_check_utf8` TYPE_BOOL [LABEL_OPTIONAL]
- 9: `optimize_for` TYPE_ENUM (google.protobuf.FileOptions.OptimizeMode) [LABEL_OPTIONAL]
- 11: `go_package` TYPE_STRING [LABEL_OPTIONAL]
- 16: `cc_generic_services` TYPE_BOOL [LABEL_OPTIONAL]
- 17: `java_generic_services` TYPE_BOOL [LABEL_OPTIONAL]
- 18: `py_generic_services` TYPE_BOOL [LABEL_OPTIONAL]
- 42: `php_generic_services` TYPE_BOOL [LABEL_OPTIONAL]
- 23: `deprecated` TYPE_BOOL [LABEL_OPTIONAL]
- 31: `cc_enable_arenas` TYPE_BOOL [LABEL_OPTIONAL]
- 36: `objc_class_prefix` TYPE_STRING [LABEL_OPTIONAL]
- 37: `csharp_namespace` TYPE_STRING [LABEL_OPTIONAL]
- 39: `swift_prefix` TYPE_STRING [LABEL_OPTIONAL]
- 40: `php_class_prefix` TYPE_STRING [LABEL_OPTIONAL]
- 41: `php_namespace` TYPE_STRING [LABEL_OPTIONAL]
- 44: `php_metadata_namespace` TYPE_STRING [LABEL_OPTIONAL]
- 45: `ruby_package` TYPE_STRING [LABEL_OPTIONAL]
- 50: `features` TYPE_MESSAGE (google.protobuf.FeatureSet) [LABEL_OPTIONAL]
- 999: `uninterpreted_option` TYPE_MESSAGE (google.protobuf.UninterpretedOption) [LABEL_REPEATED]

### Message `MessageOptions`
- 1: `message_set_wire_format` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `no_standard_descriptor_accessor` TYPE_BOOL [LABEL_OPTIONAL]
- 3: `deprecated` TYPE_BOOL [LABEL_OPTIONAL]
- 7: `map_entry` TYPE_BOOL [LABEL_OPTIONAL]
- 11: `deprecated_legacy_json_field_conflicts` TYPE_BOOL [LABEL_OPTIONAL]
- 12: `features` TYPE_MESSAGE (google.protobuf.FeatureSet) [LABEL_OPTIONAL]
- 999: `uninterpreted_option` TYPE_MESSAGE (google.protobuf.UninterpretedOption) [LABEL_REPEATED]

### Message `FieldOptions`
- 1: `ctype` TYPE_ENUM (google.protobuf.FieldOptions.CType) [LABEL_OPTIONAL]
- 2: `packed` TYPE_BOOL [LABEL_OPTIONAL]
- 6: `jstype` TYPE_ENUM (google.protobuf.FieldOptions.JSType) [LABEL_OPTIONAL]
- 5: `lazy` TYPE_BOOL [LABEL_OPTIONAL]
- 15: `unverified_lazy` TYPE_BOOL [LABEL_OPTIONAL]
- 3: `deprecated` TYPE_BOOL [LABEL_OPTIONAL]
- 10: `weak` TYPE_BOOL [LABEL_OPTIONAL]
- 16: `debug_redact` TYPE_BOOL [LABEL_OPTIONAL]
- 17: `retention` TYPE_ENUM (google.protobuf.FieldOptions.OptionRetention) [LABEL_OPTIONAL]
- 19: `targets` TYPE_ENUM (google.protobuf.FieldOptions.OptionTargetType) [LABEL_REPEATED]
- 20: `edition_defaults` TYPE_MESSAGE (google.protobuf.FieldOptions.EditionDefault) [LABEL_REPEATED]
- 21: `features` TYPE_MESSAGE (google.protobuf.FeatureSet) [LABEL_OPTIONAL]
- 999: `uninterpreted_option` TYPE_MESSAGE (google.protobuf.UninterpretedOption) [LABEL_REPEATED]
- nested: EditionDefault

### Message `OneofOptions`
- 1: `features` TYPE_MESSAGE (google.protobuf.FeatureSet) [LABEL_OPTIONAL]
- 999: `uninterpreted_option` TYPE_MESSAGE (google.protobuf.UninterpretedOption) [LABEL_REPEATED]

### Message `EnumOptions`
- 2: `allow_alias` TYPE_BOOL [LABEL_OPTIONAL]
- 3: `deprecated` TYPE_BOOL [LABEL_OPTIONAL]
- 6: `deprecated_legacy_json_field_conflicts` TYPE_BOOL [LABEL_OPTIONAL]
- 7: `features` TYPE_MESSAGE (google.protobuf.FeatureSet) [LABEL_OPTIONAL]
- 999: `uninterpreted_option` TYPE_MESSAGE (google.protobuf.UninterpretedOption) [LABEL_REPEATED]

### Message `EnumValueOptions`
- 1: `deprecated` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `features` TYPE_MESSAGE (google.protobuf.FeatureSet) [LABEL_OPTIONAL]
- 3: `debug_redact` TYPE_BOOL [LABEL_OPTIONAL]
- 999: `uninterpreted_option` TYPE_MESSAGE (google.protobuf.UninterpretedOption) [LABEL_REPEATED]

### Message `ServiceOptions`
- 34: `features` TYPE_MESSAGE (google.protobuf.FeatureSet) [LABEL_OPTIONAL]
- 33: `deprecated` TYPE_BOOL [LABEL_OPTIONAL]
- 999: `uninterpreted_option` TYPE_MESSAGE (google.protobuf.UninterpretedOption) [LABEL_REPEATED]

### Message `MethodOptions`
- 33: `deprecated` TYPE_BOOL [LABEL_OPTIONAL]
- 34: `idempotency_level` TYPE_ENUM (google.protobuf.MethodOptions.IdempotencyLevel) [LABEL_OPTIONAL]
- 35: `features` TYPE_MESSAGE (google.protobuf.FeatureSet) [LABEL_OPTIONAL]
- 999: `uninterpreted_option` TYPE_MESSAGE (google.protobuf.UninterpretedOption) [LABEL_REPEATED]

### Message `UninterpretedOption`
- 2: `name` TYPE_MESSAGE (google.protobuf.UninterpretedOption.NamePart) [LABEL_REPEATED]
- 3: `identifier_value` TYPE_STRING [LABEL_OPTIONAL]
- 4: `positive_int_value` TYPE_UINT64 [LABEL_OPTIONAL]
- 5: `negative_int_value` TYPE_INT64 [LABEL_OPTIONAL]
- 6: `double_value` TYPE_DOUBLE [LABEL_OPTIONAL]
- 7: `string_value` TYPE_BYTES [LABEL_OPTIONAL]
- 8: `aggregate_value` TYPE_STRING [LABEL_OPTIONAL]
- nested: NamePart

### Message `FeatureSet`
- 1: `field_presence` TYPE_ENUM (google.protobuf.FeatureSet.FieldPresence) [LABEL_OPTIONAL]
- 2: `enum_type` TYPE_ENUM (google.protobuf.FeatureSet.EnumType) [LABEL_OPTIONAL]
- 3: `repeated_field_encoding` TYPE_ENUM (google.protobuf.FeatureSet.RepeatedFieldEncoding) [LABEL_OPTIONAL]
- 4: `utf8_validation` TYPE_ENUM (google.protobuf.FeatureSet.Utf8Validation) [LABEL_OPTIONAL]
- 5: `message_encoding` TYPE_ENUM (google.protobuf.FeatureSet.MessageEncoding) [LABEL_OPTIONAL]
- 6: `json_format` TYPE_ENUM (google.protobuf.FeatureSet.JsonFormat) [LABEL_OPTIONAL]

### Message `FeatureSetDefaults`
- 1: `defaults` TYPE_MESSAGE (google.protobuf.FeatureSetDefaults.FeatureSetEditionDefault) [LABEL_REPEATED]
- 4: `minimum_edition` TYPE_ENUM (google.protobuf.Edition) [LABEL_OPTIONAL]
- 5: `maximum_edition` TYPE_ENUM (google.protobuf.Edition) [LABEL_OPTIONAL]
- nested: FeatureSetEditionDefault

### Message `SourceCodeInfo`
- 1: `location` TYPE_MESSAGE (google.protobuf.SourceCodeInfo.Location) [LABEL_REPEATED]
- nested: Location

### Message `GeneratedCodeInfo`
- 1: `annotation` TYPE_MESSAGE (google.protobuf.GeneratedCodeInfo.Annotation) [LABEL_REPEATED]
- nested: Annotation

### Enum `Edition`
- 0 = `EDITION_UNKNOWN`
- 998 = `EDITION_PROTO2`
- 999 = `EDITION_PROTO3`
- 1000 = `EDITION_2023`
- 1 = `EDITION_1_TEST_ONLY`
- 2 = `EDITION_2_TEST_ONLY`
- 99997 = `EDITION_99997_TEST_ONLY`
- 99998 = `EDITION_99998_TEST_ONLY`
- 99999 = `EDITION_99999_TEST_ONLY`

## `google/protobuf/duration.proto`
package `google.protobuf` · syntax `proto3`

### Message `Duration`
- 1: `seconds` TYPE_INT64 [LABEL_OPTIONAL]
- 2: `nanos` TYPE_INT32 [LABEL_OPTIONAL]

## `google/protobuf/empty.proto`
package `google.protobuf` · syntax `proto3`

### Message `Empty`

## `google/protobuf/source_context.proto`
package `google.protobuf` · syntax `proto3`

### Message `SourceContext`
- 1: `file_name` TYPE_STRING [LABEL_OPTIONAL]

## `google/protobuf/struct.proto`
package `google.protobuf` · syntax `proto3`

### Message `Struct`
- 1: `fields` TYPE_MESSAGE (google.protobuf.Struct.FieldsEntry) [LABEL_REPEATED]
- nested: FieldsEntry

### Message `Value`
- 1: `null_value` TYPE_ENUM (google.protobuf.NullValue) [LABEL_OPTIONAL]
- 2: `number_value` TYPE_DOUBLE [LABEL_OPTIONAL]
- 3: `string_value` TYPE_STRING [LABEL_OPTIONAL]
- 4: `bool_value` TYPE_BOOL [LABEL_OPTIONAL]
- 5: `struct_value` TYPE_MESSAGE (google.protobuf.Struct) [LABEL_OPTIONAL]
- 6: `list_value` TYPE_MESSAGE (google.protobuf.ListValue) [LABEL_OPTIONAL]

### Message `ListValue`
- 1: `values` TYPE_MESSAGE (google.protobuf.Value) [LABEL_REPEATED]

### Enum `NullValue`
- 0 = `NULL_VALUE`

## `google/protobuf/timestamp.proto`
package `google.protobuf` · syntax `proto3`

### Message `Timestamp`
- 1: `seconds` TYPE_INT64 [LABEL_OPTIONAL]
- 2: `nanos` TYPE_INT32 [LABEL_OPTIONAL]

## `google/protobuf/type.proto`
package `google.protobuf` · syntax `proto3`
deps: `google/protobuf/any.proto`, `google/protobuf/source_context.proto`

### Message `Type`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `fields` TYPE_MESSAGE (google.protobuf.Field) [LABEL_REPEATED]
- 3: `oneofs` TYPE_STRING [LABEL_REPEATED]
- 4: `options` TYPE_MESSAGE (google.protobuf.Option) [LABEL_REPEATED]
- 5: `source_context` TYPE_MESSAGE (google.protobuf.SourceContext) [LABEL_OPTIONAL]
- 6: `syntax` TYPE_ENUM (google.protobuf.Syntax) [LABEL_OPTIONAL]

### Message `Field`
- 1: `kind` TYPE_ENUM (google.protobuf.Field.Kind) [LABEL_OPTIONAL]
- 2: `cardinality` TYPE_ENUM (google.protobuf.Field.Cardinality) [LABEL_OPTIONAL]
- 3: `number` TYPE_INT32 [LABEL_OPTIONAL]
- 4: `name` TYPE_STRING [LABEL_OPTIONAL]
- 6: `type_url` TYPE_STRING [LABEL_OPTIONAL]
- 7: `oneof_index` TYPE_INT32 [LABEL_OPTIONAL]
- 8: `packed` TYPE_BOOL [LABEL_OPTIONAL]
- 9: `options` TYPE_MESSAGE (google.protobuf.Option) [LABEL_REPEATED]
- 10: `json_name` TYPE_STRING [LABEL_OPTIONAL]
- 11: `default_value` TYPE_STRING [LABEL_OPTIONAL]

### Message `Enum`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `enumvalue` TYPE_MESSAGE (google.protobuf.EnumValue) [LABEL_REPEATED]
- 3: `options` TYPE_MESSAGE (google.protobuf.Option) [LABEL_REPEATED]
- 4: `source_context` TYPE_MESSAGE (google.protobuf.SourceContext) [LABEL_OPTIONAL]
- 5: `syntax` TYPE_ENUM (google.protobuf.Syntax) [LABEL_OPTIONAL]

### Message `EnumValue`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `number` TYPE_INT32 [LABEL_OPTIONAL]
- 3: `options` TYPE_MESSAGE (google.protobuf.Option) [LABEL_REPEATED]

### Message `Option`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `value` TYPE_MESSAGE (google.protobuf.Any) [LABEL_OPTIONAL]

### Enum `Syntax`
- 0 = `SYNTAX_PROTO2`
- 1 = `SYNTAX_PROTO3`

## `google/protobuf/wrappers.proto`
package `google.protobuf` · syntax `proto3`

### Message `DoubleValue`
- 1: `value` TYPE_DOUBLE [LABEL_OPTIONAL]

### Message `FloatValue`
- 1: `value` TYPE_FLOAT [LABEL_OPTIONAL]

### Message `Int64Value`
- 1: `value` TYPE_INT64 [LABEL_OPTIONAL]

### Message `UInt64Value`
- 1: `value` TYPE_UINT64 [LABEL_OPTIONAL]

### Message `Int32Value`
- 1: `value` TYPE_INT32 [LABEL_OPTIONAL]

### Message `UInt32Value`
- 1: `value` TYPE_UINT32 [LABEL_OPTIONAL]

### Message `BoolValue`
- 1: `value` TYPE_BOOL [LABEL_OPTIONAL]

### Message `StringValue`
- 1: `value` TYPE_STRING [LABEL_OPTIONAL]

### Message `BytesValue`
- 1: `value` TYPE_BYTES [LABEL_OPTIONAL]

## `google/rpc/status.proto`
package `google.rpc` · syntax `proto3`
deps: `google/protobuf/any.proto`

### Message `Status`
- 1: `code` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `message` TYPE_STRING [LABEL_OPTIONAL]
- 3: `details` TYPE_MESSAGE (google.protobuf.Any) [LABEL_REPEATED]

## `ins_cloud_export_dashboard.proto`
package `insta360.cloud.message` · syntax `proto3`
deps: `google/protobuf/wrappers.proto`

### Message `DashboardUrlParam`
- 1: `type` TYPE_STRING [LABEL_OPTIONAL]
- 2: `items` TYPE_STRING [LABEL_OPTIONAL]
- 3: `watermark` TYPE_BOOL [LABEL_OPTIONAL]
- 4: `language` TYPE_STRING [LABEL_OPTIONAL]

### Message `DashboardRefreshDataParam`
- 1: `energyConsumption` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 2: `powerInWatts` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 3: `speed` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 4: `slope` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 5: `distance` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 6: `elevation` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 7: `acceleration` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 8: `pace` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 9: `steps` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 10: `heartRate` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 11: `cadence` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 12: `bendingAngle` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 13: `dateTime` TYPE_MESSAGE (google.protobuf.Int64Value) [LABEL_OPTIONAL]
- 14: `dateTimeZone` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 15: `drivingPathIndex` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 16: `accelerator` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 17: `brake` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 18: `engineSpeed` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 19: `gear` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 20: `longitude` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 21: `longitude_text` TYPE_MESSAGE (google.protobuf.StringValue) [LABEL_OPTIONAL]
- 22: `latitude` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 23: `latitude_text` TYPE_MESSAGE (google.protobuf.StringValue) [LABEL_OPTIONAL]
- 24: `vehicle_type` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 25: `altitude` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 26: `direction` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 27: `gpsTime` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 28: `isInHasGpsDataSection` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 29: `verticalSpeed` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 30: `vehicleTypeStr` TYPE_MESSAGE (google.protobuf.StringValue) [LABEL_OPTIONAL]
- 31: `diveProfileIndex` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 32: `depth` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 33: `duration` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 34: `temperature` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 35: `pressure` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 36: `logo` TYPE_MESSAGE (google.protobuf.StringValue) [LABEL_OPTIONAL]
- 37: `frameType` TYPE_MESSAGE (google.protobuf.StringValue) [LABEL_OPTIONAL]
- 38: `bendingAngleDouble` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 39: `fishingDuration` TYPE_MESSAGE (google.protobuf.Int64Value) [LABEL_OPTIONAL]
- 40: `lineLength` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 41: `wireSpeed` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 42: `manualStrength` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 43: `machineStrength` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 44: `fishingControlMode` TYPE_MESSAGE (google.protobuf.StringValue) [LABEL_OPTIONAL]
- 45: `offsetX` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 46: `offsetY` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 47: `offsetZ` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 48: `eulerRotationX` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 49: `eulerRotationY` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 50: `highSpeedMode` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 51: `currentFrame` TYPE_MESSAGE (google.protobuf.StringValue) [LABEL_OPTIONAL]
- 100: `acceleratorMax` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 101: `energyConsumptionMax` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 102: `speedMax` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 103: `elevationMax` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 104: `bendingAngleMax` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 105: `cadenceMax` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 106: `heartRateMax` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 107: `stepsMax` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 108: `paceMax` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 109: `accelerationMax` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 110: `distanceMax` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 111: `slopeMax` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 112: `powerInWattsMax` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 113: `verticalSpeedMax` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 114: `depthMax` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 115: `durationMax` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 116: `temperatureMax` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 117: `pressureMax` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 118: `engineSpeedMax` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 119: `lineLengthMax` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 120: `wireSpeedMax` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 121: `manualStrengthMax` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 122: `machineStrengthMax` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]

### Message `DashboardRefreshData`
- 1: `timestamp` TYPE_DOUBLE [LABEL_OPTIONAL]
- 2: `data` TYPE_STRING [LABEL_OPTIONAL]
- 3: `keydata` TYPE_MESSAGE (insta360.cloud.message.DashboardRefreshDataParam) [LABEL_OPTIONAL]

### Message `DashboardInfo`
- 1: `urlParam` TYPE_MESSAGE (insta360.cloud.message.DashboardUrlParam) [LABEL_OPTIONAL]
- 2: `location` TYPE_STRING [LABEL_OPTIONAL]
- 3: `updateConfig` TYPE_STRING [LABEL_OPTIONAL]
- 4: `refreshData` TYPE_MESSAGE (insta360.cloud.message.DashboardRefreshData) [LABEL_REPEATED]
- 5: `source` TYPE_ENUM (insta360.cloud.message.DashBoardDataSource) [LABEL_OPTIONAL]
- 6: `clipindex` TYPE_INT32 [LABEL_OPTIONAL]
- 7: `passThroughUrlParam` TYPE_MESSAGE (google.protobuf.StringValue) [LABEL_OPTIONAL]
- 8: `diveProfile` TYPE_MESSAGE (google.protobuf.StringValue) [LABEL_OPTIONAL]
- 9: `initChatData` TYPE_MESSAGE (google.protobuf.StringValue) [LABEL_OPTIONAL]
- 10: `initData` TYPE_MESSAGE (google.protobuf.StringValue) [LABEL_OPTIONAL]
- 11: `initPccFishingPower` TYPE_MESSAGE (google.protobuf.StringValue) [LABEL_OPTIONAL]

### Enum `ItemIndex`
- 0 = `kWorkout`
- 10 = `kDistance`
- 11 = `kSteps`
- 20 = `kEnergyConsumption`
- 21 = `kPowerInWatts`
- 30 = `kRoute`
- 40 = `kHeartRate`
- 50 = `kPace`
- 51 = `kSpeed`
- 52 = `kAcceleration`
- 53 = `kGear`
- 54 = `kAccelerator`
- 55 = `kBrake`
- 60 = `kElevation`
- 61 = `kSlope`
- 62 = `kDirection`
- 70 = `kCadence`
- 80 = `kDateTime`
- 90 = `kBendingAngle`
- 91 = `kGravity`
- 100 = `kModelCode`

### Enum `DashBoardDataSource`
- 0 = `kNaitve`
- 1 = `kGarmin`
- 2 = `kTbox`
- 3 = `kAppleHealth`
- 4 = `kIGPSport`
- 5 = `kGaoChi`
- 6 = `kInsGPS`
- 7 = `kGpsTrack`
- 8 = `kWahoo`
- 9 = `kHuawei`
- 10 = `kStrava`
- 11 = `kMagene`
- 12 = `kCfMoto`
- 13 = `kSuunto`
- 14 = `kPiscisea`

## `ins_cloud_export_data.proto`
package `insta360.cloud.message` · syntax `proto3`
deps: `ins_cloud_export_filter.proto`, `ins_player_edit_data.proto`, `ins_export_information.proto`, `ins_cloud_special_effect.proto`, `google/protobuf/wrappers.proto`

### Message `CutsceneInfo`
- 1: `startTimeMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 2: `durationMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 3: `cutsceneType` TYPE_ENUM (insta360.cloud.message.CutsceneType) [LABEL_OPTIONAL]
- 4: `uuid` TYPE_STRING [LABEL_OPTIONAL]

### Message `ExporterTimeScale`
- 1: `factor` TYPE_DOUBLE [LABEL_OPTIONAL]
- 2: `startTimeMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 3: `endTimeMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 4: `clipCutsceneDurationMediaMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 5: `motionBlurNum` TYPE_INT32 [LABEL_OPTIONAL]
- 6: `repeatToFps` TYPE_DOUBLE [LABEL_OPTIONAL]
- 7: `videoKeyframeOnly` TYPE_BOOL [LABEL_OPTIONAL]
- 8: `scaleType` TYPE_ENUM (insta360.cloud.message.ExporterTimeScaleType) [LABEL_OPTIONAL]
- 9: `beginFactor` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 10: `endFactor` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]

### Message `CaptureBeautyInfo`
- 1: `skinCareStrength` TYPE_FLOAT [LABEL_OPTIONAL]
- 2: `blemishRemovalStrength` TYPE_FLOAT [LABEL_OPTIONAL]

### Message `SourceFileClipsInfo`
- 1: `clipindex` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `startTimeMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 3: `endTimeMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 4: `endCutDurationMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 5: `videoSilent` TYPE_BOOL [LABEL_OPTIONAL]
- 6: `useFrameCount` TYPE_DOUBLE [LABEL_OPTIONAL]
- 7: `audioVolume` TYPE_DOUBLE [LABEL_OPTIONAL]
- 8: `clipAudioMode` TYPE_ENUM (insta360.cloud.message.ClipAudioMode) [LABEL_OPTIONAL]
- 9: `exporterTimeScales` TYPE_MESSAGE (insta360.cloud.message.ExporterTimeScale) [LABEL_REPEATED]
- 10: `enableAudioDenoise` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 11: `audioDenoiseBgmWeight` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 12: `audioDenoiseVoiceWeight` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 13: `cutsceneInfo` TYPE_MESSAGE (insta360.cloud.message.CutsceneInfo) [LABEL_OPTIONAL]
- 14: `videoDurationMs` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 15: `audioTrackCount` TYPE_INT32 [LABEL_OPTIONAL]
- 16: `firstAudioMixWeight` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 17: `firstAudioTrackDelay` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 18: `isAmbisonicOn` TYPE_BOOL [LABEL_OPTIONAL]
- 19: `audioAmbisonicNum` TYPE_INT32 [LABEL_OPTIONAL]
- 20: `enableAiDenoiseWind` TYPE_BOOL [LABEL_OPTIONAL]
- 21: `enableVoiceEnhance` TYPE_BOOL [LABEL_OPTIONAL]
- 22: `enableAEFilter` TYPE_BOOL [LABEL_OPTIONAL]
- 23: `enablePostSharpenFilter` TYPE_BOOL [LABEL_OPTIONAL]
- 24: `originAudioAfadeInMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 25: `originAudioAfadeOutMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 26: `enableCaptureBeautyMode` TYPE_BOOL [LABEL_OPTIONAL]
- 27: `captureBeautyInfo` TYPE_MESSAGE (insta360.cloud.message.CaptureBeautyInfo) [LABEL_OPTIONAL]

### Message `SourceImageClipsInfo`
- 1: `clipindex` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `resouceid` TYPE_STRING [LABEL_OPTIONAL]
- 3: `durationMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 4: `endCutDurationMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 5: `useFrameCount` TYPE_INT32 [LABEL_OPTIONAL]

### Message `SourceAudioEffectClipInfo`
- 1: `resouceid` TYPE_STRING [LABEL_OPTIONAL]
- 2: `positionInMediaTimeMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 3: `startSrcTimeMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 4: `endSrcTimeMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 5: `totalSrcDurationMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 6: `volume` TYPE_DOUBLE [LABEL_OPTIONAL]
- 7: `afadeInDurationMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 8: `afadeOutDurationMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 9: `weight` TYPE_DOUBLE [LABEL_OPTIONAL]

### Message `SourceBGMClipsInfo`
- 1: `resouceid` TYPE_STRING [LABEL_OPTIONAL]
- 2: `positionInMediaTimeMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 3: `startSrcTimeMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 4: `endSrcTimeMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 5: `totalSrcDurationMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 6: `volume` TYPE_DOUBLE [LABEL_OPTIONAL]
- 7: `afadeInDurationMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 8: `afadeOutDurationMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 9: `loop` TYPE_BOOL [LABEL_OPTIONAL]

### Message `HorizontalCorrectorInfo`
- 1: `srcWidth` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `srcHeight` TYPE_INT32 [LABEL_OPTIONAL]
- 3: `maxCorrectAngle` TYPE_FLOAT [LABEL_OPTIONAL]
- 4: `dstAspectRatio` TYPE_FLOAT [LABEL_OPTIONAL]
- 5: `rollAngle` TYPE_DOUBLE [LABEL_OPTIONAL]
- 6: `scaleRate` TYPE_DOUBLE [LABEL_OPTIONAL]

### Message `ClipRenderInfo`
- 1: `clipindex` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `stabType` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 3: `renderModelType` TYPE_ENUM (insta360.cloud.message.RenderModelType) [LABEL_OPTIONAL]
- 4: `autoFovRange` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 5: `useMianOrientationWhileStabOff` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 6: `offset` TYPE_MESSAGE (google.protobuf.StringValue) [LABEL_OPTIONAL]
- 7: `useGravityCalib` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 8: `povMode` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 9: `userRotationDegree` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 10: `horizontalCorrectorInfo` TYPE_MESSAGE (insta360.cloud.message.HorizontalCorrectorInfo) [LABEL_OPTIONAL]
- 11: `contentMode` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 12: `cameraFacing` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 13: `stabProjectType` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 14: `stabBoundaryRedundancyRate` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 15: `relativeHorizonThreshold` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]

### Message `ClipDefaultViewData`
- 1: `clipindex` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `defaultViewData` TYPE_MESSAGE (insta360.cloud.message.ViewData) [LABEL_OPTIONAL]
- 3: `defaultAspect` TYPE_MESSAGE (insta360.cloud.message.AspectRatio) [LABEL_OPTIONAL]

### Message `MultiViewInfo`
- 1: `mainView` TYPE_MESSAGE (insta360.cloud.message.MultiViewInfo.RectInfo) [LABEL_OPTIONAL]
- 2: `subView` TYPE_MESSAGE (insta360.cloud.message.MultiViewInfo.RectInfo) [LABEL_OPTIONAL]
- 3: `startTimeMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 4: `endTimeMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 5: `subViewData` TYPE_MESSAGE (insta360.cloud.message.ViewData) [LABEL_REPEATED]
- 6: `smoothWinLen` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 7: `subViewInfo` TYPE_MESSAGE (insta360.cloud.message.MultiViewInfo.SubViewInfo) [LABEL_REPEATED]
- 8: `mode` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 9: `radiusRatio` TYPE_FLOAT [LABEL_REPEATED]
- 10: `featherRatio` TYPE_DOUBLE [LABEL_OPTIONAL]
- nested: RectInfo, SubViewInfo

### Message `MultiViewData`
- 1: `clipIndex` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `multiViewInfo` TYPE_MESSAGE (insta360.cloud.message.MultiViewInfo) [LABEL_REPEATED]
- 3: `defaultSubView` TYPE_MESSAGE (insta360.cloud.message.ViewData) [LABEL_OPTIONAL]

### Message `BigBoomInfo`
- 1: `clipIndex` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `jsonfilm` TYPE_STRING [LABEL_OPTIONAL]
- 3: `jsonadj` TYPE_STRING [LABEL_OPTIONAL]

### Message `ShareExtraInfo`
- 1: `viewData` TYPE_STRING [LABEL_OPTIONAL]

### Message `BaseSegment`
- 1: `clipDefaultViewData` TYPE_MESSAGE (insta360.cloud.message.ClipDefaultViewData) [LABEL_REPEATED]
- 2: `projectSegment` TYPE_MESSAGE (insta360.cloud.message.ProjectSegment) [LABEL_REPEATED]
- 3: `clipRenderInfo` TYPE_MESSAGE (insta360.cloud.message.ClipRenderInfo) [LABEL_REPEATED]
- 4: `filterInfoList` TYPE_MESSAGE (insta360.cloud.message.FilterInfoList) [LABEL_REPEATED]
- 5: `multiViewData` TYPE_MESSAGE (insta360.cloud.message.MultiViewData) [LABEL_REPEATED]
- 6: `bigboominfo` TYPE_MESSAGE (insta360.cloud.message.BigBoomInfo) [LABEL_REPEATED]
- 7: `forceSrcAnimationClips` TYPE_BOOL [LABEL_REPEATED]
- 8: `clipProjectiveInfo` TYPE_MESSAGE (insta360.cloud.message.ClipProjectiveInfo) [LABEL_REPEATED]
- 9: `shareExtraInfo` TYPE_MESSAGE (insta360.cloud.message.ShareExtraInfo) [LABEL_OPTIONAL]
- 10: `clipProjectiveInfoV2` TYPE_MESSAGE (insta360.cloud.message.ClipProjectiveInfoV2) [LABEL_REPEATED]

### Message `SourceBGMConfig`
- 1: `bgmclipsinfo` TYPE_MESSAGE (insta360.cloud.message.SourceBGMClipsInfo) [LABEL_REPEATED]
- 2: `bgmWeight` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]

### Message `ProjectiveReqParam`
- 1: `type` TYPE_ENUM (insta360.cloud.message.ProjectionType) [LABEL_OPTIONAL]
- 2: `useCustomParam` TYPE_BOOL [LABEL_OPTIONAL]
- 3: `startXFovDeg` TYPE_FLOAT [LABEL_OPTIONAL]
- 4: `startDistance` TYPE_FLOAT [LABEL_OPTIONAL]
- 5: `endXFovDeg` TYPE_FLOAT [LABEL_OPTIONAL]
- 6: `endDistance` TYPE_FLOAT [LABEL_OPTIONAL]

### Message `ClipProjectiveInfo`
- 1: `clipindex` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `param` TYPE_MESSAGE (insta360.cloud.message.ProjectiveReqParam) [LABEL_OPTIONAL]

### Message `EyePointInfo`
- 1: `fov` TYPE_FLOAT [LABEL_OPTIONAL]
- 2: `distance` TYPE_FLOAT [LABEL_OPTIONAL]
- 3: `ratio` TYPE_FLOAT [LABEL_OPTIONAL]
- 4: `modelAlpha` TYPE_FLOAT [LABEL_OPTIONAL]

### Message `EyePointfovType`
- 1: `type` TYPE_INT32 [LABEL_OPTIONAL]

### Message `ProjectiveReqParamV2`
- 1: `useInterpCurve` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `aspect` TYPE_FLOAT [LABEL_OPTIONAL]
- 3: `startRealYFovDegree` TYPE_DOUBLE [LABEL_OPTIONAL]
- 4: `endRealYFovDegree` TYPE_DOUBLE [LABEL_OPTIONAL]
- 5: `eyePoints` TYPE_MESSAGE (insta360.cloud.message.EyePointInfo) [LABEL_REPEATED]
- 6: `isDewarp` TYPE_BOOL [LABEL_OPTIONAL]
- 7: `fovtype` TYPE_MESSAGE (insta360.cloud.message.EyePointfovType) [LABEL_OPTIONAL]

### Message `ClipProjectiveInfoV2`
- 1: `clipindex` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `param` TYPE_MESSAGE (insta360.cloud.message.ProjectiveReqParamV2) [LABEL_OPTIONAL]

### Message `TemplateInfo`
- 1: `templateId` TYPE_INT32 [LABEL_OPTIONAL]

### Message `CloudExportData`
- 1: `version` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `source` TYPE_ENUM (insta360.cloud.message.DataSource) [LABEL_OPTIONAL]
- 3: `projectName` TYPE_STRING [LABEL_OPTIONAL]
- 4: `exportinfo` TYPE_MESSAGE (insta360.cloud.message.ExportInformation) [LABEL_OPTIONAL]
- 5: `fileclipinfo` TYPE_MESSAGE (insta360.cloud.message.SourceFileClipsInfo) [LABEL_REPEATED]
- 6: `imageclipinfo` TYPE_MESSAGE (insta360.cloud.message.SourceImageClipsInfo) [LABEL_REPEATED]
- 7: `audioclipinfo` TYPE_MESSAGE (insta360.cloud.message.SourceAudioEffectClipInfo) [LABEL_REPEATED]
- 8: `bgmclipsconfig` TYPE_MESSAGE (insta360.cloud.message.SourceBGMConfig) [LABEL_OPTIONAL]
- 9: `baseSegment` TYPE_MESSAGE (insta360.cloud.message.BaseSegment) [LABEL_OPTIONAL]
- 10: `specialEffectList` TYPE_MESSAGE (insta360.cloud.message.SpecialEffectList) [LABEL_OPTIONAL]
- 11: `templateInfo` TYPE_MESSAGE (insta360.cloud.message.TemplateInfo) [LABEL_OPTIONAL]
- 12: `clientVersion` TYPE_STRING [LABEL_OPTIONAL]

### Enum `CutsceneType`
- 0 = `CUTSCENE_NONE`
- 1 = `CUTSCENE_LOTTIE`
- 2 = `CUTSCENE_PANO`
- 3 = `CUTSCENE_MEISHE`
- 4 = `CUTSCENE_OTHERS`

### Enum `ExporterTimeScaleType`
- 0 = `kDefaultValue`
- 1 = `kInterpolateFinalFrame`
- 2 = `kInterpolateFinalFrameAI`
- 3 = `kInterpolateSourceFrame`
- 4 = `kRepeatSingleSourceFrame`

### Enum `ClipAudioMode`
- 0 = `kNone`
- 1 = `kDirectionFocus`
- 3 = `kSpatialAudio360`
- 7 = `kInsDirectionFocus`

### Enum `RenderModelType`
- 0 = `AUTO`
- 1 = `SPHERE_AUTO`
- 2 = `SPHERE_STITCH`
- 3 = `SPHERE_EQUIRECTANGULAR`
- 4 = `SPHERE_FISHEYE_DEWARP`
- 5 = `CUBE_TILE_PROJECTION`
- 6 = `SPHERE_CUBEMAP`
- 7 = `PLANE_CUBEMAP2EQUI`
- 10 = `PLANE_AUTO`
- 11 = `PLANE_STITCH`
- 12 = `PLANE_EQUIRECTANGULAR`
- 13 = `PLANE_FISHEYE_DEWARP`
- 14 = `PLANE_STITCH_MERCATOR`
- 15 = `PLANE_MERCATOR`
- 20 = `PLANE`
- 21 = `PLANE_REMAP_UV`
- 34 = `MONO_SINGLE_FISHEYE`

### Enum `ProjectionType`
- 0 = `OMNI`
- 1 = `PANINI`

## `ins_cloud_export_filter.proto`
package `insta360.cloud.message` · syntax `proto3`
deps: `google/protobuf/wrappers.proto`

### Message `LtmFilterInfo`
- 1: `isPanorama` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `strength` TYPE_FLOAT [LABEL_OPTIONAL]

### Message `ColorPlus3FilterInfo`
- 1: `isPanorama` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `intensity` TYPE_FLOAT [LABEL_OPTIONAL]
- 3: `frameInterval` TYPE_UINT32 [LABEL_OPTIONAL]

### Message `ColorPlusLutFilterInfo`
- 1: `intensity` TYPE_FLOAT [LABEL_OPTIONAL]
- 2: `frameInterval` TYPE_UINT32 [LABEL_OPTIONAL]
- 3: `movingRatio` TYPE_MESSAGE (google.protobuf.FloatValue) [LABEL_OPTIONAL]

### Message `ColorPlusPostFilterInfo`
- 1: `frameInterval` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 2: `width` TYPE_UINT32 [LABEL_OPTIONAL]
- 3: `height` TYPE_UINT32 [LABEL_OPTIONAL]
- 4: `ltmMode` TYPE_ENUM (insta360.cloud.message.ColorPlusPostFilterInfo.LtmMode) [LABEL_OPTIONAL]
- 5: `paddingRatio` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]

### Message `CartoonFilterInfo`
- 1: `width` TYPE_UINT32 [LABEL_OPTIONAL]
- 2: `height` TYPE_UINT32 [LABEL_OPTIONAL]

### Message `LutStyleFilterInfo`
- 1: `type` TYPE_ENUM (insta360.cloud.message.LutStyleFilterInfo.Type) [LABEL_OPTIONAL]
- 2: `intensity` TYPE_FLOAT [LABEL_OPTIONAL]
- 3: `uuid` TYPE_STRING [LABEL_OPTIONAL]

### Message `LutFilterInfo`
- 1: `type` TYPE_ENUM (insta360.cloud.message.LutFilterInfo.Type) [LABEL_OPTIONAL]

### Message `ImageContrastFilterInfo`
- 1: `value` TYPE_FLOAT [LABEL_OPTIONAL]

### Message `ImageSaturationFilterInfo`
- 1: `value` TYPE_FLOAT [LABEL_OPTIONAL]

### Message `ImageHighLightFilterInfo`
- 1: `value` TYPE_FLOAT [LABEL_OPTIONAL]

### Message `ImageShadowFilterInfo`
- 1: `value` TYPE_FLOAT [LABEL_OPTIONAL]

### Message `ImageColorTemperatureFilterInfo`
- 1: `value` TYPE_FLOAT [LABEL_OPTIONAL]

### Message `ImageToneFilterInfo`
- 1: `value` TYPE_FLOAT [LABEL_OPTIONAL]

### Message `ImageSharpnessFilterInfo`
- 1: `value` TYPE_FLOAT [LABEL_OPTIONAL]

### Message `ImageExposureFilterInfo`
- 1: `value` TYPE_FLOAT [LABEL_OPTIONAL]

### Message `UnderwaterColourRestorationFilterInfo`
- 1: `isPanorama` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `strength` TYPE_FLOAT [LABEL_OPTIONAL]
- 3: `balance` TYPE_FLOAT [LABEL_OPTIONAL]

### Message `MeisheBeautyFilterInfo`
- 1: `whiten` TYPE_FLOAT [LABEL_OPTIONAL]
- 2: `smooth` TYPE_FLOAT [LABEL_OPTIONAL]
- 3: `face` TYPE_FLOAT [LABEL_OPTIONAL]
- 4: `eye` TYPE_FLOAT [LABEL_OPTIONAL]
- 5: `nose` TYPE_FLOAT [LABEL_OPTIONAL]

### Message `StrengthTimeMap`
- 1: `timeS` TYPE_INT64 [LABEL_OPTIONAL]
- 2: `strength` TYPE_FLOAT [LABEL_OPTIONAL]

### Message `RealSmartMotionBlurFilterInfo`
- 1: `isPanorama` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `blurStrength` TYPE_FLOAT [LABEL_OPTIONAL]
- 3: `blurThreshold` TYPE_FLOAT [LABEL_OPTIONAL]
- 4: `strengthTimeMap` TYPE_MESSAGE (insta360.cloud.message.StrengthTimeMap) [LABEL_REPEATED]

### Message `Transform3DFilterInfo`
- 1: `transform` TYPE_FLOAT [LABEL_REPEATED]

### Message `TiltShiftBlurFilterInfo`
- 1: `blurLevel` TYPE_UINT32 [LABEL_OPTIONAL]

### Message `ColorAdjustFilterInfo`
- 1: `caMode` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `caMediaType` TYPE_INT32 [LABEL_OPTIONAL]
- 3: `autoAdjust` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 4: `exposure` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 5: `brilliance` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 6: `highlights` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 7: `shadows` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 8: `contrast` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 9: `brightness` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 10: `blackpoint` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 11: `saturation` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 12: `vibrance` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 13: `warmth` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 14: `tint` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 15: `definition` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]

### Message `SDRToHDR10FilterInfo`
- 1: `useForPreviewRender` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]

### Message `BlurBackgroundFilterInfo`
- 1: `blurLevel` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 2: `blurSize` TYPE_MESSAGE (google.protobuf.FloatValue) [LABEL_OPTIONAL]
- 3: `downSamplingFactor` TYPE_MESSAGE (google.protobuf.FloatValue) [LABEL_OPTIONAL]
- 4: `iterationCount` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]

### Message `NumberPlateFilterInfo`
- 1: `detectGapFrames` TYPE_INT32 [LABEL_OPTIONAL]

### Message `Transform2DFilterInfo`
- 1: `contentAspect` TYPE_FLOAT [LABEL_OPTIONAL]
- 2: `rollDegree` TYPE_FLOAT [LABEL_OPTIONAL]
- 3: `scaleRate` TYPE_FLOAT [LABEL_OPTIONAL]

### Message `Transform2DParam`
- 1: `offsetX` TYPE_FLOAT [LABEL_OPTIONAL]
- 2: `offsetY` TYPE_FLOAT [LABEL_OPTIONAL]
- 3: `scaleRateX` TYPE_FLOAT [LABEL_OPTIONAL]
- 4: `scaleRateY` TYPE_FLOAT [LABEL_OPTIONAL]
- 5: `rotateDegree` TYPE_FLOAT [LABEL_OPTIONAL]

### Message `CropTransform2DFilterInfo`
- 1: `transformParams` TYPE_MESSAGE (insta360.cloud.message.Transform2DParam) [LABEL_OPTIONAL]
- 2: `cropInfo` TYPE_FLOAT [LABEL_REPEATED]
- 3: `extraTransformParam` TYPE_MESSAGE (insta360.cloud.message.Transform2DParam) [LABEL_OPTIONAL]
- 4: `clearColor` TYPE_FLOAT [LABEL_REPEATED]
- 5: `containMode` TYPE_ENUM (insta360.cloud.message.CropContainMode) [LABEL_OPTIONAL]
- 6: `outAspectMode` TYPE_ENUM (insta360.cloud.message.CropOutAspectMode) [LABEL_OPTIONAL]

### Message `CanvasEditFilterInfo`
- 1: `transformParams` TYPE_MESSAGE (insta360.cloud.message.Transform2DParam) [LABEL_OPTIONAL]
- 2: `isNeedBlur` TYPE_BOOL [LABEL_OPTIONAL]
- 3: `transformAllScreen` TYPE_BOOL [LABEL_OPTIONAL]

### Message `PlaneAffineTransformFilterInfo`
- 1: `startMediaTimeMs` TYPE_FLOAT [LABEL_OPTIONAL]
- 2: `endMediaTimeMs` TYPE_FLOAT [LABEL_OPTIONAL]
- 3: `motionLapseType` TYPE_ENUM (insta360.cloud.message.PlaneAffineTransformFilterInfo.MotionLapseEnum) [LABEL_OPTIONAL]

### Message `UnderWaterColor3FilterInfo`
- 1: `topK` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `lutUpdateRatio` TYPE_FLOAT [LABEL_OPTIONAL]
- 3: `totalStrength` TYPE_FLOAT [LABEL_OPTIONAL]
- 4: `luminanceStrength` TYPE_FLOAT [LABEL_OPTIONAL]
- 5: `searchInterval` TYPE_FLOAT [LABEL_OPTIONAL]
- 6: `inferenceInterval` TYPE_FLOAT [LABEL_OPTIONAL]
- 7: `styleResultBin` TYPE_BYTES [LABEL_OPTIONAL]

### Message `FilterInfo`
- 1: `type` TYPE_ENUM (insta360.cloud.message.FilterInfo.Type) [LABEL_OPTIONAL]
- 2: `ltmFilterInfo` TYPE_MESSAGE (insta360.cloud.message.LtmFilterInfo) [LABEL_OPTIONAL]
- 3: `colorplus3FilterInfo` TYPE_MESSAGE (insta360.cloud.message.ColorPlus3FilterInfo) [LABEL_OPTIONAL]
- 4: `cartoonFilterInfo` TYPE_MESSAGE (insta360.cloud.message.CartoonFilterInfo) [LABEL_OPTIONAL]
- 5: `lutStyleFilterInfo` TYPE_MESSAGE (insta360.cloud.message.LutStyleFilterInfo) [LABEL_OPTIONAL]
- 6: `underWaterFilterInfo` TYPE_MESSAGE (insta360.cloud.message.UnderwaterColourRestorationFilterInfo) [LABEL_OPTIONAL]
- 7: `imageContrastFilterInfo` TYPE_MESSAGE (insta360.cloud.message.ImageContrastFilterInfo) [LABEL_OPTIONAL]
- 8: `imageSaturationFilterInfo` TYPE_MESSAGE (insta360.cloud.message.ImageSaturationFilterInfo) [LABEL_OPTIONAL]
- 9: `imageHighLightFilterInfo` TYPE_MESSAGE (insta360.cloud.message.ImageHighLightFilterInfo) [LABEL_OPTIONAL]
- 10: `imageShadowFilterInfo` TYPE_MESSAGE (insta360.cloud.message.ImageShadowFilterInfo) [LABEL_OPTIONAL]
- 11: `imageColorTemperatureFilterInfo` TYPE_MESSAGE (insta360.cloud.message.ImageColorTemperatureFilterInfo) [LABEL_OPTIONAL]
- 12: `imageToneFilterInfo` TYPE_MESSAGE (insta360.cloud.message.ImageToneFilterInfo) [LABEL_OPTIONAL]
- 13: `imageSharpnessFilterInfo` TYPE_MESSAGE (insta360.cloud.message.ImageSharpnessFilterInfo) [LABEL_OPTIONAL]
- 14: `imageExposureFilterInfo` TYPE_MESSAGE (insta360.cloud.message.ImageExposureFilterInfo) [LABEL_OPTIONAL]
- 15: `meisheBeautyFilterInfo` TYPE_MESSAGE (insta360.cloud.message.MeisheBeautyFilterInfo) [LABEL_OPTIONAL]
- 16: `lutFilterInfo` TYPE_MESSAGE (insta360.cloud.message.LutFilterInfo) [LABEL_OPTIONAL]
- 17: `realSmartMotionBlurFilterInfo` TYPE_MESSAGE (insta360.cloud.message.RealSmartMotionBlurFilterInfo) [LABEL_OPTIONAL]
- 18: `transform3DFilterInfo` TYPE_MESSAGE (insta360.cloud.message.Transform3DFilterInfo) [LABEL_OPTIONAL]
- 19: `tiltShiftBlurFilterInfo` TYPE_MESSAGE (insta360.cloud.message.TiltShiftBlurFilterInfo) [LABEL_OPTIONAL]
- 20: `colorAdjustFilterInfo` TYPE_MESSAGE (insta360.cloud.message.ColorAdjustFilterInfo) [LABEL_OPTIONAL]
- 21: `sdrToHdr10FilterInfo` TYPE_MESSAGE (insta360.cloud.message.SDRToHDR10FilterInfo) [LABEL_OPTIONAL]
- 22: `blurBackgroundFilterInfo` TYPE_MESSAGE (insta360.cloud.message.BlurBackgroundFilterInfo) [LABEL_OPTIONAL]
- 23: `numberPlateFilterInfo` TYPE_MESSAGE (insta360.cloud.message.NumberPlateFilterInfo) [LABEL_OPTIONAL]
- 24: `colorPlusPostFilterInfo` TYPE_MESSAGE (insta360.cloud.message.ColorPlusPostFilterInfo) [LABEL_OPTIONAL]
- 25: `transform2DFilterInfo` TYPE_MESSAGE (insta360.cloud.message.Transform2DFilterInfo) [LABEL_OPTIONAL]
- 26: `planeAffineTransformFilterInfo` TYPE_MESSAGE (insta360.cloud.message.PlaneAffineTransformFilterInfo) [LABEL_OPTIONAL]
- 27: `underWaterColor3FilterInfo` TYPE_MESSAGE (insta360.cloud.message.UnderWaterColor3FilterInfo) [LABEL_OPTIONAL]
- 28: `cropTransform2DFilterInfo` TYPE_MESSAGE (insta360.cloud.message.CropTransform2DFilterInfo) [LABEL_OPTIONAL]
- 29: `canvasEditFilterInfo` TYPE_MESSAGE (insta360.cloud.message.CanvasEditFilterInfo) [LABEL_OPTIONAL]
- 30: `colorPlusLutFilterInfo` TYPE_MESSAGE (insta360.cloud.message.ColorPlusLutFilterInfo) [LABEL_OPTIONAL]

### Message `FilterInfoList`
- 1: `clipIndex` TYPE_UINT32 [LABEL_OPTIONAL]
- 2: `filterInfos` TYPE_MESSAGE (insta360.cloud.message.FilterInfo) [LABEL_REPEATED]

### Enum `CropContainMode`
- 0 = `CONTAIN`
- 1 = `COVER`

### Enum `CropOutAspectMode`
- 0 = `UNKNOWN`
- 1 = `EqualScreen`
- 2 = `EqualCrop`

## `ins_cloud_proxy_info.proto`
package `insta360.cloud.message` · syntax `proto3`
deps: `google/protobuf/wrappers.proto`

### Message `CloudVideoInfo`
- 1: `cubeMapInfo` TYPE_MESSAGE (insta360.cloud.message.CubeMapInfo) [LABEL_OPTIONAL]
- 2: `fileItems` TYPE_MESSAGE (google.protobuf.StringValue) [LABEL_REPEATED]
- 3: `originalVideoInfo` TYPE_MESSAGE (insta360.cloud.message.OriginalVideoInfo) [LABEL_OPTIONAL]
- 4: `trim` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]

### Message `CubeMapInfo`
- 1: `cubeWidthExtend` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 2: `panoWidth` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 3: `projectionType` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 4: `width` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]

### Message `OriginalVideoInfo`
- 1: `bitrate` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 2: `hasAudio` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 3: `height` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 4: `isFileDualStream` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 5: `isPanoramaFormat` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 6: `isVideo` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 7: `planeRotationDegree` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 8: `videoCodecName` TYPE_MESSAGE (google.protobuf.StringValue) [LABEL_OPTIONAL]
- 9: `videoDurationMs` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 10: `videoFramerate` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 11: `videoRotate` TYPE_MESSAGE (google.protobuf.DoubleValue) [LABEL_OPTIONAL]
- 12: `width` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 13: `fileSize` TYPE_MESSAGE (google.protobuf.Int64Value) [LABEL_OPTIONAL]

## `ins_cloud_special_effect.proto`
package `insta360.cloud.message` · syntax `proto3`
deps: `google/protobuf/wrappers.proto`

### Message `MeisheAnim`
- 1: `uuid` TYPE_STRING [LABEL_OPTIONAL]
- 2: `durationMs` TYPE_DOUBLE [LABEL_OPTIONAL]

### Message `MeisheSticker`
- 1: `uuid` TYPE_STRING [LABEL_OPTIONAL]
- 2: `startTimeMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 3: `durationMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 4: `positionZ` TYPE_INT32 [LABEL_OPTIONAL]
- 5: `translationX` TYPE_FLOAT [LABEL_OPTIONAL]
- 6: `translationY` TYPE_FLOAT [LABEL_OPTIONAL]
- 7: `scaleX` TYPE_MESSAGE (google.protobuf.FloatValue) [LABEL_OPTIONAL]
- 8: `scaleY` TYPE_MESSAGE (google.protobuf.FloatValue) [LABEL_OPTIONAL]
- 9: `isVerticalFlip` TYPE_BOOL [LABEL_OPTIONAL]
- 10: `isHorizontalFlip` TYPE_BOOL [LABEL_OPTIONAL]
- 11: `rotate` TYPE_FLOAT [LABEL_OPTIONAL]
- 12: `inAnimation` TYPE_MESSAGE (insta360.cloud.message.MeisheAnim) [LABEL_OPTIONAL]
- 13: `outAnimation` TYPE_MESSAGE (insta360.cloud.message.MeisheAnim) [LABEL_OPTIONAL]
- 14: `periodAnimation` TYPE_MESSAGE (insta360.cloud.message.MeisheAnim) [LABEL_OPTIONAL]
- 15: `isCustom` TYPE_BOOL [LABEL_OPTIONAL]
- 16: `custom_uuid` TYPE_STRING [LABEL_OPTIONAL]

### Message `MeiSheTextInfo`
- 1: `index` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `colorARGB` TYPE_FLOAT [LABEL_REPEATED]
- 3: `text` TYPE_STRING [LABEL_OPTIONAL]
- 4: `fontName` TYPE_STRING [LABEL_OPTIONAL]
- 5: `weight` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 6: `italic` TYPE_BOOL [LABEL_OPTIONAL]
- 7: `uuid` TYPE_STRING [LABEL_OPTIONAL]

### Message `MeisheTimeWaterMarkCaptionInfo`
- 1: `formatType` TYPE_ENUM (insta360.cloud.message.MeisheTimeWaterMarkCaptionInfo.FormatType) [LABEL_OPTIONAL]
- 2: `createTimeStamp` TYPE_INT64 [LABEL_OPTIONAL]
- 3: `timeZone` TYPE_INT32 [LABEL_OPTIONAL]

### Message `MeiSheCaption`
- 1: `uuid` TYPE_STRING [LABEL_OPTIONAL]
- 2: `startTimeMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 3: `durationMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 4: `customTextInfoList` TYPE_MESSAGE (insta360.cloud.message.MeiSheTextInfo) [LABEL_REPEATED]
- 5: `positionZ` TYPE_INT32 [LABEL_OPTIONAL]
- 6: `rotate` TYPE_FLOAT [LABEL_OPTIONAL]
- 7: `translationX` TYPE_FLOAT [LABEL_OPTIONAL]
- 8: `translationY` TYPE_FLOAT [LABEL_OPTIONAL]
- 9: `scaleX` TYPE_MESSAGE (google.protobuf.FloatValue) [LABEL_OPTIONAL]
- 10: `scaleY` TYPE_MESSAGE (google.protobuf.FloatValue) [LABEL_OPTIONAL]
- 11: `opacity` TYPE_MESSAGE (google.protobuf.FloatValue) [LABEL_OPTIONAL]
- 12: `meisheTimeWaterMarkCaptionInfo` TYPE_MESSAGE (insta360.cloud.message.MeisheTimeWaterMarkCaptionInfo) [LABEL_OPTIONAL]

### Message `MeiSheEffect`
- 1: `uuid` TYPE_STRING [LABEL_OPTIONAL]
- 2: `startTimeMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 3: `durationMs` TYPE_DOUBLE [LABEL_OPTIONAL]

### Message `SpecialEffectList`
- 1: `meisheCaption` TYPE_MESSAGE (insta360.cloud.message.MeiSheCaption) [LABEL_REPEATED]
- 2: `meisheSticker` TYPE_MESSAGE (insta360.cloud.message.MeisheSticker) [LABEL_REPEATED]
- 3: `meisheEffect` TYPE_MESSAGE (insta360.cloud.message.MeiSheEffect) [LABEL_REPEATED]

## `ins_export_information.proto`
package `insta360.cloud.message` · syntax `proto3`
deps: `google/protobuf/wrappers.proto`, `ins_cloud_export_dashboard.proto`

### Message `ExportInfox264EncodeOption`
- 1: `x264Preset` TYPE_STRING [LABEL_OPTIONAL]
- 2: `videoEncoderProfile` TYPE_STRING [LABEL_OPTIONAL]
- 3: `videoEncodeTune` TYPE_STRING [LABEL_OPTIONAL]
- 4: `videoLevel` TYPE_INT32 [LABEL_OPTIONAL]

### Message `EnumCodecIdValue`
- 1: `value` TYPE_ENUM (insta360.cloud.message.CodecId) [LABEL_OPTIONAL]

### Message `ExportInfoVideoEncodeOption`
- 1: `encFormat` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 2: `width` TYPE_INT32 [LABEL_OPTIONAL]
- 3: `height` TYPE_INT32 [LABEL_OPTIONAL]
- 4: `bitrate` TYPE_INT32 [LABEL_OPTIONAL]
- 5: `is3DLeftRight` TYPE_BOOL [LABEL_OPTIONAL]
- 6: `isSpherical` TYPE_BOOL [LABEL_OPTIONAL]
- 7: `videoType` TYPE_ENUM (insta360.cloud.message.VideoType) [LABEL_OPTIONAL]
- 8: `videoGopSize` TYPE_INT32 [LABEL_OPTIONAL]
- 9: `fps` TYPE_DOUBLE [LABEL_OPTIONAL]
- 10: `metadataMake` TYPE_STRING [LABEL_OPTIONAL]
- 11: `metadataModel` TYPE_STRING [LABEL_OPTIONAL]
- 12: `metadataComment` TYPE_STRING [LABEL_OPTIONAL]
- 13: `exportInfox264EncodeOption` TYPE_MESSAGE (insta360.cloud.message.ExportInfox264EncodeOption) [LABEL_OPTIONAL]
- 14: `codecid` TYPE_MESSAGE (insta360.cloud.message.EnumCodecIdValue) [LABEL_OPTIONAL]
- 15: `enableSdrToHdr10` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 16: `creationTime` TYPE_STRING [LABEL_OPTIONAL]
- 17: `metadataAIGC` TYPE_STRING [LABEL_OPTIONAL]
- 18: `bitDepth10Export` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 19: `enableHLG` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 20: `enableDolbyVision` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 21: `colorRange` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 22: `colorSpace` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]

### Message `ExportInfoAudioEncodeOption`
- 1: `audioBitrate` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `sampleRate` TYPE_INT32 [LABEL_OPTIONAL]
- 3: `nbSample` TYPE_INT32 [LABEL_OPTIONAL]
- 4: `channelLayout` TYPE_ENUM (insta360.cloud.message.ChannelLayout) [LABEL_OPTIONAL]

### Message `BlockDenoiseParamMapping`
- 1: `iso` TYPE_DOUBLE [LABEL_OPTIONAL]
- 2: `refCount` TYPE_INT32 [LABEL_OPTIONAL]
- 3: `thresholdLum` TYPE_INT32 [LABEL_OPTIONAL]
- 4: `limit` TYPE_INT32 [LABEL_OPTIONAL]

### Message `ChromaDenoiseParam`
- 1: `applyISOValue` TYPE_FLOAT [LABEL_OPTIONAL]
- 2: `exitISOValue` TYPE_FLOAT [LABEL_OPTIONAL]

### Message `BlockDenoiseParam`
- 1: `clipindex` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `isoMaps` TYPE_MESSAGE (insta360.cloud.message.BlockDenoiseParamMapping) [LABEL_REPEATED]
- 3: `chromaDenoiseParam` TYPE_MESSAGE (insta360.cloud.message.ChromaDenoiseParam) [LABEL_OPTIONAL]

### Message `BlockDenoiseParamV2`
- 1: `clipindex` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `denoiseTableType` TYPE_STRING [LABEL_OPTIONAL]
- 3: `isFast` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]
- 4: `overlap` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]

### Message `ExportInfoDenoiseSettings`
- 1: `enableDenoise` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `denosieType` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 3: `blockDenoiseParam` TYPE_MESSAGE (insta360.cloud.message.BlockDenoiseParam) [LABEL_REPEATED]
- 4: `blockDenoiseParamV2` TYPE_MESSAGE (insta360.cloud.message.BlockDenoiseParamV2) [LABEL_REPEATED]
- 5: `autoDenoise` TYPE_MESSAGE (google.protobuf.BoolValue) [LABEL_OPTIONAL]

### Message `ExportInfoWaterMark`
- 1: `x` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `y` TYPE_INT32 [LABEL_OPTIONAL]
- 3: `w` TYPE_INT32 [LABEL_OPTIONAL]
- 4: `h` TYPE_INT32 [LABEL_OPTIONAL]
- 5: `waterMarkEndTime` TYPE_DOUBLE [LABEL_OPTIONAL]
- 6: `resouceid` TYPE_STRING [LABEL_OPTIONAL]

### Message `ExportInfoLogoInfo`
- 1: `x` TYPE_FLOAT [LABEL_OPTIONAL]
- 2: `y` TYPE_FLOAT [LABEL_OPTIONAL]
- 3: `z` TYPE_FLOAT [LABEL_OPTIONAL]
- 4: `size` TYPE_FLOAT [LABEL_OPTIONAL]
- 5: `enableLogoFeature` TYPE_BOOL [LABEL_OPTIONAL]
- 6: `resouceid` TYPE_STRING [LABEL_OPTIONAL]
- 7: `cornerRadius` TYPE_FLOAT [LABEL_OPTIONAL]
- 8: `feather` TYPE_FLOAT [LABEL_OPTIONAL]
- 9: `rotate` TYPE_FLOAT [LABEL_OPTIONAL]

### Message `ExportInfoEdgeInfo`
- 1: `edgeLeft` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `edgeTop` TYPE_INT32 [LABEL_OPTIONAL]
- 3: `edgeRight` TYPE_INT32 [LABEL_OPTIONAL]
- 4: `edgeBottom` TYPE_INT32 [LABEL_OPTIONAL]

### Message `ExportInfoClearColor`
- 1: `r` TYPE_FLOAT [LABEL_OPTIONAL]
- 2: `g` TYPE_FLOAT [LABEL_OPTIONAL]
- 3: `b` TYPE_FLOAT [LABEL_OPTIONAL]
- 4: `a` TYPE_FLOAT [LABEL_OPTIONAL]

### Message `ExportInfoOtherInfoOption`
- 1: `tailClear` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `enableStarrySky` TYPE_BOOL [LABEL_OPTIONAL]
- 3: `enableDashboard` TYPE_BOOL [LABEL_OPTIONAL]
- 4: `renderFormat` TYPE_MESSAGE (google.protobuf.Int32Value) [LABEL_OPTIONAL]
- 5: `dashBoardInfo` TYPE_MESSAGE (insta360.cloud.message.DashboardInfo) [LABEL_REPEATED]

### Message `ExportInformation`
- 1: `isTurnBack` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `enableX264Decoder` TYPE_BOOL [LABEL_OPTIONAL]
- 3: `convertType` TYPE_ENUM (insta360.cloud.message.ExMatColorType) [LABEL_OPTIONAL]
- 4: `isProject` TYPE_BOOL [LABEL_OPTIONAL]
- 5: `outputAudioAfadeOutDuration` TYPE_DOUBLE [LABEL_OPTIONAL]
- 6: `videoEncodeOption` TYPE_MESSAGE (insta360.cloud.message.ExportInfoVideoEncodeOption) [LABEL_OPTIONAL]
- 7: `audioEncodeOption` TYPE_MESSAGE (insta360.cloud.message.ExportInfoAudioEncodeOption) [LABEL_OPTIONAL]
- 8: `denoiseSettings` TYPE_MESSAGE (insta360.cloud.message.ExportInfoDenoiseSettings) [LABEL_OPTIONAL]
- 9: `waterMark` TYPE_MESSAGE (insta360.cloud.message.ExportInfoWaterMark) [LABEL_OPTIONAL]
- 10: `logo` TYPE_MESSAGE (insta360.cloud.message.ExportInfoLogoInfo) [LABEL_OPTIONAL]
- 11: `edgeInfo` TYPE_MESSAGE (insta360.cloud.message.ExportInfoEdgeInfo) [LABEL_OPTIONAL]
- 12: `clearColor` TYPE_MESSAGE (insta360.cloud.message.ExportInfoClearColor) [LABEL_OPTIONAL]
- 13: `otherInfoOption` TYPE_MESSAGE (insta360.cloud.message.ExportInfoOtherInfoOption) [LABEL_OPTIONAL]
- 14: `isUserChangeAspect` TYPE_BOOL [LABEL_OPTIONAL]
- 15: `waterMarks` TYPE_MESSAGE (insta360.cloud.message.ExportInfoWaterMark) [LABEL_REPEATED]

### Enum `VideoType`
- 0 = `NORMALMP4`
- 1 = `FRAGMENTMP4`

### Enum `CodecId`
- 0 = `NONECODEC`
- 27 = `H264`
- 173 = `H265`
- 147 = `PRORES`

### Enum `ChannelLayout`
- 0 = `NONE`
- 1 = `MONO`
- 2 = `STEREO`
- 3 = `SURROUND4POINT0`

### Enum `ExMatColorType`
- 0 = `RGBA`
- 1 = `YUV_I420`

## `ins_one_shot_data.proto`
package `insta360.cloud.algorithm.message` · syntax `proto3`

### Message `FaceInfo`
- 1: `centerPointX` TYPE_DOUBLE [LABEL_OPTIONAL]
- 2: `centerPointY` TYPE_DOUBLE [LABEL_OPTIONAL]
- 3: `width` TYPE_INT32 [LABEL_OPTIONAL]
- 4: `height` TYPE_INT32 [LABEL_OPTIONAL]
- 5: `confidence` TYPE_FLOAT [LABEL_OPTIONAL]

### Message `ViewData`
- 1: `yaw` TYPE_FLOAT [LABEL_OPTIONAL]
- 2: `pitch` TYPE_FLOAT [LABEL_OPTIONAL]
- 3: `xfov` TYPE_FLOAT [LABEL_OPTIONAL]
- 4: `yfov` TYPE_FLOAT [LABEL_OPTIONAL]
- 5: `distance` TYPE_FLOAT [LABEL_OPTIONAL]
- 6: `roll` TYPE_FLOAT [LABEL_OPTIONAL]
- 7: `srcTime` TYPE_DOUBLE [LABEL_OPTIONAL]
- 8: `quat` TYPE_DOUBLE [LABEL_REPEATED]
- 9: `highlightType` TYPE_INT32 [LABEL_OPTIONAL]
- 10: `beISPDynamicData` TYPE_BYTES [LABEL_OPTIONAL]
- 11: `faceInfo` TYPE_MESSAGE (insta360.cloud.algorithm.message.FaceInfo) [LABEL_REPEATED]
- 12: `mul_score` TYPE_DOUBLE [LABEL_OPTIONAL]
- 13: `confidence` TYPE_FLOAT [LABEL_OPTIONAL]
- 14: `origin_id` TYPE_INT32 [LABEL_OPTIONAL]

### Message `AspectRatio`
- 1: `width` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `height` TYPE_INT32 [LABEL_OPTIONAL]

### Message `ViewSegment`
- 1: `aspectRatio` TYPE_MESSAGE (insta360.cloud.algorithm.message.AspectRatio) [LABEL_OPTIONAL]
- 2: `keyPoints` TYPE_MESSAGE (insta360.cloud.algorithm.message.ViewData) [LABEL_REPEATED]
- 3: `horizon` TYPE_BOOL [LABEL_OPTIONAL]
- 4: `directional` TYPE_BOOL [LABEL_OPTIONAL]
- 5: `still` TYPE_BOOL [LABEL_OPTIONAL]
- 6: `vir_ptz` TYPE_BOOL [LABEL_OPTIONAL]
- 7: `immersion` TYPE_BOOL [LABEL_OPTIONAL]

### Message `View`
- 1: `segments` TYPE_MESSAGE (insta360.cloud.algorithm.message.ViewSegment) [LABEL_REPEATED]

## `ins_player_edit_data.proto`
package `insta360.cloud.message` · syntax `proto3`

### Message `AspectRatio`
- 1: `width` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `height` TYPE_INT32 [LABEL_OPTIONAL]

### Message `ViewData`
- 1: `yaw` TYPE_FLOAT [LABEL_OPTIONAL]
- 2: `pitch` TYPE_FLOAT [LABEL_OPTIONAL]
- 3: `roll` TYPE_FLOAT [LABEL_OPTIONAL]
- 4: `fov` TYPE_FLOAT [LABEL_OPTIONAL]
- 5: `distance` TYPE_FLOAT [LABEL_OPTIONAL]
- 6: `srcTime` TYPE_DOUBLE [LABEL_OPTIONAL]

### Message `ViewSegment`
- 1: `type` TYPE_ENUM (insta360.cloud.message.ViewDataType) [LABEL_OPTIONAL]
- 2: `aspectRatio` TYPE_MESSAGE (insta360.cloud.message.AspectRatio) [LABEL_OPTIONAL]
- 3: `keyPoints` TYPE_MESSAGE (insta360.cloud.message.ViewData) [LABEL_REPEATED]

### Message `ProjectSegment`
- 1: `id` TYPE_STRING [LABEL_OPTIONAL]
- 2: `dataType` TYPE_ENUM (insta360.cloud.message.ProjectSegmentType) [LABEL_OPTIONAL]
- 3: `aspectRatio` TYPE_MESSAGE (insta360.cloud.message.AspectRatio) [LABEL_OPTIONAL]
- 4: `stabType` TYPE_ENUM (insta360.cloud.message.StabType) [LABEL_OPTIONAL]
- 5: `segments` TYPE_MESSAGE (insta360.cloud.message.ViewSegment) [LABEL_REPEATED]
- 6: `clipindex` TYPE_INT32 [LABEL_OPTIONAL]

### Message `Project`
- 1: `version` TYPE_INT64 [LABEL_OPTIONAL]
- 2: `source` TYPE_ENUM (insta360.cloud.message.DataSource) [LABEL_OPTIONAL]
- 3: `projectName` TYPE_STRING [LABEL_OPTIONAL]
- 4: `segments` TYPE_MESSAGE (insta360.cloud.message.ProjectSegment) [LABEL_REPEATED]

### Enum `DataSource`
- 0 = `Unknow`
- 1 = `Android`
- 2 = `IOS`
- 3 = `PC`

### Enum `StabType`
- 0 = `Still`
- 1 = `DirectionLock`

### Enum `ProjectSegmentType`
- 0 = `Edit`
- 1 = `Snap`

### Enum `ViewDataType`
- 0 = `KeyFramePoint`
- 1 = `DeepTrack`
- 2 = `ViewFinder`

## `model_state.proto`
package `insta360.messages` · syntax `proto3`

### Message `ModelState`
- 1: `type` TYPE_ENUM (insta360.messages.ModelState.ValueType) [LABEL_OPTIONAL]
- 2: `timeMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 3: `fov` TYPE_FLOAT [LABEL_OPTIONAL]
- 4: `distance` TYPE_FLOAT [LABEL_OPTIONAL]
- 5: `quat` TYPE_BYTES [LABEL_OPTIONAL]
- 6: `rect` TYPE_BYTES [LABEL_OPTIONAL]
- 7: `preRoll` TYPE_FLOAT [LABEL_OPTIONAL]

## `offset_info.proto`
package `insta360.messages` · syntax `proto3`

### Message `OffsetInfo`
- 1: `offset_version` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `offset` TYPE_STRING [LABEL_OPTIONAL]

## `offset_state.proto`
package `insta360.messages` · syntax `proto3`

### Enum `OffsetState`
- 0 = `Common`
- 1 = `SphereProtect`
- 2 = `DivingWater`
- 3 = `DivingWater23`
- 4 = `Protect_A`
- 5 = `Protect_S`
- 6 = `Protect_Auto`
- 7 = `Filter_ND16`
- 8 = `Filter_ND32`
- 9 = `Filter_ND64`
- 10 = `DivingWaterPro`
- 11 = `DivingAirPro`
- 12 = `Filter_ND128`
- 13 = `Filter_Joystick`
- 14 = `G01Protect`

### Enum `OffsetDetectedType`
- 0 = `Unkown`
- 1 = `Auto_A`
- 2 = `Auto_S`
- 3 = `Auto_off`
- 4 = `Auto_AS`
- 5 = `Auto_ND16`
- 6 = `Auto_ND32`
- 7 = `Auto_ND64`
- 8 = `Auto_ND128`

## `pano_trans_plus.proto`
package `insta360.messages` · syntax `proto3`
deps: `basic_info.proto`, `time_position.proto`

### Message `PanoTransPlus`
- 1: `isYFov` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `aspect` TYPE_DOUBLE [LABEL_OPTIONAL]
- 3: `beginPosition` TYPE_MESSAGE (insta360.messages.TimePosition) [LABEL_OPTIONAL]
- 4: `endPosition` TYPE_MESSAGE (insta360.messages.TimePosition) [LABEL_OPTIONAL]
- 5: `layer_info` TYPE_MESSAGE (insta360.messages.PanoTransPlus.LayerInfo) [LABEL_OPTIONAL]
- nested: LayerInfo

## `serializer.proto`
package `insta360.messages` · syntax `proto3`
deps: `google/protobuf/any.proto`

### Message `Serializer`
- 1: `version` TYPE_STRING [LABEL_OPTIONAL]
- 2: `type` TYPE_STRING [LABEL_OPTIONAL]
- 3: `details` TYPE_MESSAGE (google.protobuf.Any) [LABEL_OPTIONAL]

## `src/proto/grpc/lookup/v1/rls_config.proto`
package `grpc.lookup.v1` · syntax `proto3`
deps: `google/protobuf/duration.proto`

### Message `NameMatcher`
- 1: `key` TYPE_STRING [LABEL_OPTIONAL]
- 2: `names` TYPE_STRING [LABEL_REPEATED]
- 3: `required_match` TYPE_BOOL [LABEL_OPTIONAL]

### Message `GrpcKeyBuilder`
- 1: `names` TYPE_MESSAGE (grpc.lookup.v1.GrpcKeyBuilder.Name) [LABEL_REPEATED]
- 3: `extra_keys` TYPE_MESSAGE (grpc.lookup.v1.GrpcKeyBuilder.ExtraKeys) [LABEL_OPTIONAL]
- 2: `headers` TYPE_MESSAGE (grpc.lookup.v1.NameMatcher) [LABEL_REPEATED]
- 4: `constant_keys` TYPE_MESSAGE (grpc.lookup.v1.GrpcKeyBuilder.ConstantKeysEntry) [LABEL_REPEATED]
- nested: Name, ExtraKeys, ConstantKeysEntry

### Message `HttpKeyBuilder`
- 1: `host_patterns` TYPE_STRING [LABEL_REPEATED]
- 2: `path_patterns` TYPE_STRING [LABEL_REPEATED]
- 3: `query_parameters` TYPE_MESSAGE (grpc.lookup.v1.NameMatcher) [LABEL_REPEATED]
- 4: `headers` TYPE_MESSAGE (grpc.lookup.v1.NameMatcher) [LABEL_REPEATED]
- 5: `constant_keys` TYPE_MESSAGE (grpc.lookup.v1.HttpKeyBuilder.ConstantKeysEntry) [LABEL_REPEATED]
- nested: ConstantKeysEntry

### Message `RouteLookupConfig`
- 1: `http_keybuilders` TYPE_MESSAGE (grpc.lookup.v1.HttpKeyBuilder) [LABEL_REPEATED]
- 2: `grpc_keybuilders` TYPE_MESSAGE (grpc.lookup.v1.GrpcKeyBuilder) [LABEL_REPEATED]
- 3: `lookup_service` TYPE_STRING [LABEL_OPTIONAL]
- 4: `lookup_service_timeout` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 5: `max_age` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 6: `stale_age` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 7: `cache_size_bytes` TYPE_INT64 [LABEL_OPTIONAL]
- 8: `valid_targets` TYPE_STRING [LABEL_REPEATED]
- 9: `default_target` TYPE_STRING [LABEL_OPTIONAL]

### Message `RouteLookupClusterSpecifier`
- 1: `route_lookup_config` TYPE_MESSAGE (grpc.lookup.v1.RouteLookupConfig) [LABEL_OPTIONAL]

## `time_position.proto`
package `insta360.messages` · syntax `proto3`

### Message `TimePosition`
- 1: `srcTimeMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 2: `srcRepeatTimeMs` TYPE_DOUBLE [LABEL_OPTIONAL]
- 3: `mediaTimeMs` TYPE_DOUBLE [LABEL_OPTIONAL]

## `udpa/annotations/migrate.proto`
package `udpa.annotations` · syntax `proto3`
deps: `google/protobuf/descriptor.proto`

### Message `MigrateAnnotation`
- 1: `rename` TYPE_STRING [LABEL_OPTIONAL]

### Message `FieldMigrateAnnotation`
- 1: `rename` TYPE_STRING [LABEL_OPTIONAL]
- 2: `oneof_promotion` TYPE_STRING [LABEL_OPTIONAL]

### Message `FileMigrateAnnotation`
- 2: `move_to_package` TYPE_STRING [LABEL_OPTIONAL]

## `udpa/annotations/security.proto`
package `udpa.annotations` · syntax `proto3`
deps: `udpa/annotations/status.proto`, `google/protobuf/descriptor.proto`

### Message `FieldSecurityAnnotation`
- 1: `configure_for_untrusted_downstream` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `configure_for_untrusted_upstream` TYPE_BOOL [LABEL_OPTIONAL]

## `udpa/annotations/sensitive.proto`
package `udpa.annotations` · syntax `proto3`
deps: `google/protobuf/descriptor.proto`

## `udpa/annotations/status.proto`
package `udpa.annotations` · syntax `proto3`
deps: `google/protobuf/descriptor.proto`

### Message `StatusAnnotation`
- 1: `work_in_progress` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `package_version_status` TYPE_ENUM (udpa.annotations.PackageVersionStatus) [LABEL_OPTIONAL]

### Enum `PackageVersionStatus`
- 0 = `UNKNOWN`
- 1 = `FROZEN`
- 2 = `ACTIVE`
- 3 = `NEXT_MAJOR_VERSION_CANDIDATE`

## `udpa/annotations/versioning.proto`
package `udpa.annotations` · syntax `proto3`
deps: `google/protobuf/descriptor.proto`

### Message `VersioningAnnotation`
- 1: `previous_message_type` TYPE_STRING [LABEL_OPTIONAL]

## `validate/validate.proto`
package `validate` · syntax `proto2`
deps: `google/protobuf/descriptor.proto`, `google/protobuf/duration.proto`, `google/protobuf/timestamp.proto`

### Message `FieldRules`
- 17: `message` TYPE_MESSAGE (validate.MessageRules) [LABEL_OPTIONAL]
- 1: `float` TYPE_MESSAGE (validate.FloatRules) [LABEL_OPTIONAL]
- 2: `double` TYPE_MESSAGE (validate.DoubleRules) [LABEL_OPTIONAL]
- 3: `int32` TYPE_MESSAGE (validate.Int32Rules) [LABEL_OPTIONAL]
- 4: `int64` TYPE_MESSAGE (validate.Int64Rules) [LABEL_OPTIONAL]
- 5: `uint32` TYPE_MESSAGE (validate.UInt32Rules) [LABEL_OPTIONAL]
- 6: `uint64` TYPE_MESSAGE (validate.UInt64Rules) [LABEL_OPTIONAL]
- 7: `sint32` TYPE_MESSAGE (validate.SInt32Rules) [LABEL_OPTIONAL]
- 8: `sint64` TYPE_MESSAGE (validate.SInt64Rules) [LABEL_OPTIONAL]
- 9: `fixed32` TYPE_MESSAGE (validate.Fixed32Rules) [LABEL_OPTIONAL]
- 10: `fixed64` TYPE_MESSAGE (validate.Fixed64Rules) [LABEL_OPTIONAL]
- 11: `sfixed32` TYPE_MESSAGE (validate.SFixed32Rules) [LABEL_OPTIONAL]
- 12: `sfixed64` TYPE_MESSAGE (validate.SFixed64Rules) [LABEL_OPTIONAL]
- 13: `bool` TYPE_MESSAGE (validate.BoolRules) [LABEL_OPTIONAL]
- 14: `string` TYPE_MESSAGE (validate.StringRules) [LABEL_OPTIONAL]
- 15: `bytes` TYPE_MESSAGE (validate.BytesRules) [LABEL_OPTIONAL]
- 16: `enum` TYPE_MESSAGE (validate.EnumRules) [LABEL_OPTIONAL]
- 18: `repeated` TYPE_MESSAGE (validate.RepeatedRules) [LABEL_OPTIONAL]
- 19: `map` TYPE_MESSAGE (validate.MapRules) [LABEL_OPTIONAL]
- 20: `any` TYPE_MESSAGE (validate.AnyRules) [LABEL_OPTIONAL]
- 21: `duration` TYPE_MESSAGE (validate.DurationRules) [LABEL_OPTIONAL]
- 22: `timestamp` TYPE_MESSAGE (validate.TimestampRules) [LABEL_OPTIONAL]

### Message `FloatRules`
- 1: `const` TYPE_FLOAT [LABEL_OPTIONAL]
- 2: `lt` TYPE_FLOAT [LABEL_OPTIONAL]
- 3: `lte` TYPE_FLOAT [LABEL_OPTIONAL]
- 4: `gt` TYPE_FLOAT [LABEL_OPTIONAL]
- 5: `gte` TYPE_FLOAT [LABEL_OPTIONAL]
- 6: `in` TYPE_FLOAT [LABEL_REPEATED]
- 7: `not_in` TYPE_FLOAT [LABEL_REPEATED]
- 8: `ignore_empty` TYPE_BOOL [LABEL_OPTIONAL]

### Message `DoubleRules`
- 1: `const` TYPE_DOUBLE [LABEL_OPTIONAL]
- 2: `lt` TYPE_DOUBLE [LABEL_OPTIONAL]
- 3: `lte` TYPE_DOUBLE [LABEL_OPTIONAL]
- 4: `gt` TYPE_DOUBLE [LABEL_OPTIONAL]
- 5: `gte` TYPE_DOUBLE [LABEL_OPTIONAL]
- 6: `in` TYPE_DOUBLE [LABEL_REPEATED]
- 7: `not_in` TYPE_DOUBLE [LABEL_REPEATED]
- 8: `ignore_empty` TYPE_BOOL [LABEL_OPTIONAL]

### Message `Int32Rules`
- 1: `const` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `lt` TYPE_INT32 [LABEL_OPTIONAL]
- 3: `lte` TYPE_INT32 [LABEL_OPTIONAL]
- 4: `gt` TYPE_INT32 [LABEL_OPTIONAL]
- 5: `gte` TYPE_INT32 [LABEL_OPTIONAL]
- 6: `in` TYPE_INT32 [LABEL_REPEATED]
- 7: `not_in` TYPE_INT32 [LABEL_REPEATED]
- 8: `ignore_empty` TYPE_BOOL [LABEL_OPTIONAL]

### Message `Int64Rules`
- 1: `const` TYPE_INT64 [LABEL_OPTIONAL]
- 2: `lt` TYPE_INT64 [LABEL_OPTIONAL]
- 3: `lte` TYPE_INT64 [LABEL_OPTIONAL]
- 4: `gt` TYPE_INT64 [LABEL_OPTIONAL]
- 5: `gte` TYPE_INT64 [LABEL_OPTIONAL]
- 6: `in` TYPE_INT64 [LABEL_REPEATED]
- 7: `not_in` TYPE_INT64 [LABEL_REPEATED]
- 8: `ignore_empty` TYPE_BOOL [LABEL_OPTIONAL]

### Message `UInt32Rules`
- 1: `const` TYPE_UINT32 [LABEL_OPTIONAL]
- 2: `lt` TYPE_UINT32 [LABEL_OPTIONAL]
- 3: `lte` TYPE_UINT32 [LABEL_OPTIONAL]
- 4: `gt` TYPE_UINT32 [LABEL_OPTIONAL]
- 5: `gte` TYPE_UINT32 [LABEL_OPTIONAL]
- 6: `in` TYPE_UINT32 [LABEL_REPEATED]
- 7: `not_in` TYPE_UINT32 [LABEL_REPEATED]
- 8: `ignore_empty` TYPE_BOOL [LABEL_OPTIONAL]

### Message `UInt64Rules`
- 1: `const` TYPE_UINT64 [LABEL_OPTIONAL]
- 2: `lt` TYPE_UINT64 [LABEL_OPTIONAL]
- 3: `lte` TYPE_UINT64 [LABEL_OPTIONAL]
- 4: `gt` TYPE_UINT64 [LABEL_OPTIONAL]
- 5: `gte` TYPE_UINT64 [LABEL_OPTIONAL]
- 6: `in` TYPE_UINT64 [LABEL_REPEATED]
- 7: `not_in` TYPE_UINT64 [LABEL_REPEATED]
- 8: `ignore_empty` TYPE_BOOL [LABEL_OPTIONAL]

### Message `SInt32Rules`
- 1: `const` TYPE_SINT32 [LABEL_OPTIONAL]
- 2: `lt` TYPE_SINT32 [LABEL_OPTIONAL]
- 3: `lte` TYPE_SINT32 [LABEL_OPTIONAL]
- 4: `gt` TYPE_SINT32 [LABEL_OPTIONAL]
- 5: `gte` TYPE_SINT32 [LABEL_OPTIONAL]
- 6: `in` TYPE_SINT32 [LABEL_REPEATED]
- 7: `not_in` TYPE_SINT32 [LABEL_REPEATED]
- 8: `ignore_empty` TYPE_BOOL [LABEL_OPTIONAL]

### Message `SInt64Rules`
- 1: `const` TYPE_SINT64 [LABEL_OPTIONAL]
- 2: `lt` TYPE_SINT64 [LABEL_OPTIONAL]
- 3: `lte` TYPE_SINT64 [LABEL_OPTIONAL]
- 4: `gt` TYPE_SINT64 [LABEL_OPTIONAL]
- 5: `gte` TYPE_SINT64 [LABEL_OPTIONAL]
- 6: `in` TYPE_SINT64 [LABEL_REPEATED]
- 7: `not_in` TYPE_SINT64 [LABEL_REPEATED]
- 8: `ignore_empty` TYPE_BOOL [LABEL_OPTIONAL]

### Message `Fixed32Rules`
- 1: `const` TYPE_FIXED32 [LABEL_OPTIONAL]
- 2: `lt` TYPE_FIXED32 [LABEL_OPTIONAL]
- 3: `lte` TYPE_FIXED32 [LABEL_OPTIONAL]
- 4: `gt` TYPE_FIXED32 [LABEL_OPTIONAL]
- 5: `gte` TYPE_FIXED32 [LABEL_OPTIONAL]
- 6: `in` TYPE_FIXED32 [LABEL_REPEATED]
- 7: `not_in` TYPE_FIXED32 [LABEL_REPEATED]
- 8: `ignore_empty` TYPE_BOOL [LABEL_OPTIONAL]

### Message `Fixed64Rules`
- 1: `const` TYPE_FIXED64 [LABEL_OPTIONAL]
- 2: `lt` TYPE_FIXED64 [LABEL_OPTIONAL]
- 3: `lte` TYPE_FIXED64 [LABEL_OPTIONAL]
- 4: `gt` TYPE_FIXED64 [LABEL_OPTIONAL]
- 5: `gte` TYPE_FIXED64 [LABEL_OPTIONAL]
- 6: `in` TYPE_FIXED64 [LABEL_REPEATED]
- 7: `not_in` TYPE_FIXED64 [LABEL_REPEATED]
- 8: `ignore_empty` TYPE_BOOL [LABEL_OPTIONAL]

### Message `SFixed32Rules`
- 1: `const` TYPE_SFIXED32 [LABEL_OPTIONAL]
- 2: `lt` TYPE_SFIXED32 [LABEL_OPTIONAL]
- 3: `lte` TYPE_SFIXED32 [LABEL_OPTIONAL]
- 4: `gt` TYPE_SFIXED32 [LABEL_OPTIONAL]
- 5: `gte` TYPE_SFIXED32 [LABEL_OPTIONAL]
- 6: `in` TYPE_SFIXED32 [LABEL_REPEATED]
- 7: `not_in` TYPE_SFIXED32 [LABEL_REPEATED]
- 8: `ignore_empty` TYPE_BOOL [LABEL_OPTIONAL]

### Message `SFixed64Rules`
- 1: `const` TYPE_SFIXED64 [LABEL_OPTIONAL]
- 2: `lt` TYPE_SFIXED64 [LABEL_OPTIONAL]
- 3: `lte` TYPE_SFIXED64 [LABEL_OPTIONAL]
- 4: `gt` TYPE_SFIXED64 [LABEL_OPTIONAL]
- 5: `gte` TYPE_SFIXED64 [LABEL_OPTIONAL]
- 6: `in` TYPE_SFIXED64 [LABEL_REPEATED]
- 7: `not_in` TYPE_SFIXED64 [LABEL_REPEATED]
- 8: `ignore_empty` TYPE_BOOL [LABEL_OPTIONAL]

### Message `BoolRules`
- 1: `const` TYPE_BOOL [LABEL_OPTIONAL]

### Message `StringRules`
- 1: `const` TYPE_STRING [LABEL_OPTIONAL]
- 19: `len` TYPE_UINT64 [LABEL_OPTIONAL]
- 2: `min_len` TYPE_UINT64 [LABEL_OPTIONAL]
- 3: `max_len` TYPE_UINT64 [LABEL_OPTIONAL]
- 20: `len_bytes` TYPE_UINT64 [LABEL_OPTIONAL]
- 4: `min_bytes` TYPE_UINT64 [LABEL_OPTIONAL]
- 5: `max_bytes` TYPE_UINT64 [LABEL_OPTIONAL]
- 6: `pattern` TYPE_STRING [LABEL_OPTIONAL]
- 7: `prefix` TYPE_STRING [LABEL_OPTIONAL]
- 8: `suffix` TYPE_STRING [LABEL_OPTIONAL]
- 9: `contains` TYPE_STRING [LABEL_OPTIONAL]
- 23: `not_contains` TYPE_STRING [LABEL_OPTIONAL]
- 10: `in` TYPE_STRING [LABEL_REPEATED]
- 11: `not_in` TYPE_STRING [LABEL_REPEATED]
- 12: `email` TYPE_BOOL [LABEL_OPTIONAL]
- 13: `hostname` TYPE_BOOL [LABEL_OPTIONAL]
- 14: `ip` TYPE_BOOL [LABEL_OPTIONAL]
- 15: `ipv4` TYPE_BOOL [LABEL_OPTIONAL]
- 16: `ipv6` TYPE_BOOL [LABEL_OPTIONAL]
- 17: `uri` TYPE_BOOL [LABEL_OPTIONAL]
- 18: `uri_ref` TYPE_BOOL [LABEL_OPTIONAL]
- 21: `address` TYPE_BOOL [LABEL_OPTIONAL]
- 22: `uuid` TYPE_BOOL [LABEL_OPTIONAL]
- 24: `well_known_regex` TYPE_ENUM (validate.KnownRegex) [LABEL_OPTIONAL]
- 25: `strict` TYPE_BOOL [LABEL_OPTIONAL]
- 26: `ignore_empty` TYPE_BOOL [LABEL_OPTIONAL]

### Message `BytesRules`
- 1: `const` TYPE_BYTES [LABEL_OPTIONAL]
- 13: `len` TYPE_UINT64 [LABEL_OPTIONAL]
- 2: `min_len` TYPE_UINT64 [LABEL_OPTIONAL]
- 3: `max_len` TYPE_UINT64 [LABEL_OPTIONAL]
- 4: `pattern` TYPE_STRING [LABEL_OPTIONAL]
- 5: `prefix` TYPE_BYTES [LABEL_OPTIONAL]
- 6: `suffix` TYPE_BYTES [LABEL_OPTIONAL]
- 7: `contains` TYPE_BYTES [LABEL_OPTIONAL]
- 8: `in` TYPE_BYTES [LABEL_REPEATED]
- 9: `not_in` TYPE_BYTES [LABEL_REPEATED]
- 10: `ip` TYPE_BOOL [LABEL_OPTIONAL]
- 11: `ipv4` TYPE_BOOL [LABEL_OPTIONAL]
- 12: `ipv6` TYPE_BOOL [LABEL_OPTIONAL]
- 14: `ignore_empty` TYPE_BOOL [LABEL_OPTIONAL]

### Message `EnumRules`
- 1: `const` TYPE_INT32 [LABEL_OPTIONAL]
- 2: `defined_only` TYPE_BOOL [LABEL_OPTIONAL]
- 3: `in` TYPE_INT32 [LABEL_REPEATED]
- 4: `not_in` TYPE_INT32 [LABEL_REPEATED]

### Message `MessageRules`
- 1: `skip` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `required` TYPE_BOOL [LABEL_OPTIONAL]

### Message `RepeatedRules`
- 1: `min_items` TYPE_UINT64 [LABEL_OPTIONAL]
- 2: `max_items` TYPE_UINT64 [LABEL_OPTIONAL]
- 3: `unique` TYPE_BOOL [LABEL_OPTIONAL]
- 4: `items` TYPE_MESSAGE (validate.FieldRules) [LABEL_OPTIONAL]
- 5: `ignore_empty` TYPE_BOOL [LABEL_OPTIONAL]

### Message `MapRules`
- 1: `min_pairs` TYPE_UINT64 [LABEL_OPTIONAL]
- 2: `max_pairs` TYPE_UINT64 [LABEL_OPTIONAL]
- 3: `no_sparse` TYPE_BOOL [LABEL_OPTIONAL]
- 4: `keys` TYPE_MESSAGE (validate.FieldRules) [LABEL_OPTIONAL]
- 5: `values` TYPE_MESSAGE (validate.FieldRules) [LABEL_OPTIONAL]
- 6: `ignore_empty` TYPE_BOOL [LABEL_OPTIONAL]

### Message `AnyRules`
- 1: `required` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `in` TYPE_STRING [LABEL_REPEATED]
- 3: `not_in` TYPE_STRING [LABEL_REPEATED]

### Message `DurationRules`
- 1: `required` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `const` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 3: `lt` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 4: `lte` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 5: `gt` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 6: `gte` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]
- 7: `in` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_REPEATED]
- 8: `not_in` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_REPEATED]

### Message `TimestampRules`
- 1: `required` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `const` TYPE_MESSAGE (google.protobuf.Timestamp) [LABEL_OPTIONAL]
- 3: `lt` TYPE_MESSAGE (google.protobuf.Timestamp) [LABEL_OPTIONAL]
- 4: `lte` TYPE_MESSAGE (google.protobuf.Timestamp) [LABEL_OPTIONAL]
- 5: `gt` TYPE_MESSAGE (google.protobuf.Timestamp) [LABEL_OPTIONAL]
- 6: `gte` TYPE_MESSAGE (google.protobuf.Timestamp) [LABEL_OPTIONAL]
- 7: `lt_now` TYPE_BOOL [LABEL_OPTIONAL]
- 8: `gt_now` TYPE_BOOL [LABEL_OPTIONAL]
- 9: `within` TYPE_MESSAGE (google.protobuf.Duration) [LABEL_OPTIONAL]

### Enum `KnownRegex`
- 0 = `UNKNOWN`
- 1 = `HTTP_HEADER_NAME`
- 2 = `HTTP_HEADER_VALUE`

## `window_crop_info.proto`
package `insta360.messages` · syntax `proto3`

### Message `WindowCropInfo`
- 1: `src_width` TYPE_UINT32 [LABEL_OPTIONAL]
- 2: `src_height` TYPE_UINT32 [LABEL_OPTIONAL]
- 3: `dst_width` TYPE_UINT32 [LABEL_OPTIONAL]
- 4: `dst_height` TYPE_UINT32 [LABEL_OPTIONAL]
- 5: `crop_offset_x` TYPE_INT32 [LABEL_OPTIONAL]
- 6: `crop_offset_y` TYPE_INT32 [LABEL_OPTIONAL]

## `xds/annotations/v3/status.proto`
package `xds.annotations.v3` · syntax `proto3`
deps: `google/protobuf/descriptor.proto`

### Message `FileStatusAnnotation`
- 1: `work_in_progress` TYPE_BOOL [LABEL_OPTIONAL]

### Message `MessageStatusAnnotation`
- 1: `work_in_progress` TYPE_BOOL [LABEL_OPTIONAL]

### Message `FieldStatusAnnotation`
- 1: `work_in_progress` TYPE_BOOL [LABEL_OPTIONAL]

### Message `StatusAnnotation`
- 1: `work_in_progress` TYPE_BOOL [LABEL_OPTIONAL]
- 2: `package_version_status` TYPE_ENUM (xds.annotations.v3.PackageVersionStatus) [LABEL_OPTIONAL]

### Enum `PackageVersionStatus`
- 0 = `UNKNOWN`
- 1 = `FROZEN`
- 2 = `ACTIVE`
- 3 = `NEXT_MAJOR_VERSION_CANDIDATE`

## `xds/core/v3/authority.proto`
package `xds.core.v3` · syntax `proto3`
deps: `xds/annotations/v3/status.proto`, `validate/validate.proto`

### Message `Authority`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]

## `xds/core/v3/collection_entry.proto`
package `xds.core.v3` · syntax `proto3`
deps: `google/protobuf/any.proto`, `xds/annotations/v3/status.proto`, `xds/core/v3/resource_locator.proto`, `validate/validate.proto`

### Message `CollectionEntry`
- 1: `locator` TYPE_MESSAGE (xds.core.v3.ResourceLocator) [LABEL_OPTIONAL]
- 2: `inline_entry` TYPE_MESSAGE (xds.core.v3.CollectionEntry.InlineEntry) [LABEL_OPTIONAL]
- nested: InlineEntry

## `xds/core/v3/context_params.proto`
package `xds.core.v3` · syntax `proto3`
deps: `xds/annotations/v3/status.proto`

### Message `ContextParams`
- 1: `params` TYPE_MESSAGE (xds.core.v3.ContextParams.ParamsEntry) [LABEL_REPEATED]
- nested: ParamsEntry

## `xds/core/v3/extension.proto`
package `xds.core.v3` · syntax `proto3`
deps: `validate/validate.proto`, `google/protobuf/any.proto`

### Message `TypedExtensionConfig`
- 1: `name` TYPE_STRING [LABEL_OPTIONAL]
- 2: `typed_config` TYPE_MESSAGE (google.protobuf.Any) [LABEL_OPTIONAL]

## `xds/core/v3/resource_locator.proto`
package `xds.core.v3` · syntax `proto3`
deps: `xds/annotations/v3/status.proto`, `xds/core/v3/context_params.proto`, `validate/validate.proto`

### Message `ResourceLocator`
- 1: `scheme` TYPE_ENUM (xds.core.v3.ResourceLocator.Scheme) [LABEL_OPTIONAL]
- 2: `id` TYPE_STRING [LABEL_OPTIONAL]
- 3: `authority` TYPE_STRING [LABEL_OPTIONAL]
- 4: `resource_type` TYPE_STRING [LABEL_OPTIONAL]
- 5: `exact_context` TYPE_MESSAGE (xds.core.v3.ContextParams) [LABEL_OPTIONAL]
- 6: `directives` TYPE_MESSAGE (xds.core.v3.ResourceLocator.Directive) [LABEL_REPEATED]
- nested: Directive

## `xds/type/matcher/v3/matcher.proto`
package `xds.type.matcher.v3` · syntax `proto3`
deps: `xds/annotations/v3/status.proto`, `xds/core/v3/extension.proto`, `xds/type/matcher/v3/string.proto`, `validate/validate.proto`

### Message `Matcher`
- 1: `matcher_list` TYPE_MESSAGE (xds.type.matcher.v3.Matcher.MatcherList) [LABEL_OPTIONAL]
- 2: `matcher_tree` TYPE_MESSAGE (xds.type.matcher.v3.Matcher.MatcherTree) [LABEL_OPTIONAL]
- 3: `on_no_match` TYPE_MESSAGE (xds.type.matcher.v3.Matcher.OnMatch) [LABEL_OPTIONAL]
- nested: OnMatch, MatcherList, MatcherTree

## `xds/type/matcher/v3/regex.proto`
package `xds.type.matcher.v3` · syntax `proto3`
deps: `validate/validate.proto`

### Message `RegexMatcher`
- 1: `google_re2` TYPE_MESSAGE (xds.type.matcher.v3.RegexMatcher.GoogleRE2) [LABEL_OPTIONAL]
- 2: `regex` TYPE_STRING [LABEL_OPTIONAL]
- nested: GoogleRE2

## `xds/type/matcher/v3/string.proto`
package `xds.type.matcher.v3` · syntax `proto3`
deps: `xds/type/matcher/v3/regex.proto`, `validate/validate.proto`

### Message `StringMatcher`
- 1: `exact` TYPE_STRING [LABEL_OPTIONAL]
- 2: `prefix` TYPE_STRING [LABEL_OPTIONAL]
- 3: `suffix` TYPE_STRING [LABEL_OPTIONAL]
- 5: `safe_regex` TYPE_MESSAGE (xds.type.matcher.v3.RegexMatcher) [LABEL_OPTIONAL]
- 7: `contains` TYPE_STRING [LABEL_OPTIONAL]
- 6: `ignore_case` TYPE_BOOL [LABEL_OPTIONAL]

### Message `ListStringMatcher`
- 1: `patterns` TYPE_MESSAGE (xds.type.matcher.v3.StringMatcher) [LABEL_REPEATED]
