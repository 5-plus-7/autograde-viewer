/**
 * 飞书多维表格API工具函数
 * 
 * 使用说明：
 * 1. 需要在飞书开放平台创建应用并获取 App ID 和 App Secret
 * 2. 需要获取多维表格的 app_token 和 table_id
 * 3. 确保应用有读取多维表格的权限
 */

// 配置信息（需要替换为实际值）
const FEISHU_CONFIG = {
  appId: 'cli_a87dfad03ee59013', // 替换为你的飞书应用ID
  appSecret: 'R8NwfJmbj0xgIx4sbgrG0dlnWIAA0uuv', // 替换为你的飞书应用Secret
  appToken: 'UlN7bF5c5aLbYWsoKGGcwJwcnge', // 替换为多维表格的app_token
  tableId: 'tblOJdsjjgzL9fFx', // 替换为表格ID
  jsonColumnName: '自动批改结果json链接', // JSON文件链接所在的列名
}

/**
 * 获取飞书API访问令牌
 */
async function getTenantAccessToken() {
  try {
    const response = await fetch('/api/feishu/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: FEISHU_CONFIG.appId,
        app_secret: FEISHU_CONFIG.appSecret,
      }),
    })

    const data = await response.json()
    
    console.log('获取Token响应:', data)
    
    if (data.code !== 0) {
      throw new Error(data.msg || '获取access token失败')
    }

    console.log('Token获取成功:', data.tenant_access_token.substring(0, 20) + '...')
    return data.tenant_access_token
  } catch (error) {
    console.error('获取飞书token失败:', error)
    throw error
  }
}

/**
 * 根据记录ID查询多维表格数据
 * @param {string} recordId - 记录ID
 * @returns {Promise<string>} - 返回JSON文件的URL
 */
export async function fetchRecordByIdFromFeishu(recordId) {
  try {
    // 1. 获取访问令牌
    const token = await getTenantAccessToken()

    // 2. 列出所有记录，然后在客户端过滤
    const listUrl = `/api/feishu/bitable/v1/apps/${FEISHU_CONFIG.appToken}/tables/${FEISHU_CONFIG.tableId}/records`
    
    const searchResponse = await fetch(listUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const searchData = await searchResponse.json()
    
    console.log('飞书API响应:', searchData)

    if (searchData.code !== 0) {
      console.error('飞书API错误:', {
        code: searchData.code,
        msg: searchData.msg,
        full: searchData
      })
      
      if (searchData.code === 99991663) {
        throw new Error('权限不足：请在飞书开放平台为应用添加"查看、评论和编辑多维表格"权限')
      }
      throw new Error(`${searchData.msg || '查询记录失败'} (错误码: ${searchData.code})`)
    }

    if (!searchData.data.items || searchData.data.items.length === 0) {
      throw new Error('表格中没有数据')
    }

    // 3. 在客户端过滤匹配的记录
    const matchedRecord = searchData.data.items.find(item => {
      // 尝试多个可能的ID字段名
      const idValue = item.fields['ID'] || 
                      item.fields['id'] || 
                      item.fields['记录ID'] ||
                      item.fields['record_id']
      return idValue && idValue.toString() === recordId.toString()
    })

    if (!matchedRecord) {
      throw new Error(`未找到ID为 ${recordId} 的记录`)
    }

    // 4. 从记录中提取JSON文件URL
    const jsonUrl = matchedRecord.fields[FEISHU_CONFIG.jsonColumnName]

    if (!jsonUrl) {
      throw new Error(`记录中未找到"${FEISHU_CONFIG.jsonColumnName}"字段`)
    }

    console.log('找到JSON链接:', jsonUrl)
    return jsonUrl
  } catch (error) {
    console.error('从飞书获取数据失败:', error)
    throw error
  }
}

/**
 * 从URL获取JSON数据
 * @param {string} url - JSON文件的URL
 * @returns {Promise<Object>} - 返回解析后的JSON数据
 */
export async function fetchJSONFromUrl(url) {
  try {
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error('获取JSON文件失败')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('获取JSON数据失败:', error)
    throw error
  }
}

/**
 * 主函数：根据记录ID获取完整的批改数据
 * @param {string} recordId - 记录ID
 * @returns {Promise<Object>} - 返回批改数据
 */
export async function fetchGradingData(recordId) {
  try {
    // 1. 从飞书获取JSON文件URL
    const jsonUrl = await fetchRecordByIdFromFeishu(recordId)
    
    // 2. 从URL获取JSON数据
    const data = await fetchJSONFromUrl(jsonUrl)
    
    return data
  } catch (error) {
    console.error('获取批改数据失败:', error)
    throw error
  }
}

/**
 * 配置更新函数
 * @param {Object} config - 新的配置
 */
export function updateFeishuConfig(config) {
  Object.assign(FEISHU_CONFIG, config)
}

export default {
  fetchGradingData,
  fetchRecordByIdFromFeishu,
  fetchJSONFromUrl,
  updateFeishuConfig,
}

