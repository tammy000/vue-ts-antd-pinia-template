import request from '@/utils/request'

export function getData( data?: any) {
  return request({
    url: '/api/hotSearch',
    method: 'get',
    data
  })
}

export function addChat( data?: any) {
  return request({
    url: '/api/file/chat/add/v2',
    method: 'post',
    data
  })
}

export function listChat( data?: any) {
  return request({
    url: '/api/file/chat/list',
    method: 'get',
    data
  })
}

export function deleteChat( data?: any) {
  return request({
    url: '/api/file/chat/delete',
    method: 'post',
    data
  })
}

export function updateTag( data?: any) {
  return request({
    url: '/api/file/chat/update/tag',
    method: 'post',
    data
  })
}

export function completionChat( data?: any) {
  return request({
    url: '/api/file/chat/completion',
    method: 'post',
    data
  })
}

export function historyChat( data?: any): Array {
  return request({
    url: '/api/file/chat/completion/history?fileId=' + data.fileId,
    method: 'get',
  })
}

export function questionsChat( data?: any) {
  return request({
    url: '/api/file/chat/completion/builtin/questions',
    method: 'get',
  })
}

export function historyClear( data?: any) {
  return request({
    url: '/api/file/chat/completion/history/clear',
    method: 'post',
    data
  })
}

export function tableExcel( data?: any) {
  return request({
    url: '/api/file/ocr/table/excel',
    method: 'post',
    responseType: 'blob',
    data
  })
}