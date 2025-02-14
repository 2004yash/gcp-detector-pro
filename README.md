# GCP Detector Pro

A Next.js application for detecting and processing Ground Control Points (GCPs) in aerial imagery.

## Overview

GCP Detector Pro is a web-based tool that helps identify and validate Ground Control Points in aerial photography and drone imagery. It uses computer vision techniques to detect black and white markers commonly used as GCPs in photogrammetry and mapping applications.

## Key Features

- Automated detection of black and white GCP markers
- Real-time marker validation
- Configurable detection parameters
- Web-based interface for easy access
- Support for multiple image formats

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to access the GCP Detector interface.

## Configuration

The detector can be fine-tuned using various parameters. See the [configuration guide](./app/docs/configuration.md) for detailed information about:

- Color detection thresholds
- Marker size requirements
- Pair matching criteria
- Verification settings

## Technical Details

This project is built with:
- Next.js 14
- React
- TypeScript
- Computer Vision algorithms for marker detection

## Learn More

- Check the [configuration documentation](./app/docs/configuration.md) for detailed setup
- Visit our [GitHub repository](https://github.com/yourusername/gcp-detector-pro) for source code
- Report issues or contribute to the project

## License

MIT License - See LICENSE file for details
