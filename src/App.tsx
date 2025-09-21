import { useState, useEffect } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Button } from 'primereact/button'
import './App.css'
import 'primereact/resources/themes/lara-light-cyan/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'

interface WordPair {
  eng: string;
  rus: string;
  display: number;
  source?: string; // Add source to track which file the word came from
}

function App() {
  const [availableFiles, setAvailableFiles] = useState<string[]>([])
  const [selectedData, setSelectedData] = useState<WordPair[]>([])
  const [allData, setAllData] = useState<WordPair[]>([]) // Store all data including display=0
  const [selectedFileName, setSelectedFileName] = useState<string>('')
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0)
  const [isFlipped, setIsFlipped] = useState<boolean>(false)
  const [primaryLanguage, setPrimaryLanguage] = useState<'english' | 'russian'>('english')
  const [showTable, setShowTable] = useState<boolean>(false)
  const [displayFilter, setDisplayFilter] = useState<'active' | 'all'>('active')

  // Get list of JSON files in the data folder
  const getAvailableFiles = async () => {
    try {
      // Since we can't directly list files from the browser, we'll use a predefined list
      // In a real app, you'd need an API endpoint to list files
      const fileNames = ['animals', 'colors', 'numbers', 'lesson1', 'lesson2'] // Add more as needed
      setAvailableFiles(fileNames)
    } catch (error) {
      console.error('Error getting file list:', error)
    }
  }

  // Apply display filter to the data
  const applyDisplayFilter = (data: WordPair[], filter: 'active' | 'all') => {
    if (filter === 'active') {
      return data.filter((item: WordPair) => item.display === 1)
    }
    return data // Return all data (both display 0 and 1)
  }

  // Toggle word status between active (1) and inactive (0)
  const toggleWordStatus = (wordToToggle: WordPair) => {
    const newStatus = wordToToggle.display === 1 ? 0 : 1
    
    // Update in allData
    const updatedAllData = allData.map(item => {
      if (item.eng === wordToToggle.eng && item.rus === wordToToggle.rus && item.source === wordToToggle.source) {
        return { ...item, display: newStatus }
      }
      return item
    })
    
    setAllData(updatedAllData)
    
    // Update selectedData based on current filter
    const filteredData = applyDisplayFilter(updatedAllData, displayFilter)
    setSelectedData(filteredData)
    
    // Adjust currentCardIndex if needed
    if (displayFilter === 'active' && newStatus === 0) {
      // If we're in active mode and deactivated current card, move to next available card
      if (selectedData[currentCardIndex] && 
          selectedData[currentCardIndex].eng === wordToToggle.eng && 
          selectedData[currentCardIndex].rus === wordToToggle.rus) {
        const newIndex = Math.min(currentCardIndex, filteredData.length - 1)
        setCurrentCardIndex(newIndex >= 0 ? newIndex : 0)
      }
    }
    
    // Note: In a real app, you would also save this change to the server/database
    console.log(`Word "${wordToToggle.eng}" status changed to ${newStatus === 1 ? 'Active' : 'Inactive'}`)
  }

  // Toggle current flashcard word status
  const toggleCurrentCardStatus = () => {
    if (selectedData[currentCardIndex]) {
      toggleWordStatus(selectedData[currentCardIndex])
    }
  }

  // Load data from selected JSON file
  const loadFileData = async (fileName: string) => {
    try {
      const response = await fetch(`/data/${fileName}.json`)
      const data = await response.json()
      
      // Store all data with source information
      const allWordPairs: WordPair[] = data.map((item: WordPair) => ({
        ...item,
        source: fileName
      }))
      
      setAllData(allWordPairs)
      
      // Apply current display filter
      const filteredData = applyDisplayFilter(allWordPairs, displayFilter)
      
      setSelectedData(filteredData)
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
          
          // Store all data with source information
          const wordPairs: WordPair[] = data.map((item: WordPair) => ({
            ...item,
            source: fileName
          }))
          
          allWordPairs.push(...wordPairs)
        } catch (fileError) {
          console.error(`Error loading ${fileName}.json:`, fileError)
        }
      }
      
      setAllData(allWordPairs)
      
      // Apply current display filter
      const filteredData = applyDisplayFilter(allWordPairs, displayFilter)
      
      setSelectedData(filteredData)
      setSelectedFileName('ALL')
      setCurrentCardIndex(0)
      setIsFlipped(false)
    } catch (error) {
      console.error('Error loading all data:', error)
    }
  }

  // Switch to show only active words (display = 1)
  const showActiveWords = () => {
    setDisplayFilter('active')
    const filteredData = applyDisplayFilter(allData, 'active')
    setSelectedData(filteredData)
    setCurrentCardIndex(0)
    setIsFlipped(false)
  }

  // Switch to show all words (display = 0 or 1)
  const showAllWords = () => {
    setDisplayFilter('all')
    const filteredData = applyDisplayFilter(allData, 'all')
    setSelectedData(filteredData)
    setCurrentCardIndex(0)
    setIsFlipped(false)
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
      ? selectedData[currentCardIndex].eng 
      : selectedData[currentCardIndex].rus
  }

  const getSecondaryText = () => {
    if (!selectedData[currentCardIndex]) return ''
    return primaryLanguage === 'english' 
      ? selectedData[currentCardIndex].rus 
      : selectedData[currentCardIndex].eng
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
    const baseTitle = selectedFileName === 'ALL' ? 'All Vocabulary Files' : selectedFileName.charAt(0).toUpperCase() + selectedFileName.slice(1)
    const filterSuffix = displayFilter === 'active' ? ' (Active Words)' : ' (All Words)'
    return baseTitle + filterSuffix
  }

  // Render toggle status button for table
  const renderStatusToggle = (rowData: WordPair) => {
    return (
      <Button
        icon={rowData.display === 1 ? "pi pi-eye" : "pi pi-eye-slash"}
        onClick={() => toggleWordStatus(rowData)}
        className={`status-toggle-button ${rowData.display === 1 ? 'active' : 'inactive'}`}
        severity={rowData.display === 1 ? 'success' : 'danger'}
        size="small"
        tooltip={rowData.display === 1 ? 'Click to deactivate' : 'Click to activate'}
      />
    )
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

      {/* Display Filter Buttons */}
      {selectedFileName && (
        <div className="display-filter-container" style={{ marginBottom: '20px' }}>
          <h3>Display options:</h3>
          <Button
            label="Active Words"
            icon="pi pi-eye"
            onClick={showActiveWords}
            className={`filter-button ${displayFilter === 'active' ? 'active' : ''}`}
            severity={displayFilter === 'active' ? 'success' : 'secondary'}
          />
          <Button
            label="All Words"
            icon="pi pi-list"
            onClick={showAllWords}
            className={`filter-button ${displayFilter === 'all' ? 'active' : ''}`}
            severity={displayFilter === 'all' ? 'success' : 'secondary'}
          />
        </div>
      )}

      {selectedData.length > 0 && (
        <>
          {/* Flashcard Component */}
          <div className="flashcard-container">
            <h3>Flashcard ({currentCardIndex + 1} of {selectedData.length})</h3>
            
            {/* Card Status Toggle */}
            <div className="card-status-toggle">
              <Button
                label={selectedData[currentCardIndex]?.display === 1 ? 'Deactivate Word' : 'Activate Word'}
                icon={selectedData[currentCardIndex]?.display === 1 ? 'pi pi-eye-slash' : 'pi pi-eye'}
                onClick={toggleCurrentCardStatus}
                className={`card-toggle-button ${selectedData[currentCardIndex]?.display === 1 ? 'active' : 'inactive'}`}
                severity={selectedData[currentCardIndex]?.display === 1 ? 'danger' : 'success'}
                size="small"
              />
            </div>
            
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
                      {displayFilter === 'all' && selectedData[currentCardIndex]?.display === 0 && (
                        <p className="card-status">Status: Inactive</p>
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
                      {displayFilter === 'all' && selectedData[currentCardIndex]?.display === 0 && (
                        <p className="card-status">Status: Inactive</p>
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
                <Column field="eng" header="English" style={{ width: selectedFileName === 'ALL' ? '30%' : displayFilter === 'all' ? '35%' : '45%' }}></Column>
                <Column field="rus" header="Russian" style={{ width: selectedFileName === 'ALL' ? '30%' : displayFilter === 'all' ? '35%' : '45%' }}></Column>
                <Column 
                  header="Toggle Status" 
                  style={{ width: '15%', textAlign: 'center' }}
                  body={renderStatusToggle}
                ></Column>
                {displayFilter === 'all' && (
                  <Column 
                    field="display" 
                    header="Status" 
                    style={{ width: '10%' }}
                    body={(rowData) => (
                      <span className={`status-badge ${rowData.display === 1 ? 'active' : 'inactive'}`}>
                        {rowData.display === 1 ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  ></Column>
                )}
                {selectedFileName === 'ALL' && (
                  <Column field="source" header="Source" style={{ width: '15%' }}></Column>
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
