import io
import os
import re
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.utils import secure_filename
import PyPDF2
from docx import Document

app = Flask(__name__)
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024  # 2MB limit

# Configure logging
logging.basicConfig(level=logging.INFO)
app.logger.addHandler(logging.StreamHandler())

# Rate limiting
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["10 per minute"]
)

# Configurable settings
ALLOWED_EXTENSIONS = {'pdf', 'docx'}
KEYWORDS = os.getenv('KEYWORDS', 'Python,Flask,React,SQL,Git').split(',')
REQUIRED_SECTIONS = os.getenv('REQUIRED_SECTIONS', 'Experience,Education,Skills').split(',')

def allowed_file(filename):
    return '.' in filename and \
        filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text(file):
    if file.filename.endswith(".pdf"):
        reader = PyPDF2.PdfReader(file)
        text = " ".join([page.extract_text() or '' for page in reader.pages])
    elif file.filename.endswith(".docx"):
        doc = Document(io.BytesIO(file.read()))
        text = " ".join([para.text for para in doc.paragraphs])
    else:
        raise ValueError("Unsupported file format")
    return text.lower()

def analyze_resume(text):
    # Keyword analysis with word boundaries
    found_keywords = []
    text_lower = text.lower()
    for kw in KEYWORDS:
        if re.search(rf'\b{re.escape(kw.lower())}\b', text_lower):
            found_keywords.append(kw)
    
    # Section detection with case insensitivity
    sections_found = []
    for section in REQUIRED_SECTIONS:
        if re.search(rf'(?i)\b{re.escape(section)}\b', text):
            sections_found.append(section)

    # Scoring logic
    keyword_score = (len(found_keywords)/len(KEYWORDS)) * 100 * 0.5
    section_score = (len(sections_found)/len(REQUIRED_SECTIONS)) * 100 * 0.5
    
    return {
        'score': round(keyword_score + section_score, 2),
        'keywords': found_keywords,
        'missing_keywords': list(set(KEYWORDS) - set(found_keywords)),
        'sections_found': sections_found,
        'missing_sections': list(set(REQUIRED_SECTIONS) - set(sections_found)),
    }

@app.route('/api/analyze', methods=['POST'])
@limiter.limit("10 per minute")
def analyze():
    if 'resume' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['resume']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if not allowed_file(file.filename):
        return jsonify({"error": "Unsupported file type"}), 400

    try:
        app.logger.info(f'Processing file: {secure_filename(file.filename)}')
        text = extract_text(file)
        result = analyze_resume(text)
        return jsonify(result)
    except Exception as e:
        app.logger.error(f'Error processing file: {str(e)}')
        return jsonify({"error": str(e)}), 500

@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(debug=True)