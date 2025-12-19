import React, { useState } from 'react'
import InputPage from './components/InputPage'
import ViewerPage from './components/ViewerPage'
import { fetchGradingData } from './utils/feishuAPI'
import './App.css'

function App() {
  const [recordData, setRecordData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleFetchData = async (recordId) => {
    setIsLoading(true)
    try {
      // 从飞书API获取批改数据
      const data = await fetchGradingData(recordId)
      
      if (data && data.length > 0) {
        setRecordData(data)
        return true
      } else {
        throw new Error('未找到对应的记录或数据为空')
      }
    } catch (error) {
      console.error('获取数据错误:', error)
      alert(error.message || '获取数据失败，请检查ID是否正确')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    setRecordData(null)
  }

  return (
    <div className="app">
      {!recordData ? (
        <InputPage onSubmit={handleFetchData} isLoading={isLoading} />
      ) : (
        <ViewerPage data={recordData} onBack={handleBack} />
      )}
    </div>
  )
}

export default App

