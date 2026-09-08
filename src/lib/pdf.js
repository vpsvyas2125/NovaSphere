import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc =
  new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString()

export async function extractPdfText(file) {
  if (!file) {
    throw new Error('No PDF file was selected.')
  }

  if (file.type !== 'application/pdf') {
    throw new Error('Please select a valid PDF file.')
  }

  const arrayBuffer = await file.arrayBuffer()

  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
  }).promise

  let fullText = ''

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber)

    const textContent = await page.getTextContent()

    const pageText = textContent.items
      .map((item) => item.str || '')
      .join(' ')

    if (pageText.trim()) {
      fullText += `\n\n--- Page ${pageNumber} ---\n\n`
      fullText += pageText
    }
  }

  const cleanedText = fullText
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleanedText) {
    throw new Error(
      'No selectable text was found in this PDF. Scanned or image-only PDFs are not supported yet.'
    )
  }

  return {
    text: cleanedText,
    pageCount: pdf.numPages,
  }
}