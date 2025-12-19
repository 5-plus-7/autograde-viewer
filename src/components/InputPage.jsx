import React, { useState, useEffect } from 'react'
import './InputPage.css'

function InputPage({ onSubmit, isLoading }) {
  const [recordId, setRecordId] = useState('')

  // 从URL参数中读取recordId并预置到输入框
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const recordIdFromUrl = urlParams.get('recordId') || urlParams.get('id')
    
    if (recordIdFromUrl) {
      setRecordId(recordIdFromUrl)
    }
  }, []) // 只在组件挂载时执行一次

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!recordId.trim()) {
      alert('请输入记录ID')
      return
    }
    await onSubmit(recordId.trim())
  }

  return (
    <div className="input-page">
      <div className="input-container">
        <div className="logo">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
            <rect width="60" height="60" rx="12" fill="white" fillOpacity="0.2"/>
            <path d="M20 30L27 37L40 24" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="title">作业批改查看器</h1>
        <p className="subtitle">输入记录ID查看批改结果</p>
        
        <form onSubmit={handleSubmit} className="input-form">
          <div className="input-group">
            <input
              type="text"
              value={recordId}
              onChange={(e) => setRecordId(e.target.value)}
              placeholder="请输入记录ID"
              className="input-field"
              disabled={isLoading}
              autoFocus
            />
          </div>
          
          <button 
            type="submit" 
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading">
                <span className="loading-spinner"></span>
                正在加载...
              </span>
            ) : (
              '查看批改结果'
            )}
          </button>
        </form>
        
        <div className="tips">
          <p>💡 提示：输入您收到的作业记录ID</p>
        </div>
      </div>
    </div>
  )
}

export default InputPage

