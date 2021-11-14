import axios from 'axios'
import { BACKEND_URL } from './globals'

const instance = axios.create({
  baseURL: BACKEND_URL,
})

export default instance