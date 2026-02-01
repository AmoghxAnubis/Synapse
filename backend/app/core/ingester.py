import pypdf
from fastapi import UploadFile
import io

class FileIngester:
    @staticmethod
    async def parse_file(file: UploadFile) -> str:
        """
        Extracts text from uploaded files (PDF or TXT).
        """
        filename = file.filename.lower()
        content = await file.read()
        
        # 1. Handle PDF
        if filename.endswith(".pdf"):
            return FileIngester._read_pdf(content)
        
        # 2. Handle Text/Code
        elif filename.endswith(".txt") or filename.endswith(".md") or filename.endswith(".py"):
            return content.decode("utf-8")
            
        else:
            return "Unsupported file format."

    @staticmethod
    def _read_pdf(file_bytes):
        text = ""
        # Create a BytesIO object because pypdf expects a file-like object
        pdf_file = io.BytesIO(file_bytes)
        reader = pypdf.PdfReader(pdf_file)
        
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
        return text

    @staticmethod
    def chunk_text(text, chunk_size=500):
        """
        Splits massive text into smaller 'bites' for the vector DB.
        """
        words = text.split()
        chunks = []
        current_chunk = []
        current_count = 0
        
        for word in words:
            current_chunk.append(word)
            current_count += 1
            
            if current_count >= chunk_size:
                chunks.append(" ".join(current_chunk))
                current_chunk = []
                current_count = 0
                
        if current_chunk:
            chunks.append(" ".join(current_chunk))
            
        return chunks