import { useState, useEffect } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Button } from 'primereact/button'
import './App.css'
import 'primereact/resources/themes/lara-light-cyan/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'

interface WordPair {
  english: string;
  russian: string;
}

function App() {
  const [availableFiles, setAvailableFiles] = useState<string[]>([])
  const [selectedData, setSelectedData] = useState<WordPair[]>([])
  const [selectedFileName, setSelectedFileName] = useState<string>('')
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0)
  const [isFlipped, setIsFlipped] = useState<boolean>(false)
  const [primaryLanguage, setPrimaryLanguage] = useState<'english' | 'russian'>('english')

  // Get list of JSON files in the data folder
  const getAvailableFiles = async () => {
    try {
      // Since we can't directly list files from the browser, we'll use a predefined list
      // In a real app, you'd need an API endpoint to list files
      const fileNames = ['animals', 'colors', 'numbers'] // Add more as needed
      setAvailableFiles(fileNames)
    } catch (error) {
      console.error('Error getting file list:', error)
    }
  }

  // Load data from selected JSON file
  const loadFileData = async (fileName: string) => {
    try {
      const response = await fetch(`/data/${fileName}.json`)
      const data = await response.json()
      
      // Convert object to array of word pairs
      const wordPairs: WordPair[] = Object.entries(data).map(([english, russian]) => ({
        english,
        russian: russian as string
      }))
      
      setSelectedData(wordPairs)
      setSelectedFileName(fileName)
      setCurrentCardIndex(0)
      setIsFlipped(false)
    } catch (error) {
      console.error(`Error loading ${fileName}.json:`, error)
    }
  }

  const handleCardClick = () => {
    setIsFlipped(!isFlipped)
  }

  const nextCard = () => {
    if (selectedData.length > 0) {
      setCurrentCardIndex((prev) => (prev + 1) % selectedData.length)
      setIsFlipped(false)
    }
  }

  const prevCard = () => {
    if (selectedData.length > 0) {
      setCurrentCardIndex((prev) => (prev - 1 + selectedData.length) % selectedData.length)
      setIsFlipped(false)
    }
  }

  const switchToEnglish = () => {
    setPrimaryLanguage('english')
    setIsFlipped(false)
  }

  const switchToRussian = () => {
    setPrimaryLanguage('russian')
    setIsFlipped(false)
  }

  // Get the primary text (shown first) and secondary text (shown when flipped)
  const getPrimaryText = () => {
    if (!selectedData[currentCardIndex]) return ''
    return primaryLanguage === 'english' 
      ? selectedData[currentCardIndex].english 
      : selectedData[currentCardIndex].russian
  }

  const getSecondaryText = () => {
    if (!selectedData[currentCardIndex]) return ''
    return primaryLanguage === 'english' 
      ? selectedData[currentCardIndex].russian 
      : selectedData[currentCardIndex].english
  }

  const getPrimaryHint = () => {
    return primaryLanguage === 'english' 
      ? 'Click to reveal Russian translation'
      : 'Click to reveal English translation'
  }

  const getSecondaryHint = () => {
    return primaryLanguage === 'english' 
      ? 'Russian translation'
      : 'English translation'
  }

  useEffect(() => {
    getAvailableFiles()
  }, [])

  return (
    <div className="App">
      <h1>Quizlet - English to Russian Dictionary</h1>
      
      <div className="file-buttons" style={{ marginBottom: '20px' }}>
        <h3>Select a vocabulary file:</h3>
        {availableFiles.map((fileName) => (
          <Button
            key={fileName}
            label={fileName.charAt(0).toUpperCase() + fileName.slice(1)}
            onClick={() => loadFileData(fileName)}
            className={`vocabulary-button ${selectedFileName === fileName ? 'active' : ''}`}
            severity={selectedFileName === fileName ? 'success' : 'secondary'}
          />
        ))}
      </div>

      {selectedData.length > 0 && (
        <>
          {/* Flashcard Component */}
          <div className="flashcard-container">
            <h3>Flashcard ({currentCardIndex + 1} of {selectedData.length})</h3>
            
            {/* Language Toggle Buttons */}
            <div className="language-toggle">
              <Button 
                label="Eng"
                onClick={switchToEnglish}
                className={`language-button ${primaryLanguage === 'english' ? 'active' : ''}`}
                severity={primaryLanguage === 'english' ? 'info' : 'secondary'}
              />
              <Button 
                label="Rus"
                onClick={switchToRussian}
                className={`language-button ${primaryLanguage === 'russian' ? 'active' : ''}`}
                severity={primaryLanguage === 'russian' ? 'info' : 'secondary'}
              />
            </div>
            
            <div className="flashcard-navigation">
              <Button 
                icon="pi pi-chevron-left" 
                onClick={prevCard}
                className="nav-button"
                disabled={selectedData.length <= 1}
              />
              
              <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={handleCardClick}>
                <div className="flashcard-inner">
                  <div className="flashcard-front">
                    <div className="card-content">
                      <h2>{getPrimaryText()}</h2>
                      <p className="card-hint">{getPrimaryHint()}</p>
                    </div>
                  </div>
                  <div className="flashcard-back">
                    <div className="card-content">
                      <h2>{getSecondaryText()}</h2>
                      <p className="card-hint">{getSecondaryHint()}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button 
                icon="pi pi-chevron-right" 
                onClick={nextCard}
                className="nav-button"
                disabled={selectedData.length <= 1}
              />
            </div>
          </div>

          <div className="data-table">
            <h3>Vocabulary: {selectedFileName.charAt(0).toUpperCase() + selectedFileName.slice(1)}</h3>
            <DataTable value={selectedData} tableStyle={{ minWidth: '50rem' }}>
              <Column field="english" header="English" style={{ width: '50%' }}></Column>
              <Column field="russian" header="Russian" style={{ width: '50%' }}></Column>
            </DataTable>
          </div>
        </>
      )}
    </div>
  )
}

export default App
