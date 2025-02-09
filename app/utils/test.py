import cv2 as cv
import numpy as np
import matplotlib.pyplot as plt

def euclidean_distance(pt1, pt2):
    return np.sqrt((pt1[0] - pt2[0])**2 + (pt1[1] - pt2[1])**2)

def get_centroid(contour):
    M = cv.moments(contour)
    if M["m00"] == 0:
        return None
    cx = int(M["m10"] / M["m00"])
    cy = int(M["m01"] / M["m00"])
    return (cx, cy)

# Load the image
image_path = "C:/Users/YASH/Downloads/DSC01597_geotag.JPG"  # Change this to your image path
image = cv.imread(image_path)
if image is None:
    raise ValueError("Error loading image. Check the file path.")

# Convert image to HSV color space
hsv = cv.cvtColor(image, cv.COLOR_BGR2HSV)

# Define color range for white detection
lower_white = np.array([0, 0, 170])
upper_white = np.array([180, 100, 255])

# Define color range for black detection (loose condition)
lower_black = np.array([0, 0, 0])
upper_black = np.array([180, 255, 130])

# Create masks for white and black detection
white_mask = cv.inRange(hsv, lower_white, upper_white)
black_mask = cv.inRange(hsv, lower_black, upper_black)

# Find contours of detected white areas
white_contours, _ = cv.findContours(white_mask, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

# Filter contours based on area to remove noise
min_area = 100  # Minimum contour area threshold
white_contours = [cnt for cnt in white_contours if cv.contourArea(cnt) > min_area]

# Find centroids of white regions
white_centroids = [get_centroid(cnt) for cnt in white_contours]

# Find potential GCP pairs
potential_gcp_pairs = []
for i, (cnt1, c1) in enumerate(zip(white_contours, white_centroids)):
    if c1 is None:
        continue
    for j, (cnt2, c2) in enumerate(zip(white_contours, white_centroids)):
        if i >= j or c2 is None:
            continue  # Avoid duplicate comparisons

        # Ensure similar sizes
        if abs(cv.contourArea(cnt1) - cv.contourArea(cnt2)) > 500:
            continue

        # Check diagonal placement using centroids
        dx, dy = abs(c1[0] - c2[0]), abs(c1[1] - c2[1])
        if 0.3 < (dy / (dx + 1e-6)) < 3:
            if euclidean_distance(c1, c2) < 60:
                potential_gcp_pairs.append((cnt1, cnt2))

# Check for black areas around detected GCPs
final_gcp_pairs = []
for cnt1, cnt2 in potential_gcp_pairs:
    mask = np.zeros_like(white_mask)
    cv.drawContours(mask, [cnt1, cnt2], -1, 255, thickness=5)  # Check nearby regions
    black_count = cv.countNonZero(cv.bitwise_and(mask, black_mask))
    if black_count > 5:  # Ensure some dark areas are present
        final_gcp_pairs.append((cnt1, cnt2))

# If no GCP pairs are found, return all white detections
# if not final_gcp_pairs:
#     final_gcp_pairs = [(cnt,) for cnt in white_contours]

# Draw detected GCPs
canvas = image.copy()
for pair in final_gcp_pairs:
    for cnt in pair:
        cv.drawContours(canvas, [cnt], -1, (0, 0, 255), thickness=2)

# Show the extracted white region boundaries
plt.imshow(cv.cvtColor(canvas, cv.COLOR_BGR2RGB))
plt.axis("off")
plt.show()

# Optional: Save the result
# cv.imwrite("C:/Users/YASH/Downloads/white_detected.png", canvas)
