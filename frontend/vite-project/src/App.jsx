import React, { useState } from 'react';
import axios from 'axios';

const App = () => {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError('');
    
    if (selectedFile) {
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Please upload only PDF or DOCX files');
        setFile(null);
        return;
      }
      if (selectedFile.size > 2 * 1024 * 1024) {
        setError('File size must be less than 2MB');
        setFile(null);
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setIsLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await axios.post('http://localhost:5000/api/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setAnalysis(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred while analyzing the resume');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = {
    container: {
      maxWidth: '800px',
      margin: '40px auto',
      padding: '20px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    },
    title: {
      textAlign: 'center',
      color: '#333',
      marginBottom: '30px',
      fontSize: '24px'
    },
    uploadArea: {
      border: '2px dashed #ccc',
      padding: '20px',
      borderRadius: '4px',
      marginBottom: '20px'
    },
    fileInput: {
      width: '100%',
      marginBottom: '10px'
    },
    helperText: {
      fontSize: '14px',
      color: '#666',
      marginTop: '5px'
    },
    button: {
      width: '100%',
      padding: '12px',
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontSize: '16px',
      cursor: 'pointer',
      marginBottom: '20px'
    },
    buttonDisabled: {
      backgroundColor: '#cccccc',
      cursor: 'not-allowed'
    },
    error: {
      backgroundColor: '#fff3f3',
      color: '#dc3545',
      padding: '10px',
      borderRadius: '4px',
      marginBottom: '20px'
    },
    results: {
      backgroundColor: '#f8f9fa',
      padding: '20px',
      borderRadius: '4px',
      marginTop: '20px'
    },
    score: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '15px'
    },
    section: {
      marginBottom: '15px'
    },
    sectionTitle: {
      fontWeight: 'bold',
      marginBottom: '8px'
    },
    tagContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px'
    },
    tag: {
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '14px'
    },
    foundKeyword: {
      backgroundColor: '#e3f2fd',
      color: '#1976d2'
    },
    missingKeyword: {
      backgroundColor: '#ffebee',
      color: '#c62828'
    },
    foundSection: {
      backgroundColor: '#e8f5e9',
      color: '#2e7d32'
    },
    missingSection: {
      backgroundColor: '#fff3e0',
      color: '#ef6c00'
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Resume ATS Analyzer</h1>
      
      <form onSubmit={handleSubmit}>
        <div style={styles.uploadArea}>
          <input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.docx"
            style={styles.fileInput}
          />
          <p style={styles.helperText}>
            Accepted formats: PDF, DOCX (Max size: 2MB)
          </p>
        </div>

        <button
          type="submit"
          disabled={!file || isLoading}
          style={{
            ...styles.button,
            ...((!file || isLoading) && styles.buttonDisabled)
          }}
        >
          {isLoading ? 'Analyzing...' : 'Analyze Resume'}
        </button>
      </form>

      {error && <div style={styles.error}>{error}</div>}

      {analysis && (
        <div style={styles.results}>
          <div style={styles.score}>
            ATS Score: {analysis.score}%
          </div>
          
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Keywords Found:</div>
            <div style={styles.tagContainer}>
              {analysis.keywords.length > 0 ? 
                analysis.keywords.map(keyword => (
                  <span 
                    key={keyword} 
                    style={{...styles.tag, ...styles.foundKeyword}}
                  >
                    {keyword}
                  </span>
                )) : 
                <span style={styles.helperText}>No keywords found</span>
              }
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionTitle}>Missing Keywords:</div>
            <div style={styles.tagContainer}>
              {analysis.missing_keywords.map(keyword => (
                <span 
                  key={keyword} 
                  style={{...styles.tag, ...styles.missingKeyword}}
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionTitle}>Sections Found:</div>
            <div style={styles.tagContainer}>
              {analysis.sections_found.map(section => (
                <span 
                  key={section} 
                  style={{...styles.tag, ...styles.foundSection}}
                >
                  {section}
                </span>
              ))}
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionTitle}>Missing Sections:</div>
            <div style={styles.tagContainer}>
              {analysis.missing_sections.map(section => (
                <span 
                  key={section} 
                  style={{...styles.tag, ...styles.missingSection}}
                >
                  {section}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;