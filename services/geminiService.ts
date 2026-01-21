import type { ImageFile } from '../types';
import { resizeImage } from '../utils/fileUtils';

const GENERATION_INPUT_MAX_DIMENSION = 1024;

export async function generateStyleDescription(images: ImageFile[], textDescription?: string): Promise<string> {
  // Resize images before sending to API
  const resizedImages = await Promise.all(
    images.map(image => resizeImage(image, GENERATION_INPUT_MAX_DIMENSION))
  );

  const response = await fetch('/api/generate-style', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ images: resizedImages, textDescription })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate style description');
  }

  const data = await response.json();
  return data.styleDescription;
}

export async function generateStyleDescriptionFromText(textDescription: string): Promise<string> {
  const response = await fetch('/api/generate-style', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ images: [], textDescription })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate style description from text');
  }

  const data = await response.json();
  return data.styleDescription;
}

export async function generateImagesWithReference(
    prompt: string,
    referenceImages: ImageFile[],
    numberOfImages: number = 1,
    compositionImage: ImageFile | null = null,
    subjectReferenceImages: ImageFile[] = []
): Promise<string[]> {
  // Resize all images before sending
  const resizedReferenceImages = await Promise.all(
    referenceImages.map(image => resizeImage(image, GENERATION_INPUT_MAX_DIMENSION))
  );

  const resizedSubjectImages = await Promise.all(
    subjectReferenceImages.map(image => resizeImage(image, GENERATION_INPUT_MAX_DIMENSION))
  );

  const resizedCompositionImage = compositionImage
    ? await resizeImage(compositionImage, GENERATION_INPUT_MAX_DIMENSION)
    : null;

  const response = await fetch('/api/generate-images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      referenceImages: resizedReferenceImages,
      numberOfImages,
      compositionImage: resizedCompositionImage,
      subjectReferenceImages: resizedSubjectImages
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate images');
  }

  const data = await response.json();
  return data.images;
}

export async function generateImagesWithImagen(
  prompt: string,
  numberOfImages: number = 1,
  aspectRatio: string = '1:1'
): Promise<string[]> {
  const response = await fetch('/api/generate-images-imagen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, numberOfImages, aspectRatio })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate images with Imagen');
  }

  const data = await response.json();
  return data.images;
}

export async function generateStyleSuggestions(
  referenceImages: ImageFile[],
  generatedImage: ImageFile,
  currentStyleDescription: string,
  currentPositivePrompt: string,
  currentNegativePrompt: string
): Promise<{ suggestedStyleDescription: string; suggestedPositivePrompt: string; suggestedNegativePrompt: string }> {
  // Resize generated image before sending
  const resizedGeneratedImage = await resizeImage(generatedImage, GENERATION_INPUT_MAX_DIMENSION);

  const response = await fetch('/api/generate-suggestions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      referenceImages,
      generatedImage: resizedGeneratedImage,
      currentStyleDescription,
      currentPositivePrompt,
      currentNegativePrompt
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate suggestions');
  }

  return response.json();
}

export async function editImageWithMask(
    prompt: string,
    image: ImageFile,
    mask: ImageFile,
    styleDescription: string
): Promise<string> {
  const response = await fetch('/api/edit-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, image, mask, styleDescription })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to edit image');
  }

  const data = await response.json();
  return data.image;
}
