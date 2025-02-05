declare const cv: any;

export interface CoordsXY {
  x: number;
  y: number;
}

const classifiers = [
  // "haarcascade_eye.xml"
  "gcp-square-base.xml",
  "gcp-bw-quads.xml",
];

let areClassifiersLoaded = false;

async function loadClassifiers() {
  console.log("Starting classifier loading process...");

  for (const classifierName of classifiers) {
    try {
      console.log(`Fetching classifier: ${classifierName}`);
      const response = await fetch(`/classifiers/${classifierName}`);
      console.log(`Received response for ${classifierName}:`, response.status);

      const buffer = await response.arrayBuffer();
      const data = new Uint8Array(buffer);

      console.log(
        `Loading classifier data for ${classifierName} into OpenCV...`
      );
      cv.FS_createDataFile("/", classifierName, data, true, false, false);
      console.log(`Classifier ${classifierName} loaded successfully`);
    } catch (error) {
      console.error(`Error loading classifier ${classifierName}:`, error);
      throw error;
    }
  }

  areClassifiersLoaded = true;
  console.log("All classifiers loaded successfully");
}

export async function detectGCP(
  imageElement: HTMLImageElement
): Promise<CoordsXY | null> {
  console.log("Starting GCP detection process...");

  if (!areClassifiersLoaded) {
    console.log("Loading classifiers for the first time...");
    await loadClassifiers();
  }

  try {
    console.log("Reading image into OpenCV format...");
    const img = cv.imread(imageElement);
    console.log("Image loaded with dimensions:", img.size());

    const scale = 1.05;
    const neighbors = 3;
    const minSize = new cv.Size(30, 30);
    const maxSize = new cv.Size(0, 0);

    console.log("Detection parameters:", {
      scale,
      neighbors,
      minSize,
      maxSize,
    });

    let result = null;

    for (const classifierName of classifiers) {
      console.log(`Attempting detection with classifier: ${classifierName}`);
      const classifier = new cv.CascadeClassifier();
      const rects = new cv.RectVector();

      classifier.load(`/${classifierName}`);

      console.log(`Is classifier empty? ${classifier.empty()}`);
      if (classifier.empty()) {
        throw new Error(`Failed to load classifier: ${classifierName}`);
      }
      // const gray = new cv.Mat();
      // cv.cvtColor(img, gray, cv.COLOR_RGBA2GRAY, 0);
      // cv.equalizeHist(gray, gray); // Enhance contrast

      // console.log("Running detectMultiScale...");
      const scale = 1.1; // Reduce from 1.05
      const neighbors = 5; // Increase for stricter detection
      // const minSize = new cv.Size(50, 50); // Avoid too-small detections
      // const maxSize = new cv.Size(300, 300); // Prevent massive regions

      classifier.detectMultiScale(
        img,
        rects,
        scale,
        neighbors,
        0,
        minSize,
        maxSize
      );
      console.log(`Found ${rects.size()} potential GCP matches`);

      if (rects.size() > 0) {
        const rect = rects.get(0);
        result = {
          x: rect.x + rect.width / 2,
          y: rect.y + rect.height / 2,
        };

        console.log("GCP detected at:", result);
        console.log("Rectangle dimensions:", rect);
        rects.delete();
        classifier.delete();
        break;
      }

      console.log("No GCP found with this classifier, trying next...");
      rects.delete();
      classifier.delete();
    }

    img.delete();
    console.log(
      result ? "Detection completed successfully" : "No GCP detected in image"
    );
    return result;
  } catch (error) {
    console.error("Error in GCP detection:", error);
    return null;
  }
}
