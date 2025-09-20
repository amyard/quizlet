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
  source?: string; // Add source to track which file the word came from
}

function App() {
  const [availableFiles, setAvailableFiles] = useState<string[]>([])
  const [selectedData, setSelectedData] = useState<WordPair[]>([])
  const [selectedFileName, setSelectedFileName] = useState<string>('')
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0)
  const [isFlipped, setIsFlipped] = useState<boolean>(false)
  const [primaryLanguage, setPrimaryLanguage] = useState<'english' | 'russian'>('english')
  const [showTable, setShowTable] = useState<boolean>(false)

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
        russian: russian as string,
        source: fileName
      }))
      
      setSelectedData(wordPairs)
      setSelectedFileName(fileName)
      setCurrentCardIndex(0)
      setIsFlipped(false)
    } catch (error) {
      console.error(`Error loading ${fileName}.json:`, error)
    }
  }

  // Load all data from all JSON files
  const loadAllData = async () => {
    try {
      const allWordPairs: WordPair[] = []
      
      for (const fileName of availableFiles) {
        try {
          const response = await fetch(`/data/${fileName}.json`)
          const data = await response.json()
          
          // Convert object to array of word pairs with source
          const wordPairs: WordPair[] = Object.entries(data).map(([english, russian]) => ({
            english,
            russian: russian as string,
            source: fileName
          }))
          
          allWordPairs.push(...wordPairs)
        } catch (fileError) {
          console.error(`Error loading ${fileName}.json:`, fileError)
        }
      }
      
      setSelectedData(allWordPairs)
      setSelectedFileName('ALL')
      setCurrentCardIndex(0)
      setIsFlipped(false)
    } catch (error) {
      console.error('Error loading all data:', error)
    }
  }

  const handleCardClick = () => {
    setIsFlipped(!isFlipped)
  }

  const nextCard = () => {
    if (selectedData.length > 0) {
      // Reset flip state first to prevent flickering
      setIsFlipped(false)
      // Use setTimeout to ensure state update is processed
      setTimeout(() => {
        setCurrentCardIndex((prev) => (prev + 1) % selectedData.length)
      }, 0)
    }
  }

  const prevCard = () => {
    if (selectedData.length > 0) {
      // Reset flip state first to prevent flickering
      setIsFlipped(false)
      // Use setTimeout to ensure state update is processed
      setTimeout(() => {
        setCurrentCardIndex((prev) => (prev - 1 + selectedData.length) % selectedData.length)
      }, 0)
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

  const toggleTable = () => {
    setShowTable(!showTable)
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

  const getDisplayTitle = () => {
    if (selectedFileName === 'ALL') {
      return 'All Vocabulary Files'
    }
    return selectedFileName.charAt(0).toUpperCase() + selectedFileName.slice(1)
  }

  useEffect(() => {
    getAvailableFiles()
  }, [])

  return (
    <div className="App">
      <h1>Quizlet - English to Russian Dictionary</h1>
      
      <div className="file-buttons" style={{ marginBottom: '20px' }}>
        <h3>Select a vocabulary file:</h3>
        {/* ALL Button */}
        <Button
            label="ALL"
            onClick={loadAllData}
            className={`vocabulary-button all-button ${selectedFileName === 'ALL' ? 'active' : ''}`}
            severity={selectedFileName === 'ALL' ? 'success' : 'info'}
        />
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
                      {selectedFileName === 'ALL' && selectedData[currentCardIndex]?.source && (
                        <p className="card-source">From: {selectedData[currentCardIndex].source}</p>
                      )}
                    </div>
                  </div>
                  <div className="flashcard-back">
                    <div className="card-content">
                      <h2>{getSecondaryText()}</h2>
                      <p className="card-hint">{getSecondaryHint()}</p>
                      {selectedFileName === 'ALL' && selectedData[currentCardIndex]?.source && (
                        <p className="card-source">From: {selectedData[currentCardIndex].source}</p>
                      )}
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

          {/* Table Toggle Button */}
          <div className="table-toggle-container">
            <Button 
              label={showTable ? 'Hide Vocabulary Table' : 'Show Vocabulary Table'}
              icon={showTable ? 'pi pi-eye-slash' : 'pi pi-eye'}
              onClick={toggleTable}
              className="table-toggle-button"
              severity="secondary"
            />
          </div>

          {/* Data Table with Pagination - Only shown when showTable is true */}
          {showTable && (
            <div className="data-table">
              <h3>Vocabulary: {getDisplayTitle()}</h3>
              <DataTable 
                value={selectedData} 
                tableStyle={{ minWidth: '50rem' }}
                paginator 
                rows={10} 
                rowsPerPageOptions={[5, 10, 25, 50]}
                totalRecords={selectedData.length}
                paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                currentPageReportTemplate="{first} to {last} of {totalRecords} entries"
              >
                <Column field="english" header="English" style={{ width: selectedFileName === 'ALL' ? '40%' : '50%' }}></Column>
                <Column field="russian" header="Russian" style={{ width: selectedFileName === 'ALL' ? '40%' : '50%' }}></Column>
                {selectedFileName === 'ALL' && (
                  <Column field="source" header="Source" style={{ width: '20%' }}></Column>
                )}
              </DataTable>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default App
