# GCP Detector Configuration Guide

## Parameters

### Color Detection Settings

#### White Detection Range
- `whiteThreshold.min`: Minimum HSV values for white detection [H, S, V]
- `whiteThreshold.max`: Maximum HSV values for white detection [H, S, V]
- Default: min=[0, 0, 170], max=[180, 100, 255]
- Adjusts sensitivity to white markers

#### Black Detection Range
- `blackThreshold.min`: Minimum HSV values for black detection [H, S, V]
- `blackThreshold.max`: Maximum HSV values for black detection [H, S, V]
- Default: min=[0, 0, 0], max=[180, 255, 130]
- Controls detection of black regions around markers

### Size and Distance Settings

#### Minimum Marker Size
- `minMarkerArea`: Minimum area (in pixels) for a marker to be considered
- Default: 100
- Increase for high-resolution images or to filter noise
- Decrease for small or distant markers

#### Maximum Area Difference
- `maxAreaDifference`: Maximum allowed difference in area between paired markers
- Default: 500
- Helps ensure paired markers are similar in size

### Marker Pair Settings
- `pairCriteria.minRatio`: Minimum height/width ratio (0.3)
- `pairCriteria.maxRatio`: Maximum height/width ratio (3.0)
- `pairCriteria.maxDistance`: Maximum distance between paired markers (60 pixels)

### Verification Settings
- `minBlackPixels`: Minimum black pixels required for GCP verification
- Default: 5
- Increase for stricter verification

## Usage Example

