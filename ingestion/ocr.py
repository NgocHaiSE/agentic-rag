"""Utility helpers for running OCR on uploaded documents using Tesseract."""
from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple

try:
    import pytesseract
    from pytesseract import TesseractError, TesseractNotFoundError
except ImportError as exc:  # pragma: no cover - handled at runtime
    pytesseract = None  # type: ignore
    TesseractError = RuntimeError  # type: ignore
    TesseractNotFoundError = RuntimeError  # type: ignore

try:
    from PIL import Image
except ImportError as exc:  # pragma: no cover - handled at runtime
    Image = None  # type: ignore

try:
    from pdf2image import convert_from_path
except ImportError:  # pragma: no cover - optional dep until OCR is invoked
    convert_from_path = None  # type: ignore

try:
    from pypdf import PdfReader
except ImportError:  # pragma: no cover - optional until PDF OCR is needed
    PdfReader = None  # type: ignore

logger = logging.getLogger(__name__)

SUPPORTED_IMAGE_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".tif",
    ".tiff",
    ".bmp",
    ".gif",
}
SUPPORTED_PDF_EXTENSIONS = {".pdf"}
SUPPORTED_EXTENSIONS = SUPPORTED_IMAGE_EXTENSIONS | SUPPORTED_PDF_EXTENSIONS

_DEFAULT_LANG = os.getenv("OCR_LANGUAGES", "vie+eng")
_FALLBACK_LANG = os.getenv("OCR_FALLBACK_LANGUAGES", "eng")
_TESS_CONFIG = os.getenv("OCR_TESSERACT_CONFIG", "")
_PDF_DPI = int(os.getenv("OCR_PDF_DPI", "300"))


class OCRError(RuntimeError):
    """Raised when OCR processing fails."""


@dataclass
class OCRResult:
    """Container for OCR output."""

    text: str
    metadata: Dict[str, Any]


def is_supported(path: str | Path) -> bool:
    """Return True if the file extension is OCR-capable."""
    suffix = Path(path).suffix.lower()
    return suffix in SUPPORTED_EXTENSIONS


def extract_text(path: str | Path, languages: Optional[str] = None) -> OCRResult:
    """Extract text from an OCR-capable file using Tesseract.

    Args:
        path: Path to the file to process.
        languages: Optional language hint(s) for Tesseract (for example "vie+eng").

    Returns:
        OCRResult containing extracted text plus metadata about the process.

    Raises:
        FileNotFoundError: If the provided path does not exist.
        OCRError: If OCR fails or dependencies are missing.
    """
    file_path = Path(path)
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    _ensure_dependencies(file_path)

    suffix = file_path.suffix.lower()
    if suffix in SUPPORTED_IMAGE_EXTENSIONS:
        return _extract_from_image(file_path, languages)
    if suffix in SUPPORTED_PDF_EXTENSIONS:
        return _extract_from_pdf(file_path, languages)

    raise OCRError(f"Unsupported file type for OCR: {suffix}")


def _extract_from_image(path: Path, languages: Optional[str]) -> OCRResult:
    """Run OCR on a raster image."""
    candidates = _resolve_language_attempts(languages)
    with Image.open(path) as image:
        text, used_lang = _run_tesseract(image, candidates)
    metadata = {
        "engine": "tesseract",
        "source": "image",
        "languages": used_lang,
        "used_ocr": True,
    }
    return OCRResult(text=text, metadata=metadata)


