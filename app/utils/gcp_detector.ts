declare const cv: any;

export interface CoordsXY {
  x: number;
  y: number;
}

/**
 * Calculates Euclidean distance between two points.
 */
function euclideanDistance(pt1: CoordsXY, pt2: CoordsXY): number {
  return Math.sqrt(Math.pow(pt1.x - pt2.x, 2) + Math.pow(pt1.y - pt2.y, 2));
}

/**
 * Computes the centroid of a contour.
 */
function getCentroid(contour: any): CoordsXY | null {
  const moments = cv.moments(contour);
  if (moments.m00 === 0) return null;
  return {
    x: Math.round(moments.m10 / moments.m00),
    y: Math.round(moments.m01 / moments.m00),
  };
}

/**
 * Detects GCPs in an image using white and black region detection.
 */
export function detectGCP(imageElement: HTMLImageElement): CoordsXY[] | null {
  console.log('Starting GCP detection');
  let img = cv.imread(imageElement);

  // Convert to HSV
  let hsv = new cv.Mat();
  cv.cvtColor(img, hsv, cv.COLOR_RGB2HSV);

  // Define color thresholds
  let lowerWhite = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [0, 0, 170, 0]);
  let upperWhite = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [180, 100, 255, 255]);
  let lowerBlack = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [0, 0, 0, 0]);
  let upperBlack = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [180, 255, 130, 255]);

  // Create masks
  let whiteMask = new cv.Mat();
  let blackMask = new cv.Mat();
  cv.inRange(hsv, lowerWhite, upperWhite, whiteMask);
  cv.inRange(hsv, lowerBlack, upperBlack, blackMask);

  // Find white contours
  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  cv.findContours(whiteMask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  let minArea = 100;
  let whiteContours: any[] = [];
  let whiteCentroids: CoordsXY[] = [];

  for (let i = 0; i < contours.size(); i++) {
    let cnt = contours.get(i);
    let area = cv.contourArea(cnt);
    if (area > minArea) {
      let centroid = getCentroid(cnt);
      if (centroid) {
        whiteContours.push(cnt);
        whiteCentroids.push(centroid);
      }
    }
  }

  // Find potential GCP pairs
  let potentialGcpPairs: any[] = [];
  for (let i = 0; i < whiteContours.length; i++) {
    for (let j = i + 1; j < whiteContours.length; j++) {
      let c1 = whiteCentroids[i];
      let c2 = whiteCentroids[j];

      if (Math.abs(cv.contourArea(whiteContours[i]) - cv.contourArea(whiteContours[j])) > 500) continue;

      let dx = Math.abs(c1.x - c2.x);
      let dy = Math.abs(c1.y - c2.y);
      if (0.3 < dy / (dx + 1e-6) && dy / (dx + 1e-6) < 3 && euclideanDistance(c1, c2) < 60) {
        potentialGcpPairs.push([whiteContours[i], whiteContours[j]]);
      }
    }
  }

  // Check for black areas around detected GCPs
  let finalGcpPairs: any[] = [];
  for (let [cnt1, cnt2] of potentialGcpPairs) {
    let mask = new cv.Mat.zeros(whiteMask.rows, whiteMask.cols, cv.CV_8UC1);
    
    // Draw contours
    let pairVector = new cv.MatVector();
    pairVector.push_back(cnt1);
    pairVector.push_back(cnt2);
    cv.drawContours(mask, pairVector, -1, new cv.Scalar(255), 5);

    // Perform bitwise AND operation (EXACTLY like Python)
    let blackMaskROI = new cv.Mat();
    cv.bitwise_and(mask, blackMask, blackMaskROI);
    let blackCount = cv.countNonZero(blackMaskROI);

    if (blackCount > 5) {  // Strict black check (same as Python)
      finalGcpPairs.push([cnt1, cnt2]);
    }

    // Cleanup
    pairVector.delete();
    mask.delete();
    blackMaskROI.delete();
  }

  // Collect final results
  let results: CoordsXY[] = [];
  if (finalGcpPairs.length === 0) {
    console.log('No pairs found, using individual contours');
    results = whiteCentroids;
  } else {
    console.log('Processing GCP pairs');
    for (let [cnt1, cnt2] of finalGcpPairs) {
      let c1 = getCentroid(cnt1);
      let c2 = getCentroid(cnt2);
      if (c1 && c2) {
        results.push({
          x: Math.round((c1.x + c2.x) / 2),
          y: Math.round((c1.y + c2.y) / 2),
        });
      }
    }
  }

  // Cleanup
  img.delete();
  hsv.delete();
  whiteMask.delete();
  blackMask.delete();
  contours.delete();
  hierarchy.delete();
  lowerWhite.delete();
  upperWhite.delete();
  lowerBlack.delete();
  upperBlack.delete();

  console.log('Detection complete, found', results.length, 'points');
  return results.length > 0 ? results : null;
}
