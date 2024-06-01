import App from '@/App.tsx'
import { environment } from 'rabbitx'
import React from 'react'
import ReactDOM from 'react-dom/client'

environment.config({
  devtools: true,
})

console.log(environment.instanceSet)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
