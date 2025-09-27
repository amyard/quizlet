import React, { useState, useEffect, useRef } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Dialog } from 'primereact/dialog'
import { Toast } from 'primereact/toast'
import { Dropdown } from 'primereact/dropdown'
import { FilterMatchMode } from 'primereact/api'
import './App.css'
import 'primereact/resources/themes/lara-light-cyan/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'

interface WordPair {
  id?: string; // Add unique ID for better tracking
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
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]) // For multiple selection
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0)
  const [isFlipped, setIsFlipped] = useState<boolean>(false)
  const [primaryLanguage, setPrimaryLanguage] = useState<'english' | 'russian'>('english')
  const [showTable, setShowTable] = useState<boolean>(false)
  const [displayFilter, setDisplayFilter] = useState<'active' | 'all'>('active')
  
  // Search and Edit states
  const [globalFilterValue, setGlobalFilterValue] = useState<string>('')
  const [filters, setFilters] = useState({
    global: { value: null as string | null, matchMode: FilterMatchMode.CONTAINS }
  })
  
  // Edit Word dialog states
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false)
  const [editingWord, setEditingWord] = useState<WordPair | null>(null)
  const [editForm, setEditForm] = useState({ eng: '', rus: '', display: 1 })
  
  // Add New Word dialog states
  const [showAddDialog, setShowAddDialog] = useState<boolean>(false)
  const [addForm, setAddForm] = useState({ eng: '', rus: '', display: 1, source: '' })
  
  // Toast reference
  const toast = useRef<Toast>(null)

  // Generate unique ID for words
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // Show toast message
  const showToast = (severity: 'success' | 'info' | 'warn' | 'error', summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 })
  }

  // Save data to JSON file via API
  const saveToFile = async (fileName: string, data: WordPair[]) => {
    try {
      // Filter data for the specific file and remove internal properties
      const fileData = data
        .filter(item => item.source === fileName)
        .map((item) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, source, ...rest } = item;
          return rest;
        }) // Remove id and source for JSON file
      
      // Send data to server API
      const response = await fetch(`http://localhost:3001/api/save/${fileName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fileData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save file');
      }
      
      await response.json();
      console.log(`Successfully saved ${fileName}.json:`, fileData);
      showToast('success', 'Saved', `Changes saved to ${fileName}.json`)
      
    } catch (error) {
      console.error('Error saving file:', error);
      
      // Fallback to download if server is not available
      if (error instanceof TypeError && error.message.includes('fetch')) {
        showToast('warn', 'Server Offline', 'Server not running. Downloading file instead.')
        downloadFile(fileName, data)
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        showToast('error', 'Error', `Failed to save changes: ${errorMessage}`)
      }
    }
  }

  // Fallback download function
  const downloadFile = (fileName: string, data: WordPair[]) => {
    try {
      const fileData = data
        .filter(item => item.source === fileName)
        .map((item) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, source, ...rest } = item;
          return rest;
        });
      
      const jsonString = JSON.stringify(fileData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      showToast('info', 'Downloaded', `${fileName}.json downloaded. Replace in public/data/ folder.`);
    } catch {
      showToast('error', 'Error', 'Failed to download file')
    }
  }

  // Get list of JSON files in the data folder dynamically
  const getAvailableFiles = async () => {
    try {
      // Try to get files from API first
      try {
        const response = await fetch('http://localhost:3001/api/files');
        if (response.ok) {
          const fileNames = await response.json();
          setAvailableFiles(fileNames);
          console.log('Loaded files from API:', fileNames);
          return;
        }
      } catch {
        console.log('API not available, using fallback file list');
      }
      
      // Fallback to predefined list if API is not available
      const fallbackFiles = ['lesson1', 'lesson2', 'lesson3', 'lesson4', 'lesson5'];
      setAvailableFiles(fallbackFiles);
      console.log('Using fallback file list:', fallbackFiles);
      
    } catch (error) {
      console.error('Error getting file list:', error);
      // Use minimal fallback
      setAvailableFiles(['lesson1', 'lesson2']);
    }
  }

  // Apply display filter to the data
  const applyDisplayFilter = (data: WordPair[], filter: 'active' | 'all') => {
    if (filter === 'active') {
      return data.filter((item: WordPair) => item.display === 1)
    }
    return data // Return all data (both display 0 and 1)
  }

  // Global search filter
  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const _filters = { ...filters }
    _filters['global'].value = value || null
    setFilters(_filters)
    setGlobalFilterValue(value)
  }

  // Clear search
  const clearSearch = () => {
    setGlobalFilterValue('')
    setFilters({
      global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    })
  }

  // Edit word functionality
  const editWord = (word: WordPair) => {
    setEditingWord(word)
    setEditForm({
      eng: word.eng,
      rus: word.rus,
      display: word.display
    })
    setShowEditDialog(true)
  }

  const saveEditedWord = () => {
    if (!editingWord || !editForm.eng.trim() || !editForm.rus.trim()) {
      showToast('warn', 'Warning', 'Please fill in both English and Russian fields')
      return
    }

    // Update in allData
    const updatedAllData = allData.map(item => {
      if (item.id === editingWord.id) {
        return { ...item, eng: editForm.eng.trim(), rus: editForm.rus.trim(), display: editForm.display }
      }
      return item
    })

    setAllData(updatedAllData)

    // Update filtered data
    const filteredData = applyDisplayFilter(updatedAllData, displayFilter)
    setSelectedData(filteredData)

    // Save to file if not in ALL or MULTI mode
    if (selectedFileName !== 'ALL' && selectedFileName !== 'MULTI' && editingWord.source) {
      saveToFile(editingWord.source, updatedAllData)
    }

    setShowEditDialog(false)
    setEditingWord(null)
    showToast('success', 'Success', 'Word updated successfully')
  }

  // Add new word functionality
  const openAddDialog = () => {
    setAddForm({
      eng: '',
      rus: '',
      display: 1,
      source: selectedFileName === 'ALL' || selectedFileName === 'MULTI' ? availableFiles[0] : selectedFileName
    })
    setShowAddDialog(true)
  }

  const saveNewWord = () => {
    if (!addForm.eng.trim() || !addForm.rus.trim() || !addForm.source) {
      showToast('warn', 'Warning', 'Please fill in all required fields')
      return
    }

    // Check for duplicates
    const isDuplicate = allData.some(item => 
      item.eng.toLowerCase() === addForm.eng.trim().toLowerCase() && 
      item.rus.toLowerCase() === addForm.rus.trim().toLowerCase() &&
      item.source === addForm.source
    )

    if (isDuplicate) {
      showToast('warn', 'Warning', 'This word combination already exists in the selected file')
      return
    }

    const newWord: WordPair = {
      id: generateId(),
      eng: addForm.eng.trim(),
      rus: addForm.rus.trim(),
      display: addForm.display,
      source: addForm.source
    }

    const updatedAllData = [...allData, newWord]
    setAllData(updatedAllData)

    // Update filtered data
    const filteredData = applyDisplayFilter(updatedAllData, displayFilter)
    setSelectedData(filteredData)

    // Save to file
    saveToFile(addForm.source, updatedAllData)

    setShowAddDialog(false)
    showToast('success', 'Success', 'New word added successfully')
  }

  // Delete word functionality
  const deleteWord = (word: WordPair) => {
    const updatedAllData = allData.filter(item => item.id !== word.id)
    setAllData(updatedAllData)

    // Update filtered data
    const filteredData = applyDisplayFilter(updatedAllData, displayFilter)
    setSelectedData(filteredData)

    // Save to file if not in ALL or MULTI mode
    if (selectedFileName !== 'ALL' && selectedFileName !== 'MULTI' && word.source) {
      saveToFile(word.source, updatedAllData)
    }

    showToast('success', 'Success', 'Word deleted successfully')
  }

  // Toggle word status between active (1) and inactive (0)
  const toggleWordStatus = (wordToToggle: WordPair) => {
    const newStatus = wordToToggle.display === 1 ? 0 : 1
    
    // Update in allData
    const updatedAllData = allData.map(item => {
      if (item.id === wordToToggle.id) {
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
          selectedData[currentCardIndex].id === wordToToggle.id) {
        const newIndex = Math.min(currentCardIndex, filteredData.length - 1)
        setCurrentCardIndex(newIndex >= 0 ? newIndex : 0)
      }
    }
    
    // Save to file if not in ALL or MULTI mode
    if (selectedFileName !== 'ALL' && selectedFileName !== 'MULTI' && wordToToggle.source) {
      saveToFile(wordToToggle.source, updatedAllData)
    }

    showToast('info', 'Status Changed', `Word "${wordToToggle.eng}" is now ${newStatus === 1 ? 'Active' : 'Inactive'}`)
  }

  // Toggle current flashcard word status
  const toggleCurrentCardStatus = () => {
    if (selectedData[currentCardIndex]) {
      toggleWordStatus(selectedData[currentCardIndex])
    }
  }

  // Handle file selection with Shift support
  const handleFileSelection = (fileName: string, event: React.MouseEvent) => {
    if (event.shiftKey) {
      // Multi-selection mode with Shift key
      const newSelectedFiles = selectedFileNames.includes(fileName)
        ? selectedFileNames.filter(f => f !== fileName) // Remove if already selected
        : [...selectedFileNames, fileName] // Add if not selected
      
      setSelectedFileNames(newSelectedFiles)
      
      if (newSelectedFiles.length > 0) {
        loadMultipleFiles(newSelectedFiles)
      } else {
        // If no files selected, clear data
        setAllData([])
        setSelectedData([])
        setSelectedFileName('')
      }
    } else {
      // Single selection mode (normal click)
      setSelectedFileNames([])
      loadFileData(fileName)
    }
  }

  // Load data from selected JSON file via API or fallback to static files
  const loadFileData = async (fileName: string) => {
    try {
      let response;
      let data;
      
      // Try to load from API first
      try {
        response = await fetch(`http://localhost:3001/api/data/${fileName}`);
        if (response.ok) {
          data = await response.json();
        } else {
          throw new Error('API not available');
        }
      } catch {
        // Fallback to static files
        response = await fetch(`/data/${fileName}.json`);
        data = await response.json();
      }
      
      // Store all data with source information and unique IDs
      const allWordPairs: WordPair[] = data.map((item: WordPair) => ({
        ...item,
        id: generateId(),
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
      showToast('error', 'Error', `Failed to load ${fileName}.json`)
    }
  }

  // Load data from multiple selected files
  const loadMultipleFiles = async (fileNames: string[]) => {
    try {
      const allWordPairs: WordPair[] = []
      
      for (const fileName of fileNames) {
        try {
          let response;
          let data;
          
          // Try to load from API first
          try {
            response = await fetch(`http://localhost:3001/api/data/${fileName}`);
            if (response.ok) {
              data = await response.json();
            } else {
              throw new Error('API not available');
            }
          } catch {
            // Fallback to static files
            response = await fetch(`/data/${fileName}.json`);
            data = await response.json();
          }
          
          // Store all data with source information and unique IDs
          const wordPairs: WordPair[] = data.map((item: WordPair) => ({
            ...item,
            id: generateId(),
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
      setSelectedFileName('MULTI')
      setCurrentCardIndex(0)
      setIsFlipped(false)
      
      showToast('success', 'Loaded', `Loaded ${fileNames.length} files: ${fileNames.join(', ')}`)
    } catch (error) {
      console.error('Error loading multiple files:', error)
      showToast('error', 'Error', 'Failed to load some vocabulary files')
    }
  }

  // Load all data from all JSON files via API or fallback to static files
  const loadAllData = async () => {
    try {
      const allWordPairs: WordPair[] = []
      
      for (const fileName of availableFiles) {
        try {
          let response;
          let data;
          
          // Try to load from API first
          try {
            response = await fetch(`http://localhost:3001/api/data/${fileName}`);
            if (response.ok) {
              data = await response.json();
            } else {
              throw new Error('API not available');
            }
          } catch {
            // Fallback to static files
            response = await fetch(`/data/${fileName}.json`);
            data = await response.json();
          }
          
          // Store all data with source information and unique IDs
          const wordPairs: WordPair[] = data.map((item: WordPair) => ({
            ...item,
            id: generateId(),
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
      setSelectedFileNames([])
      setCurrentCardIndex(0)
      setIsFlipped(false)
    } catch (error) {
      console.error('Error loading all data:', error)
      showToast('error', 'Error', 'Failed to load vocabulary files')
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
    let baseTitle = ''
    if (selectedFileName === 'ALL') {
      baseTitle = 'All Vocabulary Files'
    } else if (selectedFileName === 'MULTI') {
      baseTitle = `Selected Files (${selectedFileNames.join(', ')})`
    } else {
      baseTitle = selectedFileName.charAt(0).toUpperCase() + selectedFileName.slice(1)
    }
    const filterSuffix = displayFilter === 'active' ? ' (Active Words)' : ' (All Words)'
    return baseTitle + filterSuffix
  }

  // Render action buttons for table
  const renderActionButtons = (rowData: WordPair) => {
    return (
      <div className="action-buttons">
        <Button
          icon="pi pi-pencil"
          onClick={() => editWord(rowData)}
          className="edit-button"
          severity="info"
          size="small"
          tooltip="Edit word"
        />
        <Button
          icon="pi pi-trash"
          onClick={() => deleteWord(rowData)}
          className="delete-button"
          severity="danger"
          size="small"
          tooltip="Delete word"
        />
        <Button
          icon={rowData.display === 1 ? "pi pi-eye" : "pi pi-eye-slash"}
          onClick={() => toggleWordStatus(rowData)}
          className={`status-toggle-button ${rowData.display === 1 ? 'active' : 'inactive'}`}
          severity={rowData.display === 1 ? 'success' : 'secondary'}
          size="small"
          tooltip={rowData.display === 1 ? 'Click to deactivate' : 'Click to activate'}
        />
      </div>
    )
  }

  // Render search header
  const renderHeader = () => {
    return (
      <div className="table-header">
        <div className="search-container">
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText
              value={globalFilterValue}
              onChange={onGlobalFilterChange}
              placeholder="Search words..."
              className="search-input"
            />
          </span>
          {globalFilterValue && (
            <Button
              icon="pi pi-times"
              onClick={clearSearch}
              className="clear-search-button"
              severity="secondary"
              size="small"
              tooltip="Clear search"
            />
          )}
        </div>
        <Button
          label="Add New Word"
          icon="pi pi-plus"
          onClick={openAddDialog}
          className="add-word-button"
          severity="success"
          disabled={selectedFileName === 'ALL' || selectedFileName === 'MULTI'}
        />
      </div>
    )
  }

  useEffect(() => {
    getAvailableFiles()
  }, [])

  return (
    <div className="App">
      <Toast ref={toast} />
      
      <h1>Quizlet - English to Russian Dictionary</h1>
      
      <div className="file-buttons" style={{ marginBottom: '20px' }}>
        <h3>Select a vocabulary file:</h3>
        <p className="selection-hint">Hold <strong>Shift</strong> and click to select multiple lessons</p>
        {/* ALL Button */}
        <Button
            label="ALL"
            onClick={() => loadAllData()}
            className={`vocabulary-button all-button ${selectedFileName === 'ALL' ? 'active' : ''}`}
            severity={selectedFileName === 'ALL' ? 'success' : 'info'}
        />
        {availableFiles.map((fileName) => (
          <Button
            key={fileName}
            label={fileName.charAt(0).toUpperCase() + fileName.slice(1)}
            onClick={(e) => handleFileSelection(fileName, e)}
            className={`vocabulary-button ${
              selectedFileName === fileName || selectedFileNames.includes(fileName) ? 'active' : ''
            } ${selectedFileNames.includes(fileName) ? 'multi-selected' : ''}`}
            severity={
              selectedFileName === fileName || selectedFileNames.includes(fileName) ? 'success' : 'secondary'
            }
          />
        ))}
      </div>

      {/* Display selected files info */}
      {selectedFileNames.length > 0 && (
        <div className="multi-selection-info">
          <p>
            <strong>Selected lessons:</strong> {selectedFileNames.join(', ')} 
            <Button 
              icon="pi pi-times" 
              onClick={() => {
                setSelectedFileNames([])
                setAllData([])
                setSelectedData([])
                setSelectedFileName('')
              }}
              className="clear-selection-button"
              severity="secondary"
              size="small"
              tooltip="Clear selection"
            />
          </p>
        </div>
      )}

      {/* Settings Section */}
      {selectedFileName && (
        <div className="settings-section">
          <h3><i className="pi pi-cog"></i> Settings</h3>
          
          <div className="settings-group">
            <div className="setting-item">
              <label>Display Options:</label>
              <div className="setting-buttons">
                <Button
                  label="Active Words"
                  icon="pi pi-eye"
                  onClick={showActiveWords}
                  className={`filter-button ${displayFilter === 'active' ? 'active' : ''}`}
                  severity={displayFilter === 'active' ? 'success' : 'secondary'}
                  size="small"
                />
                <Button
                  label="All Words"
                  icon="pi pi-list"
                  onClick={showAllWords}
                  className={`filter-button ${displayFilter === 'all' ? 'active' : ''}`}
                  severity={displayFilter === 'all' ? 'success' : 'secondary'}
                  size="small"
                />
              </div>
            </div>
            
            <div className="setting-item">
              <label>Primary Language:</label>
              <div className="setting-buttons">
                <Button 
                  label="Eng"
                  icon="pi pi-flag"
                  onClick={switchToEnglish}
                  className={`language-button ${primaryLanguage === 'english' ? 'active' : ''}`}
                  severity={primaryLanguage === 'english' ? 'info' : 'secondary'}
                  size="small"
                />
                <Button 
                  label="Rus"
                  icon="pi pi-flag-fill"
                  onClick={switchToRussian}
                  className={`language-button ${primaryLanguage === 'russian' ? 'active' : ''}`}
                  severity={primaryLanguage === 'russian' ? 'info' : 'secondary'}
                  size="small"
                />
              </div>
            </div>
          </div>
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
                      {(selectedFileName === 'ALL' || selectedFileName === 'MULTI') && selectedData[currentCardIndex]?.source && (
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
                      {(selectedFileName === 'ALL' || selectedFileName === 'MULTI') && selectedData[currentCardIndex]?.source && (
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

          {/* Data Table with Search and Edit functionality */}
          {showTable && (
            <div className="data-table">
              <h3>Vocabulary: {getDisplayTitle()}</h3>
              <DataTable 
                value={selectedData}
                filters={filters}
                globalFilterFields={['eng', 'rus', 'source']}
                header={renderHeader()}
                tableStyle={{ minWidth: '50rem' }}
                paginator 
                rows={10} 
                rowsPerPageOptions={[5, 10, 25, 50]}
                totalRecords={selectedData.length}
                paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                currentPageReportTemplate="{first} to {last} of {totalRecords} entries"
                emptyMessage="No words found."
              >
                <Column field="eng" header="English" style={{ width: '25%' }}></Column>
                <Column field="rus" header="Russian" style={{ width: '25%' }}></Column>
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
                {(selectedFileName === 'ALL' || selectedFileName === 'MULTI') && (
                  <Column field="source" header="Source" style={{ width: '15%' }}></Column>
                )}
                <Column 
                  header="Actions" 
                  style={{ width: '25%', textAlign: 'center' }}
                  body={renderActionButtons}
                ></Column>
              </DataTable>
            </div>
          )}
        </>
      )}

      {/* Edit Word Dialog */}
      <Dialog
        header="Edit Word"
        visible={showEditDialog}
        onHide={() => setShowEditDialog(false)}
        style={{ width: '500px' }}
        modal
      >
        <div className="dialog-content">
          <div className="form-field">
            <label htmlFor="edit-eng">English:</label>
            <InputText
              id="edit-eng"
              value={editForm.eng}
              onChange={(e) => setEditForm({ ...editForm, eng: e.target.value })}
              className="form-input"
              placeholder="Enter English word"
            />
          </div>
          <div className="form-field">
            <label htmlFor="edit-rus">Russian:</label>
            <InputText
              id="edit-rus"
              value={editForm.rus}
              onChange={(e) => setEditForm({ ...editForm, rus: e.target.value })}
              className="form-input"
              placeholder="Enter Russian word"
            />
          </div>
          <div className="form-field">
            <label htmlFor="edit-display">Status:</label>
            <Dropdown
              id="edit-display"
              value={editForm.display}
              onChange={(e) => setEditForm({ ...editForm, display: e.value })}
              options={[
                { label: 'Active', value: 1 },
                { label: 'Inactive', value: 0 }
              ]}
              className="form-input"
            />
          </div>
          <div className="dialog-buttons">
            <Button
              label="Cancel"
              onClick={() => setShowEditDialog(false)}
              severity="secondary"
            />
            <Button
              label="Save"
              onClick={saveEditedWord}
              severity="success"
            />
          </div>
        </div>
      </Dialog>

      {/* Add New Word Dialog */}
      <Dialog
        header="Add New Word"
        visible={showAddDialog}
        onHide={() => setShowAddDialog(false)}
        style={{ width: '500px' }}
        modal
      >
        <div className="dialog-content">
          <div className="form-field">
            <label htmlFor="add-eng">English: *</label>
            <InputText
              id="add-eng"
              value={addForm.eng}
              onChange={(e) => setAddForm({ ...addForm, eng: e.target.value })}
              className="form-input"
              placeholder="Enter English word"
            />
          </div>
          <div className="form-field">
            <label htmlFor="add-rus">Russian: *</label>
            <InputText
              id="add-rus"
              value={addForm.rus}
              onChange={(e) => setAddForm({ ...addForm, rus: e.target.value })}
              className="form-input"
              placeholder="Enter Russian word"
            />
          </div>
          <div className="form-field">
            <label htmlFor="add-source">File: *</label>
            <Dropdown
              id="add-source"
              value={addForm.source}
              onChange={(e) => setAddForm({ ...addForm, source: e.value })}
              options={availableFiles.map(file => ({ label: file.charAt(0).toUpperCase() + file.slice(1), value: file }))}
              className="form-input"
              placeholder="Select file"
            />
          </div>
          <div className="form-field">
            <label htmlFor="add-display">Status:</label>
            <Dropdown
              id="add-display"
              value={addForm.display}
              onChange={(e) => setAddForm({ ...addForm, display: e.value })}
              options={[
                { label: 'Active', value: 1 },
                { label: 'Inactive', value: 0 }
              ]}
              className="form-input"
            />
          </div>
          <div className="dialog-buttons">
            <Button
              label="Cancel"
              onClick={() => setShowAddDialog(false)}
              severity="secondary"
            />
            <Button
              label="Add"
              onClick={saveNewWord}
              severity="success"
            />
          </div>
        </div>
      </Dialog>
    </div>
  )
}

export default App