def _extract_from_pdf(path: Path, languages: Optional[str]) -> OCRResult:
    """Extract text from a PDF via direct text first, then OCR as needed."""
    # Step 1: try direct text extraction if pypdf is available.
    if PdfReader is not None:
        try:
            reader = PdfReader(str(path))
            direct_chunks: List[str] = []
            for index, page in enumerate(reader.pages):
                try:
                    chunk = page.extract_text() or ""
                except Exception as exc:  # pragma: no cover - edge case logging
                    logger.debug("Failed to extract text from PDF page %s: %s", index, exc)
                    chunk = ""
                if chunk.strip():
                    direct_chunks.append(chunk.strip())
            direct_text = "\n\n".join(direct_chunks).strip()
            if direct_text:
                metadata = {
                    "engine": "pypdf",
                    "source": "pdf_text",
                    "page_count": len(reader.pages),
                    "used_ocr": False,
                }
                return OCRResult(text=direct_text, metadata=metadata)
        except Exception as exc:  # pragma: no cover - fallback will handle
            logger.debug("Direct PDF text extraction failed for %s: %s", path, exc)

    # Step 2: fallback to page-by-page OCR.
    if convert_from_path is None:
        raise OCRError(
            "pdf2image is required for OCR on PDF files. Install pdf2image or "
            "provide a PDF with selectable text."
        )

    images = convert_from_path(str(path), dpi=_PDF_DPI)
    if not images:
        raise OCRError("No pages found in PDF for OCR processing.")

    candidates = _resolve_language_attempts(languages)
    ocr_text_chunks: List[str] = []
    used_languages: List[str] = []
    try:
        for idx, image in enumerate(images):
            text, lang_used = _run_tesseract(image, candidates)
            ocr_text_chunks.append(text)
            used_languages.append(lang_used)
            logger.debug("OCR complete for PDF page %s using lang '%s'", idx, lang_used)
    finally:
        for image in images:
            try:
                image.close()
            except Exception:  # pragma: no cover - best effort cleanup
                pass

    combined_text = "\n\n".join(chunk.strip() for chunk in ocr_text_chunks if chunk.strip()).strip()
    metadata = {
        "engine": "tesseract",
        "source": "pdf_ocr",
        "page_count": len(images),
        "languages": _dedupe_preserve_order(used_languages),
        "used_ocr": True,
    }
    return OCRResult(text=combined_text, metadata=metadata)


def _run_tesseract(image: "Image.Image", candidates: Sequence[str]) -> Tuple[str, str]:
    """Run Tesseract against an image trying multiple language options."""
    if pytesseract is None:
        raise OCRError("pytesseract is not installed. Please add pytesseract to requirements.")

    prepared = image.convert("RGB") if image.mode not in ("L", "RGB") else image
    errors: List[str] = []
    for lang in candidates:
        kwargs = {"lang": lang}
        if _TESS_CONFIG:
            kwargs["config"] = _TESS_CONFIG
        try:
            text = pytesseract.image_to_string(prepared, **kwargs)
            return text.strip(), lang
        except TesseractNotFoundError as exc:  # pragma: no cover - env issue
            raise OCRError(
                "Tesseract binary not found. Ensure Tesseract OCR is installed and "
                "available on PATH."
            ) from exc
        except TesseractError as exc:
            error_msg = f"lang='{lang}' -> {exc}" if lang else str(exc)
            errors.append(error_msg)
            logger.debug("Tesseract failed for %s: %s", lang or "default", exc)

    raise OCRError("Tesseract failed for all language candidates: " + "; ".join(errors))


def _resolve_language_attempts(languages: Optional[str]) -> List[str]:
    """Return a list of language candidate strings for Tesseract attempts."""
    attempts = _split_languages(languages or _DEFAULT_LANG)
    fallbacks = _split_languages(_FALLBACK_LANG)
    for fallback in fallbacks:
        if fallback and fallback not in attempts:
            attempts.append(fallback)
    if not attempts:
        attempts.append("eng")
    return attempts


def _split_languages(spec: Optional[str]) -> List[str]:
    if not spec:
        return []
    normalized = spec.replace(";", ",")
    return [token.strip() for token in normalized.split(",") if token.strip()]


def _dedupe_preserve_order(items: Sequence[str]) -> List[str]:
    seen = set()
    result: List[str] = []
    for item in items:
        if item and item not in seen:
            seen.add(item)
            result.append(item)
    return result


def _ensure_dependencies(path: Path) -> None:
    """Raise informative errors when OCR dependencies are missing."""
    suffix = path.suffix.lower()
    if Image is None:
        raise OCRError("Pillow is required for OCR but is not installed.")
    if suffix in SUPPORTED_EXTENSIONS and pytesseract is None:
        raise OCRError("pytesseract is required for OCR but is not installed.")
    if suffix in SUPPORTED_PDF_EXTENSIONS and convert_from_path is None and PdfReader is None:
        raise OCRError(
            "PDF OCR requested but neither pdf2image nor pypdf is available. Install "
            "pdf2image (for raster OCR) and/or pypdf (for direct text extraction)."
        )


__all__ = [
    "extract_text",
    "is_supported",
    "OCRError",
    "OCRResult",
    "SUPPORTED_EXTENSIONS",
    "SUPPORTED_IMAGE_EXTENSIONS",
    "SUPPORTED_PDF_EXTENSIONS",
]
