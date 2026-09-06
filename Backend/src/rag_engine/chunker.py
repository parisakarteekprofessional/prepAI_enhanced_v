import re
from typing import List, Dict, Any

HEADING_PATTERN = re.compile(
    r'^(?:#+\s+.+|[A-Z0-9\.\s]{3,50}:|[0-9]+\.[0-9]*\s+[A-Z].+|[A-Z\s]{4,40}$)',
    re.MULTILINE
)

def find_nearest_heading(text: str, default: str = "Section") -> str:
    matches = list(HEADING_PATTERN.finditer(text))
    if matches:
        # Return the first or most prominent heading
        candidate = matches[0].group().strip().lstrip("#").strip()
        if len(candidate) > 2 and len(candidate) <= 60:
            return candidate
    return default

def split_text_semantically(
    text: str,
    target_char_size: int = 2000,
    overlap_char_size: int = 300
) -> List[str]:
    """
    Splits text semantically respecting paragraph boundaries, sentences, and words.
    """
    clean = text.strip()
    if not clean:
        return []

    if len(clean) <= target_char_size:
        return [clean]

    paragraphs = clean.split("\n\n")
    chunks = []
    current_chunk = []
    current_len = 0

    for para in paragraphs:
        p = para.strip()
        if not p:
            continue

        p_len = len(p)

        # If a single paragraph exceeds target_char_size, split by sentences
        if p_len > target_char_size:
            sentences = re.split(r'(?<=[.?!])\s+', p)
            for s in sentences:
                s_clean = s.strip()
                if not s_clean:
                    continue
                if current_len + len(s_clean) > target_char_size and current_chunk:
                    chunks.append(" ".join(current_chunk))
                    # Overlap: keep last sentence if reasonable
                    if len(current_chunk[-1]) <= overlap_char_size:
                        current_chunk = [current_chunk[-1], s_clean]
                        current_len = sum(len(x) for x in current_chunk) + 1
                    else:
                        current_chunk = [s_clean]
                        current_len = len(s_clean)
                else:
                    current_chunk.append(s_clean)
                    current_len += len(s_clean) + 1
            continue

        if current_len + p_len > target_char_size and current_chunk:
            combined = "\n\n".join(current_chunk)
            chunks.append(combined)

            # Keep trailing overlap
            if len(current_chunk[-1]) <= overlap_char_size:
                current_chunk = [current_chunk[-1], p]
                current_len = sum(len(x) for x in current_chunk) + 2
            else:
                current_chunk = [p]
                current_len = p_len
        else:
            current_chunk.append(p)
            current_len += p_len + 2

    if current_chunk:
        chunks.append("\n\n".join(current_chunk))

    return chunks


def chunk_document_pages(
    pages_data: List[Dict[str, Any]],
    doc_metadata: Dict[str, Any],
    target_char_size: int = 2000,
    overlap_char_size: int = 300
) -> List[Dict[str, Any]]:
    """
    Chunks a list of pages into indexed chunks retaining pageNumber, section,
    documentId, and userId metadata.
    """
    all_chunks = []
    chunk_index = 0
    document_id = doc_metadata.get("documentId", "")
    user_id = doc_metadata.get("userId", "")
    file_name = doc_metadata.get("originalFileName", "Document")

    last_known_heading = f"Page 1 Overview"

    for page in pages_data:
        page_num = page.get("pageNumber", 1)
        text = page.get("text", "").strip()
        if not text:
            continue

        # Look for headings on this page
        page_heading = find_nearest_heading(text, default=last_known_heading)
        last_known_heading = page_heading

        page_chunks = split_text_semantically(
            text,
            target_char_size=target_char_size,
            overlap_char_size=overlap_char_size
        )

        for pc in page_chunks:
            chunk_heading = find_nearest_heading(pc, default=page_heading)

            all_chunks.append({
                "id": f"{document_id}_chunk_{chunk_index}",
                "text": pc,
                "metadata": {
                    "documentId": str(document_id),
                    "userId": str(user_id),
                    "pageNumber": int(page_num),
                    "chunkIndex": int(chunk_index),
                    "section": str(chunk_heading[:80]),
                    "sourceFileName": str(file_name[:120])
                }
            })
            chunk_index += 1

    return all_chunks
