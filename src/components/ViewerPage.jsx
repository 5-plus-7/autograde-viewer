import React, { useState, useEffect } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'
import './ViewerPage.css'

function ViewerPage({ data, onBack }) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [excalidrawAPI, setExcalidrawAPI] = useState(null)

  const currentPage = data[currentPageIndex]
  const totalPages = data.length

  // 当API或页面切换时，加载图片和标记
  useEffect(() => {
    if (excalidrawAPI && currentPage) {
      loadImageToCanvas()
    }
  }, [currentPageIndex, excalidrawAPI])
  
  // 文本配置常量（基于图片宽度的百分比）
  const TEXT_CONFIG = {
    QUESTION_FONT_SIZE_RATIO: 0.024, // 题号字体大小 = 图片宽度 * 0.024
    ANALYSIS_FONT_SIZE_RATIO: 0.020, // 批注字体大小 = 图片宽度 * 0.02
    ANALYSIS_MAX_WIDTH_RATIO: 0.5,   // 批注区域宽度 = 图片宽度 * 0.5
    LINE_HEIGHT_RATIO: 1.5,          // 行高系数 = 字体大小 * 1.5
    QUESTION_SPACING_RATIO: 0.015,    // 题号间距 = 图片宽度 * 0.015
    ANALYSIS_SPACING_RATIO: 0.02,   // 批注间距 = 图片宽度 * 0.02
  }

  /**
   * 根据固定宽度自动换行文本
   * @param {string} text 原始文本
   * @param {number} maxWidth 最大宽度（像素）
   * @param {number} fontSize 字体大小
   * @returns {string[]} 换行后的文本行数组
   */
  const wrapTextByWidth = (text, maxWidth, fontSize) => {
    const lines = []
    const chineseCharWidth = fontSize // 中文字符宽度约等于字体大小
    const uppercaseCharWidth = fontSize * 0.7 // 大写字母70%汉字宽度
    const lowercaseCharWidth = fontSize * 0.5 // 小写字母50%汉字宽度
    const numberCharWidth = fontSize * 0.6 // 数字60%汉字宽度
    const specialCharWidth = fontSize * 0.5 // 特殊字符50%汉字宽度
    const spaceWidth = fontSize * 0.4 // 空格宽度
    const punctuationPattern = /[，。、"''"：《》＜＞<>（）()、；;：:，,.!?！？”“]/
    const operatorPattern = /[+\-*/=^%]/

    // 按中文单字、英文单词、空白、单个符号切分，保留所有字符
    const tokens = text.match(/([\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]|[A-Za-z0-9]+|\s+|.)/g) || []

    let currentLine = ''
    let currentLineWidth = 0

    const getCharWidth = (char) => {
      if (/\s/.test(char)) return spaceWidth // 空白字符
      if (/[A-Z]/.test(char)) return uppercaseCharWidth // 大写字母
      if (/[a-z]/.test(char)) return lowercaseCharWidth // 小写字母
      if (/[0-9]/.test(char)) return numberCharWidth // 数字
      if (/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/.test(char)) return chineseCharWidth // 中文字符
      return specialCharWidth // 特殊字符
    }

    const getTokenWidth = (token) => {
      let width = 0
      for (let i = 0; i < token.length; i++) {
        width += getCharWidth(token[i])
      }
      return width
    }

    tokens.forEach((token) => {
      const isPunct = punctuationPattern.test(token) || operatorPattern.test(token)
      const isSpace = /^\s+$/.test(token)
      const tokenWidth = getTokenWidth(token)

      // 不让行首出现空白
      if (isSpace && currentLineWidth === 0) {
        return
      }

      // 如果行首遇到标点/运算符且已有上一行，则附加到上一行末尾
      if (isPunct && currentLineWidth === 0 && lines.length > 0) {
        lines[lines.length - 1] += token
        return
      }

      const wouldExceed = currentLineWidth + tokenWidth > maxWidth

      if (wouldExceed && currentLineWidth > 0) {
        lines.push(currentLine)
        currentLine = ''
        currentLineWidth = 0
      }

      currentLine += token
      currentLineWidth += tokenWidth
    })

    if (currentLine.length > 0) {
      lines.push(currentLine)
    }

    return lines
  }

  // 根据 URL 后缀检查是否为图片类型
  const isImageUrl = (url) => {
    if (!url || typeof url !== 'string') return false
    const lower = url.split('?')[0].toLowerCase()
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']
    return imageExtensions.some(ext => lower.endsWith(ext))
  }

  // 获取图片页面的索引列表
  const getImagePageIndices = () => {
    return data
      .map((page, index) => ({ page, index }))
      .filter(({ page }) => page && page.image_url && isImageUrl(page.image_url))
      .map(({ index }) => index)
  }

  // 当页面切换时，如果当前页面不是图片类型，自动跳转到第一个图片页面
  useEffect(() => {
    if (data && data.length > 0) {
      const imagePageIndices = getImagePageIndices()
      if (imagePageIndices.length > 0) {
        const currentIsImage = currentPage && currentPage.image_url && isImageUrl(currentPage.image_url)
        if (!currentIsImage) {
          // 当前页面不是图片类型，跳转到第一个图片页面
          setCurrentPageIndex(imagePageIndices[0])
        }
      }
    }
  }, [data])
  
  // 加载图片到画布
  const loadImageToCanvas = async () => {
    if (!excalidrawAPI || !currentPage.image_url) return

    // 检查URL是否为图片类型
    if (!isImageUrl(currentPage.image_url)) {
      console.warn('URL不是图片类型，跳过加载:', currentPage.image_url)
      return
    }

    try {
      // 使用CORS代理或直接加载图片
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      const { width: imageWidth, height: imageHeight } = await new Promise((resolve, reject) => {
        img.onload = () => {
          resolve({ width: img.width, height: img.height })
        }
        img.onerror = reject
        img.src = currentPage.image_url
      })

      // 将图片转为DataURL
      const canvas = document.createElement('canvas')
      canvas.width = imageWidth
      canvas.height = imageHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const dataURL = canvas.toDataURL('image/png')
      
      // 创建一个唯一的文件ID
      const fileId = `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // 准备文件数据
      const fileData = {
        mimeType: 'image/png',
        id: fileId,
        dataURL: dataURL,
        created: Date.now(),
      }

      // 创建图片元素和标记
      const elements = []
      const imageX = 100
      const imageY = 100
      const displayWidth = imageWidth
      
      // 根据图片宽度计算文本配置的实际值
      const textConfig = {
        questionFontSize: Math.round(displayWidth * TEXT_CONFIG.QUESTION_FONT_SIZE_RATIO),
        analysisFontSize: Math.round(displayWidth * TEXT_CONFIG.ANALYSIS_FONT_SIZE_RATIO),
        analysisMaxWidth: Math.round(displayWidth * TEXT_CONFIG.ANALYSIS_MAX_WIDTH_RATIO),
        lineHeight: Math.round(TEXT_CONFIG.LINE_HEIGHT_RATIO),
        questionSpacing: Math.round(displayWidth * TEXT_CONFIG.QUESTION_SPACING_RATIO),
        analysisSpacing: Math.round(displayWidth * TEXT_CONFIG.ANALYSIS_SPACING_RATIO),
      }
      
      // 1. 添加图片元素
      const imageElement = {
        type: 'image',
        id: `img-${Date.now()}`,
        fileId: fileId,
        x: imageX,
        y: imageY,
        width: imageWidth,
        height: imageHeight,
        angle: 0,
        strokeColor: 'transparent',
        backgroundColor: 'transparent',
        fillStyle: 'solid',
        strokeWidth: 1,
        strokeStyle: 'solid',
        roughness: 0,
        opacity: 100,
        groupIds: [],
        frameId: null,
        roundness: null,
        seed: Math.floor(Math.random() * 100000),
        version: 1,
        versionNonce: Math.floor(Math.random() * 100000),
        isDeleted: false,
        boundElements: null,
        updated: Date.now(),
        link: null,
        locked: false,
        scale: [1, 1],
        status: 'saved',
      }
      elements.push(imageElement)

      // 2. 添加标记和批注信息
      let markerId = 2000
      let subjectiveY = 120 // 用于定位右侧批注信息的y轴位置
      const addedQuestionTitles = new Set() // 记录已添加题号文本的题目，避免重复

      if (currentPage.questions_info && Array.isArray(currentPage.questions_info)) {
        currentPage.questions_info.forEach((question, qIndex) => {
          let hasAnalysisText = false // 标记本题是否添加过批改分析文本

          if (question.answer_steps && Array.isArray(question.answer_steps)) {
            question.answer_steps.forEach((step) => {
              if (step.answer_location && step.answer_location.length === 4) {
                const [x1, y1, x2, y2] = step.answer_location
                
                // 计算相对于图片的实际位置
                const width = x2 - x1
                const height = y2 - y1
                const centerX = imageX + x1 + width / 2
                const centerY = imageY + y1 + height / 2

                // 根据 GradeExcalidrawPreview.tsx 的逻辑处理不同情况
                const modelsConsistent = step.models_consistent !== false // 默认为 true（如果字段不存在）

                // 情况1: 正确且模型一致 - 只显示红色对勾，不显示批注
                if (step.is_correct && modelsConsistent) {
                  const checkSize = 0.75 * Math.min(
                    0.12 * displayWidth,
                    Math.max(
                      0.2 * (width + height),
                      0.6 * Math.min(width, height),
                      0.04 * displayWidth
                    )
                  )
                  
                  elements.push({
                    type: 'line',
                    id: `check-${markerId++}`,
                    x: centerX - checkSize,
                    y: centerY - checkSize,
                    width: checkSize * 3.2,
                    height: checkSize * 3.2,
                    angle: 0,
                    strokeColor: 'red',
                    backgroundColor: 'transparent',
                    fillStyle: 'solid',
                    strokeWidth: 4,
                    strokeStyle: 'solid',
                    roughness: 1.4,
                    opacity: 100,
                    groupIds: [],
                    frameId: null,
                    roundness: null,
                    seed: Math.floor(Math.random() * 100000),
                    version: 1,
                    versionNonce: Math.floor(Math.random() * 100000),
                    isDeleted: false,
                    boundElements: null,
                    updated: Date.now(),
                    points: [
                      [0, 0],
                      [checkSize * 0.20, checkSize * 0.30],
                      [checkSize * 0.45, checkSize * 0.60],
                      [checkSize * 0.65, checkSize * 0.80],
                      [checkSize * 0.90, checkSize * 0.95],
                      [checkSize * 1.10, checkSize * 0.85],
                      [checkSize * 1.30, checkSize * 0.70],
                      [checkSize * 1.60, checkSize * 0.45],
                      [checkSize * 1.95, checkSize * 0.05],
                      [checkSize * 2.40, -checkSize * 0.70],
                      [checkSize * 3.20, -checkSize * 2.40]
                    ],
                    lastCommittedPoint: [checkSize * 3.20, -checkSize * 2.40],
                    startBinding: null,
                    endBinding: null,
                    startArrowhead: null,
                    endArrowhead: null,
                  })
                }
                // 情况2: 正确但模型不一致 - 显示紫色圆圈，显示题号和批注（使用 qwen_result.analysis）
                else if (step.is_correct && !modelsConsistent) {
                  const baseScale = 2.0
                  const maxWidthForScale = 0.7 * displayWidth
                  const scaleFactor = 1 + (baseScale - 1) * Math.max(0, (maxWidthForScale - width) / maxWidthForScale)

                  elements.push({
                    type: 'ellipse',
                    id: `circle-${markerId++}`,
                    x: imageX + x1 - width * scaleFactor * 0.2,
                    y: imageY + y1 - height * scaleFactor * 0.2,
                    width: width * scaleFactor,
                    height: height * scaleFactor,
                    angle: 0,
                    strokeColor: 'purple',
                    backgroundColor: 'transparent',
                    fillStyle: 'solid',
                    strokeWidth: 3,
                    strokeStyle: 'solid',
                    roughness: 1.4,
                    opacity: 100,
                    groupIds: [],
                    frameId: null,
                    roundness: null,
                    seed: Math.floor(Math.random() * 100000),
                    version: 1,
                    versionNonce: Math.floor(Math.random() * 100000),
                    isDeleted: false,
                    boundElements: null,
                    updated: Date.now(),
                  })

                  // 添加题号文本（每个题目只添加一次）
                  if (question.question_number && !addedQuestionTitles.has(question.question_number)) {
                    elements.push({
                      type: 'text',
                      x: imageX + displayWidth + 20,
                      y: subjectiveY,
                      width: textConfig.analysisMaxWidth,
                      height: textConfig.questionFontSize * 2,
                      text: `题号: ${question.question_number}`,
                      fontSize: textConfig.questionFontSize,
                      fontFamily: 1,
                      textAlign: 'left',
                      verticalAlign: 'top',
                      strokeColor: '#333',
                      fillStyle: 'solid',
                    })
                    subjectiveY += textConfig.questionSpacing
                    addedQuestionTitles.add(question.question_number)
                  }

                  // 添加批注分析文本（使用 qwen_result.analysis）
                  if (step.qwen_result && step.qwen_result.analysis) {
                    const hasMultipleSteps = question.answer_steps.length > 1
                    const analysisText = hasMultipleSteps
                      ? `(${step.step_id})${step.qwen_result.analysis}`
                      : step.qwen_result.analysis

                    const newlineCount = (analysisText.match(/\n/g) || []).length
                    const fontSizeNumber = textConfig.analysisFontSize
                    const maxWidth = textConfig.analysisMaxWidth
                    const lines = wrapTextByWidth(analysisText, maxWidth, fontSizeNumber)
                    const verticalPadding = Math.max(fontSizeNumber * 0.5, 10) // 上下各留出字体大小50%或至少10像素的空间
                    const textHeight = (lines.length + newlineCount) * fontSizeNumber * textConfig.lineHeight + verticalPadding

                    // 添加包含分析文本的矩形框
                    elements.push({
                      type: 'rectangle',
                      x: imageX + displayWidth + 20,
                      y: subjectiveY + textConfig.analysisSpacing,
                      width: maxWidth,
                      height: textHeight,
                      strokeColor: 'white',
                      backgroundColor: 'transparent',
                      label: {
                        text: analysisText,
                        strokeColor: 'purple',
                        fontSize: fontSizeNumber,
                        textAlign: 'left',
                        verticalAlign: 'top',
                      },
                    })

                    subjectiveY += textHeight + textConfig.analysisSpacing
                    hasAnalysisText = true
                  }
                }
                // 情况3: 错误但模型不一致 - 显示橙色圆圈，显示题号和批注（使用 step.analysis）
                else if (!step.is_correct && !modelsConsistent) {
                  const baseScale = 2.0
                  const maxWidthForScale = 0.7 * displayWidth
                  const scaleFactor = 1 + (baseScale - 1) * Math.max(0, (maxWidthForScale - width) / maxWidthForScale)

                  elements.push({
                    type: 'ellipse',
                    id: `circle-${markerId++}`,
                    x: imageX + x1 - width * scaleFactor * 0.2,
                    y: imageY + y1 - height * scaleFactor * 0.2,
                    width: width * scaleFactor,
                    height: height * scaleFactor,
                    angle: 0,
                    strokeColor: 'orange',
                    backgroundColor: 'transparent',
                    fillStyle: 'solid',
                    strokeWidth: 3,
                    strokeStyle: 'solid',
                    roughness: 1.4,
                    opacity: 100,
                    groupIds: [],
                    frameId: null,
                    roundness: null,
                    seed: Math.floor(Math.random() * 100000),
                    version: 1,
                    versionNonce: Math.floor(Math.random() * 100000),
                    isDeleted: false,
                    boundElements: null,
                    updated: Date.now(),
                  })

                  // 添加题号文本
                  if (question.question_number && !addedQuestionTitles.has(question.question_number)) {
                    elements.push({
                      type: 'text',
                      x: imageX + displayWidth + 20,
                      y: subjectiveY,
                      width: textConfig.analysisMaxWidth,
                      height: textConfig.questionFontSize * 2,
                      text: `题号: ${question.question_number}`,
                      fontSize: textConfig.questionFontSize,
                      fontFamily: 1,
                      textAlign: 'left',
                      verticalAlign: 'top',
                      strokeColor: '#333',
                      fillStyle: 'solid',
                    })
                    subjectiveY += textConfig.questionSpacing
                    addedQuestionTitles.add(question.question_number)
                  }

                  // 添加批注分析文本（使用 step.analysis）
                  if (step.analysis) {
                    const hasMultipleSteps = question.answer_steps.length > 1
                    const analysisText = hasMultipleSteps
                      ? `(${step.step_id})${step.analysis}`
                      : step.analysis

                    const newlineCount = (analysisText.match(/\n/g) || []).length
                    const fontSizeNumber = textConfig.analysisFontSize
                    const maxWidth = textConfig.analysisMaxWidth
                    const lines = wrapTextByWidth(analysisText, maxWidth, fontSizeNumber)
                    const verticalPadding = Math.max(fontSizeNumber * 0.5, 10) // 上下各留出字体大小50%或至少10像素的空间
                    const textHeight = (lines.length + newlineCount) * fontSizeNumber * textConfig.lineHeight + verticalPadding

                    // 添加包含分析文本的矩形框
                    elements.push({
                      type: 'rectangle',
                      x: imageX + displayWidth + 20,
                      y: subjectiveY + textConfig.analysisSpacing,
                      width: maxWidth,
                      height: textHeight,
                      strokeColor: 'white',
                      backgroundColor: 'transparent',
                      label: {
                        text: analysisText,
                        strokeColor: 'orange',
                        fontSize: fontSizeNumber,
                        textAlign: 'left',
                        verticalAlign: 'top',
                      },
                    })

                    subjectiveY += textHeight + textConfig.analysisSpacing
                    hasAnalysisText = true
                  }
                }
                // 情况4: 错误且模型一致 - 显示红色圆圈，显示题号和批注（使用 step.analysis）
                else {
                  const baseScale = 2.0
                  const maxWidthForScale = 0.7 * displayWidth
                  const scaleFactor = 1 + (baseScale - 1) * Math.max(0, (maxWidthForScale - width) / maxWidthForScale)

                  elements.push({
                    type: 'ellipse',
                    id: `circle-${markerId++}`,
                    x: imageX + x1 - width * scaleFactor * 0.2,
                    y: imageY + y1 - height * scaleFactor * 0.2,
                    width: width * scaleFactor,
                    height: height * scaleFactor,
                    angle: 0,
                    strokeColor: 'red',
                    backgroundColor: 'transparent',
                    fillStyle: 'solid',
                    strokeWidth: 3,
                    strokeStyle: 'solid',
                    roughness: 1.4,
                    opacity: 100,
                    groupIds: [],
                    frameId: null,
                    roundness: null,
                    seed: Math.floor(Math.random() * 100000),
                    version: 1,
                    versionNonce: Math.floor(Math.random() * 100000),
                    isDeleted: false,
                    boundElements: null,
                    updated: Date.now(),
                  })

                  // 添加题号文本
                  if (question.question_number && !addedQuestionTitles.has(question.question_number)) {
                    elements.push({
                      type: 'text',
                      x: imageX + displayWidth + 20,
                      y: subjectiveY,
                      width: textConfig.analysisMaxWidth,
                      height: textConfig.questionFontSize * 2,
                      text: `题号: ${question.question_number}`,
                      fontSize: textConfig.questionFontSize,
                      fontFamily: 1,
                      textAlign: 'left',
                      verticalAlign: 'top',
                      strokeColor: '#333',
                      fillStyle: 'solid',
                    })
                    subjectiveY += textConfig.questionSpacing
                    addedQuestionTitles.add(question.question_number)
                  }

                  // 添加批注分析文本（使用 step.analysis）
                  if (step.analysis) {
                    const hasMultipleSteps = question.answer_steps.length > 1
                    const analysisText = hasMultipleSteps
                      ? `(${step.step_id})${step.analysis}`
                      : step.analysis

                    const newlineCount = (analysisText.match(/\n/g) || []).length
                    const fontSizeNumber = textConfig.analysisFontSize
                    const maxWidth = textConfig.analysisMaxWidth
                    const lines = wrapTextByWidth(analysisText, maxWidth, fontSizeNumber)
                    const verticalPadding = Math.max(fontSizeNumber * 0.5, 10) // 上下各留出字体大小50%或至少10像素的空间
                    const textHeight = (lines.length + newlineCount) * fontSizeNumber * textConfig.lineHeight + verticalPadding

                    // 添加包含分析文本的矩形框
                    elements.push({
                      type: 'rectangle',
                      x: imageX + displayWidth + 20,
                      y: subjectiveY + textConfig.analysisSpacing,
                      width: maxWidth,
                      height: textHeight,
                      strokeColor: 'white',
                      backgroundColor: 'transparent',
                      label: {
                        text: analysisText,
                        strokeColor: 'red',
                        fontSize: fontSizeNumber,
                        textAlign: 'left',
                        verticalAlign: 'top',
                      },
                    })

                    subjectiveY += textHeight + textConfig.analysisSpacing
                    hasAnalysisText = true
                  }
                }
              }
            })
          }

          if (hasAnalysisText) {
            subjectiveY += textConfig.analysisSpacing // 仅当本题有分析文本时增加题间间距
          }
        })
      }

      // 使用 convertToExcalidrawElements 转换元素（参考 GradeExcalidrawPreview.tsx）
      const { convertToExcalidrawElements } = await import('@excalidraw/excalidraw')
      
      // 转换所有元素
      const convertedElements = convertToExcalidrawElements(elements)
      
      // 修复元素属性
      const allElements = convertedElements.map((el) => {
        const fixedEl = {
          ...el,
          locked: false,
          points: el.points || (el.type === 'arrow' ? [[0, 0], [el.width || 0, el.height || 0]] : []),
          strokeStyle: el.strokeStyle || 'solid',
          fillStyle: el.fillStyle || 'solid',
        }
        
        if (fixedEl.type === 'arrow' && Array.isArray(fixedEl.points)) {
          fixedEl.points = fixedEl.points.map((p) => (Array.isArray(p) ? p : [0, 0]))
        }
        
        return fixedEl
      })

      // 先添加文件数据到Excalidraw的文件系统
      const files = {}
      files[fileId] = fileData
      
      // 更新场景，同时传递文件
      excalidrawAPI.updateScene({
        elements: allElements,
        appState: {
          viewBackgroundColor: '#ffffff',
        },
      })
      
      // 更新文件
      excalidrawAPI.addFiles([{
        id: fileId,
        dataURL: dataURL,
        mimeType: 'image/png',
        created: Date.now(),
      }])

      // 缩放以适应内容
      setTimeout(() => {
        if (elements.length > 0 && excalidrawAPI.scrollToContent) {
          try {
            excalidrawAPI.scrollToContent(imageElement, {
              fitToContent: true,
              animate: false,
            })
          } catch (e) {
            console.log('scrollToContent不可用')
          }
        }
      }, 300)

    } catch (error) {
      console.error('加载图片失败:', error)
      alert('加载图片失败：' + error.message)
    }
  }

  // 查找下一个/上一个图片类型的页面索引
  const findImagePageIndex = (startIndex, direction) => {
    const step = direction === 'next' ? 1 : -1
    let index = startIndex + step
    
    while (index >= 0 && index < totalPages) {
      if (data[index] && data[index].image_url && isImageUrl(data[index].image_url)) {
        return index
      }
      index += step
    }
    
    return null // 没有找到图片类型的页面
  }

  // 切换页面（只切换到图片类型的页面）
  const handlePageChange = (direction) => {
    const nextIndex = findImagePageIndex(currentPageIndex, direction)
    if (nextIndex !== null) {
      setCurrentPageIndex(nextIndex)
    }
  }

  // 获取当前图片页面在图片页面列表中的位置
  const imagePageIndices = getImagePageIndices()
  const currentImagePageIndex = imagePageIndices.indexOf(currentPageIndex)
  const totalImagePages = imagePageIndices.length

  // 计算统计信息
  const getStatistics = () => {
    if (!currentPage || !currentPage.questions_info) return { total: 0, correct: 0, wrong: 0 }
    
    let correct = 0
    let wrong = 0
    
    currentPage.questions_info.forEach(question => {
      if (question.answer_steps && Array.isArray(question.answer_steps)) {
        question.answer_steps.forEach(step => {
          if (step.is_correct) {
            correct++
          } else {
            wrong++
          }
        })
      }
    })
    
    return { total: correct + wrong, correct, wrong }
  }

  const stats = getStatistics()

  return (
    <div className="viewer-page">
      {/* 顶部导航栏 */}
      <div className="viewer-header">
        <button className="back-button" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"/>
          </svg>
          返回
        </button>

        {totalImagePages > 1 && (
          <div className="page-navigation">
            <button 
              className="nav-button"
              onClick={() => handlePageChange('prev')}
              disabled={currentImagePageIndex === 0 || currentImagePageIndex === -1}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" strokeWidth="2">
                <path d="M10 12L6 8l4-4" stroke="currentColor" fill="none"/>
              </svg>
            </button>
            <span className="page-info">
              第 {currentImagePageIndex >= 0 ? currentImagePageIndex + 1 : 0} / {totalImagePages} 页
            </span>
            <button 
              className="nav-button"
              onClick={() => handlePageChange('next')}
              disabled={currentImagePageIndex === totalImagePages - 1 || currentImagePageIndex === -1}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" strokeWidth="2">
                <path d="M6 12l4-4-4-4" stroke="currentColor" fill="none"/>
              </svg>
            </button>
          </div>
        )}
       
       
      </div>

      {/* Excalidraw画布 */}
      <div className="canvas-container">
        <Excalidraw
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          initialData={{
            appState: {
              viewBackgroundColor: '#ffffff',
              currentItemFontFamily: 1,
              zoom: { value: 1 },
            },
            scrollToContent: true,
          }}
          UIOptions={{
            canvasActions: {
              loadScene: false,
              export: { saveFileToDisk: false },
              toggleTheme: false,
            },
          }}
        />
      </div>

      {/* 题目信息面板 - 暂时隐藏 */}
      {/* {currentPage && (
        <div className="info-panel">
          <div className="info-content">
            <h3>题目信息</h3>
            <div className="questions-list">
              {currentPage.questions_info.map((question, idx) => (
                <div key={idx} className="question-item">
                  <div className="question-header">
                    <span className="question-number">题目 {question.question_number}</span>
                    <span className={`question-type ${question.question_type}`}>
                      {question.question_type}
                    </span>
                  </div>
                  {question.answer_steps.map((step, stepIdx) => (
                    <div key={stepIdx} className="step-item">
                      <div className="step-status">
                        {step.is_correct ? (
                          <span className="status-correct">✓ 正确</span>
                        ) : (
                          <span className="status-wrong">✗ 错误</span>
                        )}
                      </div>
                      {step.analysis && (
                        <div className="step-analysis">{step.analysis}</div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )} */}
    </div>
  )
}

export default ViewerPage


