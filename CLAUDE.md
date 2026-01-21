# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-powered image generation and style transfer application built with React, TypeScript, and Vite. It uses Google's Gemini API for style analysis and image generation.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server on http://localhost:3000
npm run build        # Build for production
npm run preview      # Preview production build
```

## Environment Setup

Set `GEMINI_API_KEY` in `.env.local` file. The Vite config maps this to `process.env.API_KEY`.

## Architecture

### Core Data Flow

1. **Style Analysis**: User uploads reference images → `geminiService.generateStyleDescription()` extracts structured "Style DNA" JSON → stored as `styleDescription`
2. **Image Generation**: Style DNA + subject prompt + optional references → `generateImagesWithReference()` (Gemini) or `generateImagesWithImagen()` (Imagen) → generated images displayed
3. **Refinement Loop**: After generation, `generateStyleSuggestions()` compares output to references and suggests prompt improvements

### Key Files

- [App.tsx](App.tsx) - Main component; manages all application state (uploaded images, style description, generation history, modal states) and orchestrates the generation workflow
- [services/geminiService.ts](services/geminiService.ts) - All Gemini/Imagen API interactions:
  - `generateStyleDescription()` - Analyzes images to extract structured style JSON
  - `generateImagesWithReference()` - Gemini-2.5-flash-image generation with style/subject/composition references
  - `generateImagesWithImagen()` - Imagen-4.0 text-to-image generation
  - `generateStyleSuggestions()` - Post-generation style refinement suggestions
  - `editImageWithMask()` - Inpainting with style preservation
- [types.ts](types.ts) - TypeScript definitions for `ImageFile`, `GenerationSession`, `GenerationModel`
- [utils/fileUtils.ts](utils/fileUtils.ts) - Base64 conversion and image resizing utilities

### Component Structure

- **AssetLibrary** - Left panel: image uploads, style analysis, prompt inputs
- **GenerationView** - Main panel: subject prompt, generation controls, results display, history
- **Modals**: `StyleAnalysisModal`, `SuggestionsModal`, `SubjectReferenceModal`, `CompositionReferenceModal`, `ImageEditorModal`, `FullscreenViewer`

### Generation Models

- `gemini-2.5-flash-image` - Supports style references, subject references, composition references, mask editing
- `imagen-4.0-generate-001` - Text-to-image only, incorporates style description into prompt

### State Management

All state lives in App.tsx using React hooks. Key state groups:
- **Input state**: `uploadedImages`, `styleDescription`, `subjectPrompt`, `supportivePrompt`, `negativePrompt`
- **Reference state**: `compositionReferenceImage`, `subjectReferenceImages`
- **Output state**: `generatedImages`, `generationHistory`
- **UI state**: Modal visibility flags, loading states, error messages

### Image Processing

Images are processed as base64 strings. Before API calls, images are resized to max 1024px dimension via `resizeImage()` to stay within API limits.
