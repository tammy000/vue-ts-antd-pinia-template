import axios from 'axios'
import { message } from 'ant-design-vue'
import router from '@/router'

const service = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 30000
})

// 请求拦截
service.interceptors.request.use(config => {
  // token 封装，或者接口请求加密
  return config
}, error => {
  return Promise.reject(error)
})

// 响应拦截
service.interceptors.response.use(response => {
  const res = response.data
  if (res?.code === '200') {
    return res.data? res.data : res
  } else {
    message.error(res.message)
    return Promise.reject(res)
  }
}, error => {
  message.error(error.message || '接口调用失败')
  return Promise.reject(error)
})

export default service
